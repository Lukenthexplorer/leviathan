# Leviathan — Art, Sound & Game Feel

This is the bar: Leviathan has to look, sound and *feel* amazing. All assets are made with AI, so consistency is the top priority.

## References

- **Suzerain** (main reference): political documents, newspapers, painted portraits, a presidential mood
- **Disco Elysium:** rich painted character portraits and moody atmosphere
- **Papers, Please:** the tactile feel of making decisions at a desk, with stamps and paperwork. It's a reference for feel only. Pixel art is not the target style, because AI produces messy fake pixel art.

## Art direction

- An illustrated, painted look in the style of Suzerain. Moody, slightly retro, politically noir.
- Visual language: old newspapers, stamped files, folders, telegrams, campaign posters, official seals.
- The palette shifts with the state of your career, from warm and hopeful early on to colder and darker as power or corruption grows.
- **Portraits:** painted, expressive, with several expressions per key character (neutral, pleased, angry, suspicious).
- **City map:** a stylized top-down view, simple and readable, with neighbourhoods that change mood visually.

### Keeping AI art consistent

- Write one master **"style recipe" prompt** and reuse it for every asset, changing only the subject.
- Use the same model and settings for the whole project.
- Generate key characters first and use them as references.
- Keep a prompt log next to every asset.

### AI tooling

- Images: fal.ai through its hosted MCP server with a Flux-type model, or Replicate's MCP. Costs a few cents per image.
- Generation can run directly from Claude or Claude Code through MCP.

## Sound and music

- **Music mood:** slow noir jazz mixed with Brazilian bossa nova.
- **Dynamic music:** calm piano in the office, with tension building as things go wrong (drums creep in during a scandal). Use layered stems and crossfade by tension level.
- **Desk sound effects:** stamps thumping, typewriter keys, phones ringing, paper rustling, drawers, pen signatures.
- **World sounds:** crowds cheering or protesting outside the window, city ambience, a TV news jingle.
- **AI tools:** ElevenLabs (official MCP) for sound effects and voices. Music through fal's music models (via the fal MCP) or Suno.

## Game feel ("juice")

Every interaction should feel tactile and satisfying:

- Papers slide onto the desk, and you can pick them up and toss them away
- The stamp comes down with a thud, a slight screen shake and ink spread
- Newspapers spin in for headlines and scandals
- The "Next week" transition shows a calendar page flip with a short ambient sound montage
- Social group reactions appear as animated opinion shifts
- Scandals bring a red flash, the phone ringing nonstop and music shifting to tension
- Smooth zoom from the desk to the living map
- Hover states, subtle parallax and small idle animations (steam from the coffee cup, a ticking clock)

Implementation: GSAP and/or Framer Motion for UI animation, PixiJS effects on the map, Howler.js for layered audio.

## Quality bar

If an interaction feels flat, it isn't done. Every click should have motion, sound and a consequence.
