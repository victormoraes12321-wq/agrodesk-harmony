/**
 * ============================================================
 * GERADOR DO MANUAL DO SOLICITANTE — AGRODESK TI
 * Casa do Campo · Versão 2026
 * ============================================================
 * Manual focado 100% no usuário solicitante com:
 *  - Logo da empresa embedado
 *  - Prints reais do sistema
 *  - Quebras de página inteligentes (sem título órfão)
 *  - Design profissional
 * ============================================================
 */
const fs   = require('fs');
const path = require('path');

// ── EMBEDAR IMAGENS ──────────────────────────────────────────
function embedImg(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (e) {
    return '';
  }
}

const LOGO    = embedImg('logo_casadocampo.png');
const P_LOGIN = embedImg('tutorial_01_tela_login.png');
const P_CADAS = embedImg('tutorial_02_cadastro_usuario.png');
const P_PORTA = embedImg('tutorial_03_portal_solicitante_chamados.png');
const P_NOOS  = embedImg('tutorial_04_nova_os_etapa1.png');
const P_LISTA = embedImg('tutorial_05_chamados_lista_com_os.png');
const P_DETAL = embedImg('tutorial_06_detalhe_os_solicitante.png');

function sc(src, caption) {
  if (!src) return `<div class="img-miss">📷 Imagem não disponível</div>`;
  return `
  <div class="sc-wrap">
    <div class="sc-bar">
      <span class="sc-dots"><span></span><span></span><span></span></span>
      <span class="sc-title">${caption}</span>
    </div>
    <img src="${src}" alt="${caption}" class="sc-img" />
  </div>`;
}

function tip(icon, color, bold, text) {
  return `<div class="callout co-${color}"><span class="co-icon">${icon}</span><div><strong>${bold}</strong> ${text}</div></div>`;
}

// Linha de campo da tabela
function fc(field, req, desc, ex) {
  return `<tr>
    <td class="td-field">${field}${req ? ' <sup class="req">✦</sup>' : ''}</td>
    <td>${desc}</td>
    ${ex ? `<td class="td-ex"><code>${ex}</code></td>` : ''}
  </tr>`;
}

