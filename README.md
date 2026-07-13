# AgroDesk TI

Sistema interno de Ticket/OS para o setor de T.I., com frontend React e backend NestJS.

## Estrutura

- `src/` Frontend (React + TypeScript + Vite)
- `backend/` API (NestJS + Prisma + PostgreSQL)
- `backend/prisma/` Schema, migrations e seed
- `ecosystem.config.cjs` Processo PM2 (backend + frontend)
- `docker-compose.local.yml` Opcional para PostgreSQL local via Docker

## Documentacao de Implantacao Local

- [INSTALL_LOCAL.md](./INSTALL_LOCAL.md)
- [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md)
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- [CHECKLIST_PRODUCAO.md](./CHECKLIST_PRODUCAO.md)

## Fluxo Rapido (Resumo)

1. Instalar Node.js 20+ e PostgreSQL 14+.
2. Configurar `.env` do backend e frontend.
3. Rodar migrations e seed.
4. Buildar backend e frontend.
5. Subir com PM2.
6. Liberar portas no firewall e acessar via IP local.

> Para desenvolvimento local, rode um só comando na raiz:
>
> `npm run dev`
>
> Isso inicia backend e frontend juntos com proxy de `/api` para `http://localhost:3333`.

## Portas Recomendadas (Rede Interna)

- Frontend: `8080`
- Backend: `3333`
- PostgreSQL: `5432`

## Enderecos de Acesso (Exemplo)

- Frontend: `http://192.168.1.50:8080`
- API: `http://192.168.1.50:3333/api/v1`
- Swagger: `http://192.168.1.50:3333/api/docs`

## Acessos Iniciais

O seed de implantacao cria somente quatro contas administrativas. Todas recebem a senha
temporaria configurada em `INITIAL_ADMIN_PASSWORD` e sao obrigadas a cadastrar uma nova
senha pessoal imediatamente apos o primeiro login.

| Usuario | E-mail                    | Pode receber OS |
| ------- | ------------------------- | --------------- |
| Marcelo | `marcelo.ti@agrodesk.com` | Sim             |
| Victor  | `victor.ti@agrodesk.com`  | Sim             |
| Gustavo | `gustavo@agrodesk.com`    | Nao             |
| Geraldo | `geraldo@agrodesk.com`    | Nao             |

Gustavo e Geraldo possuem permissao administrativa integral para acompanhar a operacao,
mas o backend bloqueia qualquer tentativa de atribuir uma OS a eles.

## Observacoes

- O seed e destrutivo: use somente na implantacao inicial ou em um reset formalmente autorizado.
- O seed remove OS, comentarios, anexos, notificacoes, auditoria e usuarios existentes antes de preparar a base limpa.
- A tela de login nao exibe credenciais nem atalhos de acesso.
- Senhas sao armazenadas apenas em hash bcrypt.
- Usuarios criados por administradores recebem senha temporaria e devem troca-la no primeiro acesso.
- Para criar novo TI_ADMIN sem editar banco manualmente, use:

```bash
cd backend
npm run prisma:create-admin -- --name "Novo Tecnico" --email "tecnico@empresa.com" --password "Senha@123" --phone "(44) 99999-0000" --position "Tecnico de TI" --department "T.I." --branch "Loja 1" --receive-tickets true
```
