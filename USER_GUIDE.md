# INKSTONE ENGINE

### User Guide

*Create your own dungeon crawler game — no coding required.*

Everything you need to know, from first launch to exporting a playable game.

---

## What Is Inkstone Engine?

Inkstone Engine is a toolkit for creating first-person dungeon crawler games with a pen-and-paper visual style. You design your dungeon in the editor, populate it with monsters, items, NPCs, and quests, compose music for each floor, then export a single HTML file that anyone can open in a web browser and play.

No programming knowledge is needed. Everything is done through the visual editor.

## What You Get

- **Map Editor** — draw dungeon floors on a 20×20 grid with walls, doors, stairs, and more
- **Database Editor** — create classes, spells, items, weapons, monsters, NPCs, and town settings
- **Music Composer** — generate procedural music loops for town, exploration, and combat
- **Export** — one click produces a fully playable HTML game file
- **Save/Load** — players can save their progress in the exported game

## How the Pieces Fit Together

Think of it in two halves. The Database is where you create all the things in your game: the hero classes players can pick, the monsters they will fight, the items they can find, and the spells they can cast. The Map is where you place those things in the world: this tile has a goblin, that chest contains a key, this NPC gives a quest.

The database defines what exists. The map defines where it exists.

> **✨ TIP:** *Always create your database entries (items, monsters, etc.) before placing them on the map. The map editor needs to know what exists before you can place it.*

---

## Getting Started

### Running the Editor

Make sure you have Python installed on your computer.

**Option 1 (Recommended):** Double-click the **Start Inkstone Engine.bat** file. It checks for Python, installs Flask if needed, opens your browser automatically, and starts the server.

**Option 2 (Manual):** Open a terminal in the Inkstone Engine folder and run: `python app.py` then open http://localhost:5000 in your browser.

You will see the editor with two tabs at the top: Map Editor and Database Editor.

### The Golden Rule: Save Often

The editor does not auto-save. You must click Save Map or Save Database to keep your work. Get into the habit of saving after every significant change. A green message confirms when a save succeeds.

> **⚠ IMPORTANT:** *Map data and database data are saved separately. If you add a new monster in the Database Editor, click Save Database. If you place that monster on the map, click Save Map. Both need saving.*

---

## Database Editor — Building Your Game's Content

Click the Database Editor tab. This is where you create everything that populates your game. Work through the sections from top to bottom, as later sections depend on earlier ones.

### Game Settings

At the very top are two fields:

- **Game Title** — whatever you type here becomes the title shown on the game's title screen, in the browser tab, and at the top of the game window. Choose something memorable!
- **Intro Text** — optional flavour text displayed on the title screen before the player begins. Use it to set the scene: "A darkness stirs beneath the old keep..." or "The villagers speak of treasure in the Hollow Mountain." Leave it blank for no intro.

### Classes

Classes are the hero types your players choose from when starting a game. Each player picks 3 heroes from the classes you create. At party creation, each class button shows its base stats and spell information so players can make informed choices.

**Creating a Class:**

- **ID** — a short lowercase label with no spaces (e.g. warrior, mage, healer). This is used internally.
- **Name** — the display name players see (e.g. "Knight", "Sorcerer").
- **Base HP** — starting hit points at level 1. Higher = tougher. A tanky fighter might have 30, a fragile mage might have 15.
- **Base ATK** — starting attack power. Damage dealt in combat is random from 1 up to this value (plus weapon bonus if equipped).
- **Base Spells** — how many spell casts this class starts with. Set to 0 for non-magical classes.

> **✨ TIP:** *Aim for variety. A balanced party of 3 needs different roles. Try a tough fighter (high HP/ATK, no spells), a healer (moderate stats, heal spells), and a damage caster (low HP, powerful attack spells).*

**Editing Class Progression:**

After creating a class, click the Edit button next to it. This opens two sections:

**Spell Unlocks:** Choose a spell and a level. When a hero of this class reaches that level, they learn the spell. You can add multiple spell unlocks at different levels.

**20-Level Stat Progression:** A table showing what each hero gains at every level. Level 1 is locked (those are the base stats). For levels 2–20, you can set XP Req, HP Gain, ATK Gain, and Spells Gain. The defaults work as a starting point (50 XP per level, +5 HP, +1 ATK, +1 Spell per level). Adjust to taste.

