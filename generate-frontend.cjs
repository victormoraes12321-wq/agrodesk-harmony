const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const routesDir = path.join(srcDir, 'routes');
const servicesDir = path.join(srcDir, 'services');

const filesToGenerate = {
  // --- SERVICES ---
  'services/patrimonio-api.ts': `
import { api, withEnumFallback } from './api';

// Types
export interface Supplier {
  id: string; name: string; cnpj?: string; contact?: string; phone?: string; email?: string; isActive: boolean;
}
export interface AssetType {
  id: string; name: string; description?: string; isActive: boolean;
}
export interface Asset {
  id: string; code: string; name: string; description?: string; serialNumber?: string; acquisitionDate?: string; value?: number; status: string;
  supplierId?: string; assetTypeId: string; departmentId?: string; branchId?: string; userId?: string;
  assetType?: AssetType; department?: any; branch?: any; supplier?: Supplier; user?: any;
}
export interface AssetMovement {
  id: string; assetId: string; type: string; date: string; reason?: string; fromDepartment?: any; toDepartment?: any; asset?: Asset;
}
export interface AssetMaintenance {
  id: string; assetId: string; type: string; date: string; cost?: number; provider?: string; description: string; nextMaintenanceDate?: string; asset?: Asset;
}

// API Calls
export const getSuppliers = () => api.get<Supplier[]>('/suppliers').then(res => res.data);
export const createSupplier = (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data).then(res => res.data);
export const updateSupplier = (id: string, data: Partial<Supplier>) => api.patch<Supplier>(\`/suppliers/\${id}\`, data).then(res => res.data);
export const deleteSupplier = (id: string) => api.delete(\`/suppliers/\${id}\`).then(res => res.data);

export const getAssetTypes = () => api.get<AssetType[]>('/asset-types').then(res => res.data);
export const createAssetType = (data: Partial<AssetType>) => api.post<AssetType>('/asset-types', data).then(res => res.data);
export const updateAssetType = (id: string, data: Partial<AssetType>) => api.patch<AssetType>(\`/asset-types/\${id}\`, data).then(res => res.data);
export const deleteAssetType = (id: string) => api.delete(\`/asset-types/\${id}\`).then(res => res.data);

export const getAssets = (filters?: any) => api.get<Asset[]>('/assets', { params: filters }).then(res => res.data);
export const getAsset = (id: string) => api.get<Asset>(\`/assets/\${id}\`).then(res => res.data);
export const createAsset = (data: Partial<Asset>) => api.post<Asset>('/assets', data).then(res => res.data);
export const updateAsset = (id: string, data: Partial<Asset>) => api.patch<Asset>(\`/assets/\${id}\`, data).then(res => res.data);
export const deleteAsset = (id: string) => api.delete(\`/assets/\${id}\`).then(res => res.data);
export const getAssetDashboard = () => api.get<any>('/assets/dashboard').then(res => res.data);

export const getAssetMovements = () => api.get<AssetMovement[]>('/asset-movements').then(res => res.data);
export const createAssetMovement = (data: Partial<AssetMovement>) => api.post<AssetMovement>('/asset-movements', data).then(res => res.data);

export const getAssetMaintenances = () => api.get<AssetMaintenance[]>('/asset-maintenances').then(res => res.data);
export const createAssetMaintenance = (data: Partial<AssetMaintenance>) => api.post<AssetMaintenance>('/asset-maintenances', data).then(res => res.data);
  `,

  // --- ROUTES ---
  'routes/app.patrimonio.tsx': `
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/lib/store';

export const Route = createFileRoute('/app/patrimonio')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user?.role !== 'TI_ADMIN') {
      throw redirect({ to: '/app/dashboard' });
    }
  },
  component: PatrimonioLayout,
});

function PatrimonioLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Patrimônio</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerenciamento completo de ativos, manutenções e fornecedores.</p>
      </div>
      <Outlet />
    </div>
  );
}
  `,

  'routes/app.patrimonio.dashboard.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssetDashboard } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Wrench, Warehouse, DollarSign } from 'lucide-react';

export const Route = createFileRoute('/app/patrimonio/dashboard')({
  component: PatrimonioDashboardPage,
});

function PatrimonioDashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['asset-dashboard'], queryFn: getAssetDashboard });

  if (isLoading) return <div>Carregando dashboard...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inUse || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <Warehouse className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inStock || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inMaintenance || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
            <CardHeader><CardTitle>Valor Total (R$)</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalValue || 0)}
              </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
  `,

  'routes/app.patrimonio.ativos.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssets, getAssetTypes } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/app/patrimonio/ativos')({
  component: AtivosPage,
});

function AtivosPage() {
  const { data: assets, isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets() });

  if (isLoading) return <div>Carregando ativos...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets?.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.code}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.assetType?.name}</TableCell>
                  <TableCell>{asset.status}</TableCell>
                </TableRow>
              ))}
              {assets?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Nenhum ativo cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
  `,

  'routes/app.patrimonio.tipos.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssetTypes } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/app/patrimonio/tipos')({
  component: TiposAtivosPage,
});

