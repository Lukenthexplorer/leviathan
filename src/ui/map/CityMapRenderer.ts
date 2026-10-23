import gsap from "gsap";
import { Application, Container, Graphics, Polygon, Text } from "pixi.js";
import type { MapMarker } from "../../core/types";
import { DISTRICTS, MAP_SIZE, ROADS, SEA, type Point } from "./layout";
import type { DistrictView, MapModel } from "./model";

const INK = 0x2a1d14;
const LAND = 0xe3d6b6;
const SEA_COLOR = 0x8fa6a8;

interface DistrictNode {
  shape: Graphics;
  /** Current displayed colour, tweened towards the target when mood changes. */
  color: { r: number; g: number; b: number };
  label: Text;
  markers: Container;
  flags: Container;
  markerKey: string;
  flagKey: string;
}

interface Callbacks {
  onHover(id: string | null): void;
  onSelect(id: string): void;
}

/**
 * Everything PixiJS lives here. Like GSAP, Pixi is imperative: you create
 * objects and mutate them. This class hides that behind a tiny API (mount,
 * update, destroy) so React never touches Pixi objects directly.
 */
export class CityMapRenderer {
  private app = new Application();
  private root = new Container();
  private waves = new Graphics();
  private districts = new Map<string, DistrictNode>();
  private hovered: string | null = null;
  private selected: string | null = null;
  private model: MapModel | null = null;
  private mounted = false;
  private time = 0;

  constructor(private callbacks: Callbacks) {}

  async mount(el: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: el,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    el.appendChild(this.app.canvas);
    this.app.stage.addChild(this.root);
    this.drawStatic();
    this.app.ticker.add((t) => this.tick(t.deltaMS / 1000));
    this.app.renderer.on("resize", () => this.fit());
    this.fit();
    this.mounted = true;
    if (this.model) this.update(this.model, false);
  }

  /** Bring the map in line with the game state. `animate` tweens mood colours. */
  update(model: MapModel, animate = true): void {
    this.model = model;
    if (!this.mounted) return;
    for (const d of model.districts) {
      const node = this.districts.get(d.id);
      if (!node) continue;
      node.label.text = d.name;
      this.tweenColor(node, d, animate);
      this.syncMarkers(node, d);
      this.syncFlags(node, d, model.partyColor);
    }
  }

  select(id: string | null): void {
    this.selected = id;
    for (const id of this.districts.keys()) this.redraw(id);
  }

  destroy(): void {
    gsap.killTweensOf([...this.districts.values()].map((n) => n.color));
    this.app.destroy(true, { children: true });
  }

  // ------------------------------------------------------------------ drawing

  private fit(): void {
    const { width, height } = this.app.screen;
    const s = Math.min(width / MAP_SIZE.width, height / MAP_SIZE.height);
    this.root.scale.set(s);
    this.root.position.set((width - MAP_SIZE.width * s) / 2, (height - MAP_SIZE.height * s) / 2);
  }