> **✨ TIP:** *Make fighter-type classes gain more HP and ATK per level but fewer spells. Make caster classes gain more spell slots but less HP.*

### Spells

Spells are special abilities heroes can use in combat. There are two types:

- **Damage** — deals damage to the enemy. The final damage = spell value + random bonus + half the caster's ATK. So stronger heroes cast stronger damage spells.
- **Heal** — restores HP to a party member of the player's choice. Heals a flat amount equal to the spell's value.

Each spell costs one spell slot to cast. Heroes recover all spell slots when resting at the tavern in town.

> **✨ TIP:** *Create spells before creating classes, so you can assign spell unlocks immediately when editing a class.*

### Town Settings

The town is the safe hub where players rest, shop, and manage their party between dungeon runs.

- **Town Name** — displayed at the top of the town screen.
- **Shopkeeper Name** — shown above the shop inventory (e.g. "Grom's Shop").
- **Shop Greeting** — a custom greeting shown when entering the shop.
- **Tavern Cost** — gold to rest at the tavern. Resting fully heals all living heroes and restores all spell slots.
- **Church Cost** — gold to visit the church. This revives all dead heroes to full HP.

**Shop Inventory:** Use the dropdown to add up to 6 items to the shop. Players can buy these items during the game. When an item is bought, it is removed from the shop for that playthrough (items are limited stock). Players can also sell items from their inventory at 50% of the buy price.

> **✨ TIP:** *Price your tavern rest low enough that players can afford it regularly (10–20 gold), but make church revival expensive enough that death has consequences (50–100 gold).*

### Items

Items are objects players find, buy, receive as rewards, or loot from chests. There are four types:

- **Healing Item** — used from inventory during exploration or combat. The player chooses which hero to heal. If only one hero needs healing, it is used on them automatically.
- **Key Item** — used to unlock locked doors or complete NPC quests. Cannot be "used" directly — the game checks for them automatically when interacting with a locked door or quest NPC.
- **Weapon** — equippable gear. When you select Weapon, an extra field appears for ATK Bonus — the attack power added to whoever equips it. The Value field sets the shop price (sell price is always 50% of this).
- **Town Scroll** — a consumable item that instantly warps the party back to town when used during dungeon exploration. The item is consumed on use. Cannot be used during combat or while already in town.

**Cannot Sell Flag:** Every item has a "Cannot Sell" checkbox. When checked, players will not be able to sell this item at the shop. Use this to protect important items like quest keys, town scrolls, or unique weapons that you don't want players accidentally selling. Items with this flag show a 🔒 icon in the editor's item list.

> **✨ TIP:** *Always mark key items as Cannot Sell. If a player sells their only door key, they could soft-lock themselves. Town scrolls are also good candidates for this flag.*

**Weapons in Detail:**

Each hero has one weapon slot. To equip a weapon, click it in the inventory during exploration or in town. You will be asked which hero should equip it. If that hero already has a weapon, the old one returns to inventory. Weapons add their ATK bonus to both physical attacks and spell damage.

> **✨ TIP:** *Create a range of weapons at different price points. A basic Wooden Sword (+2 ATK, 20 gold) for early game, an Iron Blade (+5 ATK, 80 gold) for mid-game, and a Runed Greataxe (+10 ATK, 250 gold) as a late-game goal.*

### Monsters

Monsters are the enemies players encounter in the dungeon.

- **ID / Name** — same pattern as everything else. ID is internal, Name is what players see in combat.
- **Max HP** — how much damage the monster can take before dying.
- **Attack** — maximum damage per hit. Actual damage each turn is random from 1 to this value.
- **XP Reward** — experience awarded to each surviving hero when the monster dies.
- **Gold Drop** — gold looted on defeat.
- **Item Drop / Drop Rate** — optionally select an item that the monster can drop on death, and set a drop rate percentage (0–100%). Only applies if an item is selected.
- **Final Boss** — check this box to make killing this monster trigger the victory screen. Enter the victory text shown to the player.

**Drawing Monster Sprites:**

