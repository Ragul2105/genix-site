"""
Release Archipelago: 18 floating clay islands, one diorama per curriculum part.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_archipelago.py -- <out_dir> [--render]

Outputs <out_dir>/archipelago.raw.glb (compress with 3d/build.sh), <out_dir>/anchors.json and (with --render) <out_dir>/archipelago-poster.webp.
Objects named pNN_anim_* are animated in the browser (components/roadmap/). Everything else is static and is
merged per material to keep draw calls low.
"""
import bpy, bmesh, json, math, os, random, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "public/3d")
RENDER = "--render" in argv
os.makedirs(OUT, exist_ok=True)
random.seed(142)

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, 1)

MATS = {}
def mat(name, hexc, rough=0.85, metal=0.0, alpha=1.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(hexc)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    if emit:
        p.inputs["Emission Color"].default_value = srgb(hexc)
        p.inputs["Emission Strength"].default_value = emit
    MATS[name] = m
    return m

# Names are the contract with the browser: it swaps these for tuned three.js materials.
mat("clay", "#F3F5F9", 0.9)
mat("shade", "#D9E1EE", 0.95)
mat("rock", "#B9C6DA", 1.0)
mat("blue", "#2563EB", 0.55)
mat("sky", "#9CC1FF", 0.7)
mat("yellow", "#FFC83D", 0.5)
mat("navy", "#0B1F3A", 0.6)
mat("paper", "#FFFFFF", 0.95)
mat("mint", "#CDEBDD", 0.95)
mat("red", "#FF6B6B", 0.55)
mat("green", "#4ADE80", 0.55)
mat("glass", "#BFD6FF", 0.05, alpha=0.28)
mat("glow", "#4D8BFF", 0.3, emit=4.0)
mat("glowYellow", "#FFC83D", 0.3, emit=4.0)

# ---------------------------------------------------------------- primitives
def finish(o, m, bevel=0.0, seg=3, smooth=True, name=None):
    if name:
        o.name = name
        o.data.name = name
    o.data.materials.clear()
    o.data.materials.append(MATS[m])
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    o.select_set(True)
    if bevel:
        b = o.modifiers.new("bev", "BEVEL")
        b.width = bevel
        b.segments = seg
        b.limit_method = "ANGLE"
        b.harden_normals = True
    if smooth:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    else:
        bpy.ops.object.shade_flat()
    BUILD.append(o)
    return o

def box(loc, dims, m, bevel=0.05, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel, name=name)

def cyl(loc, r, h, m, verts=40, bevel=0.03, rot=(0, 0, 0), name=None, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m, bevel, name=name)

def sph(loc, r, m, scale=(1, 1, 1), seg=28, name=None, ico=0):
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=ico, radius=r, location=loc)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, 0, smooth=not ico, name=name)

def tor(loc, R, r, m, rot=(0, 0, 0), name=None, major=48, minor=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=major, minor_segments=minor,
                                     location=loc, rotation=rot)
    return finish(bpy.context.active_object, m, 0, name=name)

def rod(a, b, r, m, verts=16, name=None):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.active_object
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return finish(o, m, 0, name=name)

def tube(points, r, m, name=None, res=16):
    cu = bpy.data.curves.new("tube", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(points) - 1)
    for bp, p in zip(sp.bezier_points, points):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.resolution_u = res
    o = bpy.data.objects.new("tube", cu)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return finish(bpy.context.active_object, m, 0, name=name)

def join(objs, name, pivot=None):
    """Merge parts (keeps their materials). pivot sets the origin, which is what the browser rotates around."""
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    for o in objs:  # bake bevels before joining
        bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    if pivot is not None:
        scene.cursor.location = pivot
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    for ob in objs[1:]:
        if ob in BUILD:
            BUILD.remove(ob)
    return o

def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    bpy.context.collection.objects.link(e)
    BUILD.append(e)
    return e

TOP = 0.25  # island top surface

# ---------------------------------------------------------------- island shell
def shell(rad=2.3):
    cyl((0, 0, 0), rad, 0.5, "clay", verts=56, bevel=0.14)
    cyl((0, 0, -0.32), rad * 0.97, 0.16, "shade", verts=56, bevel=0.04)
    # faceted rock underside, jittered so no two islands match
    bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=rad * 0.92, radius2=0.18, depth=1.9, location=(0, 0, -1.33),
                                    rotation=(math.pi, 0, random.random()))
    o = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for v in bm.verts:
        if v.co.z < 0.9:
            v.co.x += random.uniform(-0.18, 0.18)
            v.co.y += random.uniform(-0.18, 0.18)
            v.co.z += random.uniform(-0.15, 0.15)
    bm.to_mesh(o.data)
    bm.free()
    finish(o, "rock", 0, smooth=False)

