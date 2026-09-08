import { Product } from "../types/product";

export interface ScoredProduct extends Product {
  score: number;
}

export function calcularLariScore(
  product: Product
): ScoredProduct {

  let score = 0;

  /*
   * DESCONTO
   * Agora isso pesa bastante.
   */
  if (product.discount) {

    if (product.discount >= 50) score += 40;
    else if (product.discount >= 40) score += 35;
    else if (product.discount >= 30) score += 30;
    else if (product.discount >= 20) score += 24;
    else if (product.discount >= 10) score += 15;
    else score += 5;

  }

  /*
   * AVALIAÇÃO
   */
  if (product.rating) {

    if (product.rating >= 4.9) score += 20;
    else if (product.rating >= 4.8) score += 18;
    else if (product.rating >= 4.7) score += 15;
    else if (product.rating >= 4.6) score += 12;
    else if (product.rating >= 4.5) score += 8;

  }

  /*
   * POPULARIDADE
   */
  if (product.reviews) {

    if (product.reviews >= 10000) score += 20;
    else if (product.reviews >= 5000) score += 18;
    else if (product.reviews >= 1000) score += 15;
    else if (product.reviews >= 500) score += 12;
    else if (product.reviews >= 100) score += 8;
    else score += 3;

  }

  /*
   * PREÇO DE IMPULSO
   */
  if (product.price <= 50) score += 10;
  else if (product.price <= 100) score += 8;
  else if (product.price <= 200) score += 5;
  else if (product.price <= 300) score += 2;

  /*
   * RELEVÂNCIA FEMININA
   */
  const titulo = product.title.toLowerCase();

  const femininas = [
    "feminina",
    "feminino",
    "bolsa",
    "maquiagem",
    "beleza",
    "perfume",
    "vestido",
    "sandália",
    "salto",
    "carteira",
    "clutch"
  ];

  if (
    femininas.some(
      palavra => titulo.includes(palavra)
    )
  ) {
    score += 10;
  }

  /*
   * PENALIZA produto claramente masculino.
   */
  const masculinas = [
    "masculina",
    "masculino",
    "para homem"
  ];

  if (
    masculinas.some(
      palavra => titulo.includes(palavra)
    )
  ) {
    score -= 50;
  }

  return {
    ...product,
    score: Math.max(
      0,
      Math.min(score, 100)
    ),
  };
}
