# Pyramid Prowler — Design Brief

## Concept
A bright, playful, cartoonish 3D isometric arcade game. A cute orange creature
restores color to a washed-out pyramid world by hopping across a pyramid of
cubes, painting each top face toward a target color. Dark midnight-indigo
backdrop makes the vivid pop pyramid world glow.

## Aesthetic
- Pseudo-3D isometric pyramid of matte-plastic cubes as the primary view.
- Free-orbit / zoom camera as a secondary, toggleable option.
- Soft shadows, smooth lighting, squash-and-stretch hop animation.
- Chunky rounded UI with chiptune-adjacent energy.

## Color System (OKLCH)
- **Backdrop:** dark midnight-indigo `--background` (0.27 0.045 285).
- **Target:** vivid teal/cyan `--primary` (0.78 0.13 195).
- **Character:** warm orange `--accent` (0.72 0.16 55).
- **Safe:** green `--cube-safe` (0.7 0.16 145).
- **Deadly:** magenta/purple/red `--destructive` (0.6 0.22 15) and
  `--cube-teleporter` (0.62 0.2 320).
- **Washed cubes:** pale desaturated `--cube-washed` (0.82 0.02 285).

## Typography
- **Display / Body:** Nunito — rounded, playful, friendly.
- **Mono:** JetBrains Mono — HUD score/lives digits.

## Motion
- `hop` — squash-and-stretch hop for the character.
- `float` — gentle idle bob for menu elements.
- `pulse` — attention on the target swatch / combo.
- `pop-in` — snappy entrance for overlays and HUD.

## UI Surfaces
- HUD: clean, unobtrusive, positioned over the 3D canvas.
- Menus: chunky rounded cards with `shadow-plastic` elevation.
- Buttons: verb-first labels, one primary action per screen.

## Accessibility
- `color-scheme: dark` with matching `theme-color`.
- Visible `:focus-visible` states on all controls.
- `prefers-reduced-motion` respected for decorative animation.