def tree(x, y, s=1.0):
    cyl((x, y, TOP + 0.22 * s), 0.05 * s, 0.44 * s, "shade", verts=10, bevel=0)
    sph((x, y, TOP + 0.62 * s), 0.3 * s, "mint", ico=2)

# ---------------------------------------------------------------- 18 dioramas (front faces -y)
def p01():  # Entering the Real World: first day at the QA team's office
    box((-0.3, 0.3, TOP + 1.1), (1.5, 1.2, 2.2), "clay", 0.08)
    for z in (0.55, 1.15, 1.75):
        box((-0.3, 0.3, TOP + z), (1.54, 1.24, 0.24), "glass", 0.03)
    box((-0.3, 0.3, TOP + 2.27), (1.62, 1.32, 0.14), "shade", 0.04)
    box((-0.3, -0.31, TOP + 0.32), (0.42, 0.04, 0.64), "blue", 0.02)
    box((-0.3, -0.75, TOP + 0.02), (0.5, 0.8, 0.04), "shade", 0.01)
    box((0.95, 0.25, TOP + 0.45), (0.9, 0.9, 0.9), "clay", 0.06)
    box((0.95, -0.21, TOP + 0.62), (0.6, 0.03, 0.22), "yellow", 0.02)
    tree(-1.55, -0.6, 0.9)
    tree(1.5, -0.9, 0.7)
    badge = [box((0.85, -1.05, TOP + 0.62), (0.46, 0.05, 0.62), "yellow", 0.04),
             box((0.85, -1.08, TOP + 0.7), (0.2, 0.02, 0.2), "navy", 0.02),
             box((0.85, -1.08, TOP + 0.47), (0.3, 0.02, 0.05), "navy", 0.01),
             rod((0.85, -1.05, TOP + 0.93), (0.85, -1.05, TOP + 1.25), 0.015, "blue")]
    join(badge, "p01_anim_badge", pivot=(0.85, -1.05, TOP + 1.25))

def p02():  # Understanding a Real Application: exploded front end / back end / database
    for i, (m, z) in enumerate((("navy", 0.45), ("clay", 1.25), ("blue", 2.05))):
        parts = [box((0, 0, TOP + z), (2.0, 1.5, 0.22), m, 0.07)]
        if i == 0:
            for x in (-0.5, 0.0, 0.5):
                parts.append(cyl((x, 0, TOP + z + 0.24), 0.17, 0.26, "sky", bevel=0.02))
        elif i == 1:
            for x in (-0.45, 0.45):
                parts.append(cyl((x, 0, TOP + z + 0.17), 0.26, 0.12, "blue", verts=12, bevel=0.02))
                parts.append(cyl((x, 0, TOP + z + 0.25), 0.1, 0.06, "yellow", bevel=0.01))
        else:
            parts.append(box((-0.45, 0, TOP + z + 0.17), (0.7, 0.9, 0.1), "paper", 0.03))
            parts.append(box((0.45, 0.2, TOP + z + 0.17), (0.6, 0.4, 0.1), "paper", 0.03))
            parts.append(box((0.45, -0.3, TOP + z + 0.17), (0.6, 0.2, 0.1), "yellow", 0.03))
        join(parts, f"p02_anim_slab_{i}", pivot=(0, 0, TOP + z))
    for x, y in ((-0.85, -0.6), (0.85, -0.6), (-0.85, 0.6), (0.85, 0.6)):
        rod((x, y, TOP + 0.1), (x, y, TOP + 2.0), 0.025, "glow")

def p03():  # Thinking Like a QA Engineer: requirements under the magnifier
    doc = [box((0, 0, TOP + 0.05), (1.7, 2.1, 0.06), "paper", 0.02, rot=(0, 0, 0.12))]
    for k in range(6):
        w = 1.2 if k % 3 else 0.8
        m = "yellow" if k == 3 else ("blue" if k == 0 else "shade")
        doc.append(box((-0.55 + w / 2 - 0.1 * math.sin(0.12), 0.7 - k * 0.27, TOP + 0.09), (w, 0.08, 0.02), m, 0.0,
                       rot=(0, 0, 0.12)))
    join(doc, "p03_doc")
    lens = [tor((0, 0, TOP + 0.9), 0.58, 0.07, "navy", rot=(0.5, 0, 0)),
            cyl((0, 0, TOP + 0.9), 0.55, 0.03, "glass", rot=(0.5, 0, 0), bevel=0),
            rod((0, -0.62, TOP + 0.6), (0, -1.35, TOP + 0.15), 0.07, "blue")]
    join(lens, "p03_anim_lens", pivot=(0, 0, TOP + 0.9))
    sph((1.25, -0.9, TOP + 0.35), 0.13, "yellow")
    box((1.25, -0.9, TOP + 0.65), (0.07, 0.07, 0.3), "yellow", 0.02)

