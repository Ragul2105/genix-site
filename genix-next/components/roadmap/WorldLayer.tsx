"use client";
/*
 * The world around the route: everything that makes the archipelago feel like a place rather than a diagram.
 *
 *   below   · a sea of clouds, cloud skirts hugging each island, data-falls (waterfalls of 0s and 1s) pouring into it
 *   around  · satellite islets (turbines, server huts, dishes, masts), crystals and debris under every island
 *   sky     · the release whale (a sky-whale carrying build containers), the "all tests passed" blimp,
 *             striped balloons, paper-plane messages, parcel drones on the route, bird flocks, a warm sun
 *   horizon · distant continents with server spires (modelled in Blender, see 3d/build_archipelago.py)
 */
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Route } from "./RoadmapCanvas";

const MODEL = "/3d/archipelago.glb";
const DRACO = "/draco/";
const SEA_Y = -15;
const FALL_ISLANDS = [1, 3, 6, 8, 11, 14]; // 0-based islands that spill a data-fall

const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* ------------------------------------------------------------------ cloud sea + island skirts (instanced) */
function Clouds({ route, quality }: { route: Route; quality: "high" | "low" }) {
  const sea = useRef<THREE.InstancedMesh>(null);
  const skirt = useRef<THREE.InstancedMesh>(null);
  const clusters = quality === "high" ? 110 : 55;
  const SEA = clusters * 5;
  const SKIRT = route.P.length * 7;
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  // white cumulus; distance tints it blue through the fog, so it recedes naturally
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 1, emissive: "#D9E6F6", emissiveIntensity: 0.12 }), []);
  const skirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 1, emissive: "#E4EDF8", emissiveIntensity: 0.15 }), []);

  useEffect(() => {
    const r = rand(7);
    const d = new THREE.Object3D();
    const s = sea.current;
    if (s) {
      let i = 0;
      for (let c = 0; c < clusters; c++) {
        // scattered banks with open gaps, so you see down through them
        const cx = (r() - 0.5) * 150, cz = -40 + r() * 220, cy = SEA_Y + (r() - 0.5) * 3;
        const big = 1.3 + r() * 2.1;
        for (let k = 0; k < 5; k++) {
          d.position.set(cx + (r() - 0.5) * big * 2.2, cy + r() * big * 0.35, cz + (r() - 0.5) * big * 1.6);
          const sc = big * (0.55 + r() * 0.6);
          d.scale.set(sc, sc * 0.5, sc);
          d.rotation.set(0, r() * 6, 0);
          d.updateMatrix();
          s.setMatrixAt(i++, d.matrix);
        }
      }
      s.instanceMatrix.needsUpdate = true;
    }
    const k2 = skirt.current;
    if (k2) {
      let i = 0;
      route.P.forEach((p) => {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2 + r() * 0.5;
          const R = 2.15 + r() * 0.45;
          d.position.set(p.x + Math.cos(a) * R, p.y - 0.42 - r() * 0.2, p.z + Math.sin(a) * R);
          const sc = 0.3 + r() * 0.3;
          d.scale.set(sc * 1.3, sc * 0.75, sc);
          d.rotation.set(0, -a, 0);
          d.updateMatrix();
          k2.setMatrixAt(i++, d.matrix);
        }
      });
      k2.instanceMatrix.needsUpdate = true;
    }
  }, [route, clusters]);

  useFrame(({ clock }) => {
    if (sea.current) sea.current.position.set(Math.sin(clock.elapsedTime * 0.03) * 3, Math.sin(clock.elapsedTime * 0.2) * 0.25, 0);
  });

  return (
    <>
      <instancedMesh ref={sea} args={[geo, mat, SEA]} frustumCulled={false} />
      <instancedMesh ref={skirt} args={[geo, skirtMat, SKIRT]} frustumCulled={false} />
    </>
  );
}

