import json
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


ROOT = Path("/Users/arnav/Desktop/dragon-storm-game")
SOURCE = ROOT / "dragon_rigged_corrected.glb"
OUTPUT = ROOT / "dragon_rigged_membrane.glb"
REPORT = ROOT / "reports/flight-motion-verification/membrane-build-report.json"
ORIGINAL_BONES = (
    "hips", "chest", "neck", "head",
    "shoulder.R", "forearm.R", "fingerA.R", "fingerB.R", "fingerC.R",
    "shoulder.L", "forearm.L", "fingerA.L", "fingerB.L", "fingerC.L",
    "tail1", "tail2", "tail3", "tail4", "tail5",
    "thigh.R", "shin.R", "foot.R", "thigh.L", "shin.L", "foot.L",
)
MEMBRANE_BONES = (
    "membraneBody.R", "membraneAB.R", "membraneBC.R",
    "membraneBody.L", "membraneAB.L", "membraneBC.L",
)


def clear_scene(purge_data=False):
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    if purge_data:
        for action in list(bpy.data.actions):
            bpy.data.actions.remove(action)
        for collection in (bpy.data.armatures, bpy.data.meshes):
            for datablock in list(collection):
                if datablock.users == 0:
                    collection.remove(datablock)


def imported_objects():
    armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    mesh = next(
        obj for obj in bpy.context.scene.objects
        if obj.type == "MESH" and obj.find_armature() == armature
    )
    return armature, mesh


def hierarchy(armature):
    return [
        {
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "head": [round(value, 6) for value in bone.head_local],
            "tail": [round(value, 6) for value in bone.tail_local],
        }
        for bone in armature.data.bones
    ]


def assign_action(armature, action):
    if armature.animation_data is None:
        armature.animation_data_create()
    armature.animation_data.action = action


def sample_original_pose(armature):
    samples = {}
    for action_name in ("Flap", "Glide"):
        action = bpy.data.actions[action_name]
        assign_action(armature, action)
        start, end = (int(round(value)) for value in action.frame_range)
        action_samples = {}
        for frame in range(start, end + 1):
            bpy.context.scene.frame_set(frame)
            action_samples[str(frame)] = {
                name: [round(value, 7) for row in armature.pose.bones[name].matrix_basis for value in row]
                for name in ORIGINAL_BONES
            }
        samples[action_name] = action_samples
    return samples


def add_membrane_bones(armature):
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones = armature.data.edit_bones
    for suffix in ("R", "L"):
        shoulder = edit_bones[f"shoulder.{suffix}"]
        forearm = edit_bones[f"forearm.{suffix}"]
        finger_a = edit_bones[f"fingerA.{suffix}"]
        finger_b = edit_bones[f"fingerB.{suffix}"]
        finger_c = edit_bones[f"fingerC.{suffix}"]
        definitions = (
            (
                f"membraneBody.{suffix}",
                shoulder.head.copy(),
                finger_c.tail.copy(),
                shoulder,
            ),
            (
                f"membraneAB.{suffix}",
                forearm.tail.copy(),
                (finger_a.tail + finger_b.tail) * 0.5,
                forearm,
            ),
            (
                f"membraneBC.{suffix}",
                forearm.tail.copy(),
                (finger_b.tail + finger_c.tail) * 0.5,
                forearm,
            ),
        )
        for name, head, tail, parent in definitions:
            bone = edit_bones.new(name)
            bone.head = head
            bone.tail = tail
            bone.parent = parent
            bone.use_connect = False
            bone.use_deform = True
    bpy.ops.object.mode_set(mode="POSE")
    for name in MEMBRANE_BONES:
        armature.pose.bones[name].rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")


