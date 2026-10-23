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
  candidacy: {
    tone: "victory",
    kicker: "Convenção do partido",
    headline: "{{PLAYER}} VAI DISPUTAR A PREFEITURA",
    lede:
      "Num ginásio lotado, sob bandeiras e fogos, o partido aclamou {{g:o vereador/a vereadora}} {{player}} como {{g:seu candidato/sua candidata}} à Prefeitura de Porto Ferro. " +
      "Há pouco tempo, {{g:ele/ela}} tinha entrado na Câmara com a última vaga. A partir de agora, a cidade inteira vai olhar.",
  },
  kingmaker: {
    tone: "bittersweet",
    kicker: "Convenção do partido",
    headline: "RENATA SALDANHA É A CANDIDATA; {{PLAYER}} FICA COM A CÂMARA",
    lede:
      "Cumprindo o acordo, {{g:o vereador/a vereadora}} {{player}} subiu ao palco para levantar o braço de Renata Saldanha. " +
      "Em troca, a presidência da Câmara. Nos bastidores, já se pergunta quem vai cobrar quem daqui a quatro anos.",
  },
  passed_over: {
    tone: "bittersweet",
    kicker: "Convenção do partido",
    headline: "PARTIDO ESCOLHE OUTRO NOME; {{PLAYER}} FICA PARA A PRÓXIMA",
    lede:
      "A convenção passou sem que o nome {{g:do vereador/da vereadora}} {{player}} fosse lembrado. Para ser candidat{{g:o/a}}, era preciso ter ao mesmo tempo a cúpula, o dinheiro e o povo. " +
      "Na política, quatro anos são uma eternidade. Ou um instante.",
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
