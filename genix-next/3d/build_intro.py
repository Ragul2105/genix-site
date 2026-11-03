"""
"The Quality Line": the 42-second company intro for the home hero.

E-commerce screens (Search, Product, Cart, Payment, Order) ride a clay conveyor through three QA stations:
a manual-testing gate (Foundation), an automation bay (Advanced) and an end-to-end gate where the line stops
for a payment bug (the project). They leave through the release dock (services). The last shot cranes up to show
the whole line is the Genix "G", and the yellow check draws itself in.

This script renders the 3D only; titles are composited by 3d/intro_titles.py.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_intro.py -- <outdir> [--preview] [--frames a,b,c]
"""
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "3d/out/intro")
PREVIEW = "--preview" in argv
FRAMES = [int(f) for f in argv[argv.index("--frames") + 1].split(",")] if "--frames" in argv else None
FONT = os.path.abspath(os.path.join(os.path.dirname(__file__), "fonts", "jakarta-800.ttf"))
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
FPS, SECONDS = 30, 42
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, FPS * SECONDS

# ---------------------------------------------------------------- materials
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1)

M = {}
def mat(name, hexc, rough=0.6, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(hexc)
    p.inputs["Roughness"].default_value = rough
    if emit:
        p.inputs["Emission Color"].default_value = srgb(emit)
        p.inputs["Emission Strength"].default_value = strength
    M[name] = m
    return m

for n, h, r in (("clay", "#EEF2F8", 0.75), ("ground", "#C9D7EC", 0.95), ("plinth", "#E4EBF6", 0.85), ("navy", "#0B1F3A", 0.5),
                ("blue", "#2563EB", 0.45), ("sky", "#6EA8FF", 0.5), ("yellow", "#FFC83D", 0.45), ("green", "#2DB86A", 0.5),
                ("red", "#F0524F", 0.45), ("paper", "#FFFFFF", 0.9), ("ink", "#4A5B75", 0.6), ("shade", "#DCE3EE", 0.85),
                ("rail", "#C9D6EA", 0.6), ("steel", "#9FB0C8", 0.35)):
    mat(n, h, r)

# belt rubber: navy with cleats that scroll with the belt (offset keyed later)
belt = bpy.data.materials.new("belt")
belt.use_nodes = True
nt = belt.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.7
uv = nt.nodes.new("ShaderNodeUVMap")
mapn = nt.nodes.new("ShaderNodeMapping")
wave = nt.nodes.new("ShaderNodeTexWave")
wave.wave_profile = "SAW"
wave.inputs["Scale"].default_value = 1.0
wave.inputs["Distortion"].default_value = 0.0
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "CONSTANT"
ramp.color_ramp.elements[0].color = srgb("#13294A")
ramp.color_ramp.elements[1].position = 0.86
ramp.color_ramp.elements[1].color = srgb("#2A4470")
nt.links.new(uv.outputs["UV"], mapn.inputs["Vector"])
nt.links.new(mapn.outputs["Vector"], wave.inputs["Vector"])
nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
wave.bands_direction = "X"
M["belt"] = belt
BELT_MAP = mapn

def lamp_mat(name, hexc):
    m = mat(name, hexc, 0.3, emit=hexc, strength=0.0)
    return m

# ---------------------------------------------------------------- helpers
LIB = bpy.data.collections.new("parcel-types")  # not linked: only instanced

def finish(o, m, bevel=0.0, smooth=True, coll=None):
    o.data.materials.clear()
    o.data.materials.append(M[m] if isinstance(m, str) else m)
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    if bevel:
        b = o.modifiers.new("bev", "BEVEL")
        b.width, b.segments, b.limit_method, b.harden_normals = bevel, 3, "ANGLE", True
    if o.type == "MESH":
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)) if smooth else bpy.ops.object.shade_flat()
    if coll is not None:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)
    return o

def box(loc, dims, m, bevel=0.04, rot=(0, 0, 0), coll=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel, coll=coll)

def cyl(loc, r, h, m, verts=32, rot=(0, 0, 0), r2=None, coll=None, bevel=0.01):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m, bevel, coll=coll)

def sph(loc, r, m, coll=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, coll=coll)

def torus(loc, R, r, m, rot=(0, 0, 0), coll=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=48, minor_segments=12)
    return finish(bpy.context.active_object, m, coll=coll)

font = bpy.data.fonts.load(FONT)
def text(body, loc, size, m, rot=(math.pi / 2, 0, 0), align="CENTER", extrude=0.012, coll=None):
    cu = bpy.data.curves.new("t", "FONT")
    cu.body, cu.font, cu.size, cu.align_x, cu.align_y, cu.extrude = body, font, size, align, "CENTER", extrude
    o = bpy.data.objects.new("t:" + body, cu)
    (coll or scene.collection).objects.link(o)
    o.location, o.rotation_euler = loc, rot
    o.data.materials.append(M[m] if isinstance(m, str) else m)
    return o

def key_vis(o, frames_visible):
    """frames_visible: list of (start, end) spans in which the object renders."""
    o.hide_render = True
    o.keyframe_insert("hide_render", frame=0)
    for a, b in frames_visible:
        o.hide_render = False
        o.keyframe_insert("hide_render", frame=a)
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=b)
    for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points:
            k.interpolation = "CONSTANT"

