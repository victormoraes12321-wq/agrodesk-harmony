import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';

import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const Route = createFileRoute('/app/patrimonio/fornecedores')({
  component: FornecedoresPage,
});

interface FormDraft {
  id?: string;
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialDraft = (): FormDraft => ({
  name: '',
  cnpj: '',
  contact: '',
  phone: '',
  email: '',
  isActive: true,
});

function FornecedoresPage() {
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(initialDraft());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setDraft(initialDraft());
    setOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setDraft({
      id: supplier.id,
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      isActive: supplier.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('O nome do fornecedor é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Supplier> = {
        name: draft.name,
        cnpj: draft.cnpj || undefined,
        contact: draft.contact || undefined,
        phone: draft.phone || undefined,
        email: draft.email || undefined,
        isActive: draft.isActive,
      };

      if (draft.id) {
        await updateSupplier(draft.id, payload);
        toast.success('Fornecedor atualizado com sucesso.');
      } else {
        await createSupplier(payload);
        toast.success('Fornecedor criado com sucesso.');
      }
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar o fornecedor.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (supplier: Supplier) => {
    try {
      await updateSupplier(supplier.id, { isActive: !supplier.isActive });
      toast.success(`Fornecedor ${!supplier.isActive ? 'ativado' : 'desativado'} com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    } catch (error) {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSupplier(deleteTarget.id);
      toast.success('Fornecedor excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Erro ao excluir. O fornecedor pode estar associado a algum ativo.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando fornecedores...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Gerencie os parceiros e fornecedores de hardware, software e serviços da empresa."
        actions={
          <Button onClick={handleCreate} className="flex gap-2">
            <Plus className="size-4" /> Novo Fornecedor
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {!suppliers || suppliers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhum fornecedor cadastrado"
                description="Cadastre fornecedores para associá-los a equipamentos e contratos."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Nome</TableHead>
                    <TableHead className="px-6 py-4">CNPJ</TableHead>
                    <TableHead className="px-6 py-4">Contato</TableHead>
                    <TableHead className="px-6 py-4">Telefone/E-mail</TableHead>
                    <TableHead className="px-6 py-4">Status</TableHead>
                    <TableHead className="px-6 py-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((sup) => (
                    <TableRow key={sup.id} className="hover:bg-muted/10">
                      <TableCell className="px-6 py-4 font-semibold">{sup.name}</TableCell>
                      <TableCell className="px-6 py-4 text-sm font-mono">{sup.cnpj || '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-sm">{sup.contact || '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-xs space-y-0.5">
                        {sup.phone && <div className="text-muted-foreground">Tel: {sup.phone}</div>}
                        {sup.email && <div className="text-muted-foreground">Email: {sup.email}</div>}
                        {!sup.phone && !sup.email && <span>-</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant={sup.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer select-none"
                          onClick={() => toggleStatus(sup)}
                        >
                          {sup.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(sup)}>
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(sup)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>
              Defina as informações de cadastro e contato do fornecedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nome / Razão Social *</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Dell Computadores Ltda"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={draft.cnpj}
                onChange={(e) => setDraft((prev) => ({ ...prev, cnpj: e.target.value }))}
                placeholder="Ex: 00.000.000/0000-00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact">Pessoa de Contato</Label>
              <Input
                id="contact"
                value={draft.contact}
                onChange={(e) => setDraft((prev) => ({ ...prev, contact: e.target.value }))}
                placeholder="Ex: João Silva - Vendas"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={draft.phone}
                  onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: dell@fornecedor.com"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                id="isActive"
                checked={draft.isActive}
                onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-muted bg-background size-4 text-primary focus:ring-primary"
              />
              <div>
                <Label htmlFor="isActive" className="font-semibold block cursor-pointer select-none">Ativo para Contratos</Label>
                <span className="text-xs text-muted-foreground">Fornecedores inativos não aparecerão na criação de novos ativos.</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-2">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle>Excluir Fornecedor?</DialogTitle>
            <DialogDescription>
              Esta ação excluirá permanentemente o fornecedor "{deleteTarget?.name}". Se houver ativos ou ordens de serviço atreladas a este fornecedor, a exclusão falhará.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}