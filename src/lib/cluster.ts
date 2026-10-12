/**
 * Himpunan pin peta (tanpa pustaka tambahan): pin yang terlalu rapat pada aras zum semasa
 * digabung menjadi satu. Koordinat dalam piksel (unjuran Leaflet pada zum semasa).
 */
export type ClusterPoint<T> = { x: number; y: number; item: T };

export type Cluster<T> = {
  /** Pusat (purata) dalam piksel. */
  x: number;
  y: number;
  items: T[];
};

/** Zum di mana pin tidak lagi dihimpunkan. */
export const CLUSTER_UNTIL_ZOOM = 8;
/** Jarak (px) di bawahnya dua pin digabung. */
export const CLUSTER_RADIUS_PX = 44;

/**
 * Tamak: pin dengan `weight` tertinggi (cth. IPU terburuk) menjadi pusat himpunan dahulu,
 * supaya pin paling penting tidak "tertelan" oleh pin lain.
 */
export function clusterPoints<T>(
  points: ClusterPoint<T>[],
  radius: number,
  weight: (item: T) => number = () => 0,
): Cluster<T>[] {
  const order = [...points].sort((a, b) => weight(b.item) - weight(a.item));
  const used = new Set<ClusterPoint<T>>();
  const clusters: Cluster<T>[] = [];
  for (const seed of order) {
    if (used.has(seed)) continue;
    const members = order.filter(
      (p) => !used.has(p) && Math.hypot(p.x - seed.x, p.y - seed.y) <= radius,
    );
    for (const p of members) used.add(p);
    clusters.push({
      x: members.reduce((s, p) => s + p.x, 0) / members.length,
      y: members.reduce((s, p) => s + p.y, 0) / members.length,
      items: members.map((p) => p.item),
    });
  }
  return clusters;
}
