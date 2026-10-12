import { describe, expect, it } from "vitest";
import {
  aggregate,
  bearing,
  firmsUrl,
  parseFirmsCsv,
  upwindHotspots,
  type HotspotCell,
} from "./hotspots";

const CSV = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
-1.50001,103.60001,333.4,0.5,0.5,2026-10-11,514,N,VIIRS,n,2.0NRT,300.9,4.2,D
-1.50002,103.60002,340.1,0.5,0.5,2026-10-11,620,N20,VIIRS,h,2.0NRT,301.0,12.7,D
-1.80000,103.90000,330.0,0.5,0.5,2026-10-11,620,N20,VIIRS,l,2.0NRT,301.0,9.0,D
abc,103.9,330.0,0.5,0.5,2026-10-11,620,N20,VIIRS,n,2.0NRT,301.0,9.0,D
2.10000,111.80000,345.0,0.5,0.5,2026-10-11,620,N20,VIIRS,n,2.0NRT,301.0,22.0,N`;

describe("parseFirmsCsv dan aggregate", () => {
  it("membuang keyakinan rendah dan baris rosak, menggabungkan titik bertindih", () => {
    const points = parseFirmsCsv(CSV);
    expect(points).toHaveLength(3);
    const cells = aggregate(points);
    expect(cells).toHaveLength(2);
    expect(cells[0]).toEqual([-1.5, 103.6, 2, 13]);
    expect(parseFirmsCsv("latitude,longitude\n")).toEqual([]);
    expect(() => parseFirmsCsv("a,b\n1,2")).toThrow();
  });

  it("URL kawasan rantau 2 hari", () => {
    expect(firmsUrl("KEY", "VIIRS_SNPP_NRT")).toBe(
      "https://firms.modaps.eosdis.nasa.gov/api/area/csv/KEY/VIIRS_SNPP_NRT/95,-6,120,8/2",
    );
  });
});

describe("upwindHotspots", () => {
  const SHAH_ALAM = { lat: 3.07, lon: 101.52 };
  const cells: HotspotCell[] = [
    [-1.5, 103.6, 2, 13], // Jambi/Riau, tenggara ~470 km
    [0.5, 101.4, 1, 5], // Riau, selatan ~285 km
    [2.1, 111.8, 1, 22], // Sarawak, timur > 600 km
  ];

  it("hanya sel dalam kon ±30° dan 600 km dari arah angin", () => {
    expect(Math.round(bearing(SHAH_ALAM, { lat: -1.5, lon: 103.6 }))).toBe(156);
    expect(upwindHotspots(cells, SHAH_ALAM, 150)).toBe(1);
    expect(upwindHotspots(cells, SHAH_ALAM, 170)).toBe(2);
    expect(upwindHotspots(cells, SHAH_ALAM, 45)).toBe(0);
    expect(upwindHotspots(cells, SHAH_ALAM, 90, 2000)).toBe(1);
  });
});