def set_interp(o, kind="LINEAR"):
    ad = o.animation_data
    if not ad or not ad.action:
        return
    act = ad.action
    curves = []
    if hasattr(act, "fcurves"):
        curves = list(act.fcurves)
    else:  # Blender 5 layered actions
        for layer in act.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    curves += list(bag.fcurves)
    for fc in curves:
        for k in fc.keyframe_points:
            if fc.data_path == "hide_render":
                k.interpolation = "CONSTANT"
            elif kind:
                k.interpolation = kind

# ---------------------------------------------------------------- the path: the Genix "G"
R = 10.0
R0 = R * 10 / 28           # inner end of the G's bar
FIL = 2.2                  # corner rounding where the arc meets the bar
def build_path():
    pts = []
    th0, th1 = math.radians(45), 2 * math.pi - FIL / R
    n = 900
    for i in range(n + 1):
        th = th0 + (th1 - th0) * i / n
        pts.append(Vector((R * math.cos(th), R * math.sin(th), 0)))
    a, c, b = pts[-1], Vector((R, 0, 0)), Vector((R - FIL, 0, 0))
    for i in range(1, 41):
        t = i / 40
        pts.append((1 - t) ** 2 * a + 2 * (1 - t) * t * c + t * t * b)
    m = 120
    for i in range(1, m + 1):
        pts.append(b.lerp(Vector((R0, 0, 0)), i / m))
    cum = [0.0]
    for i in range(1, len(pts)):
        cum.append(cum[-1] + (pts[i] - pts[i - 1]).length)
    return pts, cum

PTS, CUM = build_path()
L = CUM[-1]

def at(s):
    """Point and unit tangent at arc length s (linear extrapolation past the ends)."""
    if s <= 0:
        t = (PTS[1] - PTS[0]).normalized()
        return PTS[0] + t * s, t
    if s >= L:
        t = (PTS[-1] - PTS[-2]).normalized()
        return PTS[-1] + t * (s - L), t
    lo, hi = 0, len(CUM) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if CUM[mid] <= s:
            lo = mid
        else:
            hi = mid
    f = (s - CUM[lo]) / (CUM[hi] - CUM[lo])
    p = PTS[lo].lerp(PTS[hi], f)
    t = (PTS[hi] - PTS[lo]).normalized()
    return p, t

def outward(t):
    return Vector((t.y, -t.x, 0))

def yaw(t):
    return math.atan2(t.y, t.x)

# ---------------------------------------------------------------- belt timing: speed with one "stop the line"
V = 1.2
T_STOP, T_GO, EASE = 22.4, 27.4, 0.7
def speed(t):
    def ss(x):
        x = max(0.0, min(1.0, x))
        return x * x * (3 - 2 * x)
    if t < T_STOP - EASE:
        return V
    if t < T_STOP:
        return V * (1 - ss((t - (T_STOP - EASE)) / EASE))
    if t < T_GO:
        return 0.0
    if t < T_GO + EASE:
        return V * ss((t - T_GO) / EASE)
    return V

SUB = 10
PROG = [0.0]  # belt travel at each frame
acc = 0.0
for f in range(1, scene.frame_end + 2):
    for k in range(SUB):
        t = (f - 1 + (k + 0.5) / SUB) / FPS
        acc += speed(t) / FPS / SUB
    PROG.append(acc)
def prog(frame):
    f = max(0, min(len(PROG) - 2, frame))
    i = int(f)
    return PROG[i] + (PROG[i + 1] - PROG[i]) * (f - i)
def frame_at_prog(p):
    for f in range(len(PROG) - 1):
        if PROG[f + 1] >= p:
            return f + (p - PROG[f]) / max(1e-9, PROG[f + 1] - PROG[f])
    return len(PROG) - 1

# ---------------------------------------------------------------- belt geometry
BELT_Z = 0.95     # top surface height
BW, BH = 1.9, 0.38
import bmesh
def sweep(profile, name, m, step=0.12, uv_len=True, s_from=0.0, s_to=None):
    """Sweep a 2D profile [(across, up), ...] (closed) along the path."""
    s_to = L if s_to is None else s_to
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new()
    rings = []
    n = max(2, int((s_to - s_from) / step))
    for i in range(n + 1):
        s = s_from + (s_to - s_from) * i / n
        p, t = at(s)
        o = outward(t)
        rings.append([bm.verts.new(p + o * a + Vector((0, 0, u))) for a, u in profile])
    k = len(profile)
    for i in range(n):
        s0 = s_from + (s_to - s_from) * i / n
        s1 = s_from + (s_to - s_from) * (i + 1) / n
        for j in range(k):
            f = bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][(j + 1) % k], rings[i][(j + 1) % k]))
            for lp, (uu, vv) in zip(f.loops, ((s0, j / k), (s1, j / k), (s1, (j + 1) / k), (s0, (j + 1) / k))):
                lp[uvl].uv = (uu, vv)
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return finish(o, m)

def rrect(w, h, z0, r=0.08, seg=4):
    """Rounded rectangle profile centred across the belt, from z0 to z0+h."""
    pts = []
    corners = [(w / 2 - r, z0 + h - r, 0), (-w / 2 + r, z0 + h - r, 90), (-w / 2 + r, z0 + r, 180), (w / 2 - r, z0 + r, 270)]
    for cx, cz, a0 in corners:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts

sweep(rrect(BW, 0.06, BELT_Z - 0.06, 0.025), "belt-top", "belt")
sweep(rrect(BW + 0.1, BH - 0.06, BELT_Z - BH, 0.06), "belt-body", "clay")
for side in (-1, 1):  # side rails
    sweep([(side * (BW / 2 + 0.02) + a, BELT_Z + u) for a, u in rrect(0.12, 0.22, -0.02, 0.05)], f"rail{side}", "rail")
