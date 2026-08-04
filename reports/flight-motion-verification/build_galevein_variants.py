import array
import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector, kdtree


ROOT = Path("/Users/arnav/Desktop/dragon-storm-game")
REPORT_DIR = ROOT / "reports/galevein-silhouette-variants"
SOURCES = {
    "corrected": ROOT / "dragon_rigged_corrected.glb",
    "membrane": ROOT / "dragon_rigged_membrane.glb",
}
VARIANTS = ("stormcrest", "voltspine", "thunderhook")
OUTPUTS = {
    (variant, rig): ROOT / f"dragon_galevein_{variant}_{rig}.glb"
    for variant in VARIANTS
    for rig in SOURCES
}
REQUIRED_ACTIONS = {"Flap": [1.0, 39.0], "Glide": [1.0, 73.0]}
DRACO_SETTINGS = {
    "compressionLevel": 6,
    "positionQuantizationBits": 14,
    "normalQuantizationBits": 10,
    "texcoordQuantizationBits": 12,
    "colorQuantizationBits": 10,
    "genericQuantizationBits": 12,
}
REGION_NAMES = ("head", "snout", "earFinsCrest", "neck", "torso", "limbs", "tail")
LIMB_PREFIXES = ("shoulder.", "forearm.", "finger", "thigh.", "shin.", "foot.")


def clamp(value, low=0.0, high=1.0):
    return min(high, max(low, value))


def smoothstep(edge0, edge1, value):
    t = clamp((value - edge0) / (edge1 - edge0))
    return t * t * (3.0 - 2.0 * t)


def body_weights(weights):
    return {
        "head": weights.get("head", 0.0),
        "neck": weights.get("neck", 0.0),
        "chest": weights.get("chest", 0.0),
        "hips": weights.get("hips", 0.0),
        "tail": sum(weights.get(f"tail{index}", 0.0) for index in range(1, 6)),
    }


def stormcrest_delta(coordinate, weights):
    x, y, z = coordinate
    parts = body_weights(weights)
    head, neck = parts["head"], parts["neck"]
    torso = clamp(parts["chest"] + parts["hips"])
    tail = parts["tail"]
    snout = head * smoothstep(0.25, 0.43, -y)
    brow = head * smoothstep(0.57, 0.68, z) * smoothstep(0.23, 0.39, -y)
    crest = (
        head * smoothstep(0.60, 0.70, z)
        * smoothstep(0.025, 0.072, abs(x))
        * (1.0 - smoothstep(0.34, 0.43, -y))
    )
    tail_tip = tail * smoothstep(0.32, 0.445, y)
    return Vector((
        -x * (0.40 * snout + 0.58 * crest + 0.68 * tail_tip) + x * 0.15 * neck,
        -0.095 * snout + 0.105 * crest + 0.045 * tail_tip,
        0.025 * brow + 0.060 * crest + (z - 0.34) * 0.13 * torso
        + (z - 0.53) * 0.10 * neck + abs(x) * 0.82 * tail_tip,
    ))


def voltspine_delta(coordinate, weights):
    x, y, z = coordinate
    parts = body_weights(weights)
    head, neck = parts["head"], parts["neck"]
    torso = clamp(parts["chest"] + parts["hips"])
    tail = parts["tail"]
    snout = head * smoothstep(0.26, 0.43, -y)
    crown = (
        head * smoothstep(0.59, 0.70, z)
        * smoothstep(0.018, 0.074, abs(x))
        * (1.0 - smoothstep(0.35, 0.43, -y))
    )
    skull = head * smoothstep(0.50, 0.67, z)
    tail_tip = tail * smoothstep(0.33, 0.445, y)
    return Vector((
        -x * (0.52 * snout + 0.73 * crown + 0.61 * tail_tip) - x * 0.12 * torso,
        -0.052 * snout + 0.035 * crown + 0.030 * tail_tip,
        (z - 0.57) * 0.18 * skull + 0.105 * crown
        + (z - 0.34) * 0.18 * torso + (z - 0.52) * 0.13 * neck
        + x * 1.05 * tail_tip,
    ))


def thunderhook_delta(coordinate, weights):
    x, y, z = coordinate
    parts = body_weights(weights)
    head, neck = parts["head"], parts["neck"]
    torso = clamp(parts["chest"] + parts["hips"])
    tail = parts["tail"]
    snout = head * smoothstep(0.24, 0.43, -y)
    hook = snout * smoothstep(0.31, 0.44, -y)
    ridge = (
        head * smoothstep(0.59, 0.70, z)
        * smoothstep(0.028, 0.074, abs(x))
        * (1.0 - smoothstep(0.35, 0.43, -y))
    )
    tail_tip = tail * smoothstep(0.31, 0.445, y)
    return Vector((
        -x * (0.47 * snout + 0.16 * ridge + 0.72 * tail_tip) + x * 0.22 * neck,
        -0.080 * snout + 0.120 * abs(x) * ridge + 0.070 * tail_tip,
        -0.062 * hook - (z - 0.605) * 0.46 * ridge
        + (z - 0.52) * 0.15 * neck + (z - 0.34) * 0.08 * torso
        - (z - 0.035) * 0.42 * tail_tip,
    ))


