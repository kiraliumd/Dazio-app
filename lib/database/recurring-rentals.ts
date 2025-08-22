import { supabase } from '../supabase';
import type {
  Rental as DBRental,
  RecurringRentalOccurrence as DBRecurringOccurrence,
} from '../supabase';
import type {
  Rental,
  RecurringRentalOccurrence,
} from '../utils/data-transformers';
import { getCurrentUserCompanyId } from './client-utils';

// Buscar locações recorrentes
export async function getRecurringRentals(limit?: number) {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    let query = supabase
      .from('rentals')
      .select(
        `
        *,
        rental_items (*)
      `
      )
      .eq('is_recurring', true)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      // Verificar se é erro de coluna não encontrada
      if (error.code === '42703' && error.message.includes('is_recurring')) {
        throw new Error(
          'COLUMNS_NOT_FOUND: As colunas de recorrência não foram encontradas. Execute o script SQL primeiro.'
        );
      }
      console.error('Erro ao buscar locações recorrentes:', error);
      throw error;
    }

    // Buscar ocorrências separadamente para cada locação
    if (data) {
      const rentalsWithOccurrences = await Promise.all(
        data.map(async rental => {
          try {
            const { data: occurrences } = await supabase
              .from('recurring_rental_occurrences')
              .select('*')
              .eq('parent_rental_id', rental.id)
              .order('occurrence_number', { ascending: true });

            return {
              ...rental,
              recurring_rental_occurrences: occurrences || [],
            };
          } catch (occurrenceError: any) {
            // Se a tabela de ocorrências não existir, retornar sem ocorrências
            if (occurrenceError.code === '42P01') {
              console.warn(
                'Tabela recurring_rental_occurrences não encontrada'
              );
              return {
                ...rental,
                recurring_rental_occurrences: [],
              };
            }
            throw occurrenceError;
          }
        })
      );

      return rentalsWithOccurrences;
    }

    return data || [];
  } catch (error: any) {
    if (error.message?.includes('COLUMNS_NOT_FOUND')) {
      throw error;
    }
    console.error('Erro ao buscar locações recorrentes:', error);
    throw error;
  }
}

// Buscar ocorrências de uma locação recorrente
export async function getRecurringOccurrences(parentRentalId: string) {
  const { data, error } = await supabase
    .from('recurring_rental_occurrences')
    .select('*')
    .eq('parent_rental_id', parentRentalId)
    .order('occurrence_number', { ascending: true });

  if (error) {
    console.error('Erro ao buscar ocorrências:', error);
    throw error;
  }

  return data || [];
}