# legs
s = 1.6
while s < L - 1.0:
    p, t = at(s)
    o = outward(t)
    for side in (-1, 1):
        q = p + o * side * (BW / 2 - 0.12)
        cyl((q.x, q.y, (BELT_Z - BH) / 2), 0.07, BELT_Z - BH, "steel", verts=16)
        cyl((q.x, q.y, 0.03), 0.16, 0.06, "navy", verts=24)
    s += 3.6

# belt scroll: cleats move with the belt (UV x is metres along the path)
for f in range(0, scene.frame_end + 2, 2):
    BELT_MAP.inputs["Location"].default_value[0] = -prog(f)
    BELT_MAP.inputs["Location"].keyframe_insert("default_value", index=0, frame=f)

# ---------------------------------------------------------------- ground and plinth
box((0, 0, -0.05), (400, 400, 0.1), "ground", 0.0)
cyl((0, 0, 0.14), R + 3.6, 0.28, "plinth", verts=128, bevel=0.1)

# ---------------------------------------------------------------- end housings: dispenser (start) and release dock (end)
def housing(s_mid, length, label, colour):
    p, t = at(s_mid)
    yw = yaw(t)
    h = box((p.x, p.y, BELT_Z + 0.55), (length, BW + 0.7, 1.5), "clay", 0.18, rot=(0, 0, yw))
    # coloured band and label on the outward face
    o = outward(t)
    band = box((p.x + o.x * (BW / 2 + 0.36), p.y + o.y * (BW / 2 + 0.36), BELT_Z + 0.95), (length - 0.3, 0.04, 0.36), colour, 0.0, rot=(0, 0, yw))
    lab = text(label, (p.x + o.x * (BW / 2 + 0.39), p.y + o.y * (BW / 2 + 0.39), BELT_Z + 0.95), 0.2,
               "paper" if colour in ("navy", "blue") else "navy", rot=(math.pi / 2, 0, yw))
    return h

housing(0.2, 3.0, "NEW BUILD", "navy")
dock_s = L - 0.4
housing(dock_s, 3.2, "RELEASED", "green")

# ---------------------------------------------------------------- parcel types (collections instanced along the belt)
TYPES = ["Search", "Product", "Cart", "Payment", "Order"]
TOPS = {"Search": "sky", "Product": "blue", "Cart": "sky", "Payment": "yellow", "Order": "blue"}
TW, TT, TH = 1.25, 0.2, 0.92     # tile width, thickness, height
PZ = BELT_Z + 0.06               # pallet bottom

def icon(kind, y, c):
    """Glyph on a tile face at depth y (negative = front)."""
    z = PZ + 0.16 + TH * 0.6
    d = -0.03 if y < 0 else 0.03
    rx = math.pi / 2
    if kind == "Search":
        torus((-0.05, y, z + 0.04), 0.16, 0.045, "navy", rot=(rx, 0, 0), coll=c)
        cyl((0.14, y, z - 0.15), 0.045, 0.22, "navy", rot=(rx, math.radians(45), 0), coll=c)
    elif kind == "Product":
        box((0, y, z + 0.04), (0.5, 0.03, 0.34), "sky", 0.03, coll=c)
        sph((0.1, y + d, z + 0.1), 0.06, "paper", coll=c)
        box((0, y, z - 0.22), (0.46, 0.03, 0.06), "navy", 0.02, coll=c)
    elif kind == "Cart":
        box((0.02, y, z + 0.04), (0.42, 0.03, 0.24), "navy", 0.04, coll=c)
        box((-0.24, y, z + 0.18), (0.14, 0.03, 0.04), "navy", 0.01, coll=c)
        for x in (-0.1, 0.14):
            cyl((x, y + d, z - 0.16), 0.06, 0.03, "navy", rot=(rx, 0, 0), coll=c)
    elif kind == "Payment":
        box((0, y, z), (0.52, 0.03, 0.34), "navy", 0.04, coll=c)
        box((0, y + d, z + 0.06), (0.52, 0.01, 0.07), "yellow", 0.0, coll=c)
        box((-0.13, y + d, z - 0.08), (0.14, 0.01, 0.06), "paper", 0.01, coll=c)
    elif kind == "Order":
        box((0, y, z - 0.02), (0.42, 0.04, 0.36), "yellow", 0.04, coll=c)
        box((0, y + d, z - 0.02), (0.06, 0.01, 0.36), "navy", 0.0, coll=c)
        box((0, y + d, z + 0.08), (0.42, 0.01, 0.05), "navy", 0.0, coll=c)

TYPE_COLL = {}
for kind in TYPES:
    c = bpy.data.collections.new("type-" + kind)
    LIB.children.link(c)
    box((0, 0, PZ + 0.05), (1.45, 1.05, 0.1), "navy", 0.03, coll=c)                       # pallet
    box((0, 0, PZ + 0.1 + TH / 2), (TW, TT, TH), "clay", 0.09, coll=c)                  # the screen tile
    box((0, 0, PZ + 0.1 + TH - 0.07), (TW - 0.12, TT + 0.02, 0.1), TOPS[kind], 0.03, coll=c)  # top bar
    for y, rz in ((-TT / 2 - 0.012, 0), (TT / 2 + 0.012, math.pi)):
        icon(kind, y, c)
        text(kind, (0, y + (-0.002 if y < 0 else 0.002), PZ + 0.1 + 0.2), 0.17, "navy", rot=(math.pi / 2, 0, rz), coll=c)
    TYPE_COLL[kind] = c

