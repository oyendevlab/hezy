import { describe, expect, it } from "vitest";
import { buildCardPath, parseCard } from "./share-card";

const params = (path: string) =>
  Object.fromEntries(new URL(path, "https://hezy.vercel.app").searchParams);

describe("kad kongsi", () => {
  it("membina dan membaca semula parameter kad", () => {
    const path = buildCardPath({
      name: "Putrajaya",
      ipu: 153,
      source: "apims",
      hours: [88, null, 153, ...Array(21).fill(150)],
      now: 2,
      time: "12:00 tengah hari",
      lang: "en",
      format: "story",
    });
    expect(path.startsWith("/kongsi/kad?")).toBe(true);
    const card = parseCard(params(path))!;
    expect(card).toMatchObject({
      name: "Putrajaya",
      ipu: 153,
      category: "tidak-sihat",
      source: "apims",
      now: 2,
      time: "12:00 tengah hari",
      lang: "en",
      format: "story",
    });
    expect(card.hours.slice(0, 3)).toEqual([88, null, 153]);
    expect(card.hours).toHaveLength(24);
  });

  it("membersihkan nilai rosak dan menolak kad tanpa IPU sah", () => {
    const card = parseCard({
      n: "Klang",
      i: "80",
      h: "1,abc,-5,2000,40",
      k: "99",
      t: "<script>12:00",
      l: "fr",
      f: "giant",
    })!;
    expect(card.hours).toEqual([1, null, null, null, 40]);
    expect(card.now).toBe(-1);
    expect(card.time).toBe("script12:00");
    expect(card.lang).toBe("ms");
    expect(card.format).toBe("square");
    expect(parseCard({ n: "Klang", i: "x" })).toBeNull();
    expect(parseCard({ n: "Klang", i: "80", h: "-,-" })!.hours).toEqual([]);
  });
});
