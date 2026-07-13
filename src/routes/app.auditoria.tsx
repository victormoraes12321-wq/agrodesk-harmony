import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminOnly } from "@/components/auth/RoleGuard";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatDateTime } from "@/lib/format";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria e Historico | AgroDesk TI" }] }),
  component: AuditRoute,
});

function AuditRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <AuditPage />
    </AdminOnly>
  );
}

function renderDiff(beforeStr: string, afterStr: string) {
  let before: any = null;
  let after: any = null;

  try {
    if (beforeStr && beforeStr !== "-") {
      before = JSON.parse(beforeStr);
    }
  } catch {
    before = beforeStr;
  }

  try {
    if (afterStr && afterStr !== "-") {
      after = JSON.parse(afterStr);
    }
  } catch {
    after = afterStr;
  }

  const isBeforeObj = before && typeof before === "object";
  const isAfterObj = after && typeof after === "object";

  if (!isBeforeObj && !isAfterObj) {
    if (beforeStr === afterStr) return <span className="text-muted-foreground text-xs">{afterStr || "-"}</span>;
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="line-through text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">{beforeStr || "-"}</span>
        <span className="text-primary font-bold">➔</span>
        <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded font-semibold">{afterStr || "-"}</span>
      </div>
    );
  }

  const objBefore = isBeforeObj ? before : {};
  const objAfter = isAfterObj ? after : {};
  const allKeys = Array.from(new Set([...Object.keys(objBefore), ...Object.keys(objAfter)]));

  const EXCLUDED_KEYS = new Set(["id", "createdAt", "updatedAt", "password", "avatarColor", "salt"]);
  const changedFields: { key: string; from: any; to: any }[] = [];

  allKeys.forEach((key) => {
    if (EXCLUDED_KEYS.has(key)) return;
    const valBefore = objBefore[key];
    const valAfter = objAfter[key];

    const strBefore = typeof valBefore === "object" ? JSON.stringify(valBefore) : String(valBefore ?? "");
    const strAfter = typeof valAfter === "object" ? JSON.stringify(valAfter) : String(valAfter ?? "");

    if (strBefore !== strAfter) {
      changedFields.push({
        key,
        from: valBefore,
        to: valAfter,
      });
    }
  });

  if (changedFields.length === 0) {
    return <span className="text-muted-foreground text-xs">Sem alterações detectadas</span>;
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "boolean") return val ? "Sim" : "Não";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="space-y-1.5 max-w-lg">
      {changedFields.map((field) => (
        <div key={field.key} className="flex flex-wrap items-center gap-1.5 text-xs bg-muted/10 p-1 px-2 rounded border border-border/40">
          <span className="font-semibold text-foreground uppercase tracking-wider text-[9px] bg-muted px-1.5 py-0.5 rounded">
            {field.key}
          </span>
          <span className="line-through text-muted-foreground bg-muted/40 px-1 py-0.5 rounded text-[10px]">
            {formatValue(field.from)}
          </span>
          <span className="text-primary font-bold text-[10px]">➔</span>
          <span className="bg-primary/5 text-primary px-1 py-0.5 rounded font-semibold text-[10px]">
            {formatValue(field.to)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditPage() {
  const { audit } = useApp();
  const desktopTable = useMediaQuery("(min-width: 1024px)");
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("ALL");

  const entities = useMemo(() => Array.from(new Set(audit.map((row) => row.entity))), [audit]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return audit.filter((row) => {
      const entityMatch = entity === "ALL" || row.entity === entity;
      const textMatch =
        normalized.length === 0 ||
        row.userName.toLowerCase().includes(normalized) ||
        row.field.toLowerCase().includes(normalized) ||
        row.entityId.toLowerCase().includes(normalized) ||
        row.before.toLowerCase().includes(normalized) ||
        row.after.toLowerCase().includes(normalized);
      return entityMatch && textMatch;
    });
  }, [audit, query, entity]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria / Histórico"
        description="Registro de alterações com usuário, campo alterado, diff de modificação, data e entidade."
      />

      <section className="rounded-2xl border bg-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por usuário, campo, entidade ou valor"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
        >
          <option value="ALL">Todas entidades</option>
          {entities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border bg-card overflow-hidden">
        {!desktopTable ? (
          <div className="divide-y">
            {filtered.map((row) => (
              <article key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.userName}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                  </div>
                  <span className="rounded-full border px-2 py-1 text-[11px] shrink-0 font-semibold bg-muted/40">
                    {row.entity}
                  </span>
                </div>
                <p className="text-sm">
                  <strong>{row.field}</strong> em <span className="break-all font-mono text-xs text-primary">{row.entityId}</span>
                </p>
                <div className="p-2.5 rounded-xl border bg-muted/5">
                  {renderDiff(row.before, row.after)}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Data/hora</th>
                  <th className="text-left px-4 py-3">Quem alterou</th>
                  <th className="text-left px-4 py-3">Entidade</th>
                  <th className="text-left px-4 py-3">ID entidade</th>
                  <th className="text-left px-4 py-3">Ação</th>
                  <th className="text-left px-4 py-3">Alterações Realizadas (Diff)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 text-sm">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{row.userName}</td>
                    <td className="px-4 py-3 text-sm">{row.entity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{row.entityId}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{row.field}</td>
                    <td className="px-4 py-3 text-sm py-4">{renderDiff(row.before, row.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
