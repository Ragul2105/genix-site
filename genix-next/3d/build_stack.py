"""
The practice app, exploded: five layers of the course's e-commerce project, stacked and pulled apart
(after Tanner Wayment's "Isometric Platform Diagram" on Dribbble), with the Payment request traced through all of them.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_stack.py -- public/illustrations

Writes app-stack.webp (transparent) and app-stack.json (where each layer's label should point, as 0..1 of the image),
so the HTML labels always line up with the render.
"""
import bpy, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "public/illustrations")
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials (site palette)
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1)

M = {}
def mat(name, hexc, rough=0.8, alpha=1.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(hexc)
    p.inputs["Roughness"].default_value = rough
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        m.surface_render_method = "BLENDED"
    if emit:
        p.inputs["Emission Color"].default_value = srgb(hexc)
        p.inputs["Emission Strength"].default_value = emit
    M[name] = m

for n, h, r in (("clay", "#F5F7FB", 0.75), ("shade", "#DCE3EE", 0.85), ("navy", "#0B1F3A", 0.5), ("blue", "#2563EB", 0.45),
                ("sky", "#6EA8FF", 0.5), ("yellow", "#FFC83D", 0.45), ("green", "#3DD47A", 0.5), ("paper", "#FFFFFF", 0.9),
                ("red", "#FF6B6B", 0.5), ("ink", "#4A5B75", 0.6)):
    mat(n, h, r)
mat("glass", "#CFE0FF", 0.05, alpha=0.3)
mat("glowYellow", "#FFC83D", 0.3, emit=3.5)
mat("glowSky", "#6EA8FF", 0.3, emit=2.5)

def finish(o, m, bevel=0.0, smooth=True):
    o.data.materials.clear()
    o.data.materials.append(M[m])
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    o.select_set(True)
    if bevel:
        b = o.modifiers.new("bev", "BEVEL")
        b.width, b.segments, b.limit_method, b.harden_normals = bevel, 3, "ANGLE", True
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)) if smooth else bpy.ops.object.shade_flat()
    return o

def box(loc, dims, m, bevel=0.04, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel)

def cyl(loc, r, h, m, verts=40, bevel=0.02, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m, bevel)

def sph(loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=loc)
    return finish(bpy.context.active_object, m)

def tor(loc, R, r, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=40, minor_segments=10, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m)

def rod(a, b, r, m):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.active_object
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return finish(o, m)

# ---------------------------------------------------------------- the stack (top → bottom)
# Fanned like a deck: each lower layer slides toward the viewer so its contents aren't hidden by the one above.
W, D, GAP = 6.4, 4.2, 2.9
# diagonal cascade: mostly to screen-right, a little toward the viewer
TOWARD = (Vector((0.78, 0.62, 0)) * 0.85 + Vector((0.62, -0.78, 0)) * 0.35).normalized()
STAGGER = 1.25
LAYERS = [("ui", "blue"), ("api", "sky"), ("services", "navy"), ("db", "yellow"), ("external", "green")]
Z = {key: (len(LAYERS) - 1 - i) * GAP for i, (key, _) in enumerate(LAYERS)}
OFF = {key: TOWARD * STAGGER * i for i, (key, _) in enumerate(LAYERS)}
_seen = set()
def slide(key):
    """Move everything built since the last call by this layer's offset."""
    for o in bpy.data.objects:
        if o.name not in _seen:
            o.location += OFF[key]
            _seen.add(o.name)
TOPZ = {k: z + 0.16 for k, z in Z.items()}

for key, colour in LAYERS:
    z = Z[key]
    box((0, 0, z), (W, D, 0.3), "clay", 0.12)
    box((0, 0, z - 0.02), (W + 0.06, D + 0.06, 0.1), colour, 0.04)  # colour-coded rim = the legend colour in HTML
    box((0, 0, z - 0.2), (W * 0.96, D * 0.96, 0.08), "shade", 0.03)
    slide(key)

# where the Payment request lands on each layer (the yellow trace)
PX, PY = 0.9, -0.6

# 1 · Browser / UI: the storefront and the phone app
t = TOPZ["ui"]
box((-0.6, 1.0, t + 1.05), (3.4, 0.14, 2.1), "clay", 0.08)
box((-0.6, 0.92, t + 1.98), (3.4, 0.04, 0.22), "navy", 0.02)
for k, m in enumerate(("red", "yellow", "green")):
    sph((-2.1 + k * 0.17, 0.89, t + 1.98), 0.035, m)