  private drawStatic(): void {
    const land = new Graphics().rect(0, 0, MAP_SIZE.width, MAP_SIZE.height).fill(LAND);
    const sea = new Graphics().poly(flat(SEA)).fill(SEA_COLOR);
    this.root.addChild(land, sea, this.waves);

    for (const [id, shape] of Object.entries(DISTRICTS)) {
      const g = new Graphics();
      g.eventMode = "static";
      g.cursor = "pointer";
      g.hitArea = new Polygon(flat(shape.polygon));
      g.on("pointerover", () => this.hover(id));
      g.on("pointerout", () => this.hover(null));
      g.on("pointertap", () => this.callbacks.onSelect(id));
      this.root.addChild(g);
      this.districts.set(id, {
        shape: g,
        color: { r: 0xd8, g: 0xcb, b: 0xa8 },
        label: new Text({
          text: "",
          // A paper-coloured halo keeps names readable where avenues cross them, like printed maps.
          style: {
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 20,
            fontWeight: "700",
            fill: INK,
            align: "center",
            stroke: { color: LAND, width: 6, join: "round" },
          },
        }),
        markers: new Container(),
        flags: new Container(),
        markerKey: "",
        flagKey: "",
      });
      this.redraw(id);
    }

    // Hill contours on the Morro: it IS a hill.
    const [hx, hy] = DISTRICTS.morro_esperanca!.center;
    const contours = new Graphics();
    for (let r = 30; r <= 100; r += 22) contours.ellipse(hx - 10, hy - 10, r * 1.3, r * 0.8).stroke({ width: 1, color: INK, alpha: 0.15 });
    this.root.addChild(contours);

    const roads = new Graphics();
    for (const road of ROADS) roads.poly(flat(road), false).stroke({ width: 3, color: INK, alpha: 0.35, cap: "round", join: "round" });
    this.root.addChild(roads);

    for (const [id, shape] of Object.entries(DISTRICTS)) {
      const node = this.districts.get(id)!;
      const label = node.label;
      label.anchor.set(0.5);
      label.position.set(shape.center[0], shape.center[1] - 28);
      label.eventMode = "none";
      node.markers.position.set(shape.center[0], shape.center[1] + 12);
      node.flags.position.set(shape.center[0], shape.center[1] - 52);
      this.root.addChild(label, node.markers, node.flags);
    }

    const title = new Text({
      text: "PORTO FERRO",
      style: { fontFamily: "Playfair Display, Georgia, serif", fontSize: 30, fontWeight: "900", fill: INK, letterSpacing: 6 },
    });
    title.position.set(760, 70);
    const subtitle = new Text({ text: "Planta da cidade, 1989", style: { fontFamily: "Special Elite, monospace", fontSize: 14, fill: INK } });
    subtitle.position.set(764, 108);
    this.root.addChild(title, subtitle, this.compass(940, 170));
  }

  private compass(x: number, y: number): Graphics {
    return new Graphics()
      .circle(x, y, 22)
      .stroke({ width: 1.5, color: INK, alpha: 0.6 })
      .poly([x, y - 30, x + 6, y, x, y + 30, x - 6, y])
      .fill({ color: INK, alpha: 0.6 });
  }

  private redraw(id: string): void {
    const node = this.districts.get(id);
    const shape = DISTRICTS[id];
    if (!node || !shape) return;
    const { r, g, b } = node.color;
    const active = this.hovered === id || this.selected === id;
    node.shape
      .clear()
      .poly(flat(shape.polygon))
      .fill({ color: (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b), alpha: active ? 1 : 0.85 })
      .stroke({ width: active ? 4 : 2, color: INK, alpha: active ? 0.9 : 0.6, join: "round" });
  }

  private hover(id: string | null): void {
    const prev = this.hovered;
    this.hovered = id;
    if (prev) this.redraw(prev);
    if (id) this.redraw(id);
    this.callbacks.onHover(id);
  }

  private tweenColor(node: DistrictNode, d: DistrictView, animate: boolean): void {
    const target = { r: (d.tint >> 16) & 0xff, g: (d.tint >> 8) & 0xff, b: d.tint & 0xff };
    if (!animate) {
      Object.assign(node.color, target);
      this.redraw(d.id);
      return;
    }
    gsap.to(node.color, { ...target, duration: 1.6, ease: "power2.inOut", onUpdate: () => this.redraw(d.id) });
  }

  // ------------------------------------------------------------------ markers & flags

  private syncMarkers(node: DistrictNode, d: DistrictView): void {
    const key = d.markers.join(",");
    if (key === node.markerKey) return;
    node.markerKey = key;
    node.markers.removeChildren().forEach((c) => c.destroy({ children: true }));
    d.markers.forEach((kind, i) => {
      const m = markerGraphic(kind);
      m.position.set((i - (d.markers.length - 1) / 2) * 34, 0);
      m.label = kind;
      node.markers.addChild(m);
      gsap.from(m.scale, { x: 0, y: 0, duration: 0.6, ease: "back.out(3)" });
    });
  }

