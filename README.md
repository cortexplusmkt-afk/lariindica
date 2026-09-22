### `lariindica/README.md`

```md
# Lari Indica

Automação desenvolvida em TypeScript para pesquisa, análise e priorização de produtos encontrados no Mercado Livre.

O sistema automatiza o processo de garimpo de ofertas, coleta informações dos produtos e utiliza um algoritmo próprio para identificar as oportunidades mais interessantes.

## Como funciona

A aplicação realiza buscas automatizadas em diferentes categorias e coleta informações como:

- Produto
- Preço atual
- Preço anterior
- Percentual de desconto
- Avaliação
- Quantidade de avaliações
- Link
- Imagem

Depois da coleta, cada produto recebe uma pontuação através do algoritmo `LariScore`.

## LariScore

O algoritmo considera fatores como:

- Percentual de desconto
- Avaliação do produto
- Popularidade
- Número de avaliações
- Faixa de preço
- Relevância para o público definido

Os produtos são então classificados e filtrados.

Somente as melhores oportunidades seguem para a fila de publicação.

## Tecnologias

- TypeScript
- Node.js
- Playwright
- TSX

## Arquitetura

```text
src/
├── scoring/
│   └── lariScore.ts
│
├── scraper/
│   └── mercadoLivre.ts
│
├── types/
│   └── product.ts
│
└── index.ts
Pipeline
Busca
  ↓
Coleta automatizada
  ↓
Normalização
  ↓
Remoção de duplicados
  ↓
LariScore
  ↓
Filtro
  ↓
Ranking
  ↓
Fila de publicação
Executando

Instale as dependências:

npm install

Execute:

npm run dev

O projeto utiliza uma instalação local do Google Chrome ou Microsoft Edge para realizar a automação.

Resultado

Ao final do processo é gerado um arquivo:

data/fila.json

Esse arquivo contém os produtos selecionados, dados estruturados e uma mensagem preparada para publicação.

Objetivo

O projeto nasceu da ideia de transformar um processo manual de busca por ofertas em uma rotina automatizada de coleta, análise e curadoria.

Além de web scraping, o projeto explora regras de negócio e classificação de dados através de um algoritmo de pontuação próprio.

Projeto experimental desenvolvido para automação e portfólio.
