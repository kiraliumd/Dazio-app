import type { Equipment } from '../supabase';
import { supabase } from '../supabase';
import { getCurrentUserCompanyId } from './client-utils';

export async function getEquipments() {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ getEquipments: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar equipamentos:', error);
    throw error;
  }

  return data || [];
}

export async function getEquipmentById(id: string) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ getEquipmentById: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Erro ao buscar equipamento:', error);
    throw error;
  }

  return data;
}

export async function createEquipment(
  equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ createEquipment: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const equipmentWithCompany = {
    ...equipment,
    company_id: companyId,
  };

  const { data, error } = await supabase
    .from('equipments')
    .insert([equipmentWithCompany])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar equipamento:', error);
    throw error;
  }

  return data;
}

export async function updateEquipment(
  id: string,
  equipment: Partial<Omit<Equipment, 'id' | 'created_at' | 'updated_at'>>
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ updateEquipment: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from('equipments')
    .update(equipment)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar equipamento:', error);
    throw error;
  }

  return data;
}

export async function deleteEquipment(id: string) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ deleteEquipment: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { error } = await supabase
    .from('equipments')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) {
    console.error('Erro ao deletar equipamento:', error);
    throw error;
  }

  return true;
}

export async function searchEquipments(
  searchTerm?: string,
  categoryFilter?: string,
  statusFilter?: string
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ searchEquipments: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  let query = supabase
    .from('equipments')
    .select('*')
    .eq('company_id', companyId);

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  if (categoryFilter && categoryFilter !== 'Todas') {
    query = query.eq('category', categoryFilter);
  }

  if (statusFilter && statusFilter !== 'Todos') {
    query = query.eq('status', statusFilter);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar equipamentos:', error);
    throw error;
  }

  return data || [];
}

// ✅ NOVA FUNÇÃO: Atualizar quantidades dos equipamentos baseado nas locações ativas
export async function updateEquipmentQuantities() {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  try {
    // Buscar todos os equipamentos da empresa
    const { data: equipments, error: equipmentsError } = await supabase
      .from('equipments')
      .select('id, name')
      .eq('company_id', companyId);

    if (equipmentsError) {
      console.error('Erro ao buscar equipamentos:', equipmentsError);
      throw equipmentsError;
    }

    // Para cada equipamento, calcular a quantidade alugada atual
    for (const equipment of equipments) {
      // Buscar locações ativas (Instalação Pendente ou Ativo) que usam este equipamento
      const { data: activeRentals, error: rentalsError } = await supabase
        .from('rental_items')
        .select('quantity')
        .eq('equipment_name', equipment.name)
        .in('rental_id', 
          (await supabase
            .from('rentals')
            .select('id')
            .in('status', ['Instalação Pendente', 'Ativo'])
            .eq('company_id', companyId)).data?.map(r => r.id) || []
        );

      if (rentalsError) {
        console.error(`Erro ao buscar locações para ${equipment.name}:`, rentalsError);
        continue;
      }

      // Calcular quantidade total alugada
      const totalRented = activeRentals?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Atualizar a quantidade alugada do equipamento
      const { error: updateError } = await supabase
        .from('equipments')
        .update({ rented_quantity: totalRented })
        .eq('id', equipment.id)
        .eq('company_id', companyId);

      if (updateError) {
        console.error(`Erro ao atualizar quantidade de ${equipment.name}:`, updateError);
      }
    }

    console.log('✅ Quantidades dos equipamentos atualizadas com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar quantidades dos equipamentos:', error);
    throw error;
  }
}

