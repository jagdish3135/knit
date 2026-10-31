# Builds the Knit spool for the landing page and exports site/models/spool.glb.
# Run from the repo root: blender -b -P scripts/blender/spool.py
# Parts: two wooden flanges, a barrel, and the wound thread. The thread uses its own
# material named "Thread", so the page can tint each spool with its agent's colour.
import bpy, math, os

bpy.ops.wm.read_factory_settings(use_empty=True)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "site", "models", "spool.glb")

def mat(name, rgb, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

wood = mat("Wood", (0.62, 0.43, 0.25), 0.7)
thread = mat("Thread", (0.89, 0.65, 0.13), 0.85)

def smooth(obj, angle=35):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(angle))
    obj.select_set(False)

def bevel(obj, width, segs):
    m = obj.modifiers.new("Bevel", "BEVEL")
    m.width, m.segments, m.limit_method = width, segs, "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=m.name)

parts = []
# Flanges: wide, short, rounded rims (spool is 1.0 tall, along Z).
for z in (0.06, 0.94):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.42, depth=0.12, location=(0, 0, z))
    f = bpy.context.object
    f.name = "Flange"
    bevel(f, 0.035, 3)
    f.data.materials.append(wood)
    parts.append(f)

# Barrel between the flanges, with a hole through the middle.
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.22, depth=0.8, location=(0, 0, 0.5))
barrel = bpy.context.object
barrel.data.materials.append(wood)
parts.append(barrel)

# Wound thread: slightly barrel-shaped, sitting inside the flanges.
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.34, depth=0.74, location=(0, 0, 0.5))
wound = bpy.context.object
wound.name = "Thread"
bevel(wound, 0.05, 4)
wound.data.materials.append(thread)

# Join the wood parts; keep the thread as its own mesh so it can be tinted alone.
bpy.ops.object.select_all(action="DESELECT")
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object
body.name = "Body"
for o in (body, wound):
    smooth(o)

# Hole: a boolean through the body so the spool reads as a spool from above.
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.07, depth=1.4, location=(0, 0, 0.5))
hole = bpy.context.object
b = body.modifiers.new("Hole", "BOOLEAN")
b.operation, b.object = "DIFFERENCE", hole
bpy.context.view_layer.objects.active = body
body.modifiers.move(len(body.modifiers) - 1, 0)
bpy.ops.object.modifier_apply(modifier="Hole")
bpy.data.objects.remove(hole)
# Auto smooth adds a modifier in Blender 5; apply it so the GLB carries plain normals.
for o in (body, wound):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_yup=True, export_apply=True)
tris = sum(len(o.data.polygons) for o in (body, wound))
print(f"KNIT_SPOOL ok faces={tris} -> {out}")