/* ------------------------------------------------------------------ data-falls: waterfalls of binary */
function glyphTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.font = "bold 22px ui-monospace, Menlo, monospace";
  g.textAlign = "center";
  const r = rand(3);
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 44; row++) {
      if (r() < 0.35) continue;
      g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
      g.fillText(r() < 0.5 ? "0" : "1", 11 + col * 21, 22 + row * 23);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const fallVert = /* glsl */ `
  varying vec2 vUv; varying float vY;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const fallFrag = /* glsl */ `
  uniform sampler2D uGlyphs; uniform float uTime; uniform float uSea;
  varying vec2 vUv; varying float vY;
  void main() {
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    float sheet = 0.35 + 0.65 * smoothstep(0.35, 1.0, sin(vUv.x * 40.0 + vUv.y * 3.0 - uTime * 2.0) * 0.5 + 0.5);
    vec2 g = vec2(vUv.x, vUv.y * 6.0 + uTime * 0.9);
    float bits = texture2D(uGlyphs, g).r;
    float fadeTop = smoothstep(1.0, 0.97, vUv.y);
    float fadeBottom = smoothstep(uSea - 0.5, uSea + 4.0, vY);
    vec3 col = mix(vec3(0.55, 0.75, 1.0), vec3(1.0), bits) * (0.9 + bits * 1.4);
    float a = edge * fadeTop * fadeBottom * (sheet * 0.38 + bits * 0.75);
    gl_FragColor = vec4(col, a);
  }
`;

function DataFalls({ route }: { route: Route }) {
  const mat = useRef<THREE.ShaderMaterial | null>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const falls = useMemo(() => FALL_ISLANDS.filter((i) => i < route.P.length).map((i) => {
    const p = route.P[i];
    const out = route.right[i].clone().multiplyScalar(-route.side[i]); // far side, away from the path and camera
    const top = p.y + 0.18;
    const h = top - SEA_Y;
    const pos = p.clone().addScaledVector(out, 2.32).setY(top - h / 2);
    const yaw = Math.atan2(out.x, out.z);
    return { key: i, pos, yaw, h, mist: new THREE.Vector3(pos.x, SEA_Y + 0.8, pos.z) };
  }), [route]);
  const mist = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,.95)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  // one shader shared by every fall, so a single uniform update animates them all
  useEffect(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: fallVert, fragmentShader: fallFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uGlyphs: { value: glyphTexture() }, uTime: { value: 0 }, uSea: { value: SEA_Y } },
    });
    meshes.current.forEach((mesh) => { if (mesh) mesh.material = m; });
    mat.current = m;
    return () => m.dispose();
  }, [falls]);
  useFrame((_, dt) => { if (mat.current) mat.current.uniforms.uTime.value += dt; });

  return (
    <>
      {falls.map((f, k) => (
        <group key={f.key} position={f.pos} rotation-y={f.yaw}>
          <mesh ref={(m) => { meshes.current[k] = m; }}>
            <planeGeometry args={[1.05, f.h, 1, 1]} />
          </mesh>
        </group>
      ))}
      {falls.map((f) => (
        <sprite key={`m${f.key}`} position={f.mist} scale={[5, 2.4, 1]}>
          <spriteMaterial map={mist} transparent depthWrite={false} opacity={0.85} fog={false} />
        </sprite>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ sun glow on the horizon */
function Sun() {
  const g = useRef<THREE.Group>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const r = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, "rgba(255,248,232,1)");
    r.addColorStop(0.12, "rgba(255,238,205,.9)");
    r.addColorStop(0.4, "rgba(255,226,180,.25)");
    r.addColorStop(1, "rgba(255,226,180,0)");
    x.fillStyle = r;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(x.canvas);
  }, []);
  const dir = useMemo(() => new THREE.Vector3(0.42, 0.16, 1).normalize(), []);
  useFrame(({ camera }) => g.current?.position.copy(camera.position).addScaledVector(dir, 170));
  return (
    <group ref={g}>
      <sprite scale={[70, 70, 1]} renderOrder={-1}>
        <spriteMaterial map={tex} transparent depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ birds */
function Birds({ route }: { route: Route }) {
  const group = useRef<THREE.Group>(null);
  const flocks = useRef<{ g: THREE.Group; wings: [THREE.Mesh, THREE.Mesh][]; c: THREE.Vector3; r: number; s: number; ph: number }[]>([]);
  useEffect(() => {
    const root = group.current;
    if (!root) return;
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.09, 0, 0, -0.09, 0.42, 0.02, -0.02], 3));
    wingGeo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: "#3B4F72", side: THREE.DoubleSide });
    const r = rand(11);
    const n = route.P.length;
    for (let f = 0; f < 5; f++) {
      const g = new THREE.Group();
      const wings: [THREE.Mesh, THREE.Mesh][] = [];
      for (let b = 0; b < 7; b++) {
        const bird = new THREE.Group();
        const l = new THREE.Mesh(wingGeo, mat), rt = new THREE.Mesh(wingGeo, mat);
        rt.scale.x = -1;
        bird.add(l, rt);
        const row = Math.ceil(b / 2), sideV = b % 2 ? 1 : -1;
        bird.position.set(sideV * row * 0.7, (r() - 0.5) * 0.3, -row * 0.8); // V formation, leader in front
        g.add(bird);
        wings.push([l, rt]);
      }
      root.add(g);
      const p = route.P[Math.floor((f / 5) * (n - 1))];
      // flocks fly below the islands, seen from above against the clouds: an altitude cue, never in the lens
      g.scale.setScalar(0.75);
      flocks.current.push({ g, wings, c: new THREE.Vector3(p.x, p.y - 4.5 - r() * 3, p.z), r: 12 + r() * 9, s: 0.05 + r() * 0.04, ph: r() * 6 });
    }
  }, [route]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const f of flocks.current) {
      const a = t * f.s + f.ph;
      f.g.position.set(f.c.x + Math.cos(a) * f.r, f.c.y + Math.sin(a * 2) * 0.6, f.c.z + Math.sin(a) * f.r * 0.7);
      f.g.rotation.set(0, -a + Math.PI, 0); // heading follows the loop
      f.wings.forEach(([l, r], i) => {
        const flap = Math.sin(t * 9 + i * 0.7) * 0.55;
        l.rotation.set(0, 0, flap);
        r.rotation.set(0, 0, -flap);
      });
    }
  });
  return <group ref={group} />;
}

/* ------------------------------------------------------------------ sky traffic + everything named world_* */
function bannerTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.fillStyle = "#FFFFFF";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#2563EB";
  g.fillRect(0, 0, 18, c.height);
  g.fillStyle = "#0B1F3A";
  g.font = "800 72px 'Plus Jakarta Sans', system-ui, sans-serif";
  g.textBaseline = "middle";
  g.fillText("ALL TESTS PASSED", 70, 84);
  g.fillStyle = "#3DD47A";
  g.beginPath();
  g.arc(900, 80, 46, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#FFFFFF";
  g.lineWidth = 14;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(876, 82); g.lineTo(894, 100); g.lineTo(926, 62);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type Mover = (t: number, dt: number) => void;

function Traffic({ route }: { route: Route }) {
  const { scene } = useGLTF(MODEL, DRACO);
  const extra = useRef<THREE.Group>(null);
  const movers = useRef<Mover[]>([]);

  useEffect(() => {
    const get = (n: string) => scene.getObjectByName(n);
    const list: Mover[] = [];
    const root = extra.current!;
    const P = route.P;
    const n = P.length;
    const tmp = new THREE.Vector3();
    const ahead = new THREE.Vector3();

    // anything facing +x can be steered by pointing its wrapper's +z along the direction of travel
    const steerable = (o: THREE.Object3D) => {
      const wrap = new THREE.Group();
      o.position.set(0, 0, 0);
      o.rotation.set(0, -Math.PI / 2, 0);
      wrap.add(o);
      root.add(wrap);
      return wrap;
    };

    // the release whale swims a slow loop under the middle of the route
    const whaleNode = get("world_anim_whale");
    if (whaleNode) {
      const w = steerable(whaleNode);
      w.scale.setScalar(1.25);
      const tail = get("world_anim_whale_tail");
      const props = [get("world_anim_whale_prop_0"), get("world_anim_whale_prop_1")];
      const c = new THREE.Vector3(0, -3.6, 62);
      const at = (a: number, v: THREE.Vector3) => v.set(c.x + Math.cos(a) * 21, c.y + Math.sin(a * 2) * 1.2, c.z + Math.sin(a) * 52);
      list.push((t) => {
        const a = t * 0.045;
        at(a, w.position);
        at(a + 0.02, ahead);
        w.lookAt(ahead);
        w.rotateZ(Math.sin(t * 0.6) * 0.05);
        if (tail) tail.rotation.z = Math.sin(t * 1.4) * 0.22;
        props.forEach((p) => p && (p.rotation.x += 0.4));
      });
    }

    // the blimp circles the start of the route, towing its banner
    const blimpNode = get("world_anim_blimp");
    if (blimpNode) {
      const b = steerable(blimpNode);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 0.82, 24, 1),
        new THREE.MeshBasicMaterial({ map: bannerTexture(), side: THREE.DoubleSide, toneMapped: false }),
      );
      banner.position.set(0, -0.25, -5.4);
      banner.rotation.y = Math.PI / 2;
      b.add(banner);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.6, 4), new THREE.MeshBasicMaterial({ color: "#0B1F3A" }));
      rope.rotation.x = Math.PI / 2;
      rope.position.set(0, -0.15, -2.95);
      b.add(rope);
      const pos = banner.geometry.attributes.position as THREE.BufferAttribute;
      const orig = Float32Array.from(pos.array as Float32Array);
      const c = new THREE.Vector3(P[1].x - 4, P[1].y + 8.5, P[1].z - 2);
      const at = (a: number, v: THREE.Vector3) => v.set(c.x + Math.cos(a) * 17, c.y + Math.sin(a * 3) * 0.4, c.z + Math.sin(a) * 13);
      list.push((t) => {
        const a = t * 0.07;
        at(a, b.position);
        at(a + 0.02, ahead);
        b.lookAt(ahead);
        for (let i = 0; i < pos.count; i++) {
          const x = orig[i * 3];
          pos.array[i * 3 + 2] = orig[i * 3 + 2] + Math.sin(x * 1.6 + t * 4) * 0.08 * ((x + 2.6) / 5.2);
        }
        pos.needsUpdate = true;
      });
    }

    // striped balloons rise and drift beside the route
    [2, 9, 15].forEach((isl, k) => {
      const bal = get(`world_anim_balloon_${k}`);
      if (!bal || isl >= n) return;
      const side = -route.side[isl];
      const base = P[isl].clone().addScaledVector(route.right[isl], side * 7.5).add(new THREE.Vector3(0, 3.5 + k, 0));
      bal.scale.setScalar(1.15);
      list.push((t) => {
        bal.position.set(base.x + Math.sin(t * 0.13 + k) * 1.4, base.y + Math.sin(t * 0.35 + k * 2) * 0.7, base.z + Math.cos(t * 0.11 + k) * 1.4);
        bal.rotation.y = t * 0.08 + k;
      });
    });

    // paper planes: messages looping between neighbouring islands
    const planeTpl = get("world_plane");
    if (planeTpl) {
      planeTpl.visible = false;
      for (let k = 0; k < 7; k++) {
        const pl = steerable(planeTpl.clone());
        pl.children[0].visible = true;
        pl.scale.setScalar(0.85);
        const i0 = Math.min(n - 2, Math.floor((k / 7) * (n - 1)));
        const a = P[i0], bb = P[i0 + 1];
        const pts = [
          a.clone().add(new THREE.Vector3(0, 2.6, 0)),
          a.clone().lerp(bb, 0.5).add(new THREE.Vector3(5, 4.2, 0)),
          bb.clone().add(new THREE.Vector3(0, 2.8, 0)),
          a.clone().lerp(bb, 0.5).add(new THREE.Vector3(-5, 3.4, 0)),
        ];
        const loop = new THREE.CatmullRomCurve3(pts, true, "centripetal");
        const sp = 0.035 + (k % 3) * 0.01;
        list.push((t) => {
          const u = (t * sp + k * 0.37) % 1;
          loop.getPointAt(u, pl.position);
          loop.getPointAt((u + 0.01) % 1, ahead);
          pl.lookAt(ahead);
          pl.rotateZ(Math.sin(t * 1.3 + k) * 0.35); // bank
        });
      }
    }

    // parcel drones fly the route itself: the journey's orders being delivered
    const droneTpl = get("world_drone");
    if (droneTpl) {
      droneTpl.visible = false;
      for (let k = 0; k < 5; k++) {
        const dr = steerable(droneTpl.clone());
        dr.children[0].visible = true;
        dr.scale.setScalar(1.3);
        list.push((t) => {
          const u = (t * 0.006 + k / 5) % 1;
          route.path.getPointAt(u, tmp);
          dr.position.copy(tmp).add(new THREE.Vector3(0, 1.7 + Math.sin(t * 2 + k) * 0.12, 0));
          route.path.getPointAt(Math.min(1, u + 0.004), ahead);
          ahead.y = dr.position.y;
          dr.lookAt(ahead);
        });
      }
    }

    // islets bob; turbines turn; mast and hut lights blink; debris under every island floats
    scene.traverse((o) => {
      if (o.name.startsWith("cloud_")) o.visible = false; // replaced by the cloud sea and island skirts
      if (/^world_islet_\d\d$/.test(o.name)) {
        const y0 = o.position.y, ph = Math.random() * 6;
        list.push((t) => { o.position.y = y0 + Math.sin(t * 0.5 + ph) * 0.18; });
      } else if (o.name.startsWith("world_anim_turbine_")) {
        list.push((_, dt) => { o.rotation.z += dt * 2.2; });
      } else if (o.name.startsWith("world_anim_blink_")) {
        const ph = Math.random() * 6;
        list.push((t) => { o.visible = Math.sin(t * 3 + ph) > 0.3; });
      } else if (/^p\d\d_anim_debris$/.test(o.name)) {
        const y0 = o.position.y, ph = Math.random() * 6;
        list.push((t, dt) => { o.position.y = y0 + Math.sin(t * 0.7 + ph) * 0.12; o.rotation.y += dt * 0.05; });
      }
    });

    movers.current = list;
  }, [scene, route]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    for (const m of movers.current) m(t, d);
  });

  return <group ref={extra} />;
}

export default function WorldLayer({ route, quality }: { route: Route; quality: "high" | "low" }) {
  return (
    <>
      <Sun />
      <Clouds route={route} quality={quality} />
      <DataFalls route={route} />
      <Birds route={route} />
      <Traffic route={route} />
    </>
  );
}