# ---------------------------------------------------------------- --tiles: the same clay screens as stand-alone illustrations for the page
if "--tiles" in argv:
    for o in list(scene.collection.objects):
        o.hide_render = True
    def db_stack():
        c = bpy.data.collections.new("db")
        for k, m in enumerate(("navy", "yellow", "navy", "yellow", "navy")):
            cyl((0, 0, 0.18 + k * 0.32), 0.62, 0.3, m, verts=48, bevel=0.05, coll=c)
        sph((0, 0, 0.18 + 5 * 0.32 - 0.14), 0.16, "sky", coll=c)
        return c
    def with_badge(kind):
        c = bpy.data.collections.new(kind + "-badge")
        c.children.link(TYPE_COLL[kind])
        z = PZ + 0.1 + TH - 0.24
        cyl((TW / 2 - 0.22, -TT / 2 - 0.05, z), 0.17, 0.06, "green", verts=24, rot=(math.pi / 2, 0, 0), coll=c)
        for (x, zz, w, a) in ((-0.05, -0.015, 0.11, 45), (0.035, 0.02, 0.21, -55)):
            box((TW / 2 - 0.22 + x, -TT / 2 - 0.09, z + zz), (w, 0.02, 0.04), "paper", 0.008, rot=(0, math.radians(a), 0), coll=c)
        return c
    jobs = [("search", TYPE_COLL["Search"], 0, 2.0), ("cart", TYPE_COLL["Cart"], 0, 2.0), ("payment", TYPE_COLL["Payment"], 0, 2.0),
            ("database", db_stack(), 0.62, 2.5), ("order", with_badge("Order"), 0, 2.0)]
    cam = bpy.data.objects.new("tcam", bpy.data.cameras.new("tcam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 2.5
    sun = bpy.data.objects.new("tsun", bpy.data.lights.new("tsun", "SUN"))
    sun.data.energy, sun.data.angle = 3.2, math.radians(8)
    sun.rotation_euler = (math.radians(40), math.radians(-15), math.radians(-30))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("tw")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#EAF1FB")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 640
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 90
    for name, coll, dz, scale in jobs:
        cam.data.ortho_scale = scale
        e = bpy.data.objects.new("show-" + name, None)
        e.instance_type, e.instance_collection = "COLLECTION", coll
        scene.collection.objects.link(e)
        centre = Vector((0, 0, PZ + 0.55 - dz))
        cam.rotation_euler = (math.radians(68), 0, math.radians(-24))
        cam.location = centre + cam.rotation_euler.to_matrix() @ Vector((0, 0, 20))
        scene.render.filepath = os.path.join(OUT, f"tile-{name}.webp")
        bpy.ops.render.render(write_still=True)
        e.hide_render = True
    print("TILES DONE")
    sys.exit(0)

# ---------------------------------------------------------------- stations
S_GATE1, S_BAY, S_GATE3 = 12.0, 26.0, 40.0

def arch(s, colour):
    p, t = at(s)
    o = outward(t)
    yw = yaw(t)
    span = BW / 2 + 0.45
    q = p - o * span
    box((q.x, q.y, 1.35), (0.46, 0.46, 2.7), "clay", 0.14, rot=(0, 0, yw))
    box((p.x, p.y, 2.85), (0.5, 2 * span + 0.42, 0.42), "clay", 0.16, rot=(0, 0, yw))
    box((p.x, p.y, 2.62), (0.08, 2 * span - 0.3, 0.06), colour, 0.0, rot=(0, 0, yw))   # scan slit
    return p, t, o, yw, span

# 1 · Foundation: manual-testing gate with a hand lens that leans in to look at each screen
p1, t1, o1, yw1, sp1 = arch(S_GATE1, "sky")
LENS_YAW = yw1 + math.pi  # the arm reaches out from the inner post over the belt
lamp1 = lamp_mat("lamp1", "#6EA8FF")
l1 = sph((p1.x + o1.x * (sp1 + 0.0), p1.y + o1.y * (sp1 + 0.0), 3.25), 0.2, lamp1)
lens_pivot = bpy.data.objects.new("lens-pivot", None)
scene.collection.objects.link(lens_pivot)
lp = p1 + t1 * 1.6 + o1 * (-(sp1 + 0.2))
lens_pivot.location = (lp.x, lp.y, 3.0)
lens_pivot.rotation_euler = (0, 0, LENS_YAW)
post = cyl((lp.x, lp.y, 1.5), 0.08, 3.0, "steel", verts=16)
cyl((lp.x, lp.y, 0.05), 0.35, 0.1, "navy")
arm = box((0, 0.9, 0), (0.1, 1.8, 0.1), "steel", 0.03)
arm.parent = lens_pivot
ring = torus((0, 1.95, -0.55), 0.42, 0.07, "yellow", rot=(0, 0, 0))
ring.parent = lens_pivot
glass_m = bpy.data.materials.new("glass")
glass_m.use_nodes = True
gp = glass_m.node_tree.nodes["Principled BSDF"]
gp.inputs["Base Color"].default_value = srgb("#CFE2FF")
gp.inputs["Alpha"].default_value = 0.35
gp.inputs["Roughness"].default_value = 0.1
try:
    glass_m.surface_render_method = "BLENDED"
except Exception:
    pass
M["glass"] = glass_m
glass = cyl((0, 1.95, -0.55), 0.4, 0.03, "glass", verts=48)
glass.parent = ring.parent
hand = cyl((0, 1.95, -0.08), 0.05, 0.5, "navy", verts=12)
hand.parent = lens_pivot

# 2 · Advanced: automation bay with a stamping arm, a database stack and CI/CD lights
pb, tb = at(S_BAY)
ob = outward(tb)
ywb = yaw(tb)
base_pos = pb - ob * 2.4
cyl((base_pos.x, base_pos.y, 0.35), 0.7, 0.7, "navy", verts=48, bevel=0.06)
robot = bpy.data.objects.new("robot-yaw", None)
scene.collection.objects.link(robot)
robot.location = (base_pos.x, base_pos.y, 0.7)
robot.rotation_euler = (0, 0, ywb - math.pi / 2)
shoulder = bpy.data.objects.new("robot-shoulder", None)
scene.collection.objects.link(shoulder)
shoulder.parent = robot
shoulder.location = (0, 0, 0.55)
cyl((0, 0, 0.3), 0.42, 0.55, "blue", verts=32).parent = robot
upper = box((0, 0.0, 1.0), (0.34, 0.34, 2.0), "blue", 0.12)
upper.parent = shoulder
sph((0, 0, 0), 0.3, "navy").parent = shoulder
elbow = bpy.data.objects.new("robot-elbow", None)
scene.collection.objects.link(elbow)
elbow.parent = shoulder
elbow.location = (0, 0, 2.0)
sph((0, 0, 0), 0.26, "navy").parent = elbow
fore = box((0, 0.85, 0), (0.28, 1.7, 0.28), "sky", 0.1)
fore.parent = elbow
head = cyl((0, 1.75, -0.25), 0.2, 0.42, "yellow", verts=24)
head.parent = elbow
stamp = cyl((0, 1.75, -0.5), 0.26, 0.08, "green", verts=24)
stamp.parent = elbow

# database stack and the API pipe feeding the bay
db = pb - ob * 2.6 + tb * 3.2
for k, m in enumerate(("navy", "yellow", "navy", "yellow", "navy")):
    cyl((db.x, db.y, 0.35 + k * 0.32), 0.75, 0.3, m, verts=48, bevel=0.05)
sph((db.x, db.y, 0.35 + 5 * 0.32 - 0.12), 0.18, "sky")
pipe_a = db - tb * 0.0 + ob * 0.75
pipe_b = pb - ob * (BW / 2 + 0.2) + tb * 1.6
mid = (pipe_a + pipe_b) / 2
d = pipe_b - pipe_a
cyl((mid.x, mid.y, 0.55), 0.12, d.length, "sky", verts=20, rot=(math.pi / 2, 0, math.atan2(d.y, d.x) - math.pi / 2))
# CI/CD tower: four lamps that light in order as each build passes
tw = pb - ob * 2.4 - tb * 3.0
cyl((tw.x, tw.y, 1.6), 0.08, 3.2, "steel", verts=16)
cyl((tw.x, tw.y, 0.05), 0.4, 0.1, "navy")
ci_lamps = []
for k in range(4):
    lm = lamp_mat(f"ci{k}", "#2DB86A")
    box((tw.x, tw.y, 1.5 + k * 0.5), (0.5, 0.5, 0.4), "clay", 0.08, rot=(0, 0, ywb))
    ci_lamps.append(sph((tw.x + ob.x * 0.26, tw.y + ob.y * 0.26, 1.5 + k * 0.5), 0.14, lm))

# 3 · The project: end-to-end gate; the line stops for a payment bug
p3, t3, o3, yw3, sp3 = arch(S_GATE3, "yellow")
lamp3 = lamp_mat("lamp3", "#FFC83D")
l3 = sph((p3.x + o3.x * sp3, p3.y + o3.y * sp3, 3.25), 0.24, lamp3)
# ticket board inside the ring, behind the belt
tb3 = p3 - o3 * 3.0 + t3 * 3.4
board_rot = (math.pi / 2, 0, yw3)
box((tb3.x, tb3.y, 1.9), (2.9, 0.16, 1.9), "clay", 0.12, rot=(0, 0, yw3))
for side in (-1, 1):
    q = tb3 + t3 * side * 1.1
    cyl((q.x, q.y, 0.5), 0.07, 1.0, "steel", verts=12)
fo = o3 * 0.1  # face offset toward the belt
text("BUG-142", (tb3.x + fo.x - t3.x * 0.55, tb3.y + fo.y - t3.y * 0.55, 2.45), 0.3, "navy", rot=board_rot)
text("Customer charged twice", (tb3.x + fo.x, tb3.y + fo.y, 1.95), 0.19, "ink", rot=board_rot)
text("after a payment retry", (tb3.x + fo.x, tb3.y + fo.y, 1.68), 0.19, "ink", rot=board_rot)
chip_pos = (tb3.x + fo.x * 1.2, tb3.y + fo.y * 1.2, 1.2)
STATUS = []
for label, colour in (("OPEN", "red"), ("FIXED", "blue"), ("RETESTED", "green")):
    chip = box(chip_pos, (1.5, 0.05, 0.42), colour, 0.06, rot=(0, 0, yw3))
    tx = text(label, (chip_pos[0] + o3.x * 0.04, chip_pos[1] + o3.y * 0.04, 1.2), 0.22, "paper", rot=board_rot)
    STATUS.append((chip, tx))

# ---------------------------------------------------------------- parcels
SP = 3.6
T_DEFECT = (T_STOP + T_GO) / 2
DEFECT_K = 13            # 13 % 5 == 3 → a Payment screen
S0 = S_GATE3 + DEFECT_K * SP - prog(T_DEFECT * FPS)   # place parcel 13 exactly under the gate while the line is stopped
N = int((S0 + prog(scene.frame_end) + 4) / SP) + 2
parcels = []
step = 1 if PREVIEW else 2
for k in range(N):
    kind = TYPES[k % 5]
    e = bpy.data.objects.new(f"parcel{k}", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = TYPE_COLL[kind]
    scene.collection.objects.link(e)
    last_yaw = None
    vis_on = None
    spans = []
    for f in range(0, scene.frame_end + 2, step):
        s = S0 - k * SP + prog(f)
        p, t = at(s)
        y = yaw(t)
        if last_yaw is not None:
            while y - last_yaw > math.pi:
                y -= 2 * math.pi
            while y - last_yaw < -math.pi:
                y += 2 * math.pi
        last_yaw = y
        e.location = p
        e.rotation_euler = (0, 0, y)
        e.keyframe_insert("location", frame=f)
        e.keyframe_insert("rotation_euler", frame=f)
        inside = -1.4 < s < L + 1.2
        if inside and vis_on is None:
            vis_on = f
        if not inside and vis_on is not None:
            spans.append((vis_on, f))
            vis_on = None
    if vis_on is not None:
        spans.append((vis_on, scene.frame_end + 10))
    if not spans:
        bpy.data.objects.remove(e)
        continue
    for a, b in spans:
        e.hide_render = a > 0
        e.keyframe_insert("hide_render", frame=0)
        e.hide_render = False
        e.keyframe_insert("hide_render", frame=max(a, 1))
        e.hide_render = True
        e.keyframe_insert("hide_render", frame=b)
    set_interp(e, "LINEAR")
    parcels.append((k, kind, e))

def pass_frame(k, s_station):
    return frame_at_prog(s_station - (S0 - k * SP))

# ---------------------------------------------------------------- station animation
def key_strength(m, frame, value):
    sock = m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)

def key_emit_colour(m, frame, hexc):
    sock = m.node_tree.nodes["Principled BSDF"].inputs["Emission Color"]
    sock.default_value = srgb(hexc)
    sock.keyframe_insert("default_value", frame=frame)
    base = m.node_tree.nodes["Principled BSDF"].inputs["Base Color"]
    base.default_value = srgb(hexc)
    base.keyframe_insert("default_value", frame=frame)

key_strength(lamp1, 0, 0.4)
key_strength(lamp3, 0, 0.6)
for m in [mm.data.materials[0] for mm in ci_lamps]:
    key_strength(m, 0, 0.0)

lens_pivot.keyframe_insert("rotation_euler", frame=0)
for k, kind, e in parcels:
    f1 = pass_frame(k, S_GATE1)
    if 0 < f1 < scene.frame_end:
        key_strength(lamp1, f1 - 6, 0.4)
        key_strength(lamp1, f1, 2.6)
        key_strength(lamp1, f1 + 10, 0.4)
        # the lens tips toward the screen as it arrives, then settles
        lens_pivot.rotation_euler = (0, 0, LENS_YAW)
        lens_pivot.keyframe_insert("rotation_euler", frame=f1 - 30)
        lens_pivot.rotation_euler = (math.radians(-12), 0, LENS_YAW - math.radians(12))
        lens_pivot.keyframe_insert("rotation_euler", frame=f1 - 4)
        lens_pivot.rotation_euler = (0, 0, LENS_YAW)
        lens_pivot.keyframe_insert("rotation_euler", frame=f1 + 22)
    fb = pass_frame(k, S_BAY)
    if 0 < fb < scene.frame_end:
        # arm swings over the belt and stamps; reach is set so the stamp lands on the tile's top bar
        for fr, sh, el in ((fb - 34, -0.25, 1.9), (fb - 8, 0.55, 1.35), (fb, 0.62, 1.55), (fb + 6, 0.55, 1.35), (fb + 30, -0.25, 1.9)):
            shoulder.rotation_euler = (sh, 0, 0)
            shoulder.keyframe_insert("rotation_euler", frame=fr)
            elbow.rotation_euler = (el - math.pi / 2, 0, 0)
            elbow.keyframe_insert("rotation_euler", frame=fr)
        for j, lm in enumerate(ci_lamps):
            m = lm.data.materials[0]
            key_strength(m, fb + j * 6 - 1, 0.0)
            key_strength(m, fb + j * 6 + 1, 2.4)
            key_strength(m, fb + j * 6 + 40, 0.0)
        # the tile earns its green check
        badge = bpy.data.objects.new(f"badge{k}", None)
        scene.collection.objects.link(badge)
        badge.parent = e
        disc = cyl((0, 0, 0), 0.17, 0.06, "green", verts=24, rot=(math.pi / 2, 0, 0))
        disc.parent = badge
        for (x, z, w, a) in ((-0.05, -0.015, 0.11, 45), (0.035, 0.02, 0.21, -55)):  # a check drawn from two bars
            bar = box((x, -0.04, z), (w, 0.02, 0.04), "paper", 0.008, rot=(0, math.radians(a), 0))
            bar.parent = badge
        badge.location = (TW / 2 - 0.22, -TT / 2 - 0.04, PZ + 0.1 + TH - 0.24)
        badge.scale = (0.001, 0.001, 0.001)
        badge.keyframe_insert("scale", frame=fb)
        badge.scale = (1.2, 1.2, 1.2)
        badge.keyframe_insert("scale", frame=fb + 5)
        badge.scale = (1, 1, 1)
        badge.keyframe_insert("scale", frame=fb + 10)
    f3 = pass_frame(k, S_GATE3)
    if 0 < f3 < scene.frame_end and k != DEFECT_K:
        key_strength(lamp3, f3 - 6, 0.6)
        key_strength(lamp3, f3, 2.4)
        key_strength(lamp3, f3 + 10, 0.6)

# the defect: line stops, lamp turns red, a bug crawls out, ticket goes OPEN → FIXED → RETESTED, lamp turns green
fs, fg = int(T_STOP * FPS), int(T_GO * FPS)
key_emit_colour(lamp3, fs - 30, "#FFC83D")
key_emit_colour(lamp3, fs - 18, "#F0524F")
key_strength(lamp3, fs - 30, 0.6)
key_strength(lamp3, fs - 18, 2.6)
key_emit_colour(lamp3, fg - 30, "#F0524F")
key_emit_colour(lamp3, fg - 22, "#2DB86A")
key_emit_colour(lamp3, fg + 40, "#2DB86A")
key_emit_colour(lamp3, fg + 60, "#FFC83D")
key_strength(lamp3, fg + 40, 2.4)
key_strength(lamp3, fg + 60, 0.6)

defect = [e for k, kind, e in parcels if k == DEFECT_K][0]
bug = bpy.data.objects.new("bug", None)
scene.collection.objects.link(bug)
bug.parent = defect
sph((0, 0, 0), 0.2, "red", scale=(1.25, 1, 0.75)).parent = bug
sph((0.24, 0, 0.04), 0.11, "red").parent = bug
for side in (-1, 1):
    sph((0.31, side * 0.06, 0.1), 0.035, "paper").parent = bug
    sph((0.335, side * 0.06, 0.105), 0.018, "navy").parent = bug
    for j, x in enumerate((-0.12, 0.0, 0.12)):
        leg = cyl((x, side * 0.24, -0.06), 0.022, 0.24, "navy", verts=8, rot=(side * math.radians(60), 0, 0))
        leg.parent = bug
    ant = cyl((0.33, side * 0.09, 0.22), 0.012, 0.2, "navy", verts=6, rot=(0, math.radians(35), side * math.radians(25)))
    ant.parent = bug
top_z = PZ + 0.1 + TH + 0.12
bug.location = (0.0, 0.0, top_z - 0.3)
bug.scale = (0.001, 0.001, 0.001)
bug.keyframe_insert("scale", frame=fs - 16)
bug.keyframe_insert("location", frame=fs - 16)
bug.scale = (1.15, 1.15, 1.15)
bug.location = (0.0, 0.0, top_z + 0.05)
bug.keyframe_insert("scale", frame=fs - 6)
bug.keyframe_insert("location", frame=fs - 6)
bug.scale = (1, 1, 1)
bug.keyframe_insert("scale", frame=fs)
# it scuttles along the top edge while the ticket is open
for i, fr in enumerate(range(fs, fg - 40, 12)):
    bug.location = (0.32 * math.sin(i * 1.3), 0.0, top_z + 0.02 * (i % 2))
    bug.rotation_euler = (0, 0, math.pi if i % 2 else 0)
    bug.keyframe_insert("location", frame=fr)
    bug.keyframe_insert("rotation_euler", frame=fr)
bug.keyframe_insert("scale", frame=fg - 40)
bug.scale = (0.001, 0.001, 0.001)
bug.location = (0.0, 0.0, top_z + 0.5)
bug.keyframe_insert("scale", frame=fg - 30)
bug.keyframe_insert("location", frame=fg - 30)

spans = [(0, fs - 12), (fs - 12, fg - 66), (fg - 66, 99999)]
spans = [(fs - 12, fg - 66), (fg - 66, fg - 30), (fg - 30, 99999)]
for (chip, tx), (a, b) in zip(STATUS, spans):
    for o in (chip, tx):
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=0)
        o.hide_render = False
        o.keyframe_insert("hide_render", frame=a)
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=b)
        set_interp(o, None)

