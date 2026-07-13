import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getAssetMaintenances, createAssetMaintenance, getAssets, type AssetMaintenance } from '@/services/patrimonio-api';
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

export const Route = createFileRoute('/app/patrimonio/manutencoes')({
  component: ManutencoesPage,
});

interface FormDraft {
  assetId: string;
  type: string;
  date: string;
  cost: string;
  provider: string;
  description: string;
  nextMaintenanceDate: string;
}

const initialDraft = (): FormDraft => ({
  assetId: '',
  type: 'PREVENTIVA',
  date: new Date().toISOString().split('T')[0],
  cost: '',
  provider: '',
  description: '',
  nextMaintenanceDate: '',
});

const maintenanceTypeLabels: Record<string, string> = {
  PREVENTIVA: 'Preventiva',
  CORRETIVA: 'Corretiva',
};

const maintenanceTypeBadge = (type: string) => {
  return type === 'PREVENTIVA' ? 'outline' : 'default';
};

function ManutencoesPage() {
  const queryClient = useQueryClient();

  const { data: manuts, isLoading } = useQuery({ queryKey: ['asset-maintenances'], queryFn: getAssetMaintenances });
  const { data: assets } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets() });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(initialDraft());
  const [saving, setSaving] = useState(false);

  const handleOpenDialog = () => {
    setDraft(initialDraft());
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.assetId) {
      toast.error('Selecione um ativo.');
      return;
    }
    if (!draft.description.trim()) {
      toast.error('Informe a descrição do serviço realizado.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        assetId: draft.assetId,
        type: draft.type,
        date: new Date(draft.date).toISOString(),
        cost: draft.cost ? parseFloat(draft.cost) : undefined,
        provider: draft.provider || undefined,
        description: draft.description,
        nextMaintenanceDate: draft.nextMaintenanceDate ? new Date(draft.nextMaintenanceDate).toISOString() : undefined,
      };

      await createAssetMaintenance(payload);
      toast.success('Manutenção registrada com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['asset-maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-dashboard'] });
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao registrar manutenção.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando manutenções...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manutenções de Ativos"
        description="Monitore e registre custos, ordens de reparo e revisões periódicas dos equipamentos."
        actions={
          <Button onClick={handleOpenDialog} className="flex gap-2">
            <Plus className="size-4" /> Registrar Manutenção
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {!manuts || manuts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhuma manutenção registrada"
                description="Registre intervenções preventivas ou corretivas nos ativos da empresa."
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
                    <TableHead className="px-6 py-4">Custo</TableHead>
                    <TableHead className="px-6 py-4">Fornecedor / Técnico</TableHead>
                    <TableHead className="px-6 py-4">Descrição</TableHead>
                    <TableHead className="px-6 py-4">Próxima Revisão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manuts.map((man) => (
                    <TableRow key={man.id} className="hover:bg-muted/10">
                      <TableCell className="px-6 py-4 text-xs">
                        {format(new Date(man.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono font-bold text-xs text-primary mr-2">{man.asset?.code}</span>
                        <span className="text-sm font-semibold">{man.asset?.name}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={maintenanceTypeBadge(man.type)}>
                          {maintenanceTypeLabels[man.type] || man.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(man.cost || 0)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm">{man.provider || '-'}</TableCell>
                      <TableCell className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {man.description}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                        {man.nextMaintenanceDate
                          ? format(new Date(man.nextMaintenanceDate), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Maintenance Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Registrar Manutenção</DialogTitle>
            <DialogDescription>
              Lance as informações sobre reparos, custos e prazos de manutenção do patrimônio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="asset">Ativo Patrimonial *</Label>
              <select
                id="asset"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.assetId}
                onChange={(e) => setDraft(prev => ({ ...prev, assetId: e.target.value }))}
              >
                <option value="">Selecione um ativo...</option>
                {assets?.filter(a => a.status !== 'BAIXADO').map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.type}
                  onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="PREVENTIVA">Preventiva</option>
                  <option value="CORRETIVA">Corretiva</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cost">Custo (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={draft.cost}
                  onChange={(e) => setDraft((prev) => ({ ...prev, cost: e.target.value }))}
                  placeholder="Ex: 250.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Data do Serviço</Label>
                <Input
                  id="date"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="next">Próxima Revisão</Label>
                <Input
                  id="next"
                  type="date"
                  value={draft.nextMaintenanceDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="provider">Técnico / Prestador</Label>
              <Input
                id="provider"
                value={draft.provider}
                onChange={(e) => setDraft((prev) => ({ ...prev, provider: e.target.value }))}
                placeholder="Ex: Oficina Mecânica ABC ou Assistência Autorizada"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descrição do Serviço *</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Troca de cooler, substituição de pasta térmica e limpeza de poeira..."
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