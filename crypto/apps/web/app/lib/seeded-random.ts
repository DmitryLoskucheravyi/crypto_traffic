// Deterministic PRNG (never Math.random at render time) so the server and the
// first client render produce byte-identical generated visuals — every chart on
// this site is generated code, not fetched or fabricated market data.
export function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
