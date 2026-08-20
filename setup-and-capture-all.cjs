const puppeteer = require('puppeteer-core');
const { PrismaClient, UserRole } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcrypt');

const prisma = new PrismaClient();
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log("=== SETUP DO USUÁRIO TESTE E CAPTURA COMPLETA DE TODAS AS TELAS ===");

  // 1. Criar/Garantir Usuário Teste Solicitante (Carolina Silva)
  const passwordHash = await bcrypt.hash('12345678', 10);
  
  const deptFinanceiro = await prisma.department.findFirst({ where: { name: 'Financeiro' } }) 
    || await prisma.department.findFirst();
  const branchLoja1 = await prisma.branch.findFirst({ where: { name: 'Loja 1' } }) 
    || await prisma.branch.findFirst();

  let testUser = await prisma.user.findFirst({ where: { username: 'carolina.silva' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'Carolina Silva',
        username: 'carolina.silva',
        email: 'carolina.silva@casadocampo.com.br',
        phone: '(44) 99888-7766',
        role: UserRole.SOLICITANTE,
        position: 'Analista Financeiro',
        departmentId: deptFinanceiro.id,
        branchId: branchLoja1.id,
        passwordHash: passwordHash,
        isActive: true,
      }
    });
    console.log("-> Usuário teste 'carolina.silva' criado com sucesso!");
  } else {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { passwordHash: passwordHash, isActive: true }
    });
    console.log("-> Usuário teste 'carolina.silva' atualizado com senha 12345678!");
  }

  // Garantir senha do Admin Victor
  const victor = await prisma.user.findFirst({ where: { username: 'Victor' } });
  if (victor) {
    await prisma.user.update({
      where: { id: victor.id },
      data: { passwordHash: passwordHash, isActive: true }
    });
  }

  // 2. Fazer Login via API para Solicitante e Admin
  const resSol = await fetch('http://localhost:3333/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'carolina.silva', password: '12345678' })
  });
  const authSol = await resSol.json();

  const resAdm = await fetch('http://localhost:3333/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Victor', password: '12345678' })
  });
  const authAdm = await resAdm.json();

  console.log("-> Login Solicitante API Status:", resSol.status);
  console.log("-> Login Admin API Status:", resAdm.status);

  // Launch Puppeteer with Edge
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 820 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // PRINT 1: LOGIN
  console.log("1. Capturando Tela de Login...");
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'print_01_login.png' });

  // PRINT 2: CADASTRO DE USUÁRIO
  console.log("2. Capturando Tela de Cadastro de Usuário...");
  await page.goto('http://localhost:3001/cadastro', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'print_02_cadastro.png' });

  // AUTENTICAR NAVEGADOR COMO SOLICITANTE
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
  await page.evaluate((data) => {
    localStorage.setItem('agrodesk-ti-access-token-v1', data.accessToken);
    localStorage.setItem('agrodesk-ti-refresh-token-v1', data.refreshToken);
    localStorage.setItem('agrodesk-ti-current-user-v1', JSON.stringify(data.user));
  }, authSol);

  // PRINT 3: PORTAL PRINCIPAL DO SOLICITANTE
  console.log("3. Capturando Portal do Solicitante...");
  await page.goto('http://localhost:3001/app/chamados', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_03_portal_solicitante.png' });

  // PRINT 4: FORMULÁRIO DE NOVA OS
  console.log("4. Capturando Formulário de Nova OS...");
  await page.goto('http://localhost:3001/app/nova-os', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_04_nova_os_formulario.png' });

  // PRINT 5: MEUS CHAMADOS COM SLA E STATUS
  console.log("5. Capturando Meus Chamados...");
  await page.goto('http://localhost:3001/app/chamados', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_05_meus_chamados_status.png' });

  // PRINT 6: DETALHE DA OS
  console.log("6. Capturando Detalhe da OS...");
  const firstTicketLink = await page.$('a[href*="/app/chamados/"]');
  if (firstTicketLink) {
    await firstTicketLink.click();
    await new Promise(r => setTimeout(r, 2000));
  }
  await page.screenshot({ path: 'print_06_detalhe_os_usuario.png' });

  // AUTENTICAR NAVEGADOR COMO TI ADMIN (VICTOR)
  console.log("--- Alternando para Sessão de TI Admin ---");
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
  await page.evaluate((data) => {
    localStorage.setItem('agrodesk-ti-access-token-v1', data.accessToken);
    localStorage.setItem('agrodesk-ti-refresh-token-v1', data.refreshToken);
    localStorage.setItem('agrodesk-ti-current-user-v1', JSON.stringify(data.user));
  }, authAdm);

  // PRINT 7: DASHBOARD / RELATÓRIOS TI ADMIN
  console.log("7. Capturando Dashboard Admin / Relatórios...");
  await page.goto('http://localhost:3001/app/relatorios', { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  if (page.url().includes('/login')) {
    await page.goto('http://localhost:3001/app/chamados', { waitUntil: 'networkidle0' });
  }
  await page.screenshot({ path: 'print_07_dashboard_admin.png' });

  // PRINT 8: GESTÃO DE PATRIMÔNIO / INVENTÁRIO TI
  console.log("8. Capturando Gestão de Patrimônio...");
  await page.goto('http://localhost:3001/app/patrimonio', { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_08_inventario_patrimonios.png' });

  // PRINT 9: GESTÃO DE USUÁRIOS
  console.log("9. Capturando Gestão de Usuários...");
  await page.goto('http://localhost:3001/app/usuarios', { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_09_gestao_usuarios.png' });

  // PRINT 10: AUDITORIA E CONFIGURAÇÕES
  console.log("10. Capturando Auditoria e Configurações...");
  await page.goto('http://localhost:3001/app/auditoria', { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'print_10_auditoria_configuracoes.png' });

  await browser.close();
  console.log("✅ TODAS AS 10 CAPTURAS DE TELA REALIZADAS COM ÉXITO!");
}

main()
  .catch(err => {
    console.error("Erro no setup/captura:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
