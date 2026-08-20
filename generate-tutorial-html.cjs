/**
 * Gerador do Tutorial HTML Completo do AgroDesk TI
 * Embeda todas as capturas de tela como base64 para PDF perfeito.
 */
const fs = require('fs');

const b64 = JSON.parse(fs.readFileSync('prints_b64.json', 'utf8'));

function img(file, alt) {
  const data = b64[file];
  if (!data) return `<div class="img-missing">Imagem não encontrada: ${file}</div>`;
  return `<img src="data:image/png;base64,${data}" alt="${alt}" class="screen-shot" />`;
}

function callout(icon, color, title, body) {
  return `<div class="callout callout-${color}">
    <div class="callout-icon">${icon}</div>
    <div><strong>${title}</strong> ${body}</div>
  </div>`;
}

function step(num, title, desc) {
  return `<div class="step"><div class="step-num">${num}</div><div><strong>${title}</strong><br/>${desc}</div></div>`;
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Manual do Usuário — AgroDesk TI | Casa do Campo</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green: #1a7a3a;
    --green-light: #e8f5ee;
    --green-dark: #145f2d;
    --accent: #2ecc71;
    --text: #1a202c;
    --muted: #718096;
    --border: #e2e8f0;
    --bg: #f8fafc;
    --white: #ffffff;
    --warning: #f59e0b;
    --info: #3b82f6;
    --danger: #ef4444;
    --radius: 12px;
    --shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13.5px;
    color: var(--text);
    background: var(--white);
    line-height: 1.65;
  }

  /* ── CAPA ────────────────────────────────────── */
  .cover {
    background: linear-gradient(145deg, #0d4a23 0%, #1a7a3a 50%, #2ecc71 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover-logo {
    width: 90px; height: 90px;
    background: rgba(255,255,255,0.15);
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    font-size: 48px;
    margin-bottom: 32px;
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255,255,255,0.25);
  }
  .cover h1 { font-size: 46px; font-weight: 800; color: #fff; line-height: 1.1; }
  .cover h2 { font-size: 20px; font-weight: 400; color: rgba(255,255,255,0.8); margin-top: 10px; }
  .cover-divider { width: 80px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 4px; margin: 32px auto; }
  .cover-meta { color: rgba(255,255,255,0.7); font-size: 14px; line-height: 2; }
  .cover-meta strong { color: #fff; }
  .cover-badge {
    margin-top: 48px;
    display: inline-flex; gap: 12px;
  }
  .badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
  }

  /* ── ÍNDICE ──────────────────────────────────── */
  .toc-page {
    padding: 60px 80px;
    page-break-after: always;
  }
  .toc-page h2 { font-size: 28px; font-weight: 700; color: var(--green); margin-bottom: 8px; }
  .toc-page p.sub { color: var(--muted); margin-bottom: 32px; }
  .toc-section { margin-bottom: 6px; }
  .toc-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    border-left: 3px solid var(--green-light);
    margin-bottom: 3px;
  }
  .toc-item:hover { background: var(--green-light); }
  .toc-num {
    min-width: 28px; height: 28px;
    background: var(--green);
    color: #fff;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
  }
  .toc-label { font-weight: 500; flex: 1; }
  .toc-dots { flex: 1; border-bottom: 1px dotted var(--border); }
  .toc-page-num { color: var(--muted); font-size: 12px; }

  /* ── CAPÍTULOS ───────────────────────────────── */
  .chapter {
    padding: 50px 80px;
    page-break-before: always;
  }
  .chapter-header {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 36px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--green-light);
  }
  .chapter-num {
    width: 52px; height: 52px;
    background: var(--green);
    color: #fff;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800;
    flex-shrink: 0;
  }
  .chapter-title { font-size: 26px; font-weight: 700; }
  .chapter-sub { color: var(--muted); font-size: 14px; margin-top: 2px; }

  h3.section-title {
    font-size: 17px; font-weight: 700;
    color: var(--green-dark);
    margin: 32px 0 14px;
    display: flex; align-items: center; gap: 8px;
  }
  h3.section-title::before {
    content: '';
    display: inline-block;
    width: 4px; height: 20px;
    background: var(--green);
    border-radius: 3px;
  }

  p { margin-bottom: 12px; }

  /* ── SCREENSHOTS ─────────────────────────────── */
  .screen-wrap {
    margin: 24px 0;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
  }
  .screen-caption {
    background: #1a202c;
    color: #a0aec0;
    padding: 8px 16px;
    font-size: 11px;
    font-family: monospace;
    display: flex; align-items: center; gap: 8px;
  }
  .screen-caption::before {
    content: '●';
    color: #fc8181;
    font-size: 14px;
  }
  .screen-caption::after {
    content: ' ● ●';
    color: #f6ad55;
    font-size: 14px;
    margin-left: -4px;
  }
  .screen-shot {
    display: block;
    width: 100%;
    height: auto;
  }
  .img-missing {
    background: #fee2e2;
    color: #c53030;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    border-radius: 8px;
  }

  /* ── CALLOUTS ────────────────────────────────── */
  .callout {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 14px 18px;
    border-radius: 10px;
    margin: 16px 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .callout-green { background: #e6f4ec; border-left: 4px solid var(--green); }
  .callout-blue  { background: #eff6ff; border-left: 4px solid var(--info); }
  .callout-yellow { background: #fffbeb; border-left: 4px solid var(--warning); }
  .callout-red   { background: #fff1f2; border-left: 4px solid var(--danger); }
  .callout-icon  { font-size: 20px; flex-shrink: 0; margin-top: 1px; }

  /* ── STEPS ────────────────────────────────────── */
  .steps { margin: 20px 0; }
  .step {
    display: flex; gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .step:last-child { border-bottom: none; }
  .step-num {
    min-width: 30px; height: 30px;
    background: var(--green);
    color: #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    flex-shrink: 0;
  }

  /* ── FIELD TABLE ─────────────────────────────── */
  .field-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  .field-table th {
    background: var(--green);
    color: #fff;
    padding: 9px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .field-table td { padding: 9px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
  .field-table tr:nth-child(even) td { background: #f8fafc; }
  .req { color: var(--danger); font-weight: 600; font-size: 11px; }
  .opt { color: var(--muted); font-size: 11px; }

  /* ── STATUS PILLS ────────────────────────────── */
  .pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  .pill {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    display: flex; align-items: center; gap: 5px;
  }
  .pill-dot { width: 7px; height: 7px; border-radius: 50%; }
  .pill-green { background: #d1fae5; color: #065f46; }
  .pill-blue  { background: #dbeafe; color: #1e40af; }
  .pill-yellow { background: #fef3c7; color: #92400e; }
  .pill-red   { background: #fee2e2; color: #991b1b; }
  .pill-purple { background: #ede9fe; color: #5b21b6; }
  .pill-gray  { background: #f1f5f9; color: #475569; }

  /* ── INFO GRID ───────────────────────────────── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }
  .info-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }
  .info-card .ic-title { font-weight: 600; font-size: 13px; margin-bottom: 6px; color: var(--green-dark); }
  .info-card .ic-body { font-size: 12.5px; color: var(--muted); }

  /* ── FOOTER ──────────────────────────────────── */
  .footer {
    text-align: center;
    padding: 40px;
    color: var(--muted);
    font-size: 12px;
    border-top: 1px solid var(--border);
    margin-top: 60px;
  }

  @media print {
    body { font-size: 12px; }
    .chapter { padding: 40px 60px; }
    .cover { min-height: 100vh; }
    .screen-shot { max-width: 100%; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════ -->
<!--  CAPA                                                       -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-logo">🌿</div>
  <h1>AgroDesk TI</h1>
  <h2>Manual Completo do Usuário</h2>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <strong>Casa do Campo — Agropecuária</strong><br/>
    Central de Help Desk e Ordens de Serviço<br/>
    Versão 2026 · Departamento de TI
  </div>
  <div class="cover-badge">
    <span class="badge">📋 Guia Passo a Passo</span>
    <span class="badge">🖥️ Capturas de Tela Reais</span>
    <span class="badge">🔒 Uso Interno</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!--  ÍNDICE                                                     -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="toc-page">
  <h2>Índice</h2>
  <p class="sub">Navegue por capítulo clicando nos itens abaixo.</p>

  <div style="margin-top:20px;">
    <div class="toc-item"><div class="toc-num">1</div><span class="toc-label">O que é o AgroDesk TI?</span></div>
    <div class="toc-item"><div class="toc-num">2</div><span class="toc-label">Como acessar o sistema — Tela de Login</span></div>
    <div class="toc-item"><div class="toc-num">3</div><span class="toc-label">Cadastro de novo usuário</span></div>
    <div class="toc-item"><div class="toc-num">4</div><span class="toc-label">Portal do Solicitante — Visão geral</span></div>
    <div class="toc-item"><div class="toc-num">5</div><span class="toc-label">Abrindo uma Ordem de Serviço (OS) — Passo a passo</span></div>
    <div class="toc-item"><div class="toc-num">6</div><span class="toc-label">Acompanhando seus chamados</span></div>
    <div class="toc-item"><div class="toc-num">7</div><span class="toc-label">Detalhe de uma OS — O que cada campo significa</span></div>
    <div class="toc-item"><div class="toc-num">8</div><span class="toc-label">Visão do Técnico de TI — Gestão de Chamados</span></div>
    <div class="toc-item"><div class="toc-num">9</div><span class="toc-label">Detalhe da OS — Painel do Técnico TI</span></div>
    <div class="toc-item"><div class="toc-num">10</div><span class="toc-label">Relatórios Gerenciais</span></div>
    <div class="toc-item"><div class="toc-num">11</div><span class="toc-label">Patrimônio e Inventário de Ativos</span></div>
    <div class="toc-item"><div class="toc-num">12</div><span class="toc-label">Gestão de Usuários</span></div>
    <div class="toc-item"><div class="toc-num">13</div><span class="toc-label">Configurações do Sistema</span></div>
    <div class="toc-item"><div class="toc-num">14</div><span class="toc-label">Auditoria e Rastreabilidade</span></div>
    <div class="toc-item"><div class="toc-num">15</div><span class="toc-label">Status, SLA e prioridades — Entendendo os indicadores</span></div>
    <div class="toc-item"><div class="toc-num">16</div><span class="toc-label">Perguntas frequentes (FAQ)</span></div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 1 — O QUE É O AGRODESK TI                             -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">1</div>
    <div>
      <div class="chapter-title">O que é o AgroDesk TI?</div>
      <div class="chapter-sub">Entenda o propósito e os benefícios do sistema</div>
    </div>
  </div>

  <p>O <strong>AgroDesk TI</strong> é a plataforma interna de suporte técnico da <strong>Casa do Campo</strong>. Ele centraliza todo o fluxo de chamados de TI: desde a abertura de uma solicitação por qualquer colaborador, até a resolução técnica pela equipe de TI, com registro completo e rastreabilidade.</p>

  <div class="info-grid">
    <div class="info-card">
      <div class="ic-title">🎯 Para colaboradores (Solicitantes)</div>
      <div class="ic-body">Abra chamados de forma rápida, acompanhe o andamento em tempo real e receba notificações sobre cada atualização.</div>
    </div>
    <div class="info-card">
      <div class="ic-title">🔧 Para a equipe de TI</div>
      <div class="ic-body">Gerencie todas as OSs com controle de SLA, prioridade, técnico responsável, kanban e relatórios completos.</div>
    </div>
    <div class="info-card">
      <div class="ic-title">📊 Para a gestão</div>
      <div class="ic-body">Acesse relatórios em tempo real de desempenho, tempo médio, SLA cumprido, chamados por setor e filial.</div>
    </div>
    <div class="info-card">
      <div class="ic-title">🖥️ Patrimônio / Inventário</div>
      <div class="ic-body">Controle completo do inventário de TI: computadores, periféricos, nobreaks, com movimentação e manutenção registradas.</div>
    </div>
  </div>

  ${callout('✅', 'green', 'Acesso pelo navegador:', 'O sistema funciona diretamente no navegador — não precisa instalar nenhum programa. Basta acessar o endereço interno fornecido pela TI.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 2 — TELA DE LOGIN                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">2</div>
    <div>
      <div class="chapter-title">Como acessar o sistema — Tela de Login</div>
      <div class="chapter-sub">Primeira tela que aparece ao acessar o AgroDesk TI</div>
    </div>
  </div>

  <p>Ao abrir o sistema no navegador, você verá a tela de login abaixo. Esta é a porta de entrada para todos os usuários do sistema.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Tela de Login</div>
    ${img('tutorial_01_tela_login.png', 'Tela de Login')}
  </div>

  <h3 class="section-title">O que preencher?</h3>
  <table class="field-table">
    <thead><tr><th>Campo</th><th>O que é</th><th>Exemplo</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>Nome de usuário</strong> <span class="req">*Obrigatório</span></td>
        <td>O seu nome de usuário cadastrado pela TI. Geralmente no formato <code>nome.sobrenome</code>.</td>
        <td><code>carolina.silva</code></td>
      </tr>
      <tr>
        <td><strong>Senha</strong> <span class="req">*Obrigatório</span></td>
        <td>A senha pessoal cadastrada por você. Na primeira vez, use a senha temporária fornecida pela TI.</td>
        <td><em>Mínimo 8 caracteres</em></td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">Passo a passo para entrar</h3>
  <div class="steps">
    ${step(1, 'Digite seu nome de usuário', 'Ex: <code>carolina.silva</code> (sem espaços e sem @)')}
    ${step(2, 'Digite sua senha', 'A senha é sensível a maiúsculas/minúsculas')}
    ${step(3, 'Clique em "Entrar"', 'Você será redirecionado ao portal conforme seu perfil')}
  </div>

  ${callout('💡', 'blue', 'Primeiro acesso:', 'Se for seu primeiro acesso, a TI fornecerá uma senha temporária. Ao entrar com ela, o sistema pedirá que você defina uma senha pessoal antes de continuar.')}
  ${callout('🔑', 'yellow', '"Esqueci minha senha":', 'Clique no link "Esqueci minha senha" na tela de login. O sistema enviará um link de recuperação para o e-mail cadastrado. Caso não tenha e-mail cadastrado, fale com a TI.')}
  ${callout('👤', 'green', 'Ainda não tem usuário?', 'Clique em "Cadastre-se para abrir Ordens de Serviço" na tela de login para criar sua conta. Veja o Capítulo 3 para o passo a passo.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 3 — CADASTRO                                           -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">3</div>
    <div>
      <div class="chapter-title">Cadastro de novo usuário</div>
      <div class="chapter-sub">Como criar sua conta no AgroDesk TI</div>
    </div>
  </div>

  <p>Qualquer colaborador da empresa pode criar sua própria conta clicando no link da tela de login. O cadastro é simples e leva menos de 2 minutos.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Cadastro de Solicitante</div>
    ${img('tutorial_02_cadastro_usuario.png', 'Tela de Cadastro')}
  </div>

  <h3 class="section-title">Preenchimento dos campos</h3>

  <table class="field-table">
    <thead><tr><th>Seção</th><th>Campo</th><th>Como preencher</th></tr></thead>
    <tbody>
      <tr><td rowspan="4"><strong>1. Dados Pessoais</strong></td><td>Nome completo <span class="req">*</span></td><td>Seu nome completo como aparece no crachá</td></tr>
      <tr><td>Nome de usuário <span class="req">*</span></td><td>Crie no formato <code>nome.sobrenome</code> — este será seu login</td></tr>
      <tr><td>E-mail <span class="opt">(opcional)</span></td><td>Seu e-mail da empresa. Usado para recuperação de senha e notificações</td></tr>
      <tr><td>Senha e Confirmação <span class="req">*</span></td><td>Mínimo de 8 caracteres. Use letras e números para maior segurança</td></tr>
      <tr><td rowspan="2"><strong>2. Unidade</strong></td><td>Setor / Departamento <span class="req">*</span></td><td>Selecione na lista o setor onde você trabalha (ex: Financeiro, Gerência, Vendas)</td></tr>
      <tr><td>Filial / Unidade <span class="req">*</span></td><td>Selecione a filial/loja onde você está alocado</td></tr>
      <tr><td rowspan="3"><strong>3. Contato</strong></td><td>Telefone <span class="opt">(opcional)</span></td><td>Celular para contato rápido da TI</td></tr>
      <tr><td>WhatsApp <span class="opt">(opcional)</span></td><td>Se diferente do telefone</td></tr>
      <tr><td>Ramal <span class="opt">(opcional)</span></td><td>Ramal interno, se houver</td></tr>
    </tbody>
  </table>

  ${callout('✅', 'green', 'Após o cadastro:', 'Sua conta é criada com perfil de <strong>Solicitante</strong>. Você poderá abrir OSs imediatamente. Caso precise de acesso técnico, solicite à TI.')}
  ${callout('⚠️', 'yellow', 'Nome de usuário único:', 'O nome de usuário não pode ser alterado depois. Escolha bem no formato nome.sobrenome.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 4 — PORTAL DO SOLICITANTE                              -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">4</div>
    <div>
      <div class="chapter-title">Portal do Solicitante — Visão geral</div>
      <div class="chapter-sub">A tela inicial após o login de colaborador</div>
    </div>
  </div>

  <p>Após fazer login, o colaborador (Solicitante) é direcionado ao <strong>Portal do Solicitante</strong> — a central de gerenciamento dos seus chamados.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Portal do Solicitante (visão da Carolina Silva)</div>
    ${img('tutorial_03_portal_solicitante_chamados.png', 'Portal do Solicitante')}
  </div>

  <h3 class="section-title">Elementos da tela</h3>
  <table class="field-table">
    <thead><tr><th>Elemento</th><th>Para que serve</th></tr></thead>
    <tbody>
      <tr><td><strong>🟢 Botão "Abrir OS"</strong> (topo direito)</td><td>Abre um novo chamado de TI rapidamente a qualquer momento</td></tr>
      <tr><td><strong>Menu lateral — Portal</strong></td><td>Tela inicial com resumo dos seus chamados</td></tr>
      <tr><td><strong>Menu lateral — Abrir nova OS</strong></td><td>Formulário de abertura de chamado</td></tr>
      <tr><td><strong>Menu lateral — Meus chamados</strong></td><td>Lista completa de todas as suas OSs abertas</td></tr>
      <tr><td><strong>Menu lateral — Meu perfil</strong></td><td>Editar seus dados, trocar senha, atualizar telefone</td></tr>
      <tr><td><strong>Cards de contagem (centro)</strong></td><td>Quantas OSs você tem em cada status: Meus abertos / Em atendimento / Aguardando retorno / Concluídos</td></tr>
      <tr><td><strong>"Meus chamados recentes"</strong></td><td>Lista dos últimos chamados com busca e filtro por status</td></tr>
      <tr><td><strong>🔔 Sino (topo)</strong></td><td>Notificações de atualizações nas suas OSs</td></tr>
      <tr><td><strong>🌙 Ícone de tema (topo)</strong></td><td>Alterna entre modo claro e escuro</td></tr>
    </tbody>
  </table>

  ${callout('🔄', 'blue', 'Atualização automática:', 'A lista de chamados se atualiza automaticamente em tempo real, sem precisar recarregar a página.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 5 — ABERTURA DE OS                                     -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">5</div>
    <div>
      <div class="chapter-title">Abrindo uma Ordem de Serviço (OS)</div>
      <div class="chapter-sub">Guia completo passo a passo para abrir um chamado</div>
    </div>
  </div>

  <p>Para abrir um chamado de TI, clique em <strong>"Abrir nova OS"</strong> no menu lateral ou no botão verde no topo. O formulário é dividido em <strong>5 etapas simples</strong>:</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Formulário de Abertura de OS (Etapa 1 de 5)</div>
    ${img('tutorial_04_nova_os_etapa1.png', 'Formulário Nova OS')}
  </div>

  ${callout('⏱️', 'green', 'Tempo médio de preenchimento:', 'Apenas 45 segundos! O formulário é inteligente — já preenche automaticamente seus dados pessoais do perfil.')}

  <h3 class="section-title">Etapa 1 — Como podemos falar com você?</h3>
  <table class="field-table">
    <thead><tr><th>Campo</th><th>Instrução</th></tr></thead>
    <tbody>
      <tr><td><strong>Nome do solicitante</strong> <span class="req">*</span></td><td>Já vem preenchido com seu nome. Confirme se está correto.</td></tr>
      <tr><td><strong>Telefone</strong> <span class="req">*</span></td><td>Já vem do seu perfil. Atualize se necessário para a TI entrar em contato.</td></tr>
      <tr><td><strong>E-mail</strong> <span class="opt">(opcional)</span></td><td>Para receber notificações por e-mail sobre o chamado.</td></tr>
    </tbody>
  </table>
  <p>Clique em <strong>"Próxima etapa →"</strong> para continuar.</p>

  <h3 class="section-title">Etapa 2 — Onde está acontecendo?</h3>
  <table class="field-table">
    <thead><tr><th>Campo</th><th>Instrução</th></tr></thead>
    <tbody>
      <tr><td><strong>Setor</strong> <span class="req">*</span></td><td>Seu setor já vem preenchido. Altere se o problema for em outro local.</td></tr>
      <tr><td><strong>Filial / Local</strong> <span class="req">*</span></td><td>Sua filial já vem preenchida. Confirme.</td></tr>
      <tr><td><strong>Sala/Mesa</strong> <span class="opt">(opcional)</span></td><td>Informe o local exato para facilitar o atendimento (ex: "Mesa 3 da sala comercial").</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Etapa 3 — O que está acontecendo?</h3>
  <table class="field-table">
    <thead><tr><th>Campo</th><th>Instrução</th></tr></thead>
    <tbody>
      <tr><td><strong>Categoria</strong> <span class="req">*</span></td><td>Selecione o tipo do problema: <em>Hardware, Software, Acesso/Senha, Internet, Impressora, Câmeras</em>, etc.</td></tr>
      <tr><td><strong>Título / Assunto</strong> <span class="req">*</span></td><td>Descreva em poucas palavras o problema. Ex: <em>"Computador não liga"</em>, <em>"Não consigo acessar o sistema"</em></td></tr>
      <tr><td><strong>Descrição detalhada</strong> <span class="req">*</span></td><td>Explique o problema com o máximo de detalhes: quando começou, o que aparece na tela, o que já tentou fazer.</td></tr>
      <tr><td><strong>Prioridade sugerida</strong> <span class="opt">(opcional)</span></td><td>Se o problema está parando seu trabalho totalmente, marque como <strong>Alta</strong>. A TI avaliará e pode ajustar.</td></tr>
      <tr><td><strong>Equipamento</strong> <span class="opt">(opcional)</span></td><td>Se souber o patrimônio do equipamento com problema, informe.</td></tr>
    </tbody>
  </table>

  ${callout('💡', 'blue', 'Dica de boa descrição:', 'Quanto mais detalhes você informar, mais rápido a TI resolve! Informe: qual programa está com problema, qual mensagem de erro aparece, desde quando ocorre, se mais alguém está com o mesmo problema.')}

  <h3 class="section-title">Etapa 4 — Tem print ou imagem?</h3>
  <p>Esta etapa é <strong>opcional</strong> mas muito útil. Se seu problema aparece na tela, tire um print e anexe aqui. Aceita imagens (PNG, JPG) e arquivos (PDF, DOC). Clique em <strong>"Adicionar arquivo"</strong> ou arraste o arquivo para a área.</p>

  <h3 class="section-title">Etapa 5 — Revisão e envio</h3>
  <p>Revise todas as informações preenchidas. Se estiver tudo correto, clique no botão <strong>"Abrir Ordem de Serviço"</strong>. O sistema gerará um número de protocolo único (ex: <code>OS-2026-00004</code>) e a TI receberá a notificação imediatamente.</p>

  ${callout('✅', 'green', 'Após abrir a OS:', 'Você receberá o número de protocolo. Guarde-o para acompanhar o chamado. A TI entrará em contato pelo telefone informado se necessário.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 6 — ACOMPANHANDO CHAMADOS                              -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">6</div>
    <div>
      <div class="chapter-title">Acompanhando seus chamados</div>
      <div class="chapter-sub">Como verificar o status e histórico dos seus chamados</div>
    </div>
  </div>

  <p>Acesse <strong>"Meus chamados"</strong> no menu lateral para ver a lista completa de todos os chamados que você abriu.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Meus Chamados (lista do solicitante)</div>
    ${img('tutorial_05_chamados_lista_com_os.png', 'Lista de Chamados')}
  </div>

  <h3 class="section-title">Entendendo os status</h3>
  <div class="pills">
    <span class="pill pill-blue"><span class="pill-dot" style="background:#3b82f6"></span> Aberto</span>
    <span class="pill pill-yellow"><span class="pill-dot" style="background:#f59e0b"></span> Em atendimento</span>
    <span class="pill pill-purple"><span class="pill-dot" style="background:#8b5cf6"></span> Aguardando você</span>
    <span class="pill pill-gray"><span class="pill-dot" style="background:#94a3b8"></span> Aguardando peça</span>
    <span class="pill pill-green"><span class="pill-dot" style="background:#10b981"></span> Resolvido</span>
    <span class="pill pill-green"><span class="pill-dot" style="background:#059669"></span> Finalizado</span>
    <span class="pill pill-red"><span class="pill-dot" style="background:#ef4444"></span> Cancelado</span>
  </div>
  <table class="field-table">
    <thead><tr><th>Status</th><th>O que significa</th><th>O que você deve fazer</th></tr></thead>
    <tbody>
      <tr><td><strong>Aberto</strong></td><td>OS criada, aguardando a TI assumir</td><td>Aguardar — a TI responderá em breve</td></tr>
      <tr><td><strong>Em atendimento</strong></td><td>Um técnico já está cuidando do seu chamado</td><td>Aguardar — pode ser contatado pelo técnico</td></tr>
      <tr><td><strong>Aguardando você</strong></td><td>A TI precisa de uma resposta ou ação sua</td><td>⚠️ <strong>Acesse o chamado e responda!</strong></td></tr>
      <tr><td><strong>Aguardando peça</strong></td><td>O técnico aguarda chegada de peça/material</td><td>Aguardar — prazo será informado</td></tr>
      <tr><td><strong>Resolvido</strong></td><td>A TI marcou como resolvido — aguarda sua confirmação</td><td>✅ Confirme que está funcionando ou reabra</td></tr>
      <tr><td><strong>Finalizado</strong></td><td>Chamado encerrado com sucesso</td><td>Avalie o atendimento se solicitado</td></tr>
      <tr><td><strong>Cancelado</strong></td><td>OS cancelada por você ou pela TI</td><td>Se necessário, abra um novo chamado</td></tr>
    </tbody>
  </table>

  ${callout('⚠️', 'yellow', '"Aguardando você" é urgente:', 'Quando seu chamado estiver com este status, a TI precisa de uma informação sua para continuar. Acesse o chamado e responda no comentário o mais rápido possível.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 7 — DETALHE DA OS (SOLICITANTE)                       -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">7</div>
    <div>
      <div class="chapter-title">Detalhe de uma OS — Visão do Solicitante</div>
      <div class="chapter-sub">Como ler e interagir com um chamado aberto</div>
    </div>
  </div>

  <p>Clique em qualquer chamado da lista para ver todos os detalhes, histórico e comentários.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Detalhe de OS (Visão do Solicitante)</div>
    ${img('tutorial_06_detalhe_os_solicitante.png', 'Detalhe da OS - Solicitante')}
  </div>

  <h3 class="section-title">O que você pode fazer nesta tela</h3>
  <table class="field-table">
    <thead><tr><th>Ação</th><th>Como fazer</th></tr></thead>
    <tbody>
      <tr><td>Ver o protocolo da OS</td><td>Número no topo (ex: OS-2026-00003) — anote para referências</td></tr>
      <tr><td>Ver o status atual</td><td>Badge colorido ao lado do título</td></tr>
      <tr><td>Ver o técnico responsável</td><td>Campo "Responsável" no painel de informações</td></tr>
      <tr><td>Ler comentários da TI</td><td>Seção de comentários / histórico na parte inferior</td></tr>
      <tr><td>Responder a TI</td><td>Use o campo de texto na seção de comentários</td></tr>
      <tr><td>Ver prazo (SLA)</td><td>Indicador de tempo no painel lateral</td></tr>
      <tr><td>Confirmar resolução</td><td>Se status for "Resolvido", clique em "Confirmar resolução"</td></tr>
      <tr><td>Avaliar atendimento</td><td>Quando finalizado, avalie de 1 a 5 estrelas</td></tr>
    </tbody>
  </table>

  ${callout('📝', 'blue', 'Comentários são importantes:', 'Use a área de comentários para dar retorno à TI. Todos os comentários ficam registrados no histórico da OS.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 8 — PAINEL TÉCNICO TI                                  -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">8</div>
    <div>
      <div class="chapter-title">Gestão de Chamados — Painel do Técnico TI</div>
      <div class="chapter-sub">Visão exclusiva da equipe de TI (TI Admin / TI Técnico)</div>
    </div>
  </div>

  <p>O técnico de TI possui acesso ao painel completo de gestão de chamados, com filtros avançados, ações rápidas e visão de todos os chamados de todas as filiais.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Gestão de Chamados (Visão TI Admin: Victor Moraes)</div>
    ${img('tutorial_07_dashboard_admin_chamados.png', 'Gestão de Chamados TI')}
  </div>

  <h3 class="section-title">Filtros disponíveis</h3>
  <table class="field-table">
    <thead><tr><th>Filtro</th><th>Para que serve</th></tr></thead>
    <tbody>
      <tr><td><strong>Status</strong></td><td>Mostrar apenas OSs abertas, em atendimento, aguardando, etc.</td></tr>
      <tr><td><strong>Prioridade</strong></td><td>Filtrar por Crítica, Alta, Média ou Baixa</td></tr>
      <tr><td><strong>Responsável</strong></td><td>Ver apenas os chamados de um técnico específico</td></tr>
      <tr><td><strong>Setor</strong></td><td>Filtrar por departamento (Financeiro, Vendas, etc.)</td></tr>
      <tr><td><strong>Filial</strong></td><td>Filtrar por unidade/loja</td></tr>
      <tr><td><strong>Categoria</strong></td><td>Filtrar por tipo de problema (Hardware, Software, etc.)</td></tr>
      <tr><td><strong>SLA</strong></td><td>Ver apenas OSs com SLA dentro do prazo ou vencidas</td></tr>
      <tr><td><strong>Período</strong></td><td>Filtrar por data de abertura</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Ações rápidas em cada OS</h3>
  <div class="pills">
    <span class="pill pill-blue">👁️ Detalhe</span>
    <span class="pill pill-green">✋ Assumir</span>
    <span class="pill pill-yellow">⏳ Em atendimento</span>
    <span class="pill pill-purple">⏸️ Aguardar resposta</span>
    <span class="pill pill-green">✅ Resolver</span>
    <span class="pill pill-gray">💬 WhatsApp</span>
  </div>
  <p>Essas ações permitem atualizar o status da OS sem nem precisar abrir a tela de detalhe — agilizando muito o trabalho no dia a dia.</p>

  ${callout('📌', 'blue', 'Indicador SLA (barra de progresso):', 'Cada chamado exibe uma barra colorida de SLA. Verde = dentro do prazo | Amarelo = prazo próximo | Vermelho = vencido. O número ao lado mostra o percentual do tempo já consumido.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 9 — DETALHE DA OS (TÉCNICO TI)                        -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">9</div>
    <div>
      <div class="chapter-title">Detalhe da OS — Painel completo do Técnico TI</div>
      <div class="chapter-sub">Controle total sobre cada chamado</div>
    </div>
  </div>

  <p>O técnico tem acesso a uma visão muito mais completa da OS, com campos técnicos, controle de SLA, edição e histórico de auditoria.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Detalhe de OS (Visão TI Admin)</div>
    ${img('tutorial_08_detalhe_os_tecnico_ti.png', 'Detalhe OS - Técnico TI')}
  </div>

  <h3 class="section-title">Campos exclusivos do técnico</h3>
  <table class="field-table">
    <thead><tr><th>Campo / Ação</th><th>Para que serve</th></tr></thead>
    <tbody>
      <tr><td><strong>Status</strong> (dropdown)</td><td>Alterar o status da OS: Aberto → Em atendimento → Aguardando → Resolvido</td></tr>
      <tr><td><strong>Prioridade real</strong></td><td>O técnico pode corrigir a prioridade sugerida pelo solicitante</td></tr>
      <tr><td><strong>Responsável</strong></td><td>Atribuir a OS a um técnico específico da equipe</td></tr>
      <tr><td><strong>Botões: Resolver / Finalizar / Reabrir / Cancelar</strong></td><td>Ações principais de ciclo de vida da OS</td></tr>
      <tr><td><strong>SLA e ações rápidas</strong> (painel lateral)</td><td>Ver prazo, tempo restante, e mudar status rapidamente</td></tr>
      <tr><td><strong>Diagnóstico / Causa raiz / Solução</strong></td><td>Documentar tecnicamente o que foi encontrado e o que foi feito</td></tr>
      <tr><td><strong>Peças utilizadas</strong></td><td>Registrar materiais usados no atendimento</td></tr>
      <tr><td><strong>Notas internas</strong></td><td>Anotações visíveis apenas pela equipe de TI</td></tr>
      <tr><td><strong>Patrimônio vinculado</strong></td><td>Associar o chamado a um ativo do inventário</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Estendendo o prazo SLA</h3>
  <p>Se o problema exigir tempo adicional (aguardando peça, programação especial, etc.), o técnico pode estender o prazo da OS diretamente na tela de detalhe, informando a nova quantidade de horas. Isso evita que a OS seja marcada como SLA vencido indevidamente.</p>

  ${callout('📋', 'blue', 'Histórico completo:', 'Todo clique, toda alteração de status, todo comentário é registrado automaticamente no histórico da OS com data, hora e usuário responsável. Isso garante rastreabilidade total.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 10 — RELATÓRIOS                                        -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">10</div>
    <div>
      <div class="chapter-title">Relatórios Gerenciais</div>
      <div class="chapter-sub">Indicadores de desempenho da equipe de TI</div>
    </div>
  </div>

  <p>Acesse o menu <strong>"Relatórios"</strong> no painel da TI para ver os indicadores de desempenho consolidados.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Relatórios Gerenciais</div>
    ${img('tutorial_09_relatorios.png', 'Relatórios')}
  </div>

  <h3 class="section-title">Indicadores disponíveis</h3>
  <table class="field-table">
    <thead><tr><th>Indicador</th><th>O que mostra</th></tr></thead>
    <tbody>
      <tr><td><strong>OS no período</strong></td><td>Total de chamados abertos no intervalo de tempo selecionado</td></tr>
      <tr><td><strong>SLA cumprido</strong></td><td>Quantas OSs foram resolvidas dentro do prazo</td></tr>
      <tr><td><strong>SLA vencido</strong></td><td>Quantas OSs ultrapassaram o prazo de atendimento</td></tr>
      <tr><td><strong>Tempo médio</strong></td><td>Tempo médio de resolução das OSs no período</td></tr>
      <tr><td><strong>Satisfação média</strong></td><td>Média das avaliações dadas pelos solicitantes</td></tr>
      <tr><td><strong>OS por período</strong></td><td>Gráfico de evolução de chamados ao longo do tempo</td></tr>
      <tr><td><strong>SLA cumprido vs vencido</strong></td><td>Gráfico donut de cumprimento de SLA</td></tr>
      <tr><td><strong>Por setor / filial / categoria / técnico</strong></td><td>Detalhamento por dimensão para identificar gargalos</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Filtros de período</h3>
  <div class="pills">
    <span class="pill pill-blue">Últimos 7 dias</span>
    <span class="pill pill-blue">Últimos 30 dias</span>
    <span class="pill pill-blue">Últimos 90 dias</span>
    <span class="pill pill-blue">Histórico completo</span>
    <span class="pill pill-gray">Data personalizada</span>
  </div>

  ${callout('📤', 'green', 'Exportar dados:', 'Clique no botão "Exportar CSV" no canto superior direito para baixar os dados em planilha Excel.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 11 — PATRIMÔNIO                                        -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">11</div>
    <div>
      <div class="chapter-title">Patrimônio e Inventário de Ativos</div>
      <div class="chapter-sub">Controle completo do inventário de TI</div>
    </div>
  </div>

  <p>O módulo de <strong>Patrimônio</strong> permite controlar todos os equipamentos de TI da empresa: computadores, monitores, teclados, mouses, nobreaks, impressoras, câmeras e outros ativos.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Patrimônio / Inventário de Ativos</div>
    ${img('tutorial_10_patrimonio_inventario.png', 'Patrimônio')}
  </div>

  <h3 class="section-title">Funcionalidades do módulo Patrimônio</h3>
  <table class="field-table">
    <thead><tr><th>Funcionalidade</th><th>O que permite</th></tr></thead>
    <tbody>
      <tr><td><strong>Dashboard Pat.</strong></td><td>Visão geral: total de ativos, por tipo, por status, por filial</td></tr>
      <tr><td><strong>Ativos</strong></td><td>Listar, cadastrar e editar todos os equipamentos do inventário</td></tr>
      <tr><td><strong>Vincular periféricos ao PC</strong></td><td>Associar mouse, teclado, monitor, nobreak ao seu computador de referência</td></tr>
      <tr><td><strong>Movimentações</strong></td><td>Registrar entradas e saídas de equipamentos (transferências entre setores/filiais)</td></tr>
      <tr><td><strong>Manutenções</strong></td><td>Registrar e acompanhar manutenções preventivas e corretivas</td></tr>
      <tr><td><strong>Fornecedores</strong></td><td>Cadastro dos fornecedores de equipamentos e peças</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Status dos ativos</h3>
  <div class="pills">
    <span class="pill pill-green">✅ Em uso</span>
    <span class="pill pill-yellow">🔧 Em manutenção</span>
    <span class="pill pill-gray">📦 Em estoque</span>
    <span class="pill pill-red">❌ Descartado</span>
    <span class="pill pill-purple">🔄 Emprestado</span>
  </div>

  ${callout('🔗', 'blue', 'Integração com OS:', 'Quando uma OS é aberta com um ativo vinculado, o sistema registra automaticamente o histórico de manutenção daquele equipamento no módulo de patrimônio.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 12 — GESTÃO DE USUÁRIOS                               -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">12</div>
    <div>
      <div class="chapter-title">Gestão de Usuários</div>
      <div class="chapter-sub">Cadastro e controle de acesso dos usuários do sistema</div>
    </div>
  </div>

  <p>O menu <strong>"Usuários"</strong> (exclusivo para TI Admin) permite gerenciar todos os usuários cadastrados no sistema.</p>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Gestão de Usuários</div>
    ${img('tutorial_11_gestao_usuarios.png', 'Gestão de Usuários')}
  </div>

  <h3 class="section-title">Perfis de acesso disponíveis</h3>
  <table class="field-table">
    <thead><tr><th>Perfil</th><th>O que pode fazer</th></tr></thead>
    <tbody>
      <tr><td><strong>Solicitante</strong></td><td>Abrir OS, acompanhar chamados próprios, comentar, avaliar atendimento</td></tr>
      <tr><td><strong>TI Técnico</strong></td><td>Assumir e resolver OSs, registrar diagnóstico, gerenciar patrimônio</td></tr>
      <tr><td><strong>TI Admin</strong></td><td>Tudo do técnico + gerenciar usuários, configurações, relatórios, auditoria</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Ações disponíveis</h3>
  <div class="steps">
    ${step('👁️', 'Ver detalhes do usuário', 'Visualizar informações completas, setor, filial e histórico de OSs')}
    ${step('✏️', 'Editar usuário', 'Alterar nome, e-mail, setor, filial, cargo e perfil de acesso')}
    ${step('🔑', 'Redefinir senha', 'Gerar nova senha temporária para o usuário — ele precisará trocá-la no próximo login')}
    ${step('🚫', 'Desativar usuário', 'Bloquear o acesso sem deletar o histórico — recomendado para ex-colaboradores')}
  </div>

  ${callout('🔒', 'yellow', 'Segurança:', 'Sempre desative o usuário quando um colaborador sair da empresa. Nunca delete — o histórico das OSs precisa ser preservado.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 13 — CONFIGURAÇÕES                                     -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">13</div>
    <div>
      <div class="chapter-title">Configurações do Sistema</div>
      <div class="chapter-sub">Personalização e parametrização do AgroDesk TI</div>
    </div>
  </div>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Configurações do Sistema</div>
    ${img('tutorial_12_configuracoes_sistema.png', 'Configurações')}
  </div>

  <h3 class="section-title">O que pode ser configurado</h3>
  <table class="field-table">
    <thead><tr><th>Configuração</th><th>O que define</th></tr></thead>
    <tbody>
      <tr><td><strong>Setores / Departamentos</strong></td><td>Adicionar, editar ou remover departamentos da empresa</td></tr>
      <tr><td><strong>Filiais / Unidades</strong></td><td>Cadastrar as lojas e filiais da empresa</td></tr>
      <tr><td><strong>Categorias de OS</strong></td><td>Definir os tipos de problema (Hardware, Software, Acesso, etc.)</td></tr>
      <tr><td><strong>Políticas de SLA</strong></td><td>Definir o prazo de atendimento por categoria e prioridade</td></tr>
      <tr><td><strong>Tipos de Ativo</strong></td><td>Definir os tipos de equipamento do inventário (Computador, Monitor, etc.)</td></tr>
      <tr><td><strong>Fornecedores</strong></td><td>Cadastrar empresas fornecedoras de equipamentos e serviços</td></tr>
    </tbody>
  </table>

  ${callout('⚠️', 'red', 'Acesso restrito:', 'As configurações do sistema são acessíveis apenas pelo perfil TI Admin. Alterações incorretas podem afetar o funcionamento de todos os chamados.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 14 — AUDITORIA                                         -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">14</div>
    <div>
      <div class="chapter-title">Auditoria e Rastreabilidade</div>
      <div class="chapter-sub">Histórico completo de todas as ações no sistema</div>
    </div>
  </div>

  <div class="screen-wrap">
    <div class="screen-caption">AgroDesk TI — Auditoria do Sistema</div>
    ${img('tutorial_13_auditoria.png', 'Auditoria')}
  </div>

  <p>O módulo de Auditoria registra <strong>todas as ações realizadas no sistema</strong>: quem fez, o quê, quando e em qual registro. É a garantia de rastreabilidade completa.</p>

  <h3 class="section-title">O que é registrado?</h3>
  <div class="info-grid">
    <div class="info-card"><div class="ic-title">🎫 Ordens de Serviço</div><div class="ic-body">Criação, alteração de status, mudança de responsável, resolução, cancelamento</div></div>
    <div class="info-card"><div class="ic-title">👤 Usuários</div><div class="ic-body">Criação, edição, desativação, redefinição de senha, login</div></div>
    <div class="info-card"><div class="ic-title">🖥️ Ativos / Patrimônio</div><div class="ic-body">Cadastro, movimentação, manutenção, transferência de ativos</div></div>
    <div class="info-card"><div class="ic-title">⚙️ Configurações</div><div class="ic-body">Alterações em setores, filiais, categorias, SLA, tipos de ativo</div></div>
  </div>

  ${callout('🔐', 'green', 'Imutabilidade:', 'Os logs de auditoria não podem ser editados ou deletados por nenhum usuário — nem pelo TI Admin. Isso garante a integridade do histórico.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 15 — SLA E PRIORIDADES                                 -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">15</div>
    <div>
      <div class="chapter-title">SLA e Prioridades — Entendendo os indicadores</div>
      <div class="chapter-sub">Como o sistema controla os prazos de atendimento</div>
    </div>
  </div>

  <h3 class="section-title">O que é SLA?</h3>
  <p><strong>SLA (Service Level Agreement)</strong> é o prazo máximo que a TI tem para resolver cada tipo de chamado. O prazo começa a contar no momento em que a OS é aberta.</p>

  <h3 class="section-title">Prioridades e prazos</h3>
  <table class="field-table">
    <thead><tr><th>Prioridade</th><th>Descrição</th><th>Prazo típico</th></tr></thead>
    <tbody>
      <tr><td><span class="pill pill-red" style="display:inline-flex">🔴 Crítica</span></td><td>Sistema totalmente parado, afetando operação</td><td>2–4 horas</td></tr>
      <tr><td><span class="pill pill-yellow" style="display:inline-flex">🟡 Alta</span></td><td>Impacto alto, colaborador impossibilitado de trabalhar</td><td>4–8 horas</td></tr>
      <tr><td><span class="pill pill-blue" style="display:inline-flex">🔵 Média</span></td><td>Impacto moderado, existe alternativa temporária</td><td>24–48 horas</td></tr>
      <tr><td><span class="pill pill-gray" style="display:inline-flex">⚪ Baixa</span></td><td>Melhoria ou problema que não impede o trabalho</td><td>72–120 horas</td></tr>
    </tbody>
  </table>

  <h3 class="section-title">Como ler o indicador de SLA</h3>
  <div class="info-grid">
    <div class="info-card" style="border-left: 4px solid #10b981;">
      <div class="ic-title" style="color:#065f46">🟢 Dentro do prazo</div>
      <div class="ic-body">Barra verde. Ainda há tempo suficiente para resolução sem risco.</div>
    </div>
    <div class="info-card" style="border-left: 4px solid #f59e0b;">
      <div class="ic-title" style="color:#92400e">🟡 Prazo próximo</div>
      <div class="ic-body">Barra amarela. Menos de 25% do prazo restante. Atenção redobrada.</div>
    </div>
    <div class="info-card" style="border-left: 4px solid #ef4444;">
      <div class="ic-title" style="color:#991b1b">🔴 Vencido</div>
      <div class="ic-body">Barra vermelha. O prazo foi ultrapassado. Ação imediata necessária.</div>
    </div>
    <div class="info-card" style="border-left: 4px solid #8b5cf6;">
      <div class="ic-title" style="color:#5b21b6">⏸️ Pausado</div>
      <div class="ic-body">SLA suspenso enquanto aguarda peça, resposta do usuário ou aprovação externa.</div>
    </div>
  </div>

  ${callout('💡', 'blue', 'SLA pode ser estendido:', 'Quando um chamado requer mais tempo por motivos justificáveis (aguardando peça, programação complexa, aprovação de orçamento), o técnico pode estender o prazo diretamente no sistema — evitando falsas marcações de SLA vencido.')}
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- CAP 16 — FAQ                                               -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">16</div>
    <div>
      <div class="chapter-title">Perguntas Frequentes (FAQ)</div>
      <div class="chapter-sub">Dúvidas comuns dos usuários</div>
    </div>
  </div>

  <table class="field-table">
    <thead><tr><th>Dúvida</th><th>Resposta</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>Não consigo fazer login. O que faço?</strong></td>
        <td>Verifique se está digitando o usuário sem espaços. Se esqueceu a senha, use "Esqueci minha senha". Caso não tenha e-mail cadastrado, contate a TI diretamente.</td>
      </tr>
      <tr>
        <td><strong>Posso abrir mais de uma OS ao mesmo tempo?</strong></td>
        <td>Sim! Você pode ter quantas OSs abertas forem necessárias. Cada problema deve ter sua própria OS para melhor rastreamento.</td>
      </tr>
      <tr>
        <td><strong>Como sei quando meu chamado foi resolvido?</strong></td>
        <td>O status mudará para "Resolvido" e você receberá uma notificação (sino no topo). Se cadastrou e-mail, também receberá por e-mail.</td>
      </tr>
      <tr>
        <td><strong>Posso cancelar uma OS depois de aberta?</strong></td>
        <td>Sim, enquanto o status for "Aberto". Após a TI assumir, entre em contato com a TI para solicitar o cancelamento.</td>
      </tr>
      <tr>
        <td><strong>O problema voltou após ser marcado como resolvido. O que faço?</strong></td>
        <td>Acesse o chamado e clique em "Reabrir". A OS voltará para atendimento mantendo todo o histórico.</td>
      </tr>
      <tr>
        <td><strong>O técnico disse que está "aguardando peça". Por quanto tempo?</strong></td>
        <td>O SLA fica pausado neste status. A TI entrará em contato quando a peça chegar ou informará um prazo estimado nos comentários da OS.</td>
      </tr>
      <tr>
        <td><strong>Posso ver chamados de outros colegas?</strong></td>
        <td>Não. O solicitante só vê suas próprias OSs. A equipe de TI tem visão de todos os chamados.</td>
      </tr>
      <tr>
        <td><strong>Como atualizo meu telefone ou setor no sistema?</strong></td>
        <td>Acesse "Meu perfil" no menu lateral esquerdo e edite suas informações.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">Contato com a TI</h3>
  ${callout('📞', 'green', 'Suporte TI Casa do Campo:', 'Para problemas urgentes que não permitem nem abrir uma OS, entre em contato diretamente com a equipe de TI pelo ramal ou WhatsApp informados internamente. Para todos os outros casos, sempre abra uma OS para garantir o registro e o atendimento dentro do prazo.')}
</div>

<div class="footer">
  <strong>AgroDesk TI — Casa do Campo Agropecuária</strong><br/>
  Manual do Usuário · Versão 2026 · Uso interno · Departamento de Tecnologia da Informação<br/>
  Este documento é confidencial e de uso exclusivo dos colaboradores da Casa do Campo.
</div>

</body>
</html>`;

fs.writeFileSync('manual_agrodesk_ti.html', html, 'utf8');
console.log('✅ manual_agrodesk_ti.html gerado com', html.length.toLocaleString(), 'caracteres');
console.log('📄 Tamanho aproximado:', Math.round(html.length / 1024 / 1024 * 10) / 10, 'MB');