DELTA_FUNCTIONS = {
    "stormcrest": stormcrest_delta,
    "voltspine": voltspine_delta,
    "thunderhook": thunderhook_delta,
}


def clear_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.actions,
        bpy.data.armatures,
        bpy.data.meshes,
        bpy.data.materials,
    ):
        for datablock in list(collection):
            if datablock.users == 0:
                collection.remove(datablock)


def import_rig(path):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    mesh = max(
        (obj for obj in bpy.context.scene.objects if obj.type == "MESH"),
        key=lambda obj: len(obj.data.vertices),
    )
    armature = mesh.find_armature()
    if armature is None:
        raise RuntimeError(f"{path.name} imported without an armature")
    return armature, mesh


def action_ranges():
    return {
        action.name: [float(value) for value in action.frame_range]
        for action in bpy.data.actions
    }


def topology_contract(mesh):
    return {
        "vertices": len(mesh.data.vertices),
        "edges": len(mesh.data.edges),
        "polygons": len(mesh.data.polygons),
        "loops": len(mesh.data.loops),
    }


def weight_stats(mesh, armature):
    group_names = {group.index: group.name for group in mesh.vertex_groups}
    bone_names = {bone.name for bone in armature.data.bones}
    influences = {str(count): 0 for count in range(5)}
    result = {
        "vertices": len(mesh.data.vertices),
        "zeroWeight": 0,
        "overFour": 0,
        "negativeWeights": 0,
        "invalidJoints": 0,
        "deviates1e3": 0,
        "minSum": float("inf"),
        "maxSum": 0.0,
        "influences": influences,
    }
    for vertex in mesh.data.vertices:
        result["negativeWeights"] += sum(entry.weight < 0.0 for entry in vertex.groups)
        positive = [entry for entry in vertex.groups if entry.weight > 1e-8]
        count = len(positive)
        result["zeroWeight"] += count == 0
        result["overFour"] += count > 4
        if count <= 4:
            influences[str(count)] += 1
        weight_sum = sum(entry.weight for entry in positive)
        result["minSum"] = min(result["minSum"], weight_sum)
        result["maxSum"] = max(result["maxSum"], weight_sum)
        result["deviates1e3"] += abs(weight_sum - 1.0) > 1e-3
        result["invalidJoints"] += sum(
            group_names.get(entry.group) not in bone_names for entry in positive
        )
    return result


def vertex_regions(coordinate, weights):
    x, y, z = coordinate
    regions = []
    head = weights.get("head", 0.0)
    neck = weights.get("neck", 0.0)
    torso = weights.get("chest", 0.0) + weights.get("hips", 0.0)
    tail = sum(weights.get(f"tail{index}", 0.0) for index in range(1, 6))
    limbs = sum(
        weight for name, weight in weights.items()
        if name.startswith(LIMB_PREFIXES)
    )
    if head > 0.05:
        regions.append("head")
        if y < -0.31:
            regions.append("snout")
        if z > 0.59 and abs(x) > 0.018 and y > -0.36:
            regions.append("earFinsCrest")
    if neck > 0.05:
        regions.append("neck")
    if torso > 0.05:
        regions.append("torso")
    if limbs > 0.05:
        regions.append("limbs")
    if tail > 0.05:
        regions.append("tail")
    return regions, tail > 0.05


def derive_sculpt(mesh, variant):
    group_names = {group.index: group.name for group in mesh.vertex_groups}
    delta_function = DELTA_FUNCTIONS[variant]
    source = [vertex.co.copy() for vertex in mesh.data.vertices]
    body_length = max(co.y for co in source) - min(co.y for co in source)
    deltas = []
    region_accumulators = {
        name: {"vertices": 0, "sum": 0.0, "max": 0.0}
        for name in REGION_NAMES
    }
    tail_flags = bytearray(len(source))
    for index, (vertex, coordinate) in enumerate(zip(mesh.data.vertices, source)):
        weights = {
            group_names[entry.group]: entry.weight
            for entry in vertex.groups if entry.weight > 1e-8
        }
        delta = delta_function(coordinate, weights)
        deltas.append(delta)
        distance = delta.length
        regions, is_tail = vertex_regions(coordinate, weights)
        tail_flags[index] = is_tail
        for name in regions:
            stats = region_accumulators[name]
            stats["vertices"] += 1
            stats["sum"] += distance
            stats["max"] = max(stats["max"], distance)
    region_stats = {}
    for name, stats in region_accumulators.items():
        mean = stats["sum"] / stats["vertices"] if stats["vertices"] else 0.0
        region_stats[name] = {
            "vertices": stats["vertices"],
            "meanWorldUnits": mean,
            "maxWorldUnits": stats["max"],
            "meanPercentBodyLength": mean / body_length * 100.0,
            "maxPercentBodyLength": stats["max"] / body_length * 100.0,
        }
    expected = [coordinate + delta for coordinate, delta in zip(source, deltas)]
    tail_stretch = edge_stretch(mesh, source, expected, tail_flags)
    return {
        "deltas": deltas,
        "expected": expected,
        "bodyLength": body_length,
        "regions": region_stats,
        "tailEdgeStretch": tail_stretch,
    }


