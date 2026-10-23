/**
 * What the anchor, Cid Monteiro, says on election night. Keyed by situation.
 * Placeholders: {name}, {unit}, {cause}, {a}, {b}, {gap}. Templates like
 * {{player}} and {{g:o/a}} work too.
 */
export const ELECTION_LINES = {
  channel: "TV Porto Ferro",
  anchor: "Cid Monteiro",
  opening: "Boa noite. Começa agora a apuração em Porto Ferro. As primeiras urnas chegam do Centro, abertas a mão no Ginásio Municipal.",
  openingDeputy: "Boa noite. Começa a apuração para a Assembleia Legislativa: primeiro Porto Ferro, depois as urnas do interior, que chegam de caminhão.",
  unitReported: "Urnas de {unit} chegando. {cause}.",
  unitReportedQuiet: "Mais urnas de {unit} no ginásio.",
  leadChange: "VIRADA! {name} assume a liderança!",
  close: "Disputa voto a voto: menos de {gap} pontos separam os dois primeiros.",
  landslide: "{name} abre vantagem e caminha para uma vitória folgada.",
  runoffIntro: "Ninguém passou de 50% dos votos válidos. {a} e {b} vão para o segundo turno.",
  runoffOpening: "Três semanas depois. Segundo turno em Porto Ferro: só dois nomes nas urnas agora.",
  finalWin: "Está decidido. {name} vence a eleição.",
  finalLoss: "Está decidido. {name} vence. Para {{player}}, a noite termina em silêncio.",
  finalCouncilWin: "Contados todos os votos: {{player}} garante uma das cadeiras do partido na Câmara.",
  finalCouncilLoss: "Contados todos os votos: as cadeiras do partido ficam com {a} e {b}. {{player}} está fora.",
  finalDeputyWin: "Com as urnas do interior, está confirmado: {{player}} vai para a Assembleia Legislativa.",
  finalDeputyLoss: "O interior decidiu. {{player}} fica de fora da Assembleia.",
} as const;
