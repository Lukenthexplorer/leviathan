# Leviathan

Um jogo de estratégia política por turnos. Você começa como vereador(a) numa cidade fictícia inspirada no Brasil, em 1989, e sobe escolha por escolha. Nada é aleatório, a moralidade é oculta e livros de verdade desbloqueiam ideias de verdade.

**Estado atual:** o Capítulo 1 (Vereador) está jogável do começo ao fim. Os próximos capítulos (Prefeito, Governador/Congresso, Presidência, Mundo) vêm depois.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes da simulação (Vitest)
npm run sim        # simula estratégias no terminal, para balanceamento
```

## Como o código está organizado

| Pasta | O que tem |
|---|---|
| `src/core/` | O motor, genérico e sem React: `advanceTurn(state, decisions)`, efeitos, condições, eventos, consequências atrasadas |
| `src/chapters/councilman/` | As regras do capítulo do Vereador: ações, objetivos, finais, legado |
| `src/content/` | Conteúdo em dados: partidos, grupos, leis, livros, eventos, esquemas. Todos os números de balanceamento ficam em `balance.ts` |
| `src/persistence/` | Salvar e carregar (localStorage, com versões e migrações) |
| `src/ui/` | React + GSAP (a mesa), PixiJS (o mapa), Howler (áudio) |
| `docs/` | Documento de design, build brief, direção de arte e o log de prompts das artes |
| `art/source/` | Artes originais; as cópias otimizadas ficam em `public/assets/` |

A simulação é uma função pura: o mesmo estado com as mesmas decisões dá sempre o mesmo resultado. É por isso que ela pode ser testada sem navegador e simulada no terminal.
