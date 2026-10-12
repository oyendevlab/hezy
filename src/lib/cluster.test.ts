import { describe, expect, it } from "vitest";
import { clusterPoints } from "./cluster";

const pt = (x: number, y: number, ipu: number) => ({ x, y, item: { ipu } });

describe("clusterPoints", () => {
  it("pin rapat digabung, pin jauh kekal berasingan", () => {
    const clusters = clusterPoints(
      [pt(0, 0, 50), pt(10, 10, 80), pt(200, 200, 40)],
      44,
      (i) => i.ipu,
    );
    expect(clusters).toHaveLength(2);
    expect(clusters[0].items.map((i) => i.ipu)).toEqual([80, 50]);
    expect(clusters[0].x).toBe(5);
    expect(clusters[1].items).toEqual([{ ipu: 40 }]);
  });
  it("IPU tertinggi menjadi pusat dahulu", () => {
    // 0 —40px— 1 —40px— 2: pusat ialah titik tengah (IPU tertinggi), menelan kedua-dua jiran.
    const clusters = clusterPoints(
      [pt(0, 0, 10), pt(40, 0, 200), pt(80, 0, 20)],
      44,
      (i) => i.ipu,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items[0].ipu).toBe(200);
  });
  it("setiap pin dalam tepat satu himpunan", () => {
    const points = Array.from({ length: 50 }, (_, i) =>
      pt((i * 37) % 300, (i * 53) % 300, i),
    );
    const clusters = clusterPoints(points, 44, (i) => i.ipu);
    expect(clusters.flatMap((c) => c.items)).toHaveLength(50);
  });
  it("tiada pin: tiada himpunan", () => {
    expect(clusterPoints([], 44)).toEqual([]);
  });
});
