import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, Filter, ShieldAlert, Calendar, ArrowRightLeft, Wrench } from 'lucide-react';

import { getAssets, getAsset, createAsset, updateAsset, deleteAsset, getAssetTypes, getSuppliers, type Asset } from '@/services/patrimonio-api';
import { useApp } from '@/lib/store';
import { formatBranchName } from '@/lib/helpdesk';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const Route = createFileRoute('/app/patrimonio/ativos')({
  component: AtivosPage,
});

interface FormDraft {
  id?: string;
  name: string;
  description: string;
  serialNumber: string;
  acquisitionDate: string;
  value: string;
  status: string;
  supplierId: string;
  assetTypeId: string;
  departmentId: string;
  branchId: string;
  userId: string;
  hostname: string;
  parentId: string;
}

const initialDraft = (defaultTypeId = '', defaultBranchId = '', defaultDeptId = ''): FormDraft => ({
  name: '',
  description: '',
  serialNumber: '',
  acquisitionDate: new Date().toISOString().split('T')[0],
  value: '',
  status: 'ESTOQUE',
  supplierId: '',
  assetTypeId: defaultTypeId,
  departmentId: defaultDeptId,
  branchId: defaultBranchId,
  userId: '',
  hostname: '',
  parentId: '',
});

const statusLabel: Record<string, string> = {
  ESTOQUE: 'Em Estoque',
  EM_USO: 'Em Uso',
  MANUTENCAO: 'Manutenção',
  BAIXADO: 'Baixado',
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'EM_USO':
      return 'default'; // primary / green
    case 'ESTOQUE':
      return 'secondary'; // gray / neutral
    case 'MANUTENCAO':
      return 'outline'; // warning
    default:
      return 'destructive'; // red / baixado
  }
};

