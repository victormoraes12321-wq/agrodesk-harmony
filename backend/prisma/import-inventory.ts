import { PrismaClient, AssetStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface PCData {
  brand: string;
  model: string;
  ram: string;
  disk: string;
  processor: string;
  monitors: string;
  keyboard: string;
  mouse: string;
  nobreak: string;
  location: string;
  hostname: string;
}

const pcs: PCData[] = [
  {
    brand: "Dell",
    model: "OptiPlex 3000",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i3-12100T",
    monitors: "Dell P2222H; Dell SE2222H",
    keyboard: "Dell Wireless Keyboard",
    mouse: "Dell Wirelles Mouse",
    nobreak: "Intelbras XNB 600 120v",
    location: "Financeiro",
    hostname: "w11cctorec1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3070",
    ram: "8GB",
    disk: "SSD Kingston 447GB",
    processor: "Intel i5-8500T 2.10GHz",
    monitors: "Dell SE2222H; Dell P2219H",
    keyboard: "Dell Wireless Keyboard",
    mouse: "Dell Wireless Mouse",
    nobreak: "APC Back-Ups 600",
    location: "Financeiro",
    hostname: "w10cctoadm2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3080",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i3-10100T 3.00GHz",
    monitors: "Dell P2219Hb",
    keyboard: "Dell Wireless Keyboard",
    mouse: "Dell Wireless Mouse",
    nobreak: "Intelbras XNB 600 120v",
    location: "Financeiro",
    hostname: "w10cctocp2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3000",
    ram: "8GB",
    disk: "SSD NVMe SSSTC 256GB",
    processor: "Intel i3-12100T 2.2GHz",
    monitors: "Dell P2222H; Dell E1916H",
    keyboard: "Philips SPK6501B/78",
    mouse: "Philips SPK7211B/78",
    nobreak: "Intelbras XNB 720 120v",
    location: "Financeiro",
    hostname: "w11cctofin3",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD Kingston 222GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell E1912Hc",
    keyboard: "Dell KB2131Wt",
    mouse: "Dell Wireless Mouse",
    nobreak: "N/D",
    location: "Financeiro",
    hostname: "w10cctoof1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3000",
    ram: "8GB",
    disk: "SSD NVMe SSSTC 256GB",
    processor: "Intel i3-12100T 2.2GHz",
    monitors: "Dell P2222H; Dell E1916H",
    keyboard: "Dell KB2131Wt",
    mouse: "Dell Wireless Mouse",
    nobreak: "Intelbras XNB 600 120v",
    location: "Financeiro",
    hostname: "w11cctofin2",
  },
  {
    brand: "Lenovo",
    model: "90AT0002BR",
    ram: "8GB",
    disk: "SSD SATA 118GB",
    processor: "i3-4130 3.40GHz",
    monitors: "Samsung S19C301F",
    keyboard: "Dell KB3322Wt",
    mouse: "Dell WM118t",
    nobreak: "N/D",
    location: "Estoque",
    hostname: "w10cctoest2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD HKM256S22A-TMCZV237GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell E1916H",
    keyboard: "Dell KB3322WT",
    mouse: "Dell WM118t",
    nobreak: "Intelbras 720 120v",
    location: "Estoque",
    hostname: "w11cctoest1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD STQ256I1-2YAXCG2 237GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell E1916Hf",
    keyboard: "Dell KB3322WT",
    mouse: "Dell WM118t",
    nobreak: "N/D",
    location: "Agrotóxico",
    hostname: "w10cctoag2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 390",
    ram: "8GB",
    disk: "SSD ATA Device 237GB",
    processor: "Intel i3-2120 3.30GHz",
    monitors: "Dell E1916Hf",
    keyboard: "Dell KB216p",
    mouse: "Logitech M-90",
    nobreak: "Intelbras XNB 720 120v",
    location: "Agrotóxico",
    hostname: "w10cctoag1",
  },
  {
    brand: "Dell",
    model: "OptiPlex Micro 7020",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i5-12500T 2.00GHz",
    monitors: "Dell P2425H",
    keyboard: "Dell KB3122Wt",
    mouse: "Dell Wireless Mouse",
    nobreak: "Intelbras XNB 720 120v",
    location: "Supervisor",
    hostname: "w11cctocm1",
  },
  {
    brand: "Lenovo",
    model: "90AT0002BR",
    ram: "8GB",
    disk: "HDD 194GB",
    processor: "Intel i3-4130 3.40GHz",
    monitors: "Dell 1916Hf",
    keyboard: "Philips SPK6501B/78",
    mouse: "Dell CN-009NK2-73826-68F-1694",
    nobreak: "Intelbras XNB 720 120v",
    location: "Expedição de Mercadoria",
    hostname: "w10cctoexp3",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3080",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i3-10100 3.30GHz",
    monitors: "Dell P2219Hb",
    keyboard: "Logitech K270",
    mouse: "Logitech M185",
    nobreak: "SMS",
    location: "Crediário",
    hostname: "w10cctocb1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "HDD 465GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell SE2216Hf",
    keyboard: "Logitech KB3322Wt",
    mouse: "Dell WM118t",
    nobreak: "SMM St600S",
    location: "Crediário",
    hostname: "w10cctofin01",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3089",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i3-10100T 3.00GHz",
    monitors: "Dell P2219Hb",
    keyboard: "Logitech K270",
    mouse: "Logitech M185",
    nobreak: "APC Back-Ups 600",
    location: "Caixa",
    hostname: "w10cctocx1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3080",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i3-10100T 3.00GHz",
    monitors: "Dell E1916H",
    keyboard: "Logitech K270",
    mouse: "Logitech M185",
    nobreak: "N/D",
    location: "Caixa",
    hostname: "w10cctocx2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD SATA 237GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell E1916H",
    keyboard: "Multilaser TC212",
    mouse: "Multilaser TC212",
    nobreak: "N/D",
    location: "Balcão",
    hostname: "w11cctobl3",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "HDD 454GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell D1901Nc",
    keyboard: "Dell KB3122Wt",
    mouse: "Dell WM118",
    nobreak: "N/D",
    location: "Balcão",
    hostname: "w10cctobl4",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD WD Green 2.5 240GB",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "Dell E1916Hf",
    keyboard: "Dell KB3322Wt",
    mouse: "Dell WM118t",
    nobreak: "N/D",
    location: "Balcão",
    hostname: "w10cctobl2",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD SWR256G-301II",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "",
    keyboard: "Dell KB3322Wt",
    mouse: "Dell WM118",
    nobreak: "SMS",
    location: "Balcão",
    hostname: "w10cctobl1",
  },
  {
    brand: "Dell",
    model: "OptiPlex 3040",
    ram: "8GB",
    disk: "SSD KINGSTON",
    processor: "Intel i3-6100 3.70GHz",
    monitors: "SE2222Ht",
    keyboard: "Dell KB3322Wt",
    mouse: "Dell WM118",
    nobreak: "Intelbras XNB 720; Intelbras XNB 600",
    location: "Depósito",
    hostname: "w10cctodep2",
  },
  {
    brand: "Dell",
    model: "OptiPlex Micro 7020",
    ram: "8GB",
    disk: "SSD NVMe ADATA 256GB",
    processor: "Intel i5-12500T 2.00GHz",
    monitors: "Dell P2425H",
    keyboard: "Dell KB3122Wt",
    mouse: "Dell Wireless Mouse",
    nobreak: "Intelbras XNB 720",
    location: "Agrônomo",
    hostname: "w11cctoag3",
  },
];

const printers: PrinterData[] = [
  { brand: "HP", model: "Laser MFP 435nw", serial: "BRBSS840FY", location: "Financeiro" },
  { brand: "HP", model: "LaserJet M1212nf", serial: "CNJ8F6RH9H", location: "Financeiro" },
  { brand: "Zebra", model: "ZD230", serial: "D5N223401984", location: "Estoque" },
  { brand: "Zebra", model: "GC420t", serial: "54J164904254", location: "Estoque" },
  { brand: "HP", model: "LaserJet M1132", serial: "BRGHC244KL", location: "Estoque" },
  { brand: "HP", model: "Laser 408dn", serial: "BRBST3W08Q", location: "Agrotóxico" },
  { brand: "HP", model: "Laser 408dn", serial: "BRBSS2X0LZ", location: "Caixa" },
  { brand: "Bematech", model: "MP-4200 TH", serial: "101000800000588284", location: "Caixa" },
  { brand: "Epson", model: "M352A", serial: "X5Z7161326", location: "Caixa" },
  { brand: "Elson", model: "i9 Full", serial: "24612666", location: "Caixa" },
];

const readers: ReaderData[] = [
  { brand: "Zebra", model: "DS22", location: "Financeiro" },
  { brand: "BarcodeTech", model: "BT-900", location: "Financeiro" },
  { brand: "Zebra", model: "DS22", location: "Estoque" },
  { brand: "Zebra", model: "DS22", location: "Estoque" },
  { brand: "Barcodetech", model: "BT-900", location: "Balcão" },
  { brand: "Zebra", model: "DS22", location: "Balcão" },
  { brand: "Zebra", model: "DS22", location: "Balcão" },
  { brand: "Honeywell", model: "MS9520", location: "Balcão" },
  { brand: "Zebra", model: "DS22", location: "Expedição de Mercadoria" },
];

interface PrinterData {
  brand: string;
  model: string;
  serial: string;
  location: string;
}

interface ReaderData {
  brand: string;
  model: string;
  location: string;
}

async function main() {
  console.log("Iniciando importação do inventário...");

  // 1. Garantir que as filiais existam
  let branch = await prisma.branch.findFirst({ where: { name: "Loja 1" } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: "Loja 1",
        address: "Rua Principal, 1000 - Loja 1",
        description: "Filial Principal",
        isActive: true,
      },
    });
    console.log("Filial 'Loja 1' criada.");
  }
  const branchId = branch.id;

  // 2. Garantir que todos os setores existam
  const requiredDepts = [
    "Financeiro",
    "Estoque",
    "Agrotóxico",
    "Supervisor",
    "Expedição de Mercadoria",
    "Crediário",
    "Caixa",
    "Balcão",
    "Depósito",
    "Agrônomo",
  ];
  const deptMap = new Map<string, string>();
  for (const name of requiredDepts) {
    let dept = await prisma.department.findUnique({ where: { name } });
    if (!dept) {
      // Tenta achar com outro nome parecido
      const nameNoAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedQuery = await prisma.department.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { name: { equals: nameNoAccents, mode: "insensitive" } },
          ],
        },
      });
      if (normalizedQuery) {
        dept = normalizedQuery;
      } else {
        dept = await prisma.department.create({
          data: { name, description: `Setor ${name}`, isActive: true },
        });
        console.log(`Setor '${name}' criado.`);
      }
    }
    deptMap.set(name, dept.id);
  }

  // 3. Garantir que todos os tipos de ativos existam
  const requiredTypes = [
    "Computador",
    "Impressora",
    "Leitor de Código de Barras",
    "Monitor",
    "Teclado",
    "Mouse",
    "Nobreak",
  ];
  const typeMap = new Map<string, string>();
  for (const name of requiredTypes) {
    let aType = await prisma.assetType.findUnique({ where: { name } });
    if (!aType) {
      aType = await prisma.assetType.create({
        data: { name, description: `${name}s de TI`, isActive: true },
      });
      console.log(`Tipo de Ativo '${name}' criado.`);
    }
    typeMap.set(name, aType.id);
  }

  // Obter código incremental inicial
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  let codeCounter = 1;
  if (lastAsset && lastAsset.code && lastAsset.code.startsWith("ATV-")) {
    const numPart = parseInt(lastAsset.code.replace("ATV-", ""), 10);
    if (!isNaN(numPart)) {
      codeCounter = numPart + 1;
    }
  }

  const getNextCode = () => {
    const code = `ATV-${codeCounter.toString().padStart(6, "0")}`;
    codeCounter++;
    return code;
  };

  // 4. Importar PCs
  console.log("Importando computadores e periféricos...");
  for (const pc of pcs) {
    const departmentId = deptMap.get(pc.location);
    const pcName = `${pc.brand} ${pc.model}`;
    const description = `Memória RAM: ${pc.ram} | HD/SSD: ${pc.disk} | Processador: ${pc.processor}`;

    // Cria o computador principal
    const pcAsset = await prisma.asset.create({
      data: {
        code: getNextCode(),
        name: pcName,
        description,
        status: AssetStatus.EM_USO,
        assetTypeId: typeMap.get("Computador")!,
        branchId,
        departmentId,
        hostname: pc.hostname || null,
      },
    });

    console.log(`PC '${pcName}' (${pc.hostname}) criado com código ${pcAsset.code}.`);

    // Adiciona Monitores
    if (pc.monitors && pc.monitors.trim() !== "" && pc.monitors !== "N/D") {
      const monitorNames = pc.monitors.split(";").map((m) => m.trim());
      for (const mName of monitorNames) {
        await prisma.asset.create({
          data: {
            code: getNextCode(),
            name: mName.startsWith("Dell") || mName.startsWith("Samsung") || mName.startsWith("SE") ? `Monitor ${mName}` : mName,
            status: AssetStatus.EM_USO,
            assetTypeId: typeMap.get("Monitor")!,
            branchId,
            departmentId,
            parentId: pcAsset.id,
          },
        });
      }
    }

    // Adiciona Teclado
    if (pc.keyboard && pc.keyboard.trim() !== "" && pc.keyboard !== "N/D") {
      await prisma.asset.create({
        data: {
          code: getNextCode(),
          name: `Teclado ${pc.keyboard}`,
          status: AssetStatus.EM_USO,
          assetTypeId: typeMap.get("Teclado")!,
          branchId,
          departmentId,
          parentId: pcAsset.id,
        },
      });
    }

    // Adiciona Mouse
    if (pc.mouse && pc.mouse.trim() !== "" && pc.mouse !== "N/D") {
      await prisma.asset.create({
        data: {
          code: getNextCode(),
          name: `Mouse ${pc.mouse}`,
          status: AssetStatus.EM_USO,
          assetTypeId: typeMap.get("Mouse")!,
          branchId,
          departmentId,
          parentId: pcAsset.id,
        },
      });
    }

    // Adiciona Nobreak
    if (pc.nobreak && pc.nobreak.trim() !== "" && pc.nobreak !== "N/D") {
      const nobreakNames = pc.nobreak.split(";").map((n) => n.trim());
      for (const nName of nobreakNames) {
        await prisma.asset.create({
          data: {
            code: getNextCode(),
            name: `Nobreak ${nName}`,
            status: AssetStatus.EM_USO,
            assetTypeId: typeMap.get("Nobreak")!,
            branchId,
            departmentId,
            parentId: pcAsset.id,
          },
        });
      }
    }
  }

  // 5. Importar Impressoras
  console.log("Importando impressoras...");
  for (const printer of printers) {
    const departmentId = deptMap.get(printer.location);
    const pName = `${printer.brand} ${printer.model}`;

    await prisma.asset.create({
      data: {
        code: getNextCode(),
        name: pName,
        serialNumber: printer.serial,
        status: AssetStatus.EM_USO,
        assetTypeId: typeMap.get("Impressora")!,
        branchId,
        departmentId,
      },
    });
    console.log(`Impressora '${pName}' (S/N: ${printer.serial}) criada.`);
  }

  // 6. Importar Leitores
  console.log("Importando leitores...");
  for (const reader of readers) {
    const departmentId = deptMap.get(reader.location);
    const rName = `${reader.brand} ${reader.model}`;

    await prisma.asset.create({
      data: {
        code: getNextCode(),
        name: rName,
        status: AssetStatus.EM_USO,
        assetTypeId: typeMap.get("Leitor de Código de Barras")!,
        branchId,
        departmentId,
      },
    });
    console.log(`Leitor '${rName}' criado.`);
  }

  console.log("Importação concluída com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
