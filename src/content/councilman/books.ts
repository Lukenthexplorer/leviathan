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
} as const satisfies Record<string, BookDef>;

export type BookId = keyof typeof BOOKS;
export const BOOK_IDS = Object.keys(BOOKS) as BookId[];
