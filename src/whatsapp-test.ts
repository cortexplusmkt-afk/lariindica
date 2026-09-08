import { chromium } from "playwright";
import { existsSync } from "fs";

function encontrarNavegador(): string {
  const caminhos = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  const navegador = caminhos.find(existsSync);

  if (!navegador) {
    throw new Error("Chrome ou Edge não encontrado.");
  }

  return navegador;
}

async function main() {

  console.log("");
  console.log("💗 LARI INDICA");
  console.log("📲 Conectando ao WhatsApp...");
  console.log("");

  const navegador = encontrarNavegador();

  const context = await chromium.launchPersistentContext(
    "data/whatsapp-profile",
    {
      executablePath: navegador,
      headless: false,
      viewport: {
        width: 1400,
        height: 900,
      },
      locale: "pt-BR",
    }
  );

  const page =
    context.pages()[0] ||
    await context.newPage();

  await page.goto(
    "https://web.whatsapp.com",
    {
      waitUntil: "domcontentloaded",
      timeout: 60000
    }
  );

  console.log("🌐 WhatsApp Web aberto.");
  console.log("");
  console.log("👉 Se aparecer QR Code, escaneie com o celular.");
  console.log("👉 NÃO feche a janela.");
  console.log("");

  try {

    await page
      .locator("#pane-side")
      .waitFor({
        timeout: 120000
      });

    console.log("");
    console.log("✅ WHATSAPP CONECTADO!");
    console.log("💾 Sessão salva em data/whatsapp-profile");
    console.log("");

    console.log("🔎 Procurando grupo: Lari Indica");

    const busca = page.locator(
      'div[contenteditable="true"]'
    ).first();

    await busca.click();

    await busca.fill("Lari Indica");

    await page.waitForTimeout(3000);

    const grupo = page.getByText(
      "Lari Indica",
      {
        exact: true
      }
    ).first();

    if (await grupo.count() === 0) {

      console.log("❌ Não encontrei o grupo Lari Indica.");

    } else {

      console.log("✅ GRUPO LARI INDICA ENCONTRADO!");
      console.log("");
      console.log("🚫 Não enviei nada ainda.");
      console.log("");

    }

  } catch {

    console.log("");
    console.log("❌ Não consegui confirmar a conexão.");
    console.log("Deixe o WhatsApp carregar completamente.");
    console.log("");

  }

  console.log("👉 Pode fechar o Chrome quando terminar.");

  await new Promise(() => {});

}

main().catch(error => {
  console.error("❌ ERRO:", error);
  process.exit(1);
});
