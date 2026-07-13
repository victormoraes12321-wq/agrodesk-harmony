# DEPLOY_LOCAL.md

Guia de deploy em modo producao para uso interno na rede da empresa.

## 1. Premissas

- Projeto clonado em servidor local, exemplo: `C:\AgroDesk\agrodesk-harmony-main`
- Banco PostgreSQL local ativo
- `.env` do backend e frontend ja configurados
- Modelos de producao disponiveis: `backend/.env.production.example` e `.env.production.example`
- Portas planejadas: `8080` frontend, `3333` backend, `5432` PostgreSQL

## 2. Build de producao

Frontend (raiz):

```powershell
cd C:\AgroDesk\agrodesk-harmony-main
npm install
npm run build
```

Backend:

```powershell
cd C:\AgroDesk\agrodesk-harmony-main\backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Se `npx prisma migrate deploy` retornar `P3005` em banco preexistente, aplique baseline e repita:

```powershell
npx prisma migrate resolve --applied 20260527131500_init
npx prisma migrate resolve --applied 20260601101000_add_ticket_attachment_internal
npx prisma migrate resolve --applied 20260601103500_add_user_contact_optional_fields
npx prisma migrate resolve --applied 20260601120000_add_waiting_requester_message
npx prisma migrate resolve --applied 20260602090000_add_user_operational_access
npx prisma migrate deploy
```

## 3. Subir com PM2

Instalar PM2 global:

```powershell
npm install -g pm2
```

No diretorio raiz do projeto:

```powershell
cd C:\AgroDesk\agrodesk-harmony-main
pm2 start ecosystem.config.cjs
pm2 save
```

Verificar processos:

```powershell
pm2 status
```

## 4. Acesso pela rede local

Endereco esperado:

- Frontend: `http://IP_DO_SERVIDOR:8080`
- API: `http://IP_DO_SERVIDOR:3333/api/v1`
- Swagger: `http://IP_DO_SERVIDOR:3333/api/docs`

Liberar firewall do Windows:

```powershell
netsh advfirewall firewall add rule name="AgroDesk Frontend 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="AgroDesk Backend 3333" dir=in action=allow protocol=TCP localport=3333
```

## 5. IP fixo do servidor

Opcao recomendada:

- Reservar DHCP no roteador/firewall para o MAC do servidor.

Opcao alternativa:

- Configurar IP estatico na placa de rede do servidor.

Exemplo de parametros:

- IP: `192.168.1.50`
- Mascara: `255.255.255.0`
- Gateway: `192.168.1.1`
- DNS: `192.168.1.1` e `8.8.8.8`

Depois de fixar IP:

1. Atualizar `APP_ORIGIN` no `backend/.env`.
2. Atualizar `VITE_API_URL` no `.env` da raiz.
3. Rebuildar frontend e reiniciar PM2.

## 6. Configuracao de portas

Portas recomendadas:

- `8080` frontend
- `3333` backend

Se alterar:

1. Atualizar `PORT` no `backend/.env`.
2. Atualizar `VITE_API_URL` no `.env` da raiz.
3. Reiniciar servicos no PM2.

## 7. Reiniciar servicos

Reiniciar tudo:

```powershell
pm2 restart all
```

Reiniciar apenas backend:

```powershell
pm2 restart agrodesk-backend
```

Reiniciar apenas frontend:

```powershell
pm2 restart agrodesk-frontend
```

## 8. Ver logs

Logs em tempo real:

```powershell
pm2 logs
```

Logs por servico:

```powershell
pm2 logs agrodesk-backend
pm2 logs agrodesk-frontend
```

## 9. Atualizar sistema no futuro

Passo a passo seguro:

1. Fazer backup do banco antes da atualizacao.
2. Atualizar codigo do projeto.
3. Rodar `npm install` raiz e backend.
4. Rodar `npx prisma migrate deploy` no backend.
5. Buildar backend e frontend.
6. Reiniciar PM2.
7. Validar login, abertura de OS e painel admin.

> Nao execute `npm run prisma:seed` durante atualizacoes de uma base em uso. O seed e
> reservado para implantacao inicial ou reset formalmente autorizado e remove dados
> operacionais existentes.