# ---------------------------------------------------------------- the check in the middle of the G (draws itself at the end)
chk = [(25, 39), (34, 48), (50, 27)]
cu = bpy.data.curves.new("check", "CURVE")
cu.dimensions = "3D"
sp = cu.splines.new("POLY")
sp.points.add(len(chk) - 1)
for i, (x, y) in enumerate(chk):
    sp.points[i].co = ((x - 40) / 28 * R, -(y - 40) / 28 * R, 0.62, 1)
prof = bpy.data.curves.new("check-profile", "CURVE")
prof.dimensions = "2D"
pp = prof.splines.new("POLY")
pr = rrect(2.3, 0.5, -0.25, 0.22, 6)
pp.points.add(len(pr) - 1)
for i, (a, u) in enumerate(pr):
    pp.points[i].co = (a, u, 0, 1)
pp.use_cyclic_u = True
prof_ob = bpy.data.objects.new("check-profile", prof)
scene.collection.objects.link(prof_ob)
prof_ob.hide_render = True
cu.bevel_mode = "OBJECT"
cu.bevel_object = prof_ob
cu.use_fill_caps = True
check = bpy.data.objects.new("check", cu)
scene.collection.objects.link(check)
check.data.materials.append(M["yellow"])
T_CHECK = 40.0
cu.bevel_factor_end = 0.0
cu.keyframe_insert("bevel_factor_end", frame=int(T_CHECK * FPS))
cu.bevel_factor_end = 1.0
cu.keyframe_insert("bevel_factor_end", frame=int((T_CHECK + 1.3) * FPS))
check.hide_render = True
check.keyframe_insert("hide_render", frame=0)
check.hide_render = False
check.keyframe_insert("hide_render", frame=int(T_CHECK * FPS) + 1)
set_interp(check, None)

