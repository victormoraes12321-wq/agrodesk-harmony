import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getAssetMovements, createAssetMovement, getAssets, type AssetMovement } from '@/services/patrimonio-api';
import { useApp } from '@/lib/store';
import { formatBranchName } from '@/lib/helpdesk';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const Route = createFileRoute('/app/patrimonio/movimentacoes')({
  component: MovimentacoesPage,
});

interface FormDraft {
  assetId: string;
  type: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromBranchId: string;
  toBranchId: string;
  fromUserId: string;
  toUserId: string;
  date: string;
  reason: string;
  parentId: string;
}

const initialDraft = (): FormDraft => ({
  assetId: '',
  type: 'TRANSFERENCIA',
  fromDepartmentId: '',
  toDepartmentId: '',
  fromBranchId: '',
  toBranchId: '',
  fromUserId: '',
  toUserId: '',
  date: new Date().toISOString().split('T')[0],
  reason: '',
  parentId: '',
});

const movementTypeLabels: Record<string, string> = {
  TRANSFERENCIA: 'Transferência',
  EMPRESTIMO: 'Empréstimo',
  DEVOLUCAO: 'Devolução',
};

const statusLabel: Record<string, string> = {
  EM_USO: 'Em Uso',
  ESTOQUE: 'Em Estoque',
  MANUTENCAO: 'Em Manutenção',
  BAIXADO: 'Baixado',
};

const renderLocation = (
  branch: any,
  dept: any,
  user: any,
  isDestination: boolean,
  type: string
) => {
  if (isDestination && type === 'DEVOLUCAO') {
    return <span className="text-muted-foreground italic text-xs">Estoque (Devolvido)</span>;
  }

  const locParts: string[] = [];
  if (branch?.name) {
    locParts.push(formatBranchName(branch.name));
  }
  if (dept?.name) {
    locParts.push(dept.name);
  }

  return (
    <div className="space-y-0.5">
      {user?.name ? (
        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{user.name}</div>
      ) : null}
      {locParts.length > 0 ? (
        <div className="text-[10px] text-muted-foreground font-medium">
          {locParts.join(' ➔ ')}
        </div>
      ) : null}
      {!user?.name && locParts.length === 0 ? (
        <span className="text-muted-foreground text-xs">-</span>
      ) : null}
    </div>
  );
};

const movementTypeBadge = (type: string) => {
  switch (type) {
    case 'TRANSFERENCIA':
      return 'default';
    case 'EMPRESTIMO':
      return 'outline';
    default:
      return 'secondary';
  }
};

