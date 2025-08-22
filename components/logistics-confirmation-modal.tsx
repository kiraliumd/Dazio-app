'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// Define a interface para as props do componente
interface LogisticsConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budget: {
    id: string;
    startDate: string;
    endDate: string;
    // Adicione outros campos do orçamento que possam ser úteis
  } | null;
  onConfirm: (logisticsData: { installation: Date; removal: Date }) => void;
}

// Função para extrair data de timestamp UTC corretamente
const extractDateFromTimestamp = (dateString: string | undefined): string => {
  try {
    if (!dateString) {
      return format(new Date(), 'yyyy-MM-dd');
    }

    // Se já estiver no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Para timestamps ISO com timezone, extrair diretamente os componentes
    if (dateString.includes('T') && dateString.includes('+')) {
      // Extrair apenas a parte da data (antes do T)
      const datePart = dateString.split('T')[0];

      // Verificar se a parte da data está no formato correto
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }

    // Para outros formatos, tentar conversão simples
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    const result = format(date, 'yyyy-MM-dd');
    return result;
  } catch (error) {
    return format(new Date(), 'yyyy-MM-dd');
  }
};

// Helper para formatar a hora para o input time
const formatTimeForInput = (isInstallation: boolean = true): string => {
  const hour = isInstallation ? 9 : 18;
  return `${hour.toString().padStart(2, '0')}:00`;
};

// Função para calcular datas de logística baseadas no período do contrato
const calculateLogisticsDates = (startDate: string, endDate: string) => {
  try {
    // Criar datas no fuso horário local para evitar problemas de UTC
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    // Usar as datas exatas do período do contrato
    const installationDate = new Date(start);
    const removalDate = new Date(end);

    // Usar toLocaleDateString para evitar problemas de fuso horário
    const result = {
      installationDate: installationDate.toLocaleDateString('en-CA'), // formato YYYY-MM-DD
      removalDate: removalDate.toLocaleDateString('en-CA'), // formato YYYY-MM-DD
    };

    return result;
  } catch (error) {
    console.error('❌ ERRO em calculateLogisticsDates:', error);
    // Fallback: usar datas próximas
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      installationDate: today.toLocaleDateString('en-CA'),
      removalDate: tomorrow.toLocaleDateString('en-CA'),
    };
  }
};

export function LogisticsConfirmationModal({
  isOpen,
  onOpenChange,
  budget,
  onConfirm,
}: LogisticsConfirmationModalProps) {
  const [installationDate, setInstallationDate] = useState('');
  const [installationTime, setInstallationTime] = useState('');
  const [removalDate, setRemovalDate] = useState('');
  const [removalTime, setRemovalTime] = useState('');

  useEffect(() => {
    if (budget) {
      // Calcular datas de logística baseadas no período do contrato
      const logisticsDates = calculateLogisticsDates(
        budget.startDate,
        budget.endDate
      );

      setInstallationDate(logisticsDates.installationDate);
      setInstallationTime(formatTimeForInput(true));
      setRemovalDate(logisticsDates.removalDate);
      setRemovalTime(formatTimeForInput(false));
    } else {
      // Reset dos campos quando não há budget
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setInstallationDate(today.toLocaleDateString('en-CA'));
      setInstallationTime('09:00');
      setRemovalDate(tomorrow.toLocaleDateString('en-CA'));
      setRemovalTime('18:00');
    }
  }, [budget]);

  const handleConfirm = () => {
    if (
      !installationDate ||
      !installationTime ||
      !removalDate ||
      !removalTime
    ) {
      alert('Por favor, preencha todas as datas e horários.');
      return;
    }

    const installation = new Date(`${installationDate}T${installationTime}`);
    const removal = new Date(`${removalDate}T${removalTime}`);

    if (isNaN(installation.getTime()) || isNaN(removal.getTime())) {
      alert('Por favor, insira datas e horários válidos.');
      return;
    }

    if (installation >= removal) {
      alert(
        'A data/hora de instalação deve ser anterior à data/hora de retirada.'
      );
      return;
    }

    onConfirm({
      installation,
      removal,
    });
    onOpenChange(false); // Fecha o modal após a confirmação
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Eventos de Logística</DialogTitle>
          <DialogDescription>
            Ajuste as datas e horários para a instalação e retirada dos
            equipamentos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Instalação */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Instalação</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="installation-date" className="text-sm">
                  Data
                </Label>
                <Input
                  id="installation-date"
                  type="date"
                  value={installationDate}
                  onChange={e => setInstallationDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installation-time" className="text-sm">
                  Horário
                </Label>
                <Input
                  id="installation-time"
                  type="time"
                  value={installationTime}
                  onChange={e => setInstallationTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Retirada */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Retirada</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="removal-date" className="text-sm">
                  Data
                </Label>
                <Input
                  id="removal-date"
                  type="date"
                  value={removalDate}
                  onChange={e => setRemovalDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="removal-time" className="text-sm">
                  Horário
                </Label>
                <Input
                  id="removal-time"
                  type="time"
                  value={removalTime}
                  onChange={e => setRemovalTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar e Aprovar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
