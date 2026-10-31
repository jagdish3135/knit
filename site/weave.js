// "The team weaves your app": nine agent spools feed warp threads into a loom, and weft rows are
// woven in row by row as you scroll (plan, build, tests, review, ship). On the last rows the cloth
// turns into a real shipped app, woven as a picture. Two instanced tubes draw every thread.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// The nine agents in Knit's real solo runs, in the order work passes through them.
export const SPOOLS = ["manager", "ux-designer", "frontend-dev", "backend-dev", "tester", "debugger", "code-reviewer", "devops", "tech-writer"];
// Who weaves each stage: weft rows take these agents' threads.
export const STAGES = [
  { name: "Plan", agents: ["manager"] },
  { name: "Build", agents: ["frontend-dev", "backend-dev"] },
  { name: "Tests", agents: ["tester"] },
  { name: "Review", agents: ["code-reviewer", "debugger"] },
  { name: "Ship", agents: ["devops", "tech-writer"] },
];
export const WEAVE_END = 0.85;           // progress where the last row is in; after it the picture shows

const W = 10, H = 6.25;                 // cloth size, matches the 16:10 app picture
const WARPS = 54, ROWS = 32;             // 6 warp threads per spool
const PER = WARPS / SPOOLS.length;
const DX = W / WARPS, DY = H / ROWS, AMP = 0.07;
const CLOTH_Y = 0.6;
const LOOM = { w: 10.9, h: 9.3, cy: -0.2 }; // bounds of the whole loom, for fitting
const D = 20, FOV = 30;

const vert = /* glsl */ `
  attribute vec3 aColor;
  varying vec3 vColor; varying vec3 vN; varying vec2 vCloth; varying float vU;
  uniform vec2 uCloth;
  void main(){
    vec4 lp = instanceMatrix * vec4(position,1.);
    vColor = aColor;
    vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vCloth = (lp.xy - uCloth) / vec2(${W.toFixed(2)}, ${H.toFixed(2)}) + .5;
    vU = uv.x;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * lp;
  }`;
const frag = /* glsl */ `
  uniform sampler2D uImage; uniform float uReveal; uniform vec3 uLight; uniform float uTwist;
  varying vec3 vColor; varying vec3 vN; varying vec2 vCloth; varying float vU;
  void main(){
    vec3 n = normalize(gl_FrontFacing ? vN : -vN);
    float diff = .58 + .42 * max(dot(n, normalize(uLight)), 0.);
    float fibre = .92 + .08 * sin(vU * uTwist);
    vec3 pic = texture2D(uImage, clamp(vCloth, 0., 1.)).rgb;
    float inCloth = step(0., vCloth.x) * step(vCloth.x, 1.) * step(0., vCloth.y) * step(vCloth.y, 1.);
    gl_FragColor = vec4(mix(vColor, pic, uReveal * inCloth) * diff * fibre, 1.);
    #include <colorspace_fragment>
  }`;

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const dye = (agent) => new THREE.Color(css(`--dye-${agent}`) || "#8B8577");

function wavyTube(length, cross, along, radius, detail) {
  const pts = [];
  const steps = Math.round(length / cross) * detail;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * length, z = AMP * Math.sin((Math.PI * s) / cross);
    pts.push(along === "x" ? new THREE.Vector3(s, 0, z) : new THREE.Vector3(0, s, -z));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps * 2, radius, detail > 4 ? 6 : 5, false);
}