def p04():  # Functional and UI Testing: a phone and a browser under test
    box((-0.75, 0, TOP + 0.9), (0.95, 0.14, 1.8), "navy", 0.12)
    box((-0.75, -0.075, TOP + 0.92), (0.8, 0.02, 1.52), "paper", 0.03)
    for k in range(3):
        box((-0.75, -0.09, TOP + 1.45 - k * 0.3), (0.6, 0.02, 0.16), "shade", 0.02)
    box((-0.75, -0.11, TOP + 0.45), (0.58, 0.05, 0.18), "yellow", 0.03, name="p04_anim_btn")
    box((0.75, 0.35, TOP + 0.75), (1.6, 0.1, 1.15), "clay", 0.06, rot=(0, 0, -0.35))
    box((0.75, 0.29, TOP + 1.25), (1.6, 0.06, 0.14), "navy", 0.03, rot=(0, 0, -0.35))
    for k, m in enumerate(("red", "yellow", "green")):
        sph((0.12 + k * 0.12 * math.cos(0.35), 0.25 - (0.12 + k * 0.12) * math.sin(-0.35) * 0.0 + 0.0, TOP + 1.25),
            0.035, m)
    box((0.62, 0.27, TOP + 0.85), (0.9, 0.04, 0.5), "sky", 0.03, rot=(0, 0, -0.35))
    box((1.18, 0.12, TOP + 0.55), (0.2, 0.05, 0.2), "paper", 0.02, rot=(0, 0, -0.35))
    tick = [rod((1.12, 0.07, TOP + 0.55), (1.16, 0.05, TOP + 0.5), 0.022, "green"),
            rod((1.16, 0.05, TOP + 0.5), (1.26, 0.01, TOP + 0.63), 0.022, "green")]
    join(tick, "p04_anim_tick", pivot=(1.18, 0.05, TOP + 0.55))

def p05():  # Defects: the bug lab
    cyl((0, 0, TOP + 0.12), 1.25, 0.24, "shade", bevel=0.05)
    cyl((0, 0, TOP + 0.25), 1.12, 0.03, "mint", bevel=0.01)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=1.1, location=(0, 0, TOP + 0.26))
    o = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.01], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    finish(o, "glass", 0)
    bug = [sph((0, 0, 0), 0.3, "red", scale=(1, 0.72, 0.42)),
           sph((0, 0.3, 0.02), 0.12, "navy"),
           box((0, 0, 0.12), (0.02, 0.5, 0.02), "navy", 0)]
    for sx, sy in ((0.12, 0.08), (-0.12, 0.08), (0.1, -0.12), (-0.1, -0.12)):
        bug.append(sph((sx, sy, 0.11), 0.045, "navy"))
    for side in (-1, 1):
        for k, y in enumerate((0.14, 0.0, -0.14)):
            bug.append(rod((side * 0.18, y, 0.0), (side * 0.36, y + 0.06 * (1 - k), -0.12), 0.018, "navy"))
        bug.append(rod((side * 0.04, 0.38, 0.06), (side * 0.14, 0.52, 0.18), 0.012, "navy"))
    b = join(bug, "p05_anim_bug", pivot=(0, 0, 0))
    b.location = (0.45, 0, TOP + 0.42)
    box((1.15, -1.05, TOP + 0.2), (0.7, 0.06, 0.32), "yellow", 0.03, rot=(0.25, 0, 0.5))
    box((1.15, -1.09, TOP + 0.21), (0.5, 0.02, 0.06), "navy", 0.0, rot=(0.25, 0, 0.5))

