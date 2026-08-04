# Hero creature replacement — free, commercially-licensable options

Research-only pass. No game code, asset, or GLB was modified. No asset was downloaded, no
account created, no payment made or considered.

## Commercial and legal boundary

This is a licensing-evidence and risk-reduction document, not legal advice and not legal
clearance. Every licence statement below is recorded with the primary source it came from
so the owner can re-check it independently. Nothing here establishes that any legal
threshold has been met. A qualified reviewer should assess any candidate before commercial
release.

One point deserves emphasis because it recurs across every marketplace surveyed: **a
licence label on an upload is a claim made by the uploader, not verified provenance.** A
model tagged CC-BY by someone who does not own the underlying design conveys nothing. This
was not a theoretical concern in this survey — it disqualified several otherwise attractive
candidates, listed in the rejection table.

## Why the current asset has to go, on two counts

- **Design risk.** Established in `reports/galevein-silhouette-variants/REPORT.md`. The
  topology-preserving route is closed and is not revisited here.
- **Performance.** The current hero is 1,080,189 vertices / 468,563 polygons in a 15–16 MiB
  Draco GLB, skinned every frame. Frame-time budget is p95 25 ms and the most recent
  full-scene measurement was 25.0 ms with no headroom, with more landmark geometry still
  inbound. Every candidate below is between 51× and 993× lighter in vertex count.

  *Inference, not measurement:* skinned-vertex cost scales roughly linearly with vertex
  count, so a ~20k-vertex hero should return most of the dragon's share of frame time. I
  did not re-measure, because measuring would mean loading a replacement asset, which is
  outside this task's read-only scope. The prior report measured the current dragon at p95
  9.3 ms in an isolated visible-tab sample; that is the order of magnitude at stake, but it
  is not a like-for-like prediction.

## Verification method

- Licences were read from the asset page or the creator's own site. For Sketchfab this
  means the public `api.sketchfab.com/v3/models/<uid>` record, which returns the same
  `license.label`, `license.url`, and `license.requirements` fields the model page renders.
- Vertex and face counts are the host's own reported geometry metadata, not my estimates,
  except where explicitly marked as an estimate.
- Silhouettes were judged from each model's own full-resolution preview render, viewed this
  session. No asset files were fetched.
- Where a fact could not be verified without downloading, signing up, or opening the file,
  it is marked **unverified** and not relied on.

## Verified candidates

Vertex counts are as reported by the host. "Tris" is used where the host reports triangles
rather than vertices; for these low-poly models vertex count is of the same order.

