"""
The hero film (42 s): realistic QA screens floating in deep-navy space, in the site's palette.

  1 · opening   a constellation of QA screens
  2 · Foundation test cases pass one by one, the payment retry fails, BUG-142 is raised
  3 · Advanced   API request → SQL check → automated run going green
  4 · project    the five shop screens; payment flags "charged twice", then "retested"
  5 · services   a release pipeline lights up, with the run summary
  6 · ending     the camera pulls back over everything (titles carry the logo)

Screens come from film_ui.py; titles are composited by intro_titles.py.

  /Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_film.py -- <ui-dir> <outdir> [--preview] [--frames a,b]
"""
import bpy, math, os, random, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
UI = os.path.abspath(argv[0] if argv else "3d/out/film-ui")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "3d/out/film")
PREVIEW = "--preview" in argv
FRAMES = [int(f) for f in argv[argv.index("--frames") + 1].split(",")] if "--frames" in argv else None
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
FPS = 30
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, 42 * FPS
F = lambda sec: int(round(sec * FPS)) + 1
random.seed(7)

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1)

def curves_of(obj_or_data):
    ad = obj_or_data.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "fcurves"):
        return list(act.fcurves)
    out = []
    for layer in act.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out += list(bag.fcurves)
    return out

# ---------------------------------------------------------------- panels
PX = 0.004  # metres per design pixel
_mats = {}
def panel_mat(name):
    if name in _mats:
        return _mats[name]
    img = bpy.data.images.load(os.path.join(UI, name + ".png"))
    m = bpy.data.materials.new("ui:" + name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image, tex.interpolation = img, "Cubic"
    em = nt.nodes.new("ShaderNodeEmission")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        m.blend_method = "BLEND"
    _mats[name] = (m, img.size[0] / 2, img.size[1] / 2)  # design px (images are drawn at 2x)
    return _mats[name]

def panel(name, loc, rot=(0, 0, 0), scale=1.0):
    m, w, h = panel_mat(name)
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=(math.pi / 2 + rot[0], rot[1], rot[2]))
    o = bpy.context.active_object
    o.name = name
    o.scale = (w * PX * scale, h * PX * scale, 1)
    o.data.materials.append(m)
    return o

def show(o, spans):
    """Render only within [(start, end), ...] frame spans."""
    o.hide_render = True
    o.keyframe_insert("hide_render", frame=0)
    for a, b in spans:
        o.hide_render = False
        o.keyframe_insert("hide_render", frame=a)
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=b)
    for fc in curves_of(o):
        if fc.data_path == "hide_render":
            for k in fc.keyframe_points:
                k.interpolation = "CONSTANT"

def states(names, loc, times, rot=(0, 0, 0), scale=1.0, until=None):
    """Stacked panels for one screen's states; state i shows from times[i] to times[i+1]."""
    objs = []
    for i, n in enumerate(names):
        o = panel(n, loc, rot, scale)
        a = times[i]
        b = times[i + 1] if i + 1 < len(times) else (until or scene.frame_end + 10)
        show(o, [(a, b)])
        objs.append(o)
    return objs

def drift(objs, amp=0.06, seed=0, rot_amp=0.02):
    """A slow float, so nothing in space is perfectly still."""
    r = random.Random(seed)
    ph, sp = r.uniform(0, 6.28), r.uniform(0.25, 0.45)
    for o in objs:
        base, brot = o.location.copy(), o.rotation_euler.copy()
        for f in range(0, scene.frame_end + 2, 15):
            t = f / FPS
            o.location = base + Vector((0, 0, amp * math.sin(sp * t + ph)))
            o.rotation_euler = (brot.x, brot.y + rot_amp * math.sin(0.7 * sp * t + ph), brot.z + rot_amp * math.sin(sp * t + ph * 0.5))
            o.keyframe_insert("location", frame=f)
            o.keyframe_insert("rotation_euler", frame=f)