for k, m in enumerate(("sky", "yellow", "blue")):
    box((-1.75 + k * 1.1, 0.9, t + 1.25), (0.9, 0.04, 0.9), "shade", 0.03)
    box((-1.75 + k * 1.1, 0.88, t + 1.35), (0.5, 0.03, 0.5), m, 0.04)
    box((-1.75 + k * 1.1, 0.88, t + 0.9), (0.6, 0.03, 0.08), "ink", 0.0)
box((PX, PY, t + 0.1), (0.9, 0.5, 0.2), "yellow", 0.06)  # the Pay button
box((2.25, 0.2, t + 0.95), (0.95, 0.14, 1.85), "navy", 0.12)
box((2.25, 0.12, t + 0.97), (0.8, 0.03, 1.6), "paper", 0.03)
for k in range(3):
    box((2.25, 0.1, t + 1.5 - k * 0.32), (0.6, 0.02, 0.18), "shade", 0.02)
box((2.25, 0.1, t + 0.45), (0.6, 0.02, 0.18), "yellow", 0.02)
box((-2.4, -1.2, t + 0.3), (0.7, 0.45, 0.6), "yellow", 0.06)  # shopping bag
tor((-2.4, -1.2, t + 0.62), 0.18, 0.03, "navy", rot=(math.pi / 2, 0, 0))

slide("ui")

# 2 · API: requests and responses moving through glass pipes
t = TOPZ["api"]
for k, y in enumerate((-1.45, -0.55, 0.35)):
    cyl((0, y, t + 0.32), 0.26, W - 1.0, "glass", bevel=0, rot=(0, math.pi / 2, 0))
    for j, x in enumerate((-2.0, -0.6, 0.8, 2.0)):
        if (j + k) % 2 == 0:
            box((x, y, t + 0.32), (0.34, 0.3, 0.3), "yellow" if (j + k) % 4 == 0 else "blue", 0.05)
for x in (-2.75, 2.75):
    box((x, -0.55, t + 0.45), (0.55, 2.6, 0.9), "clay", 0.08)
box((-2.75, -0.55, t + 0.95), (0.4, 2.3, 0.08), "sky", 0.03)
box((2.75, -0.55, t + 0.95), (0.4, 2.3, 0.08), "blue", 0.03)

slide("api")

# 3 · Application services: cart, payment and order services talking to each other
t = TOPZ["services"]
svc = [(-0.55, -1.15, 1.1, "cart"), (PX + 0.15, PY + 0.2, 1.5, "payment"), (2.25, 0.55, 0.9, "order")]  # in the exposed front-right
for x, y, h, kind in svc:
    box((x, y, t + h / 2), (1.3, 1.3, h), "clay", 0.1)
    box((x, y, t + h + 0.03), (1.0, 1.0, 0.06), "blue", 0.03)
    top = t + h + 0.06
    if kind == "cart":
        box((x, y, top + 0.2), (0.6, 0.38, 0.28), "navy", 0.04)
        for dx in (-0.2, 0.2):
            cyl((x + dx, y - 0.2, top + 0.04), 0.06, 0.04, "ink", rot=(math.pi / 2, 0, 0))
    elif kind == "payment":
        box((x, y, top + 0.05), (0.75, 0.48, 0.06), "yellow", 0.03, rot=(0, 0, 0.3))
        box((x, y, top + 0.09), (0.75, 0.1, 0.02), "navy", 0.0, rot=(0, 0, 0.3))
    else:
        box((x, y, top + 0.22), (0.55, 0.55, 0.44), "paper", 0.04)
        box((x, y, top + 0.45), (0.56, 0.12, 0.01), "yellow", 0.0)
rod((-0.55, -1.15, t + 0.6), (PX + 0.15, PY + 0.2, t + 0.6), 0.05, "glowSky")
rod((PX + 0.15, PY + 0.2, t + 0.6), (2.25, 0.55, t + 0.5), 0.05, "glowSky")

slide("services")

# 4 · Database: orders, customers, payments
t = TOPZ["db"]
for k, (x, y) in enumerate(((-0.55, -1.15), (PX + 0.2, PY + 0.3), (2.3, 0.6))):
    for j in range(3):
        cyl((x, y, t + 0.22 + j * 0.42), 0.62, 0.36, "clay", verts=48, bevel=0.05)
        tor((x, y, t + 0.22 + j * 0.42), 0.63, 0.03, "yellow" if (j + k) % 3 == 0 else "blue")
    cyl((x, y, t + 1.12), 0.62, 0.06, "shade", verts=48, bevel=0.02)

