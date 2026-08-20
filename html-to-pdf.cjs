/**
 * Converte o manual_agrodesk_ti.html em PDF profissional
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('📄 Convertendo HTML → PDF...');

  const htmlContent = fs.readFileSync('manual_agrodesk_ti.html', 'utf8');
  const htmlBase64 = Buffer.from(htmlContent).toString('base64');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();

  // Carrega o HTML diretamente (sem necessidade de servidor)
  await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Aguarda fontes e imagens carregarem
  await new Promise(r => setTimeout(r, 3000));

  console.log('📝 Gerando PDF...');
  const pdf = await page.pdf({
    path: 'Manual_do_Usuario_AgroDesk_TI.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%; font-family:Arial,sans-serif; font-size:9px; color:#888; 
                  display:flex; justify-content:space-between; padding:0 15mm;">
        <span>AgroDesk TI — Manual do Usuário</span>
        <span>Casa do Campo Agropecuária · 2026</span>
      </div>`,
    footerTemplate: `
      <div style="width:100%; font-family:Arial,sans-serif; font-size:9px; color:#888; 
                  display:flex; justify-content:space-between; padding:0 15mm;">
        <span>Uso interno — Departamento de TI</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();

  const stat = fs.statSync('Manual_do_Usuario_AgroDesk_TI.pdf');
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`✅ PDF gerado com sucesso!`);
  console.log(`📄 Arquivo: Manual_do_Usuario_AgroDesk_TI.pdf`);
  console.log(`📦 Tamanho: ${sizeMB} MB`);
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
