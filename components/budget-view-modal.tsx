'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  User,
  MapPin,
  Calendar,
  Package,
  Calculator,
  Repeat,
  Eye,
  Download,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Budget } from '@/lib/utils/data-transformers';

interface BudgetViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onGeneratePDF?: (budget: Budget) => void;
}

export function BudgetViewModal({
  open,
  onOpenChange,
  budget,
  onEdit,
  onGeneratePDF,
}: BudgetViewModalProps) {
  // Função para formatar datas
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  // Calcular dias reais da locação
  const calculateRealDays = () => {
    if (budget.startDate && budget.endDate) {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para obter badge de status
  const getStatusBadge = (status: Budget['status']) => {
    switch (status) {
      case 'Pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'Aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'Rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[800px] !min-w-[800px] !max-w-[800px] w-[800px] min-w-[800px] max-w-[800px] overflow-y-auto"
      >
        <SheetHeader className="pb-6 pr-12">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visualizar Orçamento
          </SheetTitle>
          <SheetDescription>
            Detalhes completos do orçamento #{budget.number}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pr-2">
          {/* Cabeçalho com informações principais */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Orçamento #{budget.number}
                </CardTitle>
                {getStatusBadge(budget.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span className="text-sm">{budget.clientName}</span>
                  </div>

                  {budget.installationLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Local:</span>
                      <span className="text-sm">{budget.installationLocation}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Período:</span>
                    <span className="text-sm">
                      {budget.startDate && budget.endDate
                        ? `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`
                        : 'Datas não definidas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duração:</span>
                    <span className="text-sm">{calculateRealDays()} dia(s)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(budget.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Desconto:</span>
                    <span className="text-lg font-bold text-green-600">
                      -{formatCurrency(budget.discount)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(budget.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações de recorrência */}
              {budget.isRecurring && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Repeat className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">Configuração de Recorrência</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <span className="ml-2 capitalize">
                        {budget.recurrenceType === 'weekly' && 'Semanal'}
                        {budget.recurrenceType === 'monthly' && 'Mensal'}
                        {budget.recurrenceType === 'yearly' && 'Anual'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Intervalo:</span>
                      <span className="ml-2">
                        {budget.recurrenceInterval} {budget.recurrenceType === 'weekly' ? 'semana(s)' : 
                         budget.recurrenceType === 'monthly' ? 'mês(es)' : 'ano(s)'}
                      </span>
                    </div>
                    {budget.recurrenceEndDate && (
                      <div>
                        <span className="font-medium">Até:</span>
                        <span className="ml-2">{formatDate(budget.recurrenceEndDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {budget.observations && (
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <span className="font-medium">Observações:</span>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {budget.observations}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de itens */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budget.items && budget.items.length > 0 ? (
                <div className="space-y-3">
                  {budget.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.equipmentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.dailyRate)}/dia × {item.days} dia(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum item adicionado ao orçamento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de auditoria */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Criado em:</span>
                <span>{formatDate(budget.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            
            {budget.status === 'Pendente' && onEdit && (
              <Button
                variant="outline"
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  onEdit(budget);
                  onOpenChange(false); // Fechar modal ao editar
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}

            {onGeneratePDF && (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => onGeneratePDF(budget)}
              >
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
