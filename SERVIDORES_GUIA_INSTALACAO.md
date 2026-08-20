# Guia de Implantação e Operação em Servidor: AgroDesk TI

Este documento fornece as instruções para instalar, executar e gerenciar o **AgroDesk TI** no servidor de destino.

---

## 📋 Pré-requisitos no Servidor

1. **Sistema Operacional:** Windows Server 2016 / 2019 / 2022 ou Windows 10 / 11 (64-bit).
2. **Node.js:** Versão 18 ou 20 LTS (o script `setup_servidor.bat` instala automaticamente se não estiver presente).
3. **PostgreSQL:** Versão 15 ou 16 com o banco de dados `agrodesk_ti` criado.

---

## 🚀 Passo a Passo para Implantação

1. Copie a pasta do projeto `agrodesk-harmony-main` para o servidor (exemplo: `C:\AgroDeskTI`).
2. Abra a pasta do projeto.
3. Clique com o botão direito no arquivo **`setup_servidor.bat`** e selecione **"Executar como Administrador"**.

O script irá:
- Verificar e instalar o Node.js LTS (caso necessário).
- Instalar todas as dependências npm do Frontend e Backend.
- Rodar as migrações do banco de dados no Prisma (`npx prisma migrate deploy`).
- Compilar o backend e o frontend para produção (`npm run build`).
- Configurar o **PM2** para gerenciar os processos em segundo plano.
- Registrar o serviço na inicialização do Windows (**Startup Folder / PM2 Startup**), garantindo que o sistema reinicie automaticamente caso o servidor caia ou seja reiniciado.

---

## 💻 Como Iniciar e Gerenciar o Sistema

Na raiz do projeto existem 4 scripts executáveis `.bat` prontos para uso:

| Arquivo | Descrição |
| :--- | :--- |
| **`iniciar_sistema.bat`** | Inicia os serviços do AgroDesk TI e abre a página de login no navegador. |
| **`parar_sistema.bat`** | Interrompe todos os processos do sistema com segurança. |
| **`status_sistema.bat`** | Exibe o status de saúde dos serviços, uso de CPU, memória e logs em tempo real. |
| **`reiniciar_sistema.bat`** | Reinicia imediatamente o backend e frontend (útil após atualizações). |

---

## 🌐 Endereços e Portas de Acesso (Sem Conflitos)

Para evitar conflitos com os outros sistemas no servidor (que utilizam a porta `:3000`), o **AgroDesk TI** utiliza portas dedicadas:

- **Frontend Web (Produção):** `http://localhost:3001/login` (ou `http://<IP-DO-SERVIDOR>:3001/login`)
- **API Backend:** `http://localhost:3333/api/v1`

---

## 🔀 Configuração do Caddy (Reverse Proxy)

Se você utiliza o **Caddy** para gerenciar múltiplos sistemas e domínios personalizados no mesmo servidor (portas 80 / 443), adicione a seguinte regra ao seu arquivo `Caddyfile` (consulte também o modelo em `Caddyfile.example`):

```caddyfile
ti.suaempresa.com.br {
    # 1. Redireciona chamadas de API para o Backend (porta 3333)
    handle /api/* {
        reverse_proxy localhost:3333
    }

    # 2. Redireciona a Interface Web para o Frontend (porta 3001)
    handle {
        reverse_proxy localhost:3001
    }
}
```

---

## 🔐 Senhas de Acesso Inicial
- Todos os usuários ativos têm como senha inicial de primeiro acesso: `MudaSenha@123`.
- No primeiro login, o sistema exige obrigatoriamente que o usuário defina sua nova senha pessoal antes de acessar as telas de suporte.