| # | Model / source | Licence (exact terms that matter) | Attribution obligation | Rigged | Animation | Geometry | Silhouette vs non-derivative test | Art-direction fit |
|---|---|---|---|---|---|---|---|---|
| 1 | **Zagmatorah — An Ancient Dragon**, Seth Santos, [Sketchfab](https://sketchfab.com/3d-models/zagmatorah-an-ancient-dragon-19ad6f2e9d384159a6f686115aebf7a0) | CC-BY 4.0, `creativecommons.org/licenses/by/4.0/`. Host-stated requirement verbatim: *"Author must be credited. Commercial use is allowed."* | Yes — credit "Seth Santos", link licence | Yes ("Simple Rig", author's own wording) | 1 animation; **which clip is unverified** | 19,840 v / 38,378 f | **Strong.** Two-limb wyvern configuration (wing-arms + hind legs only), long crocodilian/avian head with a low crest, thin whip tail with a terminal fin. Night Fury is four-limbed with a blunt feline head, ear flaps and twin tail fins. Different limb count, head language, and tail structure. | **Good.** Sober dark brown-grey, no franchise cues, and the preview is already a horizontal flight pose — the body attitude a rider needs. Photoreal-leaning, but the engine overrides colour/roughness/metalness/emissive on load, which pulls it toward the dusk palette. |
| 2 | **European Dragon**, Regina Cachoa, [Sketchfab](https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87) | CC-BY 4.0, `creativecommons.org/licenses/by/4.0/`. Host-stated requirement verbatim: *"Author must be credited. Commercial use is allowed."* | Yes — credit "Regina Cachoa", link licence | Yes | **5 clips, named by the author: Idle Stand, Idle Sit, Walk, Run, Fly.** Best animation coverage found. | 21,225 v / 42,338 f | **Strong.** Six-limbed classical European dragon: separate forelimbs and hind limbs plus membrane wings, antler-style branched horns, spined neck, heavy musculature. Structurally unlike a Night Fury on limb count, head shape, and horn treatment. | **Moderate.** Author-supplied 2k/4k hand-painted textures are realism-leaning and the mesh is dense with organic detail; against low-poly landmarks it will read as the most detailed thing on screen. The material override helps; the normal-map detail does not go away. |
| 3 | **Dragon** (Animated Monster Pack), Quaternius, [pack page](https://quaternius.com/packs/animatedmonster.html) · [hosted record](https://poly.pizza/m/VBvzjFIYws) · [CC0 mirror](https://opengameart.org/content/lowpoly-animated-monsters) | **CC0 1.0**, linked from the pack page itself to `creativecommons.org/publicdomain/zero/1.0/`. Pack text: *"free to use in personal and commercial projects."* | **None.** No attribution obligation of any kind. | Yes | Animated (host metadata `Animated: true`); **clip names unverified** | **1,088 tris** — the lightest credible option, ~993× lighter than current | **Strong.** Faceted quadruped with separate bat wings, tall pointed ears, short blunt snout, thin tail. Not Night Fury; also not anything else recognisable. | **Best fit on style, worst on role.** Flat-shaded faceted low-poly sits perfectly beside low-poly landmarks. But the proportions are a small imp/gargoyle — stubby limbs, no neck length, no wingspan authority. It does not read as a rideable hero mount, and this is one of the most widely reused free assets in existence. |
| 4 | **Wyvern Flying Animation**, Lais.Marques, [Sketchfab](https://sketchfab.com/3d-models/wyvern-flying-animation-330f6761ed7142b49b1e95cc9004e5e8) | CC-BY 4.0. Host-stated requirement verbatim: *"Author must be credited. Commercial use is allowed."* | Yes — credit "Lais.Marques" | Yes | 1 animation, titled as a flying animation | 4,780 v / 9,524 f | **Adequate.** Horizontal wyvern, pterosaur-like beaked head with a red crest, two-limb wing configuration. Non-derivative. | **Weak.** Tagged `studentwork` by the author. Garish green/purple texture; the engine keeps `map` as an emissive map, so the palette partly survives the override. Craft level is visibly below the rest of the scene. |
| 5 | **Flying Dragon**, peaznchips, [OpenGameArt](https://opengameart.org/content/flying-dragon) | **CC0**, as listed in the page's own `License(s)` field | **None** | Armature present, but flight is authored as an **adjustable curve path** with a bundled script that bakes the path into armature keyframes | Curve-driven, not a flap-cycle library | **Unverified** — page states no counts, `.blend` in a 20.5 MB zip | **Strong but wrong body plan.** Serpentine Chinese dragon. Definitively non-derivative; also definitively not a rideable western mount, and its long snake body has no mapping onto the game's wing bone chain. | **Poor for this game.** Would require rethinking the rider, the flight model, and the wing rig. |
| 6 | **Wyvern (Low Poly)**, p0ss, [OpenGameArt](https://opengameart.org/content/wyvern-low-poly) | CC-BY 3.0, per the page's own `License(s)` field | Yes — credit "p0ss"; note the page also credits Sunburn's high-poly original it was decimated from, so **two-step attribution** | **No — the page's own tag is `Static Mesh`** | None | ~2,800 faces (author's stated figure) | Adequate wyvern silhouette | Author himself flags a poor UV unwrap, "the head in particular came out all over the place". Would need rigging and animating from zero, which is most of the from-scratch cost without the IP ownership benefit. |

### Also verified CC0 and animated, but rejected on art direction

Quaternius's **Ultimate Monsters** pack (50 animated models, CC0 verified on
[the pack page](https://quaternius.com/packs/ultimatemonsters.html)) contains several
flyers — Dragon (3,826 tris), Dragon Evolved (6,702), Hywirl (2,560), Armabee Evolved
(1,768), Bat (772), Birb (2,668) — all CC0, all reported animated, all superb on vertex
budget and licence.

I viewed the pack's own preview render. The entire pack is **cute chibi mobile-casual**:
oversized googly eyes, toy-like rounded volumes, bright saturated colours. Confirmed
individually for Dragon Evolved. This is not "moderately stylised", it is a different
product category. A cloaked rider seated on it would read as parody, and the obsidian and
violet-emissive material treatment would fight the design rather than support it. Ruled out
on taste, not on licence. The single exception is the older Animated Monster Pack dragon at
row 3, which is flat-shaded and sober rather than cute.

## Rejected on provenance — the important negative result

These all carry a permissive licence label and are all attractive on geometry and
animation count. Each is disqualified because the *design* is not the uploader's to
license, which is the same class of problem as the current Night Fury issue. Adopting any
of them would move the risk sideways, not down.

| Model | Reported licence | Why rejected |
|---|---|---|
| Green Dragon, GadgetHamster (11,026 v, 6 anims) | CC-BY 4.0 | Author's own description: *"Based on the Green Dragon Redesign by **Alexander Ostrowski**"*. The mesh is CC-BY; the underlying concept design is a third party's, and the model is tagged `dnd` with Wizards of the Coast chromatic-dragon naming. |
| Black Dragon, GadgetHamster (5,472 v, 4 anims) | CC-BY 4.0 | Same chain: *"design courtesy of **Alexander Ostrowski**"*. The author adds that he hopes *"to turn to more original designs"* — an explicit acknowledgement that these are not his designs. |
| Drogon – Game of Thrones Dragon (21,614 v, **52 anims**) | CC-BY | Named franchise character. The animation library is the best found anywhere; it is unusable. |
| DeadlyNadder rig (4,971 v) | CC-BY | A *How to Train Your Dragon* species. Swapping a Night Fury for a Deadly Nadder is not a fix. |
| Agnaktor (4,135 v) | CC-BY | Monster Hunter creature. |
| Ancient Gear Wyvern (8,321 v, 17 anims) | CC-BY | Yu-Gi-Oh card creature. |
| Tarisland – Dragon (20,492 v, 27 anims) | CC-BY | Named after a shipped commercial MMO; strongly suggests an extracted game asset. |
| "Animated Dragon Three Motion Loops" / "Dragon flying" / "Dragon" cluster, 10,208 v | CC-BY | The identical 10,208-vertex / 19,544-face mesh appears under at least five different uploader names. At most one of them can be the author. Provenance is unresolvable from the outside; treat the whole cluster as unusable. |

There was **no CC0, rigged, animated dragon on Sketchfab at all** — an explicit
`license=cc0` + `rigged=true` + `animated=true` query for "dragon" returned exactly one
result, a museum scan of a decorative scroll box. The permissive-licence dragon supply on
that platform is entirely CC-BY.

## Is the existing rig and animation work salvageable onto a new mesh?

Mostly yes, and this is better news than expected. The dependency is **bone names, not
vertex order.** Nothing in the runtime layer indexes geometry.

The runtime contract, read from `index.html`, is a name lookup with graceful fallback for
missing bones:

- Spine and tail: `hips`, `chest`, `neck`, `head`, `tail1`–`tail5`
- Wings: `shoulder.{L,R}`, `forearm.{L,R}`, `fingerA.{L,R}`, `fingerB.{L,R}`, `fingerC.{L,R}`
- Legs: `thigh.{L,R}`, `shin.{L,R}`
- Membrane (optional): `membraneBody.{L,R}`, `membraneAB.{L,R}`, `membraneBC.{L,R}`
- Two animation clips found by exact name: `Flap` and `Glide`
- Two attachment lookups: an object named `head` for the mouth charge ball, and `chest` for
  the rider group

What that means, component by component:

| Work item | Salvageable? | Detail |
|---|---|---|
| Procedural "alive" layer — spring-driven spine, neck, head, tail, chest and wing flex | **Yes, unchanged** | It applies world-axis rotations to bones looked up by name. Any armature renamed to the contract drives it. Missing bones are filtered out rather than erroring, so partial matches degrade instead of breaking. |
| Wing-membrane rig | **Yes, re-runnable** | `reports/flight-motion-verification/build_membrane_rig.py` generates the six membrane bones *from the positions of* `shoulder`, `forearm`, `fingerA/B/C` and redistributes existing skin weights. It is name-driven and geometry-agnostic. Point it at a new GLB with correct bone names and it should rebuild the membrane layer. |
| Rider attachment and mouth charge ball | **Yes** | Both are `getObjectByName` lookups on `chest` and `head`, positioned in that bone's local space. Placement offsets would need re-tuning for new proportions; the mechanism carries over. |
| Baked `Flap` and `Glide` clips | **No** | These are keyframed against this specific armature's rest pose and bone rolls. They do not transfer. |
| Skin weights | **No, and irrelevant** | Weights belong to the mesh being replaced. Any candidate above arrives with its own. |
| Verification harness | **Yes** | `verify_rig_runtime.py`, `capture_membrane_comparison.py`, and `render_galevein_silhouettes.py` audit joints, weights and silhouettes generically. The whole QA loop that validated the last bake is reusable, which is a large sunk cost already paid. |

So the retarget job for any third-party candidate is: rename its bones to the 25-name
contract, supply or author two clips named `Flap` and `Glide`, re-run the membrane script,
re-tune the rider offset. That is Blender work on the asset, not engine work — consistent
with the instruction that no game code changes.

The honest caveat: candidates 1, 3, 4 and 5 have **unverified bone naming and unverified
clip content**, because verifying either requires opening the file. Row 2's five clips are
named by its author on the page, which is the strongest animation evidence in the table but
is still the author's description rather than something I inspected. A creature with a
different limb count also will not have five wing-finger bones per side to map — the
membrane script wants `fingerA/B/C`, and a simpler rig may only offer one wing-tip bone.
Expect to author the missing bones by hand in that case.

## The from-scratch Blender route

**Capability is present and free.** Blender 5.1.0 and 5.2 are both installed locally. The
MCP bridge at `/Users/arnav/Desktop/blender-mcp-main` is MIT-licensed. Two caveats on the
bridge: its Sketchfab download and Hyper3D/Hunyuan3D generation features both require
third-party accounts or API keys, so under a $0, no-signup, no-credentials constraint the
only usable capability is scripted modelling and viewport inspection — which is the part
that matters. The repo already contains five working Blender Python scripts that do
armature surgery, weight redistribution, glTF export with matched Draco settings, and
silhouette rendering. The pipeline is built and proven.

**IP position: the strongest available.** Complete ownership, no attribution obligation, no
provenance chain to defend, no possibility that another game ships the same hero. For an
asset that is on screen every single frame of a game intended for sale, this is
qualitatively different from every licensed option above.

**Effort — and the non-obvious part.** The usual objection is that an original hero
creature is a large sculpting job, and for a photoreal creature that is true: block-out,
sculpt, retopologise, UV, texture, rig, weight, and author two flight cycles is
realistically 20–40 hours of skilled Blender work, and the result is only as good as the
sculptor.

**The art direction removes most of that cost.** The world is low-poly and dusk-lit, and
the engine overrides the creature's colour, roughness, metalness and emissive on load
anyway. A faceted, flat-shaded, low-poly creature is therefore the *target* aesthetic, not
a compromise — and a faceted low-poly creature is constructible from primitives, lattice
and mirror operations, and procedural deformation, which is scriptable. That is the same
class of work as the landmark geometry another agent is generating right now, and it is the
class of work the MCP bridge is actually good at. Candidate 3 above demonstrates that a
credible flying dragon exists at 1,088 triangles.

Building the armature to the 25-bone contract from the start is also strictly easier than
renaming somebody else's rig, and it means the membrane script and the whole verification
harness work on the first run.

Realistic assessment of achievable quality: a scripted low-poly original will not match
candidate 2's texture craft, and it should not try to. It can plausibly beat every
candidate here on *coherence*, because it can be built to the scene's existing facet
density and silhouette language. Two hand-authored flight cycles on a 25-bone rig remain
genuine animation work and are the part least amenable to scripting — but the game already
layers substantial procedural secondary motion on top, which lowers the bar the baked clips
have to clear.

Honest risk: this route depends on design judgement, and a mediocre original creature is a
worse hero than a good licensed one. It is not free of cost, only free of money.

## Recommendation

**Take the from-scratch Blender route as the shipping path, and use Zagmatorah (CC-BY 4.0)
as an immediate stand-in if the Night Fury silhouette needs to leave the build before the
original is ready.**

Reasoning:

1. No free asset surveyed gives an *owned, distinctive* hero. That is the real constraint,
   and it should be stated plainly rather than softened. Every permissively-licensed dragon
   with a usable rig is either CC-BY with an attribution obligation and a design somebody
   else authored, or CC0 in an art style that does not fit, or provenance-compromised.
   Adopting a licensed hero means shipping a commercial game whose most-seen asset is
   freely available to every competitor and, in the CC-BY cases, must visibly credit
   another artist.
2. The barrier to building an original is far lower than it normally is, for three reasons
   specific to this project: the art direction wants low-poly, so the mesh is scriptable;
   the Blender pipeline and verification harness already exist and are proven; and the
   rig contract is 25 named bones that can be authored correctly on the first attempt.
3. The rig and procedural work is not lost either way. The alive layer, membrane generator,
   rider attachment and QA scripts all survive a mesh swap. Only the two baked clips and
   the skin weights are discarded, and those are discarded under every option including
   the licensed ones.
4. The stand-in is worth having because the two problems have different urgency. Design
   risk and the 25.0 ms frame budget are both live now. Zagmatorah removes the derivative
   silhouette and cuts the hero from 1,080,189 to 19,840 vertices immediately, at the price
   of one attribution line. It is the best silhouette-plus-art-direction combination in the
   table and it is already posed for horizontal flight. That buys time to build the original
   properly instead of rushing it.

If only one option can be pursued, build the original. The stand-in is a hedge against
schedule, not a substitute for ownership.

## What remains unverified

Stated explicitly so none of it is mistaken for established fact:

- Bone names inside every third-party candidate. Cannot be known without opening the file.
- Clip names and clip content for candidates 1, 3, 4 and 5. Row 2's clip names are the
  author's own description on the page, not an inspection.
- Whether candidate 1's single animation is a flight cycle. The preview pose is a flight
  pose; that is suggestive, not proof.
- Vertex counts for candidate 5 (not published) and the exact vertex-versus-triangle
  relationship for candidate 3 (host reports triangles).
- Whether any Sketchfab uploader not already flagged in the rejection table is in fact the
  author of their upload. I checked descriptions for third-party design credits and
  franchise names, which caught eight cases. It cannot catch an uploader who simply says
  nothing.
- Frame-time improvement from any specific replacement. Not measured; measuring requires
  loading a replacement asset, which is outside this task's scope.
- Attribution wording that would satisfy CC-BY 4.0 in this specific product context. The
  obligation is recorded; the placement and phrasing is a decision for the owner.
