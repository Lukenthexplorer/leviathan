/**
 * How each ending is reported. Text uses the same templates as everything
 * else ({{player}}, {{PLAYER}}, {{g:o/a}}).
 */
export type EndingTone = "victory" | "bittersweet" | "defeat";

export interface EndingDef {
  tone: EndingTone;
  kicker: string;
  headline: string;
  lede: string;
  /** Victories: what the next chapter will be about (not written yet). */
  next?: string;
}

export const ENDINGS: Record<string, EndingDef> = {
  // Election results. The legacy page (v2 step 6) adds the vote count and its causes.
  reelected: {
    tone: "victory",
    kicker: "Eleições 1989 · Câmara Municipal",
    headline: "{{PLAYER}} REELEIT{{g:O/A}}",
    lede: "Contados os votos no ginásio, {{player}} garantiu mais quatro anos na Câmara de Porto Ferro. Quem achou que a última vaga tinha sido sorte vai ter que rever.",
    next: "Mais quatro anos de Câmara, agora sem a desculpa de ser novat{{g:o/a}}. Quem ajudou na eleição vai cobrar.",
  },
  elected_mayor: {
    tone: "victory",
    kicker: "Eleições 1989 · Prefeitura",
    headline: "{{PLAYER}} É {{g:O NOVO PREFEITO/A NOVA PREFEITA}} DE PORTO FERRO",
    lede: "Madrugada de festa no ginásio: {{player}}, que entrou na Câmara com a última vaga, vai governar a cidade. Agora, prometer acabou. Agora é entregar.",
    next: "A prefeitura: um orçamento de verdade, secretários para nomear, empreiteiras na sala de espera e uma Câmara que você conhece bem demais.",
  },
  elected_deputy: {
    tone: "victory",
    kicker: "Eleições 1989 · Assembleia Legislativa",
    headline: "{{PLAYER}} ELEIT{{g:O/A}} DEPUTAD{{g:O/A}} ESTADUAL",
    lede: "Das ruas de Porto Ferro para a Assembleia Legislativa. {{player}} vai representar a cidade, e o interior que aprendeu a conhecer.",
    next: "A Assembleia Legislativa: a capital, os gabinetes maiores, os acordos maiores. E Porto Ferro lá longe, esperando a volta.",
  },
  defeated_council: {
    tone: "defeat",
    kicker: "Eleições 1989 · Câmara Municipal",
    headline: "{{PLAYER}} NÃO SE REELEGE",
    lede: "Os votos não vieram. Outros nomes do partido ficaram com as vagas, e {{player}} volta para casa depois de um mandato só.",
  },
  defeated_mayor: {
    tone: "defeat",
    kicker: "Eleições 1989 · Prefeitura",
    headline: "{{PLAYER}} PERDE A PREFEITURA",
    lede: "A aposta era alta, e a cidade disse não. {{player}} deixou a vaga na Câmara para tentar a prefeitura, e agora não tem nenhuma das duas.",
  },
  defeated_deputy: {
    tone: "defeat",
    kicker: "Eleições 1989 · Assembleia Legislativa",
    headline: "{{PLAYER}} FICA DE FORA DA ASSEMBLEIA",
    lede: "O interior não conhecia {{player}}, e Porto Ferro sozinha não bastou. Sem a vaga na Câmara e sem a da Assembleia, a carreira para aqui.",
  },
  arrested: {
    tone: "defeat",
    kicker: "Polícia",
    headline: "{{g:VEREADOR/VEREADORA}} {{PLAYER}} DEIXA A CÂMARA {{g:ALGEMADO/ALGEMADA}}",
    lede:
      "Agentes da Polícia Federal chegaram ao gabinete às seis da manhã. As caixas de documentos saíram primeiro. {{g:O vereador/A vereadora}} {{player}} saiu depois, " +
      "sem dar declarações, sob os flashes que um dia tinha procurado.",
  },
  expelled: {
    tone: "defeat",
    kicker: "Partidos",
    headline: "PARTIDO EXPULSA {{PLAYER}}",
    lede:
      "Por unanimidade, a executiva do partido expulsou {{g:o vereador/a vereadora}} {{player}}. \"Ninguém é maior que o partido\", disse a nota oficial. " +
      "Sem legenda, sem candidatura. Uma carreira termina numa reunião de vinte minutos.",
  },
  lost_support: {
    tone: "defeat",
    kicker: "Política",
    headline: "{{PLAYER}}: UMA CARREIRA QUE TERMINOU EM SILÊNCIO",
    lede:
      "Não houve escândalo final, nem prisão, nem expulsão. Só o silêncio. As ligações pararam, as ruas viraram as costas, e {{g:o vereador/a vereadora}} {{player}} " +
      "entendeu antes de todos que não havia mais para onde ir.",
  },
};
