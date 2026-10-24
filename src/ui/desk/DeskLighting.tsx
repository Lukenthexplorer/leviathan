import { DESK_ART } from "../assets";

/**
 * The desk's light, as layers under and over the objects (none take clicks):
 *   wood -> warm pool under the lamp -> strong vignette  (below the objects)
 *   soft shade                                            (over decorations, under papers)
 *   the lamp itself, in the top-left corner               (on top: it is the light)
 * All the art is lit from the top-left, so every shadow falls down and to the right.
 * "night" is the same rig for election night: the blue-lit desk (desk_night, same
 * framing as the day desk) fades in over the day one, the lamp turned low.
 */
export function DeskLighting({ variant = "day" }: { variant?: "day" | "night" }) {
  return (
    <>
      <div className={`desk-wood light-${variant}`} style={{ backgroundImage: `url(${DESK_ART.desk_bg})` }} aria-hidden />
      {variant === "night" && <div className="desk-wood night-wood" style={{ backgroundImage: `url(${DESK_ART.desk_night})` }} aria-hidden />}
      <div className={`desk-pool light-${variant}`} aria-hidden />
      <div className={`desk-vignette light-${variant}`} aria-hidden />
      <div className={`desk-shade light-${variant}`} aria-hidden />
      <img className={`desk-lamp light-${variant}`} src={DESK_ART.lamp} alt="" aria-hidden />
    </>
  );
}
