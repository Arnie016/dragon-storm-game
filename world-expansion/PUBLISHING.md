# Publishing and selling path

## Blunt status

Do not sell the current game. It has a severe IP problem: its title, “How to Train Your Dragon” framing, Night Fury references, and character/visual flavor create avoidable trademark and copyright risk. A disclaimer will not fix that. Before any commercial listing, rename the game, remove franchise names/references, replace the dragon with an original creature identity and story, replace any copied music/art/voice cues, and obtain commercial provenance for every shipped asset including the current dragon GLB and audio.

## Viable channels

### itch.io — first commercial test

- Cost: no upfront platform fee. Itch uses creator-selected open revenue sharing (default is commonly 10%) plus payment processing fees.
- Browser build: upload a ZIP whose root contains `index.html` and all local assets. Its published HTML limits are 1,000 files, 500 MB extracted total, and 200 MB per file.
- Selling: browser games are donation-only by default; use a downloadable game configuration for a fixed price/PWYF sale, and confirm the current itch setting before launch.
- This is the fastest route for a paid alpha, demo, mailing-list capture, and external feedback. It is not a reliable discovery engine by itself.

### Steam — primary paid PC target after a real product pass

- Cost: USD $100 Steam Direct fee per app. It is recoupable after USD $1,000 adjusted gross revenue.
- Timing: Steam requires onboarding/tax/banking, a 30-day wait after fee payment, and a public Coming Soon page for at least two weeks before release.
- Economics: plan around Valve’s 30% share until confirmed in the signed Steam Distribution Agreement.
- Packaging: the single-file browser game needs a desktop wrapper. Electron is heavier but offers the most consistent Chromium/WebGL runtime; Tauri is much smaller but uses system WebViews, increasing browser-engine variance. Build and QA Windows, macOS, and Steam Deck/Linux separately.
- Blockers: controller support, remappable controls, pause/focus behavior, save data, graphics presets, crash reporting, Steam screenshots/capsules/trailer, support contact, EULA/privacy disclosures, and clean asset/IP rights.

### Web portals and self-hosting

- Portal sponsorship/licensing can work only after the game has a stable, instantly playable web build and defensible original branding.
- Self-hosting can sell keys/downloads through a storefront, but brings VAT/sales-tax handling, payment fraud, updates, CDN costs, privacy policy, and support. It is not a shortcut around provenance or IP clearance.
- Do not promise multiplayer, cloud saves, or account features unless they actually exist and have operational support.

## Recommended sequence

1. Make an original-IP vertical slice and clear all shipped assets.
2. Ship a free itch.io browser demo with analytics that respect privacy and a feedback form.
3. Test retention: tutorial completion, first five-minute completion, average session time, crash/error rate, and GPU-tier failure rate. No paid promotion before these are measured.
4. Build a $4.99–$9.99 downloadable itch.io alpha only if the loop has enough original content to justify payment.
5. Start Steam onboarding early; use a wrapper only once desktop QA and controller support are real.
6. Maintain a release ledger with build hash, asset manifest, license evidence, input/platform test matrix, frame-time percentiles, crash count, conversion rate, refunds, and support volume.

## Release blockers for this repository

- Current HTTYD/Night Fury association and copy need removal.
- No commercial license evidence for any local library asset, including the rigged dragon.
- Current single-file runtime has no packaging pipeline, asset manifest gate, save system, controller support, or production telemetry.
- Adding full-screen DOF and longer draw distance can harm lower-end WebGL hardware; High-only profiling is required.
- No commercial title, store art, trailer, privacy policy, customer support channel, or tax/payment setup exists.
