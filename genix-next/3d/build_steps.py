"""
Three levels of confidence as a clay staircase: Knowledge → Interview → Job, each step carrying its own prop.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_steps.py -- public/illustrations

Writes confidence-steps.webp (transparent) and confidence-steps.json (label anchors as 0..1 of the image).
"""
import bpy, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "public/illustrations")
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1)

M = {}
for n, h, r in (("clay", "#F5F7FB", 0.75), ("shade", "#DCE3EE", 0.85), ("navy", "#0B1F3A", 0.5), ("blue", "#2563EB", 0.45),
                ("sky", "#6EA8FF", 0.5), ("yellow", "#FFC83D", 0.45), ("green", "#3DD47A", 0.5), ("paper", "#FFFFFF", 0.9),
                ("ink", "#4A5B75", 0.6), ("red", "#FF6B6B", 0.5)):
    m = bpy.data.materials.new(n)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(h)
    p.inputs["Roughness"].default_value = r
    M[n] = m

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

def box(loc, dims, m, bevel=0.05, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel)

def cyl(loc, r, h, m, verts=32, rot=(0, 0, 0), r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m, 0.01)

def sph(loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=loc)
    return finish(bpy.context.active_object, m)

# ---------------------------------------------------------------- the staircase (rises along +x, faces -y)
STEP_W, STEP_D = 3.0, 3.0
HEIGHTS = [1.0, 2.0, 3.0]
RIMS = ["sky", "blue", "yellow"]
tops = []
box((STEP_W, 0, -0.15), (STEP_W * 3 + 0.6, STEP_D + 0.6, 0.3), "shade", 0.12)  # plinth
for i, (h, rim) in enumerate(zip(HEIGHTS, RIMS)):
    x = i * STEP_W
    box((x, 0, h / 2), (STEP_W - 0.08, STEP_D, h), "clay", 0.1)
    box((x, -STEP_D / 2 - 0.005, h - 0.12), (STEP_W - 0.2, 0.02, 0.12), rim, 0.0)  # coloured riser lip = legend colour
    tops.append(Vector((x, 0, h)))

# 1 · Knowledge: a stack of books and a lamp
t = tops[0]
for k, (m, w) in enumerate((("blue", 1.5), ("yellow", 1.35), ("sky", 1.45), ("navy", 1.25))):
    box((t.x - 0.2, t.y + 0.2, t.z + 0.11 + k * 0.22), (w, 1.0, 0.2), m, 0.04, rot=(0, 0, 0.12 * (k % 2 * 2 - 1)))
    box((t.x - 0.2 - w / 2 + 0.02, t.y + 0.2, t.z + 0.11 + k * 0.22), (0.02, 0.9, 0.12), "paper", 0.0, rot=(0, 0, 0.12 * (k % 2 * 2 - 1)))
cyl((t.x + 0.95, t.y + 0.5, t.z + 0.03), 0.28, 0.06, "navy")
cyl((t.x + 0.95, t.y + 0.5, t.z + 0.55), 0.03, 1.0, "navy")
cyl((t.x + 0.8, t.y + 0.5, t.z + 1.1), 0.32, 0.36, "yellow", r2=0.12, rot=(0, 0.6, 0))

# 2 · Interview: two chairs' worth of conversation, as speech bubbles
t = tops[1]
for k, (dx, dz, m, flip) in enumerate(((-0.55, 0.75, "sky", 1), (0.55, 1.45, "blue", -1))):
    box((t.x + dx, t.y + 0.1, t.z + dz), (1.5, 0.3, 0.8), m, 0.25)
    cyl((t.x + dx - 0.35 * flip, t.y + 0.1, t.z + dz - 0.5), 0.16, 0.3, m, verts=12, r2=0.0, rot=(math.pi, 0, 0))
    for d in (-0.32, 0, 0.32):
        sph((t.x + dx + d, t.y - 0.07, t.z + dz), 0.075, "navy" if m == "sky" else "paper")

# 3 · Job: a laptop open on the work, and the team ID badge
t = tops[2]
box((t.x - 0.1, t.y + 0.1, t.z + 0.05), (1.7, 1.15, 0.08), "navy", 0.04)  # laptop base
box((t.x - 0.1, t.y + 0.66, t.z + 0.62), (1.7, 0.08, 1.1), "navy", 0.04, rot=(-0.22, 0, 0))  # screen
box((t.x - 0.1, t.y + 0.6, t.z + 0.63), (1.5, 0.02, 0.92), "paper", 0.02, rot=(-0.22, 0, 0))
for k, m in enumerate(("green", "green", "yellow")):
    box((t.x - 0.4, t.y + 0.57, t.z + 0.92 - k * 0.24), (0.12, 0.02, 0.12), m, 0.0, rot=(-0.22, 0, 0))
    box((t.x + 0.12, t.y + 0.57, t.z + 0.92 - k * 0.24), (0.7, 0.02, 0.06), "shade", 0.0, rot=(-0.22, 0, 0))
box((t.x + 1.05, t.y - 0.65, t.z + 0.45), (0.5, 0.06, 0.68), "yellow", 0.05, rot=(0, 0, -0.35))  # ID badge
box((t.x + 1.05, t.y - 0.69, t.z + 0.55), (0.22, 0.02, 0.22), "navy", 0.02, rot=(0, 0, -0.35))
bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.02, location=(t.x + 1.05, t.y - 0.6, t.z + 0.9),
                                 rotation=(math.pi / 2, 0, -0.35))
finish(bpy.context.active_object, "blue")

# ---------------------------------------------------------------- camera, light, render
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = 11.8
cam.rotation_euler = (math.radians(62), 0, math.radians(28))
centre = Vector((STEP_W, 0, 1.75))
cam.location = centre + cam.rotation_euler.to_matrix() @ Vector((0, 0, 40))
bpy.context.collection.objects.link(cam)
scene.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.4
sun.data.angle = math.radians(6)
sun.data.color = (1.0, 0.96, 0.9)
sun.rotation_euler = (math.radians(40), math.radians(-15), math.radians(-30))
bpy.context.collection.objects.link(sun)
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#EAF1FB")
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.view_transform = "Standard"
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = 1800, 1000
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 88
scene.render.filepath = os.path.join(OUT, "confidence-steps.webp")
bpy.context.view_layer.update()

anchors = {}
for i, t in enumerate(tops):
    p = world_to_camera_view(scene, cam, Vector((t.x, -STEP_D / 2, t.z)))  # front edge of each step's top
    anchors[str(i)] = [round(p.x, 4), round(1 - p.y, 4)]
with open(os.path.join(OUT, "confidence-steps.json"), "w") as f:
    json.dump(anchors, f, indent=1)
bpy.ops.render.render(write_still=True)
print("RENDERED", anchors)
