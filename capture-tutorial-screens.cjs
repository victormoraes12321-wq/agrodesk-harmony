/**
 * Script de Captura Completa do Tutorial AgroDesk TI
 * Faz login via formulário, navega em cada tela e tira screenshot.
 */
const puppeteer = require('puppeteer-core');
const { PrismaClient, UserRole } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcrypt');

const prisma = new PrismaClient();
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3333';
const SENHA_TESTE = 'Agrodesk@2026';

async function waitAndShot(page, path, ms = 2500) {
  await new Promise(r => setTimeout(r, ms));
  await page.screenshot({ path, fullPage: false });
  console.log(`   ✅ Salvo: ${path}`);
}

async function loginAs(page, username, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));

  // Limpa campos e digita
  await page.click('input[name="username"], input[placeholder*="usu"], input[type="text"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.type('input[name="username"], input[placeholder*="usu"], input[type="text"]', username, { delay: 60 });

  await page.click('input[name="password"], input[type="password"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.type('input[name="password"], input[type="password"]', password, { delay: 60 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  const currentUrl = page.url();
  console.log(`   -> Logado como ${username}. URL atual: ${currentUrl}`);
  return currentUrl;
}

async function main() {
  console.log('=== CAPTURA DE TELAS DO TUTORIAL AGRODESK TI ===\n');

  // ──────────────────────────────────────────────
  // 1. PREPARAR USUÁRIO TESTE NO BANCO
  // ──────────────────────────────────────────────
  const hash = await bcrypt.hash(SENHA_TESTE, 10);

  const dept = await prisma.department.findFirst({ where: { name: 'Financeiro' } })
    ?? await prisma.department.findFirst();
  const branch = await prisma.branch.findFirst({ where: { name: 'Loja 1' } })
    ?? await prisma.branch.findFirst();

  let carolUser = await prisma.user.findFirst({ where: { username: 'carolina.silva' } });
  if (!carolUser) {
    carolUser = await prisma.user.create({
      data: {
        name: 'Carolina Silva',
        username: 'carolina.silva',
        email: 'carolina.silva@casadocampo.com.br',
        phone: '(44) 99888-7766',
        role: UserRole.SOLICITANTE,
        position: 'Analista Financeiro',
        departmentId: dept.id,
        branchId: branch.id,
        passwordHash: hash,
        isActive: true,
        mustChangePassword: false,
      }
    });
    console.log('✅ Usuário carolina.silva criado');
  } else {
    await prisma.user.update({
      where: { id: carolUser.id },
      data: { passwordHash: hash, isActive: true, mustChangePassword: false }
    });
    console.log('✅ Usuário carolina.silva atualizado');
  }

  // Atualiza senha do admin Victor
  const victor = await prisma.user.findFirst({ where: { username: 'Victor' } });
  if (victor) {
    await prisma.user.update({
      where: { id: victor.id },
      data: { passwordHash: hash, isActive: true, mustChangePassword: false }
    });
    console.log('✅ Admin Victor senha atualizada');
  }

  // ──────────────────────────────────────────────
  // 2. ABRIR NAVEGADOR
  // ──────────────────────────────────────────────
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 820 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);

  // ──────────────────────────────────────────────
  // BLOCO 1 — TELA DE LOGIN (sem estar logado)
  // ──────────────────────────────────────────────
  console.log('\n📸 1. Tela de Login');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_01_tela_login.png');

  // ──────────────────────────────────────────────
  // BLOCO 2 — TELA DE CADASTRO DE USUÁRIO
  // ──────────────────────────────────────────────
  console.log('\n📸 2. Tela de Cadastro de Usuário');
  await page.goto(`${BASE_URL}/cadastro`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_02_cadastro_usuario.png');

  // ──────────────────────────────────────────────
  // BLOCO 3 — LOGIN COMO CAROLINA (SOLICITANTE)
  // ──────────────────────────────────────────────
  console.log('\n📸 3. Fazendo login como Carolina Silva (Solicitante)...');
  await loginAs(page, 'carolina.silva', SENHA_TESTE);

  // ──────────────────────────────────────────────
  // BLOCO 4 — PORTAL DO SOLICITANTE (Lista de chamados)
  // ──────────────────────────────────────────────
  console.log('\n📸 4. Portal do Solicitante - Meus Chamados');
  await page.goto(`${BASE_URL}/app/chamados`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_03_portal_solicitante_chamados.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 5 — FORMULÁRIO DE ABERTURA DE NOVA OS (passo a passo)
  // ──────────────────────────────────────────────
  console.log('\n📸 5. Formulário de Nova OS - Etapa 1');
  await page.goto(`${BASE_URL}/app/nova-os`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_04_nova_os_etapa1.png', 2500);

  // Tenta preencher campo de título para simular usuário preenchendo
  try {
    const tituloInput = await page.$('input[name="title"], input[placeholder*="título"], input[placeholder*="assunto"], textarea[name="title"]');
    if (tituloInput) {
      await tituloInput.type('Computador não liga na sala financeiro', { delay: 40 });
      await waitAndShot(page, 'tutorial_04b_nova_os_titulo_preenchido.png', 1000);
    }
  } catch (e) { /* ignora */ }

  // ──────────────────────────────────────────────
  // BLOCO 6 — APÓS CRIAR OS (simulação)
  // ──────────────────────────────────────────────
  console.log('\n📸 6. Retornando para lista de chamados com OS criada');
  await page.goto(`${BASE_URL}/app/chamados`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_05_chamados_lista_com_os.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 7 — DETALHE DE UMA OS (como solicitante)
  // ──────────────────────────────────────────────
  console.log('\n📸 7. Detalhe de OS como Solicitante');
  try {
    const links = await page.$$('a[href*="/app/chamados/"]');
    if (links.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
        links[0].click(),
      ]);
    }
  } catch (e) {
    // Se não achou link de chamado, usa URL direta genérica
    const tickets = await fetch(`${API_URL}/api/v1/tickets?limit=1`, {
      headers: { Authorization: `Bearer ${(await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'carolina.silva', password: SENHA_TESTE })
      }).then(r => r.json())).accessToken}` }
    }).then(r => r.json()).catch(() => ({ data: [] }));
    if (tickets?.data?.length) {
      await page.goto(`${BASE_URL}/app/chamados/${tickets.data[0].id}`, { waitUntil: 'networkidle2' });
    }
  }
  await waitAndShot(page, 'tutorial_06_detalhe_os_solicitante.png', 2500);

  // ──────────────────────────────────────────────
  // BLOCO 8 — LOGIN COMO VICTOR (ADMIN TI)
  // ──────────────────────────────────────────────
  console.log('\n📸 8. Fazendo login como Victor (Admin TI)...');
  await loginAs(page, 'Victor', SENHA_TESTE);

  // ──────────────────────────────────────────────
  // BLOCO 9 — DASHBOARD ADMIN (lista de todos os chamados)
  // ──────────────────────────────────────────────
  console.log('\n📸 9. Dashboard TI - Todos os Chamados');
  await page.goto(`${BASE_URL}/app/chamados`, { waitUntil: 'networkidle2' });
  await waitAndShot(page, 'tutorial_07_dashboard_admin_chamados.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 10 — DETALHE DE OS (como TI / técnico)
  // ──────────────────────────────────────────────
  console.log('\n📸 10. Detalhe da OS - Visão do Técnico TI');
  try {
    const links = await page.$$('a[href*="/app/chamados/"]');
    if (links.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
        links[0].click(),
      ]);
    }
  } catch (e) { /* ignora */ }
  await waitAndShot(page, 'tutorial_08_detalhe_os_tecnico_ti.png', 2500);

  // ──────────────────────────────────────────────
  // BLOCO 11 — RELATÓRIOS / DASHBOARD GERENCIAL
  // ──────────────────────────────────────────────
  console.log('\n📸 11. Relatórios Gerenciais');
  await page.goto(`${BASE_URL}/app/relatorios`, { waitUntil: 'networkidle2' }).catch(() => {});
  await waitAndShot(page, 'tutorial_09_relatorios.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 12 — PATRIMÔNIO / INVENTÁRIO
  // ──────────────────────────────────────────────
  console.log('\n📸 12. Gestão de Patrimônio / Inventário');
  await page.goto(`${BASE_URL}/app/patrimonio`, { waitUntil: 'networkidle2' }).catch(() => {});
  await waitAndShot(page, 'tutorial_10_patrimonio_inventario.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 13 — GESTÃO DE USUÁRIOS
  // ──────────────────────────────────────────────
  console.log('\n📸 13. Gestão de Usuários');
  await page.goto(`${BASE_URL}/app/usuarios`, { waitUntil: 'networkidle2' }).catch(() => {});
  await waitAndShot(page, 'tutorial_11_gestao_usuarios.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 14 — CONFIGURAÇÕES DO SISTEMA
  // ──────────────────────────────────────────────
  console.log('\n📸 14. Configurações do Sistema');
  await page.goto(`${BASE_URL}/app/configuracoes`, { waitUntil: 'networkidle2' }).catch(() => {});
  await waitAndShot(page, 'tutorial_12_configuracoes_sistema.png', 3000);

  // ──────────────────────────────────────────────
  // BLOCO 15 — AUDITORIA
  // ──────────────────────────────────────────────
  console.log('\n📸 15. Auditoria do Sistema');
  await page.goto(`${BASE_URL}/app/auditoria`, { waitUntil: 'networkidle2' }).catch(() => {});
  await waitAndShot(page, 'tutorial_13_auditoria.png', 3000);

  await browser.close();
  console.log('\n✅ TODAS AS CAPTURAS REALIZADAS COM SUCESSO!');
  console.log('Arquivos: tutorial_01_*.png até tutorial_13_*.png');
}

main()
  .catch(err => {
    console.error('❌ Erro:', err.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
