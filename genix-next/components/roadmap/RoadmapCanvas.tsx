"use client";
/*
 * Release Archipelago: the live 3D scene. The world is modelled in Blender (3d/build_archipelago.py) and loaded
 * as one Draco GLB. Everything that moves is driven here by object name (pNN_anim_*).
 *
 * The parent owns scroll and passes `travel`: a float from -1 (overview) to 17 (part 18), already eased so the
 * camera dwells on each island. This component only damps it and renders.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, Sparkles, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import anchorsJson from "@/public/3d/anchors.json";
import WorldLayer from "./WorldLayer";

const MODEL = "/3d/archipelago.glb";
const DRACO = "/draco/";
const BG = "#E3E9F2";
const UP = new THREE.Vector3(0, 1, 0);
const TOP = 0.25; // island surface height above its anchor (Blender TOP)

type Anchor = { part: number; position: [number, number, number]; rotationY: number };
const anchors = anchorsJson as Anchor[];
export const PARTS = anchors.length;

export type Layout = "wide" | "narrow";
export { MODEL, DRACO, UP, TOP };

/* ------------------------------------------------------------------ route geometry */
function buildRoute(layout: Layout) {
  const P = anchors.map((a) => new THREE.Vector3(...a.position));
  const n = P.length;
  const dir = P.map((_, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).setY(0).normalize());
  const right = dir.map((d) => new THREE.Vector3().crossVectors(d, UP).normalize());
  const side = P.map((_, i) => (i % 2 ? 1 : -1)); // path and camera swing alternate sides for rhythm

  // light path: half-circle around each island's rim (camera side), arched bridges between islands
  const pts: THREE.Vector3[] = [];
  const midIdx: number[] = [];
  const R = 2.05;
  P.forEach((p, i) => {
    const ring = [0, 45, 90, 135, 180].map((deg) => {
      const a = THREE.MathUtils.degToRad(deg);
      return p.clone()
        .addScaledVector(dir[i], -Math.cos(a) * R)
        .addScaledVector(right[i], side[i] * Math.sin(a) * R)
        .setY(p.y + TOP + 0.07);
    });
    if (i > 0) {
      const prev = pts[pts.length - 1];
      pts.push(prev.clone().lerp(ring[0], 0.5).addScaledVector(UP, 1.15));
    }
    ring.forEach((r, k) => {
      if (k === 2) midIdx.push(pts.length);
      pts.push(r);
    });
  });
  const path = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const spaced = path.getSpacedPoints(4000);
  const islandU = midIdx.map((idx) => {
    let best = 0, bd = Infinity;
    spaced.forEach((s, j) => {
      const d = s.distanceToSquared(pts[idx]);
      if (d < bd) { bd = d; best = j; }
    });
    return best / 4000;
  });

  // camera stations: one overview shot, then one per island
  const shift = layout === "wide" ? 0.9 : 0; // island lands in the free centre column, between the index and the card // push the island left of centre on wide screens (card sits right)
  const cams: THREE.Vector3[] = [];
  const looks: THREE.Vector3[] = [];
  const mid = P.slice(0, 6).reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / 6);
  cams.push(P[0].clone().addScaledVector(dir[0], -19).addScaledVector(UP, 17).addScaledVector(right[0], -11));
  looks.push(mid.clone().addScaledVector(right[0], shift * 2).addScaledVector(UP, -3)); // aim low so island 01 clears the strip
  P.forEach((p, i) => {
    // framed so the island sits left of the card with the next islands visible behind it
    // high three-quarter view: steep enough that the previous island (7.4 units back) drops out of frame
    const back = layout === "wide" ? 11 : 13;
    cams.push(p.clone().addScaledVector(dir[i], -back).addScaledVector(UP, layout === "wide" ? 13.5 : 17)
      .addScaledVector(right[i], side[i] * 7.5));
    looks.push(p.clone().addScaledVector(UP, layout === "wide" ? 0.9 : -2.6).addScaledVector(right[i], shift)
      .addScaledVector(dir[i], 1.2));
  });
  return {
    dir,
    right,
    side,
    path,
    islandU,
    cam: new THREE.CatmullRomCurve3(cams, false, "centripetal"),
    look: new THREE.CatmullRomCurve3(looks, false, "centripetal"),
    P,
  };
}
export type Route = ReturnType<typeof buildRoute>;