function TiposAtivosPage() {
  const { data: types, isLoading } = useQuery({ queryKey: ['asset-types'], queryFn: getAssetTypes });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types?.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell>{type.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
  `,

  'routes/app.patrimonio.fornecedores.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSuppliers } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/app/patrimonio/fornecedores')({
  component: FornecedoresPage,
});

function FornecedoresPage() {
  const { data: suppliers, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fornecedores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((sup) => (
                <TableRow key={sup.id}>
                  <TableCell className="font-medium">{sup.name}</TableCell>
                  <TableCell>{sup.cnpj}</TableCell>
                  <TableCell>{sup.contact}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
  `,

  'routes/app.patrimonio.movimentacoes.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssetMovements } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/app/patrimonio/movimentacoes')({
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const { data: movs, isLoading } = useQuery({ queryKey: ['asset-movements'], queryFn: getAssetMovements });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs?.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>{format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell>{mov.asset?.code}</TableCell>
                  <TableCell>{mov.type}</TableCell>
                  <TableCell>{mov.fromDepartment?.name || '-'}</TableCell>
                  <TableCell>{mov.toDepartment?.name || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
  `,

  'routes/app.patrimonio.manutencoes.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAssetMaintenances } from '@/services/patrimonio-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/app/patrimonio/manutencoes')({
  component: ManutencoesPage,
});

function ManutencoesPage() {
  const { data: manuts, isLoading } = useQuery({ queryKey: ['asset-maintenances'], queryFn: getAssetMaintenances });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manutenções</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manuts?.map((man) => (
                <TableRow key={man.id}>
                  <TableCell>{format(new Date(man.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell>{man.asset?.code}</TableCell>
                  <TableCell>{man.type}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(man.cost || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
  `,

  'routes/app.patrimonio.relatorios.tsx': `
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const Route = createFileRoute('/app/patrimonio/relatorios')({
  component: RelatoriosPatrimonioPage,
});

function RelatoriosPatrimonioPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios Patrimoniais</CardTitle>
      </CardHeader>
      <CardContent>
         <div className="flex flex-col gap-4">
           <p className="text-slate-500">Módulo de exportação avançada de dados.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Button variant="outline" className="flex gap-2 justify-start h-auto py-4">
               <Download className="h-5 w-5" />
               <div className="flex flex-col items-start">
                 <span className="font-semibold">Inventário Completo</span>
                 <span className="text-xs text-slate-500">Exportar todos ativos (Excel)</span>
               </div>
             </Button>
             
             <Button variant="outline" className="flex gap-2 justify-start h-auto py-4">
               <Download className="h-5 w-5" />
               <div className="flex flex-col items-start">
                 <span className="font-semibold">Ativos em Manutenção</span>
                 <span className="text-xs text-slate-500">Exportar relatório (PDF)</span>
               </div>
             </Button>
           </div>
         </div>
      </CardContent>
    </Card>
  );
}
  `
};

for (const [relativePath, content] of Object.entries(filesToGenerate)) {
  const fullPath = path.join(__dirname, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf-8');
}

console.log('Frontend base components generated successfully!');