def p06():  # API and Integration Testing: request/response through a glass pipe
    box((-1.3, 0, TOP + 0.5), (0.85, 0.85, 1.0), "clay", 0.07)
    box((-1.3, -0.43, TOP + 0.6), (0.6, 0.02, 0.45), "sky", 0.02)
    box((1.3, 0, TOP + 0.85), (0.8, 0.8, 1.7), "navy", 0.07)
    for k in range(4):
        sph((1.3 - 0.2, -0.41, TOP + 1.4 - k * 0.3), 0.05, "glow", name=f"p06_anim_led_{k}")
        box((1.3 + 0.12, -0.41, TOP + 1.4 - k * 0.3), (0.32, 0.02, 0.05), "sky", 0.0)
    a, m_, b = (-0.86, 0, TOP + 0.8), (0, 0, TOP + 1.9), (0.88, 0, TOP + 1.25)
    tube([a, m_, b], 0.14, "glass", name="p06_pipe")
    tor(a, 0.16, 0.04, "blue", rot=(0, math.pi / 2, 0))
    tor(b, 0.16, 0.04, "blue", rot=(0, math.pi / 2, 0))
    for nm, p in (("p06_path_a", a), ("p06_path_m", m_), ("p06_path_b", b)):
        empty(nm, p)
    for k, m in enumerate(("yellow", "blue", "yellow")):
        box(a, (0.16, 0.16, 0.16), m, 0.04, name=f"p06_anim_pkt_{k}")

def p07():  # Database Testing: a living database stack
    for i in range(3):
        z = TOP + 0.3 + i * 0.5
        parts = [cyl((0, 0, z), 0.95, 0.42, "clay", verts=56, bevel=0.06),
                 tor((0, 0, z), 0.96, 0.035, "blue" if i != 1 else "yellow")]
        for k in range(6):
            ang = k * math.pi / 3
            parts.append(box((0.96 * math.cos(ang), 0.96 * math.sin(ang), z + 0.1), (0.12, 0.12, 0.04), "sky", 0.01,
                             rot=(0, 0, ang)))
        join(parts, f"p07_anim_disc_{i}", pivot=(0, 0, z))
    cyl((0, 0, TOP + 1.58), 0.95, 0.12, "shade", verts=56, bevel=0.05)
    for x, y in ((-1.55, -0.7), (1.55, -0.5)):
        for i in range(2):
            cyl((x, y, TOP + 0.13 + i * 0.24), 0.32, 0.2, "navy" if i else "clay", bevel=0.03)

def p08():  # Different Types of Testing: the test track
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.2, major_segments=64, minor_segments=10,
                                     location=(0, 0, TOP + 0.02))
    o = bpy.context.active_object
    o.scale = (1.5, 0.95, 0.25)
    bpy.ops.object.transform_apply(scale=True)
    finish(o, "shade", 0)
    cyl((-1.75, -0.95, TOP + 0.45), 0.13, 0.9, "clay", bevel=0.02)  # smoke stack
    for k in range(3):
        sph((-1.75, -0.95, TOP + 1.0 + k * 0.25), 0.12 + k * 0.03, "paper", ico=2, name=f"p08_anim_smoke_{k}")
    box((1.7, -0.95, TOP + 0.25), (0.42, 0.25, 0.4), "yellow", 0.05)  # security padlock
    tor((1.7, -0.95, TOP + 0.5), 0.15, 0.04, "navy", rot=(math.pi / 2, 0, 0))
    tor((1.75, 1.0, TOP + 0.3), 0.28, 0.05, "navy", rot=(math.pi / 2, 0, 0))  # performance gauge
    rod((1.75, 0.98, TOP + 0.3), (1.9, 0.98, TOP + 0.5), 0.025, "red")
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.45, depth=0.35, location=(-1.75, 1.0, TOP + 0.17),
                                    rotation=(0, 0, math.pi / 4))  # accessibility ramp
    finish(bpy.context.active_object, "blue", 0, smooth=False)
    cart = [box((0, 0, 0.1), (0.42, 0.26, 0.16), "blue", 0.06),
            box((0.02, 0, 0.22), (0.22, 0.2, 0.12), "glass", 0.04)]
    for x in (-0.13, 0.13):
        for y in (-0.14, 0.14):
            cart.append(cyl((x, y, 0.04), 0.06, 0.05, "navy", rot=(math.pi / 2, 0, 0), bevel=0))
    c = join(cart, "p08_anim_cart", pivot=(0, 0, 0))
    c.location = (1.5, 0, TOP + 0.04)