  /** Small party flags: one per 20% of roots the player has in the district. */
  private syncFlags(node: DistrictNode, d: DistrictView, color: number): void {
    const count = Math.ceil(d.base / 20);
    const key = `${count}:${color}`;
    if (key === node.flagKey) return;
    node.flagKey = key;
    node.flags.removeChildren().forEach((c) => c.destroy());
    for (let i = 0; i < count; i++) {
      const f = new Graphics()
        .moveTo(0, 0)
        .lineTo(0, -18)
        .stroke({ width: 2, color: INK })
        .poly([0, -18, 12, -14, 0, -10])
        .fill(color);
      f.position.set((i - (count - 1) / 2) * 14, 0);
      node.flags.addChild(f);
    }
  }

  // ------------------------------------------------------------------ idle animation

  private tick(dt: number): void {
    this.time += dt;
    const t = this.time;

    // Gentle waves along the coast.
    this.waves.clear();
    for (let row = 0; row < 6; row++) {
      const y = 650 + row * 9 - (row % 2) * 3;
      const offset = Math.sin(t * 0.8 + row) * 8;
      for (let x = 40 + (row % 2) * 30; x < 1000; x += 70) {
        this.waves.moveTo(x + offset, y).quadraticCurveTo(x + 10 + offset, y - 4, x + 20 + offset, y);
      }
    }
    this.waves.stroke({ width: 1.5, color: 0xffffff, alpha: 0.35 });

    for (const node of this.districts.values()) {
      for (const m of node.markers.children) {
        switch (m.label as MapMarker) {
          case "protest": // a crowd pulsing
            m.scale.set(1 + Math.sin(t * 6) * 0.12);
            break;
          case "construction": // a crane swinging
            m.rotation = Math.sin(t * 1.5) * 0.15;
            break;
          case "police": // flashing lights
            (m.children[0] as Graphics).tint = Math.floor(t * 3) % 2 ? 0x3355cc : 0xcc3333;
            break;
          case "rally": // dancing confetti
            m.rotation = t * 1.2;
            break;
        }
      }
    }
  }
}

function flat(points: Point[]): number[] {
  return points.flat();
}

/** Simple ink-and-colour icons for map markers. */
function markerGraphic(kind: MapMarker): Container {
  const c = new Container();
  switch (kind) {
    case "protest": {
      const g = new Graphics().circle(0, 0, 14).fill(0xb3241b).stroke({ width: 2, color: INK });
      const t = new Text({ text: "!", style: { fontFamily: "Georgia", fontSize: 20, fontWeight: "900", fill: 0xffffff } });
      t.anchor.set(0.5);
      c.addChild(g, t);
      break;
    }
    case "construction": {
      const g = new Graphics()
        .moveTo(0, 14)
        .lineTo(0, -14)
        .lineTo(16, -14)
        .stroke({ width: 3, color: 0xd9a21b })
        .moveTo(14, -14)
        .lineTo(14, -4)
        .stroke({ width: 1.5, color: INK })
        .rect(-8, 10, 16, 6)
        .fill(0xd9a21b);
      c.addChild(g);
      break;
    }
    case "police": {
      const g = new Graphics().circle(0, 0, 10).fill(0xffffff).stroke({ width: 2, color: INK });
      c.addChild(g);
      break;
    }
    case "rally": {
      const colors = [0xe0b83a, 0x3a8fd0, 0xd04a7a, 0x5ab05a];
      colors.forEach((col, i) => {
        const a = (i / colors.length) * Math.PI * 2;
        c.addChild(new Graphics().rect(-3, -3, 6, 6).fill(col)).position.set(Math.cos(a) * 12, Math.sin(a) * 12);
      });
      break;
    }
  }
  return c;
}
