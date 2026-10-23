import type { PathId } from "../../core/types";
import type { CandidateDef } from "../types";

/**
 * Who the player runs against, per path. Profiles are strength by unit
 * (neighbourhoods; for the deputy race also the state's regions).
 */
export const CANDIDATES = {
  // ------------------------------------------------------------ mayor
  renata: {
    name: "Renata Saldanha",
    party: "PSR",
    bio: "A rival de sempre, agora por outro partido. Moderna, articulada, forte com estudantes e classe média.",
    portrait: "rival",
    profile: { centro: 45, jardim_atlantico: 40, vila_operaria: 30, morro_esperanca: 25, cidade_universitaria: 60, sao_bento: 40 },
    attackVerb: "acusa",
    reacts: { dislikedBy: "students" },
  },
  galvao: {
    name: "Roberto Galvão",
    party: "PDE",
    bio: "Empresário do ramo de concessionárias, apoiado pela Associação Comercial e por Augusto Teixeira.",
    portrait: "candidate_galvao",
    profile: { centro: 50, jardim_atlantico: 70, vila_operaria: 25, morro_esperanca: 15, cidade_universitaria: 20, sao_bento: 45 },
    attackVerb: "denuncia",
    reacts: { dislikedBy: "business" },
  },
  tiao: {
    name: "Tião Barbosa",
    party: "PRP",
    bio: "Radialista do programa mais ouvido de Porto Ferro. Fala o que o povo quer ouvir, do jeito que o povo fala.",
    portrait: "candidate_tiao",
    profile: { centro: 35, jardim_atlantico: 15, vila_operaria: 50, morro_esperanca: 55, cidade_universitaria: 20, sao_bento: 40 },
    attackVerb: "dispara no rádio",
    reacts: { onBrokenPromises: true, dislikedBy: "periphery" },
  },
  // ------------------------------------------------------------ state deputy
  heitor: {
    name: "Dr. Heitor Campos",
    party: "PSD",
    bio: "Médico, fazendeiro e deputado há cinco mandatos. No interior, o voto é dele há trinta anos.",
    portrait: "candidate_heitor",
    profile: { serra_alta: 65, campo_seco: 70, vale_do_ipe: 50, porto_novo: 35, centro: 20, jardim_atlantico: 30, sao_bento: 25 },
    attackVerb: "ironiza",
    reacts: { dislikedBy: "retirees" },
  },
  marcia: {
    name: "Pastora Márcia Lemos",
    party: "PSC",
    bio: "Pastora de uma igreja com templos em todo o estado. Cada culto é um comício.",
    portrait: "candidate_marcia",
    profile: { serra_alta: 40, campo_seco: 35, vale_do_ipe: 45, porto_novo: 50, sao_bento: 45, morro_esperanca: 40, vila_operaria: 30 },
    attackVerb: "prega contra",
    reacts: { dislikedBy: "religious" },
  },
  jorginho: {
    name: "Jorge \"Jorginho\" Prates",
    party: "PST",
    bio: "Presidente do sindicato dos metalúrgicos. Comanda as greves e os votos das portas de fábrica.",
    portrait: "candidate_jorginho",
    profile: { porto_novo: 55, vale_do_ipe: 35, vila_operaria: 60, centro: 30, morro_esperanca: 25 },
    attackVerb: "denuncia na porta de fábrica",
    reacts: { dislikedBy: "workers" },
  },
  // ------------------------------------------------------------ council (same party: they compete for the party's seats)
  nilton: {
    name: "Professor Nilton",
    party: "(mesmo partido)",
    bio: "Professor de história do colégio estadual há vinte anos. Metade da cidade foi aluno dele.",
    portrait: "candidate_nilton",
    profile: { centro: 35, jardim_atlantico: 20, vila_operaria: 30, morro_esperanca: 25, cidade_universitaria: 55, sao_bento: 35 },
    attackVerb: "questiona",
    reacts: { dislikedBy: "students" },
  },
  moura: {
    name: "Sargento Moura",
    party: "(mesmo partido)",
    bio: "Policial militar reformado. Promete \"ordem\" em todo bairro que visita.",
    portrait: "candidate_moura",
    profile: { centro: 35, jardim_atlantico: 45, vila_operaria: 30, morro_esperanca: 20, cidade_universitaria: 10, sao_bento: 50 },
    attackVerb: "ataca",
    reacts: { dislikedBy: "retirees" },
  },
  cleide: {
    name: "Dona Cleide da Feira",
    party: "(mesmo partido)",
    bio: "Feirante há quarenta anos. Conhece todo mundo pelo nome, e todo mundo deve um favor a ela.",
    portrait: "candidate_cleide",
    profile: { centro: 45, jardim_atlantico: 10, vila_operaria: 40, morro_esperanca: 45, cidade_universitaria: 15, sao_bento: 30 },
    attackVerb: "reclama",
    reacts: { onBrokenPromises: true, dislikedBy: "periphery" },
  },
} as const satisfies Record<string, CandidateDef>;

export type CandidateId = keyof typeof CANDIDATES;

/** Opponents by path. In the mayor race, Renata runs by another party. */
export const OPPONENTS: Record<PathId, CandidateId[]> = {
  council: ["nilton", "moura", "cleide"],
  mayor: ["renata", "galvao", "tiao"],
  deputy: ["heitor", "marcia", "jorginho"],
};