def p09():  # Test Management: the sprint board
    box((0, 0.35, TOP + 0.95), (2.3, 0.12, 1.4), "clay", 0.06)
    for x in (-0.38, 0.38):
        box((x, 0.28, TOP + 0.95), (0.02, 0.02, 1.2), "shade", 0)
    for x in (-0.95, 0.95):
        box((x, 0.38, TOP + 0.15), (0.08, 0.3, 0.3), "shade", 0.02)
    cols = {-0.76: ["yellow", "sky", "paper"], 0.0: ["sky", "paper"], 0.76: ["green", "green", "paper"]}
    for x, ms in cols.items():
        for k, m in enumerate(ms):
            box((x, 0.27, TOP + 1.42 - k * 0.27), (0.6, 0.03, 0.22), m, 0.03)
    box((-0.76, 0.25, TOP + 0.6), (0.6, 0.04, 0.22), "red", 0.03, name="p09_anim_card")
    box((1.2, -0.95, TOP + 0.18), (0.75, 0.6, 0.36), "paper", 0.05, rot=(0, 0, 0.3))
    box((1.2, -0.95, TOP + 0.34), (0.75, 0.6, 0.06), "blue", 0.03, rot=(0, 0, 0.3))
    for k in range(3):
        tor((1.0 + k * 0.17, -1.1 + k * 0.05, TOP + 0.4), 0.05, 0.015, "navy", rot=(math.pi / 2, 0, 0.3))

def p10():  # Automation Testing: the robot arm
    cyl((0, 0.3, TOP + 0.15), 0.5, 0.3, "navy", bevel=0.05)
    yaw = [cyl((0, 0, 0.08), 0.38, 0.16, "clay", bevel=0.04),
           box((0, 0, 0.6), (0.2, 0.2, 0.95), "clay", 0.06),
           sph((0, 0, 1.1), 0.17, "yellow")]
    y = join(yaw, "p10_anim_yaw", pivot=(0, 0, 0))
    pitch = [box((0, -0.38, 0), (0.16, 0.8, 0.16), "blue", 0.05),
             box((0, -0.82, -0.05), (0.26, 0.1, 0.14), "navy", 0.03),
             box((0.09, -0.92, -0.12), (0.05, 0.14, 0.16), "navy", 0.01),
             box((-0.09, -0.92, -0.12), (0.05, 0.14, 0.16), "navy", 0.01)]
    p = join(pitch, "p10_anim_pitch", pivot=(0, 0, 0))
    p.location = (0, 0, 1.1)
    p.parent = y
    y.location = (0, 0.3, TOP + 0.3)
    box((0.15, -1.25, TOP + 0.1), (1.6, 0.6, 0.2), "shade", 0.04)
    for k, m in enumerate(("yellow", "sky", "green", "paper")):
        box((-0.45 + k * 0.38, -1.25, TOP + 0.3), (0.24, 0.24, 0.24), m, 0.04)

def p11():  # Git and Collaborative Development: a commit tree
    trunk = [(0, 0, TOP + 0.05 + k * 0.5) for k in range(6)]
    for a, b in zip(trunk, trunk[1:]):
        rod(a, b, 0.06, "blue")
    feat = [(0.75, 0.0, TOP + 1.0), (0.8, 0.0, TOP + 1.5)]
    rod(trunk[1], feat[0], 0.05, "yellow")
    rod(feat[0], feat[1], 0.05, "yellow")
    rod(feat[1], trunk[4], 0.05, "yellow")
    fix = [(-0.7, 0.2, TOP + 1.8)]
    rod(trunk[3], fix[0], 0.05, "green")
    rod(fix[0], trunk[5], 0.05, "green")
    nodes = trunk[1:] + feat + fix
    for k, n in enumerate(nodes):
        m = "glow" if n in trunk else ("glowYellow" if n in feat else "green")
        sph(n, 0.13, m, name=f"p11_anim_node_{k}")
    cyl((0, 0, TOP + 0.05), 0.5, 0.1, "shade", bevel=0.03)
    tree(-1.4, -0.8, 0.8)
    tree(1.5, 0.9, 0.6)

def p12():  # CI/CD and Testing Pipelines: the release conveyor
    box((0, 0, TOP + 0.38), (3.8, 0.7, 0.16), "navy", 0.05)
    for x in (-1.6, 0, 1.6):
        for y in (-0.28, 0.28):
            box((x, y, TOP + 0.15), (0.1, 0.1, 0.3), "shade", 0.02)
    for k in range(9):
        cyl((-1.8 + k * 0.45, 0, TOP + 0.38), 0.07, 0.72, "sky", rot=(math.pi / 2, 0, 0), bevel=0)
    for x, m in ((-1.0, "blue"), (0.0, "yellow"), (1.0, "green")):
        g = [box((x, -0.42, TOP + 0.75), (0.1, 0.1, 0.9), "clay", 0.03),
             box((x, 0.42, TOP + 0.75), (0.1, 0.1, 0.9), "clay", 0.03),
             box((x, 0, TOP + 1.22), (0.16, 1.0, 0.16), m, 0.05)]
        join(g, f"p12_gate_{m}")
    for k in range(4):
        bx = [box((0, 0, 0), (0.3, 0.3, 0.3), "clay", 0.05),
              box((0, 0, 0.151), (0.08, 0.31, 0.01), "yellow", 0)]
        b = join(bx, f"p12_anim_box_{k}", pivot=(0, 0, 0))
        b.location = (-1.8 + k * 0.95, 0, TOP + 0.62)

