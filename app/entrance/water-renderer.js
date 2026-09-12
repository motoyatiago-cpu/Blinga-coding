/** Original WebGL simulation; all resources belong to this page instance. */
export function startWater(root, scope) {
"use strict";
const MAX_DROPS = 12;
const uName = (k) => "u" + k[0].toUpperCase() + k.slice(1);
const GROUPS = [
    { name: "Simulation", items: [
            { k: "resolution", v: 256, t: "s", opts: [128, 256, 512], on: v => rebuildSim(+v) },
            { k: "propagation", v: 0.245, min: 0, max: 0.249, st: 0.001, tgt: "u" },
            { k: "damping", v: 0.996, min: 0.9, max: 1, st: 0.0005, tgt: "u" },
            { k: "edgeWidth", v: 0.045, min: 0, max: 0.2, st: 0.001, tgt: "u" },
            { k: "edgeDamp", v: 0.9, min: 0.5, max: 1, st: 0.005, tgt: "u" },
            { k: "clampH", v: 1.6, min: 0.2, max: 4, st: 0.05, tgt: "u" },
            { k: "simRate", v: 60, min: 20, max: 120, st: 1 },
            { k: "maxSub", v: 4, min: 1, max: 8, st: 1 },
            { k: "paused", v: false, t: "b" },
        ] },
    { name: "Interaction", items: [
            { k: "brushRadius", v: 0.032, min: 0.005, max: 0.15, st: 0.001 },
            { k: "brushBase", v: 0.012, min: 0, max: 0.1, st: 0.001 },
            { k: "brushGain", v: 0.9, min: 0, max: 3, st: 0.01 },
            { k: "brushMax", v: 0.09, min: 0.01, max: 0.4, st: 0.005 },
            { k: "clickStrength", v: 0.22, min: 0, max: 1, st: 0.01 },
            { k: "clickRadius", v: 0.05, min: 0.005, max: 0.2, st: 0.001 },
        ] },
    { name: "Ambient", items: [
            { k: "ambient", v: true, t: "b" },
            { k: "ambientCount", v: 4, min: 0, max: 10, st: 1, on: v => initSources(+v) },
            { k: "ambientStrength", v: 0.018, min: 0, max: 0.1, st: 0.001 },
            { k: "ambientRate", v: 1, min: 0.2, max: 3, st: 0.05 },
            { k: "idle", v: 2.2, min: 0, max: 10, st: 0.1 },
            { k: "drivenMult", v: 0.45, min: 0, max: 1, st: 0.01 },
        ] },
    { name: "Attract", items: [
            { k: "ghost", v: true, t: "b" },
            { k: "ghostReturn", v: 10, min: 0, max: 30, st: 0.5 },
            { k: "ghostFade", v: 1.5, min: 0.1, max: 5, st: 0.1 },
            { k: "ghostSpeed", v: 4, min: 0.1, max: 5, st: 0.05 },
            { k: "ghostGain", v: 2, min: 0, max: 5, st: 0.05 },
        ] },
    { name: "Caustics", items: [
            { k: "causticA", v: 9, min: 0, max: 30, st: 0.1, tgt: "r" },
            { k: "detFloor", v: 0.06, min: 0.005, max: 0.5, st: 0.005, tgt: "r" },
            { k: "clamp1", v: 6, min: 1, max: 20, st: 0.1, tgt: "r" },
            { k: "contrast", v: 1.22, min: 0.5, max: 3, st: 0.01, tgt: "r" },
            { k: "clamp2", v: 8, min: 1, max: 20, st: 0.1, tgt: "r" },
            { k: "floorBase", v: 0.34, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "causticGain", v: 0.3, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "veinThresh", v: 1, min: 0, max: 4, st: 0.01, tgt: "r" },
            { k: "veinGain", v: 0.1, min: 0, max: 1, st: 0.01, tgt: "r" },
            { k: "veinColor", v: [140, 204, 217], t: "c", tgt: "r" },
        ] },
    { name: "Water", items: [
            { k: "baseDepth", v: 1.05, min: 0, max: 3, st: 0.01, tgt: "r" },
            { k: "depthScale", v: 1.4, min: 0, max: 5, st: 0.01, tgt: "r" },
            { k: "depthNoise", v: 2, min: 0, max: 8, st: 0.05, tgt: "r" },
            { k: "depthNoiseAmp", v: 0.25, min: 0, max: 1, st: 0.01, tgt: "r" },
            { k: "absorb", v: [107, 33, 20], t: "c", tgt: "r" },
            { k: "absorbScale", v: 1.7, min: 0, max: 5, st: 0.01, tgt: "r" },
            { k: "deepColor", v: [5, 26, 37], t: "c", tgt: "r" },
            { k: "deepGain", v: 0.3, min: 0, max: 2, st: 0.01, tgt: "r" },
        ] },
    { name: "Refraction", items: [
            { k: "parallax", v: 2.4, min: 0, max: 8, st: 0.05, tgt: "r" },
            { k: "nScale", v: 8.5, min: 0, max: 30, st: 0.1, tgt: "r" },
        ] },
    { name: "Sun", items: [
            { k: "sun1x", v: 0.3, min: -1, max: 1, st: 0.01, tgt: "r" },
            { k: "sun1y", v: 0.45, min: -1, max: 1, st: 0.01, tgt: "r" },
            { k: "sun1z", v: 0.82, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "sun2x", v: -0.5, min: -1, max: 1, st: 0.01, tgt: "r" },
            { k: "sun2y", v: 0.15, min: -1, max: 1, st: 0.01, tgt: "r" },
            { k: "sun2z", v: 0.78, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "spec1", v: 150, min: 1, max: 400, st: 1, tgt: "r" },
            { k: "spec2", v: 70, min: 1, max: 300, st: 1, tgt: "r" },
            { k: "spec2Gain", v: 0.35, min: 0, max: 2, st: 0.01, tgt: "r" },
            { k: "glintGain", v: 0.85, min: 0, max: 3, st: 0.01, tgt: "r" },
            { k: "glintColor", v: [255, 247, 224], t: "c", tgt: "r" },
        ] },
    { name: "Fresnel", items: [
            { k: "fresnelPow", v: 4, min: 0.5, max: 10, st: 0.1, tgt: "r" },
            { k: "fresnelGain", v: 0.22, min: 0, max: 1, st: 0.01, tgt: "r" },
            { k: "skyColor", v: [41, 77, 102], t: "c", tgt: "r" },
        ] },
    { name: "Sand", items: [
            { k: "sandHi", v: [219, 179, 120], t: "c", tgt: "r" },
            { k: "sandLo", v: [158, 117, 77], t: "c", tgt: "r" },
            { k: "rippleScale", v: 6.5, min: 0, max: 20, st: 0.1, tgt: "r" },
            { k: "warpScale", v: 3, min: 0, max: 10, st: 0.1, tgt: "r" },
            { k: "warp", v: 0.6, min: 0, max: 3, st: 0.01, tgt: "r" },
            { k: "bandFreq", v: 9, min: 0, max: 30, st: 0.1, tgt: "r" },
            { k: "bandSkew", v: 4, min: 0, max: 15, st: 0.1, tgt: "r" },
            { k: "bandGain", v: 0.06, min: 0, max: 0.5, st: 0.005, tgt: "r" },
            { k: "grainScale", v: 240, min: 10, max: 600, st: 1, tgt: "r" },
            { k: "grainAmp", v: 0.045, min: 0, max: 0.3, st: 0.005, tgt: "r" },
        ] },
    { name: "Noise", items: [
            { k: "octaves", v: 4, min: 1, max: 8, st: 1, t: "i", tgt: "r" },
            { k: "lacunarity", v: 2.03, min: 1.2, max: 3.5, st: 0.01, tgt: "r" },
            { k: "gain", v: 0.5, min: 0.2, max: 0.9, st: 0.01, tgt: "r" },
        ] },
    { name: "Post", items: [
            { k: "exposure", v: 1.55, min: 0.2, max: 4, st: 0.01, tgt: "r" },
            { k: "grain", v: 0.022, min: 0, max: 0.15, st: 0.001, tgt: "r" },
            { k: "gamma", v: 0.4545, min: 0.2, max: 1.2, st: 0.005, tgt: "r" },
            { k: "vigOuter", v: 1.28, min: 0.5, max: 2.5, st: 0.01, tgt: "r" },
            { k: "vigInner", v: 0.32, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "vigDark", v: 0.6, min: 0, max: 1.5, st: 0.01, tgt: "r" },
            { k: "vigBright", v: 1.05, min: 0.5, max: 2, st: 0.01, tgt: "r" },
        ] },
];
const items = GROUPS.flatMap(g => g.items);
const rItems = items.filter(i => i.tgt === "r");
const uItems = items.filter(i => i.tgt === "u");
const DEF = {}, P = {};
items.forEach(i => { DEF[i.k] = Array.isArray(i.v) ? i.v.slice() : i.v; P[i.k] = DEF[i.k]; });
// ---- boot -----------------------------------------------------------------
const canvas = root.getElementById("c");
const fail = (m) => { const f = root.getElementById("fail"); f.hidden = false; if (m)
    f.textContent = m; };
const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
if (!gl) {
    fail("当前设备不支持水面效果，仍可正常登录。");
    throw 0;
}
scope.onDispose(() => gl.getExtension("WEBGL_lose_context")?.loseContext());
scope.listen(canvas, "webglcontextlost", () => fail("水面效果已暂停，仍可正常登录。"));
if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) {
    fail("水面效果暂不可用，仍可正常登录。");
    throw 0;
}
gl.getExtension("OES_texture_half_float_linear");
// ---- shaders (uniform blocks generated from the table) --------------------
const glslType = (t) => (t === "c" ? "vec3" : t === "i" ? "int" : "float");
const decl = (its) => its.map(i => `uniform ${glslType(i.t)} ${uName(i.k)};`).join("\n");
const VERT = `#version 300 es
out vec2 vUv;
void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`;
const UPDATE = `#version 300 es
precision highp float;
uniform sampler2D uState; uniform vec2 uTexel; uniform float uAspect;
uniform int uDropCount; uniform vec4 uDrops[${MAX_DROPS}];
${decl(uItems)}
in vec2 vUv; out vec4 o;
void main(){
  vec2 uv=vUv; float c=texture(uState,uv).r, p=texture(uState,uv).g;
  float l=texture(uState,uv-vec2(uTexel.x,0.0)).r, r=texture(uState,uv+vec2(uTexel.x,0.0)).r;
  float u=texture(uState,uv+vec2(0.0,uTexel.y)).r, d=texture(uState,uv-vec2(0.0,uTexel.y)).r;
  float nv=(2.0*c-p)+(l+r+u+d-4.0*c)*uPropagation; nv*=uDamping;
  for(int i=0;i<${MAX_DROPS};i++){ if(i>=uDropCount)break;
    vec2 dp=uv-uDrops[i].xy; dp.x*=uAspect; float rr=uDrops[i].w;
    nv+=uDrops[i].z*exp(-dot(dp,dp)/(rr*rr)); }
  vec2 e=min(uv,1.0-uv);
  nv*=mix(uEdgeDamp,1.0,smoothstep(0.0,uEdgeWidth,min(e.x,e.y)));
  o=vec4(clamp(nv,-uClampH,uClampH),c,0.0,1.0);
}`;
const RENDER = `#version 300 es
precision highp float;
uniform sampler2D uState; uniform vec2 uTexel; uniform vec2 uResolution; uniform float uTime; uniform float uAspect;
${decl(rItems)}
in vec2 vUv; out vec4 frag;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<8;i++){ if(i>=uOctaves)break; s+=a*vnoise(p); p*=uLacunarity; a*=uGain; } return s; }
vec3 sand(vec2 uv){ vec2 p=uv*vec2(uAspect,1.0);
  float rip=fbm(p*uRippleScale+fbm(p*uWarpScale)*uWarp);
  float band=0.5+0.5*sin(rip*uBandFreq+p.x*uBandSkew);
  vec3 b=mix(uSandHi,uSandLo,rip); b=mix(b,b*(1.0+uBandGain),band);
  return b+(vnoise(p*uGrainScale)-0.5)*uGrainAmp; }
void main(){
  vec2 uv=vUv,t=uTexel;
  float hc=texture(uState,uv).r;
  float hl=texture(uState,uv-vec2(t.x,0.0)).r, hr=texture(uState,uv+vec2(t.x,0.0)).r;
  float hu=texture(uState,uv+vec2(0.0,t.y)).r, hd=texture(uState,uv-vec2(0.0,t.y)).r;
  float hpp=texture(uState,uv+t).r, hmm=texture(uState,uv-t).r;
  float hpm=texture(uState,uv+vec2(t.x,-t.y)).r, hmp=texture(uState,uv+vec2(-t.x,t.y)).r;
  float hx=(hr-hl)*0.5, hy=(hu-hd)*0.5;
  float hxx=hr-2.0*hc+hl, hyy=hu-2.0*hc+hd, hxy=(hpp-hpm-hmp+hmm)*0.25;
  // caustic = area compression of the refracted-ray map (Jacobian determinant)
  float jxx=1.0-uCausticA*hxx, jyy=1.0-uCausticA*hyy, jxy=-uCausticA*hxy;
  float det=jxx*jyy-jxy*jxy;
  float ca=clamp(1.0/max(abs(det),uDetFloor),0.0,uClamp1);
  ca=clamp(pow(ca,uContrast),0.0,uClamp2);
  vec2 land=uv+vec2(hx,hy)*uParallax;
  vec3 col=sand(land)*(uFloorBase+ca*uCausticGain);
  col+=uVeinColor*max(ca-uVeinThresh,0.0)*uVeinGain;
  float depth=clamp(uBaseDepth-hc*uDepthScale+fbm(land*uDepthNoise)*uDepthNoiseAmp,0.2,3.0);
  col*=exp(-uAbsorb*depth*uAbsorbScale);
  col+=uDeepColor*depth*uDeepGain;
  vec3 N=normalize(vec3(-hx*uNScale,-hy*uNScale,1.0)), V=vec3(0.0,0.0,1.0);
  vec3 s1=normalize(vec3(uSun1x,uSun1y,uSun1z)+vec3(0.0,0.0,1e-4));
  vec3 s2=normalize(vec3(uSun2x,uSun2y,uSun2z)+vec3(0.0,0.0,1e-4));
  float sp=pow(max(dot(N,normalize(s1+V)),0.0),uSpec1)+pow(max(dot(N,normalize(s2+V)),0.0),uSpec2)*uSpec2Gain;
  col+=sp*uGlintColor*uGlintGain;
  col=mix(col,uSkyColor,pow(1.0-N.z,uFresnelPow)*uFresnelGain);
  col*=mix(uVigDark,uVigBright,smoothstep(uVigOuter,uVigInner,length((uv-0.5)*vec2(uAspect,1.0))));
  col=vec3(1.0)-exp(-col*uExposure);
  col+=(hash(uv*uResolution+fract(uTime))-0.5)*uGrain;
  frag=vec4(pow(max(col,vec3(0.0)),vec3(uGamma)),1.0);
}`;
function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
}
function prog(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p) || "link");
    return p;
}
const updateP = prog(VERT, UPDATE), renderP = prog(VERT, RENDER);
function locs(p, its, fixed) {
    const o = {};
    its.forEach(i => o[i.k] = gl.getUniformLocation(p, uName(i.k)));
    fixed.forEach(n => o[n] = gl.getUniformLocation(p, n));
    return o;
}
const uL = locs(updateP, uItems, ["uState", "uTexel", "uAspect", "uDropCount", "uDrops"]);
const rL = locs(renderP, rItems, ["uState", "uTexel", "uResolution", "uTime", "uAspect"]);
function setUniforms(loc, its) {
    for (const i of its) {
        const l = loc[i.k], v = P[i.k];
        if (i.t === "c")
            gl.uniform3f(l, v[0] / 255, v[1] / 255, v[2] / 255);
        else if (i.t === "i")
            gl.uniform1i(l, v | 0);
        else
            gl.uniform1f(l, v);
    }
}
let sim = P.resolution;
function makeTarget(s) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, s, s, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
}
let targets = [makeTarget(sim), makeTarget(sim)], read = 0;
if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    fail("水面效果暂不可用，仍可正常登录。");
    throw 0;
}
function clearTargets() {
    for (const t of targets) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.viewport(0, 0, sim, sim);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
clearTargets();
function rebuildSim(n) {
    if (n === sim)
        return;
    for (const t of targets) {
        gl.deleteFramebuffer(t.fbo);
        gl.deleteTexture(t.tex);
    }
    sim = n;
    targets = [makeTarget(sim), makeTarget(sim)];
    read = 0;
    clearTargets();
}
const vao = gl.createVertexArray();
// ---- sizing ---------------------------------------------------------------
let vw = 1, vh = 1;
function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth;
    vh = innerHeight;
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";
}
resize();
scope.listen(window, "resize", resize);
// ---- drops + ambient sources ----------------------------------------------
const dropData = new Float32Array(MAX_DROPS * 4);
let pending = [];
const queueDrop = (x, y, s, r) => { if (pending.length < MAX_DROPS)
    pending.push([x, y, s, r]); };
