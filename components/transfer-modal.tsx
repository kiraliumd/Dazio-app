import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransferFormData) => void;
  contas: { id: string; name: string }[];
}

interface TransferFormData {
  data: string;
  origem: string;
  destino: string;
  valor: string;
  descricao: string;
}

export function TransferModal({
  open,
  onClose,
  onSubmit,
  contas,
}: TransferModalProps) {
  const [form, setForm] = useState<TransferFormData>({
    data: '',
    origem: '',
    destino: '',
    valor: '',
    descricao: '',
  });
  const [error, setError] = useState('');

  const handleChange = (field: keyof TransferFormData, value: string) => {
    setForm((prev: TransferFormData) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.origem === form.destino) {
      setError('A conta de origem e destino devem ser diferentes.');
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Transferência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data da transferência</Label>
            <Input
              type="date"
              required
              value={form.data}
              onChange={e => handleChange('data', e.target.value)}
            />
          </div>
          <div>
            <Label>Conta de origem</Label>
            <Select
              value={form.origem}
              onValueChange={v => handleChange('origem', v)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Conta de destino</Label>
            <Select
              value={form.destino}
              onValueChange={v => handleChange('destino', v)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              required
              value={form.valor}
              onChange={e => handleChange('valor', e.target.value)}
            />
          </div>
          <div>
            <Label>
              Descrição{' '}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              value={form.descricao}
              onChange={e => handleChange('descricao', e.target.value)}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="submit">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
