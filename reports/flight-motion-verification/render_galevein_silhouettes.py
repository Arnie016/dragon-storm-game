from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path("/Users/arnav/Desktop/dragon-storm-game")
OUTPUT = ROOT / "reports/galevein-silhouette-variants/silhouettes"
ASSETS = {
    "base": ROOT / "dragon_rigged_corrected.glb",
    "stormcrest": ROOT / "dragon_galevein_stormcrest_corrected.glb",
    "voltspine": ROOT / "dragon_galevein_voltspine_corrected.glb",
    "thunderhook": ROOT / "dragon_galevein_thunderhook_corrected.glb",
}
VIEWS = {
    "side": (Vector((1.0, 0.0, 0.0)), Vector((0.0, 0.0, 1.0))),
    "threequarter": (
        Vector((1.0, -1.0, 0.45)).normalized(),
        Vector((0.0, 0.0, 1.0)),
    ),
    "top": (Vector((0.0, 0.0, 1.0)), Vector((0.0, -1.0, 0.0))),
}


def clear_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_asset(path):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    mesh = max(
        (obj for obj in bpy.context.scene.objects if obj.type == "MESH"),
        key=lambda obj: len(obj.data.vertices),
    )
    armature = mesh.find_armature()
    armature.data.pose_position = "REST"
    if armature.animation_data:
        armature.animation_data.action = None
    bpy.context.scene.frame_set(1)
    return armature, mesh


def bounds_points(mesh):
    return [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]


def axes(view_direction, up_hint):
    right = up_hint.cross(view_direction).normalized()
    up = view_direction.cross(right).normalized()
    return right, up


def union_frames():
    view_axes = {
        view: (view_direction, *axes(view_direction, up_hint))
        for view, (view_direction, up_hint) in VIEWS.items()
    }
    bounds = {
        view: {
            "rightMin": float("inf"), "rightMax": float("-inf"),
            "upMin": float("inf"), "upMax": float("-inf"),
            "depthMin": float("inf"), "depthMax": float("-inf"),
        }
        for view in VIEWS
    }
    for path in ASSETS.values():
        _, mesh = import_asset(path)
        for vertex in mesh.data.vertices:
            point = mesh.matrix_world @ vertex.co
            for view, (view_direction, right, up) in view_axes.items():
                values = bounds[view]
                right_value = point.dot(right)
                up_value = point.dot(up)
                depth_value = point.dot(view_direction)
                values["rightMin"] = min(values["rightMin"], right_value)
                values["rightMax"] = max(values["rightMax"], right_value)
                values["upMin"] = min(values["upMin"], up_value)
                values["upMax"] = max(values["upMax"], up_value)
                values["depthMin"] = min(values["depthMin"], depth_value)
                values["depthMax"] = max(values["depthMax"], depth_value)
    frames = {}
    for view, (view_direction, up_hint) in VIEWS.items():
        right, up = axes(view_direction, up_hint)
        values = bounds[view]
        right_min, right_max = values["rightMin"], values["rightMax"]
        up_min, up_max = values["upMin"], values["upMax"]
        center = (
            right * ((right_min + right_max) * 0.5)
            + up * ((up_min + up_max) * 0.5)
            + view_direction * ((values["depthMin"] + values["depthMax"]) * 0.5)
        )
        frames[view] = {
            "direction": view_direction,
            "upHint": up_hint,
            "center": center,
            "orthoScale": max(right_max - right_min, up_max - up_min) * 1.08,
        }
    return frames


def point_camera(camera, target):
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def configure_render(mesh):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.world.color = (1.0, 1.0, 1.0)
    shading = scene.display.shading
    shading.light = "FLAT"
    shading.color_type = "SINGLE"
    shading.single_color = (0.0, 0.0, 0.0)
    shading.background_type = "VIEWPORT"
    shading.background_color = (1.0, 1.0, 1.0)
    shading.show_shadows = False
    shading.show_cavity = False
    shading.show_specular_highlight = False
    mesh.color = (0.0, 0.0, 0.0, 1.0)


def render():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    frames = union_frames()
    for asset_name, path in ASSETS.items():
        _, mesh = import_asset(path)
        configure_render(mesh)
        scene = bpy.context.scene
        camera_data = bpy.data.cameras.new("SilhouetteCamera")
        camera = bpy.data.objects.new("SilhouetteCamera", camera_data)
        bpy.context.collection.objects.link(camera)
        camera.data.type = "ORTHO"
        scene.camera = camera
        for view, frame in frames.items():
            camera.location = frame["center"] + frame["direction"] * 2.0
            point_camera(camera, frame["center"])
            camera.data.ortho_scale = frame["orthoScale"]
            scene.render.filepath = str(OUTPUT / f"{view}-{asset_name}.png")
            bpy.ops.render.render(write_still=True)
    print("GALEVEIN_SILHOUETTES=" + str(OUTPUT))


if __name__ == "__main__":
    render()
