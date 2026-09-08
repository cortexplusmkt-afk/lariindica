import { chromium, Locator } from "playwright";
import { existsSync } from "fs";
import { Product } from "../types/product";

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

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function lerDinheiro(
  locator: Locator
): Promise<number | undefined> {

  if (await locator.count() === 0) {
    return undefined;
  }

  const fractionLocator = locator
    .locator(".andes-money-amount__fraction")
    .first();

  if (await fractionLocator.count() === 0) {
    return undefined;
  }

  const fractionText = await fractionLocator
    .textContent({ timeout: 2000 })
    .catch(() => null);

  const fraction =
    fractionText?.replace(/\D/g, "");

  if (!fraction) {
    return undefined;
  }

  /*
   * Alguns preços do Mercado Livre
   * não possuem centavos no HTML.
   */
  let cents = "00";

  const centsLocator = locator
    .locator(".andes-money-amount__cents")
    .first();

  if (await centsLocator.count() > 0) {

    const centsText = await centsLocator
      .textContent({ timeout: 1000 })
      .catch(() => null);

    const centsLimpo =
      centsText?.replace(/\D/g, "");

    if (centsLimpo) {
      cents = centsLimpo
        .padEnd(2, "0")
        .slice(0, 2);
    }
  }

  return Number(`${fraction}.${cents}`);
}

export async function scrapeMercadoLivre(
  search: string,
  limit = 30
): Promise<Product[]> {

  const navegador = encontrarNavegador();

  console.log(`🌐 Navegador: ${navegador}`);

  const context = await chromium.launchPersistentContext(
    "data/chrome-profile",
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

  const url =
    "https://lista.mercadolivre.com.br/" +
    search.trim().replace(/\s+/g, "-");

  console.log(`🔎 Buscando: ${search}`);
  console.log(`🔗 ${url}`);
  console.log("");
  console.log("⏳ Aguardando Mercado Livre carregar...");

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(4000);

  /*
   * PARTE 1
   * Produtos limpos pelo JSON estruturado
   */

  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();

  const products: Product[] = [];
  const urlsVistas = new Set<string>();

  for (const texto of scripts) {

    try {

      const json = JSON.parse(texto);

      const itens =
        Array.isArray(json?.["@graph"])
          ? json["@graph"]
          : Array.isArray(json)
            ? json
            : [json];

      for (const item of itens) {

        if (products.length >= limit) {
          break;
        }

        if (item?.["@type"] !== "Product") {
          continue;
        }

        const title =
          typeof item.name === "string"
            ? item.name.trim()
            : "";

        const image =
          typeof item.image === "string"
            ? item.image
            : Array.isArray(item.image)
              ? item.image[0]
              : undefined;

        const offer =
          Array.isArray(item.offers)
            ? item.offers[0]
            : item.offers;

        const price =
          Number(offer?.price);

        const productUrl =
          typeof offer?.url === "string"
            ? offer.url
            : "";

        if (!title || !price || !productUrl) {
          continue;
        }

        const urlLimpa =
          productUrl.split("#")[0];

        if (urlsVistas.has(urlLimpa)) {
          continue;
        }

        urlsVistas.add(urlLimpa);

        const rating =
          item.aggregateRating?.ratingValue
            ? Number(item.aggregateRating.ratingValue)
            : undefined;

        const reviews =
          item.aggregateRating?.ratingCount
            ? Number(item.aggregateRating.ratingCount)
            : undefined;

        products.push({
          title,
          price,
          url: urlLimpa,
          image,
          rating,
          reviews,
          source: "mercado-livre",
        });
      }

    } catch {}
  }

  console.log(
    `📦 JSON retornou ${products.length} produtos únicos`
  );

  /*
   * PARTE 2
   * Procura preço anterior nos cards
   */

  console.log("💸 Buscando descontos reais...");

  const cards = page.locator(".poly-card");
  const quantidadeCards = await cards.count();

  for (let i = 0; i < quantidadeCards; i++) {

    const card = cards.nth(i);

    const tituloCard =
      (
        await card
          .locator(".poly-component__title")
          .first()
          .textContent()
          .catch(() => null)
      )?.trim();

    if (!tituloCard) {
      continue;
    }

    const tituloNormalizado =
      normalizar(tituloCard);

    let product = products.find(
      p => normalizar(p.title) === tituloNormalizado
    );

    /*
     * Fallback para pequenas diferenças
     * de nome entre card e JSON.
     */
    if (!product) {
      product = products.find(p => {
        const a = normalizar(p.title);
        const b = tituloNormalizado;

        return (
          a.includes(b) ||
          b.includes(a)
        );
      });
    }

    if (!product) {
      continue;
    }

    const oldPriceLocator = card
      .locator(".andes-money-amount--previous")
      .first();

    const oldPrice =
      await lerDinheiro(oldPriceLocator);

    if (
      oldPrice &&
      oldPrice > product.price
    ) {

      product.oldPrice = oldPrice;

      product.discount = Math.round(
        ((oldPrice - product.price) / oldPrice) * 100
      );
    }
  }

  const comDesconto =
    products.filter(p => p.discount).length;

  console.log(
    `🔥 ${comDesconto} produtos com desconto encontrado`
  );

  await context.close();

  return products;
}