def p13():  # Real-World Production Testing: the launch pad
    cyl((0, 0, TOP + 0.1), 1.15, 0.2, "shade", bevel=0.05)
    tor((0, 0, TOP + 0.21), 0.95, 0.04, "yellow")
    for k in range(5):
        box((-1.0, 0.45, TOP + 0.3 + k * 0.42), (0.36, 0.36, 0.06), "navy", 0.01)
    for x in (-1.16, -0.84):
        for y in (0.29, 0.61):
            box((x, y, TOP + 1.15), (0.05, 0.05, 2.1), "navy", 0)
    rod((-0.84, 0.45, TOP + 1.5), (-0.36, 0.0, TOP + 1.5), 0.03, "navy")
    rocket = [cyl((0, 0, 0), 0.3, 1.3, "clay", verts=40, bevel=0.03),
              cyl((0, 0, 0.95), 0.3, 0.6, "blue", verts=40, bevel=0.0, r2=0.0),
              tor((0, -0.0, 0.25), 0.3, 0.03, "blue"),
              cyl((0, -0.29, 0.25), 0.11, 0.04, "glass", rot=(math.pi / 2, 0, 0), bevel=0),
              tor((0, -0.3, 0.25), 0.11, 0.025, "navy", rot=(math.pi / 2, 0, 0))]
    for k in range(3):
        a = k * 2 * math.pi / 3
        rocket.append(box((0.32 * math.cos(a), 0.32 * math.sin(a), -0.5), (0.22, 0.05, 0.4), "blue", 0.02,
                          rot=(0, 0, a)))
    r = join(rocket, "p13_anim_rocket", pivot=(0, 0, 0))
    r.location = (0.15, 0, TOP + 0.95)
    flame = [cyl((0, 0, -0.2), 0.2, 0.45, "glowYellow", verts=24, bevel=0, r2=0.0, rot=(math.pi, 0, 0))]
    f = join(flame, "p13_anim_flame", pivot=(0, 0, 0))
    f.location = (0, 0, -0.65)
    f.parent = r
    f.matrix_parent_inverse.identity()

def p14():  # Working Like an Experienced QA Professional: the lighthouse that sees everything
    cyl((0, 0, TOP + 1.05), 0.55, 2.1, "clay", verts=40, bevel=0.03, r2=0.36)
    for z in (0.45, 1.05, 1.65):
        tor((0, 0, TOP + z), 0.55 - z * 0.09, 0.05, "blue")
    cyl((0, 0, TOP + 2.15), 0.48, 0.08, "navy", bevel=0.02)
    cyl((0, 0, TOP + 2.38), 0.32, 0.38, "glass", bevel=0)
    sph((0, 0, TOP + 2.38), 0.13, "glowYellow")
    cyl((0, 0, TOP + 2.75), 0.42, 0.36, "navy", verts=40, bevel=0, r2=0.0)
    beam = [cyl((1.15, 0, 0), 0.38, 2.2, "glowYellow", verts=24, bevel=0, r2=0.04, rot=(0, -math.pi / 2, 0))]
    b = join(beam, "p14_anim_beam", pivot=(0, 0, 0))
    b.location = (0, 0, TOP + 2.38)
    for x, y, s in ((-1.4, -0.9, 0.35), (1.3, -1.1, 0.28), (1.5, 0.8, 0.22)):
        sph((x, y, TOP + s * 0.4), s, "rock", ico=1)

