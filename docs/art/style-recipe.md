# Style recipe (master prompt)

Reuse this prompt for **every** portrait. Change only `[SUBJECT]`. Same model, same settings for the whole project.

```
Painted character portrait, [SUBJECT], in the style of a moody political noir graphic novel, inspired by Suzerain and Disco Elysium, visible brushstrokes, muted warm palette with deep shadows, dramatic side lighting, 1980s-90s Latin American political atmosphere, head and shoulders, plain dark textured background, serious expressive face, no text
```

## Expressions

Generate the neutral portrait first, then use it as the reference image for the other three:
`neutral`, `pleased`, `angry`, `suspicious`.

## File naming

`public/assets/portraits/<character>_<expression>.png` (e.g. `journalist_suspicious.png`).
After replacing a placeholder, update the extension in `src/ui/assets.ts`.

Log every generation in [prompt-log.md](prompt-log.md).
