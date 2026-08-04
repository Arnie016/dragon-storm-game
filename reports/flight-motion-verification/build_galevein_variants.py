import array
import hashlib
import json
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


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
GLB_JSON = 0x4E4F534A
GLB_BIN = 0x004E4942


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
    for collection in (bpy.data.actions, bpy.data.armatures, bpy.data.meshes):
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
    digest = hashlib.sha256()
    for polygon in mesh.data.polygons:
        digest.update(len(polygon.vertices).to_bytes(2, "little"))
        for index in polygon.vertices:
            digest.update(int(index).to_bytes(4, "little"))
    return {
        "vertices": len(mesh.data.vertices),
        "edges": len(mesh.data.edges),
        "polygons": len(mesh.data.polygons),
        "loops": len(mesh.data.loops),
        "polygonIndexSha256": digest.hexdigest(),
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


def calculate_sculpt(mesh, variant):
    group_names = {group.index: group.name for group in mesh.vertex_groups}
    delta_function = DELTA_FUNCTIONS[variant]
    source = []
    expected = []
    deltas = []
    moved = 0
    max_displacement = 0.0
    displacement_sum = 0.0
    for vertex in mesh.data.vertices:
        coordinate = vertex.co.copy()
        weights = {
            group_names[entry.group]: entry.weight
            for entry in vertex.groups if entry.weight > 1e-8
        }
        delta = delta_function(coordinate, weights)
        source.append(coordinate)
        deltas.append(delta)
        expected.append(coordinate + delta)
        distance = delta.length
        moved += distance > 1e-7
        max_displacement = max(max_displacement, distance)
        displacement_sum += distance
    return {
        "source": source,
        "expected": expected,
        "deltas": deltas,
        "movedVertices": moved,
        "maxDisplacement": max_displacement,
        "meanDisplacement": displacement_sum / len(source),
    }


def parse_glb(path):
    data = path.read_bytes()
    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total_length != len(data):
        raise RuntimeError(f"Invalid GLB header: {path}")
    offset = 12
    chunks = {}
    while offset < len(data):
        length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunks[chunk_type] = data[offset:offset + length]
        offset += length
    document = json.loads(chunks[GLB_JSON].rstrip(b" \x00").decode())
    return document, chunks[GLB_BIN]


def draco_payload(document, binary):
    extension = document["meshes"][0]["primitives"][0]["extensions"][
        "KHR_draco_mesh_compression"
    ]
    view = document["bufferViews"][extension["bufferView"]]
    start = view.get("byteOffset", 0)
    return binary[start:start + view["byteLength"]]


def write_morph_glb(source, output, values, count, minimum, maximum, target_name):
    document, binary = parse_glb(source)
    primitive = document["meshes"][0]["primitives"][0]
    if primitive.get("targets"):
        raise RuntimeError(f"{source.name} already has morph targets")
    if sys.byteorder != "little":
        values.byteswap()
    delta_bytes = values.tobytes()
    logical_length = document["buffers"][0]["byteLength"]
    binary = binary[:logical_length]
    padding = (-len(binary)) % 4
    binary += b"\x00" * padding
    byte_offset = len(binary)
    binary += delta_bytes
    view_index = len(document.setdefault("bufferViews", []))
    document["bufferViews"].append({
        "buffer": 0,
        "byteOffset": byte_offset,
        "byteLength": len(delta_bytes),
        "target": 34962,
    })
    accessor_index = len(document.setdefault("accessors", []))
    document["accessors"].append({
        "bufferView": view_index,
        "byteOffset": 0,
        "componentType": 5126,
        "count": count,
        "type": "VEC3",
        "min": minimum,
        "max": maximum,
    })
    primitive["targets"] = [{"POSITION": accessor_index}]
    mesh = document["meshes"][0]
    mesh["weights"] = [1.0]
    mesh.setdefault("extras", {})["targetNames"] = [target_name]
    document["buffers"][0]["byteLength"] = len(binary)
    json_bytes = json.dumps(document, separators=(",", ":")).encode()
    json_bytes += b" " * ((-len(json_bytes)) % 4)
    binary += b"\x00" * ((-len(binary)) % 4)
    total_length = 12 + 8 + len(json_bytes) + 8 + len(binary)
    output.write_bytes(
        struct.pack("<4sII", b"glTF", 2, total_length)
        + struct.pack("<II", len(json_bytes), GLB_JSON) + json_bytes
        + struct.pack("<II", len(binary), GLB_BIN) + binary
    )


def derive_accessor_mapping(source, count, rig):
    epsilon = 1e-5
    values = array.array("f", [0.0]) * (count * 3)
    for index in range(count):
        values[index * 3] = index * epsilon
    temporary = Path(f"/tmp/galevein-{rig}-accessor-map.glb")
    write_morph_glb(
        source,
        temporary,
        values,
        count,
        [0.0, 0.0, 0.0],
        [(count - 1) * epsilon, 0.0, 0.0],
        "AccessorIndexMap",
    )
    _, mesh = import_rig(temporary)
    shape_keys = mesh.data.shape_keys.key_blocks
    basis, target = shape_keys[0], shape_keys[1]
    mapping = array.array("I")
    seen = bytearray(count)
    max_decode_error = 0.0
    for index in range(count):
        encoded_value = target.data[index].co.x - basis.data[index].co.x
        logical_index = int(round(encoded_value / epsilon))
        if logical_index < 0 or logical_index >= count or seen[logical_index]:
            raise RuntimeError(
                f"Invalid Draco accessor permutation for {rig} at decoded {index}: "
                f"{logical_index}"
            )
        seen[logical_index] = 1
        mapping.append(logical_index)
        max_decode_error = max(
            max_decode_error, abs(encoded_value - logical_index * epsilon)
        )
    temporary.unlink()
    digest = hashlib.sha256(mapping.tobytes()).hexdigest()
    return mapping, {
        "vertices": count,
        "permutationPass": all(seen),
        "maxIndexSignalDecodeError": max_decode_error,
        "decodedToAccessorSha256": digest,
    }


def patch_glb_with_morph(source, output, deltas, target_name, mapping):
    values = array.array("f", [0.0]) * (len(deltas) * 3)
    minimum = [float("inf")] * 3
    maximum = [float("-inf")] * 3
    for decoded_index, delta in enumerate(deltas):
        logical_index = mapping[decoded_index]
        gltf_delta = (delta.x, delta.z, -delta.y)
        for axis in range(3):
            value = gltf_delta[axis]
            values[logical_index * 3 + axis] = value
            minimum[axis] = min(minimum[axis], value)
            maximum[axis] = max(maximum[axis], value)
    write_morph_glb(
        source, output, values, len(deltas), minimum, maximum, target_name
    )


def compare_coordinates(expected, actual):
    if len(expected) != len(actual):
        return {"pass": False, "maxError": None, "mismatchesAbove2e4": None}
    max_error = 0.0
    mismatches = 0
    for left, right in zip(expected, actual):
        error = (left - right).length
        max_error = max(max_error, error)
        mismatches += error > 2e-4
    return {
        "pass": mismatches == 0,
        "maxError": max_error,
        "mismatchesAbove2e4": mismatches,
    }


def validate_output(source, output, source_coordinates, expected, source_topology):
    source_document, source_binary = parse_glb(source)
    output_document, output_binary = parse_glb(output)
    source_draco = draco_payload(source_document, source_binary)
    output_draco = draco_payload(output_document, output_binary)
    armature, mesh = import_rig(output)
    topology = topology_contract(mesh)
    weights = weight_stats(mesh, armature)
    actions = action_ranges()
    shape_keys = mesh.data.shape_keys.key_blocks if mesh.data.shape_keys else []
    if len(shape_keys) != 2:
        raise RuntimeError(f"{output.name} imported with {len(shape_keys)} shape keys")
    basis = shape_keys[0]
    target = shape_keys[1]
    basis_order = compare_coordinates(source_coordinates, [item.co for item in basis.data])
    target_order = compare_coordinates(expected, [item.co for item in target.data])
    validation = {
        "topology": topology,
        "vertexCountUnchanged": topology["vertices"] == source_topology["vertices"],
        "edgeCountUnchanged": topology["edges"] == source_topology["edges"],
        "polygonCountUnchanged": topology["polygons"] == source_topology["polygons"],
        "polygonOrderingUnchanged": (
            topology["polygonIndexSha256"] == source_topology["polygonIndexSha256"]
        ),
        "baseVertexOrdering": basis_order,
        "morphVertexOrdering": target_order,
        "dracoPayloadByteIdentical": source_draco == output_draco,
        "dracoPayloadSha256": hashlib.sha256(output_draco).hexdigest(),
        "morphDefaultWeight": target.value,
        "weights": weights,
        "actions": actions,
        "requiredActionsPass": all(
            actions.get(name) == frame_range
            for name, frame_range in REQUIRED_ACTIONS.items()
        ),
        "outputBytes": output.stat().st_size,
    }
    validation["pass"] = all((
        validation["vertexCountUnchanged"],
        validation["edgeCountUnchanged"],
        validation["polygonCountUnchanged"],
        validation["polygonOrderingUnchanged"],
        basis_order["pass"],
        target_order["pass"],
        validation["dracoPayloadByteIdentical"],
        abs(target.value - 1.0) < 1e-6,
        weights["zeroWeight"] == 0,
        weights["overFour"] == 0,
        weights["negativeWeights"] == 0,
        weights["invalidJoints"] == 0,
        weights["deviates1e3"] == 0,
        validation["requiredActionsPass"],
    ))
    if not validation["pass"]:
        raise RuntimeError(f"Validation failed for {output.name}: {validation}")
    return armature, mesh, validation


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_angles(variant, armature, mesh):
    render_dir = REPORT_DIR / "renders"
    render_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.018, 0.026, 0.045)
    material = bpy.data.materials.new(f"{variant}_clay")
    material.diffuse_color = (0.12, 0.31, 0.42, 1.0)
    material.metallic = 0.22
    material.roughness = 0.38
    mesh.data.materials.clear()
    mesh.data.materials.append(material)
    if armature.animation_data:
        armature.animation_data.action = None
    bpy.context.scene.frame_set(1)
    camera_data = bpy.data.cameras.new("ComparisonCamera")
    camera = bpy.data.objects.new("ComparisonCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.data.lens = 58
    scene.camera = camera
    for location, energy, size in (
        ((1.25, -1.3, 1.55), 1100, 3.0),
        ((-1.0, -0.4, 1.1), 800, 2.5),
        ((0.0, 1.2, 1.4), 950, 2.4),
    ):
        light_data = bpy.data.lights.new("StudioArea", "AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size
        light = bpy.data.objects.new("StudioArea", light_data)
        light.location = location
        point_at(light, (0.0, 0.0, 0.38))
        bpy.context.collection.objects.link(light)
    views = {
        "front": ((0.0, -1.55, 0.55), (0.0, 0.0, 0.34)),
        "side": ((1.40, -0.05, 0.55), (0.0, 0.0, 0.34)),
        "threequarter": ((1.05, -1.18, 0.88), (0.0, 0.0, 0.34)),
    }
    paths = {}
    for name, (location, target) in views.items():
        camera.location = location
        point_at(camera, target)
        path = render_dir / f"{variant}-{name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        paths[name] = str(path)
    return paths


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {"strategy": (
        "The original Draco primitive is retained byte-for-byte. A single default-on "
        "POSITION morph target stores the displacement, preserving base vertex indices, "
        "topology, skin attributes, and animation data exactly."
    ), "accessorMappings": {}, "variants": {}}
    mappings = {}
    for rig, source in SOURCES.items():
        _, mesh = import_rig(source)
        mappings[rig], mapping_report = derive_accessor_mapping(
            source, len(mesh.data.vertices), rig
        )
        report["accessorMappings"][rig] = mapping_report
    for variant in VARIANTS:
        report["variants"][variant] = {}
        for rig, source in SOURCES.items():
            armature, mesh = import_rig(source)
            source_topology = topology_contract(mesh)
            source_weights = weight_stats(mesh, armature)
            source_actions = action_ranges()
            sculpt = calculate_sculpt(mesh, variant)
            output = OUTPUTS[(variant, rig)]
            patch_glb_with_morph(
                source,
                output,
                sculpt["deltas"],
                f"Galevein_{variant}",
                mappings[rig],
            )
            validated_armature, validated_mesh, validation = validate_output(
                source, output, sculpt["source"], sculpt["expected"], source_topology
            )
            entry = {
                "source": str(source),
                "output": str(output),
                "query": variant if rig == "corrected" else f"{variant}-membrane",
                "sourceTopology": source_topology,
                "sourceWeights": source_weights,
                "sourceActions": source_actions,
                "sculpt": {
                    "movedVertices": sculpt["movedVertices"],
                    "maxDisplacement": sculpt["maxDisplacement"],
                    "meanDisplacement": sculpt["meanDisplacement"],
                },
                "validation": validation,
            }
            if rig == "corrected":
                entry["renders"] = render_angles(variant, validated_armature, validated_mesh)
            report["variants"][variant][rig] = entry
    report_path = REPORT_DIR / "build-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print("GALEVEIN_VARIANTS=" + json.dumps(report, separators=(",", ":")))


if __name__ == "__main__":
    main()
