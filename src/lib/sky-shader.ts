/** Shader langit hidup (WebGL 1). Sama seperti mockup yang diluluskan: docs/mockup/mockup-langit.html. */

export const SKY_VERTEX = `attribute vec2 a;
void main() { gl_Position = vec4(a, 0., 1.); }`;

export const SKY_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime, uHaze, uCloud, uSunEl, uSunX, uRain, uPhase, uWindSpeed;
uniform vec2 uWind;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= .5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float y = uv.y;

  float day = smoothstep(-.10, .12, uSunEl);
  float dusk = 1. - smoothstep(0., .32, abs(uSunEl - .02));

  // Kecerunan langit: malam ke siang, senja di ufuk.
  vec3 zen = mix(vec3(.02, .035, .10), vec3(.20, .47, .86), day);
  vec3 hor = mix(vec3(.07, .10, .22), vec3(.70, .85, .96), day);
  zen = mix(zen, vec3(.30, .30, .58), dusk * .55);
  hor = mix(hor, vec3(.99, .60, .40), dusk * .85);
  vec3 col = mix(hor, zen, pow(y, .75));

  // Warna jerebu: kelabu-kuning siang, perang gelap malam, jingga ketika senja.
  vec3 hz = mix(vec3(.17, .15, .13), vec3(.80, .74, .58), day);
  // Jerebu teruk: lebih perang dan gelap.
  hz = mix(hz, hz * vec3(.86, .76, .6), smoothstep(.65, 1., uHaze));
  hz = mix(hz, vec3(.88, .62, .42), dusk * .5);
  col = mix(col, hz, min(uHaze * (.6 + .45 * (1. - y)), .97));

  // Awan: dua lapisan bergerak ikut angin (dikira dahulu untuk menutup matahari/bulan/bintang).
  vec2 drift = -uWind * uTime * (.006 + uWindSpeed * .0008);
  float c1 = fbm(p * vec2(1.1, 2.8) + drift);
  float c2 = fbm(p * vec2(2.4, 5.2) + drift * 1.7 + 11.);
  float v = c1 * .68 + c2 * .32;
  float lo = .60 - uCloud * .38;
  float dens = smoothstep(lo, lo + .16, v) * smoothstep(.06, .42, y);
  dens = max(dens, uRain * .55 * smoothstep(.1, .6, y));

  // Bintang: berkelip, pudar dalam jerebu, awan dan dekat ufuk.
  float night = 1. - day;
  vec2 g = p * 60.;
  vec2 id = floor(g);
  float s = hash(id);
  if (s > .965) {
    vec2 o = (vec2(hash(id + 3.), hash(id + 7.)) - .5) * .6;
    float d = length(fract(g) - .5 - o);
    float tw = .5 + .5 * sin(uTime * (1.2 + s * 3.) + s * 80.);
    float size = mix(.06, .14, hash(id + 13.));
    col += vec3(.95, .97, 1.) * smoothstep(size, 0., d) * (.4 + .6 * tw) * night
      * (1. - uHaze * .93) * smoothstep(.22, .6, y) * (1. - dens);
  }

  // Matahari: bergerak ikut jam; jingga pudar tanpa silau dalam jerebu; tersorok oleh awan tebal.
  vec2 sp = vec2(aspect * uSunX, .34 + .42 * uSunEl);
  float ds = length(p - sp);
  vec3 sunCol = mix(vec3(1., .97, .86), vec3(1., .62, .36), clamp(uHaze * 1.2 + dusk * .7, 0., 1.));
  float sunVis = smoothstep(-.06, .04, uSunEl) * (1. - uHaze * .5) * (1. - uCloud * uCloud * .7) * (1. - uRain * .9);
  col = mix(col, sunCol, smoothstep(.062, .056, ds) * sunVis);
  col += sunCol * exp(-ds * 6.) * .35 * sunVis * (1. - uHaze * .8);

  // Bulan dengan fasa sebenar (bayang sfera), cahaya bumi pada bahagian gelap.
  vec2 mp = vec2(aspect * .70, .72);
  float R = .05;
  vec2 m = (p - mp) / R;
  float r2 = dot(m, m);
  if (r2 < 1.) {
    float th = uPhase * 6.2831853;
    vec3 N = vec3(m, sqrt(1. - r2));
    vec3 L = vec3(sin(th), 0., -cos(th));
    float lit = smoothstep(-.05, .08, dot(N, L));
    float edge = smoothstep(1., .9, r2);
    vec3 moonCol = mix(vec3(.97, .96, .90), vec3(.96, .74, .52), uHaze);
    float a = (lit * .95 + .14) * edge * night * (1. - uHaze * .45) * (1. - dens * .85);
    col = mix(col, moonCol, a);
  }
  col += vec3(.9, .9, .85) * exp(-length(p - mp) * 10.) * .12 * night * (1. - uHaze * .6) * (.3 + .7 * abs(cos(uPhase * 3.14159)));

  vec3 cloudLit = mix(vec3(.20, .22, .30), vec3(1.), day);
  cloudLit = mix(cloudLit, vec3(1., .80, .66), dusk * .75);
  cloudLit = mix(cloudLit, hz * 1.1, uHaze * .55);
  float shade = smoothstep(.35, .75, fbm(p * vec2(1.1, 2.8) + drift + vec2(.03, .12)));
  vec3 cloudCol = mix(cloudLit, cloudLit * mix(.55, .78, day), shade * .8);
  cloudCol = mix(cloudCol, cloudCol * .62, uRain);
  col = mix(col, cloudCol, dens * .94);

  // Kabus jerebu dekat ufuk.
  float fog = uHaze * smoothstep(.75, 0., y) * (.55 + .45 * fbm(p * 2.5 + vec2(uTime * .02, 0.)));
  col = mix(col, hz * mix(.9, 1.05, day), fog * .75);

  // Hujan.
  if (uRain > 0.) {
    col *= 1. - uRain * .22;
    vec2 q = vec2(p.x * 140. + p.y * 14., p.y * 4. + uTime * 6.5);
    float lane = smoothstep(.5, .1, abs(fract(q.x) - .5));
    float drop = step(.93, hash(vec2(floor(q.x), floor(q.y)))) * lane
      * smoothstep(0., .5, fract(q.y)) * smoothstep(1., .7, fract(q.y));
    col = mix(col, vec3(.86, .90, .96), drop * uRain * .22);
  }

  gl_FragColor = vec4(col, 1.);
}`;
