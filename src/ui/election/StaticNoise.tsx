import { useEffect, useRef } from "react";

/**
 * TV static between segments: a small canvas of random grey pixels redrawn at
 * ~15 fps. Randomness is fine here: it's pure decoration, never game state.
 */
export function StaticNoise() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const img = ctx.createImageData(c.width, c.height);
    const id = window.setInterval(() => {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }, 66);
    return () => window.clearInterval(id);
  }, []);
  return <canvas ref={canvas} className="bc-static" width={160} height={90} />;
}