def p15():  # Interview Preparation: two chairs, one conversation
    cyl((0, 0, TOP + 0.4), 0.38, 0.06, "clay", bevel=0.02)
    cyl((0, 0, TOP + 0.2), 0.06, 0.4, "navy", bevel=0)
    for side, m in ((-1, "blue"), (1, "navy")):
        x = side * 0.95
        box((x, 0, TOP + 0.35), (0.55, 0.55, 0.1), m, 0.04)
        box((x + side * 0.25, 0, TOP + 0.7), (0.1, 0.55, 0.65), m, 0.04)
        for dx in (-0.2, 0.2):
            for dy in (-0.2, 0.2):
                box((x + dx, dy, TOP + 0.15), (0.05, 0.05, 0.3), "shade", 0)
    for k, (x, m) in enumerate(((-0.75, "paper"), (0.75, "sky"))):
        bub = [box((0, 0, 0), (0.9, 0.12, 0.48), m, 0.14),
               cyl((-0.2 * (1 if k == 0 else -1), 0, -0.3), 0.1, 0.2, m, verts=12, bevel=0, r2=0.0,
                   rot=(math.pi, 0, 0))]
        for d in (-0.2, 0, 0.2):
            bub.append(sph((d, -0.07, 0), 0.05, "navy"))
        b = join(bub, f"p15_anim_bubble_{k}", pivot=(0, 0, 0))
        b.location = (x, 0.1, TOP + 1.45 + k * 0.35)
    cyl((0.12, 0, TOP + 0.5), 0.07, 0.14, "yellow", bevel=0.01)

def p16():  # Final Industry Simulation: the simulation arena
    bpy.ops.mesh.primitive_torus_add(major_radius=1.75, minor_radius=0.3, major_segments=64, minor_segments=12,
                                     location=(0, 0, TOP + 0.12))
    o = bpy.context.active_object
    o.scale = (1, 1, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    finish(o, "shade", 0)
    cyl((0, 0, TOP + 0.08), 1.0, 0.16, "clay", bevel=0.04)
    tor((0, 0, TOP + 0.17), 0.9, 0.03, "yellow")
    for k in range(7):
        a = k * 2 * math.pi / 7
        box((0.45 * math.cos(a), 0.45 * math.sin(a), TOP + 0.3 + (k % 3) * 0.12), (0.18, 0.18, 0.3 + (k % 3) * 0.24),
            "navy" if k % 2 else "blue", 0.03)
    cyl((0, 0, TOP + 0.4), 0.16, 0.5, "clay", bevel=0.03)
    trophy = [cyl((0, 0, TOP + 0.72), 0.2, 0.28, "yellow", verts=32, bevel=0, r2=0.08),
              tor((0, 0, TOP + 0.85), 0.2, 0.025, "yellow")]
    join(trophy, "p16_trophy")
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.25, location=(0, 0, TOP + 0.3))
    o = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.05], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    w = o.modifiers.new("w", "WIREFRAME")
    w.thickness = 0.025
    finish(o, "glow", 0, smooth=False, name="p16_anim_dome")
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        x, y = 1.95 * math.cos(a), 1.95 * math.sin(a)
        rod((x, y, TOP), (x, y, TOP + 1.3), 0.03, "navy")
        box((x * 0.95, y * 0.95, TOP + 1.33), (0.22, 0.22, 0.12), "glowYellow", 0.02, rot=(0, 0, a))

def p17():  # AI in Real-World Software Testing: the thinking core
    cyl((0, 0, TOP + 0.1), 0.6, 0.2, "navy", bevel=0.05)
    cyl((0, 0, TOP + 0.25), 0.4, 0.1, "clay", bevel=0.03)
    core = [sph((0, 0, 0), 0.55, "glass", ico=1), sph((0, 0, 0), 0.28, "glow", ico=2)]
    c = join(core, "p17_anim_core", pivot=(0, 0, 0))
    c.location = (0, 0, TOP + 1.25)
    for k, (tilt, m) in enumerate(((0.45, "blue"), (-0.7, "yellow"))):
        ring = [tor((0, 0, 0), 0.95 + k * 0.2, 0.025, m), sph((0.95 + k * 0.2, 0, 0), 0.08, m)]
        r = join(ring, f"p17_anim_ring_{k}", pivot=(0, 0, 0))
        r.location = (0, 0, TOP + 1.25)
        r.rotation_euler = (tilt, 0.3 * k, 0)
    for k in range(5):
        a = k * 2 * math.pi / 5
        box((1.5 * math.cos(a), 1.5 * math.sin(a), TOP + 0.5 + (k % 2) * 0.4), (0.18, 0.18, 0.18),
            ("sky", "paper", "blue")[k % 3], 0.04, name=f"p17_anim_bit_{k}")

