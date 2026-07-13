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