# ---------------------------------------------------------------- camera: one camera, six shots joined by cuts
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
target = bpy.data.objects.new("cam-target", None)
scene.collection.objects.link(target)
tr = cam.constraints.new("TRACK_TO")
tr.target = target
tr.track_axis, tr.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
cam.data.sensor_width = 36

def station_view(s, out, up, along=0.0, look_up=0.9, look_along=0.0, look_in=0.0):
    p, t = at(s)
    o = outward(t)
    eye = p + o * out + t * along + Vector((0, 0, up))
    look = p + t * look_along - o * look_in + Vector((0, 0, look_up))
    return eye, look

def shot(f0, f1, a, b, lens0, lens1=None):
    """Move camera from view a to view b between frames f0..f1; a cut happens at f0."""
    for fr, (eye, look), lens in ((f0, a, lens0), (f1, b, lens1 or lens0)):
        cam.location = eye
        target.location = look
        cam.data.lens = lens
        cam.keyframe_insert("location", frame=fr)
        target.keyframe_insert("location", frame=fr)
        cam.data.keyframe_insert("lens", frame=fr)

F = lambda sec: int(round(sec * FPS))
SHOTS = [
    # 1 · opening: low and close beside the belt, screens sliding past
    (F(0), F(5) - 1, station_view(1.0, 6.2, 3.6, along=5.6, look_up=1.0, look_along=1.2),
                    station_view(1.0, 5.4, 3.0, along=6.4, look_up=1.0, look_along=2.4), 34, 38),
    # 2 · Foundation: the manual-testing gate
    (F(5), F(13) - 1, station_view(S_GATE1, 6.2, 3.0, along=4.4, look_up=1.8, look_along=0.4),
                      station_view(S_GATE1, 5.4, 2.7, along=3.4, look_up=1.8, look_along=0.6), 34),
    # 3 · Advanced: the automation bay
    (F(13), F(21) - 1, station_view(S_BAY, 8.8, 5.2, along=-4.5, look_up=1.4, look_in=1.2),
                       station_view(S_BAY, 8.2, 4.4, along=2.2, look_up=1.4, look_in=1.2), 40),
    # 4 · The project: the line stops for a bug
    (F(21), F(30) - 1, station_view(S_GATE3, 8.0, 3.4, along=-1.0, look_up=1.7, look_along=1.4, look_in=1.4),
                       station_view(S_GATE3, 6.8, 3.0, along=1.6, look_up=1.8, look_along=1.8, look_in=1.4), 36, 40),
    # 5 · Services: the release dock and the line feeding it
    (F(30), F(37) - 1, station_view(L - 3.0, 6.4, 3.4, along=-4.2, look_up=1.0, look_along=1.2),
                       station_view(L - 3.0, 5.6, 3.0, along=-2.4, look_up=1.1, look_along=1.6), 36),
    # 6 · reveal: crane up until the line reads as the G, check draws in
    (F(37), F(40.2), (Vector((13.0, -11.0, 10.0)), Vector((2.5, 0.0, 0.8))),
                     (Vector((-12.0, -0.7, 76.0)), Vector((-12.0, 0.0, 0.0))), 40, 50),
]
SHIFT = [-0.2, -0.16, -0.16, -0.27, -0.24, 0.0]
for i, (f0, f1, a, b, l0, *l1) in enumerate(SHOTS):
    shot(f0, f1, a, b, l0, l1[0] if l1 else None)
    # lens shift keeps the action in the right ~55% so the titles have the left side (the last shot frames itself)
    for fr in (f0, f1):
        cam.data.shift_x = SHIFT[i]
        cam.data.keyframe_insert("shift_x", frame=fr)
