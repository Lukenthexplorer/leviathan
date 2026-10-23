import type { MediaChannelDef } from "./types";

/**
 * How politicians reach the public, by era. One calm channel and one loud
 * channel per era: the choice stays "explain" vs "promise", the world around it
 * changes. Shared by every chapter, since the career crosses decades.
 */
export const MEDIA_CHANNELS: MediaChannelDef[] = [
  // ------------------------------------------------ 1980s – early 90s: radio and the street
  {
    style: "informative",
    from: 1980,
    to: 1994,
    name: "Entrevista na rádio",
    description: "Meia hora no programa da manhã da Rádio Porto Ferro AM, explicando {topic} sem pressa.",
    agenda: "Entrevista na rádio para {group}",
    cause: "Deu entrevista na rádio sobre {topic}",
  },
  {
    style: "populist",
    from: 1980,
    to: 1994,
    name: "Carro de som",
    description: "Um carro de som rodando o bairro com jingle, foguetório e promessas do tamanho do alto-falante.",
    agenda: "Carro de som para {group}",
    cause: "Prometeu mundos e fundos aos {group} no carro de som",
  },
  // ------------------------------------------------ 1995 – 2004: television
  {
    style: "informative",
    from: 1995,
    to: 2004,
    name: "Debate na TV local",
    description: "Um debate no telejornal da noite sobre {topic}, com números e paciência.",
    agenda: "Debate na TV para {group}",
    cause: "Debateu {topic} na TV",
  },
  {
    style: "populist",
    from: 1995,
    to: 2004,
    name: "Propaganda na TV",
    description: "Trinta segundos de trilha emocionante, crianças sorrindo e promessas sobre {topic}.",
    agenda: "Propaganda na TV para {group}",
    cause: "Prometeu tudo aos {group} na propaganda da TV",
  },
  // ------------------------------------------------ 2005 – 2015: early internet
  {
    style: "informative",
    from: 2005,
    to: 2015,
    name: "Texto no blog",
    description: "Um texto longo no blog do mandato explicando {topic}, com links e gráficos.",
    agenda: "Texto no blog para {group}",
    cause: "Escreveu no blog sobre {topic}",
  },
  {
    style: "populist",
    from: 2005,
    to: 2015,
    name: "Corrente de e-mail",
    description: "Uma corrente encaminhada mil vezes, em letras maiúsculas, prometendo resolver {topic}.",
    agenda: "Corrente de e-mail para {group}",
    cause: "Espalhou promessas aos {group} numa corrente de e-mail",
  },
  // ------------------------------------------------ 2016+: social media
  {
    style: "informative",
    from: 2016,
    to: 2100,
    name: "Thread nas redes",
    description: "Uma thread cuidadosa explicando {topic}, ponto por ponto.",
    agenda: "Thread nas redes para {group}",
    cause: "Postou uma explicação sobre {topic}",
  },
  {
    style: "populist",
    from: 2016,
    to: 2100,
    name: "Vídeo viral",
    description: "Um vídeo inflamado, cortes rápidos, promessas grandes sobre {topic}. Aplausos maiores.",
    agenda: "Vídeo viral para {group}",
    cause: "Prometeu mundos e fundos aos {group} num vídeo viral",
  },
];

/** The channel for a given style in a given year. */
export function channelFor(year: number, style: MediaChannelDef["style"]): MediaChannelDef {
  const c = MEDIA_CHANNELS.find((m) => m.style === style && year >= m.from && year <= m.to);
  if (!c) throw new Error(`No ${style} media channel in ${year}`);
  return c;
}