def weight_membrane(mesh_object):
    for name in MEMBRANE_BONES:
        mesh_object.vertex_groups.new(name=name)
    group_index = {group.name: group.index for group in mesh_object.vertex_groups}
    membrane_indices = {name: group_index[name] for name in MEMBRANE_BONES}
    bm = bmesh.new()
    bm.from_mesh(mesh_object.data)
    deform = bm.verts.layers.deform.verify()
    changed = 0
    membrane_weighted = {name: 0 for name in MEMBRANE_BONES}
    for vertex in bm.verts:
        weights = {index: weight for index, weight in vertex[deform].items() if weight > 1e-8}
        side = "R" if vertex.co.x >= 0.0 else "L"
        wing_names = (
            f"shoulder.{side}", f"forearm.{side}",
            f"fingerA.{side}", f"fingerB.{side}", f"fingerC.{side}",
        )
        wing_total = sum(weights.get(group_index[name], 0.0) for name in wing_names)
        if wing_total < 0.05 or vertex.co.z < 0.43:
            continue
        shoulder = weights.get(group_index[f"shoulder.{side}"], 0.0)
        forearm = weights.get(group_index[f"forearm.{side}"], 0.0)
        finger_a = weights.get(group_index[f"fingerA.{side}"], 0.0)
        finger_b = weights.get(group_index[f"fingerB.{side}"], 0.0)
        finger_c = weights.get(group_index[f"fingerC.{side}"], 0.0)
        chest = weights.get(group_index["chest"], 0.0)
        scores = {
            f"membraneBody.{side}": 2.0 * min(finger_c, shoulder + forearm + chest),
            f"membraneAB.{side}": 2.0 * min(finger_a, finger_b),
            f"membraneBC.{side}": 2.0 * min(finger_b, finger_c),
        }
        score_sum = sum(scores.values())
        if score_sum < 0.025:
            continue
        span_gate = min(1.0, max(0.0, (abs(vertex.co.x) - 0.08) / 0.14))
        target = min(0.42, 0.30 * score_sum) * span_gate
        if target < 0.015:
            continue
        candidates = {index: weight * (1.0 - target) for index, weight in weights.items()}
        for name, score in scores.items():
            if score <= 0.0:
                continue
            index = membrane_indices[name]
            candidates[index] = candidates.get(index, 0.0) + target * score / score_sum
        kept = sorted(candidates.items(), key=lambda item: item[1], reverse=True)[:4]
        total = sum(weight for _, weight in kept)
        if total <= 0.0:
            raise RuntimeError(f"Weight loss at vertex {vertex.index}")
        destination = vertex[deform]
        destination.clear()
        for index, weight in kept:
            normalized = weight / total
            destination[index] = normalized
            name = mesh_object.vertex_groups[index].name
            if name in membrane_weighted and normalized > 1e-8:
                membrane_weighted[name] += 1
        changed += 1
    bm.to_mesh(mesh_object.data)
    bm.free()
    mesh_object.data.update()
    return {"changedVertices": changed, "membraneWeightedVertices": membrane_weighted}


def add_animation(armature):
    profiles = {
        "Flap": {
            "frames": (1, 10, 20, 30, 39),
            "values": (0.0, 1.0, 0.0, -0.82, 0.0),
            "stretch": (1.0, 1.035, 1.0, 0.978, 1.0),
        },
        "Glide": {
            "frames": (1, 19, 37, 55, 73),
            "values": (0.0, 0.34, -0.22, 0.28, 0.0),
            "stretch": (1.0, 1.012, 0.992, 1.01, 1.0),
        },
    }
    amplitudes = {
        "membraneBody": math.radians(5.0),
        "membraneAB": math.radians(8.0),
        "membraneBC": math.radians(10.0),
    }
    for action_name, profile in profiles.items():
        action = bpy.data.actions[action_name]
        assign_action(armature, action)
        for name in MEMBRANE_BONES:
            pose_bone = armature.pose.bones[name]
            base = name.split(".")[0]
            mirror = 1.0 if name.endswith(".R") else -1.0
            phase = 0.78 if base == "membraneBody" else 0.92 if base == "membraneAB" else 1.0
            for frame, value, stretch in zip(
                profile["frames"], profile["values"], profile["stretch"]
            ):
                pose_bone.rotation_euler = (
                    amplitudes[base] * value,
                    0.0,
                    mirror * amplitudes[base] * 0.34 * value * phase,
                )
                pose_bone.scale = (1.0, stretch ** phase, 1.0 + (stretch - 1.0) * 0.35)
                pose_bone.keyframe_insert(
                    data_path="rotation_euler", frame=frame, group=pose_bone.name
                )
                pose_bone.keyframe_insert(
                    data_path="scale", frame=frame, group=pose_bone.name
                )
            pose_bone.rotation_euler = (0.0, 0.0, 0.0)
            pose_bone.scale = (1.0, 1.0, 1.0)
    bpy.context.scene.frame_set(1)