/* ------------------------------------------------------------------ materials (matched by Blender material name) */
function makeMaterials() {
  const std = (color: string, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
  const glow = (hex: string, k: number) =>
    new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
  const mats: Record<string, THREE.Material> = {
    clay: std("#F2F5FA", 0.78),
    shade: std("#D3DCEA", 0.86),
    rock: std("#AFBDD3", 0.95, { flatShading: true }),
    blue: std("#2563EB", 0.42),
    sky: std("#9CC1FF", 0.55),
    yellow: std("#FFC83D", 0.42),
    navy: std("#0B1F3A", 0.48),
    paper: std("#FFFFFF", 0.9, { side: THREE.DoubleSide }),
    crystal: std("#9CC1FF", 0.18, { emissive: new THREE.Color("#3D7BFF"), emissiveIntensity: 1.6, flatShading: true }),
    mint: std("#C9EBDA", 0.85, { flatShading: true }),
    red: std("#FF6B6B", 0.45),
    green: std("#3DD47A", 0.45),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#DCE9FF", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.26,
      envMapIntensity: 1.8, depthWrite: false, side: THREE.DoubleSide,
    }),
    glow: glow("#4D8BFF", 2.2),
    glowYellow: glow("#FFC83D", 1.9),
  };
  for (const [k, m] of Object.entries(mats)) m.name = k; // later lookups (e.g. CI gates) go by name
  return mats;
}

/* ------------------------------------------------------------------ the world + every island's motion */
type Anim = (t: number, dt: number, active: number) => void;