// Criar locação recorrente
export async function createRecurringRental(
  rental: Omit<Rental, 'id'> & { id?: string },
  items: any[],
  logisticsData: { installation: Date; removal: Date }
) {
  // Primeiro, criar a locação principal
  const rentalData: Partial<DBRental> = {
    client_id: rental.clientId,
    client_name: rental.clientName,
    start_date: rental.startDate,
    end_date: rental.endDate,
    installation_time: logisticsData.installation.toTimeString().slice(0, 5),
    removal_time: logisticsData.removal.toTimeString().slice(0, 5),
    installation_location: rental.installationLocation,
    total_value: rental.totalValue,
    discount: rental.discount,
    final_value: rental.finalValue,
    status: rental.status,
    observations: rental.observations,
    budget_id: rental.budgetId,

    // Campos de recorrência
    is_recurring: rental.isRecurring || false,
    recurrence_type: rental.recurrenceType || undefined,
    recurrence_interval: rental.recurrenceInterval || 1,
    recurrence_end_date: rental.recurrenceEndDate || null,
    recurrence_status: 'active',
    parent_rental_id: null,
    next_occurrence_date: null,
  };

  const { data: rentalResult, error: rentalError } = await supabase
    .from('rentals')
    .insert(rentalData)
    .select()
    .single();

  if (rentalError) {
    console.error('Erro ao criar locação:', rentalError);
    throw rentalError;
  }

  // Criar itens da locação
  if (items.length > 0) {
    const rentalItems = items.map(item => ({
      rental_id: rentalResult.id,
      equipment_name: item.equipmentName,
      quantity: item.quantity,
      daily_rate: item.dailyRate,
      days: item.days,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from('rental_items')
      .insert(rentalItems);

    if (itemsError) {
      console.error('Erro ao criar itens da locação:', itemsError);
      throw itemsError;
    }
  }

  // Se for recorrente, gerar ocorrências futuras
  if (rental.isRecurring && rental.recurrenceType) {
    await generateFutureOccurrences(rentalResult.id);
  }

  return rentalResult;
}

// Gerar ocorrências futuras
export async function generateFutureOccurrences(
  rentalId: string,
  maxOccurrences: number = 12
) {
  // Chamar a função SQL para gerar ocorrências
  const { error } = await supabase.rpc('generate_future_occurrences', {
    rental_id: rentalId,
    max_occurrences: maxOccurrences,
  });

  if (error) {
    console.error('Erro ao gerar ocorrências futuras:', error);
    throw error;
  }
}

// Pausar recorrência
export async function pauseRecurrence(rentalId: string) {
  const { error } = await supabase
    .from('rentals')
    .update({ recurrence_status: 'paused' })
    .eq('id', rentalId);

  if (error) {
    console.error('Erro ao pausar recorrência:', error);
    throw error;
  }
}

// Retomar recorrência
export async function resumeRecurrence(rentalId: string) {
  const { error } = await supabase
    .from('rentals')
    .update({ recurrence_status: 'active' })
    .eq('id', rentalId);

  if (error) {
    console.error('Erro ao retomar recorrência:', error);
    throw error;
  }
}

// Cancelar recorrência
export async function cancelRecurrence(rentalId: string) {
  const { error } = await supabase
    .from('rentals')
    .update({ recurrence_status: 'cancelled' })
    .eq('id', rentalId);

  if (error) {
    console.error('Erro ao cancelar recorrência:', error);
    throw error;
  }
}

// Atualizar ocorrência específica
export async function updateOccurrence(
  occurrenceId: string,
  updates: {
    installationDate?: string;
    removalDate?: string;
    status?: 'Instalação Pendente' | 'Ativo' | 'Concluído';
  }
) {
  const { error } = await supabase
    .from('recurring_rental_occurrences')
    .update(updates)
    .eq('id', occurrenceId);

  if (error) {
    console.error('Erro ao atualizar ocorrência:', error);
    throw error;
  }
}

// Buscar próximas ocorrências
export async function getUpcomingOccurrences(limit: number = 10) {
  const { data, error } = await supabase
    .from('recurring_rental_occurrences')
    .select(
      `
      *,
      rentals!inner (
        id,
        client_name,
        installation_location,
        recurrence_type,
        recurrence_interval
      )
    `
    )
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar próximas ocorrências:', error);
    throw error;
  }

  return data || [];
}

// Buscar estatísticas de recorrência
export async function getRecurrenceStats() {
  const { data, error } = await supabase
    .from('rentals')
    .select('recurrence_status, recurrence_type')
    .eq('is_recurring', true);

  if (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    active: data?.filter(r => r.recurrence_status === 'active').length || 0,
    paused: data?.filter(r => r.recurrence_status === 'paused').length || 0,
    cancelled:
      data?.filter(r => r.recurrence_status === 'cancelled').length || 0,
    monthly: data?.filter(r => r.recurrence_type === 'monthly').length || 0,
    weekly: data?.filter(r => r.recurrence_type === 'weekly').length || 0,
    daily: data?.filter(r => r.recurrence_type === 'daily').length || 0,
    yearly: data?.filter(r => r.recurrence_type === 'yearly').length || 0,
  };

  return stats;
}
