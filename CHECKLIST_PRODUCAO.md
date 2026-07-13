# CHECKLIST_PRODUCAO.md

Checklist para entrada em producao local do AgroDesk TI.

## 1. Infraestrutura

- [ ] Servidor local com energia estabilizada e nobreak
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL 14+ instalado e ativo
- [ ] Espaco em disco adequado para uploads e backups
- [ ] IP fixo configurado ou reserva DHCP aplicada

## 2. Banco de dados

- [ ] Banco `agrodesk_ti` criado
- [ ] Usuario do banco com senha forte
- [ ] `DATABASE_URL` validada no `backend/.env`
- [ ] Migration aplicada com `npx prisma migrate deploy`
- [ ] Seed executado uma unica vez na implantacao inicial ou reset autorizado

## 3. Backend

- [ ] `backend/.env` preenchido em modo producao
- [ ] `PORT` definido (recomendado `3333`)
- [ ] `HOST=0.0.0.0`
- [ ] `APP_ORIGIN` aponta para URL do frontend
- [ ] `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` fortes
- [ ] Build concluida com `npm run build`

## 4. Frontend

- [ ] `.env` da raiz com `VITE_API_URL` correto
- [ ] Build concluida com `npm run build`
- [ ] Frontend acessivel pela rede na porta definida

## 5. Seguranca e acesso

- [ ] Portas de app liberadas no firewall interno
- [ ] Banco nao exposto para redes externas
- [ ] Usuario TI_ADMIN validado
- [ ] Marcelo e Victor aparecem como responsaveis disponiveis por OS
- [ ] Gustavo e Geraldo possuem acesso total, mas nao aparecem como responsaveis
- [ ] Troca obrigatoria de senha validada no primeiro acesso

## 6. Servicos e disponibilidade

- [ ] PM2 instalado
- [ ] `pm2 start ecosystem.config.cjs` executado
- [ ] `pm2 save` executado
- [ ] Reinicio do servidor testado com servicos voltando automaticos
- [ ] Logs sendo coletados (`pm2 logs`)

## 7. Backup e recuperacao

- [ ] Rotina de backup diaria configurada
- [ ] Pasta de backup local definida
- [ ] Copia secundaria (NAS/disco externo) definida
- [ ] Restore de teste executado e validado

## 8. Validacao funcional

- [ ] Login SOLICITANTE funcionando
- [ ] Login TI_ADMIN funcionando
- [ ] Abertura de OS funcionando
- [ ] Comentarios e anexos funcionando
- [ ] Alteracao de status e prioridade pelo TI_ADMIN funcionando
- [ ] Dashboard e relatorios carregando
- [ ] Notificacoes funcionando

## 9. Operacao e suporte

- [ ] Responsavel interno pela operacao definido
- [ ] Procedimento de atualizacao futura validado
- [ ] Procedimento de reinicio documentado
- [ ] Procedimento de emergencia documentado
