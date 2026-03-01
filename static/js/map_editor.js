const MapEditor = {
    mapData: [], 
    dbData: { items: [], monsters: [] },
    currentTool: 0,
    currentFloor: 0,
    isDrawing: false,

    tools: [
        { id: 0, name: "Floor / Eraser", color: "#ddd", tip: "Paint walkable floor tiles, or erase existing tiles back to floor" },
        { id: 1, name: "Wall", color: "#222", tip: "Solid wall — blocks movement and line of sight" },
        { id: 2, name: "Door", color: "#3a7ca5", tip: "Door — players press E to open/close" },
        { id: 4, name: "Item", color: "#fbc02d", tip: "Place an item pickup — select which item from the dropdown" },
        { id: 5, name: "Monster", color: "#8b0000", tip: "Place a monster encounter — select which monster from the dropdown" },
        { id: 6, name: "Stairs Up", color: "#9c27b0", tip: "Stairs leading up — connects to stairs down on the floor above (or exits to town on floor 1)" },
        { id: 7, name: "Stairs Down", color: "#673ab7", tip: "Stairs leading down — connects to stairs up on the floor below" },
        { id: 8, name: "Chest", color: "#ff9800", tip: "Treasure chest — can contain an item and/or gold" },
        { id: 10, name: "Locked Door", color: "#006064", tip: "Locked door — requires a specific key item to open" },
        { id: 11, name: "NPC", color: "#2e7d32", tip: "Place an NPC — select which NPC from the dropdown" },
        { id: 12, name: "Win Trigger", color: "#ffd700", tip: "Walking here triggers the victory screen — enter victory text below" },
        { id: 13, name: "Illusion Wall", color: "#9e8e7e", tip: "Looks like a wall but players can walk through — brickwork is subtly wrong as a visual clue" }
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
            if (this.tools[index].id === toolId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        const subSelector = document.getElementById('map-sub-selector');
        const goldInput = document.getElementById('map-gold-input');
        const winText = document.getElementById('map-win-text');
        
        subSelector.innerHTML = '';
        subSelector.style.display = 'none';
        if (goldInput) goldInput.style.display = 'none';
        if (winText) winText.style.display = 'none';

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
        }
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
                if (tileVal === 10) tile.style.backgroundColor = "#006064";
                if (tileVal === 11) tile.style.backgroundColor = "#2e7d32";
                if (tileVal === 12) tile.style.backgroundColor = "#ffd700";
                if (tileVal === 13) tile.style.backgroundColor = "#9e8e7e";
                
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

                tile.addEventListener('mousedown', (e) => { e.preventDefault(); this.isDrawing = true; this.paintTile(x, y, tile); });
                tile.addEventListener('mouseenter', () => { if (this.isDrawing) this.paintTile(x, y, tile); });

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

        if (this.currentTool === 4 && subSelector.value) floor.placements.items[key] = subSelector.value;
        else if (this.currentTool === 5 && subSelector.value) floor.placements.monsters[key] = subSelector.value;
        else if (this.currentTool === 8) floor.placements.chests[key] = { item: subSelector.value, gold: parseInt(goldInput.value) || 0 };
        else if (this.currentTool === 10 && subSelector.value) floor.placements.doors[key] = subSelector.value;
        else if (this.currentTool === 11 && subSelector.value) floor.placements.npcs[key] = subSelector.value;
        else if (this.currentTool === 12) floor.placements.wins[key] = document.getElementById('map-win-text').value || "You win!";

        floor.grid[y][x] = this.currentTool;

        if ([4, 5, 6, 7, 8, 10, 11, 12, 13].includes(this.currentTool)) { 
            this.renderGrid(); 
        } else { 
            tileElement.className = `tile tile-${this.currentTool}`; 
            tileElement.style.backgroundColor = ""; 
            tileElement.title = ""; 
        }
    },

    setupControls() {
        document.getElementById('save-map-btn').addEventListener('click', async () => {
            const result = await API.saveMap(this.mapData);
            UI.showStatus('map-status-msg', result.message, result.status !== 'success');
        });

        document.getElementById('export-game-btn').addEventListener('click', async () => {
            await API.saveMap(this.mapData);
            const result = await API.exportGame();
            UI.showStatus('map-status-msg', result.message, result.status !== 'success');
        });

        const addBtn = document.getElementById('add-floor-btn');
        if(addBtn) {
            addBtn.addEventListener('click', () => {
                if(this.mapData.length >= 20) return alert("Maximum of 20 floors reached!");
                this.mapData.push({
                    grid: Array(20).fill(null).map(() => Array(20).fill(0)),
                    placements: { items: {}, monsters: {}, chests: {}, doors: {}, npcs: {}, wins: {} }
                });
                this.currentFloor = this.mapData.length - 1;
                this.renderFloorControls();
                this.renderGrid();
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
    }
};

document.addEventListener('DOMContentLoaded', () => { MapEditor.init(); });