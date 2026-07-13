# AgroDesk TI Backend

Backend do AgroDesk TI com:

- Node.js + TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- JWT + Bcrypt
- Multer (upload local)
- class-validator
- Swagger

## 1. Pre-requisitos

- Node.js 20+
- PostgreSQL 14+

## 2. Configuracao de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Ajuste no `.env`:

- `DATABASE_URL`
- `PORT`
- `HOST`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `UPLOAD_DIR`
- `UPLOAD_MAX_MB`
- `APP_ORIGIN`

## 3. Instalacao

```bash
npm install
```

## 4. Banco de dados

### 4.1 Migrations

```bash
npx prisma migrate dev
```

ou:

```bash
npx prisma migrate deploy
```

### 4.2 Gerar Prisma Client

```bash
npx prisma generate
```

### 4.3 Seed inicial

```bash
npm run prisma:seed
```

Senha temporaria dos usuarios iniciais:

- Definida por `INITIAL_ADMIN_PASSWORD` no `.env`.

Observacao:

- O seed e destrutivo. Execute somente na implantacao inicial ou em um reset formalmente autorizado.
- A senha e salva no banco apenas como hash bcrypt.
- Nenhuma senha em texto puro e persistida nas tabelas.
- Todo usuario precisa cadastrar uma senha pessoal no primeiro acesso.

### 4.4 Criar TI_ADMIN manualmente

```bash
npm run prisma:create-admin -- --name "Tecnico Local" --email "tecnico.local@empresa.com" --password "Senha@123" --phone "(44) 99999-0000" --position "Tecnico TI" --department "T.I." --branch "Loja 1" --receive-tickets true
```

## 5. Rodar API

Desenvolvimento:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Producao:

```bash
npm run start
```

## 6. Swagger

Com a API rodando:

- [http://localhost:3333/api/docs](http://localhost:3333/api/docs)

## 7. Prefixo da API

- `/api/v1`

## 8. O que o seed inclui

- 4 usuarios `TI_ADMIN` (Marcelo, Victor, Gustavo e Geraldo)
- Marcelo e Victor habilitados para receber OS
- Gustavo e Geraldo com acesso integral, mas bloqueados como responsaveis por OS
- 5 filiais (`Loja 1` a `Loja 5`)
- setores, categorias e subcategorias
- configuracoes globais

O seed nao cria solicitantes, tickets, comentarios, notificacoes ou auditoria ficticios.

## 9. Testes de carga

Os scripts em `tests/load/` criam dados artificiais. Use somente em banco descartavel de
homologacao, nunca no banco operacional. Configure:

```bash
LOAD_TEST_PASSWORD=AgroDeskCarga@2026
LOAD_TEST_INITIAL_PASSWORD=AgroDesk@2026
LOAD_TEST_ADMIN_EMAIL=marcelo.ti@agrodesk.com
```