// Verificar disponibilidade de equipamentos para um período
export async function checkEquipmentAvailability(
  equipmentName: string,
  requiredQuantity: number,
  startDate: string,
  endDate: string,
  excludeRentalId?: string
) {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    return {
      available: false,
      message: 'Usuário não autenticado ou empresa não encontrada',
    };
  }
  // Buscar quantidade total disponível do equipamento
  const { data: equipment, error: equipmentError } = await supabase
    .from('equipments')
    .select('quantity, rented_quantity, maintenance_quantity')
    .eq('name', equipmentName)
    .eq('company_id', companyId)
    .single();

  if (equipmentError || !equipment) {
    return { available: false, message: 'Equipamento não encontrado' };
  }

  const totalAvailable =
    equipment.quantity -
    equipment.rented_quantity -
    equipment.maintenance_quantity;

  // ✅ CORREÇÃO: Buscar locações ativas no período com lógica correta de sobreposição
  // Uma locação está ativa no período se há sobreposição de datas
  // Condição: (start_date <= endDate) AND (end_date >= startDate)
  const { data: activeRentals, error: rentalsError } = await supabase
    .from('rentals')
    .select('id')
    .in('status', ['Instalação Pendente', 'Ativo'])
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .eq('company_id', companyId);

  if (rentalsError) {
    console.error('Erro ao buscar locações ativas:', rentalsError);
    return { available: false, message: 'Erro ao verificar disponibilidade' };
  }

  const rentalIds = activeRentals?.map(r => r.id) || [];

  if (rentalIds.length === 0) {
    return {
      available: totalAvailable >= requiredQuantity,
      availableQuantity: totalAvailable,
      requiredQuantity,
      message:
        totalAvailable >= requiredQuantity
          ? 'Equipamento disponível'
          : `Quantidade insuficiente. Disponível: ${totalAvailable}, Necessário: ${requiredQuantity}`,
    };
  }

  // Buscar quantidade já alugada no período
  let query = supabase
    .from('rental_items')
    .select('quantity')
    .eq('equipment_name', equipmentName)
    .in('rental_id', rentalIds);

  if (excludeRentalId) {
    query = query.neq('rental_id', excludeRentalId);
  }

  const { data: rentedItems, error: rentedError } = await query;

  if (rentedError) {
    console.error('Erro ao verificar equipamentos alugados:', rentedError);
    return { available: false, message: 'Erro ao verificar disponibilidade' };
  }

  const currentlyRented =
    rentedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const actuallyAvailable = totalAvailable - currentlyRented;

  // ✅ CORREÇÃO: Incluir informações sobre conflitos de agenda
  const conflictingRentals = activeRentals?.map(rental => ({
    rentalId: rental.id,
    startDate: (rental as any).start_date,
    endDate: (rental as any).end_date,
    status: (rental as any).status
  })) || [];

  return {
    available: actuallyAvailable >= requiredQuantity,
    availableQuantity: actuallyAvailable,
    requiredQuantity,
    conflictingRentals,
    message:
      actuallyAvailable >= requiredQuantity
        ? 'Equipamento disponível'
        : `Quantidade insuficiente. Disponível: ${actuallyAvailable}, Necessário: ${requiredQuantity}`,
  };
}

// Buscar equipamentos com informações de disponibilidade
export async function getEquipmentsWithAvailability() {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar equipamentos:', error);
    throw error;
  }

  return data || [];
}

// ✅ NOVA FUNÇÃO: Verificar conflitos de agenda para um equipamento específico
export async function checkAgendaConflicts(
  equipmentName: string,
  startDate: string,
  endDate: string,
  excludeRentalId?: string,
  requestedQuantity?: number
) {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  try {
    // 1. Buscar informações do equipamento (quantidade total disponível)
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipments')
      .select('quantity, rented_quantity, maintenance_quantity')
      .eq('name', equipmentName)
      .eq('company_id', companyId)
      .single();

    if (equipmentError || !equipment) {
      throw new Error(`Equipamento ${equipmentName} não encontrado`);
    }

    const totalAvailable = equipment.quantity - equipment.rented_quantity - equipment.maintenance_quantity;

    // 2. Buscar locações ativas no período que usam este equipamento
    const { data: activeRentals, error: rentalsError } = await supabase
      .from('rentals')
      .select(`
        id,
        client_name,
        start_date,
        end_date,
        status,
        rental_items!inner(quantity)
      `)
      .in('status', ['Instalação Pendente', 'Ativo'])
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .eq('company_id', companyId)
      .eq('rental_items.equipment_name', equipmentName);

    if (rentalsError) {
      console.error('Erro ao buscar conflitos de agenda:', rentalsError);
      throw rentalsError;
    }

    // 3. Filtrar por equipamento específico e calcular quantidade total
    const conflicts = activeRentals?.map(rental => ({
      rentalId: rental.id,
      clientName: rental.client_name,
      startDate: rental.start_date,
      endDate: rental.end_date,
      status: rental.status,
      quantity: rental.rental_items?.[0]?.quantity || 0
    })) || [];

    // 4. Excluir a locação atual se estiver editando
    const filteredConflicts = excludeRentalId 
      ? conflicts.filter(conflict => conflict.rentalId !== excludeRentalId)
      : conflicts;

    const totalConflictingQuantity = filteredConflicts.reduce((sum, conflict) => sum + conflict.quantity, 0);
    
    // 5. Calcular se há conflito baseado na quantidade disponível
    const hasConflicts = filteredConflicts.length > 0;
    const isQuantityAvailable = requestedQuantity ? (totalAvailable - totalConflictingQuantity) >= requestedQuantity : true;
    const availableQuantity = totalAvailable - totalConflictingQuantity;

    return {
      hasConflicts,
      conflicts: filteredConflicts,
      totalConflictingQuantity,
      totalAvailable,
      availableQuantity,
      isQuantityAvailable,
      requestedQuantity: requestedQuantity || 0,
      message: requestedQuantity 
        ? isQuantityAvailable 
          ? `Equipamento disponível. Disponível: ${availableQuantity}, Solicitado: ${requestedQuantity}`
          : `Quantidade insuficiente. Disponível: ${availableQuantity}, Solicitado: ${requestedQuantity}`
        : `Equipamento disponível. Disponível: ${availableQuantity}`
    };
  } catch (error) {
    console.error('Erro ao verificar conflitos de agenda:', error);
    throw error;
  }
}
