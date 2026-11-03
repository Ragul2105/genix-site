"""
The hero film (42 s): realistic QA screens floating in deep-navy space, in the site's palette.

Seven 6-second chapters, carrying the same information as the client's sample:
  1 · introduction  the two services, QA Training and QA Services, in a constellation of QA screens
  2 · Foundation    the programme card ticks through its five modules; test cases run; BUG-142 is raised
  3 · Advanced      the programme card, with API, SQL, automated run and CI pipeline around it
  4 · project       the eight shop screens, search to order; payment flags "charged twice", then "retested"
  5 · services      manual testing and test automation
  6 · QA support    the five steps from requirements to release, then the run summary
  7 · closing       the camera pulls back over everything (titles carry the logo and the calls to action)

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

# ---------------------------------------------------------------- the chapters (6 s each, as in the client's sample), laid out along x
END = scene.frame_end + 10

# 1 · company introduction (x≈0): the two services up front, a constellation of QA screens behind
intro = [panel("intro_training", (4.8, 0.4, 1.3), (0, 0, 0.12)), panel("intro_services", (5.9, -0.6, -1.0), (0, 0, -0.12))]
slide_in(intro[0], F(0.3), Vector((-0.4, -0.6, 0.5)), 24)
slide_in(intro[1], F(0.8), Vector((0.6, -0.6, -0.5)), 24)
drift([intro[0]], seed=1); drift([intro[1]], seed=2)
for i, (n, loc, rz) in enumerate((("cases_0", (-1.6, 6.0, 2.4), 0.12), ("api", (5.6, 7.5, 2.0), -0.15), ("shop_search", (7.2, 4.2, -1.2), -0.25),
                                  ("summary", (1.8, 9.5, -2.8), 0.05), ("pipe_3", (2.6, 13.0, 3.6), -0.1), ("shop_order", (-3.4, 9.0, -1.6), 0.3))):
    drift([panel(n, loc, (0, 0, rz), 0.85)], seed=3 + i)

# 2 · Foundation (x≈30): the programme card ticks through its modules; test cases run behind; the defect is raised
X2 = 30.0
found = states([f"found_{i}" for i in range(6)], (X2 + 2.2, -0.6, 0.0), [F(6.0), F(6.8), F(7.5), F(8.2), F(8.9), F(9.6)], (0, 0, -0.14))
cases = states([f"cases_{i}" for i in range(7)], (X2 - 1.6, 2.4, 0.9), [F(6.0), F(7.0), F(7.7), F(8.4), F(9.1), F(9.8), F(10.3)], (0, 0, 0.22), 0.9)
bug = panel("bug", (X2 + 4.8, 1.6, -1.6), (0, 0, -0.3), 0.85)
show(bug, [(F(10.4), END)])
slide_in(bug, F(10.4))
drift(found, seed=11); drift(cases, seed=12); drift([bug], seed=13)
for i, (n, loc) in enumerate((("shop_cart", (X2 - 4.5, 8, 2.0)), ("summary", (X2 + 6.5, 11, 2.6)))):
    drift([panel(n, loc, (0, 0, 0.2 - 0.3 * i), 0.85)], seed=20 + i)

# 3 · Advanced (x≈60): the programme card; API, SQL, automation and CI around it
X3 = 60.0
adv = states([f"adv_{i}" for i in range(5)], (X3 + 2.2, -0.6, 0.1), [F(12.0), F(12.8), F(13.6), F(14.4), F(15.2)], (0, 0, -0.14))
api = panel("api", (X3 - 1.6, 2.2, 1.2), (0, 0, 0.26), 0.85)
sql = panel("sql", (X3 - 1.0, 3.2, -1.6), (0, 0, 0.2), 0.8)
runs = states([f"run_{i}" for i in range(7)], (X3 + 5.8, 1.8, 1.0), [F(12.0), F(14.4), F(14.8), F(15.2), F(15.6), F(16.0), F(16.5)], (0, 0, -0.32), 0.8)
pipes = states([f"pipe_{i}" for i in range(6)], (X3 + 4.6, 3.6, -2.2), [F(12.0), F(15.2), F(15.8), F(16.4), F(17.0), F(17.6)], (0, 0, -0.2), 0.75)
drift(adv, seed=31); drift([api], seed=32); drift([sql], seed=33); drift(runs, seed=34); drift(pipes, seed=35)

# 4 · the project (x≈90): eight shop screens in a shallow arc, walked in order; payment fails, then passes
X4 = 90.0
JOURNEY = ["shop_search", "shop_product", "shop_cart", "shop_login", "shop_address", "shop_delivery", None, "shop_order"]
for i, n in enumerate(JOURNEY):
    u = i - 3.5
    loc = (X4 + u * 1.7, 0.1 * u * u, 0.1 * math.sin(i * 1.3) + 0.35)
    rot = (0, 0, 0.04 * u)
    if n:
        drift([panel(n, loc, rot, 0.8)], seed=50 + i, amp=0.04)
    else:
        drift(states(["shop_pay_0", "shop_pay_1", "shop_pay_2"], loc, [F(18.0), F(22.2), F(23.1)], rot, 0.8), seed=50 + i, amp=0.04)

# 5 · offshore testing services (x≈120): manual and automation, with a run and a check behind
X5 = 120.0
man = panel("svc_manual", (X5 + 0.4, -0.2, 0.9), (0, 0, 0.1))
aut = panel("svc_auto", (X5 + 3.4, -1.0, -0.8), (0, 0, -0.12))
slide_in(man, F(24.2), Vector((-0.5, -0.5, 0.4)), 22)
slide_in(aut, F(24.7), Vector((0.6, -0.5, -0.4)), 22)
drift([man], seed=61); drift([aut], seed=62)
for i, (n, loc) in enumerate((("run_6", (X5 - 3.2, 6, 2.4)), ("sql", (X5 + 6.8, 6, 2.2)), ("cases_6", (X5 + 2.0, 10, -2.8)))):
    drift([panel(n, loc, (0, 0, 0.15 - 0.15 * i), 0.85)], seed=70 + i)

# 6 · end-to-end QA support (x≈150): the five steps light up, then the run summary
X6 = 150.0
flow = states([f"flow_{i}" for i in range(6)], (X6 + 2.4, 0, 1.7), [F(30.0), F(30.9), F(31.7), F(32.5), F(33.3), F(34.1)], (0, 0, 0.06))
summ = panel("summary", (X6 + 3.8, -1.2, -1.5), (0, 0, -0.16), 0.9)
show(summ, [(F(34.2), END)])
slide_in(summ, F(34.2), Vector((0.5, -0.3, -0.5)))
drift(flow, seed=81); drift([summ], seed=82)
for i, (n, loc) in enumerate((("bug", (X6 - 3.4, 7, -2.0)), ("pipe_5", (X6 + 6.0, 9, 2.8)))):
    drift([panel(n, loc, (0, 0, 0.15 - 0.3 * i), 0.85)], seed=85 + i)

# 7 · closing (x≈180): a curved wall of every screen, for the camera to pull back from
X7 = 180.0
wall = ["found_5", "api", "shop_search", "run_6", "intro_services", "flow_5", "sql", "shop_pay_2", "adv_4", "shop_cart",
        "intro_training", "shop_order", "svc_manual", "shop_delivery", "svc_auto"]
for i, n in enumerate(wall):
    col, row = i % 5, i // 5
    ang = (col - 2) * 0.26
    loc = (X7 + 9.0 * math.sin(ang), 9.0 * (1 - math.cos(ang)) + random.uniform(-0.6, 0.6), (1 - row) * 3.2 + random.uniform(-0.3, 0.3))
    drift([panel(n, loc, (0, 0, -ang), 0.8)], seed=90 + i, amp=0.05)

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
    x = random.uniform(-14, 196)
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
    # f0, f1, (eye0, look0), (eye1, look1), focus0, focus1, lens, shift_x, shift_y
    (F(0), F(6) - 1, view((5.0, 0.0, 0.1), 11.5, -1.0, 0.9), view((5.0, 0.0, 0.1), 9.0, 0.6, 0.5), (4.8, 0.4, 0.3), (5.4, -0.2, 0), 34, SH, 0),
    (F(6), F(12) - 1, view((X2 + 1.6, 0.4, 0.1), 10.0, -0.8, 0.8), view((X2 + 2.0, 0.2, 0.0), 8.4, 0.6, 0.4), (X2 + 2.2, -0.6, 0), (X2 + 2.4, -0.6, 0), 34, SH, 0),
    (F(12), F(18) - 1, view((X3 + 2.0, 0.4, 0.1), 10.0, -0.6, 0.6), view((X3 + 2.6, 0.3, 0.1), 8.6, 0.8, 0.4), (X3 + 2.2, -0.6, 0.1), (X3 + 2.4, -0.6, 0.1), 34, SH, 0),
    (F(18), F(24) - 1, view((X4 - 7.3, 0.6, 0.3), 7.0, -0.4, 0.4), view((X4 + 9.1, 0.6, 0.3), 7.0, 0.4, 0.4), (X4 - 7.3, 0.9, 0), (X4 + 9.1, 1.2, 0), 34, SH, 0),
    (F(24), F(30) - 1, view((X5 + 2.0, -0.4, 0.1), 10.0, -0.8, 0.8), view((X5 + 2.0, -0.5, 0.0), 8.6, 0.6, 0.4), (X5 + 0.4, -0.2, 0.9), (X5 + 3.4, -1.0, -0.8), 34, SH, 0),
    (F(30), F(36) - 1, view((X6 + 2.4, -0.4, 0.2), 10.6, -0.8, 0.8), view((X6 + 2.6, -0.5, 0.2), 9.6, 0.6, 0.4), (X6 + 2.4, 0, 1.7), (X6 + 3.8, -1.2, -1.5), 34, SH, 0),
    (F(36), F(42), view((X7, 1.0, 0.4), 6.0, 0.0, 0.2), view((X7 - 0.6, 2.0, 0.6), 14.0, -1.6, 1.0), (X7, 0.5, 0.3), (X7, 1.5, 0.3), 34, -0.22, 0),
]
for i, (f0, f1, (e0, l0), (e1, l1), fo0, fo1, n, sh, shy) in enumerate(SHOTS):
    for fr, e, l, fo in ((f0, e0, l0, fo0), (f1, e1, l1, fo1)):
        cam.location, target.location, focus.location = e, l, fo
        cam.data.lens, cam.data.shift_x, cam.data.shift_y = n, sh, shy
        cam.keyframe_insert("location", frame=fr)
        target.keyframe_insert("location", frame=fr)
        focus.keyframe_insert("location", frame=fr)
        cam.data.keyframe_insert("lens", frame=fr)
        cam.data.keyframe_insert("shift_x", frame=fr)
        cam.data.keyframe_insert("shift_y", frame=fr)
for ob in (cam, target, focus, cam.data):
    for fc in curves_of(ob):
        for i, k in enumerate(fc.keyframe_points):
            # cuts between shots; the project shot (the 4th) trucks at an even pace so screens meet the step strip on time
            k.interpolation = "CONSTANT" if i % 2 else ("LINEAR" if i == 6 else "BEZIER")
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