# cuts: constant step at each shot start; smooth ease inside a shot
for ob in (cam, target, cam.data):
    ad = ob.animation_data
    act = ad.action
    curves = []
    if hasattr(act, "fcurves"):
        curves = list(act.fcurves)
    else:
        for layer in act.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    curves += list(bag.fcurves)
    for fc in curves:
        pts = fc.keyframe_points
        for i, k in enumerate(pts):
            k.interpolation = "BEZIER" if i % 2 == 0 else "CONSTANT"
            k.easing = "AUTO"
        fc.update()
# last shot eases in and out fully (a crane), others drift with a soft ease
cam.data.dof.use_dof = False

# ---------------------------------------------------------------- light, world, render
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 2.5
sun.data.angle = math.radians(9)
sun.data.color = (1.0, 0.965, 0.92)
sun.rotation_euler = (math.radians(38), math.radians(-12), math.radians(-28))
scene.collection.objects.link(sun)
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#D6E2F3")
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.62

scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
try:
    scene.eevee.taa_render_samples = 24 if PREVIEW else 48
    scene.eevee.use_shadows = True
    scene.eevee.shadow_ray_count = 2
    scene.eevee.use_raytracing = False
    scene.eevee.fast_gi_method = "GLOBAL_ILLUMINATION"
    scene.eevee.use_fast_gi = True
except Exception as ex:
    print("eevee settings:", ex)
scene.render.resolution_x, scene.render.resolution_y = (960, 540) if PREVIEW else (1920, 1080)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 15
scene.render.filepath = os.path.join(OUT, "f")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "intro.blend"))

if FRAMES:
    for fr in FRAMES:
        scene.frame_set(fr)
        scene.render.filepath = os.path.join(OUT, f"still_{fr:04d}.png")
        bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print("DONE", L, N)