def p18():  # QA Career and Professional Development: the summit
    bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=1.9, radius2=0.12, depth=2.7, location=(0, 0.1, TOP + 1.35))
    o = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for v in bm.verts:
        if -1.3 < v.co.z < 1.3:
            v.co.x *= random.uniform(0.85, 1.1)
            v.co.y *= random.uniform(0.85, 1.1)
    bm.to_mesh(o.data)
    bm.free()
    finish(o, "shade", 0, smooth=False)
    cyl((0, 0.1, TOP + 2.35), 0.62, 0.75, "clay", verts=9, bevel=0, r2=0.1)
    for k in range(13):  # the climb: stepping stones spiralling up
        t = k / 12
        a = -1.9 + t * 4.4
        rr = 1.75 - t * 1.25
        box((rr * math.cos(a), 0.1 + rr * math.sin(a), TOP + 0.12 + t * 2.15), (0.22, 0.16, 0.06),
            "yellow" if k % 4 == 0 else "paper", 0.02, rot=(0, 0, a))
    rod((0, 0.1, TOP + 2.7), (0, 0.1, TOP + 3.6), 0.025, "navy")
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=6, size=1, location=(0.33, 0.1, TOP + 3.4),
                                    rotation=(math.pi / 2, 0, 0))
    o = bpy.context.active_object
    o.scale = (0.62, 0.38, 1)
    bpy.ops.object.transform_apply(scale=True)
    finish(o, "yellow", 0, name="p18_anim_flag")
    scene.cursor.location = (0, 0.1, TOP + 3.4)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")

BUILDERS = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15, p16, p17, p18]

# ---------------------------------------------------------------- layout + build
anchors = []
for i, build in enumerate(BUILDERS):
    BUILD = []
    shell()
    build()
    n = i + 1
    # merge static parts per material (animated parts and path empties stay separate)
    static = [o for o in BUILD if o.type == "MESH" and "_anim_" not in o.name and o.parent is None
              and not o.name.startswith(f"p{n:02d}_")]
    by_mat = {}
    for o in static:
        by_mat.setdefault(o.data.materials[0].name, []).append(o)
    for mname, objs in by_mat.items():
        joined = join(objs, f"p{n:02d}_{mname}") if len(objs) > 1 else objs[0]
        joined.name = f"p{n:02d}_{mname}"
    root = bpy.data.objects.new(f"island_{n:02d}", None)
    bpy.context.collection.objects.link(root)
    for o in list(bpy.context.collection.objects):
        if o is not root and o.parent is None and not o.name.startswith("island_") and not o.name.startswith("cloud_"):
            o.parent = root
    cx = 7.2 * math.sin(i * 0.82)
    cy = -7.4 * i
    cz = 0.22 * i + 0.55 * math.sin(i * 1.3) + (1.2 if n == 18 else 0)
    rz = math.pi + 0.32 * math.sin(i * 1.7)
    root.location = (cx, cy, cz)
    root.rotation_euler = (0, 0, rz)
    # glTF is Y-up: (x, y, z)blender -> (x, z, -y)
    anchors.append({"part": n, "position": [round(cx, 3), round(cz, 3), round(-cy, 3)], "rotationY": round(rz, 4)})

# drifting clouds between islands
for k in range(16):
    t = k / 15
    cx = 7.2 * math.sin(t * 17 * 0.82) + random.choice((-6.5, 6.5))
    cy = -7.4 * 17 * t + random.uniform(-3, 3)
    cz = random.uniform(-2.5, 1.0) + 0.22 * 17 * t
    parts = []
    for j in range(5):
        parts.append(sph((cx + random.uniform(-0.9, 0.9), cy + random.uniform(-0.4, 0.4),
                          cz + random.uniform(-0.15, 0.25)), random.uniform(0.35, 0.7), "paper", seg=24))
    BUILD = []
    join(parts, f"cloud_{k:02d}")

bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "archipelago.raw.glb"), export_format="GLB", export_apply=True,
                          export_yup=True, export_cameras=False, export_lights=False, export_texcoords=False)
with open(os.path.join(OUT, "anchors.json"), "w") as f:
    json.dump(anchors, f, indent=1)
print("EXPORTED", OUT, len(anchors), "islands")

# ---------------------------------------------------------------- poster render (fallback + loading state)
if RENDER:
    world = bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#DFE7F3")
    scene.view_settings.view_transform = "Standard"
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(8)
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
    bpy.context.collection.objects.link(sun)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 38
    bpy.context.collection.objects.link(cam)
    cam.location = (-12, 20, 17)
    target = Vector((1, -24, 1))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 82
    scene.render.filepath = os.path.join(OUT, "archipelago-poster.webp")
    bpy.ops.render.render(write_still=True)
    print("RENDERED poster")
