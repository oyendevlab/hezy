import type * as Leaflet from "leaflet";
import { heatColor, idw, type HeatPoint } from "@/lib/heat";
import { sampleWind, type WindGrid } from "@/lib/wind-grid";

/** Saiz sel (px) peta haba sebelum dilicinkan; lebih kecil = lebih halus tetapi lebih perlahan. */
const HEAT_CELL = 8;
/** Ketelusan maksimum peta haba supaya peta dan pin masih jelas. */
const HEAT_ALPHA = 0.42;

/** Kanvas sebesar peta dalam overlayPane, disembunyikan semasa animasi zum. */
function overlayCanvas(L: typeof Leaflet, map: Leaflet.Map, className: string) {
  const canvas = L.DomUtil.create(
    "canvas",
    `${className} leaflet-zoom-hide`,
  ) as HTMLCanvasElement;
  canvas.style.pointerEvents = "none";
  map.getPanes().overlayPane.appendChild(canvas);
  const fit = () => {
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
  };
  return { canvas, fit };
}

/**
 * Peta haba IPU: interpolasi IDW antara stesen, dilukis pada grid kasar kemudian
 * dibesarkan dengan pelicinan; memudar jauh dari stesen.
 */
export function createHeatLayer(
  L: typeof Leaflet,
  points: HeatPoint[],
): Leaflet.Layer {
  class HeatLayer extends L.Layer {
    private canvas: HTMLCanvasElement | null = null;
    private fit: (() => void) | null = null;
    private map: Leaflet.Map | null = null;

    onAdd(map: Leaflet.Map) {
      const { canvas, fit } = overlayCanvas(L, map, "hezy-heat");
      this.map = map;
      this.canvas = canvas;
      this.fit = fit;
      map.on("moveend zoomend resize", this.draw, this);
      this.draw();
      return this;
    }

    onRemove(map: Leaflet.Map) {
      map.off("moveend zoomend resize", this.draw, this);
      this.canvas?.remove();
      this.canvas = null;
      this.map = null;
      return this;
    }

    private draw() {
      const map = this.map;
      if (!map || !this.canvas || !this.fit) return;
      this.fit();
      const ctx = this.canvas.getContext("2d");
      if (!ctx) return;
      const w = Math.ceil(this.canvas.width / HEAT_CELL);
      const h = Math.ceil(this.canvas.height / HEAT_CELL);
      const small = document.createElement("canvas");
      small.width = w;
      small.height = h;
      const sctx = small.getContext("2d");
      if (!sctx) return;
      const image = sctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ll = map.containerPointToLatLng([
            (x + 0.5) * HEAT_CELL,
            (y + 0.5) * HEAT_CELL,
          ]);
          const r = idw(points, ll.lat, ll.lng);
          if (!r) continue;
          const [cr, cg, cb] = heatColor(r.ipu);
          const i = (y * w + x) * 4;
          image.data[i] = cr;
          image.data[i + 1] = cg;
          image.data[i + 2] = cb;
          image.data[i + 3] = Math.round(255 * HEAT_ALPHA * r.strength);
        }
      }
      sctx.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(small, 0, 0, this.canvas.width, this.canvas.height);
    }
  }
  return new HeatLayer();
}

/** Kelajuan skrin zarah (px/bingkai bagi setiap km/j) — tetap pada semua aras zum. */
const PX_PER_KMH = 0.07;
/** Hayat zarah (bingkai) sebelum dilahirkan semula di tempat rawak. */
const MAX_AGE = 110;

/**
 * Aliran angin 850 hPa: zarah bergerak mengikut grid angin (interpolasi bilinear) dengan
 * ekor yang memudar. `reduced` (prefers-reduced-motion): anak panah statik pada grid.
 * Berhenti semasa peta digerakkan, bila tab tersembunyi atau peta di luar skrin.
 */