function MovimentacoesPage() {
  const queryClient = useQueryClient();
  const { branches, departments, users } = useApp();

  const { data: movs, isLoading } = useQuery({ queryKey: ['asset-movements'], queryFn: getAssetMovements });
  const { data: assets } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets() });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(initialDraft());
  const [saving, setSaving] = useState(false);

  const handleOpenDialog = () => {
    setDraft(initialDraft());
    setOpen(true);
  };

  const handleAssetChange = (assetId: string) => {
    const selectedAsset = assets?.find(a => a.id === assetId);
    if (selectedAsset) {
      setDraft(prev => ({
        ...prev,
        assetId,
        fromBranchId: selectedAsset.branchId || '',
        fromDepartmentId: selectedAsset.departmentId || '',
        fromUserId: selectedAsset.userId || '',
        parentId: selectedAsset.parentId || '',
      }));
    } else {
      setDraft(prev => ({
        ...prev,
        assetId,
        fromBranchId: '',
        fromDepartmentId: '',
        fromUserId: '',
        parentId: '',
      }));
    }
  };

  const handleParentChange = (parentId: string) => {
    const parentAsset = assets?.find(a => a.id === parentId);
    if (parentAsset) {
      setDraft(prev => ({
        ...prev,
        parentId,
        toBranchId: parentAsset.branchId || '',
        toDepartmentId: parentAsset.departmentId || '',
        toUserId: parentAsset.userId || '',
      }));
    } else {
      setDraft(prev => ({
        ...prev,
        parentId,
      }));
    }
  };

  const handleSave = async () => {
    if (!draft.assetId) {
      toast.error('Selecione um ativo.');
      return;
    }
    if (draft.type !== 'DEVOLUCAO' && !draft.toBranchId && !draft.toDepartmentId && !draft.toUserId) {
      toast.error('Informe pelo menos um destino (Local, Setor ou Usuário) para a movimentação.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        assetId: draft.assetId,
        type: draft.type,
        fromDepartmentId: draft.fromDepartmentId || undefined,
        toDepartmentId: draft.type === 'DEVOLUCAO' ? undefined : (draft.toDepartmentId || undefined),
        fromBranchId: draft.fromBranchId || undefined,
        toBranchId: draft.type === 'DEVOLUCAO' ? undefined : (draft.toBranchId || undefined),
        fromUserId: draft.fromUserId || undefined,
        toUserId: draft.type === 'DEVOLUCAO' ? undefined : (draft.toUserId || undefined),
        date: new Date(draft.date).toISOString(),
        reason: draft.reason || undefined,
        parentId: draft.type === 'DEVOLUCAO' ? null : (draft.parentId || undefined),
      };

      await createAssetMovement(payload as any);
      toast.success('Movimentação registrada com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['asset-movements'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-dashboard'] });
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao registrar movimentação.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando movimentações...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações de Ativos"
        description="Acompanhe o histórico de empréstimos, transferências e devoluções de ativos."
        actions={
          <Button onClick={handleOpenDialog} className="flex gap-2">
            <Plus className="size-4" /> Registrar Movimentação
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {!movs || movs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhuma movimentação registrada"
                description="Registre movimentações para acompanhar onde estão alocados os patrimônios."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Data</TableHead>
                    <TableHead className="px-6 py-4">Ativo</TableHead>
                    <TableHead className="px-6 py-4">Tipo</TableHead>
                    <TableHead className="px-6 py-4">Origem</TableHead>
                    <TableHead className="px-6 py-4">Destino</TableHead>
                    <TableHead className="px-6 py-4">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movs.map((mov) => (
                    <TableRow key={mov.id} className="hover:bg-muted/10">
                      <TableCell className="px-6 py-4 text-xs">
                        {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono font-bold text-xs text-primary mr-2">{mov.asset?.code}</span>
                        <span className="text-sm font-semibold">{mov.asset?.name}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={movementTypeBadge(mov.type)}>
                          {movementTypeLabels[mov.type] || mov.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {renderLocation(mov.fromBranch, mov.fromDepartment, mov.fromUser, false, mov.type)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {renderLocation(mov.toBranch, mov.toDepartment, mov.toUser, true, mov.type)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {mov.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Movement Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              Selecione o ativo e insira as informações de destino e atribuição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="asset">Ativo Patrimonial *</Label>
              <select
                id="asset"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
              >
                <option value="">Selecione um ativo...</option>
                {assets?.filter(a => a.status !== 'BAIXADO').map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({statusLabel[a.status]})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mov-type">Tipo de Operação *</Label>
              <select
                id="mov-type"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="TRANSFERENCIA">Transferência de Local/Setor</option>
                <option value="EMPRESTIMO">Empréstimo (Atribuição a Usuário)</option>
                <option value="DEVOLUCAO">Devolução para Estoque</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mov-date">Data da Operação</Label>
              <Input
                id="mov-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Source Information (Disabled) */}
            {draft.assetId && (
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1 text-xs">
                <span className="font-semibold block mb-1">Localização Atual do Ativo:</span>
                <div><strong>Local:</strong> {branches.find(b => b.id === draft.fromBranchId)?.name || 'Sem local'}</div>
                <div><strong>Setor:</strong> {departments.find(d => d.id === draft.fromDepartmentId)?.name || 'Sem setor'}</div>
                <div><strong>Usuário:</strong> {users.find(u => u.id === draft.fromUserId)?.name || 'Sem responsável'}</div>
              </div>
            )}

            {/* Destination inputs - hidden on DEVOLUCAO since it resets to ESTOQUE */}
            {draft.type !== 'DEVOLUCAO' && (
              <fieldset className="border rounded-lg p-3 space-y-3">
                <legend className="text-xs font-semibold px-2">Destino / Atribuição</legend>

                <div className="space-y-1">
                  <Label htmlFor="to-parent">Vincular a Equipamento Pai (Auto-preenche local)</Label>
                  <select
                    id="to-parent"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draft.parentId}
                    onChange={(e) => handleParentChange(e.target.value)}
                  >
                    <option value="">Nenhum (Manter Independente)</option>
                    {assets?.filter(a => a.id !== draft.assetId && a.status !== 'BAIXADO').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} {a.hostname ? `(${a.hostname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="to-branch">Novo Local / Filial</Label>
                  <select
                    id="to-branch"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draft.toBranchId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, toBranchId: e.target.value }))}
                  >
                    <option value="">Selecione local...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {formatBranchName(b.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="to-dept">Novo Setor</Label>
                  <select
                    id="to-dept"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draft.toDepartmentId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, toDepartmentId: e.target.value }))}
                  >
                    <option value="">Selecione setor...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="to-user">Novo Usuário Custodiante</Label>
                  <select
                    id="to-user"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draft.toUserId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, toUserId: e.target.value }))}
                  >
                    <option value="">Selecione usuário...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
            )}

            <div className="space-y-1">
              <Label htmlFor="reason">Motivo da Movimentação</Label>
              <Textarea
                id="reason"
                value={draft.reason}
                onChange={(e) => setDraft((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Usuário mudou de filial ou foi contratado..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}