def edge_stretch(mesh, source, expected, tail_flags):
    count = 0
    ratio_sum = 0.0
    min_ratio = float("inf")
    max_ratio = 0.0
    for edge in mesh.data.edges:
        left, right = edge.vertices
        if not (tail_flags[left] or tail_flags[right]):
            continue
        before = (source[left] - source[right]).length
        if before <= 1e-10:
            continue
        ratio = (expected[left] - expected[right]).length / before
        count += 1
        ratio_sum += ratio
        min_ratio = min(min_ratio, ratio)
        max_ratio = max(max_ratio, ratio)
    return {
        "edges": count,
        "meanRatio": ratio_sum / count if count else 1.0,
        "minRatio": min_ratio if count else 1.0,
        "maxRatio": max_ratio,
    }


def derive_membrane_mapping(corrected_coordinates):
    tree = kdtree.KDTree(len(corrected_coordinates))
    for index, coordinate in enumerate(corrected_coordinates):
        tree.insert(coordinate, index)
    tree.balance()
    _, membrane_mesh = import_rig(SOURCES["membrane"])
    mapping = array.array("I")
    distances = []
    for vertex in membrane_mesh.data.vertices:
        _, index, distance = tree.find(vertex.co)
        mapping.append(index)
        distances.append(distance)
    distances.sort()
    return mapping, {
        "vertices": len(mapping),
        "meanNearestDistance": sum(distances) / len(distances),
        "p95NearestDistance": distances[int(len(distances) * 0.95)],
        "maxNearestDistance": distances[-1],
    }


def apply_deltas(mesh, deltas, mapping=None):
    if mapping is None:
        for vertex, delta in zip(mesh.data.vertices, deltas):
            vertex.co += delta
    else:
        for vertex, corrected_index in zip(mesh.data.vertices, mapping):
            vertex.co += deltas[corrected_index]
    if getattr(mesh.data, "has_custom_normals", False):
        bpy.context.view_layer.objects.active = mesh
        mesh.select_set(True)
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    mesh.data.update()


def export_baked(path):
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_SETTINGS["compressionLevel"],
        export_draco_position_quantization=DRACO_SETTINGS["positionQuantizationBits"],
        export_draco_normal_quantization=DRACO_SETTINGS["normalQuantizationBits"],
        export_draco_texcoord_quantization=DRACO_SETTINGS["texcoordQuantizationBits"],
        export_draco_color_quantization=DRACO_SETTINGS["colorQuantizationBits"],
        export_draco_generic_quantization=DRACO_SETTINGS["genericQuantizationBits"],
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_skins=True,
        export_influence_nb=4,
        export_all_influences=False,
        export_leaf_bone=False,
        export_optimize_animation_size=True,
    )


def glb_contract(path):
    data = path.read_bytes()
    json_length = int.from_bytes(data[12:16], "little")
    document = json.loads(data[20:20 + json_length].rstrip(b" \x00").decode())
    primitive = document["meshes"][0]["primitives"][0]
    attributes = {
        name: document["accessors"][accessor]["count"]
        for name, accessor in primitive["attributes"].items()
    }
    return {
        "dracoCompressed": "KHR_draco_mesh_compression" in primitive.get("extensions", {}),
        "morphTargets": len(primitive.get("targets", [])),
        "meshWeights": document["meshes"][0].get("weights", []),
        "attributeCounts": attributes,
    }