To the right of the monster form is a 16×16 pixel grid. Click and drag to draw your monster's appearance in black ink on parchment. This sprite is shown in the 3D dungeon view (when the player sees the monster from a distance) and full-size during combat, framed with atmospheric pen-and-ink crosshatching.

> **✨ TIP:** *Keep sprites simple and bold. Fine details get lost at small sizes in the dungeon view. Think silhouettes: a bat with spread wings, a skull with eye sockets, a spider with eight legs.*

**Copy Sprite:** Each monster in the list has a green Copy Sprite button. Clicking it loads that monster's sprite into the drawing grid without editing the original. This lets you create variations without redrawing from scratch.

**Suggest Stats Button:** Not sure what stats to give a monster? Click Suggest Stats and enter a target player level. The engine analyses your class progression tables and spell data, then auto-fills balanced HP, ATK, XP, and Gold values. The suggested monster will survive roughly 2–3 rounds against a party, deal about 25% of a hero's HP per hit, and award enough XP that 4–6 fights bridges the gap to the next level. These are starting points — always tweak to fit your vision.

### NPCs

NPCs are non-player characters placed in the dungeon. They can give quests, provide rewards, or simply deliver dialogue. NPC names are displayed as a prefix to all their dialogue in the game log (e.g. "Old Hag: Bring me the Ancient Relic...").

- **ID / Name** — internal ID and display name.
- **Required Item** — if set, the NPC checks the player's inventory for this key item. If the player has it, the quest is complete.
- **Default Dialogue** — what the NPC says before the quest is complete.
- **Quest Complete Text** — said when the player has the required item.
- **Idle Text** — said on all subsequent interactions after the quest is done.
- **Reward Item** — an item given to the player upon quest completion.
- **Reward Gold** — gold given upon quest completion.

If you leave Required Item blank, the NPC completes immediately on first interaction. Useful for NPCs that just give a free reward or tell a story.

NPCs also have a Copy Sprite button, working the same way as monsters.

### Music Composer

The Music Composer sits at the bottom of the Database Editor, just above the Save button. It lets you create procedural music loops for your game: one track for town, plus an exploration track and a combat track for each dungeon floor.

**Workflow:**

1. **Select a slot** from the dropdown. Options are Town, and for each floor: Floor N Explore and Floor N Combat. The floor list updates automatically from the Map Editor.
2. **Choose a genre** (Fantasy, Sci-Fi, Horror, Weird) and a vibe (Fun, Action, Gloomy, Spooky, Dramatic, Epic). These control the instruments and mood of the generated track.
3. **Click Generate.** A unique procedural loop is created. Each click produces a different result.
4. **Click Play** to preview the loop. Click Stop to end playback.
5. **Click Lock In** to assign the track to the selected slot. The track is stored in the database.
6. **Click Save Database** to persist your music. Music is included in the exported game.

Use Clear Slot to remove a locked-in track. The track list at the bottom shows all composed tracks.

**How Music Plays In-Game:**

- **Town** — the town track plays whenever the player is in town.
- **Exploration** — the floor's explore track plays while walking the dungeon. If no track exists for a floor, silence.
- **Combat** — when combat starts, the floor's combat track plays. If no combat track exists, the exploration track keeps playing.
- **Mute** — players can press N at any time to toggle music on/off.

> **✨ TIP:** *You do not need music for every floor. A town track and a couple of floor tracks goes a long way. Silence can be atmospheric too!*

---

## Map Editor — Building Your Dungeon

Click the Map Editor tab. This is where you design the physical layout of your dungeon.

### The Grid

Your dungeon is a 20×20 tile grid. Each tile can be one thing: floor, wall, door, monster, item, etc. Click and drag to paint tiles. The grid starts as all floor tiles.

### The Toolbar

The toolbar across the top shows every tile type. Click one to select it, then click/drag on the grid to place it.

