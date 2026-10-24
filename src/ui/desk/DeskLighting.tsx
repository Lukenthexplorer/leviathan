import { DESK_ART } from "../assets";

/**
 * The desk's light, as layers under and over the objects (none take clicks):
 *   wood -> warm pool under the lamp -> strong vignette  (below the objects)
 *   soft shade                                            (over decorations, under papers)
 *   the lamp itself, in the top-right corner              (on top: it is the light)
 * All shadows on the desk fall away from the lamp (down and to the left).
 * "night" is the same rig for election night: lamp low, the TV's cold glow, darker edges.
 */
export function DeskLighting({ variant = "day" }: { variant?: "day" | "night" }) {
  return (
    <>
      <div className={`desk-wood light-${variant}`} style={{ backgroundImage: `url(${DESK_ART.desk_bg})` }} aria-hidden />
      <div className={`desk-pool light-${variant}`} aria-hidden />
      <div className={`desk-vignette light-${variant}`} aria-hidden />
      <div className={`desk-shade light-${variant}`} aria-hidden />
      <img className={`desk-lamp light-${variant}`} src={DESK_ART.lamp} alt="" aria-hidden />
    </>
  );
}
