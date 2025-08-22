import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  contas: { id: string; name: string }[];
  categorias: { id: string; name: string }[];
}

export function ExpenseModal({
  open,
  onClose,
  onSubmit,
  contas,
  categorias,
}: ExpenseModalProps) {
  const [tab, setTab] = useState<'pago' | 'apagar'>('pago');
  const [form, setForm] = useState<any>({
    data: '',
    conta: '',
    descricao: '',
    categoria: '',
    valor: '',
    repeticao: false,
    tipoRepeticao: 'mensal',
    quantidade: 1,
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, tipo: tab });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={v => setTab(v as 'pago' | 'apagar')}
          className="mb-4"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="pago">Pago</TabsTrigger>
            <TabsTrigger value="apagar">A pagar</TabsTrigger>
          </TabsList>
          <TabsContent value="pago">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Data em que foi pago</Label>
                <Input
                  type="date"
                  required
                  value={form.data}
                  onChange={e => handleChange('data', e.target.value)}
                />
              </div>
              <div>
                <Label>Conta</Label>
                <Select
                  value={form.conta}
                  onValueChange={v => handleChange('conta', v)}
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
                <Label>Descrição</Label>
                <Input
                  required
                  value={form.descricao}
                  onChange={e => handleChange('descricao', e.target.value)}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={v => handleChange('categoria', v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
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
              <DialogFooter>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="apagar">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Data de vencimento</Label>
                <Input
                  type="date"
                  required
                  value={form.data}
                  onChange={e => handleChange('data', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.repeticao}
                  onCheckedChange={v => handleChange('repeticao', v)}
                  id="repeticao"
                />
                <Label htmlFor="repeticao">Repetição</Label>
              </div>
              {form.repeticao && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Tipo de repetição</Label>
                    <Select
                      value={form.tipoRepeticao}
                      onValueChange={v => handleChange('tipoRepeticao', v)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Quantidade de vezes</Label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={form.quantidade}
                      onChange={e => handleChange('quantidade', e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Conta</Label>
                <Select
                  value={form.conta}
                  onValueChange={v => handleChange('conta', v)}
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
                <Label>Descrição</Label>
                <Input
                  required
                  value={form.descricao}
                  onChange={e => handleChange('descricao', e.target.value)}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={v => handleChange('categoria', v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
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
              <DialogFooter>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
