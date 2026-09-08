import { scrapeMercadoLivre } from "./scraper/mercadoLivre";
import { calcularLariScore } from "./scoring/lariScore";
import { Product } from "./types/product";
import { writeFileSync, mkdirSync } from "fs";

function dinheiro(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function main() {

  console.log("");
  console.log("💗 LARI INDICA");
  console.log("🤖 Garimpo automático iniciado");
  console.log("");

  const buscas = [
    "bolsa feminina",
    "maquiagem",
    "perfume feminino",
    "skincare feminino",
    "sandalia feminina",
    "vestido feminino",
    "organizador maquiagem"
  ];

  const todos: Product[] = [];

  for (const busca of buscas) {

    console.log("");
    console.log("════════════════════════════════════");
    console.log(`💕 CATEGORIA: ${busca.toUpperCase()}`);
    console.log("════════════════════════════════════");

    try {

      const produtos = await scrapeMercadoLivre(
        busca,
        20
      );

      todos.push(...produtos);

    } catch (error) {

      console.log(
        `⚠️ Falhou em "${busca}". Seguindo...`
      );

    }
  }

  /*
   * REMOVE DUPLICADOS
   */
  const unicos = Array.from(
    new Map(
      todos.map(produto => [
        produto.url,
        produto
      ])
    ).values()
  );

  /*
   * RANKING
   */
  const ranking = unicos
    .map(calcularLariScore)
    .filter(produto =>
      produto.score >= 75 &&
      (produto.discount || 0) >= 20
    )
    .sort(
      (a, b) => b.score - a.score
    );

  /*
   * PEGA AS 30 MELHORES
   */
  const selecionados =
    ranking.slice(0, 30);

  /*
   * CRIA FILA
   */
  const fila = selecionados.map(
    (produto, index) => {

      const mensagem = [
        "💗 *LARI INDICA*",
        "",
        "🔥 *ACHADINHO DO DIA*",
        "",
        `🛍️ *${produto.title}*`,
        "",
        produto.oldPrice
          ? `❌ De ~${dinheiro(produto.oldPrice)}~`
          : null,
        `💰 Por *${dinheiro(produto.price)}*`,
        produto.discount
          ? `🔥 *${produto.discount}% OFF*`
          : null,
        "",
        produto.rating
          ? `⭐ ${produto.rating.toFixed(1)} • ${produto.reviews || 0} avaliações`
          : null,
        "",
        "🛒 Confira aqui:",
        produto.url,
        "",
        "⚠️ Preço e estoque podem mudar."
      ]
        .filter(Boolean)
        .join("\n");

      return {
        id: index + 1,

        status: "pendente",

        score: produto.score,

        produto: {
          titulo: produto.title,
          preco: produto.price,
          precoAnterior: produto.oldPrice,
          desconto: produto.discount,
          avaliacao: produto.rating,
          avaliacoes: produto.reviews,
          imagem: produto.image,
          urlOriginal: produto.url,

          /*
           * Quando Larissa terminar
           * o cadastro, entra aqui.
           */
          urlAfiliado: null
        },

        mensagem
      };
    }
  );

  /*
   * SALVA
   */
  mkdirSync("data", {
    recursive: true
  });

  writeFileSync(
    "data/fila.json",
    JSON.stringify(
      {
        criadaEm: new Date().toISOString(),
        total: fila.length,
        fila
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("════════════════════════════════════");
  console.log("💗 FILA LARI INDICA CRIADA");
  console.log("════════════════════════════════════");
  console.log("");

  console.log(
    `📦 ${todos.length} coletados`
  );

  console.log(
    `✨ ${unicos.length} únicos`
  );

  console.log(
    `🔥 ${ranking.length} aprovados`
  );

  console.log(
    `📲 ${fila.length} colocados na fila`
  );

  console.log("");
  console.log(
    "💾 Arquivo: data/fila.json"
  );

  /*
   * MOSTRA AS 5 PRIMEIRAS
   */
  console.log("");
  console.log("📲 PRÉVIA DAS POSTAGENS:");
  console.log("");

  fila
    .slice(0, 5)
    .forEach(item => {

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(item.mensagem);
      console.log("");

    });

}

main().catch(error => {
  console.error("❌ ERRO:", error);
  process.exit(1);
});
