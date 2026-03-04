# INKSTONE ENGINE — CHANGELOG

---

## v1.1 — March 2026

### New Features

**Breakable Walls (Tile 9)**
- New wall type that can be destroyed with a specific weapon.
- Two subtypes: Cracked (shows cracks) and Sealed (shows purple magic glyphs).
- Press E with the correct weapon to break through. Weapon is not consumed.
- Hints tell the player what weapon they need if they don't have it.
- Editor shows subtype dropdown and weapon selector (filters to weapon-type items only).

**Trap Tiles (Tile 15)**
- Visible damage tiles with three subtypes: Pit, Spikes, and Darts.
- Deals configurable damage to a random living party member when stepped on.
- Each subtype has unique flavour text and a distinct 3D sprite.
- Triggers game over if the trap kills the last living hero.
- Editor shows subtype dropdown and damage input.

**Lore Scrolls (Tile 14)**
- Readable text tiles placed on the dungeon floor.
- Player steps on the scroll, the message appears in the log, and the scroll vanishes.
- Editor shows a text input for the scroll message.

**Rectangle Drawing Mode**
- New toggle button in the map editor toolbar.
- Click one corner, then the opposite corner to fill the rectangle with the selected tile.
- Works with all tile types. Mutually exclusive with Line mode.

**Floor Templates**
- When adding a new floor, a template picker now appears with three options:
  - Empty — all floor tiles.
  - Border Walls — walls around the edges, open floor inside.
  - Maze — auto-generated labyrinth using a recursive backtracker algorithm.

**Undo / Redo**
- Full undo/redo support in the map editor for all drawing operations.
- Ctrl+Z to undo, Ctrl+Y or Ctrl+Shift+Z to redo.
- Stores up to 30 steps. Snapshots the entire floor grid and all placements.
- Making a new edit clears the redo stack.

**Test Play (Playtest Mode)**
- New "Test Play" button in the map editor.
- Opens the game in a new tab with an auto-generated level 5 party and 500 gold.
- Skips title screen and party creation, starts directly in the dungeon.
- Debug bar with floor/coordinate warping and God Mode checkbox.

### Improvements

**Copy Sprite (Monsters & NPCs)**
- Each monster and NPC in the database list now has a green "Copy Sprite" button.
- Loads that entity's 16×16 sprite into the drawing grid without editing the original.
- Useful for creating visual variations without redrawing from scratch.

**Line-of-Sight Fog of War**
- Minimap now uses Bresenham line-of-sight instead of a simple radius.
- Walls block visibility — tiles behind walls stay hidden until the player moves around them.

### Bug Fixes

- Fixed selectTool crash caused by Line/Rect toggle buttons being included in the tool button index.
- Fixed lore scroll editor tile being invisible (white on white). Now renders as dusty tan.
- Fixed test play button failing when export endpoint didn't return HTML in the response.
- Fixed input placeholder text bleeding between tools when switching tile types.
- Fixed out-of-bounds array access in tool button highlighting loop.

---

*For the full user guide, see USER_GUIDE.md.*
