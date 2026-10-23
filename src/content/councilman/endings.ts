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
}

export const ENDINGS: Record<string, EndingDef> = {
  // Temporary until the vote count exists (v2 step 4): the chapter stops on election day.
  election_day: {
    tone: "bittersweet",
    kicker: "Eleições 1989",
    headline: "PORTO FERRO VAI ÀS URNAS",
    lede:
      "Oito semanas de campanha acabaram. Santinhos no chão, carros de som calados, urnas lacradas a caminho do ginásio. " +
      "Amanhã a cidade conta os votos, e {{player}} vai saber se tudo o que fez nesses meses valeu.",
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