// Returns a controller once the picture and the spool are loaded. onProgress gets 0..1 from the loader.
export async function createWeave(canvas, opts = {}) {
  const lite = !!opts.lite;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, D);
  const rig = new THREE.Group();
  const loom = new THREE.Group();
  rig.add(loom);
  loom.position.y = -LOOM.cy;
  scene.add(rig);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, done, total) => opts.onProgress?.(done / total);
  const texP = new THREE.TextureLoader(manager).loadAsync(opts.image ?? "media/lexagent.webp");
  const gltfP = new GLTFLoader(manager).loadAsync(opts.model ?? "models/spool.glb").catch((e) => { console.warn("Knit weave: spool model failed", e); return null; });
  const [image, gltf] = await Promise.all([texP, gltfP]);
  image.colorSpace = THREE.SRGBColorSpace;
  image.anisotropy = 4;

  const uniforms = { uImage: { value: image }, uReveal: { value: 0 }, uLight: { value: new THREE.Vector3(-0.4, 0.6, 1) }, uCloth: { value: new THREE.Vector2(0, CLOTH_Y) }, uTwist: { value: 260 } };
  const threadMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, side: THREE.DoubleSide });
  const detail = lite ? 4 : 6;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();

  // Warp: one wavy tube instanced 54 times; odd warps are mirrored so they cross the weft.
  const warpGeo = wavyTube(H + 0.8, DY, "y", 0.074, detail);
  const warp = new THREE.InstancedMesh(warpGeo, threadMat, WARPS);
  const warpColors = new Float32Array(WARPS * 3);
  const warpBase = (i, pull = 0) => {
    v.set(-W / 2 + DX * (i + 0.5), CLOTH_Y - H / 2 - 0.4 - pull, pull * 0.6);
    sc.set(1, 1, i % 2 ? -1 : 1);
    warp.setMatrixAt(i, m.compose(v, q, sc));
  };
  for (let i = 0; i < WARPS; i++) { warpBase(i); dye(SPOOLS[Math.floor(i / PER)]).toArray(warpColors, i * 3); }
  warpGeo.setAttribute("aColor", new THREE.InstancedBufferAttribute(warpColors, 3));
  loom.add(warp);

  // Weft: one tube across the cloth, instanced per row. A row's x-scale is how far the shuttle has
  // carried it, so the newest row grows from left to right.
  const weftGeo = wavyTube(W + 0.2, DX, "x", 0.088, detail);
  const weft = new THREE.InstancedMesh(weftGeo, threadMat, ROWS);
  const weftColors = new Float32Array(ROWS * 3);
  for (let r = 0; r < ROWS; r++) {
    const agents = STAGES[Math.min(STAGES.length - 1, Math.floor((r / ROWS) * STAGES.length))].agents;
    dye(agents[r % agents.length]).toArray(weftColors, r * 3);
  }
  weftGeo.setAttribute("aColor", new THREE.InstancedBufferAttribute(weftColors, 3));
  weft.count = 0;
  loom.add(weft);

  // Feed threads from each spool to its six warps, merged into one mesh.
  const spoolY = CLOTH_Y - H / 2 - 2.3;
  const spoolX = (k) => -W / 2 + (W / SPOOLS.length) * (k + 0.5);
  const feeds = [];
  for (let i = 0; i < WARPS; i++) {
    const k = Math.floor(i / PER);
    const top = new THREE.Vector3(-W / 2 + DX * (i + 0.5), CLOTH_Y - H / 2 - 0.4, 0);
    const from = new THREE.Vector3(spoolX(k), spoolY + 0.62, 0.15);
    const mid = from.clone().lerp(top, 0.55).add(new THREE.Vector3(0, 0, 0.12));
    const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(from, mid, top), lite ? 10 : 20, 0.018, 4, false);
    const c = dye(SPOOLS[k]), cols = new Float32Array(g.attributes.position.count * 3);
    for (let j = 0; j < cols.length; j += 3) c.toArray(cols, j);
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    feeds.push(g);
  }
  loom.add(new THREE.Mesh(mergeGeometries(feeds), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })));

  const wood = new THREE.MeshStandardMaterial({ color: 0x9c6e40, roughness: 0.75 });
  for (const y of [CLOTH_Y + H / 2 + 0.55, CLOTH_Y - H / 2 - 0.5]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, W + 0.9, 20), wood);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0, y, -0.05);
    loom.add(beam);
  }

  // Spools from the Blender model; each spool's wound thread takes its agent's dye.
  const spools = [];
  if (gltf) SPOOLS.forEach((agent, k) => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); if (o.material.name === "Thread") o.material.color = dye(agent); } });
    s.scale.setScalar(0.92);
    s.position.set(spoolX(k), spoolY, 0.15);
    s.rotation.x = 0.18;
    s.userData = { agent, k, baseY: spoolY, tug: 0, vel: 0, spin: k * 0.7 };
    loom.add(s);
    spools.push(s);
  });

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x2a2f55, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-3, 5, 8);
  scene.add(sun);

  const state = { progress: opts.progress ?? 0, px: 0, py: 0, tx: 0, ty: 0, tugs: new Map(), active: true };

  function applyProgress() {
    const rowsF = Math.min(1, state.progress / WEAVE_END) * ROWS;
    weft.count = Math.min(ROWS, Math.ceil(rowsF));
    for (let r = 0; r < weft.count; r++) {
      const grow = Math.min(1, Math.max(0, rowsF - r));
      v.set(-W / 2 - 0.1, CLOTH_Y - H / 2 + DY * (r + 0.5), 0);
      sc.set(Math.max(grow, 0.001), 1, r % 2 ? -1 : 1);
      weft.setMatrixAt(r, m.compose(v, q, sc));
    }
    weft.instanceMatrix.needsUpdate = true;
    uniforms.uReveal.value = THREE.MathUtils.smoothstep(state.progress, WEAVE_END - 0.03, 1);
  }

  // Wide screens: the loom sits in the right 55% beside the copy. Narrow: centred, low on the screen.
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * D * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), visW = visH * camera.aspect;
    if (opts.fit === "center") {
      rig.scale.setScalar(Math.min((visW * 0.96) / LOOM.w, (visH * 0.96) / LOOM.h));
      rig.position.set(0, 0, 0);
    } else if (camera.aspect >= 1.15) {
      // Keep the loom in the band between the fixed nav (top) and the stage pills (bottom), with room
      // for the story's small camera push-in, so short windows never tuck it under either.
      const top = 84, bottom = 72, band = Math.max(0.3, (h - top - bottom) / h);
      const region = visW * 0.55;
      rig.scale.setScalar(Math.min((region * 0.92) / LOOM.w, (visH * band * 0.9) / LOOM.h));
      rig.position.set(visW / 2 - region / 2, visH * (0.5 - (top + (h - top - bottom) / 2) / h), 0);
    } else {
      const bottom = 60;   // the stage pills sit at the bottom edge on narrow screens
      const s = Math.min((visW * 0.94) / LOOM.w, (visH * 0.5) / LOOM.h);
      rig.scale.setScalar(s);
      rig.position.set(0, -visH / 2 + (LOOM.h * s) / 2 + visH * (bottom / h), 0);
    }
  }

  // Draw only when something changed: the pointer is still easing, a spool is springing, or the
  // page moved the progress, the camera or the size. An idle loom costs nothing.
  let last = 0, dirty = true;
  function frame(t = performance.now()) {
    if (!state.active) return false;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    let moving = Math.abs(state.px - state.tx) > 1e-4 || Math.abs(state.py - state.ty) > 1e-4;
    state.tx += (state.px - state.tx) * 0.06;
    state.ty += (state.py - state.ty) * 0.06;
    rig.rotation.y = state.tx * 0.14;
    rig.rotation.x = -0.04 + state.ty * 0.06;
    for (const s of spools) {
      const u = s.userData, want = state.tugs.get(u.agent) ?? 0;
      if (Math.abs(want - u.tug) < 1e-4 && Math.abs(u.vel) < 1e-4) { if (u.pulled) { u.tug = want; } else continue; }
      moving = true;
      u.vel = (u.vel + (want - u.tug) * 0.14) * 0.74;          // springy: overshoots a little, like a tugged thread
      u.tug += u.vel;
      u.spin += dt * Math.abs(u.vel) * 40;
      s.position.y = u.baseY - u.tug * 0.32;
      s.rotation.y = u.spin;
      for (let i = u.k * PER; i < (u.k + 1) * PER; i++) warpBase(i, u.tug * 0.12);
      warp.instanceMatrix.needsUpdate = true;
      u.pulled = Math.abs(u.tug) > 0.001;
    }
    if (!moving && !dirty) return false;
    dirty = false;
    renderer.render(scene, camera);
    return true;
  }

  applyProgress();
  resize();
  frame();

  return {
    renderer, spools,
    setProgress(p) { const n = Math.min(1, Math.max(0, p)); if (n !== state.progress) { state.progress = n; applyProgress(); dirty = true; } },
    pointer(x, y) { state.px = x; state.py = y; },
    tug(agent, amount) { state.tugs.set(agent, amount); },
    dolly(z) { if (camera.position.z !== D * z) { camera.position.z = D * z; dirty = true; } },          // 1 = rest; the scroll story pushes in a little
    set active(a) { state.active = a; if (a) { last = performance.now(); dirty = true; } },
    get active() { return state.active; },
    resize() { resize(); dirty = true; }, frame,
    dispose() { renderer.dispose(); },
  };
}