const html = /* html */`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Manual do Solicitante — AgroDesk TI · Casa do Campo</title>
<style>
/* ════════════════════════════════════════════════
   RESET E VARIÁVEIS
════════════════════════════════════════════════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --red:    #cc1717;
  --yellow: #f5c300;
  --dark:   #1a1a1a;
  --gray:   #4a5568;
  --light:  #f7f8fa;
  --white:  #ffffff;
  --border: #e2e8f0;
  --green:  #1a7a3a;
  --info:   #1d6fa5;
  --warn:   #b45309;
  --radius: 10px;
  --sh:     0 2px 16px rgba(0,0,0,.10);
}

body{
  font-family:'Segoe UI',Arial,sans-serif;
  font-size: 12.5px;
  color: var(--dark);
  background: var(--white);
  line-height: 1.7;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ════════════════════════════════════════════════
   CAPA
════════════════════════════════════════════════ */
.cover{
  width:100%; min-height:100vh;
  background: linear-gradient(170deg, #1a1a1a 0%, #2d2d2d 40%, #1a1a1a 100%);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  text-align:center; padding:60px 60px 50px;
  page-break-after: always;
  position: relative;
  overflow: hidden;
}

/* Listras decorativas do logo (vermelho + amarelo) */
.cover::before{
  content:'';
  position:absolute; top:0; left:0; right:0; height:8px;
  background: linear-gradient(90deg, var(--red) 0%, var(--red) 50%, var(--yellow) 50%, var(--yellow) 100%);
}
.cover::after{
  content:'';
  position:absolute; bottom:0; left:0; right:0; height:8px;
  background: linear-gradient(90deg, var(--yellow) 0%, var(--yellow) 50%, var(--red) 50%, var(--red) 100%);
}

/* Círculo decorativo fundo */
.cover-circle{
  position:absolute;
  width:500px; height:500px;
  border-radius:50%;
  border:1px solid rgba(255,255,255,.05);
  top:50%; left:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.cover-circle:nth-child(2){ width:650px; height:650px; border-color:rgba(245,195,0,.06); }
.cover-circle:nth-child(3){ width:800px; height:800px; }

.cover-logo-wrap{
  background: var(--white);
  border-radius: 18px;
  padding: 18px 36px;
  margin-bottom: 44px;
  box-shadow: 0 8px 40px rgba(0,0,0,.35);
  display:inline-block;
}
.cover-logo-wrap img{
  height: 72px;
  width: auto;
  display:block;
  object-fit: contain;
}

.cover h1{
  font-size: 40px; font-weight: 700;
  color: var(--white); letter-spacing:-0.5px;
  line-height:1.15;
}
.cover h1 span{ color: var(--yellow); }

.cover-sub{
  font-size:16px; color:rgba(255,255,255,.65);
  margin-top:10px; font-weight:300;
}

.cover-divider{
  width:60px; height:3px;
  background: linear-gradient(90deg, var(--red), var(--yellow));
  border-radius:3px; margin:32px auto;
}

.cover-meta{
  font-size:13px; color:rgba(255,255,255,.55);
  line-height:2;
}
.cover-meta b{ color:rgba(255,255,255,.85); }

.cover-pills{
  display:flex; gap:10px; justify-content:center;
  margin-top:40px; flex-wrap:wrap;
}
.cover-pill{
  border:1px solid rgba(255,255,255,.2);
  border-radius:999px; padding:5px 16px;
  font-size:11.5px; color:rgba(255,255,255,.8);
  background:rgba(255,255,255,.06);
  letter-spacing:.3px;
}

/* ════════════════════════════════════════════════
   ÍNDICE
════════════════════════════════════════════════ */
.toc-page{
  padding: 55px 72px 60px;
  page-break-after: always;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.toc-header{
  display:flex; align-items:center; gap:20px;
  border-bottom:3px solid var(--red);
  padding-bottom:20px; margin-bottom:36px;
}
.toc-header img{ height:40px; width:auto; }
.toc-header-title h2{
  font-size:26px; font-weight:700;
  color:var(--dark);
}
.toc-header-title p{ color:var(--gray); font-size:13px; }

.toc-intro{
  background: var(--light);
  border-radius: var(--radius);
  border-left: 4px solid var(--red);
  padding: 14px 18px;
  font-size: 12.5px;
  color: var(--gray);
  margin-bottom: 28px;
  line-height:1.65;
}

.toc-grid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:10px;
}

.toc-item{
  display:flex; align-items:center; gap:12px;
  background: var(--white);
  border:1px solid var(--border);
  border-radius:10px;
  padding:12px 16px;
  transition:.2s;
  break-inside: avoid;
}
.toc-num{
  min-width:34px; height:34px;
  border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--white);
  background: linear-gradient(135deg, var(--red), #a01010);
  flex-shrink:0;
}
.toc-info .toc-cap{ font-size:12px; color:var(--gray); margin-top:1px; }
.toc-info .toc-name{ font-weight:600; font-size:13px; color:var(--dark); }

.toc-footer{
  margin-top:auto; padding-top:28px;
  border-top:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
  font-size:11px; color:#aaa;
}

/* ════════════════════════════════════════════════
   CAPÍTULOS
════════════════════════════════════════════════ */
.chapter{
  padding: 52px 72px 56px;
  page-break-before: always;
}

/* Faixa de capítulo */
.ch-header{
  display:flex; align-items:stretch; gap:0;
  margin-bottom:36px;
  border-radius:var(--radius);
  overflow:hidden;
  box-shadow: var(--sh);
}
.ch-num-band{
  background: linear-gradient(180deg, var(--red) 0%, #8b0000 100%);
  color:var(--white);
  padding:20px 24px;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  min-width:80px;
}
.ch-num-band .ch-label{ font-size:9px; letter-spacing:2px; opacity:.75; text-transform:uppercase; }
.ch-num-band .ch-n{ font-size:36px; font-weight:800; line-height:1; }
.ch-body{
  background: var(--light);
  padding:18px 24px;
  flex:1;
  display:flex; flex-direction:column; justify-content:center;
}
.ch-body h2{ font-size:22px; font-weight:700; color:var(--dark); }
.ch-body p{ font-size:12.5px; color:var(--gray); margin-top:4px; }
.ch-logo{ padding:16px 24px; background:var(--light); display:flex; align-items:center; }
.ch-logo img{ height:32px; width:auto; opacity:.7; }

/* Títulos de seção */
h3.st{
  font-size:15px; font-weight:700; color:var(--dark);
  margin:30px 0 14px;
  display:flex; align-items:center; gap:10px;
}
h3.st::before{
  content:'';
  display:inline-block;
  width:3px; height:18px; border-radius:3px;
  background:linear-gradient(180deg,var(--red),var(--yellow));
}

p{ margin-bottom:11px; }
strong{ color:var(--dark); }
code{
  background:#f1f5f9; border:1px solid #e2e8f0;
  border-radius:4px; padding:1px 6px;
  font-family:monospace; font-size:11.5px; color:#c53030;
}

/* ════════════════════════════════════════════════
   SCREENSHOTS
════════════════════════════════════════════════ */
.sc-wrap{
  margin: 22px 0;
  border-radius: var(--radius);
  overflow:hidden;
  box-shadow: var(--sh);
  border: 1px solid var(--border);
  break-inside: avoid;
}
.sc-bar{
  background: #1e293b;
  padding: 8px 16px;
  display:flex; align-items:center; gap:10px;
}
.sc-dots{ display:flex; gap:5px; }
.sc-dots span{
  display:inline-block;
  width:10px; height:10px; border-radius:50%;
}
.sc-dots span:nth-child(1){ background:#ef4444; }
.sc-dots span:nth-child(2){ background:#f59e0b; }
.sc-dots span:nth-child(3){ background:#22c55e; }
.sc-title{ font-size:11px; color:#94a3b8; font-family:monospace; flex:1; text-align:center; }
.sc-img{ display:block; width:100%; height:auto; }
.img-miss{
  background:#fee2e2; color:#c53030;
  padding:20px; text-align:center;
  font-size:12px; border-radius:8px;
}

/* ════════════════════════════════════════════════
   CALLOUTS / DICAS
════════════════════════════════════════════════ */
.callout{
  display:flex; gap:13px; align-items:flex-start;
  padding:13px 17px;
  border-radius:var(--radius);
  margin:16px 0;
  font-size:12.5px; line-height:1.65;
  break-inside: avoid;
}
.co-icon{ font-size:20px; flex-shrink:0; margin-top:1px; }
.co-green { background:#edfbf0; border-left:4px solid #16a34a; }
.co-blue  { background:#eff6ff; border-left:4px solid var(--info); }
.co-yellow{ background:#fffbeb; border-left:4px solid var(--yellow); }
.co-red   { background:#fff1f2; border-left:4px solid var(--red); }

/* ════════════════════════════════════════════════
   TABELAS
════════════════════════════════════════════════ */
table.ft{
  width:100%; border-collapse:collapse;
  margin:16px 0; font-size:12px;
  break-inside: avoid;
}
table.ft thead tr{ background:linear-gradient(90deg,var(--red),#a01010); }
table.ft th{
  color:#fff; padding:9px 13px;
  text-align:left; font-size:11px;
  font-weight:700; text-transform:uppercase; letter-spacing:.5px;
}
table.ft td{ padding:9px 13px; border-bottom:1px solid var(--border); vertical-align:top; }
table.ft tr:nth-child(even) td{ background:#fafafa; }
table.ft tr:last-child td{ border-bottom:none; }
.td-field{ font-weight:600; white-space:nowrap; }
.td-ex{ font-family:monospace; font-size:11px; color:#666; }
sup.req{ color:var(--red); font-size:10px; }

/* ════════════════════════════════════════════════
   PASSOS NUMERADOS
════════════════════════════════════════════════ */
.steps{ margin:18px 0; }
.step{
  display:flex; gap:14px; align-items:flex-start;
  padding:11px 0; border-bottom:1px solid #eef0f4;
  break-inside:avoid;
}
.step:last-child{ border-bottom:none; }
.step-n{
  min-width:30px; height:30px;
  background:linear-gradient(135deg,var(--red),#a01010);
  color:#fff; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; flex-shrink:0;
  margin-top:1px;
}
.step-body{ font-size:12.5px; padding-top:4px; }
.step-body strong{ display:block; margin-bottom:2px; }

/* ════════════════════════════════════════════════
   PILLS / BADGES
════════════════════════════════════════════════ */
.pills{ display:flex; flex-wrap:wrap; gap:7px; margin:12px 0; }
.pill{
  padding:4px 12px; border-radius:999px;
  font-size:11.5px; font-weight:500;
  display:inline-flex; align-items:center; gap:5px;
}
.p-blue  { background:#dbeafe; color:#1e40af; }
.p-yellow{ background:#fef9c3; color:#854d0e; }
.p-green { background:#dcfce7; color:#166534; }
.p-red   { background:#fee2e2; color:#991b1b; }
.p-purple{ background:#ede9fe; color:#5b21b6; }
.p-gray  { background:#f1f5f9; color:#475569; }

/* ════════════════════════════════════════════════
   GRID DE CARDS DE INFO
════════════════════════════════════════════════ */
.igrid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin:18px 0; }
.icard{
  background:var(--light); border:1px solid var(--border);
  border-radius:var(--radius); padding:16px;
  break-inside:avoid;
}
.icard .ic-icon{ font-size:22px; margin-bottom:8px; }
.icard .ic-t{ font-weight:700; font-size:13px; color:var(--dark); margin-bottom:4px; }
.icard .ic-b{ font-size:12px; color:var(--gray); line-height:1.6; }

/* ════════════════════════════════════════════════
   STATUS TABLE
════════════════════════════════════════════════ */
.status-row{ display:flex; align-items:center; gap:8px; }
.sdot{ width:9px; height:9px; border-radius:50%; flex-shrink:0; }

/* ════════════════════════════════════════════════
   FAQ
════════════════════════════════════════════════ */
.faq-item{
  border:1px solid var(--border);
  border-radius:var(--radius);
  margin-bottom:10px;
  overflow:hidden;
  break-inside:avoid;
}
.faq-q{
  background:var(--light);
  padding:12px 16px;
  font-weight:600; font-size:13px;
  border-left:4px solid var(--red);
  color:var(--dark);
}
.faq-a{
  padding:12px 16px;
  font-size:12.5px; color:var(--gray);
  line-height:1.65;
  background:var(--white);
}

/* ════════════════════════════════════════════════
   BACK COVER
════════════════════════════════════════════════ */
.back-cover{
  page-break-before:always;
  background:linear-gradient(170deg,#1a1a1a,#2d2d2d);
  min-height:100vh;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  text-align:center; padding:60px;
  position:relative; overflow:hidden;
}
.back-cover::before{
  content:'';
  position:absolute; top:0; left:0; right:0; height:8px;
  background:linear-gradient(90deg,var(--red) 50%,var(--yellow) 50%);
}
.back-logo-wrap{
  background:#fff; border-radius:14px;
  padding:14px 28px; margin-bottom:36px;
  display:inline-block;
}
.back-logo-wrap img{ height:56px; width:auto; display:block; }
.back-cover h3{ font-size:22px; color:#fff; font-weight:700; margin-bottom:8px; }
.back-cover p{ font-size:13px; color:rgba(255,255,255,.5); max-width:380px; line-height:1.75; }
.back-line{ width:50px; height:3px; background:linear-gradient(90deg,var(--red),var(--yellow)); border-radius:3px; margin:28px auto; }
.back-contacts{
  display:grid; grid-template-columns:1fr 1fr;
  gap:14px; margin-top:36px; max-width:420px; width:100%;
}
.back-contact-card{
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12);
  border-radius:10px; padding:16px;
}
.back-contact-card .bcc-icon{ font-size:22px; margin-bottom:6px; }
.back-contact-card .bcc-t{ font-size:11px; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:1px; }
.back-contact-card .bcc-v{ font-size:13px; color:rgba(255,255,255,.85); font-weight:600; margin-top:3px; }

/* ════════════════════════════════════════════════
   RODAPÉ DE PÁGINA (via @page não suportado em
   puppeteer‑core, então colocamos via headerTemplate)
════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════
   PRINT / PAGE-BREAK HELPERS
════════════════════════════════════════════════ */
@media print{
  body{ font-size:12px; }
  .chapter{ padding:42px 62px 50px; }
  .cover{ min-height:100vh; }
  .toc-page{ min-height:100vh; }
  h3.st{ break-after:avoid; }
  .sc-wrap{ break-inside:avoid; }
  table.ft{ break-inside:avoid; }
  .callout{ break-inside:avoid; }
  .faq-item{ break-inside:avoid; }
  .step{ break-inside:avoid; }
  .icard{ break-inside:avoid; }
}
</style>
</head>
<body>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAPA                                                ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="cover">
  <div class="cover-circle"></div>
  <div class="cover-circle"></div>
  <div class="cover-circle"></div>

  <div class="cover-logo-wrap">
    <img src="${LOGO}" alt="Casa do Campo" />
  </div>

  <h1>Manual do<br/><span>Solicitante</span></h1>
  <p class="cover-sub">Sistema de Atendimento e Suporte de TI</p>

  <div class="cover-divider"></div>

  <div class="cover-meta">
    <b>AgroDesk TI</b> · Plataforma Interna de Help Desk<br/>
    Casa do Campo Agropecuária · Departamento de Tecnologia da Informação<br/>
    Versão 2026 · Documento de Uso Interno
  </div>

  <div class="cover-pills">
    <span class="cover-pill">📋 Guia do Solicitante</span>
    <span class="cover-pill">🖥️ Capturas de Tela Reais</span>
    <span class="cover-pill">🔒 Uso Interno</span>
    <span class="cover-pill">📅 Agosto 2026</span>
  </div>
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  ÍNDICE                                              ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="toc-page">
  <div class="toc-header">
    <img src="${LOGO}" alt="Casa do Campo" />
    <div class="toc-header-title">
      <h2>Sumário</h2>
      <p>Manual do Solicitante · AgroDesk TI · Casa do Campo</p>
    </div>
  </div>

  <div class="toc-intro">
    Este manual foi elaborado exclusivamente para os <strong>colaboradores solicitantes</strong> da Casa do Campo.
    Aqui você aprenderá, passo a passo, como usar o sistema AgroDesk TI para abrir chamados, acompanhar atendimentos
    e se comunicar com a equipe de TI. Não é necessário nenhum conhecimento técnico prévio.
  </div>

  <div class="toc-grid">
    <div class="toc-item"><div class="toc-num">1</div><div class="toc-info"><div class="toc-name">O que é o AgroDesk TI?</div><div class="toc-cap">Visão geral do sistema</div></div></div>
    <div class="toc-item"><div class="toc-num">2</div><div class="toc-info"><div class="toc-name">Acessando o sistema</div><div class="toc-cap">Tela de login e primeiro acesso</div></div></div>
    <div class="toc-item"><div class="toc-num">3</div><div class="toc-info"><div class="toc-name">Criando sua conta</div><div class="toc-cap">Cadastro de novo usuário</div></div></div>
    <div class="toc-item"><div class="toc-num">4</div><div class="toc-info"><div class="toc-name">Seu portal pessoal</div><div class="toc-cap">Tela inicial após o login</div></div></div>
    <div class="toc-item"><div class="toc-num">5</div><div class="toc-info"><div class="toc-name">Abrindo um chamado</div><div class="toc-cap">Passo a passo completo da OS</div></div></div>
    <div class="toc-item"><div class="toc-num">6</div><div class="toc-info"><div class="toc-name">Acompanhando seus chamados</div><div class="toc-cap">Status, SLA e atualizações</div></div></div>
    <div class="toc-item"><div class="toc-num">7</div><div class="toc-info"><div class="toc-name">Interagindo com a TI</div><div class="toc-cap">Comentários e retorno ao chamado</div></div></div>
    <div class="toc-item"><div class="toc-num">8</div><div class="toc-info"><div class="toc-name">Entendendo os prazos (SLA)</div><div class="toc-cap">O que é e como funciona</div></div></div>
    <div class="toc-item"><div class="toc-num">9</div><div class="toc-info"><div class="toc-name">Dicas para bons chamados</div><div class="toc-cap">Como agilizar seu atendimento</div></div></div>
    <div class="toc-item"><div class="toc-num">10</div><div class="toc-info"><div class="toc-name">Perguntas frequentes</div><div class="toc-cap">FAQ com as principais dúvidas</div></div></div>
  </div>

  <div class="toc-footer">
    <span>🔒 Documento de uso interno · Casa do Campo Agropecuária</span>
    <img src="${LOGO}" alt="" style="height:22px;width:auto;opacity:.4;" />
  </div>
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 1 — O QUE É O AGRODESK TI                      ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">01</div></div>
    <div class="ch-body">
      <h2>O que é o AgroDesk TI?</h2>
      <p>Visão geral do sistema de suporte da Casa do Campo</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>O <strong>AgroDesk TI</strong> é o sistema oficial de suporte de tecnologia da <strong>Casa do Campo</strong>. Através dele, qualquer colaborador pode abrir um chamado de TI, acompanhar o andamento e se comunicar com os técnicos — tudo de forma organizada, rápida e sem complicação.</p>
  <p>Antes deste sistema, os pedidos eram feitos por WhatsApp, telefone ou pessoalmente, o que dificultava o controle e o atendimento. Agora, <strong>cada chamado tem um número de protocolo único</strong>, um prazo de atendimento e um histórico completo.</p>

  <div class="igrid">
    <div class="icard">
      <div class="ic-icon">⚡</div>
      <div class="ic-t">Abertura rápida</div>
      <div class="ic-b">Abra um chamado em menos de 1 minuto diretamente pelo navegador, sem precisar instalar nada.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">🔍</div>
      <div class="ic-t">Acompanhamento em tempo real</div>
      <div class="ic-b">Veja exatamente o status do seu chamado: quem está atendendo, qual o prazo e o que foi feito.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">💬</div>
      <div class="ic-t">Comunicação direta com a TI</div>
      <div class="ic-b">Envie e receba mensagens diretamente no chamado, sem precisar ligar ou mandar WhatsApp.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">📋</div>
      <div class="ic-t">Protocolo e histórico</div>
      <div class="ic-b">Cada OS tem um número único (ex: OS-2026-00003) e todo o histórico é salvo automaticamente.</div>
    </div>
  </div>

  ${tip('✅','green','Não precisa instalar nada:','O AgroDesk TI funciona diretamente no navegador (Chrome, Edge ou Firefox). Basta acessar o endereço fornecido pela equipe de TI.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 2 — ACESSANDO O SISTEMA                         ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">02</div></div>
    <div class="ch-body">
      <h2>Acessando o sistema</h2>
      <p>Como entrar no AgroDesk TI pela primeira vez e nos acessos seguintes</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Ao abrir o endereço do AgroDesk TI no navegador, a tela abaixo será exibida. Esta é a <strong>Tela de Login</strong> — por onde todos os usuários entram no sistema.</p>

  ${sc(P_LOGIN, 'AgroDesk TI — Tela de Login')}

  <h3 class="st">O que preencher</h3>
  <table class="ft">
    <thead><tr><th>Campo</th><th>O que é</th><th>Exemplo</th></tr></thead>
    <tbody>
      ${fc('Nome de usuário', true, 'Seu login cadastrado no sistema, geralmente no formato <code>nome.sobrenome</code>.', 'carolina.silva')}
      ${fc('Senha', true, 'Sua senha pessoal. No primeiro acesso, use a senha temporária recebida da TI. O sistema pedirá para você criar uma nova senha.', '••••••••')}
    </tbody>
  </table>

  <h3 class="st">Passo a passo para entrar</h3>
  <div class="steps">
    <div class="step"><div class="step-n">1</div><div class="step-body"><strong>Abra o navegador e acesse o endereço do sistema</strong>O endereço foi fornecido pela equipe de TI. Salve nos favoritos para facilitar o acesso.</div></div>
    <div class="step"><div class="step-n">2</div><div class="step-body"><strong>Digite seu nome de usuário</strong>Use o formato <code>nome.sobrenome</code>, sem espaços e sem letras maiúsculas. Ex: <code>carolina.silva</code></div></div>
    <div class="step"><div class="step-n">3</div><div class="step-body"><strong>Digite sua senha</strong>A senha diferencia maiúsculas de minúsculas. Certifique-se que o Caps Lock está desligado.</div></div>
    <div class="step"><div class="step-n">4</div><div class="step-body"><strong>Clique em "Entrar"</strong>Você será redirecionado ao seu portal pessoal.</div></div>
  </div>

  ${tip('🔑','yellow','Primeiro acesso — senha temporária:','Se for seu primeiro acesso, a TI fornece uma senha temporária. Ao fazer login com ela, o sistema exibirá a tela <strong>"Defina sua nova senha"</strong>. Digite a senha temporária no primeiro campo e escolha sua nova senha pessoal (mínimo 8 caracteres). Após isso, você já poderá usar o sistema normalmente.')}
  ${tip('❓','blue','Esqueceu a senha?','Clique em <strong>"Esqueci minha senha"</strong> na tela de login. Se seu cadastro tiver e-mail, você receberá um link de recuperação. Caso contrário, entre em contato com a TI para redefinição.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 3 — CRIANDO SUA CONTA                          ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">03</div></div>
    <div class="ch-body">
      <h2>Criando sua conta</h2>
      <p>Como se cadastrar no sistema se você ainda não tem um usuário</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Se você ainda não tem usuário, clique em <strong>"Cadastre-se para abrir Ordens de Serviço"</strong> na tela de login. O cadastro é simples e leva menos de 2 minutos.</p>

  ${sc(P_CADAS, 'AgroDesk TI — Tela de Cadastro de Solicitante')}

  <h3 class="st">Como preencher cada campo</h3>
  <table class="ft">
    <thead><tr><th>Seção</th><th>Campo</th><th>Como preencher</th></tr></thead>
    <tbody>
      <tr><td rowspan="4" style="font-weight:700;vertical-align:top;padding-top:14px;">1. Dados pessoais</td><td class="td-field">Nome completo <sup class="req">✦</sup></td><td>Seu nome completo, como aparece no crachá ou em documentos</td></tr>
      <tr><td class="td-field">Nome de usuário <sup class="req">✦</sup></td><td>Crie no formato <code>nome.sobrenome</code> — será seu login permanente. Use apenas letras e pontos, sem espaços.</td></tr>
      <tr><td class="td-field">E-mail <em style="font-weight:400;color:#888;">(opcional)</em></td><td>E-mail da empresa. Usado para recuperar senha e receber notificações.</td></tr>
      <tr><td class="td-field">Senha e confirmação <sup class="req">✦</sup></td><td>Mínimo 8 caracteres. Use letras e números. Não compartilhe sua senha com ninguém.</td></tr>
      <tr><td rowspan="2" style="font-weight:700;vertical-align:top;padding-top:14px;">2. Setor e filial</td><td class="td-field">Setor / Departamento <sup class="req">✦</sup></td><td>Selecione o setor onde você trabalha (ex: Financeiro, Vendas, Gerência)</td></tr>
      <tr><td class="td-field">Filial / Unidade <sup class="req">✦</sup></td><td>Selecione a loja ou filial onde você está alocado</td></tr>
      <tr><td rowspan="3" style="font-weight:700;vertical-align:top;padding-top:14px;">3. Contato</td><td class="td-field">Telefone</td><td>Seu celular para contato rápido da TI quando necessário</td></tr>
      <tr><td class="td-field">WhatsApp</td><td>Preencha se diferente do telefone</td></tr>
      <tr><td class="td-field">Ramal</td><td>Ramal interno, se houver</td></tr>
    </tbody>
  </table>

  ${tip('⚠️','yellow','Atenção ao nome de usuário:','O nome de usuário não pode ser alterado depois do cadastro. Escolha com cuidado no formato <code>nome.sobrenome</code>. Evite números ou caracteres especiais.')}
  ${tip('✅','green','Após o cadastro:','Sua conta é criada com o perfil de <strong>Solicitante</strong>. Você já poderá fazer login e abrir chamados imediatamente.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 4 — SEU PORTAL PESSOAL                         ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">04</div></div>
    <div class="ch-body">
      <h2>Seu portal pessoal</h2>
      <p>A tela que aparece logo após fazer login — sua central de chamados</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Após fazer login, você é direcionado ao seu <strong>Portal do Solicitante</strong>. Esta é a tela principal onde você acompanha todos os seus chamados.</p>

  ${sc(P_PORTA, 'AgroDesk TI — Portal do Solicitante (usuário: Carolina Silva)')}

  <h3 class="st">Conhecendo cada elemento da tela</h3>
  <table class="ft">
    <thead><tr><th>Elemento</th><th>Onde fica</th><th>Para que serve</th></tr></thead>
    <tbody>
      <tr><td class="td-field">🟢 Botão "Abrir OS"</td><td>Canto superior direito</td><td>Abre o formulário para criar um novo chamado de TI</td></tr>
      <tr><td class="td-field">🔔 Sino de notificações</td><td>Topo da tela</td><td>Mostra alertas e atualizações dos seus chamados</td></tr>
      <tr><td class="td-field">🌙 Ícone de tema</td><td>Topo da tela</td><td>Alterna entre modo claro e escuro conforme sua preferência</td></tr>
      <tr><td class="td-field">Seu nome e perfil</td><td>Topo direito</td><td>Confirma que você está logado corretamente como Solicitante</td></tr>
      <tr><td class="td-field">Menu lateral — Portal</td><td>Esquerda</td><td>Tela inicial com resumo geral dos seus chamados</td></tr>
      <tr><td class="td-field">Menu lateral — Abrir nova OS</td><td>Esquerda</td><td>Atalho para abrir um novo chamado</td></tr>
      <tr><td class="td-field">Menu lateral — Meus chamados</td><td>Esquerda</td><td>Lista completa de todas as suas OSs</td></tr>
      <tr><td class="td-field">Menu lateral — Meu perfil</td><td>Esquerda</td><td>Editar seus dados pessoais, telefone, senha</td></tr>
      <tr><td class="td-field">Cards de contagem</td><td>Centro da tela</td><td>Quantas OSs você tem em cada status (Abertos / Em atendimento / Aguardando / Concluídos)</td></tr>
      <tr><td class="td-field">Lista "Chamados recentes"</td><td>Parte inferior</td><td>Últimos chamados abertos com busca e filtros rápidos</td></tr>
    </tbody>
  </table>

  ${tip('🔄','blue','Atualização automática:','A lista de chamados se atualiza sozinha em tempo real. Não precisa apertar F5 ou recarregar a página.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 5 — ABRINDO UM CHAMADO                         ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">05</div></div>
    <div class="ch-body">
      <h2>Abrindo um chamado (OS)</h2>
      <p>Guia completo e passo a passo para criar uma Ordem de Serviço</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Para abrir um chamado, clique em <strong>"Abrir nova OS"</strong> no menu lateral esquerdo ou no botão verde no topo da tela. O formulário é dividido em <strong>5 etapas simples</strong> e leva menos de 1 minuto para preencher.</p>

  ${sc(P_NOOS, 'AgroDesk TI — Formulário de Abertura de OS (Etapa 1 de 5)')}

  <h3 class="st">Etapa 1 — Como podemos falar com você?</h3>
  <p>Nesta primeira etapa, o sistema já preenche automaticamente seus dados vindos do seu cadastro. Verifique se estão corretos e atualize se necessário.</p>
  <table class="ft">
    <thead><tr><th>Campo</th><th>Instrução de preenchimento</th></tr></thead>
    <tbody>
      <tr><td class="td-field">Nome do solicitante <sup class="req">✦</sup></td><td>Já vem preenchido com seu nome. Confirme se está correto — é assim que a TI saberá quem está pedindo.</td></tr>
      <tr><td class="td-field">Telefone <sup class="req">✦</sup></td><td>Já vem do seu perfil. Atualize se necessário — é o número que a TI ligará se precisar de mais informações.</td></tr>
      <tr><td class="td-field">E-mail <em style="color:#888;font-weight:400;">(opcional)</em></td><td>Para receber e-mails sobre atualizações do chamado. Deixe em branco se preferir não receber.</td></tr>
    </tbody>
  </table>
  <p>Clique em <strong>"Próxima etapa →"</strong> para avançar.</p>

  <h3 class="st">Etapa 2 — Onde está acontecendo?</h3>
  <p>Informe onde o problema está ocorrendo. Estas informações ajudam a TI a ir diretamente ao local correto.</p>
  <table class="ft">
    <thead><tr><th>Campo</th><th>Instrução de preenchimento</th></tr></thead>
    <tbody>
      <tr><td class="td-field">Setor <sup class="req">✦</sup></td><td>Já vem preenchido com seu setor. Altere apenas se o problema for em outro setor.</td></tr>
      <tr><td class="td-field">Filial / Local <sup class="req">✦</sup></td><td>Já vem preenchido com sua filial. Confirme se está correto.</td></tr>
      <tr><td class="td-field">Sala / Mesa <em style="color:#888;font-weight:400;">(opcional)</em></td><td>Informe o local exato para facilitar o atendimento presencial. Ex: <code>Mesa 3 — sala comercial</code></td></tr>
    </tbody>
  </table>

  <h3 class="st">Etapa 3 — O que está acontecendo?</h3>
  <p>Esta é a etapa mais importante. Quanto mais detalhes você informar, mais rápido a TI consegue resolver o problema.</p>
  <table class="ft">
    <thead><tr><th>Campo</th><th>Instrução de preenchimento</th></tr></thead>
    <tbody>
      <tr><td class="td-field">Categoria <sup class="req">✦</sup></td><td>Selecione o tipo do problema na lista:<br/>
        <strong>Hardware</strong> — Computador, monitor, teclado, mouse, nobreak físico com defeito<br/>
        <strong>Software</strong> — Programa não abre, travando, instalação necessária<br/>
        <strong>Acesso / Senha</strong> — Esqueceu senha, bloqueado, sem acesso a sistema<br/>
        <strong>Internet / Rede</strong> — Sem internet, rede lenta, wi-fi com problema<br/>
        <strong>Impressora</strong> — Impressora com erro, fila travada, sem tinta<br/>
        <strong>Câmeras</strong> — Câmera de segurança com problema<br/>
        <strong>Outros</strong> — Qualquer outro problema de TI</td></tr>
      <tr><td class="td-field">Título <sup class="req">✦</sup></td><td>Descreva o problema em 1 frase curta. Ex: <code>Computador não liga</code>, <code>Não consigo acessar o e-mail</code>, <code>Impressora não imprime</code></td></tr>
      <tr><td class="td-field">Descrição <sup class="req">✦</sup></td><td>Explique com detalhes: quando começou? O que aparece na tela? Já tentou fazer alguma coisa? Mais alguém está com o mesmo problema?</td></tr>
      <tr><td class="td-field">Prioridade sugerida <em style="color:#888;font-weight:400;">(opcional)</em></td><td>Marque se o problema está te impedindo de trabalhar. A TI avaliará e pode ajustar a prioridade real.</td></tr>
    </tbody>
  </table>

  ${tip('💡','blue','Descrição detalhada agiliza seu atendimento:','Uma boa descrição evita que a TI precise ligar pedindo mais informações. Inclua: mensagem de erro na tela, nome do programa com problema, desde quando ocorre e se já tentou reiniciar o equipamento.')}

  <h3 class="st">Etapa 4 — Tem print ou imagem?</h3>
  <p>Esta etapa é <strong>opcional</strong>, mas muito útil. Se o problema aparece na tela do seu computador, você pode:</p>
  <div class="steps">
    <div class="step"><div class="step-n">1</div><div class="step-body"><strong>Tirar um print da tela</strong>Pressione a tecla <code>Print Screen</code> no teclado ou use <code>Windows + Shift + S</code> para capturar parte da tela.</div></div>
    <div class="step"><div class="step-n">2</div><div class="step-body"><strong>Colar ou selecionar o arquivo</strong>Clique em "Adicionar arquivo" na tela ou arraste o arquivo para a área indicada. São aceitos: PNG, JPG, PDF.</div></div>
  </div>

  <h3 class="st">Etapa 5 — Revisão e envio</h3>
  <p>Na última etapa, revise todas as informações. Se estiver tudo correto, clique no botão <strong>"Abrir Ordem de Serviço"</strong>. O sistema gera um <strong>número de protocolo único</strong> (ex: <code>OS-2026-00004</code>) e a TI recebe a notificação imediatamente.</p>

  ${tip('✅','green','Chamado aberto com sucesso!','Guarde o número de protocolo. Você pode usar ele para buscar o chamado rapidamente. A TI entrará em contato pelo seu telefone caso precise de mais detalhes antes de atender.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 6 — ACOMPANHANDO SEUS CHAMADOS                 ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">06</div></div>
    <div class="ch-body">
      <h2>Acompanhando seus chamados</h2>
      <p>Como verificar o status e histórico de todos os chamados que você abriu</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Clique em <strong>"Meus chamados"</strong> no menu lateral para ver a lista completa de todas as suas Ordens de Serviço com filtros, busca e status em tempo real.</p>

  ${sc(P_LISTA, 'AgroDesk TI — Meus Chamados (lista do solicitante)')}

  <h3 class="st">O que significa cada status</h3>
  <table class="ft">
    <thead><tr><th>Status</th><th>O que está acontecendo</th><th>O que você deve fazer</th></tr></thead>
    <tbody>
      <tr><td><div class="status-row"><div class="sdot" style="background:#3b82f6"></div><strong>Aberto</strong></div></td><td>OS criada, aguardando a TI assumir o atendimento</td><td>Aguardar. A TI responderá em breve.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#f59e0b"></div><strong>Em atendimento</strong></div></td><td>Um técnico já está cuidando do seu chamado</td><td>Aguardar. Pode ser contatado pelo técnico.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#8b5cf6"></div><strong>Aguardando você</strong></div></td><td>A TI precisa de uma resposta ou ação da sua parte para continuar</td><td>⚠️ <strong>Acesse o chamado e responda!</strong> Quanto mais rápido, mais rápido a TI resolve.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#94a3b8"></div><strong>Aguardando peça</strong></div></td><td>O técnico aguarda chegada de uma peça ou material externo</td><td>Aguardar. A TI informará quando a peça chegar.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#10b981"></div><strong>Resolvido</strong></div></td><td>A TI marcou o problema como resolvido e aguarda sua confirmação</td><td>✅ Confirme que está funcionando — ou reabra se o problema persistir.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#059669"></div><strong>Finalizado</strong></div></td><td>Chamado encerrado com sucesso após confirmação</td><td>Se quiser, avalie o atendimento com 1 a 5 estrelas.</td></tr>
      <tr><td><div class="status-row"><div class="sdot" style="background:#ef4444"></div><strong>Cancelado</strong></div></td><td>OS cancelada por você ou pela TI</td><td>Se o problema ainda existir, abra um novo chamado.</td></tr>
    </tbody>
  </table>

  <h3 class="st">Como usar a busca e os filtros</h3>
  <div class="steps">
    <div class="step"><div class="step-n">🔍</div><div class="step-body"><strong>Busca por texto</strong>Digite o número do protocolo, o título ou parte da descrição no campo de busca. Ex: digitando "impressora" aparecerão todos os chamados relacionados.</div></div>
    <div class="step"><div class="step-n">🎯</div><div class="step-body"><strong>Filtro por status</strong>Clique nos botões "Todos", "Abertos", "Em atendimento", "Aguardando você" ou "Finalizados" para ver apenas os chamados daquele status.</div></div>
  </div>

  ${tip('⚠️','red','"Aguardando você" exige ação imediata:','Quando seu chamado entrar neste status, a TI está aguardando uma resposta sua para poder continuar o atendimento. Abra o chamado e responda no campo de comentários.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 7 — INTERAGINDO COM A TI                       ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">07</div></div>
    <div class="ch-body">
      <h2>Interagindo com a equipe de TI</h2>
      <p>Como enviar mensagens, confirmar resolução e avaliar o atendimento</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Clique em qualquer chamado da lista para ver todos os detalhes, o histórico de atualizações e se comunicar diretamente com o técnico responsável.</p>

  ${sc(P_DETAL, 'AgroDesk TI — Detalhe do chamado (visão do solicitante)')}

  <h3 class="st">O que você vê nesta tela</h3>
  <table class="ft">
    <thead><tr><th>Informação</th><th>Onde encontrar</th></tr></thead>
    <tbody>
      <tr><td class="td-field">Número do protocolo</td><td>Topo da tela (ex: <code>OS-2026-00003</code>)</td></tr>
      <tr><td class="td-field">Status atual</td><td>Badge colorido ao lado do título (ex: <span class="pill p-blue" style="display:inline">● Aberto</span>)</td></tr>
      <tr><td class="td-field">Técnico responsável</td><td>Campo "Responsável" no painel de informações</td></tr>
      <tr><td class="td-field">Prazo de atendimento (SLA)</td><td>Barra de progresso no painel lateral direito</td></tr>
      <tr><td class="td-field">Histórico completo</td><td>Seção de comentários / histórico na parte inferior</td></tr>
      <tr><td class="td-field">Mensagens da TI</td><td>Comentários da equipe de TI aparecem na timeline</td></tr>
    </tbody>
  </table>

  <h3 class="st">Como responder ou enviar uma mensagem</h3>
  <div class="steps">
    <div class="step"><div class="step-n">1</div><div class="step-body"><strong>Abra o chamado</strong>Clique no chamado na lista de "Meus chamados".</div></div>
    <div class="step"><div class="step-n">2</div><div class="step-body"><strong>Role até a seção de comentários</strong>Ela fica na parte inferior da tela do chamado.</div></div>
    <div class="step"><div class="step-n">3</div><div class="step-body"><strong>Digite sua mensagem</strong>Escreva sua resposta, informação adicional ou dúvida no campo de texto.</div></div>
    <div class="step"><div class="step-n">4</div><div class="step-body"><strong>Clique em "Enviar"</strong>Seu comentário ficará registrado e a TI receberá uma notificação imediatamente.</div></div>
  </div>

  <h3 class="st">Confirmando que o problema foi resolvido</h3>
  <p>Quando a TI resolver seu problema, o status mudará para <strong>"Resolvido"</strong>. Você receberá uma notificação. Então:</p>
  <div class="steps">
    <div class="step"><div class="step-n">✅</div><div class="step-body"><strong>Se o problema foi resolvido:</strong>Clique em <strong>"Confirmar resolução"</strong>. O chamado será finalizado e você poderá avaliá-lo.</div></div>
    <div class="step"><div class="step-n">🔄</div><div class="step-body"><strong>Se o problema voltou ou não foi resolvido:</strong>Clique em <strong>"Reabrir"</strong>. O chamado voltará para atendimento mantendo todo o histórico anterior.</div></div>
  </div>

  ${tip('⭐','green','Avalie o atendimento:','Após o chamado ser finalizado, você pode dar uma nota de 1 a 5 estrelas. Sua avaliação é importante para a TI melhorar cada vez mais o atendimento!')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 8 — ENTENDENDO OS PRAZOS (SLA)                 ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">08</div></div>
    <div class="ch-body">
      <h2>Entendendo os prazos de atendimento (SLA)</h2>
      <p>Como funciona o controle de tempo e prioridade dos chamados</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>Cada chamado de TI tem um <strong>prazo máximo de atendimento</strong>, chamado de SLA (<em>Service Level Agreement</em>). Esse prazo começa a contar no momento em que você abre o chamado e garante que nenhuma solicitação fique esquecida.</p>

  <h3 class="st">Prioridades e prazos de atendimento</h3>
  <table class="ft">
    <thead><tr><th>Prioridade</th><th>Quando usar</th><th>Prazo típico</th></tr></thead>
    <tbody>
      <tr>
        <td><span class="pill p-red">🔴 Crítica</span></td>
        <td>Sistema totalmente parado, afetando a operação da empresa (ex: caixa sem funcionar, sistema de vendas fora do ar)</td>
        <td><strong>2 a 4 horas</strong></td>
      </tr>
      <tr>
        <td><span class="pill p-yellow">🟡 Alta</span></td>
        <td>Você está impossibilitado de realizar suas atividades principais (ex: computador não liga, sem acesso ao sistema que usa para trabalhar)</td>
        <td><strong>4 a 8 horas</strong></td>
      </tr>
      <tr>
        <td><span class="pill p-blue">🔵 Média</span></td>
        <td>Problema moderado — existe uma alternativa temporária (ex: impressora com defeito, mas há outra disponível)</td>
        <td><strong>24 a 48 horas</strong></td>
      </tr>
      <tr>
        <td><span class="pill p-gray">⚪ Baixa</span></td>
        <td>Melhoria, ajuste ou problema que não impede o trabalho (ex: instalação de software opcional, ajuste de configuração)</td>
        <td><strong>72 a 120 horas</strong></td>
      </tr>
    </tbody>
  </table>

  <h3 class="st">Como ler a barra de prazo no chamado</h3>
  <div class="igrid">
    <div class="icard" style="border-left:4px solid #16a34a;">
      <div class="ic-icon">🟢</div>
      <div class="ic-t" style="color:#166534;">Dentro do prazo</div>
      <div class="ic-b">Barra verde — ainda há tempo suficiente para atendimento. Tudo sob controle.</div>
    </div>
    <div class="icard" style="border-left:4px solid #f59e0b;">
      <div class="ic-icon">🟡</div>
      <div class="ic-t" style="color:#854d0e;">Prazo próximo</div>
      <div class="ic-b">Barra amarela — menos de 25% do prazo restante. A TI já está ciente e priorizando.</div>
    </div>
    <div class="icard" style="border-left:4px solid #ef4444;">
      <div class="ic-icon">🔴</div>
      <div class="ic-t" style="color:#991b1b;">Prazo ultrapassado</div>
      <div class="ic-b">Barra vermelha — prazo estourado. A TI está tomando ação para resolver com urgência.</div>
    </div>
    <div class="icard" style="border-left:4px solid #8b5cf6;">
      <div class="ic-icon">⏸️</div>
      <div class="ic-t" style="color:#5b21b6;">Prazo pausado</div>
      <div class="ic-b">SLA suspenso enquanto aguarda peça, aprovação externa ou resposta do usuário. O relógio para neste período.</div>
    </div>
  </div>

  ${tip('💡','blue','O prazo conta a seu favor:','O sistema garante que nenhum chamado seja esquecido. Se um chamado estiver com o prazo próximo de vencer, a TI recebe um alerta automático e deve priorizar seu atendimento.')}
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 9 — DICAS PARA BONS CHAMADOS                   ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">09</div></div>
    <div class="ch-body">
      <h2>Dicas para bons chamados</h2>
      <p>Como descrever seu problema da forma mais eficiente e ter um atendimento mais rápido</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <p>A qualidade das informações que você fornece ao abrir um chamado tem impacto direto na <strong>velocidade do atendimento</strong>. Quanto mais detalhes, menos idas e vindas entre você e a TI.</p>

  <h3 class="st">✅ Exemplos de boa descrição vs. descrição insuficiente</h3>
  <table class="ft">
    <thead><tr><th style="background:#dc2626;">❌ Descrição insuficiente</th><th style="background:#16a34a;">✅ Descrição completa</th></tr></thead>
    <tbody>
      <tr>
        <td><em>"Meu computador não funciona"</em></td>
        <td><em>"Meu computador (mesa 4, sala financeiro) não liga desde hoje de manhã. Quando aperto o botão liga, a luz acende por 2 segundos e apaga. Tentei trocar de tomada e não resolveu."</em></td>
      </tr>
      <tr>
        <td><em>"O sistema deu erro"</em></td>
        <td><em>"O sistema Omie deu a mensagem 'Erro de conexão com servidor' ao tentar emitir uma NF-e. Isso acontece desde as 14h de hoje. Tentei fechar e abrir o sistema, mas o erro continua."</em></td>
      </tr>
      <tr>
        <td><em>"Internet lenta"</em></td>
        <td><em>"A internet da sala de vendas está muito lenta desde segunda-feira. O wi-fi de 5GHz não conecta e o de 2.4GHz conecta mas carrega muito devagar. Afeta todos os 3 computadores da sala."</em></td>
      </tr>
    </tbody>
  </table>

  <h3 class="st">Lista de informações úteis para incluir</h3>
  <div class="igrid">
    <div class="icard">
      <div class="ic-icon">📍</div>
      <div class="ic-t">Localização exata</div>
      <div class="ic-b">Sala, mesa, filial, setor. Ajuda o técnico a ir diretamente ao local correto.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">🕐</div>
      <div class="ic-t">Desde quando ocorre</div>
      <div class="ic-b">"Desde hoje de manhã", "Desde segunda", "Começou depois de reiniciar".</div>
    </div>
    <div class="icard">
      <div class="ic-icon">📱</div>
      <div class="ic-t">Print ou foto da tela</div>
      <div class="ic-b">Uma imagem do erro ou problema vale mais que mil palavras. Use a Etapa 4 do formulário.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">👥</div>
      <div class="ic-t">Quantas pessoas afetadas</div>
      <div class="ic-b">Só você ou todo o setor? Isso ajuda a TI a avaliar a prioridade corretamente.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">🔄</div>
      <div class="ic-t">O que já foi tentado</div>
      <div class="ic-b">"Já reiniciei", "Já troquei o cabo", "Já tentei em outro computador". Evita retrabalho.</div>
    </div>
    <div class="icard">
      <div class="ic-icon">💬</div>
      <div class="ic-t">Mensagem de erro exata</div>
      <div class="ic-b">Se aparecer uma mensagem de erro na tela, copie ou fotografe o texto completo.</div>
    </div>
  </div>

  <h3 class="st">Boas práticas de uso do sistema</h3>
  <div class="steps">
    <div class="step"><div class="step-n">📋</div><div class="step-body"><strong>1 problema = 1 chamado</strong>Abra um chamado separado para cada problema diferente. Isso garante que cada issue tenha seu próprio prazo e controle.</div></div>
    <div class="step"><div class="step-n">🚫</div><div class="step-body"><strong>Não duplique chamados</strong>Não abra dois chamados para o mesmo problema. Use a busca para verificar se já há um chamado aberto antes de criar um novo.</div></div>
    <div class="step"><div class="step-n">💬</div><div class="step-body"><strong>Use os comentários para atualizar</strong>Se o problema piorou ou houve alguma mudança, adicione um comentário no chamado existente. Não abra um novo.</div></div>
    <div class="step"><div class="step-n">📱</div><div class="step-body"><strong>Responda rápido quando solicitado</strong>Se o status mudar para "Aguardando você", responda o mais rápido possível para não atrasar seu próprio atendimento.</div></div>
  </div>
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CAP 10 — FAQ                                       ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="chapter">
  <div class="ch-header">
    <div class="ch-num-band"><div class="ch-label">Capítulo</div><div class="ch-n">10</div></div>
    <div class="ch-body">
      <h2>Perguntas Frequentes</h2>
      <p>As dúvidas mais comuns dos usuários respondidas de forma direta</p>
    </div>
    <div class="ch-logo"><img src="${LOGO}" alt=""/></div>
  </div>

  <div class="faq-item">
    <div class="faq-q">❓ Não consigo fazer login. O que faço?</div>
    <div class="faq-a">Verifique se o nome de usuário está correto — sem espaços, sem @ e sem maiúsculas. Certifique-se de que o Caps Lock está desligado. Se a senha estiver errada, use o link "Esqueci minha senha". Caso não tenha e-mail cadastrado, entre em contato com a TI diretamente.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Posso abrir mais de um chamado ao mesmo tempo?</div>
    <div class="faq-a">Sim! Você pode ter quantos chamados abertos forem necessários. Lembre-se: abra 1 chamado por problema. Cada um terá seu próprio protocolo e prazo de atendimento.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Como sei quando meu chamado foi resolvido?</div>
    <div class="faq-a">O status do chamado mudará para "Resolvido" e você verá uma notificação no sino (🔔) no topo da tela. Se tiver e-mail cadastrado, também receberá por e-mail. Você precisa confirmar a resolução ou reabrir o chamado.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ O problema foi resolvido mas voltou. O que faço?</div>
    <div class="faq-a">Acesse o chamado e clique em "Reabrir". A OS voltará para atendimento mantendo todo o histórico. Adicione um comentário descrevendo que o problema voltou e como está acontecendo agora.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Posso cancelar um chamado depois de aberto?</div>
    <div class="faq-a">Sim, enquanto o status estiver como "Aberto". Acesse o chamado e procure a opção de cancelar. Após a TI assumir, entre em contato com o técnico responsável via comentário para solicitar o cancelamento.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ O técnico disse que está "aguardando peça". Por quanto tempo vai ficar assim?</div>
    <div class="faq-a">O prazo (SLA) fica pausado enquanto o chamado estiver neste status — ou seja, o relógio para. A TI entrará em contato assim que a peça chegar ou fornecerá uma previsão nos comentários do chamado.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Posso ver os chamados de outros colegas?</div>
    <div class="faq-a">Não. Como Solicitante, você vê apenas os seus próprios chamados. Apenas a equipe de TI tem acesso a todos os chamados da empresa.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Como atualizo meu telefone ou setor no sistema?</div>
    <div class="faq-a">Acesse "Meu perfil" no menu lateral esquerdo e edite suas informações. Manter seus dados atualizados garante que a TI consiga entrar em contato com você rapidamente.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ Posso abrir um chamado para um problema de outro colega?</div>
    <div class="faq-a">Sim, mas preencha o campo de descrição informando o nome e setor do colega afetado para que a TI saiba onde e para quem ir. Informe também o telefone correto para contato.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">❓ O sistema não abre no meu navegador. O que faço?</div>
    <div class="faq-a">Verifique se está usando Chrome, Edge ou Firefox atualizados. Tente limpar o cache do navegador (Ctrl+Shift+Del). Se ainda não funcionar, abra um chamado de TI via outro computador ou informe a TI pessoalmente.</div>
  </div>
</div>

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!-- ║  CONTRACAPA                                          ║ -->
<!-- ╚══════════════════════════════════════════════════════╝ -->
<div class="back-cover">
  <div class="back-logo-wrap">
    <img src="${LOGO}" alt="Casa do Campo" />
  </div>
  <h3>Precisa de ajuda?</h3>
  <div class="back-line"></div>
  <p>Lembre-se: a melhor forma de solicitar suporte de TI é sempre pelo <strong>AgroDesk TI</strong>. Isso garante que seu chamado seja registrado, priorizado e atendido dentro do prazo.</p>
  <div class="back-contacts">
    <div class="back-contact-card">
      <div class="bcc-icon">🌐</div>
      <div class="bcc-t">Sistema</div>
      <div class="bcc-v">AgroDesk TI</div>
    </div>
    <div class="back-contact-card">
      <div class="bcc-icon">🏢</div>
      <div class="bcc-t">Empresa</div>
      <div class="bcc-v">Casa do Campo</div>
    </div>
    <div class="back-contact-card">
      <div class="bcc-icon">🛡️</div>
      <div class="bcc-t">Departamento</div>
      <div class="bcc-v">T.I.</div>
    </div>
    <div class="back-contact-card">
      <div class="bcc-icon">📅</div>
      <div class="bcc-t">Versão</div>
      <div class="bcc-v">Agosto 2026</div>
    </div>
  </div>
  <p style="margin-top:36px;font-size:11px;color:rgba(255,255,255,.3);">
    Documento de uso interno e exclusivo dos colaboradores da Casa do Campo Agropecuária.<br/>
    É proibida a reprodução ou distribuição sem autorização do Departamento de TI.
  </p>
</div>

</body>
</html>`;

fs.writeFileSync('manual_solicitante.html', html, 'utf8');
const sizeMB = (html.length / 1024 / 1024).toFixed(1);
console.log(`✅ manual_solicitante.html gerado — ${sizeMB} MB`);