function World({ activeRef }: { activeRef: MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL, DRACO);
  const anims = useRef<Anim[]>([]);

  useEffect(() => {
    const mats = makeMaterials();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const name = (m.material as THREE.Material).name.replace(/\.\d+$/, "");
      m.material = mats[name] ?? mats.clay;
      let root: THREE.Object3D = m;
      while (root.parent && root.parent !== scene) root = root.parent;
      const see = name !== "glass" && !name.startsWith("glow") && !/^(cloud_|world_far|world_islet)/.test(root.name);
      m.castShadow = see;
      m.receiveShadow = !name.startsWith("glow");
    });

    // horizon continents sit past the fog's far plane: draw them as pale silhouettes instead, beacons still lit
    const farMat = new THREE.MeshLambertMaterial({ color: "#C2D0E7", emissive: "#B3C3DF", emissiveIntensity: 0.35, fog: false });
    const farBeacon = new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFC83D").multiplyScalar(1.6), toneMapped: false, fog: false });
    scene.children.filter((c) => c.name.startsWith("world_far_")).forEach((far) => far.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = (m.material as THREE.Material).name === "glowYellow" ? farBeacon : farMat;
      m.castShadow = m.receiveShadow = false;
    }));

    const get = (n: string) => scene.getObjectByName(n);
    const list: Anim[] = [];
    const base = new Map<THREE.Object3D, { p: THREE.Vector3; r: THREE.Euler; s: THREE.Vector3 }>();
    const keep = (o?: THREE.Object3D) => {
      if (o && !base.has(o)) base.set(o, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });
      return o ? base.get(o)! : null;
    };
    const isActive = (a: number, part: number) => Math.max(0, 1 - Math.abs(a - (part - 1))); // 1 on its island
    const smooth = new Map<string, number>();
    const ease = (key: string, target: number, dt: number, k = 3) => {
      const v = smooth.get(key) ?? 0;
      const nv = v + (target - v) * (1 - Math.exp(-dt * k));
      smooth.set(key, nv);
      return nv;
    };
    const glowClone = (o: THREE.Object3D | undefined, hex: string) => {
      const mats: THREE.MeshBasicMaterial[] = [];
      o?.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), toneMapped: false });
          m.material = mat;
          mats.push(mat);
        }
      });
      return mats;
    };

    // 01 · the ID badge sways on its lanyard
    const badge = get("p01_anim_badge"); const bB = keep(badge);
    if (badge && bB) list.push((t) => { badge.rotation.x = bB.r.x + Math.sin(t * 1.7) * 0.14; });

    // 02 · the app stack breathes; on its own island it explodes apart so you can see every layer
    for (let i = 0; i < 3; i++) {
      const s = get(`p02_anim_slab_${i}`); const b = keep(s);
      if (s && b) list.push((t, dt, a) => {
        const open = ease(`p02${i}`, isActive(a, 2), dt);
        s.position.y = b.p.y + Math.sin(t * 1.3 + i * 1.1) * 0.05 + (i - 1) * open * 0.38 + open * 0.2;
      });
    }

    // 03 · the magnifier sweeps the requirements
    const lens = get("p03_anim_lens"); const bL = keep(lens);
    if (lens && bL) list.push((t) => {
      lens.position.x = bL.p.x + Math.cos(t * 0.7) * 0.38;
      lens.position.z = bL.p.z + Math.sin(t * 0.7) * 0.5;
      lens.position.y = bL.p.y + Math.sin(t * 1.4) * 0.05;
    });

    // 04 · the button gets pressed, then the checkbox ticks
    const btn = get("p04_anim_btn"); const bBtn = keep(btn);
    const tick = get("p04_anim_tick"); const bT = keep(tick);
    if (btn && bBtn && tick && bT) list.push((t) => {
      const c = t % 2.6;
      const press = c < 0.25 ? Math.sin((c / 0.25) * Math.PI) : 0;
      btn.position.z = bBtn.p.z - press * 0.035; // into the screen
      const s = THREE.MathUtils.smoothstep(c, 0.3, 0.6) * (1 - THREE.MathUtils.smoothstep(c, 2.2, 2.5));
      tick.scale.setScalar(Math.max(0.001, s));
    });

    // 05 · the bug scuttles around its dome
    const bug = get("p05_anim_bug"); const bBug = keep(bug);
    if (bug && bBug) list.push((t) => {
      const th = t * 0.9;
      const dx = -Math.sin(th), dz = Math.cos(th);
      bug.position.set(Math.cos(th) * 0.48, bBug.p.y + Math.abs(Math.sin(t * 14)) * 0.012, Math.sin(th) * 0.48);
      bug.rotation.set(0, Math.atan2(-dx, -dz), Math.sin(t * 22) * 0.06);
    });

    // 06 · request goes out, response comes back, server LEDs blink
    const A = get("p06_path_a"), M = get("p06_path_m"), B = get("p06_path_b");
    if (A && M && B) {
      const curve = new THREE.QuadraticBezierCurve3(A.position.clone(), M.position.clone(), B.position.clone());
      for (let k = 0; k < 3; k++) {
        const pk = get(`p06_anim_pkt_${k}`);
        if (pk) list.push((t) => {
          let u = (t * 0.32 + k / 3) % 1;
          if (k === 1) u = 1 - u;
          curve.getPoint(u, pk.position);
          pk.rotation.y = t * 2 + k;
        });
      }
      const leds = [0, 1, 2, 3].map((k) => glowClone(get(`p06_anim_led_${k}`), "#4D8BFF"));
      const on = new THREE.Color("#7FB0FF").multiplyScalar(3), off = new THREE.Color("#1E3A6E");
      list.push((t) => leds.forEach((ms, k) => ms.forEach((m) => m.color.copy(Math.sin(t * 6 + k * 1.7) > 0.2 ? on : off))));
    }

    // 07 · database platters spin at their own speeds
    for (let i = 0; i < 3; i++) {
      const d = get(`p07_anim_disc_${i}`);
      if (d) list.push((_, dt) => { d.rotation.y += dt * (0.35 + i * 0.22) * (i % 2 ? -1 : 1); });
    }

    // 08 · a test cart laps the track; the smoke-test stack puffs
    const cart = get("p08_anim_cart"); const bC = keep(cart);
    if (cart && bC) list.push((t) => {
      const th = t * 0.8;
      const dx = -1.5 * Math.sin(th), dz = 0.95 * Math.cos(th);
      cart.position.set(1.5 * Math.cos(th), bC.p.y, 0.95 * Math.sin(th));
      cart.rotation.y = Math.atan2(-dz, dx);
    });
    for (let k = 0; k < 3; k++) {
      const s = get(`p08_anim_smoke_${k}`); const b = keep(s);
      if (s && b) list.push((t) => {
        const c = (t * 0.45 + k / 3) % 1;
        s.position.y = b.p.y - k * 0.25 + c * 0.9;
        s.scale.setScalar(0.4 + c * 1.1);
        s.visible = c < 0.92;
      });
    }

    // 09 · a ticket moves across the sprint board: To do → In test → Done
    const card = get("p09_anim_card"); const bK = keep(card);
    if (card && bK) list.push((t) => {
      const c = (t * 0.22) % 3;
      const step = Math.floor(c), f = THREE.MathUtils.smoothstep(c - step, 0.55, 1);
      const xs = [bK.p.x, bK.p.x + 0.76, bK.p.x + 1.52];
      card.position.x = step < 2 ? THREE.MathUtils.lerp(xs[step], xs[step + 1], f) : xs[2];
      card.position.z = bK.p.z + Math.sin(f * Math.PI) * 0.1; // lifts off the board while moving
    });

    // 10 · the automation arm works the test blocks
    const yaw = get("p10_anim_yaw"); const bY = keep(yaw);
    const pitch = get("p10_anim_pitch"); const bP = keep(pitch);
    if (yaw && bY && pitch && bP) list.push((t) => {
      yaw.rotation.y = bY.r.y + Math.sin(t * 0.75) * 0.95;
      pitch.rotation.x = bP.r.x + 0.25 + Math.sin(t * 1.5) * 0.35;
    });

    // 11 · commits light up along main, then the branches merge in
    for (let k = 0; k < 9; k++) {
      const node = get(`p11_anim_node_${k}`);
      if (node) list.push((t) => node.scale.setScalar(1 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 2.4 - k * 0.6)), 6)));
    }

    // 12 · builds ride the pipeline; each gate flashes as a build passes
    const boxes = [0, 1, 2, 3].map((k) => get(`p12_anim_box_${k}`));
    const gates = ([["blue", "#2563EB", -1], ["yellow", "#FFC83D", 0], ["green", "#3DD47A", 1]] as const).map(([name, hex, x]) => {
      const g = get(`p12_gate_${name}`);
      const mats: THREE.MeshStandardMaterial[] = [];
      g?.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh && (m.material as THREE.Material).name !== "clay") {
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.emissive = new THREE.Color(hex);
          m.material = mat;
          mats.push(mat);
        }
      });
      return { x, mats };
    });
    if (boxes.every(Boolean)) list.push((t) => {
      const xs = boxes.map((b, k) => {
        const x = -1.9 + (((t * 0.42 + k * 0.95) % 3.8) + 3.8) % 3.8;
        b!.position.x = x;
        b!.visible = x < 1.85;
        return x;
      });
      gates.forEach((g) => {
        const near = Math.max(...xs.map((x) => Math.max(0, 1 - Math.abs(x - g.x) / 0.3)));
        g.mats.forEach((m) => (m.emissiveIntensity = near * 0.9));
      });
    });

    // 13 · the release rocket idles, and lifts off its pad when you reach Production
    const rocket = get("p13_anim_rocket"); const bR = keep(rocket);
    const flame = get("p13_anim_flame"); const bF = keep(flame);
    if (rocket && bR && flame && bF) list.push((t, dt, a) => {
      const lift = ease("p13", isActive(a, 13), dt, 1.6);
      rocket.position.y = bR.p.y + Math.sin(t * 1.6) * 0.04 + lift * 0.75;
      flame.scale.set(1, 0.6 + lift * 1.2 + Math.random() * 0.25, 1);
    });

    // 14 · the lighthouse keeps watch
    const beam = get("p14_anim_beam");
    if (beam) list.push((_, dt) => { beam.rotation.y += dt * 0.9; });

    // 15 · interviewer and candidate take turns
    for (let k = 0; k < 2; k++) {
      const b = get(`p15_anim_bubble_${k}`); const bb = keep(b);
      if (b && bb) list.push((t) => {
        const on = THREE.MathUtils.smoothstep(Math.sin(t * 1.1 + k * Math.PI), -0.1, 0.4);
        b.scale.setScalar(Math.max(0.001, on));
        b.position.y = bb.p.y + Math.sin(t * 1.6 + k) * 0.05;
      });
    }

    // 16 · the simulation dome turns, brighter when you arrive
    const dome = get("p16_anim_dome");
    const domeMats = glowClone(dome, "#4D8BFF");
    if (dome) list.push((_, dt, a) => {
      dome.rotation.y += dt * 0.18;
      const on = ease("p16", isActive(a, 16), dt);
      domeMats.forEach((m) => m.color.setRGB(0.3 * (1 + on * 1.8), 0.55 * (1 + on * 1.8), 1.0 * (1 + on * 1.8)));
    });

    // 17 · the AI core thinks: core turns, rings orbit, bits circle
    const core = get("p17_anim_core");
    if (core) list.push((t, dt) => { core.rotation.y += dt * 0.6; core.rotation.x = Math.sin(t * 0.5) * 0.3; });
    for (let k = 0; k < 2; k++) {
      const r = get(`p17_anim_ring_${k}`);
      if (r) list.push((_, dt) => { r.rotateY(dt * (k ? -0.9 : 0.7)); });
    }
    for (let k = 0; k < 5; k++) {
      const bit = get(`p17_anim_bit_${k}`); const bb = keep(bit);
      if (bit && bb) {
        const r0 = Math.hypot(bb.p.x, bb.p.z), a0 = Math.atan2(bb.p.z, bb.p.x);
        list.push((t) => {
          const a = a0 + t * 0.35;
          bit.position.set(Math.cos(a) * r0, bb.p.y + Math.sin(t * 1.3 + k) * 0.12, Math.sin(a) * r0);
          bit.rotation.set(t * 0.8 + k, t * 0.6, 0);
        });
      }
    }

    // 18 · the flag at the summit flies
    const flag = get("p18_anim_flag") as THREE.Mesh | undefined;
    if (flag?.isMesh) {
      const pos = flag.geometry.attributes.position as THREE.BufferAttribute;
      const orig = Float32Array.from(pos.array as Float32Array);
      let maxX = 0;
      for (let i = 0; i < pos.count; i++) maxX = Math.max(maxX, orig[i * 3]);
      list.push((t) => {
        for (let i = 0; i < pos.count; i++) {
          const x = orig[i * 3];
          const w = Math.max(0, x) / maxX;
          pos.array[i * 3 + 1] = orig[i * 3 + 1] + Math.sin(x * 9 - t * 5) * 0.06 * w;
        }
        pos.needsUpdate = true;
        flag.geometry.computeVertexNormals();
      });
    }

    // clouds drift
    scene.children.filter((c) => c.name.startsWith("cloud_")).forEach((c, k) => {
      const b = keep(c)!;
      list.push((t) => { c.position.x = b.p.x + Math.sin(t * 0.07 + k) * 1.2; c.position.y = b.p.y + Math.sin(t * 0.2 + k) * 0.15; });
    });

    anims.current = list;
  }, [scene]);

  const clock = useRef(0);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    clock.current += d;
    for (const a of anims.current) a(clock.current, d, activeRef.current);
  });

  return <primitive object={scene} />;
}
useGLTF.preload(MODEL, DRACO);