def slide_in(o, f0, offset=Vector((0.6, -0.4, -0.3)), dur=18):
    """Arrive from an offset with an ease (applied on top of drift by a parent empty)."""
    e = bpy.data.objects.new(o.name + ":in", None)
    scene.collection.objects.link(e)
    o.parent = e
    e.location = offset
    e.keyframe_insert("location", frame=f0)
    e.location = (0, 0, 0)
    e.keyframe_insert("location", frame=f0 + dur)
    for fc in curves_of(e):
        for k in fc.keyframe_points:
            k.interpolation, k.easing = "EXPO", "EASE_OUT"

# ---------------------------------------------------------------- the chapters, laid out along x
END = scene.frame_end + 10
everything = []

# 1 · opening constellation (x≈0)
c1 = [panel("cases_0", (-1.2, 3.0, 1.3), (0, 0, 0.12), 0.9), panel("api", (2.6, 5.5, -0.9), (0, 0, -0.15)),
      panel("shop_search", (4.8, 1.8, 1.0), (0, 0, -0.25)), panel("summary", (0.8, 8.5, -1.9), (0, 0, 0.05)),
      panel("pipe_3", (3.2, 11.0, 2.4), (0, 0, -0.1)), panel("shop_order", (-3.6, 9.0, -1.4), (0, 0, 0.3)),
      panel("sql", (7.4, 7.5, 1.9), (0, 0, -0.35), 0.8)]
for i, o in enumerate(c1):
    drift([o], seed=i)

# 2 · Foundation (x≈30): cases pass row by row, the retry fails, the bug is raised
X2 = 30.0
tc = [F(5.0), F(6.3), F(7.1), F(7.9), F(8.7), F(9.6), F(10.3)]
cases = states([f"cases_{i}" for i in range(7)], (X2, 0, 0.2), tc, (0, 0, 0.18))
drift(cases, seed=11)
bug = panel("bug", (X2 + 2.4, -1.4, -0.9), (0, 0, -0.12), 0.95)
show(bug, [(F(10.4), END)])
slide_in(bug, F(10.4))
drift([bug], seed=12)
for i, (n, loc) in enumerate((("shop_cart", (X2 - 3.5, 7, 1.8)), ("api", (X2 + 5.5, 9, 2.4)), ("summary", (X2 + 1.5, 12, -2.6)))):
    drift([panel(n, loc, (0, 0, 0.2 - 0.2 * i), 0.9)], seed=20 + i)

# 3 · Advanced (x≈60): API, then the SQL check, then the automated run
X3 = 60.0
api = panel("api", (X3 - 2.6, 1.2, 0.9), (0, 0, 0.32))
sql = panel("sql", (X3 + 0.4, -0.6, -1.0), (0, 0, 0.1), 0.9)
runs = states([f"run_{i}" for i in range(7)], (X3 + 3.6, 0.4, 0.6), [F(13.0), F(16.2), F(16.8), F(17.4), F(18.0), F(18.6), F(19.3)], (0, 0, -0.2))
drift([api], seed=31); drift([sql], seed=32); drift(runs, seed=33)
for i, (n, loc) in enumerate((("pipe_2", (X3 - 1, 10, 3.2)), ("cases_6", (X3 + 7, 9, -2.2)))):
    drift([panel(n, loc, (0, 0, -0.1 + 0.2 * i), 0.9)], seed=40 + i)

# 4 · the project (x≈90): five shop screens in a gentle arc; payment fails, then passes
X4 = 90.0
T_STOP, T_GO = 22.4, 27.4
shop = []
for i, n in enumerate(["shop_search", "shop_product", "shop_cart", None, "shop_order"]):
    loc = (X4 - 6.0 + i * 3.0, 0.9 * abs(i - 3) ** 1.2, 0.15 * math.sin(i))
    rot = (0, 0, 0.14 * (i - 3))
    if n:
        shop.append(panel(n, loc, rot))
    else:
        pay = states(["shop_pay_0", "shop_pay_1", "shop_pay_2"], loc, [F(21.0), F(T_STOP), F(T_GO)], rot)
