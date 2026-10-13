"use client";

import { useEffect, useRef, useState } from "react";
import { fallbackGradient, skyParams, type SkyParams } from "@/lib/sky";
import { SKY_FRAGMENT, SKY_VERTEX } from "@/lib/sky-shader";
import type { CurrentWeather } from "@/lib/weather";

type Input = {
  ipu: number | null;
  weather: CurrentWeather | null | undefined;
  wind: { direction: number; speed: number } | null | undefined;
};

/** Parameter dikira semula setiap minit (matahari bergerak perlahan). */
const PARAMS_EVERY_MS = 60_000;

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, SKY_VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, SKY_FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error("Program langit gagal");
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const attr = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    res: u("uRes"),
    time: u("uTime"),
    haze: u("uHaze"),
    cloud: u("uCloud"),
    sunEl: u("uSunEl"),
    sunX: u("uSunX"),
    rain: u("uRain"),
    phase: u("uPhase"),
    wind: u("uWind"),
    windSpeed: u("uWindSpeed"),
  };

  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    draw(p: SkyParams, seconds: number) {
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform1f(loc.time, seconds);
      gl.uniform1f(loc.haze, p.haze);
      gl.uniform1f(loc.cloud, p.cloud);
      gl.uniform1f(loc.sunEl, p.sunEl);
      gl.uniform1f(loc.sunX, p.sunX);
      gl.uniform1f(loc.rain, p.rain);
      gl.uniform1f(loc.phase, p.moonPhase);
      gl.uniform2f(loc.wind, p.windX, p.windY);
      gl.uniform1f(loc.windSpeed, p.windSpeed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    /** Purata warna jalur paling atas (dibaca terus selepas `draw`). */
    topColor() {
      const w = canvas.width;
      const h = Math.min(24, canvas.height);
      const px = new Uint8Array(w * h * 4);
      // Asal koordinat WebGL di bawah kiri: jalur atas bermula pada height - h.
      gl.readPixels(0, canvas.height - h, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const sum = [0, 0, 0];
      for (let i = 0; i < px.length; i += 4)
        for (let c = 0; c < 3; c++) sum[c] += px[i + c];
      const n = px.length / 4 || 1;
      return `rgb(${sum.map((v) => Math.round(v / n)).join(" ")})`;
    },
  };
}

/**
 * Langit hidup (WebGL): warna ikut jerebu dan jarak penglihatan, awan ikut litupan dan angin,
 * matahari/bulan/bintang ikut masa, hujan ikut cuaca. Berhenti bila tidak kelihatan; satu bingkai
 * statik untuk `prefers-reduced-motion`; latar kecerunan CSS bila WebGL tiada.
 */
export function SkyCanvas({
  ipu,
  weather,
  wind,
  className = "",
  coverAt,
  blendTop = false,
}: Input & {
  className?: string;
  /**
   * Telefon: lapisan pudar dari warna bar status Safari (diambil daripada background-color)
   * ke langit, supaya tiada jalur warna berbeza di bahagian atas.
   */
  blendTop?: boolean;
  /** Tatalan (px) yang hampir menutup langit: animasi diperlahankan (~10 fps) untuk jimat bateri. */
  coverAt?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>({ ipu, weather, wind });
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [initial] = useState<[string, string]>(() =>
    fallbackGradient(skyParams({ ipu, weather, wind, now: new Date() })),
  );

  // Data baharu: kemas kini latar sandaran dan lukis semula.
  useEffect(() => {
    input.current = { ipu, weather, wind };
    const [top, bottom] = fallbackGradient(
      skyParams({ ipu, weather, wind, now: new Date() }),
    );
    if (box.current) {
      box.current.style.backgroundImage = `linear-gradient(to bottom, ${top}, ${bottom})`;
      // Safari iOS mewarnakan bar status ikut background-color elemen tetap di atas.
      box.current.style.backgroundColor = top;
      box.current.style.setProperty("--sky-top", top);
    }
    window.dispatchEvent(new Event("hezy-sky"));
  }, [ipu, weather, wind]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let renderer: ReturnType<typeof createRenderer> = null;
    try {
      renderer = createRenderer(el);
    } catch {
      renderer = null;
    }
    if (!renderer) return;
    const r = renderer;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let params = skyParams({ ...input.current, now: new Date() });
    let paramsAt = performance.now();
    let visible = true;
    let raf = 0;

    let lastDraw = 0;
    // Warna bar status: diselaraskan dengan langit sebenar bila parameter berubah.
    let syncTop = true;
    const frame = (now: number) => {
      raf = 0;
      // Langit hampir tertutup oleh kad: lukis jarang-jarang.
      if (
        coverAt !== undefined &&
        window.scrollY > coverAt &&
        now - lastDraw < 100
      ) {
        if (!reduce.matches && visible && !document.hidden)
          raf = requestAnimationFrame(frame);
        return;
      }
      lastDraw = now;
      if (now - paramsAt > PARAMS_EVERY_MS) {
        params = skyParams({ ...input.current, now: new Date() });
        paramsAt = now;
        syncTop = true;
      }
      r.resize();
      r.draw(params, reduce.matches ? 20 : (now - start) / 1000);
      if (syncTop && box.current) {
        syncTop = false;
        const top = r.topColor();
        box.current.style.backgroundColor = top;
        box.current.style.setProperty("--sky-top", top);
      }
      if (!reduce.matches && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const refresh = () => {
      params = skyParams({ ...input.current, now: new Date() });
      paramsAt = performance.now();
      syncTop = true;
      kick();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("resize", kick);
    window.addEventListener("hezy-sky", refresh);
    reduce.addEventListener("change", kick);
    kick();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", kick);
      window.removeEventListener("resize", kick);
      window.removeEventListener("hezy-sky", refresh);
      reduce.removeEventListener("change", kick);
    };
  }, [coverAt]);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className={`overflow-hidden ${className}`}
      style={{
        backgroundImage: `linear-gradient(to bottom, ${initial[0]}, ${initial[1]})`,
        backgroundColor: initial[0],
        ["--sky-top" as string]: initial[0],
      }}
    >
      <canvas
        ref={canvas}
        data-testid="sky"
        className={`h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {blendTop && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-14"
          style={{
            background:
              "linear-gradient(to bottom, var(--sky-top), transparent)",
          }}
        />
      )}
    </div>
  );
}
