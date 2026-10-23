import type { BookDef } from "../types";

/** The library. Real books, real ideas, in plain words. */
export const BOOKS = {
  machiavelli: {
    title: "O Príncipe",
    author: "Nicolau Maquiavel",
    year: 1532,
    weeksToRead: 4,
    lesson:
      "Maquiavel escreveu que um governante deve ser julgado pelos resultados, não pelas intenções. Se não for possível ser amado e temido, " +
      "é mais seguro ser temido; e um príncipe sábio mantém a aparência de virtude enquanto está pronto para agir de outra forma. " +
      "Para ele, a política é a arte de conquistar e manter o poder.",
    unlocksText: "Novas opções em reuniões: ler as intenções ocultas das pessoas e negociar favores.",
  },
  keynes: {
    title: "A Teoria Geral do Emprego, do Juro e da Moeda",
    author: "John Maynard Keynes",
    year: 1936,
    weeksToRead: 6,
    lesson:
      "Keynes argumentou que, numa recessão, o gasto privado desaba e o desemprego pode durar anos. O governo pode preencher esse buraco gastando, " +
      "mesmo com dinheiro emprestado, porque o gasto de um é a renda de outro (o \"multiplicador\"). A conta chega depois.",
    unlocksText: "Nova lei: Frente de Trabalho em Obras Públicas. Novo argumento com lideranças comunitárias.",
  },
  hayek: {
    title: "O Caminho da Servidão",
    author: "Friedrich Hayek",
    year: 1944,
    weeksToRead: 5,
    lesson:
      "Hayek alertou que o planejamento central concentra poder e um conhecimento que nenhum planejador realmente tem. Os preços carregam informação " +
      "espalhada entre milhões de pessoas, por isso os mercados coordenam melhor que os burocratas. Cada novo controle, dizia ele, convida o próximo.",
    unlocksText: "Nova lei: Corte do ISS no Centro. Novo argumento com financiadores empresariais.",
  },
  faoro: {
    title: "Os Donos do Poder",
    author: "Raymundo Faoro",
    year: 1958,
    weeksToRead: 6,
    lesson:
      "Faoro mostrou que, no Brasil, o Estado nunca foi só do povo: desde a Colônia, um estamento de funcionários, " +
      "fazendeiros e amigos do rei tratou o público como coisa privada. É o patrimonialismo: o cargo vira propriedade, " +
      "o orçamento vira favor, e quem está perto do poder confunde o bolso do Estado com o próprio.",
    unlocksText: "Você passa a enxergar o que está por trás de certas ofertas e contratos. Nova lei: Transparência com Controle Social.",
  },
} as const satisfies Record<string, BookDef>;

export type BookId = keyof typeof BOOKS;
export const BOOK_IDS = Object.keys(BOOKS) as BookId[];