| Tile | What It Does |
|------|-------------|
| Floor / Eraser | Walkable empty floor. Also use this to erase any tile back to floor. |
| Wall | Solid wall. Blocks movement and line of sight. Shown with brick texture in-game. |
| Door | A closed door. Players press E to open/close it. |
| Item | An item pickup. Select which item from the dropdown. Appears as a small sack in the 3D view. |
| Monster | A monster encounter. Select which monster. Monsters chase the player within 2 tiles. |
| Stairs Up | Leads to the floor above (or back to town if on Floor 1). |
| Stairs Down | Leads to the floor below. |
| Chest | A treasure chest. Press E to open. Can contain an item and/or gold. |
| Locked Door | Requires a specific key item to open. Select which key from the dropdown. |
| NPC | Places an NPC. Select which one. Press E to interact. |
| Win Trigger | Walking onto this tile triggers the victory screen. Enter victory text. |
| Illusion Wall | Looks like a wall but players can walk through it. Brickwork is subtly different as a visual clue. |
| Lore Scroll | A readable scroll on the ground. The player steps on it, reads the message, then it vanishes. Enter the scroll text in the input that appears. |
| Trap | A damage tile. Select a trap type (Pit, Spikes, or Darts) and set the damage amount. Deals damage to a random living party member when stepped on. |
| Breakable Wall | Looks and blocks like a wall, but can be destroyed with a specific weapon. Choose Cracked or Sealed and select which weapon breaks it. Press E to attempt. |

### Floors

Your dungeon can have up to 20 floors. Use the floor controls above the grid: the Current Floor dropdown to switch between floors, Add Floor to create a new empty floor, and Delete Floor to permanently remove the current floor.

When you click Add Floor, a template picker appears with three options: Empty (all floor tiles), Border Walls (walls around the edges with open floor inside), and Maze (an auto-generated maze using a recursive backtracker algorithm). The maze template gives you a ready-made labyrinth to place monsters and items in — a great starting point if you do not want to draw corridors by hand.

### Connecting Floors with Stairs

Floors connect via stairs. Place Stairs Down on a floor, then switch to the next floor down and place Stairs Up there. When the player walks onto Stairs Down, they appear next to the Stairs Up on the floor below.

> **⚠ IMPORTANT:** *Stairs Up on Floor 1 is special — it is the dungeon entrance/exit. Walking onto it returns the player to town. Always place Stairs Up somewhere on Floor 1 or players cannot enter or leave the dungeon!*

### Saving and Exporting

- **Save Map** — saves your map layout to disk. Does NOT save database changes.
- **Export Game** — saves the map first, then combines everything into a playable HTML file in the exports folder. Open that HTML file in any web browser to play.
- **Test Play** — saves the map and opens a playtest version in a new tab. The playtest starts you directly in the dungeon with an auto-generated level 5 party and 500 gold, skipping the title screen and party creation. A debug bar at the top lets you warp to any floor and coordinates, and a God Mode checkbox makes your party invulnerable. Use this for quick testing without having to play through the full game flow each time.

### Drawing Tools

By default, you paint tiles by clicking and dragging (freehand mode). Two additional modes are available via toggle buttons in the toolbar:

- **Line Mode** — click a start tile, then click an end tile. A straight line of the current tile type is drawn between them using Bresenham's algorithm. Great for long corridors and straight walls.
- **Rect Mode** — click one corner, then click the opposite corner. The entire rectangle is filled with the current tile type. Perfect for rooms and large open areas.

Line and Rect modes are mutually exclusive — activating one turns the other off. Both work with every tile type, including items, monsters, and special tiles.

### Undo and Redo

The map editor supports undo and redo for all drawing operations (freehand strokes, lines, and rectangles). Each operation saves a complete snapshot of the current floor's grid and all placements.

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo the last edit |
| Ctrl+Y (or Ctrl+Shift+Z) | Redo an undone edit |

The undo history stores up to 30 steps. Making a new edit clears the redo stack, as with any standard editor. Undo/redo only works when the Map Editor tab is active.

---

## Designing a Good Dungeon — Tips and Tricks

### Your First Dungeon (Step by Step)

If you are new to Inkstone Engine, follow this order:

1. Create 2–3 classes in the Database Editor (e.g. Warrior, Mage, Cleric).
2. Create 2–3 spells (a heal spell and a damage spell). Assign them to your classes.
3. Create a few items: a healing potion, a key item, and a weapon or two.
4. Create 2–3 monsters using Suggest Stats for levels 1, 3, and 5. Draw simple sprites.
5. Set up the town: name it, price the tavern and church, add potions/weapons to the shop.
6. Optionally compose music: at minimum, a town track and a Floor 1 explore track.
7. Write an intro text in Game Settings to set the scene.
8. Save the database.
9. Switch to Map Editor. Draw walls to create corridors and rooms on Floor 1.
10. Place Stairs Up near one edge — this is the dungeon entrance.
11. Scatter monsters, items, and chests throughout the corridors.
12. Place a Win Trigger or Final Boss at the deepest point as the goal.
13. Save the map and click Export Game. Open the HTML file and playtest!

### Dungeon Layout Tips

- Start simple. A single floor with one path and a boss at the end is a complete game.
- Use doors to create anticipation. Players cannot see what is behind a closed door.
- Place healing items before tough fights.
- Use locked doors and key items to create progression.
- Mix corridor sections (tense, claustrophobic) with open rooms (where you can see monsters coming from further away).
- Place Stairs Down in the deepest room of each floor so players must explore before descending.

### Illusionary Walls

Illusionary walls look like normal walls but players can walk through them. The only visual clue is that the brick pattern is slightly different.

- Use them to hide secret rooms with bonus treasure.
- Place them at dead ends so curious players who bump into walls are rewarded.
- Don't overuse them. If every wall might be fake, the mystery is gone.

### Breakable Walls

Breakable walls block movement like regular walls but can be destroyed by pressing E while holding the right weapon. There are two subtypes:

- **Cracked** — visually shows cracks in the brickwork. The flavour text says you smash through it with the weapon.
- **Sealed** — shows purple magic glyphs. The flavour text says the weapon shatters the magical seal.

The weapon is not consumed when breaking the wall — the player keeps it. If the player does not have the required weapon (in inventory or equipped on any hero), they get a hint telling them what they need. Use breakable walls to gate areas behind weapon-based progression: find the Warhammer, then smash through the cracked wall to reach the treasure room.

### Lore Scrolls

Lore scrolls are readable text tiles placed on the dungeon floor. When a player steps on one, the scroll's message appears in the log and the scroll vanishes. Use them for world-building, hints, warnings, or story fragments scattered through the dungeon. They do not block movement or trigger combat.

### Traps

Trap tiles deal damage to a random living party member when stepped on. Three visual subtypes are available (Pit, Spikes, Darts) — each has different flavour text but they all work the same way. Set the damage amount when placing the trap.

- Visible in the 3D view as floor sprites, giving alert players a chance to spot and avoid them.
- If a trap kills the last living party member, it triggers a game over.
- Use traps to make corridors dangerous and reward players who pay attention to the environment.

### Difficulty and Pacing

- Weaker monsters near the entrance, stronger ones deeper in.
- Each floor should be slightly harder than the last.
- Scatter gold and healing items generously on early floors.
- Place a Final Boss as the climax, or use a Win Trigger for location-based victory.
- Use Suggest Stats to keep monsters balanced against your class progression.

### Common Mistakes to Avoid

- Forgetting Stairs Up on Floor 1 — players cannot enter the dungeon without it.
- Not connecting floors with matching stairs.
- Creating key items but forgetting to place them somewhere findable.
- Making the church too expensive.
- Not adding items to the shop — the shop starts empty.
- Forgetting to save both the database AND the map before exporting.
- Skipping the intro text — even one sentence helps set the mood.
- Selling quest-critical items — mark key items as Cannot Sell to prevent this.

---

## How the Exported Game Works

This section explains what happens when a player opens your exported game, so you can design with their experience in mind.

### Title Screen

The game opens with a title screen showing your game's name and intro text. The player clicks "Begin Adventure" to proceed to party creation, or "Load Previous Save" to resume a saved game.

### Party Creation

The player picks 3 heroes from the classes you defined. Each class button shows its base stats plus spell information: what spells it knows at level 1, or when it learns its first spell if none are available yet. Non-magical classes are clearly marked "No magic". The player names each hero and then enters town.

### Town

The town is a menu-based safe zone. The buttons clearly describe what each service does:

