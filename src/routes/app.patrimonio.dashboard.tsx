import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssetDashboard } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Wrench, Warehouse, DollarSign, BarChart3, Sprout } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

export const Route = createFileRoute('/app/patrimonio/dashboard')({
  component: PatrimonioDashboardPage,
});

const COLORS = ['var(--color-primary)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

function PatrimonioDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({ queryKey: ['asset-dashboard'], queryFn: getAssetDashboard });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando indicadores patrimoniais...</div>;
  }

  const handleCardClick = (status?: string) => {
    const search = status ? `?status=${status}` : '';
    void navigate({ to: `/app/patrimonio/ativos${search}` });
  };

  const chartData = stats?.byTypeData || [];

  return (
    <div className="space-y-6 fade-slide-up">
      <PageHeader
        title="Dashboard de Patrimônio"
        description="Indicadores financeiros e operacionais do inventário de equipamentos e bens corporativos."
      />

      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          onClick={() => handleCardClick()}
          className="hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all cursor-pointer border-l-4 border-l-primary/80 bg-card select-none hover-card-premium"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Ativos</CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats?.total || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Clique para ver todos os bens registrados</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardClick('EM_USO')}
          className="hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all cursor-pointer border-l-4 border-l-emerald-500 bg-card select-none hover-card-premium"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos Em Uso</CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
              <Sprout className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats?.inUse || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Alocados e em atividade com usuários</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardClick('ESTOQUE')}
          className="hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all cursor-pointer border-l-4 border-l-blue-500 bg-card select-none hover-card-premium"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos Em Estoque</CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 grid place-items-center">
              <Warehouse className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats?.inStock || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Armazenados no depósito de TI</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleCardClick('MANUTENCAO')}
          className="hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all cursor-pointer border-l-4 border-l-amber-500 bg-card select-none hover-card-premium"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Manutenção</CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats?.inMaintenance || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Em assistência ou conserto local</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Value Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Cost Value Card */}
        <Card className="shadow-[var(--shadow-card)] flex flex-col justify-between hover-card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total Estimado (Custo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <DollarSign className="size-6" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalValue || 0)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Soma total de aquisição de todos os bens operacionais cadastrados e ativos no AgroDesk TI.
            </p>
          </CardContent>
        </Card>

        {/* Assets distribution by type */}
        <Card className="shadow-[var(--shadow-card)] md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Cadastre ativos para visualizar os gráficos de distribuição.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}