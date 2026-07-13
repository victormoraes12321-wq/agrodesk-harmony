import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

import { getAssetTypes, createAssetType, updateAssetType, deleteAssetType, type AssetType } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const Route = createFileRoute('/app/patrimonio/tipos')({
  component: TiposAtivosPage,
});

interface FormDraft {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
}

const initialDraft = (): FormDraft => ({
  name: '',
  description: '',
  isActive: true,
});

function TiposAtivosPage() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['asset-types'], queryFn: getAssetTypes });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(initialDraft());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssetType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setDraft(initialDraft());
    setOpen(true);
  };

  const handleEdit = (type: AssetType) => {
    setDraft({
      id: type.id,
      name: type.name,
      description: type.description || '',
      isActive: type.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('O nome do tipo de ativo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      if (draft.id) {
        await updateAssetType(draft.id, {
          name: draft.name,
          description: draft.description,
          isActive: draft.isActive,
        });
        toast.success('Tipo de ativo atualizado com sucesso.');
      } else {
        await createAssetType({
          name: draft.name,
          description: draft.description,
          isActive: draft.isActive,
        });
        toast.success('Tipo de ativo criado com sucesso.');
      }
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar o tipo de ativo.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (type: AssetType) => {
    try {
      await updateAssetType(type.id, { isActive: !type.isActive });
      toast.success(`Tipo de ativo ${!type.isActive ? 'ativado' : 'desativado'} com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
    } catch (error) {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAssetType(deleteTarget.id);
      toast.success('Tipo de ativo excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Erro ao excluir. O tipo de ativo pode estar associado a algum equipamento.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando tipos de ativos...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Ativos"
        description="Gerencie as categorias estruturais dos ativos da empresa (ex: Notebooks, Servidores, Impressoras)."
        actions={
          <Button onClick={handleCreate} className="flex gap-2">
            <Plus className="size-4" /> Novo Tipo
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {!types || types.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhum tipo de ativo cadastrado"
                description="Cadastre tipos de ativos para organizar os equipamentos do inventário."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Nome</TableHead>
                    <TableHead className="px-6 py-4">Descrição</TableHead>
                    <TableHead className="px-6 py-4">Status</TableHead>
                    <TableHead className="px-6 py-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id} className="hover:bg-muted/10">
                      <TableCell className="px-6 py-4 font-semibold">{type.name}</TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground max-w-md truncate">
                        {type.description || '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant={type.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer select-none"
                          onClick={() => toggleStatus(type)}
                        >
                          {type.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(type)}>
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(type)}>
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
            <DialogTitle>{draft.id ? 'Editar Tipo de Ativo' : 'Novo Tipo de Ativo'}</DialogTitle>
            <DialogDescription>
              Defina o nome e especificações da categoria para agrupar patrimônios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Notebooks, Ar Condicionados, Tratores"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes adicionais sobre este tipo de ativo..."
                rows={3}
              />
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
                <Label htmlFor="isActive" className="font-semibold block cursor-pointer select-none">Ativo para Cadastro</Label>
                <span className="text-xs text-muted-foreground">Tipos inativos não aparecerão na criação de novos ativos.</span>
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
            <DialogTitle>Excluir Tipo de Ativo?</DialogTitle>
            <DialogDescription>
              Esta ação excluirá permanentemente a categoria "{deleteTarget?.name}". Se houver ativos associados a este tipo, a exclusão falhará.
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