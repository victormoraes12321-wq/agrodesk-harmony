import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/patrimonio')({
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