function AtivosPage() {
  const queryClient = useQueryClient();
  const { branches, departments, users } = useApp();

  const { data: assets, isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets() });
  const { data: assetTypes } = useQuery({ queryKey: ['asset-types'], queryFn: getAssetTypes });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(initialDraft());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail Drawer state & queries
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'components' | 'timeline'>('geral');

  const { data: assetDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['asset-detail', detailAssetId],
    queryFn: () => getAsset(detailAssetId!).then(res => res),
    enabled: !!detailAssetId,
  });

  const timelineEvents = useMemo(() => {
    if (!assetDetail) return [];
    const events: { date: Date; type: string; title: string; desc: string; icon: any; color: string }[] = [];

    // 1. Acquisition Date
    if (assetDetail.acquisitionDate) {
      events.push({
        date: new Date(assetDetail.acquisitionDate),
        type: 'ACQUISITION',
        title: 'Aquisição do Ativo',
        desc: `Adquirido por R$ ${assetDetail.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} ${assetDetail.supplier ? `do fornecedor ${assetDetail.supplier.name}` : ''}.`,
        icon: Calendar,
        color: 'bg-green-500 text-white',
      });
    }

    // 2. Movements
    if (assetDetail.movements) {
      assetDetail.movements.forEach((m: any) => {
        const fromText = m.fromBranch ? `${formatBranchName(m.fromBranch.name)}` : '';
        const toText = m.toBranch ? `${formatBranchName(m.toBranch.name)}` : '';
        const fromDept = m.fromDepartment ? ` (${m.fromDepartment.name})` : '';
        const toDept = m.toDepartment ? ` (${m.toDepartment.name})` : '';
        const fromUser = m.fromUser ? ` - Resp: ${m.fromUser.name}` : '';
        const toUser = m.toUser ? ` - Resp: ${m.toUser.name}` : '';

        let desc = '';
        if (m.type === 'TRANSFERENCIA') {
          desc = `Transferido de [${fromText}${fromDept}${fromUser}] para [${toText}${toDept}${toUser}].`;
        } else if (m.type === 'DEVOLUCAO') {
          desc = `Retornado ao Estoque (Devolução).`;
        } else if (m.type === 'EMPRESTIMO') {
          desc = `Emprestado para ${m.toUser?.name || 'Usuário'}.`;
        } else {
          desc = `Movimentação registrada de [${fromText}${fromDept}] para [${toText}${toDept}].`;
        }

        if (m.reason) desc += ` Motivo: ${m.reason}`;

        events.push({
          date: new Date(m.date),
          type: 'MOVEMENT',
          title: `Movimentação: ${m.type === 'TRANSFERENCIA' ? 'Transferência' : m.type === 'DEVOLUCAO' ? 'Devolução' : m.type === 'EMPRESTIMO' ? 'Empréstimo' : m.type}`,
          desc,
          icon: ArrowRightLeft,
          color: 'bg-blue-500 text-white',
        });
      });
    }

    // 3. Maintenances
    if (assetDetail.maintenances) {
      assetDetail.maintenances.forEach((m: any) => {
        let desc = `${m.description} | Custo: R$ ${m.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`;
        if (m.provider) desc += ` | Prestador: ${m.provider}`;
        if (m.nextMaintenanceDate) {
          desc += ` | Próxima revisão: ${new Date(m.nextMaintenanceDate).toLocaleDateString('pt-BR')}`;
        }

        events.push({
          date: new Date(m.date),
          type: 'MAINTENANCE',
          title: `Manutenção: ${m.type}`,
          desc,
          icon: Wrench,
          color: 'bg-amber-500 text-white',
        });
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [assetDetail]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('status') || 'ALL';
    }
    return 'ALL';
  });
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      const matchesSearch =
        searchQuery.length === 0 ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (asset.hostname && asset.hostname.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || asset.assetTypeId === typeFilter;
      const matchesBranch = branchFilter === 'ALL' || asset.branchId === branchFilter;

      return matchesSearch && matchesStatus && matchesType && matchesBranch;
    });
  }, [assets, searchQuery, statusFilter, typeFilter, branchFilter]);

  const handleCreate = () => {
    const defaultTypeId = assetTypes?.[0]?.id || '';
    const defaultBranchId = branches?.[0]?.id || '';
    const defaultDeptId = departments?.[0]?.id || '';
    setDraft(initialDraft(defaultTypeId, defaultBranchId, defaultDeptId));
    setOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setDraft({
      id: asset.id,
      name: asset.name,
      description: asset.description || '',
      serialNumber: asset.serialNumber || '',
      acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.split('T')[0] : '',
      value: asset.value ? String(asset.value) : '',
      status: asset.status,
      supplierId: asset.supplierId || '',
      assetTypeId: asset.assetTypeId,
      departmentId: asset.departmentId || '',
      branchId: asset.branchId || '',
      userId: asset.userId || '',
      hostname: asset.hostname || '',
      parentId: asset.parentId || '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('O nome do ativo é obrigatório.');
      return;
    }
    if (!draft.assetTypeId) {
      toast.error('O tipo de ativo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Asset> & { hostname?: string | null; parentId?: string | null } = {
        name: draft.name,
        description: draft.description || undefined,
        serialNumber: draft.serialNumber || undefined,
        acquisitionDate: draft.acquisitionDate ? new Date(draft.acquisitionDate).toISOString() : undefined,
        value: draft.value ? parseFloat(draft.value) : undefined,
        status: draft.status,
        supplierId: draft.supplierId || undefined,
        assetTypeId: draft.assetTypeId,
        departmentId: draft.departmentId || undefined,
        branchId: draft.branchId || undefined,
        userId: draft.userId || undefined,
        hostname: draft.hostname || null,
        parentId: draft.parentId || null,
      };

      if (draft.id) {
        await updateAsset(draft.id, payload as any);
        toast.success('Ativo atualizado com sucesso.');
      } else {
        await createAsset(payload as any);
        toast.success('Ativo criado com sucesso.');
      }
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-dashboard'] });
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar o ativo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAsset(deleteTarget.id);
      toast.success('Ativo baixado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-dashboard'] });
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Erro ao excluir ativo.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando ativos patrimoniais...</div>;
  }

  return (
    <div className="space-y-6 fade-slide-up">
      <PageHeader
        title="Ativos Patrimoniais"
        description="Consulte e gerencie todos os equipamentos de TI, mobiliários e recursos operacionais."
        actions={
          <Button onClick={handleCreate} className="flex gap-2">
            <Plus className="size-4" /> Novo Ativo
          </Button>
        }
      />

      {/* Filters bar */}
      <section className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, nome, série..."
            />
          </div>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Status: Todos</option>
            <option value="ESTOQUE">Em Estoque</option>
            <option value="EM_USO">Em Uso</option>
            <option value="MANUTENCAO">Em Manutenção</option>
            <option value="BAIXADO">Baixados</option>
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Tipo: Todos</option>
            {assetTypes?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="ALL">Local: Todos</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {formatBranchName(b.name)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {filteredAssets.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhum ativo encontrado"
                description="Ajuste os filtros de busca ou cadastre um novo equipamento patrimonial."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Código</TableHead>
                    <TableHead className="px-6 py-4">Nome</TableHead>
                    <TableHead className="px-6 py-4">Tipo</TableHead>
                    <TableHead className="px-6 py-4">Status</TableHead>
                    <TableHead className="px-6 py-4">Localização</TableHead>
                    <TableHead className="px-6 py-4">Responsável</TableHead>
                    <TableHead className="px-6 py-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="hover:bg-muted/10 cursor-pointer transition-colors"
                      onClick={() => {
                        setDetailAssetId(asset.id);
                        setActiveTab('geral');
                      }}
                    >
                      <TableCell className="px-6 py-4 font-mono font-bold text-xs text-primary">{asset.code}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{asset.name}</span>
                          {asset.hostname && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-mono font-semibold px-1.5 py-0.5">
                              ID: {asset.hostname}
                            </Badge>
                          )}
                        </div>
                        {asset.serialNumber && (
                          <div className="text-[10px] text-muted-foreground font-mono">S/N: {asset.serialNumber}</div>
                        )}
                        {asset.parent && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Vinculado a: <span className="font-semibold font-mono text-[11px] text-primary">{asset.parent.code}</span> ({asset.parent.name})
                          </div>
                        )}
                        {asset.components && asset.components.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-1">
                            <span className="font-semibold">Componentes:</span>
                            {asset.components.map((comp) => (
                              <Badge key={comp.id} variant="outline" className="text-[9px] font-mono px-1 py-0 border-muted-foreground/30">
                                {comp.code} ({comp.name})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm">{asset.assetType?.name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(asset.status)}>
                          {statusLabel[asset.status] || asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs space-y-0.5">
                        {asset.branch && <div>{formatBranchName(asset.branch.name)}</div>}
                        {asset.department && <div className="text-muted-foreground">{asset.department.name}</div>}
                        {!asset.branch && !asset.department && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm">{asset.user?.name || '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(asset);
                            }}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          {asset.status !== 'BAIXADO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(asset);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
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
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{draft.id ? `Editar Ativo: ${draft.name}` : 'Novo Ativo Patrimonial'}</DialogTitle>
            <DialogDescription>
              Insira as informações técnicas, de aquisição e localização do novo patrimônio.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="asset-name">Nome do Ativo *</Label>
              <Input
                id="asset-name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Notebook Latitude 3420"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="asset-desc">Descrição</Label>
              <Textarea
                id="asset-desc"
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes adicionais, especificações técnicas..."
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="asset-type">Tipo de Ativo *</Label>
              <select
                id="asset-type"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.assetTypeId}
                onChange={(e) => setDraft((prev) => ({ ...prev, assetTypeId: e.target.value }))}
              >
                <option value="">Selecione um tipo...</option>
                {assetTypes?.filter(t => t.isActive).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="asset-status">Status Inicial *</Label>
              <select
                id="asset-status"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="ESTOQUE">Em Estoque</option>
                <option value="EM_USO">Em Uso</option>
                <option value="MANUTENCAO">Em Manutenção</option>
                <option value="BAIXADO">Baixado</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="serial">Número de Série</Label>
              <Input
                id="serial"
                value={draft.serialNumber}
                onChange={(e) => setDraft((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Ex: CN-0H982X..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="asset-hostname">Identificação do PC (Nome no Windows)</Label>
              <Input
                id="asset-hostname"
                value={draft.hostname}
                onChange={(e) => setDraft((prev) => ({ ...prev, hostname: e.target.value }))}
                placeholder="Ex: w11cclorec1"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="asset-parent">Vincular a Equipamento Pai (Ex: Vincular periférico a um PC)</Label>
              <select
                id="asset-parent"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.parentId}
                onChange={(e) => setDraft((prev) => ({ ...prev, parentId: e.target.value }))}
              >
                <option value="">Nenhum (Ativo Principal / Equipamento)</option>
                {assets?.filter(a => a.id !== draft.id && a.status !== 'BAIXADO').map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} {a.hostname ? `(${a.hostname})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="value">Valor de Aquisição (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={draft.value}
                onChange={(e) => setDraft((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Ex: 4500.00"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="acquisition">Data de Aquisição</Label>
              <Input
                id="acquisition"
                type="date"
                value={draft.acquisitionDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, acquisitionDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplier">Fornecedor</Label>
              <select
                id="supplier"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.supplierId}
                onChange={(e) => setDraft((prev) => ({ ...prev, supplierId: e.target.value }))}
              >
                <option value="">Nenhum fornecedor</option>
                {suppliers?.filter(s => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="branch">Filial / Localização</Label>
              <select
                id="branch"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.branchId}
                onChange={(e) => setDraft((prev) => ({ ...prev, branchId: e.target.value }))}
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
              <Label htmlFor="department">Setor Responsável</Label>
              <select
                id="department"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.departmentId}
                onChange={(e) => setDraft((prev) => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">Selecione setor...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="assignee">Usuário Responsável (Custodiante)</Label>
              <select
                id="assignee"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.userId}
                onChange={(e) => setDraft((prev) => ({ ...prev, userId: e.target.value }))}
              >
                <option value="">Sem responsável vinculado</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Baixa Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-2">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle>Dar Baixa no Ativo?</DialogTitle>
            <DialogDescription>
              Esta ação alterará o status do ativo "{deleteTarget?.name}" ({deleteTarget?.code}) permanentemente para **BAIXADO**. Ele continuará no histórico patrimonial mas não estará disponível para movimentações ou vinculações.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Baixando...' : 'Confirmar Baixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer (Sheet) */}
      <Sheet open={Boolean(detailAssetId)} onOpenChange={(o) => { if (!o) setDetailAssetId(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card border-l">
          <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {assetDetail?.code || 'Carregando...'}
              </span>
              {assetDetail && (
                <Badge variant={statusBadgeVariant(assetDetail.status)}>
                  {statusLabel[assetDetail.status] || assetDetail.status}
                </Badge>
              )}
            </div>
            <SheetTitle className="text-xl font-bold mt-2">{assetDetail?.name || 'Detalhes do Ativo'}</SheetTitle>
            <SheetDescription className="text-xs">
              Visualização completa do histórico patrimonial, componentes e especificações técnicas.
            </SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">
              Carregando dados detalhados...
            </div>
          ) : !assetDetail ? (
            <div className="flex-1 flex items-center justify-center text-sm text-destructive p-6">
              Erro ao carregar detalhes do ativo.
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Navigation Tabs */}
              <div className="flex border-b bg-muted/5 px-2">
                <button
                  onClick={() => setActiveTab('geral')}
                  className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === 'geral'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setActiveTab('components')}
                  className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === 'components'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Componentes ({assetDetail.components?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Histórico ({timelineEvents.length})
                </button>
              </div>

              {/* Tabs Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'geral' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Tipo</span>
                        <span className="text-sm font-medium">{assetDetail.assetType?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Hostname</span>
                        <span className="text-sm font-mono font-semibold text-primary">{assetDetail.hostname || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Número de Série</span>
                        <span className="text-sm font-mono">{assetDetail.serialNumber || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Valor de Compra</span>
                        <span className="text-sm font-medium">
                          {assetDetail.value ? `R$ ${assetDetail.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Localização</span>
                        <span className="text-sm font-medium">
                          {assetDetail.branch ? formatBranchName(assetDetail.branch.name) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Setor</span>
                        <span className="text-sm font-medium">{assetDetail.department?.name || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Custodiante (Usuário)</span>
                        <span className="text-sm font-medium">{assetDetail.user?.name || '-'}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Descrição</span>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                        {assetDetail.description || 'Nenhuma descrição fornecida.'}
                      </p>
                    </div>

                    {assetDetail.supplier && (
                      <div className="border-t pt-4 space-y-2">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Fornecedor</span>
                        <div className="bg-muted/30 border rounded-lg p-3 text-xs space-y-1">
                          <p className="font-semibold">{assetDetail.supplier.name}</p>
                          {assetDetail.supplier.cnpj && <p className="text-muted-foreground">CNPJ: {assetDetail.supplier.cnpj}</p>}
                          {assetDetail.supplier.email && <p className="text-muted-foreground">E-mail: {assetDetail.supplier.email}</p>}
                          {assetDetail.supplier.phone && <p className="text-muted-foreground">Telefone: {assetDetail.supplier.phone}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'components' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Dispositivos instalados e vinculados
                    </h3>
                    {!assetDetail.components || assetDetail.components.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-xl p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Nenhum componente vinculado</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Periféricos ou baterias de reposição vinculados a este ativo principal aparecerão aqui.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:left-6 before:top-2 before:bottom-6 before:w-0.5 before:bg-border">
                        {assetDetail.components.map((comp: any) => (
                          <div key={comp.id} className="flex items-start gap-4 relative pl-4">
                            <div className="size-5 rounded-full border bg-card text-muted-foreground grid place-items-center relative z-10 text-[10px] font-bold">
                              •
                            </div>
                            <div className="flex-1 border bg-muted/20 hover:bg-muted/40 transition-colors p-3 rounded-xl space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-primary">{comp.code}</span>
                                <Badge variant={statusBadgeVariant(comp.status)} className="text-[9px] px-1.5 py-0.5">
                                  {statusLabel[comp.status] || comp.status}
                                </Badge>
                              </div>
                              <p className="text-xs font-semibold">{comp.name}</p>
                              {comp.serialNumber && <p className="text-[10px] text-muted-foreground font-mono">S/N: {comp.serialNumber}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Histórico unificado de movimentações e manutenções
                    </h3>
                    {timelineEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm font-semibold text-muted-foreground">Sem histórico registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-4 before:w-0.5 before:bg-border">
                        {timelineEvents.map((evt, idx) => {
                          const Icon = evt.icon;
                          return (
                            <div key={idx} className="flex items-start gap-4 relative pl-1">
                              <div className={cn("size-7 rounded-full grid place-items-center relative z-10 shadow-sm border border-background", evt.color)}>
                                <Icon className="size-3.5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-semibold text-foreground">{evt.title}</h4>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {evt.date.toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{evt.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}