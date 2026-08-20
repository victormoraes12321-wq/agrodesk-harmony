# 🌿 AgroDesk TI — Sistema Integrado de Gestão de T.I., Help Desk & Patrimônio

<p align="center">
  <img src="./public/logo.png" alt="AgroDesk TI Logo" width="120" />
</p>

<p align="center">
  <strong>Plataforma corporativa moderna e completa para Gestão de Ordens de Serviço (OS), Atendimentos de T.I., Controle Patrimonial / Inventário de Hardware e Comunicação Integrada via WhatsApp.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-68a063?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.0-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/NestJS-10.0-e0234e?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-5.0+-2d3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 📑 Visão Geral

O **AgroDesk TI** foi projetado para resolver de ponta a ponta a operação e o suporte de Tecnologia da Informação em empresas com múltiplas unidades (filiais, fazendas, centros de distribuição e escritórios centrais). 

Ele elimina a perda de solicitações via mensagens informais, centraliza o ciclo de vida dos equipamentos e periféricos, garante rastreabilidade e auditoria completa, calcula SLAs dinâmicos e integra-se diretamente ao WhatsApp dos colaboradores.

---

## ✨ Principais Funcionalidades

### 🎫 1. Central de Ordens de Serviço (OS) & Help Desk
- **Assistente Interativo de Criação de OS:** Formulário por etapas simples e intuitivo para o colaborador, com suporte a vínculo de equipamento/patrimônio.
- **Upload Múltiplo de Anexos sem Restrição:** Aceita qualquer tipo de arquivo (`.OFX` bancário, `.XML` de nota fiscal, `.PDF`, imagens, planilhas `.XLSX`, logs, etc.) com upload incremental, drag-and-drop e remoção individual antes do envio.
- **Central de Ações do Atendimento:** Alteração rápida de status, atribuição de técnicos responsáveis, notas públicas e anotações internas restritas à equipe de TI.
- **Checklist Técnico Operacional:** Checklist dinâmico por categoria com barra de progresso em tempo real e gravação no histórico da OS.
- **Assinatura Digital Integrada:** Coleta de assinatura em canvas digital (touch no celular/tablet ou mouse) para comprovação e encerramento do chamado com anexo automático.
- **Controle Dinâmico de SLA e Prorrogação:** Linha do tempo visual com cálculo automático de prazos, badges coloridas de urgência e modal de solicitação de prorrogação com justificativa e auditoria.
- **Encerramento Rápido no Balcão:** Opção para a equipe de TI registrar e finalizar atendimentos imediatos no mesmo ato.

### 💻 2. Módulo de Patrimônio, Ativos & Inventário de Hardware
- **Gestão de Ativos & Periféricos:** Cadastro de computadores, notebooks, monitores, impressoras, nobreaks, roteadores e periféricos com hierarquia pai-filho.
- **Topologia Visual de Hardware:** Mapa interativo em árvore dos componentes conectados a cada máquina com histórico de trocas.
- **Substituição Inteligente de Periféricos:** Troca de mouse, teclado ou monitor com 1 clique direto na tela da OS, movimentando o item antigo para manutenção e o novo para uso.
- **Etiquetador Térmico com QR Code Dinâmico:** Geração e impressão de etiquetas patrimoniais em formatos térmicos (Zebra/Argox) ou folhas A4 com QR Code para leitura rápida.
- **Importador em Massa de Planilhas (Excel/CSV):** Leitura de arquivos `.xlsx` e `.csv` com mapeamento visual automático de colunas e importação inteligente sem duplicidades.

### 📊 3. BI Executivo, Scoreboard & Relatórios Avançados
- **Painel Gerencial em Tempo Real:** Indicadores de OS abertas, em atendimento, resolvidas, taxa de cumprimento de SLA e tempo médio de atendimento (TMA).
- **Ranking / Pódio de Técnicos:** Scoreboard de produtividade dos analistas de TI com quantidade de OS resolvidas, tempo médio e satisfação dos usuários.
- **Gráficos Interativos com Drilldown:** Gráficos por categoria, setor, filial e status com clique para filtragem imediata.
- **Exportador Executivo Multi-abas:** Geração de relatórios analíticos completos em **PDF Executivo** e **Planilhas Excel (`.xlsx`)** com abas separadas por indicadores.

### 📱 4. Integração com WhatsApp & Comunicações
- **Editor Visual de Modelos:** Personalização completa de mensagens de abertura, atualização, prorrogação e encerramento com tags dinâmicas (`{solicitante}`, `{protocolo}`, `{tecnico}`, `{status}`, `{link}`).
- **Preview em Smartphone ao Vivo:** Simulador de tela de WhatsApp em tempo real com envio em 1 clique direto para o aplicativo desktop ou web.

