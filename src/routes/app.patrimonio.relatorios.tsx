import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Laptop,
  Building2,
  Layers,
  PackageCheck,
  Tag,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { getAssets, getAssetTypes, type Asset } from '@/services/patrimonio-api';
import { useApp } from '@/lib/store';
import { formatBranchName, getBranchName, getDepartmentName } from '@/lib/helpdesk';
import { formatDateTime } from '@/lib/format';

export const Route = createFileRoute('/app/patrimonio/relatorios')({
  component: RelatoriosPatrimonioPage,
});

function RelatoriosPatrimonioPage() {
  const { branches, departments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'combos' | 'linear'>('combos');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  // Root assets vs components
  const rootAssets = useMemo(() => assets.filter((a) => !a.parentId), [assets]);
  const childAssets = useMemo(() => assets.filter((a) => a.parentId), [assets]);

  // Hierarchical tree by Branch -> Department
  const tree = useMemo(() => {
    const result: Record<
      string,
      Record<
        string,
        {
          combos: Asset[];
          standalone: Asset[];
        }
      >
    > = {};

    for (const asset of rootAssets) {
      const branchName = asset.branch?.name || 'Sem Filial Definida';
      const deptName = asset.department?.name || 'Geral / Sem Setor';

      if (branchFilter !== 'ALL' && asset.branchId !== branchFilter) continue;
      if (departmentFilter !== 'ALL' && asset.departmentId !== departmentFilter) continue;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRoot =
          asset.code?.toLowerCase().includes(query) ||
          asset.name?.toLowerCase().includes(query) ||
          asset.hostname?.toLowerCase().includes(query) ||
          asset.serialNumber?.toLowerCase().includes(query);

        const matchesChild = asset.components?.some(
          (c) =>
            c.code?.toLowerCase().includes(query) ||
            c.name?.toLowerCase().includes(query) ||
            c.serialNumber?.toLowerCase().includes(query),
        );

        if (!matchesRoot && !matchesChild) continue;
      }

      if (!result[branchName]) result[branchName] = {};
      if (!result[branchName][deptName]) {
        result[branchName][deptName] = {
          combos: [],
          standalone: [],
        };
      }

      if (asset.components && asset.components.length > 0) {
        result[branchName][deptName].combos.push(asset);
      } else {
        result[branchName][deptName].standalone.push(asset);
      }
    }

    return result;
  }, [rootAssets, branchFilter, departmentFilter, searchQuery]);

  const totalCombos = useMemo(
    () => rootAssets.filter((a) => a.components && a.components.length > 0).length,
    [rootAssets],
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const rows: Array<Record<string, string>> = [];

      for (const asset of rootAssets) {
        const branchName = asset.branch ? formatBranchName(asset.branch.name) : 'Sem Filial';
        const deptName = asset.department?.name || 'Geral';
        const isCombo = asset.components && asset.components.length > 0;
        const comboName = isCombo ? `${asset.hostname || asset.name} (Posto)` : 'Avulso';

        // Item Principal
        rows.push({
          'Filial / Unidade': branchName,
          'Setor / Departamento': deptName,
          'Posto / Combo de Trabalho': comboName,
          'Código Patrimônio': asset.code,
          'Tipo de Ativo': asset.assetType?.name || 'Computador',
          'Equipamento / Modelo': asset.name,
          Hostname: asset.hostname || '-',
          'Nº de Série (S/N)': asset.serialNumber || '-',
          Status: asset.status === 'EM_USO' ? 'Em Uso' : asset.status,
          'Usuário Responsável': asset.user?.name || '-',
          'Etiquetado [OK]': '',
          'Observações de Campo': asset.description || '',
        });

        // Componentes vinculados
        if (asset.components) {
          for (const comp of asset.components) {
            rows.push({
              'Filial / Unidade': branchName,
              'Setor / Departamento': deptName,
              'Posto / Combo de Trabalho': comboName,
              'Código Patrimônio': comp.code,
              'Tipo de Ativo': comp.assetType?.name || 'Periférico',
              'Equipamento / Modelo': comp.name,
              Hostname: '-',
              'Nº de Série (S/N)': comp.serialNumber || '-',
              Status: comp.status === 'EM_USO' ? 'Em Uso' : comp.status,
              'Usuário Responsável': asset.user?.name || '-',
              'Etiquetado [OK]': '',
              'Observações de Campo': `Vinculado ao ${asset.code}`,
            });
          }
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventário & Etiquetagem');

      // Set column widths
      ws['!cols'] = [
        { wch: 24 }, // Filial
        { wch: 20 }, // Setor
        { wch: 25 }, // Posto
        { wch: 18 }, // Código
        { wch: 16 }, // Tipo
        { wch: 32 }, // Equipamento
        { wch: 16 }, // Hostname
        { wch: 20 }, // S/N
        { wch: 12 }, // Status
        { wch: 20 }, // Usuário
        { wch: 14 }, // Etiquetado
        { wch: 35 }, // Obs
      ];

      XLSX.writeFile(wb, `Checklist_Etiquetagem_Patrimonio_Casa_do_Campo_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Planilha Excel gerada com sucesso com agrupamento por postos!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar planilha Excel.');
    }
  };

  return (
    <div className="space-y-6 fade-slide-up">
      {/* Printable Area Identification */}
      <div className="print:block hidden">
        {/* Print Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img src="/Logo_Casa_do_Campo.png" alt="Casa do Campo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-black text-emerald-950 uppercase">Checklist de Etiquetagem Patrimonial</h1>
              <p className="text-xs text-emerald-800 font-semibold">Casa do Campo • Gestão Integrada de Ativos e T.I.</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <p><strong>Emissão:</strong> {formatDateTime(new Date().toISOString())}</p>
            <p><strong>Responsável:</strong> Victor Moraes (T.I.)</p>
          </div>
        </div>
      </div>

      {/* Screen PageHeader */}
      <div className="print:hidden">
        <PageHeader
          title="Relatórios & Guia de Etiquetagem"
          description="Relação completa de ativos patrimoniais organizada por filiais, setores e postos de trabalho."
          actions={
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="gap-2 text-xs h-9 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs cursor-pointer font-semibold"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" /> Exportar Planilha (.XLSX)
              </Button>
              <Button
                onClick={handlePrint}
                className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer font-bold"
              >
                <Printer className="size-4" /> Imprimir Checklist (A4)
              </Button>
            </div>
          }
        />
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de Ativos</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{assets.length}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Cadastrados no sistema</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <PackageCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Combos / Postos</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{totalCombos}</h3>
              <p className="text-[11px] text-primary font-medium mt-0.5">PC + Periféricos vinculados</p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Laptop className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filiais Mapeadas</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{branches.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Unidades operacionais</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Setores Atendidos</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{departments.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Departamentos físicos</p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-xs border-border/80 print:hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, hostname, modelo ou série..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Todas as Filiais</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {formatBranchName(b.name)}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Todos os Setores</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Report Tree List */}
      <div id="asset-tag-print-area" className="space-y-6">
        {Object.keys(tree).length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground print:hidden">
            <p>Nenhum ativo encontrado para os filtros selecionados.</p>
          </Card>
        ) : (
          Object.entries(tree).map(([branchName, depts]) => (
            <div key={branchName} className="space-y-4">
              {/* Branch Title */}
              <div className="bg-emerald-900 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-xs">
                <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="size-4" /> {branchName}
                </span>
                <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                  {Object.values(depts).reduce(
                    (acc, d) =>
                      acc +
                      d.combos.length +
                      d.combos.reduce((cAcc, c) => cAcc + (c.components?.length || 0), 0) +
                      d.standalone.length,
                    0,
                  )}{' '}
                  itens
                </span>
              </div>

              {/* Departments */}
              {Object.entries(depts).map(([deptName, group]) => (
                <div key={deptName} className="space-y-3 pl-1 sm:pl-3">
                  <div className="flex items-center justify-between border-l-4 border-emerald-600 bg-muted/30 px-3 py-1.5 rounded-r-lg">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                      <Layers className="size-3.5 text-emerald-600" /> Setor: {deptName}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {group.combos.length} estação(ões) • {group.standalone.length} avulso(s)
                    </span>
                  </div>

                  {/* 1. COMBOS (Estações de Trabalho com Periféricos) */}
                  {group.combos.map((combo) => (
                    <div
                      key={combo.id}
                      className="rounded-2xl border bg-card overflow-hidden shadow-xs border-border/80 space-y-0"
                    >
                      {/* Combo Header */}
                      <div className="bg-muted/40 p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Laptop className="size-3.5 text-primary" /> Posto:
                          </span>
                          {combo.hostname ? (
                            <span className="font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                              {combo.hostname}
                            </span>
                          ) : null}
                          <span className="font-semibold text-foreground">{combo.name}</span>
                          {combo.user && (
                            <span className="text-muted-foreground font-medium">
                              (Resp: {combo.user.name})
                            </span>
                          )}
                        </div>
                        {combo.description && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-md">
                            {combo.description.replace(/\s*\|\s*Em uso.*/i, '')}
                          </span>
                        )}
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/20 text-muted-foreground border-b text-[11px] uppercase tracking-wider font-semibold">
                              <th className="p-2.5 text-center w-12">OK</th>
                              <th className="p-2.5 w-32">Patrimônio</th>
                              <th className="p-2.5 w-28">Tipo</th>
                              <th className="p-2.5">Equipamento / Modelo</th>
                              <th className="p-2.5 w-36">Nº de Série (S/N)</th>
                              <th className="p-2.5 w-24">Status</th>
                              <th className="p-2.5 w-44">Visto do Técnico</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {/* Computador Principal */}
                            <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                              <td className="p-2.5 text-center">
                                <div className="size-4 border-2 border-primary rounded inline-block bg-background align-middle" />
                              </td>
                              <td className="p-2.5 font-mono font-bold text-primary">{combo.code}</td>
                              <td className="p-2.5">
                                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                  {combo.assetType?.name || 'Computador'}
                                </Badge>
                              </td>
                              <td className="p-2.5 font-semibold text-foreground">{combo.name}</td>
                              <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                                {combo.serialNumber || '—'}
                              </td>
                              <td className="p-2.5 font-medium text-emerald-600 dark:text-emerald-400">
                                {combo.status === 'EM_USO' ? 'Em Uso' : combo.status}
                              </td>
                              <td className="p-2.5">
                                <div className="border-b border-dashed border-muted-foreground/40 w-full h-4" />
                              </td>
                            </tr>

                            {/* Periféricos vinculados */}
                            {combo.components?.map((comp) => (
                              <tr key={comp.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-2.5 text-center">
                                  <div className="size-4 border border-muted-foreground/70 rounded inline-block bg-background align-middle" />
                                </td>
                                <td className="p-2.5 font-mono font-bold text-foreground/80">{comp.code}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                                    {comp.assetType?.name || 'Periférico'}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-foreground">{comp.name}</td>
                                <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                                  {comp.serialNumber || '—'}
                                </td>
                                <td className="p-2.5 text-muted-foreground">
                                  {comp.status === 'EM_USO' ? 'Em Uso' : comp.status}
                                </td>
                                <td className="p-2.5">
                                  <div className="border-b border-dashed border-muted-foreground/40 w-full h-4" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* 2. STANDALONE (Equipamentos Avulsos) */}
                  {group.standalone.length > 0 && (
                    <div className="rounded-2xl border bg-card overflow-hidden shadow-xs border-border/80">
                      <div className="bg-muted/30 p-2.5 border-b flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>📦 Equipamentos Avulsos & Infraestrutura do Setor</span>
                        <span>Total: {group.standalone.length} item(ns)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/10 text-muted-foreground border-b text-[11px] uppercase tracking-wider font-semibold">
                              <th className="p-2.5 text-center w-12">OK</th>
                              <th className="p-2.5 w-32">Patrimônio</th>
                              <th className="p-2.5 w-28">Tipo</th>
                              <th className="p-2.5">Equipamento / Modelo</th>
                              <th className="p-2.5 w-36">Nº de Série (S/N)</th>
                              <th className="p-2.5 w-24">Status</th>
                              <th className="p-2.5 w-44">Visto do Técnico</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {group.standalone.map((item) => (
                              <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-2.5 text-center">
                                  <div className="size-4 border border-muted-foreground/70 rounded inline-block bg-background align-middle" />
                                </td>
                                <td className="p-2.5 font-mono font-bold text-primary">{item.code}</td>
                                <td className="p-2.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                                    {item.assetType?.name || 'Ativo'}
                                  </Badge>
                                </td>
                                <td className="p-2.5 font-semibold text-foreground">{item.name}</td>
                                <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                                  {item.serialNumber || '—'}
                                </td>
                                <td className="p-2.5 text-muted-foreground">
                                  {item.status === 'EM_USO' ? 'Em Uso' : item.status}
                                </td>
                                <td className="p-2.5">
                                  <div className="border-b border-dashed border-muted-foreground/40 w-full h-4" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Print Footer */}
      <div className="print:flex hidden justify-between items-end pt-8 border-t border-slate-300 text-xs text-slate-600">
        <div>
          <p className="font-bold text-slate-800">AgroDesk TI Harmony • Casa do Campo</p>
          <p className="text-[10px]">Gestão Integrada de Ativos e Tecnologia</p>
        </div>
        <div className="flex gap-8">
          <div className="text-center w-48">
            <div className="border-b border-slate-400 pb-8 mb-1" />
            <p className="font-bold text-slate-900">Victor Moraes</p>
            <p className="text-[10px] text-slate-500">Técnico de T.I.</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-400 pb-8 mb-1" />
            <p className="font-bold text-slate-900">Responsável pela Unidade</p>
            <p className="text-[10px] text-slate-500">Conferência de Inventário</p>
          </div>
        </div>
      </div>
    </div>
  );
}