def weight_stats(mesh_object):
    counts = {str(count): 0 for count in range(5)}
    zero_weight = 0
    over_four = 0
    min_sum = float("inf")
    max_sum = 0.0
    membrane_counts = {name: 0 for name in MEMBRANE_BONES}
    membrane_indices = {
        mesh_object.vertex_groups[name].index: name
        for name in MEMBRANE_BONES
        if name in mesh_object.vertex_groups
    }
    for vertex in mesh_object.data.vertices:
        positive = [(entry.group, entry.weight) for entry in vertex.groups if entry.weight > 1e-8]
        count = len(positive)
        counts[str(min(count, 4))] += 1 if count <= 4 else 0
        zero_weight += count == 0
        over_four += count > 4
        weight_sum = sum(weight for _, weight in positive)
        min_sum = min(min_sum, weight_sum)
        max_sum = max(max_sum, weight_sum)
        for index, _ in positive:
            if index in membrane_indices:
                membrane_counts[membrane_indices[index]] += 1
    return {
        "vertices": len(mesh_object.data.vertices),
        "zeroWeight": zero_weight,
        "overFour": over_four,
        "influences": counts,
        "minSum": min_sum,
        "maxSum": max_sum,
        "membraneWeightedVertices": membrane_counts,
    }


def validate_pose(armature, original_samples):
    max_error = 0.0
    for action_name, frames in original_samples.items():
        assign_action(armature, bpy.data.actions[action_name])
        for frame_text, bones in frames.items():
            bpy.context.scene.frame_set(int(frame_text))
            for name, expected in bones.items():
                actual = [value for row in armature.pose.bones[name].matrix_basis for value in row]
                max_error = max(
                    max_error,
                    max(abs(left - right) for left, right in zip(actual, expected)),
                )
    return max_error


clear_scene(purge_data=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source_armature, source_mesh = imported_objects()
source_hierarchy = hierarchy(source_armature)
original_samples = sample_original_pose(source_armature)
source_actions = {
    action.name: [float(value) for value in action.frame_range]
    for action in bpy.data.actions
}
add_membrane_bones(source_armature)
weight_result = weight_membrane(source_mesh)
add_animation(source_armature)
pre_export_weights = weight_stats(source_mesh)
if pre_export_weights["zeroWeight"] or pre_export_weights["overFour"]:
    raise RuntimeError(f"Invalid source weights: {pre_export_weights}")

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,
    export_skins=True,
    export_influence_nb=4,
    export_all_influences=False,
    export_leaf_bone=False,
    export_optimize_animation_size=True,
)

clear_scene(purge_data=True)
bpy.ops.import_scene.gltf(filepath=str(OUTPUT))
exported_armature, exported_mesh = imported_objects()
post_export_weights = weight_stats(exported_mesh)
exported_actions = {
    action.name: [float(value) for value in action.frame_range]
    for action in bpy.data.actions
}
pose_error = validate_pose(exported_armature, original_samples)
exported_bones = [bone.name for bone in exported_armature.data.bones]
required_actions = {"Flap": [1.0, 39.0], "Glide": [1.0, 73.0]}
if post_export_weights["zeroWeight"] or post_export_weights["overFour"]:
    raise RuntimeError(f"Invalid exported weights: {post_export_weights}")
if any(exported_actions.get(name) != frame_range for name, frame_range in required_actions.items()):
    raise RuntimeError(f"Animation contract changed: {exported_actions}")
if any(name not in exported_bones for name in ORIGINAL_BONES + MEMBRANE_BONES):
    raise RuntimeError("Exported skeleton is missing required bones")
if pose_error > 2e-4:
    raise RuntimeError(f"Existing animation changed; max matrix error {pose_error}")

report = {
    "source": str(SOURCE),
    "output": str(OUTPUT),
    "sourceHierarchy": source_hierarchy,
    "sourceActions": source_actions,
    "membraneBones": [
        item for item in hierarchy(exported_armature) if item["name"] in MEMBRANE_BONES
    ],
    "weighting": weight_result,
    "preExportWeights": pre_export_weights,
    "postExportWeights": post_export_weights,
    "exportedActions": exported_actions,
    "originalAnimationMaxMatrixError": pose_error,
    "outputBytes": OUTPUT.stat().st_size,
}
REPORT.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, separators=(",", ":")))