function uploadDrops() { const n = Math.min(pending.length, MAX_DROPS); for (let k = 0; k < n; k++)
    dropData.set(pending[k], k * 4); pending = []; return n; }
let sources = [];
function initSources(n) {
    sources = [];
    for (let k = 0; k < n; k++)
        sources.push({
            px: 0.2 + 0.6 * Math.random(), py: 0.2 + 0.6 * Math.random(),
            ax: 0.1 + 0.1 * Math.random(), ay: 0.1 + 0.1 * Math.random(),
            sx: 0.05 + 0.08 * Math.random(), sy: 0.05 + 0.08 * Math.random(),
            phx: Math.random() * 6.28, phy: Math.random() * 6.28,
            next: Math.random() * 1.2, period: 0.7 + Math.random() * 1.1,
        });
}
initSources(P.ambientCount);
const t0 = performance.now();
const now = () => (performance.now() - t0) / 1000;
let px = 0.5, py = 0.5, has = false, lastI = -1e9;
const toUv = (x, y) => [Math.min(Math.max(x / vw, 0), 1), Math.min(Math.max(1 - y / vh, 0), 1)];
scope.listen(canvas, "pointermove", e => {
    const [x, y] = toUv(e.clientX, e.clientY);
    if (has)
        queueDrop(x, y, Math.min(P.brushBase + Math.hypot(x - px, y - py) * P.brushGain, P.brushMax), P.brushRadius);
    px = x;
    py = y;
    has = true;
    lastI = now();
});
scope.listen(canvas, "pointerdown", e => {
    const [x, y] = toUv(e.clientX, e.clientY);
    queueDrop(x, y, P.clickStrength, P.clickRadius);
    px = x;
    py = y;
    has = true;
    lastI = now();
});
scope.listen(canvas, "pointerleave", () => (has = false));
function collectAmbient(t, step) {
    if (!P.ambient)
        return;
    const idle = t - lastI > P.idle;
    for (const s of sources) {
        s.next -= step;
        if (s.next <= 0) {
            s.next = (s.period / Math.max(P.ambientRate, 0.05)) * (0.7 + Math.random() * 0.6);
            const x = Math.min(Math.max(s.px + s.ax * Math.sin(t * s.sx * 6.28 + s.phx), 0.06), 0.94);
            const y = Math.min(Math.max(s.py + s.ay * Math.cos(t * s.sy * 6.28 + s.phy), 0.06), 0.94);
            queueDrop(x, y, P.ambientStrength * (idle ? 1 : P.drivenMult), 0.03 + Math.random() * 0.02);
        }
    }
}
// ---- attract-mode ghost pointer -------------------------------------------
// An invisible cursor that stirs the water before the first real interaction
// (and again after a long idle), using the same brush drops a real pointer
// makes. Path is a sum of incommensurate sines so it drifts without repeating.
let genv = 0, gpx = 0.5, gpy = 0.5, ginit = false;
const TAU = 6.283185307;
function ghostPos(t) {
    const s = P.ghostSpeed;
    const x = 0.5 + 0.30 * Math.sin(t * 0.037 * TAU * s) + 0.12 * Math.sin(t * 0.011 * TAU * s + 1.7);
    const y = 0.5 + 0.28 * Math.cos(t * 0.043 * TAU * s) + 0.13 * Math.cos(t * 0.017 * TAU * s + 4.1);
    return [Math.min(Math.max(x, 0.06), 0.94), Math.min(Math.max(y, 0.06), 0.94)];
}
function collectGhost(t, step) {
    const engaged = P.ghost && t - lastI > P.ghostReturn; // reuses real-interaction timestamp
    const rate = step / Math.max(P.ghostFade, 0.05);
    genv += Math.max(-rate, Math.min(rate, (engaged ? 1 : 0) - genv)); // ease toward target
    const [gx, gy] = ghostPos(t);
    if (!ginit) {
        gpx = gx;
        gpy = gy;
        ginit = true;
    }
    if (genv > 0.001) {
        const dist = Math.hypot(gx - gpx, gy - gpy);
        const mag = Math.min(P.brushBase + dist * P.brushGain, P.brushMax) * genv * P.ghostGain;
        if (mag > 1e-4)
            queueDrop(gx, gy, mag, P.brushRadius);
    }
    gpx = gx;
    gpy = gy;
}
// ---- loop -----------------------------------------------------------------
function simStep(step) {
    collectAmbient(now(), step);
    collectGhost(now(), step);
    const cnt = uploadDrops();
    const src = targets[read], dst = targets[read ^ 1];
    gl.useProgram(updateP);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, sim, sim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(uL.uState, 0);
    gl.uniform2f(uL.uTexel, 1 / sim, 1 / sim);
    gl.uniform1f(uL.uAspect, vw / vh);
    gl.uniform1i(uL.uDropCount, cnt);
    gl.uniform4fv(uL.uDrops, dropData);
    setUniforms(uL, uItems);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    read ^= 1;
}
function render() {
    gl.useProgram(renderP);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
    gl.uniform1i(rL.uState, 0);
    gl.uniform2f(rL.uTexel, 1 / sim, 1 / sim);
    gl.uniform2f(rL.uResolution, canvas.width, canvas.height);
    gl.uniform1f(rL.uTime, now());
    gl.uniform1f(rL.uAspect, vw / vh);
    setUniforms(rL, rItems);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
let last = performance.now(), accum = 0, animationFrameId = 0;
function frame(t) {
    animationFrameId = 0;
    if (document.hidden || gl.isContextLost()) return;
    let dt = (t - last) / 1000;
    if (dt > 0.25)
        dt = 0.25;
    last = t;
    const step = 1 / Math.max(P.simRate, 1);
    if (!P.paused) {
        accum += dt;
        let n = 0;
        while (accum >= step && n < P.maxSub) {
            simStep(step);
            accum -= step;
            n++;
        }
        if (n === 0) {
            simStep(step);
            accum = 0;
        }
    }
    render();
    animationFrameId = scope.frame(frame);
}
if (!document.hidden) animationFrameId = scope.frame(frame);

scope.listen(document, "visibilitychange", () => {
    if (document.hidden) {
        scope.cancelFrame(animationFrameId);
        animationFrameId = 0;
    } else if (!animationFrameId && !gl.isContextLost()) {
        last = performance.now();
        accum = 0;
        animationFrameId = scope.frame(frame);
    }
});

}