### 👥 5. Gestão de Usuários, Portal & Segurança
- **Sincronização em Tempo Real:** Atualizações de dados cadastrais (nome, e-mail, telefone, setor) refletem instantaneamente entre sessões conectadas.
- **Base de Conhecimento / FAQ:** Portal de autoatendimento para solicitantes com pesquisa instantânea e tutoriais passo a passo.
- **Auto-Cadastro & Recuperação de Senha:** Tela de auto-cadastro para novos colaboradores e fluxo de recuperação com abertura automática de OS de suporte.
- **Segurança & Auditoria:** Autenticação JWT com Refresh Tokens revogáveis, senhas com hash Bcrypt, permissões por Role (`SOLICITANTE` e `TI_ADMIN`) e trilha de auditoria completa.

---

## 🏗️ Arquitetura do Projeto

```
agrodesk-harmony/
├── backend/                         # Backend NestJS 10 (TypeScript)
│   ├── prisma/                      # Schema do banco, migrações e seeds
│   ├── src/
│   │   ├── common/                  # Guards, decorators, filters e security
│   │   ├── infra/                   # PrismaService e storage utilities
│   │   └── modules/                 # Módulos de negócio (Tickets, Users, Assets, SLA, etc.)
│   └── tests/                       # Testes de carga e testes E2E
├── src/                             # Frontend React 18 + Vite (SPA)
│   ├── components/                  # Componentes reutilizáveis (UI, Patrimônio, Tickets)
│   ├── routes/                      # Rotas baseadas em arquivo (TanStack Router)
│   ├── services/                    # Clientes de API e comunicação HTTP
│   ├── lib/                         # Store global, validações Zod, formatadores
│   └── types/                       # Interfaces TypeScript unificadas
├── DOCUMENTACAO_TECNICA_E_FUNCIONAL_AGRODESK_TI.md  # Master Documentation Técnica
└── ecosystem.config.cjs             # Configuração para deploy com PM2
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** v20.x ou superior
- **PostgreSQL:** v14.x ou superior (ou via Docker)
- **Gerenciador de Pacotes:** `npm` (incluso no Node.js)

---

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone https://github.com/victormoraes12321-wq/agrodesk-harmony.git
cd agrodesk-harmony

# Instalar dependências da raiz (Frontend)
npm install

# Instalar dependências do Backend
cd backend
npm install
cd ..
```

---

### 2. Configurar Variáveis de Ambiente

Crie os arquivos `.env` baseados nos exemplos:

**No Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=3333
HOST=0.0.0.0

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrodesk_ti?schema=public"

JWT_ACCESS_SECRET="seu_secret_jwt_access_super_seguro_2026"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET="seu_secret_jwt_refresh_super_seguro_2026"
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_DIR=uploads
UPLOAD_MAX_MB=25

APP_ORIGIN=http://localhost:8080,http://127.0.0.1:8080
TRUST_PROXY=false
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=1200

INITIAL_ADMIN_PASSWORD=AgroDesk@2026
```

**No Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:3333/api/v1
```

---

### 3. Banco de Dados e Migrações

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..
```

---

### 4. Executar em Modo de Desenvolvimento

Execute um único comando na raiz do projeto:

```bash
npm run dev
```

- **Frontend:** `http://localhost:8080` (ou porta indicada no terminal)
- **API Backend:** `http://localhost:3333/api/v1`
- **Swagger / OpenAPI Docs:** `http://localhost:3333/api/docs`

---

## 🛡️ Usuários e Acesso Inicial

O seed padrão cria contas administrativas iniciais com a senha temporária configurada em `INITIAL_ADMIN_PASSWORD`:

| Usuário | E-mail | Perfil | Pode Receber OS |
| :--- | :--- | :--- | :---: |
| **Victor** | `victor.ti@agrodesk.com` | `TI_ADMIN` | Sim |
| **Marcelo** | `marcelo.ti@agrodesk.com` | `TI_ADMIN` | Sim |
| **Gustavo** | `gustavo@agrodesk.com` | `TI_ADMIN` (Gestor) | Não |
| **Geraldo** | `geraldo@agrodesk.com` | `TI_ADMIN` (Gestor) | Não |

---

## 📦 Produção e Deploy

Para compilar o backend e o frontend para produção:

```bash
# Compilar Backend
cd backend && npm run build && cd ..

# Compilar Frontend
npm run build

# Iniciar ambos com PM2
pm2 start ecosystem.config.cjs
```

Consulte os guias complementares para infraestrutura dedicada:
- [`INSTALL_LOCAL.md`](./INSTALL_LOCAL.md) — Guia de instalação em rede local
- [`DEPLOY_LOCAL.md`](./DEPLOY_LOCAL.md) — Implantação e serviços Windows/Linux
- [`BACKUP_RESTORE.md`](./BACKUP_RESTORE.md) — Rotinas de backup do PostgreSQL
- [`CHECKLIST_PRODUCAO.md`](./CHECKLIST_PRODUCAO.md) — Checklist pré-go-live

---

## 📄 Licença

Propriedade do projeto **AgroDesk TI**. Todos os direitos reservados.