- **Rest at Tavern (cost) — Restore HP & Spells** — fully restore HP and spell slots for all living heroes.
- **Visit Church (cost) — Resurrect Fallen** — resurrect all fallen heroes to full HP.
- **Visit Shop** — buy items or sell inventory at 50% value. Items marked as Cannot Sell by the creator will not appear in the sell list.
- **Level Up** — appears automatically when a hero has enough XP. Free, and heals to full.
- **Enter Dungeon** — begin exploring Floor 1.
- **Save / Load** — preserve or resume progress.

The town also shows contextual messages. If heroes can level up, the player is told. If heroes are dead, they are reminded about the Church and the Replace option.

### Dungeon Exploration

Players move with WASD and interact with E. They see the dungeon in first-person 3D with a pen-and-ink visual style. A minimap in the top-right reveals explored areas (toggle with M). Items on the ground appear as small sacks. Monsters are visible as sprites in the 3D view and chase the player within a 2-tile radius.

### Combat

Combat is turn-based. Each of the 3 heroes acts in order, then the monster attacks one random hero. The combat screen shows the monster in an atmospheric pen-and-ink frame with a colour-coded HP bar. Heroes can:

- **Attack** — deal random damage from 1 to ATK (plus weapon bonus).
- **Defend** — take half damage from the monster's next hit.
- **Spell** — if the hero knows multiple spells, they choose which one to cast. Heal spells let the player pick which ally to heal. Damage spells target the enemy automatically. The Spell button shows remaining casts and hovering it displays all known spells with their effects.
- **Run** — 60% chance to escape. If it fails, the turn is wasted.

If all 3 heroes die, the party is dragged back to town. The dungeon state is preserved (killed monsters stay dead, looted chests stay empty).

### Party Death and Recovery

When heroes die, players have two options:

- **Church (costs gold)** — revives all dead heroes to full HP. They keep their levels and XP.
- **Replace Hero (free)** — a dead hero can be replaced with a fresh level 1 recruit. The old hero is permanently lost, but the player is never completely stuck. Any weapon the dead hero had is returned to inventory.

> **✨ TIP:** *This means players can always recover from a total wipe, even with no gold. But losing a high-level hero to replacement is painful enough to make death meaningful.*

### Winning

The game ends in victory when the player either walks onto a Win Trigger tile or kills a monster marked as the Final Boss. Design your game so there is always a clear goal!

---

## Quick Reference

### Keyboard Controls (In-Game)

| Key | Action |
|-----|--------|
| W | Move forward |
| S | Move backward |
| A | Turn left |
| D | Turn right |
| E | Interact (open/close doors, open chests, talk to NPCs, unlock locked doors, break walls) |
| M | Toggle minimap on/off |
| N | Toggle music on/off |

### Editor Workflow Checklist

**Before you export, make sure you have:**

- At least one class created
- A game title set (and optionally intro text)
- Town costs configured and shop stocked
- Stairs Up placed on Floor 1 (dungeon entrance)
- A win condition: either a Win Trigger tile or a Final Boss monster
- Music composed for at least the town (optional but recommended)
- Saved both the database AND the map

---

## Troubleshooting

- **"No classes found" when starting the game:** You need to create at least one class in the Database Editor and save.
- **Can't enter the dungeon:** Make sure Stairs Up is placed on Floor 1 of your map.
- **Items/monsters not showing in map toolbar dropdowns:** Create them in the Database Editor first, then save. The map editor loads database contents when the page first opens, so refresh the browser after saving new database entries.
- **Locked door won't open:** Check that the player has the correct key item. Also verify the locked door tile on the map is set to the right key ID.
- **NPC quest won't complete:** The NPC requires a specific key item. Make sure that item exists, is placed somewhere findable, and the NPC's Required Item dropdown matches.
- **No monsters appear in-game:** Monsters need both a database entry (with a drawn sprite) and a placement on the map.
- **Shop is empty:** Add items to the shop in Town Settings. The shop does not auto-populate.
- **Game looks different than expected:** Make sure you saved both the map AND database before clicking Export Game.
- **Floor 2 is inaccessible:** You need Stairs Down on Floor 1 and Stairs Up on Floor 2. Both are required.
- **Music not playing in exported game:** Music is stored in the database. Make sure you clicked Lock In and then Save Database before exporting.

---

*— Happy dungeon building! —*
