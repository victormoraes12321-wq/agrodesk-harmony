# INSTALL_LOCAL.md

Guia de instalacao inicial do AgroDesk TI em servidor local da empresa.

## 1. Instalar Node.js

Recomendado:

- Node.js `20.x` LTS ou superior
- npm `10+`

Windows:

1. Baixe em: [https://nodejs.org](https://nodejs.org)
2. Instale com opcoes padrao.
3. Valide no PowerShell:

```powershell
node -v
npm -v
```

## 2. Instalar PostgreSQL

Recomendado:

- PostgreSQL `14+` (ideal 15 ou 16)

Windows:

1. Baixe em: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Defina senha forte para usuario `postgres`.
3. Mantenha porta `5432`.

Validacao:

```powershell
psql --version
```

Opcional via Docker (apenas banco):

```powershell
docker compose -f docker-compose.local.yml up -d
```

## 3. Configurar banco

Criar banco:

```sql
CREATE DATABASE agrodesk_ti;
```

Ou usando comando:

```powershell
createdb -U postgres agrodesk_ti
```

## 4. Configurar backend

No diretorio `backend`:

```powershell
cd backend
copy .env.example .env
# ou use o modelo de producao:
copy .env.production.example .env
```

Ajuste o `.env`:

```env
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/agrodesk_ti?schema=public"
JWT_ACCESS_SECRET=trocar_por_chave_forte
JWT_REFRESH_SECRET=trocar_por_chave_forte
UPLOAD_DIR=uploads
UPLOAD_MAX_MB=10
APP_ORIGIN=http://SEU_IP_FIXO:8080
INITIAL_ADMIN_PASSWORD=trocar_por_senha_temporaria_forte
```

Instalar dependencias:

```powershell
npm install
```

## 5. Configurar frontend

No diretorio raiz do projeto:

```powershell
cd ..
copy .env.example .env
# ou use o modelo de producao:
copy .env.production.example .env
```

Ajuste o `.env`:

```env
VITE_API_URL=http://SEU_IP_FIXO:3333/api/v1
```

Instalar dependencias:

```powershell
npm install
```

## 6. Rodar migrations

No `backend`:

```powershell
cd backend
npx prisma generate
npx prisma migrate deploy
```

Se aparecer erro `P3005` (schema nao vazio), faça baseline das migrations existentes e rode o deploy novamente:

```powershell
npx prisma migrate resolve --applied 20260527131500_init
npx prisma migrate resolve --applied 20260601101000_add_ticket_attachment_internal
npx prisma migrate resolve --applied 20260601103500_add_user_contact_optional_fields
npx prisma migrate resolve --applied 20260601120000_add_waiting_requester_message
npx prisma migrate resolve --applied 20260602090000_add_user_operational_access
npx prisma migrate deploy
```

## 7. Rodar seed

No `backend`:

```powershell
npm run prisma:seed
```

> Atencao: o seed e destrutivo. Execute somente na implantacao inicial ou em um reset
> formalmente autorizado. Ele remove dados operacionais existentes.

O seed cria uma base limpa:

- Quatro usuarios TI_ADMIN iniciais
- Marcelo e Victor habilitados para receber OS
- Gustavo e Geraldo com acesso total, mas bloqueados como responsaveis por OS
- Filiais Loja 1 a Loja 5
- Categorias e subcategorias
- Nenhum ticket ou usuario solicitante ficticio

## 8. Criar usuario admin

Opcao A:

- Use os administradores criados no seed.

Opcao B:

```powershell
cd backend
npm run prisma:create-admin -- --name "Tecnico Local" --email "tecnico.local@empresa.com" --password "Senha@123" --phone "(44) 99999-0000" --position "Tecnico TI" --department "T.I." --branch "Loja 1" --receive-tickets true
```

Todo usuario criado com senha temporaria sera obrigado a cadastrar uma senha pessoal no
primeiro acesso.

## 9. Teste basico

Backend:

```powershell
cd backend
npm run start:dev
```

Frontend:

```powershell
cd ..
npm run dev
```

> O comando `npm run dev` na raiz inicia backend e frontend juntos. O frontend é servido em `http://localhost:3000` e as chamadas `/api` são encaminhadas para `http://localhost:3333/api/v1`.

Acessos de teste:

- Frontend: `http://localhost:3000`
- API (direto): `http://localhost:3333/api/v1`
- Swagger: `http://localhost:3333/api/docs`