for j, o in enumerate(shop):
    drift([o], seed=50 + j, amp=0.04)
drift(pay, seed=55, amp=0.04)
drift([panel("bug", (X4 + 5.2, 5.0, 2.2), (0, 0, -0.3), 0.8)], seed=56)

# 5 · services (x≈120): the release pipeline, then the summary
X5 = 120.0
pipes = states([f"pipe_{i}" for i in range(6)], (X5 + 0.6, 0, 0.9), [F(30.0), F(31.0), F(31.9), F(32.8), F(33.7), F(34.6)], (0, 0, 0.12))
summ = panel("summary", (X5 + 2.8, -1.2, -1.3), (0, 0, -0.16), 0.95)
show(summ, [(F(35.0), END)])
slide_in(summ, F(35.0), Vector((0.5, -0.3, -0.5)))
drift(pipes, seed=61); drift([summ], seed=62)
for i, (n, loc) in enumerate((("run_6", (X5 - 4, 8, 2.5)), ("shop_order", (X5 + 6.5, 9, -1.5)), ("cases_6", (X5 + 2, 13, 3.0)))):
    drift([panel(n, loc, (0, 0, 0.15 - 0.15 * i), 0.85)], seed=70 + i)

# 6 · ending (x≈150): a curved wall of every screen, for the camera to pull back from
X6 = 150.0
wall = ["cases_6", "api", "shop_search", "run_6", "bug", "pipe_5", "sql", "shop_pay_2", "summary", "shop_cart", "cases_3", "shop_order",
        "pipe_2", "shop_product", "run_3"]
for i, n in enumerate(wall):
    col, row = i % 5, i // 5
    ang = (col - 2) * 0.26
    loc = (X6 + 9.0 * math.sin(ang), 9.0 * (1 - math.cos(ang)) + random.uniform(-0.6, 0.6), (1 - row) * 3.0 + random.uniform(-0.3, 0.3))
    drift([panel(n, loc, (0, 0, -ang), 0.82)], seed=90 + i, amp=0.05)

# dust: tiny glints that turn into soft bokeh with depth of field
dust_m = bpy.data.materials.new("dust")
dust_m.use_nodes = True
dn = dust_m.node_tree.nodes
dn.remove(dn["Principled BSDF"])
em = dn.new("ShaderNodeEmission")
em.inputs["Color"].default_value = srgb("#6EA8FF")
em.inputs["Strength"].default_value = 2.2
dust_m.node_tree.links.new(em.outputs[0], dn["Material Output"].inputs["Surface"])
for i in range(260):
    x = random.uniform(-14, 166)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.012, 0.03),
                                          location=(x, random.uniform(-4, 22), random.uniform(-6, 7)))
    bpy.context.active_object.data.materials.append(dust_m)

# ---------------------------------------------------------------- camera: six shots joined by cuts, with depth of field
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.sensor_width = 36
cam.data.dof.use_dof = True
cam.data.dof.aperture_fstop = 2.2
cam.data.clip_end = 400
target = bpy.data.objects.new("look", None)
scene.collection.objects.link(target)
tr = cam.constraints.new("TRACK_TO")
tr.target, tr.track_axis, tr.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
focus = bpy.data.objects.new("focus", None)
scene.collection.objects.link(focus)
cam.data.dof.focus_object = focus

# backdrop rides with the camera, far behind everything
bg_m, bw, bh = panel_mat("backdrop")
bpy.ops.mesh.primitive_plane_add(size=1)
bg = bpy.context.active_object
bg.data.materials.append(bg_m)
bg.parent = cam
bg.location = (0, 0, -150)
bg.scale = (270, 152, 1)  # covers the widest lens (28 mm) at 150 m, with room for lens shift

