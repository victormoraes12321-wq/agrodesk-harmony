import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Sprout } from "lucide-react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="w-full max-w-xl rounded-3xl border bg-card p-8 sm:p-10 text-center shadow-[var(--shadow-card)] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, oklch(0.68 0.15 145 / 0.14), transparent 34%), radial-gradient(circle at 85% 80%, oklch(0.62 0.14 230 / 0.12), transparent 38%)",
          }}
        />
        <div className="relative">
          <div className="mx-auto size-14 rounded-2xl grid place-items-center bg-primary/10 text-primary mb-6">
            <Sprout className="size-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Erro 404</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            Pagina nao encontrada
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            O endereco acessado nao existe ou foi movido. Use os atalhos abaixo para voltar ao fluxo
            do AgroDesk TI.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Ir para inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold tracking-tight">Nao foi possivel carregar a pagina</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte para a pagina inicial.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Tentar novamente
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            Ir para inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgroDesk TI | Central de Suporte" },
      {
        name: "description",
        content: "Sistema interno de chamados de TI para operacao do agronegocio.",
      },
      { name: "author", content: "AgroDesk TI" },
      { property: "og:title", content: "AgroDesk TI | Central de Suporte" },
      {
        property: "og:description",
        content: "Sistema interno de chamados de TI para operacao do agronegocio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AgroDesk TI | Central de Suporte" },
      {
        name: "twitter:description",
        content: "Sistema interno de chamados de TI para operacao do agronegocio.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