/* ------------------------------------------------------------------ the light path */
const pathVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const pathFrag = /* glsl */ `
  uniform float uProgress; uniform float uTime; uniform float uLength;
  varying vec2 vUv;
  void main() {
    float x = vUv.x;
    float done = step(x, uProgress);
    float d = x * uLength;                                   // world units along the path
    float dash = smoothstep(0.55, 1.0, sin(d * 3.2 - uTime * 7.0));
    vec3 ahead = vec3(0.47, 0.58, 0.78);                       // the road ahead: visible, quiet
    vec3 lit = vec3(0.18, 0.42, 1.0) * 1.7 + dash * vec3(0.55, 0.7, 1.0);
    vec3 col = mix(ahead, lit, done);
    float head = exp(-pow((x - uProgress) * uLength * 0.9, 2.0));
    col = mix(col, vec3(1.0, 0.8, 0.28) * 2.6, head * done);
    float a = mix(0.85, 1.0, done);
    gl_FragColor = vec4(col, a);
  }
`;

function LightPath({ route, uRef }: { route: Route; uRef: MutableRefObject<number> }) {
  const geo = useMemo(() => new THREE.TubeGeometry(route.path, 2400, 0.075, 10, false), [route]);
  const params = useMemo(() => ({
    vertexShader: pathVert, fragmentShader: pathFrag, transparent: true, toneMapped: false,
    uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uLength: { value: route.path.getLength() } },
  }), [route]);
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    mat.current.uniforms.uProgress.value = uRef.current;
  });
  return (
    <mesh geometry={geo}>
      <shaderMaterial key={geo.uuid} ref={mat} args={[params]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ the probe (you) */
function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,214,110,1)");
  r.addColorStop(0.25, "rgba(255,200,61,.55)");
  r.addColorStop(1, "rgba(255,200,61,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Probe({ route, uRef }: { route: Route; uRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const halo = useMemo(() => haloTexture(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    if (!group.current || !ring.current) return;
    route.path.getPointAt(THREE.MathUtils.clamp(uRef.current, 0, 1), tmp);
    group.current.position.copy(tmp).addScaledVector(UP, 0.32 + Math.sin(clock.elapsedTime * 2.2) * 0.06);
    const c = (clock.elapsedTime * 0.8) % 1;
    ring.current.scale.setScalar(0.4 + c * 2.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.8;
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.13, 32, 16]} />
        <meshBasicMaterial color={new THREE.Color("#FFD36E").multiplyScalar(1.6)} toneMapped={false} />
      </mesh>
      <sprite scale={0.95}>
        <spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={-0.28}>
        <ringGeometry args={[0.18, 0.21, 48]} />
        <meshBasicMaterial color="#FFC83D" transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight color="#FFC83D" intensity={1.6} distance={2.4} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ camera + light rig */
function Rig({ route, travelRef, uRef, activeRef }: {
  route: Route; travelRef: MutableRefObject<number>; uRef: MutableRefObject<number>; activeRef: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const cur = useRef(-1); // starts on the overview shot, then eases toward travelRef
  const look = useMemo(() => new THREE.Vector3(), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const focus = useMemo(() => new THREE.Vector3(), []);
  const n = route.P.length;

  useFrame((_, dt) => {
    const target = travelRef.current;
    cur.current += (target - cur.current) * (1 - Math.exp(-Math.min(dt, 0.05) * 3.2));
    const f = cur.current;
    activeRef.current = f;
    const t = THREE.MathUtils.clamp((f + 1) / n, 0, 1);
    route.cam.getPoint(t, camera.position);
    route.look.getPoint(t, look);
    camera.lookAt(look);

    // probe position along the path
    if (f < 0) uRef.current = route.islandU[0] * (f + 1);
    else {
      const k = Math.min(Math.floor(f), n - 2);
      uRef.current = THREE.MathUtils.lerp(route.islandU[k], route.islandU[k + 1], THREE.MathUtils.clamp(f - k, 0, 1));
    }

    // shadows follow whichever island you're on
    const k = THREE.MathUtils.clamp(Math.round(f), 0, n - 1);
    focus.lerp(route.P[k], 1 - Math.exp(-dt * 4));
    if (sun.current) {
      sun.current.position.copy(focus).add(new THREE.Vector3(5, 11, 6));
      sun.current.target.position.copy(focus);
      sun.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <hemisphereLight args={["#FFFFFF", "#9FB0CC", 1.1]} />
      <directionalLight
        ref={sun}
        color="#FFF4E2"
        intensity={3.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
    </>
  );
}

/* ------------------------------------------------------------------ sky: a soft vertical gradient that follows the camera */
const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const skyFrag = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float y = vDir.y;
    vec3 c = y > 0.0 ? mix(uHorizon, uTop, smoothstep(0.0, 0.55, y)) : mix(uHorizon, uBottom, smoothstep(0.0, 0.5, -y));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;
function Sky() {
  const mesh = useRef<THREE.Mesh>(null);
  const params = useMemo(() => ({
    vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color("#C9DBF5") },
      uHorizon: { value: new THREE.Color("#F3EFEA") },
      uBottom: { value: new THREE.Color("#93ACD6") }, // the drop below the clouds
    },
  }), []);
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} renderOrder={-1}>
      <sphereGeometry args={[190, 32, 16]} />
      <shaderMaterial args={[params]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ island plaques: the map's labels, and a way to fly there */
function Plaques({ stop, onSelect, titles }: { stop: number; onSelect: (i: number) => void; titles: string[] }) {
  return (
    <>
      {anchors.map((a, i) => {
        const near = Math.abs(i - Math.max(stop, 0)) <= 2;
        const [x, y, z] = a.position;
        return (
          <Html key={a.part} position={[x, y + (a.part === 18 ? 4.6 : 3.4), z]} center zIndexRange={[20, 0]}
            style={{ pointerEvents: near ? "auto" : "none" }}>
            <button type="button" tabIndex={-1} onClick={() => onSelect(i)}
              className={`rm-plaque${i === stop ? " on" : ""}${near ? "" : " far"}`}>
              <b>{String(a.part).padStart(2, "0")}</b>
              <span>{titles[i]}</span>
            </button>
          </Html>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ finale: confetti at the summit */
function Confetti({ route, activeRef }: { route: Route; activeRef: MutableRefObject<number> }) {
  const COUNT = 160;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useRef<{ live: boolean; t: number; v: THREE.Vector3[]; p: THREE.Vector3[]; r: THREE.Euler[] }>({
    live: false, t: 0, v: [], p: [], r: [],
  });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const summit = route.P[route.P.length - 1];

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const palette = ["#FFC83D", "#2563EB", "#9CC1FF", "#FFFFFF", "#3DD47A"].map((c) => new THREE.Color(c));
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, palette[i % palette.length]);
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const s = state.current;
    const atTop = activeRef.current > 16.75;
    if (atTop && !s.live) {
      s.live = true;
      s.t = 0;
      const origin = summit.clone().add(new THREE.Vector3(0, 3.7, 0));
      s.p = Array.from({ length: COUNT }, () => origin.clone());
      s.v = Array.from({ length: COUNT }, () => {
        const a = Math.random() * Math.PI * 2, up = 3.5 + Math.random() * 3.5, out = 1.2 + Math.random() * 2.4;
        return new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out);
      });
      s.r = Array.from({ length: COUNT }, () => new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    }
    if (!atTop && s.live && activeRef.current < 16.2) s.live = false; // re-arm when you leave the summit
    m.visible = s.live && s.t < 5;
    if (!m.visible) return;
    const d = Math.min(dt, 0.05);
    s.t += d;
    for (let i = 0; i < COUNT; i++) {
      const v = s.v[i];
      v.y -= 4.2 * d;
      v.multiplyScalar(1 - 0.9 * d); // air drag, so it flutters down instead of falling
      s.p[i].addScaledVector(v, d);
      s.r[i].x += d * 6; s.r[i].y += d * 4;
      dummy.position.copy(s.p[i]);
      dummy.rotation.copy(s.r[i]);
      dummy.scale.setScalar(Math.max(0, 1 - Math.max(0, s.t - 3.5) / 1.5));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false} visible={false}>
      <planeGeometry args={[0.12, 0.07]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

/** Mounts only once the model has resolved (it shares World's Suspense boundary). */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

/* ------------------------------------------------------------------ canvas */
export default function RoadmapCanvas({ travelRef, activeRef, layout, running, quality, onReady, stop, onSelect, titles }: {
  stop: number;
  onSelect: (i: number) => void;
  titles: string[];
  travelRef: MutableRefObject<number>;
  activeRef: MutableRefObject<number>;
  layout: Layout;
  running: boolean;
  quality: "high" | "low";
  onReady: () => void;
}) {
  const route = useMemo(() => buildRoute(layout), [layout]);
  const uRef = useRef(0);
  return (
    <Canvas
      shadows
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      frameloop={running ? "always" : "never"}
      camera={{ fov: layout === "wide" ? 34 : 46, near: 0.1, far: 260, position: [10, 14, 20] }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
    >
      <color attach="background" args={[BG]} />
      <Sky />
      <fog attach="fog" args={["#C6D3EA", 20, 80]} /> {/* blue aerial haze: the focused island (~19u) stays crisp */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 4]} scale={[12, 4, 1]} />
        <Lightformer intensity={1.2} position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#CFE0FF" />
        <Lightformer intensity={0.8} position={[6, 1, -4]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#FFE7B0" />
      </Environment>
      <Rig route={route} travelRef={travelRef} uRef={uRef} activeRef={activeRef} />
      <Suspense fallback={null}>
        <World activeRef={activeRef} />
        <WorldLayer route={route} quality={quality} />
        <Ready onReady={onReady} />
      </Suspense>
      <LightPath route={route} uRef={uRef} />
      <Probe route={route} uRef={uRef} />
      <Confetti route={route} activeRef={activeRef} />
      {layout === "wide" && <Plaques stop={stop} onSelect={onSelect} titles={titles} />}
      <Sparkles count={quality === "high" ? 220 : 90} scale={[34, 14, 150]} position={[0, 3, 62]} size={2.4} speed={0.25}
        opacity={0.55} color="#6EA8FF" noise={0.6} />
      {quality === "high" && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.9} intensity={3.2} distanceFalloff={0.8} color="#22396A" halfRes />
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.55} radius={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