def surface_shift(expected, exported_vertices, sample_limit=100000):
    tree = kdtree.KDTree(len(exported_vertices))
    for index, vertex in enumerate(exported_vertices):
        tree.insert(vertex.co, index)
    tree.balance()
    stride = max(1, len(expected) // sample_limit)
    distances = []
    for index in range(0, len(expected), stride):
        _, _, distance = tree.find(expected[index])
        distances.append(distance)
    distances.sort()
    return {
        "sampledVertices": len(distances),
        "meanWorldUnits": sum(distances) / len(distances),
        "p95WorldUnits": distances[int(len(distances) * 0.95)],
        "maxWorldUnits": distances[-1],
    }


def validate_export(path, expected, source_topology):
    armature, mesh = import_rig(path)
    topology = topology_contract(mesh)
    weights = weight_stats(mesh, armature)
    actions = action_ranges()
    contract = glb_contract(path)
    shift = surface_shift(expected, mesh.data.vertices)
    attribute_counts = contract["attributeCounts"]
    required_attributes = ("POSITION", "NORMAL", "TEXCOORD_0", "JOINTS_0", "WEIGHTS_0")
    attributes_aligned = all(
        attribute_counts.get(name) == source_topology["vertices"]
        for name in required_attributes
    )
    validation = {
        "topology": topology,
        "vertexCountUnchanged": topology["vertices"] == source_topology["vertices"],
        "edgeCountUnchanged": topology["edges"] == source_topology["edges"],
        "polygonCountUnchanged": topology["polygons"] == source_topology["polygons"],
        "weights": weights,
        "actions": actions,
        "requiredActionsPass": all(
            actions.get(name) == frame_range
            for name, frame_range in REQUIRED_ACTIONS.items()
        ),
        "glb": contract,
        "requiredAttributeCountsAligned": attributes_aligned,
        "normalLoops": len(mesh.data.corner_normals),
        "surfaceShiftAfterDraco": shift,
        "positionQuantizationStepUpperBound": (
            max(mesh.dimensions) / ((2 ** DRACO_SETTINGS["positionQuantizationBits"]) - 1)
        ),
        "outputBytes": path.stat().st_size,
    }
    validation["pass"] = all((
        validation["vertexCountUnchanged"],
        validation["edgeCountUnchanged"],
        validation["polygonCountUnchanged"],
        weights["zeroWeight"] == 0,
        weights["overFour"] == 0,
        weights["negativeWeights"] == 0,
        weights["invalidJoints"] == 0,
        weights["deviates1e3"] == 0,
        validation["requiredActionsPass"],
        contract["dracoCompressed"],
        contract["morphTargets"] == 0,
        not contract["meshWeights"],
        attributes_aligned,
        validation["normalLoops"] == source_topology["loops"],
    ))
    if not validation["pass"]:
        raise RuntimeError(f"Validation failed for {path.name}: {validation}")
    return validation


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    _, corrected_mesh = import_rig(SOURCES["corrected"])
    corrected_coordinates = [vertex.co.copy() for vertex in corrected_mesh.data.vertices]
    membrane_mapping, mapping_report = derive_membrane_mapping(corrected_coordinates)
    del corrected_coordinates
    report = {
        "strategy": (
            "Displacements are baked into base POSITION, geometric normals are "
            "recomputed, and every primitive attribute is jointly re-encoded with Draco."
        ),
        "dracoSettings": DRACO_SETTINGS,
        "membraneToCorrectedGeometryMapping": mapping_report,
        "variants": {},
    }
    for variant in VARIANTS:
        report["variants"][variant] = {}
        corrected_armature, corrected_mesh = import_rig(SOURCES["corrected"])
        corrected_topology = topology_contract(corrected_mesh)
        sculpt = derive_sculpt(corrected_mesh, variant)
        apply_deltas(corrected_mesh, sculpt["deltas"])
        corrected_output = OUTPUTS[(variant, "corrected")]
        export_baked(corrected_output)
        corrected_validation = validate_export(
            corrected_output, sculpt["expected"], corrected_topology
        )
        del sculpt["expected"]
        report["variants"][variant]["corrected"] = {
            "source": str(SOURCES["corrected"]),
            "output": str(corrected_output),
            "query": variant,
            "bodyLengthWorldUnits": sculpt["bodyLength"],
            "regionDisplacements": sculpt["regions"],
            "tailEdgeStretch": sculpt["tailEdgeStretch"],
            "validation": corrected_validation,
        }

        membrane_armature, membrane_mesh = import_rig(SOURCES["membrane"])
        membrane_topology = topology_contract(membrane_mesh)
        membrane_expected = [
            vertex.co + sculpt["deltas"][corrected_index]
            for vertex, corrected_index in zip(membrane_mesh.data.vertices, membrane_mapping)
        ]
        apply_deltas(membrane_mesh, sculpt["deltas"], membrane_mapping)
        membrane_output = OUTPUTS[(variant, "membrane")]
        export_baked(membrane_output)
        membrane_validation = validate_export(
            membrane_output, membrane_expected, membrane_topology
        )
        report["variants"][variant]["membrane"] = {
            "source": str(SOURCES["membrane"]),
            "output": str(membrane_output),
            "query": f"{variant}-membrane",
            "validation": membrane_validation,
        }
    report_path = REPORT_DIR / "build-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print("GALEVEIN_BAKED=" + json.dumps(report, separators=(",", ":")))


if __name__ == "__main__":
    main()