slide("db")

# 5 · External systems: the payment provider, notifications, delivery
t = TOPZ["external"]
box((PX, PY, t + 0.35), (0.8, 0.55, 0.7), "navy", 0.08)  # card terminal
box((PX, PY - 0.28, t + 0.5), (0.55, 0.02, 0.28), "sky", 0.02)
box((PX + 0.15, PY + 0.05, t + 0.78), (0.7, 0.05, 0.45), "yellow", 0.03, rot=(0.3, 0, 0))
box((-1.6, -0.6, t + 0.25), (1.2, 0.8, 0.5), "sky", 0.05)  # email
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.62, depth=0.3, location=(-1.6, -0.6, t + 0.55),
                                rotation=(0, 0, math.pi / 4))
o = bpy.context.active_object
o.scale = (1.4, 0.9, 1)
finish(o, "paper", 0, smooth=False)
VX, VY = 2.15, -0.75  # delivery van, front-right where it's visible
box((VX, VY, t + 0.42), (1.1, 0.8, 0.72), "paper", 0.06)
box((VX, VY - 0.41, t + 0.5), (0.7, 0.02, 0.22), "green", 0.0)
box((VX + 0.78, VY, t + 0.32), (0.5, 0.76, 0.52), "green", 0.06)
box((VX + 1.0, VY, t + 0.42), (0.04, 0.6, 0.22), "sky", 0.0)
for x in (VX - 0.3, VX + 0.75):
    for y in (VY - 0.38, VY + 0.38):
        cyl((x, y, t + 0.1), 0.14, 0.08, "navy", rot=(math.pi / 2, 0, 0))

slide("external")

# ---------------------------------------------------------------- connectors: quiet sky rods at the corners, Payment in yellow
keys = [k for k, _ in LAYERS]
for upper, lower in zip(keys[:-1], keys[1:]):
    for x in (-W / 2 + 0.35, W / 2 - 0.35):
        for y in (-D / 2 + 0.35, D / 2 - 0.35):
            a = Vector((x, y, Z[lower] + 0.16)) + OFF[lower]
            b = Vector((x, y, Z[upper] - 0.24)) + OFF[upper]
            rod(a, b, 0.022, "glowSky")
    a = Vector((PX, PY, Z[lower] + 0.16)) + OFF[lower]
    b = Vector((PX, PY, Z[upper] - 0.24)) + OFF[upper]
    rod(a, b, 0.07, "glowYellow")
for k in keys:
    tor(Vector((PX, PY, Z[k] + 0.17)) + OFF[k], 0.42, 0.03, "glowYellow")

# ---------------------------------------------------------------- camera: true isometric, transparent background
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = 19.5
cam.rotation_euler = (math.radians(54), 0, math.radians(38))
centre = Vector((0, 0, Z["services"])) + OFF["services"]
cam.location = centre + cam.rotation_euler.to_matrix() @ Vector((0, 0, 40))
bpy.context.collection.objects.link(cam)
scene.camera = cam

sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.4
sun.data.angle = math.radians(6)
sun.data.color = (1.0, 0.96, 0.9)
sun.rotation_euler = (math.radians(38), math.radians(-12), math.radians(-20))
bpy.context.collection.objects.link(sun)
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#EAF1FB")
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9

scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.view_transform = "Standard"
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = 1700, 1800
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 88
scene.render.filepath = os.path.join(OUT, "app-stack.webp")
bpy.context.view_layer.update()

# label anchors: the left corner of each layer's rim, and the Payment trace on the top layer
anchors = {}
for key, _ in LAYERS:
    corners = [world_to_camera_view(scene, cam, Vector((sx * W / 2, sy * D / 2, Z[key])) + OFF[key])
               for sx in (-1, 1) for sy in (-1, 1)]
    p = min(corners, key=lambda c: c.x)  # the slab's left tip: where its label attaches
    anchors[key] = [round(p.x, 4), round(1 - p.y, 4)]
p = world_to_camera_view(scene, cam, Vector((PX, PY, TOPZ["ui"] + 0.3)) + OFF["ui"])
anchors["payment"] = [round(p.x, 4), round(1 - p.y, 4)]
with open(os.path.join(OUT, "app-stack.json"), "w") as f:
    json.dump(anchors, f, indent=1)

bpy.ops.render.render(write_still=True)
print("RENDERED", scene.render.filepath, anchors)