export function createWindLayer(
  L: typeof Leaflet,
  grid: WindGrid,
  reduced: boolean,
): Leaflet.Layer {
  type Particle = { x: number; y: number; age: number };

  class WindLayer extends L.Layer {
    private canvas: HTMLCanvasElement | null = null;
    private fit: (() => void) | null = null;
    private map: Leaflet.Map | null = null;
    private particles: Particle[] = [];
    private raf = 0;
    private moving = false;
    private visible = true;
    private frame = 0;
    private observer: IntersectionObserver | null = null;

    onAdd(map: Leaflet.Map) {
      const { canvas, fit } = overlayCanvas(L, map, "hezy-wind");
      canvas.dataset.mode = reduced ? "static" : "animated";
      this.map = map;
      this.canvas = canvas;
      this.fit = fit;
      map.on("movestart zoomstart", this.pause, this);
      map.on("moveend zoomend resize", this.restart, this);
      document.addEventListener("visibilitychange", this.onVisibility);
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.loop();
      });
      this.observer.observe(map.getContainer());
      this.restart();
      return this;
    }

    onRemove(map: Leaflet.Map) {
      map.off("movestart zoomstart", this.pause, this);
      map.off("moveend zoomend resize", this.restart, this);
      document.removeEventListener("visibilitychange", this.onVisibility);
      this.observer?.disconnect();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.canvas?.remove();
      this.canvas = null;
      this.map = null;
      return this;
    }

    private onVisibility = () => {
      if (!document.hidden) this.loop();
    };

    private pause() {
      this.moving = true;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      const ctx = this.canvas?.getContext("2d");
      if (ctx && this.canvas)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private restart() {
      if (!this.canvas || !this.fit || !this.map) return;
      this.moving = false;
      this.fit();
      if (reduced) {
        this.drawArrows();
        return;
      }
      const { width, height } = this.canvas;
      const count = Math.min(
        700,
        Math.max(120, Math.round((width * height) / 2600)),
      );
      this.particles = Array.from({ length: count }, () => this.spawn(true));
      this.loop();
    }

    private spawn(randomAge = false): Particle {
      const { width, height } = this.canvas!;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        age: randomAge ? Math.floor(Math.random() * MAX_AGE) : 0,
      };
    }

    /** Vektor skrin (px/bingkai) di titik bekas peta; `null` di luar grid angin. */
    private velocity(x: number, y: number): [number, number] | null {
      const ll = this.map!.containerPointToLatLng([x, y]);
      const uv = sampleWind(grid, ll.lat, ll.lng);
      if (!uv) return null;
      return [uv[0] * PX_PER_KMH, -uv[1] * PX_PER_KMH];
    }

    private loop = () => {
      if (
        this.raf ||
        this.moving ||
        !this.visible ||
        document.hidden ||
        reduced ||
        !this.canvas
      )
        return;
      const step = () => {
        this.raf = 0;
        if (!this.canvas || this.moving || !this.visible || document.hidden)
          return;
        // ~30 bingkai sesaat sudah memadai dan menjimatkan bateri.
        this.frame++;
        if (this.frame % 2 === 0) this.tick();
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    };

    private tick() {
      const canvas = this.canvas!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Ekor memudar perlahan: kekalkan 95% lukisan sebelumnya (garisan aliran panjang).
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "rgba(0,0,0,0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(28, 40, 62, 0.5)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let k = 0; k < this.particles.length; k++) {
        const p = this.particles[k];
        const v = this.velocity(p.x, p.y);
        if (!v || p.age > MAX_AGE) {
          this.particles[k] = this.spawn();
          continue;
        }
        const nx = p.x + v[0];
        const ny = p.y + v[1];
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        p.x = nx;
        p.y = ny;
        p.age++;
        if (nx < 0 || ny < 0 || nx > canvas.width || ny > canvas.height)
          this.particles[k] = this.spawn();
      }
      ctx.stroke();
    }

    /** Anak panah statik pada setiap titik grid yang kelihatan (gerakan dikurangkan). */
    private drawArrows() {
      const canvas = this.canvas!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(28, 40, 62, 0.6)";
      ctx.lineWidth = 1.5;
      for (let j = 0; j < grid.ny; j++) {
        for (let i = 0; i < grid.nx; i++) {
          const p = this.map!.latLngToContainerPoint([
            grid.lat0 + j * grid.step,
            grid.lon0 + i * grid.step,
          ]);
          if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height)
            continue;
          const u = grid.u[j * grid.nx + i];
          const v = grid.v[j * grid.nx + i];
          const speed = Math.hypot(u, v);
          if (speed < 1) continue;
          const len = Math.min(26, 8 + speed * 0.6);
          const dx = (u / speed) * len;
          const dy = (-v / speed) * len;
          const ex = p.x + dx / 2;
          const ey = p.y + dy / 2;
          const a = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(p.x - dx / 2, p.y - dy / 2);
          ctx.lineTo(ex, ey);
          ctx.lineTo(ex - 6 * Math.cos(a - 0.5), ey - 6 * Math.sin(a - 0.5));
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 6 * Math.cos(a + 0.5), ey - 6 * Math.sin(a + 0.5));
          ctx.stroke();
        }
      }
    }
  }
  return new WindLayer();
}
