/**
 * Converte manual_solicitante.html → PDF profissional
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('📄 Abrindo navegador...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  const htmlContent = fs.readFileSync('manual_solicitante.html', 'utf8');

  console.log('📝 Carregando HTML...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 90000 });

  // Aguarda fontes e imagens renderizarem completamente
  await new Promise(r => setTimeout(r, 4000));

  console.log('🖨️ Gerando PDF...');
  await page.pdf({
    path: 'Manual_Solicitante_AgroDesk_TI.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '16mm', left: '0mm', right: '0mm' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%;margin:0 14mm;font-family:'Segoe UI',Arial,sans-serif;
                  font-size:8.5px;color:#aaa;
                  display:flex;justify-content:space-between;align-items:center;
                  border-bottom:1px solid #e5e7eb;padding-bottom:5px;">
        <span style="color:#cc1717;font-weight:700;">AgroDesk TI</span>
        <span>Manual do Solicitante · Casa do Campo</span>
      </div>`,
    footerTemplate: `
      <div style="width:100%;margin:0 14mm;font-family:'Segoe UI',Arial,sans-serif;
                  font-size:8.5px;color:#aaa;
                  display:flex;justify-content:space-between;align-items:center;
                  border-top:1px solid #e5e7eb;padding-top:5px;">
        <span>Uso interno · Departamento de TI</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();

  const stat = fs.statSync('Manual_Solicitante_AgroDesk_TI.pdf');
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ PDF gerado com sucesso!`);
  console.log(`📄 Arquivo: Manual_Solicitante_AgroDesk_TI.pdf`);
  console.log(`📦 Tamanho: ${sizeMB} MB`);
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
