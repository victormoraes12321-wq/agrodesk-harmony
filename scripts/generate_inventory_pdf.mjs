import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from './backend/node_modules/@prisma/client/default.js';

const prisma = new PrismaClient();

async function generateReport() {
  console.log('Fetching active assets from database...');
  const allAssets = await prisma.asset.findMany({
    where: { deletedAt: null },
    include: {
      assetType: true,
      branch: true,
      department: true,
      user: true,
      components: {
        where: { deletedAt: null },
        include: {
          assetType: true,
          user: true
        },
        orderBy: { code: 'asc' }
      },
      parent: {
        include: {
          assetType: true
        }
      }
    },
    orderBy: [
      { branch: { name: 'asc' } },
      { department: { name: 'asc' } },
      { code: 'asc' }
    ]
  });

  console.log(`Found ${allAssets.length} total active assets.`);

  // Load logo as base64
  let logoBase64 = '';
  const logoPath = path.resolve('public/Logo_Casa_do_Campo.png');
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }

  // Separate root assets (parents or standalone) from child components
  // Root assets are those where parentId is null
  const rootAssets = allAssets.filter(a => !a.parentId);
  const childAssets = allAssets.filter(a => a.parentId);

  // Group by Branch -> Department
  const tree = {};
  for (const asset of rootAssets) {
    const branchName = asset.branch?.name || 'Filial Não Informada';
    const deptName = asset.department?.name || 'Geral / Sem Setor';

    if (!tree[branchName]) tree[branchName] = {};
    if (!tree[branchName][deptName]) {
      tree[branchName][deptName] = {
        combos: [],
        standalone: []
      };
    }

    if (asset.components && asset.components.length > 0) {
      tree[branchName][deptName].combos.push(asset);
    } else {
      tree[branchName][deptName].standalone.push(asset);
    }
  }

  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalCombos = rootAssets.filter(a => a.components && a.components.length > 0).length;

  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Checklist de Etiquetagem & Inventário T.I. - Casa do Campo</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.35;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #064e3b;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-logo {
      height: 48px;
      width: auto;
      object-contain: fit;
    }
    .header-title {
      font-size: 14pt;
      font-weight: 900;
      color: #064e3b;
      text-transform: uppercase;
      letter-spacing: -0.3px;
      margin: 0;
    }
    .header-sub {
      font-size: 8pt;
      font-weight: 700;
      color: #047857;
      margin-top: 2px;
    }
    .header-meta {
      text-align: right;
      font-size: 7.5pt;
      color: #475569;
    }
    .stats-bar {
      display: flex;
      gap: 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 14px;
      font-size: 8pt;
      font-weight: 600;
      color: #065f46;
      justify-content: space-between;
    }
    .instructions-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 14px;
      font-size: 7.5pt;
      color: #334155;
    }
    .instructions-card strong {
      color: #0f172a;
    }
    .branch-header {
      background: #064e3b;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11pt;
      font-weight: 800;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-after: avoid;
    }
    .dept-header {
      background: #e2e8f0;
      color: #1e293b;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9.5pt;
      font-weight: 800;
      margin-top: 10px;
      margin-bottom: 6px;
      border-left: 3px solid #047857;
      page-break-after: avoid;
    }
    .combo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 10px;
      background: #ffffff;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .combo-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 5px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
    }
    .combo-title {
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .combo-host {
      background: #047857;
      color: #ffffff;
      padding: 1px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .combo-user {
      color: #475569;
      font-size: 7.5pt;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
    }
    table.data-table th {
      background: #f8fafc;
      color: #475569;
      text-align: left;
      padding: 4px 6px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table.data-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    table.data-table tr:last-child td {
      border-bottom: none;
    }
    table.data-table tr:hover {
      background: #f8fafc;
    }
    .checkbox-box {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1.5px solid #0f172a;
      border-radius: 3px;
      background: #ffffff;
      vertical-align: middle;
    }
    .tag-code {
      font-family: monospace;
      font-weight: 800;
      color: #047857;
      font-size: 8.5pt;
      white-space: nowrap;
    }
    .type-badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      background: #e2e8f0;
      color: #334155;
      font-size: 6.8pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .type-badge-pc { background: #dbeafe; color: #1e40af; }
    .type-badge-mon { background: #e0e7ff; color: #3730a3; }
    .type-badge-tec { background: #fef3c7; color: #92400e; }
    .type-badge-mou { background: #fef3c7; color: #92400e; }
    .type-badge-nob { background: #fee2e2; color: #991b1b; }
    .type-badge-bal { background: #ecfdf5; color: #065f46; }
    .type-badge-imp { background: #f3e8ff; color: #6b21a8; }
    
    .desc-cell {
      font-size: 7.2pt;
      color: #64748b;
    }
    .notes-line {
      border-bottom: 1px dotted #94a3b8;
      width: 100%;
      height: 12px;
    }
    .footer-sign {
      margin-top: 24px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 200px;
      text-align: center;
    }
    .sign-line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 4px;
      padding-bottom: 24px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 180px;">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="Casa do Campo" />` : `<strong>CASA DO CAMPO</strong>`}
      </td>
      <td style="text-align: center;">
        <h1 class="header-title">Checklist de Etiquetagem Patrimonial</h1>
        <div class="header-sub">Relação Completa de Equipamentos de T.I. Organizada por Postos de Trabalho & Combos</div>
      </td>
      <td class="header-meta" style="width: 140px;">
        <div><strong>Emissão:</strong> ${generationDate}</div>
        <div><strong>Responsável:</strong> Victor Moraes (T.I.)</div>
        <div><strong>Sistema:</strong> AgroDesk TI Harmony</div>
      </td>
    </tr>
  </table>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <span>📦 Total de Ativos Mapeados: <strong>${allAssets.length}</strong></span>
    <span>💻 Estações de Trabalho (Combos): <strong>${totalCombos}</strong></span>
    <span>🏢 Filiais: <strong>${Object.keys(tree).length}</strong></span>
    <span>📁 Setores com Equipamentos: <strong>${Object.values(tree).reduce((acc, depts) => acc + Object.keys(depts).length, 0)}</strong></span>
  </div>

  <!-- Instructions -->
  <div class="instructions-card">
    <strong>📋 Instruções de Trabalho:</strong> 
    1. Percorra os setores identificando o <strong>Hostname</strong> ou <strong>Usuário</strong> indicado no cabeçalho do combo. 
    2. Cole a etiqueta de patrimônio no Gabinete/Desktop e as etiquetas vinculadas nos respectivos periféricos (Monitor, Teclado, Mouse, Nobreak). 
    3. Marque o checkbox <strong>[✓]</strong> após colar a etiqueta e conferir o número de série (S/N).
  </div>
`;

  // Render tree
  for (const [branchName, depts] of Object.entries(tree)) {
    html += `\n<div class="branch-header">🏢 ${branchName}</div>`;

    for (const [deptName, group] of Object.entries(depts)) {
      html += `\n<div class="dept-header">📁 Setor: ${deptName} (${group.combos.length} estação(ões) de trabalho / ${group.standalone.length} item(ns) avulso(s))</div>`;

      // 1. COMBOS (Workstations with linked peripherals)
      for (const combo of group.combos) {
        const hostname = combo.hostname ? combo.hostname : 'Sem Hostname';
        const user = combo.user ? combo.user.name : (combo.description && combo.description.includes('Em uso') ? '' : 'Posto Operacional');
        const specs = combo.description ? combo.description.replace(/\s*\|\s*Em uso.*/i, '') : '';

        html += `
        <div class="combo-card">
          <div class="combo-header">
            <div class="combo-title">
              <span>💻 Posto:</span>
              <span class="combo-host">${hostname}</span>
              <span><strong>${combo.name}</strong></span>
              ${user ? `<span class="combo-user">(${user})</span>` : ''}
            </div>
            <div style="font-size: 7pt; color: #64748b;">
              ${specs ? `⚙️ ${specs}` : ''}
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">OK</th>
                <th style="width: 105px;">Patrimônio</th>
                <th style="width: 75px;">Tipo</th>
                <th style="width: 170px;">Equipamento / Modelo</th>
                <th style="width: 110px;">Nº de Série (S/N)</th>
                <th style="width: 70px;">Status</th>
                <th>Observação / Conferência</th>
              </tr>
            </thead>
            <tbody>
              <!-- Item Principal (Computador/CPU) -->
              <tr style="background: #f8fafc;">
                <td style="text-align: center;"><div class="checkbox-box"></div></td>
                <td><span class="tag-code">${combo.code}</span></td>
                <td><span class="type-badge type-badge-pc">${combo.assetType?.name || 'Computador'}</span></td>
                <td><strong>${combo.name}</strong></td>
                <td style="font-family: monospace; font-size: 7.5pt;">${combo.serialNumber || '—'}</td>
                <td><span style="color: #065f46; font-weight: 700;">${combo.status === 'EM_USO' ? 'Em Uso' : combo.status}</span></td>
                <td><div class="notes-line"></div></td>
              </tr>
        `;

        // Componentes vinculados (Monitores, Teclados, Mouses, etc.)
        for (const comp of combo.components) {
          let badgeClass = 'type-badge';
          const typeLower = (comp.assetType?.name || '').toLowerCase();
          if (typeLower.includes('monitor')) badgeClass += ' type-badge-mon';
          else if (typeLower.includes('teclado')) badgeClass += ' type-badge-tec';
          else if (typeLower.includes('mouse')) badgeClass += ' type-badge-mou';
          else if (typeLower.includes('nobreak') || typeLower.includes('energia')) badgeClass += ' type-badge-nob';
          else if (typeLower.includes('impressora')) badgeClass += ' type-badge-imp';

          html += `
              <tr>
                <td style="text-align: center;"><div class="checkbox-box"></div></td>
                <td><span class="tag-code">${comp.code}</span></td>
                <td><span class="${badgeClass}">${comp.assetType?.name || 'Periférico'}</span></td>
                <td>${comp.name}</td>
                <td style="font-family: monospace; font-size: 7.5pt;">${comp.serialNumber || '—'}</td>
                <td>${comp.status === 'EM_USO' ? 'Em Uso' : comp.status}</td>
                <td><div class="notes-line"></div></td>
              </tr>
          `;
        }

        html += `
            </tbody>
          </table>
        </div>
        `;
      }

      // 2. STANDALONE ASSETS (Balanças, Impressoras, Coletores, Nobreaks avulsos, etc.)
      if (group.standalone.length > 0) {
        html += `
        <div class="combo-card" style="border-color: #94a3b8;">
          <div class="combo-header" style="background: #f8fafc;">
            <div class="combo-title">
              <span>📦 Equipamentos Avulsos & Infraestrutura do Setor</span>
            </div>
            <span style="font-size: 7pt; color: #64748b;">Total: ${group.standalone.length} item(ns)</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">OK</th>
                <th style="width: 105px;">Patrimônio</th>
                <th style="width: 75px;">Tipo</th>
                <th style="width: 170px;">Equipamento / Modelo</th>
                <th style="width: 110px;">Nº de Série (S/N)</th>
                <th style="width: 70px;">Status</th>
                <th>Observação / Conferência</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const item of group.standalone) {
          let badgeClass = 'type-badge';
          const typeLower = (item.assetType?.name || '').toLowerCase();
          if (typeLower.includes('balan')) badgeClass += ' type-badge-bal';
          else if (typeLower.includes('impressora')) badgeClass += ' type-badge-imp';
          else if (typeLower.includes('nobreak') || typeLower.includes('energia')) badgeClass += ' type-badge-nob';
          else if (typeLower.includes('computador')) badgeClass += ' type-badge-pc';

          html += `
              <tr>
                <td style="text-align: center;"><div class="checkbox-box"></div></td>
                <td><span class="tag-code">${item.code}</span></td>
                <td><span class="${badgeClass}">${item.assetType?.name || 'Ativo'}</span></td>
                <td><strong>${item.name}</strong></td>
                <td style="font-family: monospace; font-size: 7.5pt;">${item.serialNumber || '—'}</td>
                <td>${item.status === 'EM_USO' ? 'Em Uso' : item.status}</td>
                <td><div class="notes-line"></div></td>
              </tr>
          `;
        }

        html += `
            </tbody>
          </table>
        </div>
        `;
      }
    }
  }

  // Footer Signatures
  html += `
  <div class="footer-sign">
    <div>
      <strong>AgroDesk TI Harmony</strong> • Casa do Campo • Gestão Integrada de Patrimônio
    </div>
    <div style="display: flex; gap: 40px;">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div>Victor Moraes</div>
        <div style="font-size: 6.8pt; color: #94a3b8;">Técnico Responsável / T.I.</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div>Responsável pela Unidade</div>
        <div style="font-size: 6.8pt; color: #94a3b8;">Visto / Conferência</div>
      </div>
    </div>
  </div>

</body>
</html>
`;

  const htmlPath = path.resolve('Relatorio_Etiquetagem_Inventario_Casa_do_Campo.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`HTML report generated at: ${htmlPath}`);

  // Convert to PDF using Microsoft Edge headless
  const pdfPath = path.resolve('Relatorio_Etiquetagem_Inventario_Casa_do_Campo.pdf');
  const desktopPdfPath = 'C:\\Users\\Administrator\\Desktop\\Relatorio_Etiquetagem_Inventario_Casa_do_Campo.pdf';

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(edgePath)) {
    console.log('Rendering PDF using Microsoft Edge...');
    const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`PDF generated successfully at: ${pdfPath}`);
    
    // Copy to desktop for user convenience
    fs.copyFileSync(pdfPath, desktopPdfPath);
    console.log(`PDF copied to Desktop: ${desktopPdfPath}`);
  } else {
    console.warn('Edge executable not found, HTML saved for browser printing.');
  }
}

generateReport().catch(console.error).finally(() => prisma.$disconnect());