def view(look, dist, side=0.0, up=0.6):
    """Camera aimed at a subject from `dist` metres in front (−y), nudged sideways/up."""
    l = Vector(look)
    return (tuple(l + Vector((side, -dist, up))), tuple(l))

SH = -0.15  # lens shift: subject sits right of centre, the left third is for the titles
SHOTS = [
    # f0, f1, (eye0, look0), (eye1, look1), focus0, focus1, lens0, lens1, shift
    (F(0), F(5) - 1, view((2.0, 5.5, 0.3), 13.0, -1.0, 0.8), view((2.0, 5.5, 0.2), 11.0, 0.6, 0.5), (1.0, 4.0, 0.0), (1.4, 4.5, 0.0), 34, 34, SH),
    (F(5), F(13) - 1, view((X2 + 1.0, -0.5, -0.2), 9.4, -0.8, 0.8), view((X2 + 1.2, -0.6, -0.3), 7.8, 0.6, 0.4), (X2, 0, 0.2), (X2 + 2.4, -1.4, -0.9), 34, 34, SH),
    (F(13), F(21) - 1, view((X3 + 1.0, 0.4, 0.2), 9.4, -0.6, 0.6), view((X3 + 2.4, 0.3, 0.2), 8.4, 0.8, 0.4), (X3 - 2.6, 1.2, 0.9), (X3 + 3.6, 0.4, 0.6), 34, 34, SH),
    (F(21), F(30) - 1, view((X4 + 0.2, 0.8, 0.1), 10.5, -1.2, 1.0), view((X4 + 2.2, 0.6, 0.0), 7.2, 0.4, 0.6), (X4 + 0.0, 0.9, 0.0), (X4 + 3.0, 0.9, 0.0), 34, 34, SH),
    (F(30), F(37) - 1, view((X5 + 1.4, -0.4, 0.4), 9.2, -0.8, 0.8), view((X5 + 1.6, -0.5, 0.2), 8.2, 0.6, 0.4), (X5 + 0.6, 0, 0.9), (X5 + 2.8, -1.2, -1.3), 34, 34, SH),
    (F(37), F(42), view((X6, 1.0, 0.4), 6.0, 0.0, 0.2), view((X6 - 0.6, 2.0, 0.6), 14.0, -1.6, 1.0), (X6, 0.5, 0.3), (X6, 1.5, 0.3), 34, 34, -0.22),
]
for i, (f0, f1, (e0, l0), (e1, l1), fo0, fo1, n0, n1, sh) in enumerate(SHOTS):
    for fr, e, l, fo, n in ((f0, e0, l0, fo0, n0), (f1, e1, l1, fo1, n1)):
        cam.location, target.location, focus.location = e, l, fo
        cam.data.lens, cam.data.shift_x = n, sh
        cam.keyframe_insert("location", frame=fr)
        target.keyframe_insert("location", frame=fr)
        focus.keyframe_insert("location", frame=fr)
        cam.data.keyframe_insert("lens", frame=fr)
        cam.data.keyframe_insert("shift_x", frame=fr)
for ob in (cam, target, focus, cam.data):
    for fc in curves_of(ob):
        for i, k in enumerate(fc.keyframe_points):
            k.interpolation = "BEZIER" if i % 2 == 0 else "CONSTANT"
        fc.update()

# ---------------------------------------------------------------- render
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#071427")
scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.view_transform = "Standard"
try:
    scene.eevee.taa_render_samples = 16 if PREVIEW else 48
except Exception:
    pass
scene.render.resolution_x, scene.render.resolution_y = (960, 540) if PREVIEW else (1920, 1080)
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 15
scene.render.filepath = os.path.join(OUT, "f")
if FRAMES:
    for fr in FRAMES:
        scene.frame_set(fr)
        scene.render.filepath = os.path.join(OUT, f"still_{fr:04d}.png")
        bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print("FILM DONE")
