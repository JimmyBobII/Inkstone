const MapEditor = {
    mapData: [], 
    dbData: { items: [], monsters: [] },
    currentTool: 0,
    currentFloor: 0,
    isDrawing: false,
    lineMode: false,
    lineStart: null,
    rectMode: false,
    rectStart: null,
    undoStack: [],
    redoStack: [],
    MAX_UNDO: 30,

    tools: [
        { id: 0, name: "Floor / Eraser", color: "#ddd", tip: "Paint walkable floor tiles, or erase existing tiles back to floor" },
        { id: 1, name: "Wall", color: "#222", tip: "Solid wall — blocks movement and line of sight" },
        { id: 2, name: "Door", color: "#3a7ca5", tip: "Door — players press E to open/close" },
        { id: 4, name: "Item", color: "#fbc02d", tip: "Place an item pickup — select which item from the dropdown" },
        { id: 5, name: "Monster", color: "#8b0000", tip: "Place a monster encounter — select which monster from the dropdown" },
        { id: 6, name: "Stairs Up", color: "#9c27b0", tip: "Stairs leading up — connects to stairs down on the floor above (or exits to town on floor 1)" },
        { id: 7, name: "Stairs Down", color: "#673ab7", tip: "Stairs leading down — connects to stairs up on the floor below" },
        { id: 8, name: "Chest", color: "#ff9800", tip: "Treasure chest — can contain an item and/or gold" },
        { id: 9, name: "Breakable Wall", color: "#6d5040", tip: "Wall that can be broken with a specific weapon — pick Cracked or Sealed and choose which weapon breaks it" },
        { id: 10, name: "Locked Door", color: "#006064", tip: "Locked door — requires a specific key item to open" },
        { id: 11, name: "NPC", color: "#2e7d32", tip: "Place an NPC — select which NPC from the dropdown" },
        { id: 12, name: "Win Trigger", color: "#ffd700", tip: "Walking here triggers the victory screen — enter victory text below" },
        { id: 13, name: "Illusion Wall", color: "#9e8e7e", tip: "Looks like a wall but players can walk through — brickwork is subtly wrong as a visual clue" },
        { id: 14, name: "Lore Scroll", color: "#d4a574", tip: "A readable scroll — player steps on it, reads the message, then it vanishes" },
        { id: 15, name: "Trap", color: "#a04040", tip: "Trap tile — deals damage when stepped on. Pick a type and set damage." }
    ],

    async init() {
        this.mapData = await API.loadMap();
        this.dbData = await API.loadDb();
        
        if (!Array.isArray(this.mapData)) {
            this.mapData = [this.mapData];
        }
        
        this.mapData.forEach(floor => {
            if (!floor.placements.chests) floor.placements.chests = {};
            if (!floor.placements.doors) floor.placements.doors = {};
            if (!floor.placements.npcs) floor.placements.npcs = {};
            if (!floor.placements.wins) floor.placements.wins = {};
            if (!floor.placements.lore) floor.placements.lore = {};
            if (!floor.placements.traps) floor.placements.traps = {};
            if (!floor.placements.breakwalls) floor.placements.breakwalls = {};
        });

        this.currentFloor = 0;

        this.renderToolbar();
        this.renderFloorControls();
        this.renderGrid();
        this.setupControls();

        document.addEventListener('mouseup', () => { this.isDrawing = false; });
    },

    renderToolbar() {
        const toolbar = document.getElementById('map-toolbar');
        toolbar.innerHTML = '';

        this.tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = `tool-btn ${this.currentTool === tool.id ? 'active' : ''}`;
            btn.style.borderBottom = `4px solid ${tool.color}`;
            btn.innerText = `${tool.name} (${tool.id})`;
            btn.title = tool.tip;
            btn.onclick = () => this.selectTool(tool.id);
            toolbar.appendChild(btn);
        });

        const subSelector = document.createElement('select');
        subSelector.id = 'map-sub-selector';
        subSelector.style.display = 'none';
        toolbar.appendChild(subSelector);

        const goldInput = document.createElement('input');
        goldInput.type = 'number';
        goldInput.id = 'map-gold-input';
        goldInput.placeholder = 'Gold Amount';
        goldInput.style.display = 'none';
        goldInput.style.width = '100px';
        toolbar.appendChild(goldInput);

        const winTextInput = document.createElement('input');
        winTextInput.type = 'text';
        winTextInput.id = 'map-win-text';
        winTextInput.placeholder = 'Victory text...';
        winTextInput.style.display = 'none';
        winTextInput.style.width = '300px';
        toolbar.appendChild(winTextInput);

        const bwTypeSelect = document.createElement('select');
        bwTypeSelect.id = 'map-bw-type';
        bwTypeSelect.style.display = 'none';
        bwTypeSelect.innerHTML = '<option value="cracked">Cracked Wall</option><option value="sealed">Sealed Wall</option>';
        toolbar.appendChild(bwTypeSelect);

        // Line tool toggle (simple QOL)
        const lineBtn = document.createElement('button');
        lineBtn.id = 'map-line-btn';
	lineBtn.className = 'tool-btn';
	lineBtn.title = 'Toggle line mode: click start tile then end tile to draw a straight line';
	lineBtn.innerText = 'Line: OFF';
	lineBtn.onclick = () => {
    	this.lineMode = !this.lineMode;
    	this.lineStart = null;
    	// Turn off rect mode if activating line
    	if (this.lineMode && this.rectMode) {
    	    this.rectMode = false;
    	    this.rectStart = null;
    	    const rb = document.getElementById('map-rect-btn');
    	    if (rb) { rb.classList.remove('active'); rb.innerText = 'Rect: OFF'; }
    	}
    	lineBtn.classList.toggle('active', this.lineMode);
    	lineBtn.innerText = this.lineMode ? 'Line: ON' : 'Line: OFF';
    	UI.showStatus('map-status-msg', this.lineMode ? 'Line mode ON: click start then end.' : 'Line mode OFF.');
};
toolbar.appendChild(lineBtn);

        // Rect tool toggle
        const rectBtn = document.createElement('button');
        rectBtn.id = 'map-rect-btn';
        rectBtn.className = 'tool-btn';
        rectBtn.title = 'Toggle rectangle mode: click two opposite corners to fill a rectangle';
        rectBtn.innerText = 'Rect: OFF';
        rectBtn.onclick = () => {
            this.rectMode = !this.rectMode;
            this.rectStart = null;
            // Turn off line mode if activating rect
            if (this.rectMode && this.lineMode) {
                this.lineMode = false;
                this.lineStart = null;
                lineBtn.classList.remove('active');
                lineBtn.innerText = 'Line: OFF';
            }
            rectBtn.classList.toggle('active', this.rectMode);
            rectBtn.innerText = this.rectMode ? 'Rect: ON' : 'Rect: OFF';
            UI.showStatus('map-status-msg', this.rectMode ? 'Rect mode ON: click first corner, then opposite corner.' : 'Rect mode OFF.');
        };
        toolbar.appendChild(rectBtn);
    },

    renderFloorControls() {
        const floorSelect = document.getElementById('floor-select');
        if(!floorSelect) return;
        
        floorSelect.innerHTML = '';
        this.mapData.forEach((_, index) => {
            floorSelect.innerHTML += `<option value="${index}">Floor ${index + 1}</option>`;
        });
        floorSelect.value = this.currentFloor;
        
        floorSelect.onchange = (e) => {
            this.currentFloor = parseInt(e.target.value);
            this.renderGrid();
        };
    },

    selectTool(toolId) {
        this.currentTool = toolId;
        const buttons = document.querySelectorAll('#map-toolbar .tool-btn');
        buttons.forEach((btn, index) => {
            if (index < this.tools.length) {
                if (this.tools[index].id === toolId) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });

        const subSelector = document.getElementById('map-sub-selector');
        const goldInput = document.getElementById('map-gold-input');
        const winText = document.getElementById('map-win-text');
        
        subSelector.innerHTML = '';
        subSelector.style.display = 'none';
        if (goldInput) { goldInput.style.display = 'none'; goldInput.placeholder = 'Gold Amount'; }
        if (winText) { winText.style.display = 'none'; winText.placeholder = 'Victory text...'; winText.style.width = '300px'; }
        const bwType = document.getElementById('map-bw-type');
        if (bwType) bwType.style.display = 'none';

        if (toolId === 4) {
            subSelector.style.display = 'block';
            if (this.dbData.items.length === 0) subSelector.innerHTML = "<option value=''>No items in DB!</option>";
            else this.dbData.items.forEach(i => subSelector.innerHTML += `<option value="${i.id}">${i.name}</option>`);
        } else if (toolId === 5) {
            subSelector.style.display = 'block';
            if (this.dbData.monsters.length === 0) subSelector.innerHTML = "<option value=''>No monsters in DB!</option>";
            else this.dbData.monsters.forEach(m => subSelector.innerHTML += `<option value="${m.id}">${m.name}</option>`);
        } else if (toolId === 8) { 
            subSelector.style.display = 'block';
            if (goldInput) goldInput.style.display = 'block';
            subSelector.innerHTML = "<option value=''>No Item (Gold Only)</option>";
            this.dbData.items.forEach(i => subSelector.innerHTML += `<option value="${i.id}">${i.name}</option>`);
        } else if (toolId === 9) {
            subSelector.style.display = 'block';
            const weapons = this.dbData.items.filter(i => i.type === 'weapon');
            if (weapons.length === 0) subSelector.innerHTML = "<option value=''>No Weapons in DB!</option>";
            else weapons.forEach(w => subSelector.innerHTML += `<option value="${w.id}">${w.name}</option>`);
            if (bwType) bwType.style.display = 'block';
        } else if (toolId === 10) { 
            subSelector.style.display = 'block';
            const keys = this.dbData.items.filter(i => i.type === 'key');
            if (keys.length === 0) subSelector.innerHTML = "<option value=''>No Key Items in DB!</option>";
            else keys.forEach(k => subSelector.innerHTML += `<option value="${k.id}">${k.name}</option>`);
        } else if (toolId === 11) {
            subSelector.style.display = 'block';
            const npcs = this.dbData.npcs || [];
            if (npcs.length === 0) subSelector.innerHTML = "<option value=''>No NPCs in DB!</option>";
            else npcs.forEach(n => subSelector.innerHTML += `<option value="${n.id}">${n.name}</option>`);
        } else if (toolId === 12) {
            if (winText) winText.style.display = 'block';
        } else if (toolId === 14) {
            if (winText) { winText.style.display = 'block'; winText.placeholder = 'Scroll text...'; }
        } else if (toolId === 15) {
            subSelector.style.display = 'block';
            subSelector.innerHTML = '<option value="pit">Pit</option><option value="spikes">Spikes</option><option value="darts">Darts</option>';
            if (goldInput) { goldInput.style.display = 'block'; goldInput.placeholder = 'Damage'; goldInput.value = ''; }
        }
    },

    snapshotFloor() {
        const floor = this.mapData[this.currentFloor];
        return {
            floorIndex: this.currentFloor,
            grid: JSON.parse(JSON.stringify(floor.grid)),
            placements: JSON.parse(JSON.stringify(floor.placements))
        };
    },

    pushUndo() {
        this.undoStack.push(this.snapshotFloor());
        if (this.undoStack.length > this.MAX_UNDO) this.undoStack.shift();
        this.redoStack = [];
    },

    undo() {
        if (this.undoStack.length === 0) {
            UI.showStatus('map-status-msg', 'Nothing to undo.');
            return;
        }
        // Save current state to redo before restoring
        this.redoStack.push(this.snapshotFloor());
        const snapshot = this.undoStack.pop();
        // Switch to the floor that was edited if needed
        this.currentFloor = snapshot.floorIndex;
        this.mapData[this.currentFloor].grid = snapshot.grid;
        this.mapData[this.currentFloor].placements = snapshot.placements;
        this.renderFloorControls();
        this.renderGrid();
        UI.showStatus('map-status-msg', `Undo. (${this.undoStack.length} left)`);
    },

    redo() {
        if (this.redoStack.length === 0) {
            UI.showStatus('map-status-msg', 'Nothing to redo.');
            return;
        }
        this.undoStack.push(this.snapshotFloor());
        const snapshot = this.redoStack.pop();
        this.currentFloor = snapshot.floorIndex;
        this.mapData[this.currentFloor].grid = snapshot.grid;
        this.mapData[this.currentFloor].placements = snapshot.placements;
        this.renderFloorControls();
        this.renderGrid();
        UI.showStatus('map-status-msg', `Redo. (${this.redoStack.length} left)`);
    },

    renderGrid() {
        const gridElement = document.getElementById('map-grid');
        gridElement.innerHTML = '';
        const currentFloorData = this.mapData[this.currentFloor];

        for (let y = 0; y < currentFloorData.grid.length; y++) {
            for (let x = 0; x < currentFloorData.grid[y].length; x++) {
                let tile = document.createElement('div');
                let tileVal = currentFloorData.grid[y][x];
                tile.className = `tile tile-${tileVal}`;
                
                if (tileVal === 6) tile.style.backgroundColor = "#9c27b0";
                if (tileVal === 7) tile.style.backgroundColor = "#673ab7";
                if (tileVal === 8) tile.style.backgroundColor = "#ff9800";
                if (tileVal === 9) tile.style.backgroundColor = "#6d5040";
                if (tileVal === 10) tile.style.backgroundColor = "#006064";
                if (tileVal === 11) tile.style.backgroundColor = "#2e7d32";
                if (tileVal === 12) tile.style.backgroundColor = "#ffd700";
                if (tileVal === 13) tile.style.backgroundColor = "#9e8e7e";
                if (tileVal === 14) tile.style.backgroundColor = "#d4a574";
                if (tileVal === 15) tile.style.backgroundColor = "#a04040";
                
                let key = `${x},${y}`;
                if (tileVal === 4 && currentFloorData.placements.items[key]) tile.title = currentFloorData.placements.items[key];
                if (tileVal === 5 && currentFloorData.placements.monsters[key]) tile.title = currentFloorData.placements.monsters[key];
                if (tileVal === 10 && currentFloorData.placements.doors[key]) tile.title = `Locked: ${currentFloorData.placements.doors[key]}`;
                if (tileVal === 8 && currentFloorData.placements.chests[key]) {
                    let c = currentFloorData.placements.chests[key];
                    tile.title = `Chest: ${c.item || 'No Item'} | ${c.gold}G`;
                }
                if (tileVal === 11 && currentFloorData.placements.npcs[key]) {
                    tile.title = `NPC: ${currentFloorData.placements.npcs[key]}`;
                }
                if (tileVal === 12 && currentFloorData.placements.wins[key]) {
                    tile.title = `Win: "${currentFloorData.placements.wins[key]}"`;
                }
                if (tileVal === 13) {
                    tile.title = "Illusionary Wall (walkable)";
                }
                if (tileVal === 9 && currentFloorData.placements.breakwalls[key]) {
                    let bw = currentFloorData.placements.breakwalls[key];
                    tile.title = `Breakable (${bw.subtype}): needs ${bw.weaponId}`;
                }
                if (tileVal === 14 && currentFloorData.placements.lore[key]) {
                    tile.title = `Scroll: "${currentFloorData.placements.lore[key].text}"`;
                }
                if (tileVal === 15 && currentFloorData.placements.traps[key]) {
                    let t = currentFloorData.placements.traps[key];
                    tile.title = `Trap: ${t.subtype} (${t.damage} dmg)`;
                }

                tile.addEventListener('mousedown', (e) => {
    		e.preventDefault();

    		if (this.rectMode) {
        	    this.handleRectClick(x, y);
        	    return;
    		}

    		if (this.lineMode) {
        	this.handleLineClick(x, y);
        	return;
    		}

    		this.pushUndo();
    		this.isDrawing = true;
    		this.paintTile(x, y, tile);
});

tile.addEventListener('mouseenter', () => {
    if (!this.lineMode && this.isDrawing) this.paintTile(x, y, tile);
});

                gridElement.appendChild(tile);
            }
        }
    },

    paintTile(x, y, tileElement) {
        let floor = this.mapData[this.currentFloor];
        let key = `${x},${y}`;
        const subSelector = document.getElementById('map-sub-selector');
        const goldInput = document.getElementById('map-gold-input');

        delete floor.placements.items[key];
        delete floor.placements.monsters[key];
        delete floor.placements.chests[key];
        delete floor.placements.doors[key];
        delete floor.placements.npcs[key];
        delete floor.placements.wins[key];
        delete floor.placements.lore[key];
        delete floor.placements.traps[key];
        delete floor.placements.breakwalls[key];

        if (this.currentTool === 4 && subSelector.value) floor.placements.items[key] = subSelector.value;
        else if (this.currentTool === 5 && subSelector.value) floor.placements.monsters[key] = subSelector.value;
        else if (this.currentTool === 8) floor.placements.chests[key] = { item: subSelector.value, gold: parseInt(goldInput.value) || 0 };
        else if (this.currentTool === 9 && subSelector.value) {
            let st = (document.getElementById('map-bw-type').value || 'cracked');
            floor.placements.breakwalls[key] = { subtype: st, weaponId: subSelector.value };
        }
        else if (this.currentTool === 10 && subSelector.value) floor.placements.doors[key] = subSelector.value;
        else if (this.currentTool === 11 && subSelector.value) floor.placements.npcs[key] = subSelector.value;
        else if (this.currentTool === 12) floor.placements.wins[key] = document.getElementById('map-win-text').value || "You win!";
        else if (this.currentTool === 14) floor.placements.lore[key] = { text: document.getElementById('map-win-text').value || "You find a note...", persist: false };
        else if (this.currentTool === 15) floor.placements.traps[key] = { subtype: subSelector.value || 'pit', damage: parseInt(goldInput.value) || 5 };

        floor.grid[y][x] = this.currentTool;

        if ([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(this.currentTool)) { 
            this.renderGrid(); 
        } else { 
            tileElement.className = `tile tile-${this.currentTool}`; 
            tileElement.style.backgroundColor = ""; 
            tileElement.title = ""; 
        }
    },
handleLineClick(x, y) {
    // First click: set start
    if (!this.lineStart) {
        this.lineStart = { x, y };
        UI.showStatus('map-status-msg', `Line start set at (${x},${y}). Now click the end tile.`);
        return;
    }

    // Second click: draw line
    const start = this.lineStart;
    this.lineStart = null;

    this.pushUndo();
    const points = this.getLinePoints(start.x, start.y, x, y);
    points.forEach(p => this.applyToolAt(p.x, p.y));

    this.renderGrid();
    UI.showStatus('map-status-msg', `Drew line (${start.x},${start.y}) → (${x},${y}).`);
},

handleRectClick(x, y) {
    if (!this.rectStart) {
        this.rectStart = { x, y };
        UI.showStatus('map-status-msg', `Rect corner 1 set at (${x},${y}). Now click the opposite corner.`);
        return;
    }

    const s = this.rectStart;
    this.rectStart = null;

    this.pushUndo();
    const minX = Math.min(s.x, x), maxX = Math.max(s.x, x);
    const minY = Math.min(s.y, y), maxY = Math.max(s.y, y);

    for (let ry = minY; ry <= maxY; ry++) {
        for (let rx = minX; rx <= maxX; rx++) {
            this.applyToolAt(rx, ry);
        }
    }

    this.renderGrid();
    UI.showStatus('map-status-msg', `Filled rect (${s.x},${s.y}) → (${x},${y}).`);
},

getLinePoints(x0, y0, x1, y1) {
    // Bresenham line (simple + reliable)
    const points = [];
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return points;
},

applyToolAt(x, y) {
    // Paint logic without needing the tile DOM element
    let floor = this.mapData[this.currentFloor];
    let key = `${x},${y}`;
    const subSelector = document.getElementById('map-sub-selector');
    const goldInput = document.getElementById('map-gold-input');

    delete floor.placements.items[key];
    delete floor.placements.monsters[key];
    delete floor.placements.chests[key];
    delete floor.placements.doors[key];
    delete floor.placements.npcs[key];
    delete floor.placements.wins[key];
    delete floor.placements.lore[key];
    delete floor.placements.traps[key];
    delete floor.placements.breakwalls[key];

    if (this.currentTool === 4 && subSelector.value) floor.placements.items[key] = subSelector.value;
    else if (this.currentTool === 5 && subSelector.value) floor.placements.monsters[key] = subSelector.value;
    else if (this.currentTool === 8) floor.placements.chests[key] = { item: subSelector.value, gold: parseInt(goldInput.value) || 0 };
    else if (this.currentTool === 9 && subSelector.value) {
        let st = (document.getElementById('map-bw-type').value || 'cracked');
        floor.placements.breakwalls[key] = { subtype: st, weaponId: subSelector.value };
    }
    else if (this.currentTool === 10 && subSelector.value) floor.placements.doors[key] = subSelector.value;
    else if (this.currentTool === 11 && subSelector.value) floor.placements.npcs[key] = subSelector.value;
    else if (this.currentTool === 12) floor.placements.wins[key] = document.getElementById('map-win-text').value || "You win!";
    else if (this.currentTool === 14) floor.placements.lore[key] = { text: document.getElementById('map-win-text').value || "You find a note...", persist: false };
    else if (this.currentTool === 15) floor.placements.traps[key] = { subtype: subSelector.value || 'pit', damage: parseInt(goldInput.value) || 5 };

    floor.grid[y][x] = this.currentTool;
},
    setupControls() {
        // Undo/Redo keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle when map editor tab is active
            if (!document.getElementById('view-map').classList.contains('active')) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });

        document.getElementById('save-map-btn').addEventListener('click', async () => {
            const result = await API.saveMap(this.mapData);
            UI.showStatus('map-status-msg', result.message, result.status !== 'success');
        });

        document.getElementById('export-game-btn').addEventListener('click', async () => {
            await API.saveMap(this.mapData);
            const result = await API.exportGame();
            UI.showStatus('map-status-msg', result.message, result.status !== 'success');
        });
document.getElementById('test-play-btn').addEventListener('click', async () => {
    await API.saveMap(this.mapData);

    try {
        const resp = await fetch('/playtest');
        if (!resp.ok) {
            UI.showStatus('map-status-msg', 'Playtest failed: server error.', true);
            return;
        }
        const html = await resp.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        UI.showStatus('map-status-msg', 'Opened Test Play in a new tab.');
    } catch (e) {
        UI.showStatus('map-status-msg', 'Playtest error: ' + e.message, true);
    }
});

        const addBtn = document.getElementById('add-floor-btn');
        if(addBtn) {
            addBtn.addEventListener('click', () => {
                if(this.mapData.length >= 20) return alert("Maximum of 20 floors reached!");
                document.getElementById('floor-template-modal').style.display = 'flex';
            });
        }
        
        const delBtn = document.getElementById('del-floor-btn');
        if(delBtn) {
            delBtn.addEventListener('click', () => {
                if(this.mapData.length <= 1) return alert("You must have at least one floor!");
                if(confirm("Delete this floor completely? This cannot be undone.")) {
                    this.mapData.splice(this.currentFloor, 1);
                    this.currentFloor = Math.max(0, this.currentFloor - 1);
                    this.renderFloorControls();
                    this.renderGrid();
                }
            });
        }
    },

    closeTemplateModal() {
        document.getElementById('floor-template-modal').style.display = 'none';
    },

    addFloorWithTemplate(type) {
        this.closeTemplateModal();
        const grid = this.generateGrid(type);
        this.mapData.push({
            grid,
            placements: { items: {}, monsters: {}, chests: {}, doors: {}, npcs: {}, wins: {}, lore: {}, traps: {}, breakwalls: {} }
        });
        this.currentFloor = this.mapData.length - 1;
        this.renderFloorControls();
        this.renderGrid();

        const labels = { empty: 'Empty', border: 'Border Walls', maze: 'Maze' };
        UI.showStatus('map-status-msg', `Added Floor ${this.currentFloor + 1} (${labels[type]}).`);
    },

    generateGrid(type) {
        const S = 20;
        // Empty — all floor
        if (type === 'empty') {
            return Array(S).fill(null).map(() => Array(S).fill(0));
        }
        // Border Walls — walls on edges, floor inside
        if (type === 'border') {
            return Array(S).fill(null).map((_, y) =>
                Array(S).fill(null).map((_, x) =>
                    (x === 0 || x === S - 1 || y === 0 || y === S - 1) ? 1 : 0
                )
            );
        }
        // Maze — recursive backtracker
        if (type === 'maze') {
            return this.generateMaze(S);
        }
        return Array(S).fill(null).map(() => Array(S).fill(0));
    },

    generateMaze(size) {
        // Start with all walls
        const grid = Array(size).fill(null).map(() => Array(size).fill(1));

        // Maze cells are on odd coordinates (1,3,5,...,19)
        // This gives us a 10x10 logical maze within the 20x20 grid
        const cellsW = Math.floor(size / 2);
        const cellsH = Math.floor(size / 2);
        const visited = Array(cellsH).fill(null).map(() => Array(cellsW).fill(false));

        const toGrid = (cx, cy) => [cx * 2 + 1, cy * 2 + 1];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        const carve = (cx, cy) => {
            visited[cy][cx] = true;
            const [gx, gy] = toGrid(cx, cy);
            grid[gy][gx] = 0;

            for (const [dx, dy] of shuffle([...dirs])) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= cellsW || ny < 0 || ny >= cellsH) continue;
                if (visited[ny][nx]) continue;

                // Carve the wall between current cell and neighbour
                const wallX = gx + dx;
                const wallY = gy + dy;
                grid[wallY][wallX] = 0;

                carve(nx, ny);
            }
        };

        // Start from a random cell
        const startCX = Math.floor(Math.random() * cellsW);
        const startCY = Math.floor(Math.random() * cellsH);
        carve(startCX, startCY);

        return grid;
    }
};

document.addEventListener('DOMContentLoaded', () => { MapEditor.init(); });