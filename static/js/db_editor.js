const DbEditor = {
    dbData: { items: [], monsters: [], npcs: [], town: { name: "", shopkeeper: "", shopGreeting: "", tavernCost: 0, churchCost: 0, shopItems: [] }, classes: [], spells: [], gameName: "" },
    selectedClassIndex: -1,
    editingItem: -1,
    editingSpell: -1,
    editingMonster: -1,
    editingNpc: -1,

    async init() {
        this.dbData = await API.loadDb();
        
        if (!this.dbData.town) {
            this.dbData.town = { name: "Oakhaven", shopkeeper: "Grom the Merchant", shopGreeting: "Welcome to my shop. Have a look around.", tavernCost: 10, churchCost: 50, shopItems: [] };
        }
        if (!this.dbData.town.shopGreeting) {
            this.dbData.town.shopGreeting = "Welcome to my shop. Have a look around.";
        }
        if (!this.dbData.gameName) {
            this.dbData.gameName = "The Grimoire Engine";
        }
        if (!this.dbData.npcs) {
            this.dbData.npcs = [];
        }
        if (!this.dbData.classes) {
            this.dbData.classes = [];
        }
        if (!this.dbData.spells) {
            this.dbData.spells = [];
        }

        // Remove deprecated top-level progression field if present
        if (this.dbData.progression) {
            delete this.dbData.progression;
        }

        this.renderForms();
        this.bindTownInputs();
        this.renderLists();
        this.setupControls();
        this.initMusicComposer();

        // Game Name binding
        const gameNameInput = document.getElementById('game-name-input');
        if (gameNameInput) {
            gameNameInput.value = this.dbData.gameName;
            gameNameInput.addEventListener('input', (e) => this.dbData.gameName = e.target.value);
        }
        // Intro Text binding
        if (!this.dbData.introText) this.dbData.introText = "";
        const introInput = document.getElementById('game-intro-input');
        if (introInput) {
            introInput.value = this.dbData.introText;
            introInput.addEventListener('input', (e) => this.dbData.introText = e.target.value);
        }
    },

    renderForms() {
        const townForm = document.getElementById('town-form');
        townForm.innerHTML = `
            <input type="text" id="town-name" placeholder="Town Name" value="${this.dbData.town.name}" style="width: 140px;" title="Town Name">
            <input type="text" id="town-shopkeeper" placeholder="Shopkeeper" value="${this.dbData.town.shopkeeper}" style="width: 140px;" title="Shopkeeper Name">
            <input type="text" id="town-shop-greeting" placeholder="Shop greeting..." value="${this.dbData.town.shopGreeting || ''}" style="width: 280px;" title="Shopkeeper Greeting">
            <input type="number" id="town-tavern" placeholder="Tavern Cost" value="${this.dbData.town.tavernCost}" style="width: 100px;" title="Tavern Rest Cost (Gold)">
            <input type="number" id="town-church" placeholder="Church Cost" value="${this.dbData.town.churchCost}" style="width: 100px;" title="Church Resurrect Cost (Gold)">
        `;

        const itemForm = document.getElementById('item-form');
        itemForm.innerHTML = `
            <input type="text" id="item-id" placeholder="ID (e.g. key1)" style="width: 100px;" title="Unique ID — lowercase, no spaces">
            <input type="text" id="item-name" placeholder="Item Name" style="width: 150px;" title="Display name shown in inventory">
            <select id="item-type" title="Healing items restore HP when used. Key items unlock doors and complete NPC quests. Weapons equip to a hero for bonus ATK. Town Scrolls warp the party back to town.">
                <option value="use">Healing Item</option>
                <option value="key">Key Item</option>
                <option value="weapon">Weapon</option>
                <option value="town">Town Scroll</option>
            </select>
            <input type="number" id="item-val" placeholder="Value (Gold)" style="width: 80px;" title="Gold value for shop pricing (buy price; sell at 50%)">
            <input type="number" id="item-atk" placeholder="ATK Bonus" style="width: 80px; display:none;" title="Attack bonus added to hero's ATK when equipped">
            <label style="display:flex; align-items:center; gap:5px; font-size:13px; white-space:nowrap;" title="If checked, players cannot sell this item at the shop"><input type="checkbox" id="item-nosell"> Cannot Sell</label>
            <button class="action-btn" style="background: var(--accent-green); padding: 8px;" id="add-item-btn" title="Add this item to the database">Add Item</button>
        `;

        const monsterForm = document.getElementById('monster-form');
        monsterForm.innerHTML = `
            <input type="text" id="mon-id" placeholder="ID (e.g. bat)" title="Unique ID — lowercase, no spaces">
            <input type="text" id="mon-name" placeholder="Monster Name" title="Display name shown in combat">
            <input type="number" id="mon-hp" placeholder="Max HP (e.g. 10)" title="How much damage the monster can take before dying">
            <input type="number" id="mon-atk" placeholder="Attack (e.g. 3)" title="Maximum damage per hit (actual damage is random 1 to this value)">
            <input type="number" id="mon-xp" placeholder="XP Reward (e.g. 5)" title="Experience points awarded to each surviving party member">
            <input type="number" id="mon-gold" placeholder="Gold Drop (e.g. 2)" title="Gold dropped on defeat">
            <select id="mon-drop-item" style="width:100%;" title="Item this monster can drop on death (optional)">
                <option value="">— No Item Drop —</option>
            </select>
            <input type="number" id="mon-drop-rate" placeholder="Drop Rate % (e.g. 30)" min="0" max="100" title="Chance (0-100%) the item drops on death. Only applies if an item is selected above.">
            <label style="display:flex; align-items:center; gap:5px; color:#c4a030; font-size:13px;" title="If checked, killing this monster triggers the victory screen"><input type="checkbox" id="mon-boss"> Final Boss (Win on Kill)</label>
            <input type="text" id="mon-win-text" placeholder="Victory text..." style="width:100%; display:none;" title="Text shown on the victory screen when boss is defeated">
            <button class="action-btn" style="background: var(--accent-blue); padding: 8px;" id="suggest-stats-btn" title="Auto-fill HP, ATK, XP, and Gold based on your classes and a target level">Suggest Stats</button>
            <button class="action-btn" style="background: var(--border-color); padding: 8px;" id="clear-ink-btn" title="Erase the sprite drawing grid">Clear Grid</button>
            <button class="action-btn" style="background: var(--accent-green); padding: 8px;" id="add-mon-btn" title="Add this monster to the database">Add Monster</button>
        `;

        const npcForm = document.getElementById('npc-form');
        if (npcForm) {
            npcForm.innerHTML = `
                <input type="text" id="npc-id" placeholder="ID (e.g. old_hag)" title="Unique ID — lowercase, no spaces">
                <input type="text" id="npc-name" placeholder="NPC Name" title="Display name shown in the message log">
                <select id="npc-req-item" style="width:100%;" title="Key item the player must have to complete this NPC's quest (optional)">
                    <option value="">No Required Item</option>
                </select>
                <input type="text" id="npc-dialogue" placeholder="Default dialogue..." style="width:100%;" title="What the NPC says when spoken to without the required item">
                <input type="text" id="npc-complete" placeholder="Quest complete text..." style="width:100%;" title="What the NPC says when the player turns in the required item">
                <input type="text" id="npc-idle" placeholder="Idle text (after done)..." style="width:100%;" title="What the NPC says after their quest is already completed">
                <select id="npc-reward-item" style="width:100%;" title="Item given to the player on quest completion (optional)">
                    <option value="">No Item Reward</option>
                </select>
                <input type="number" id="npc-reward-gold" placeholder="Reward Gold" title="Gold given to the player on quest completion">
                <button class="action-btn" style="background: var(--border-color); padding: 8px;" id="clear-npc-ink-btn" title="Erase the NPC sprite drawing grid">Clear Grid</button>
                <button class="action-btn" style="background: var(--accent-green); padding: 8px;" id="add-npc-btn" title="Add this NPC to the database">Add NPC</button>
            `;
        }

        // Attach Base Events
        document.getElementById('add-item-btn').addEventListener('click', () => this.addItem());
        document.getElementById('item-type').addEventListener('change', (e) => {
            document.getElementById('item-atk').style.display = e.target.value === 'weapon' ? 'inline-block' : 'none';
        });
        document.getElementById('add-mon-btn').addEventListener('click', () => this.addMonster());
        document.getElementById('suggest-stats-btn').addEventListener('click', () => this.suggestMonsterStats());
        document.getElementById('clear-ink-btn').addEventListener('click', () => InkGrid.clear());
        document.getElementById('mon-boss').addEventListener('change', (e) => {
            document.getElementById('mon-win-text').style.display = e.target.checked ? 'block' : 'none';
        });
        if (document.getElementById('add-npc-btn')) {
            document.getElementById('add-npc-btn').addEventListener('click', () => this.addNpc());
            document.getElementById('clear-npc-ink-btn').addEventListener('click', () => InkGrid.clearGrid('npc-ink-grid'));
        }

        // Class and Spell Events
        document.getElementById('add-class-btn').addEventListener('click', () => this.addClass());
        document.getElementById('add-spell-btn').addEventListener('click', () => this.addSpell());
        document.getElementById('add-class-spell-btn').addEventListener('click', () => this.addClassSpell());
    },

    bindTownInputs() {
        document.getElementById('town-name').addEventListener('input', (e) => this.dbData.town.name = e.target.value);
        document.getElementById('town-shopkeeper').addEventListener('input', (e) => this.dbData.town.shopkeeper = e.target.value);
        document.getElementById('town-shop-greeting').addEventListener('input', (e) => this.dbData.town.shopGreeting = e.target.value);
        document.getElementById('town-tavern').addEventListener('input', (e) => this.dbData.town.tavernCost = parseInt(e.target.value) || 0);
        document.getElementById('town-church').addEventListener('input', (e) => this.dbData.town.churchCost = parseInt(e.target.value) || 0);
    },

    renderLists() {
        // Classes List
        const classList = document.getElementById('class-list');
        if (classList) {
            classList.innerHTML = '';
            this.dbData.classes.forEach((cls, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${cls.name}</strong> (${cls.id}) 
                                <button style="float:right; cursor:pointer; margin-left:5px;" onclick="DbEditor.deleteClass(${index})">X</button>
                                <button style="float:right; cursor:pointer; background:var(--accent-blue); border:none; color:white; padding:2px 6px;" onclick="DbEditor.selectClass(${index})">Edit</button>`;
                classList.appendChild(li);
            });
        }

        // Spells List
        const spellList = document.getElementById('spell-list');
        if (spellList) {
            spellList.innerHTML = '';
            this.dbData.spells.forEach((spell, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${spell.name}</strong> (${spell.id}) - Type: ${spell.type}, Val: ${spell.val}
                                <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteSpell(${index})">X</button>
                                <button style="float:right; cursor:pointer; background:var(--accent-blue); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.editSpell(${index})">Edit</button>`;
                spellList.appendChild(li);
            });
        }

        // Update Class Spell Select Dropdown
        const spellSelect = document.getElementById('class-spell-select');
        if (spellSelect) {
            spellSelect.innerHTML = '<option value="">Select Spell...</option>';
            this.dbData.spells.forEach(s => {
                spellSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }

        // Update Class Level Dropdown
        const levelSelect = document.getElementById('class-spell-level');
        if (levelSelect && levelSelect.options.length === 0) {
            for(let i=1; i<=20; i++) {
                levelSelect.innerHTML += `<option value="${i}">Level ${i}</option>`;
            }
        }

        // Shop Items
        const shopForm = document.getElementById('shop-form');
        shopForm.innerHTML = `<select id="shop-item-select" style="width: 200px;"><option value="">Select Item to Sell...</option></select>
                              <button class="action-btn" style="background: var(--accent-blue); padding: 8px;" id="add-shop-btn">Add to Shop</button>`;
        const shopSelect = document.getElementById('shop-item-select');
        this.dbData.items.forEach(item => {
            shopSelect.innerHTML += `<option value="${item.id}">${item.name} (Value: ${item.val})</option>`;
        });
        document.getElementById('add-shop-btn').addEventListener('click', () => this.addShopItem());

        const shopList = document.getElementById('shop-list');
        shopList.innerHTML = '';
        this.dbData.town.shopItems.forEach((itemId, index) => {
            const itemObj = this.dbData.items.find(i => i.id === itemId);
            const dispName = itemObj ? itemObj.name : "Unknown Item";
            const li = document.createElement('li');
            li.innerHTML = `<strong>${dispName}</strong> (${itemId})
                            <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteShopItem(${index})">X</button>`;
            shopList.appendChild(li);
        });

        // Regular Items
        const itemList = document.getElementById('item-list');
        itemList.innerHTML = '';
        this.dbData.items.forEach((item, index) => {
            const li = document.createElement('li');
            let atkTag = item.type === 'weapon' ? ` | ATK+${item.atkBonus || 0}` : '';
            let noSellTag = item.noSell ? ' <span style="color:#8b3030;">🔒</span>' : '';
            li.innerHTML = `<strong>${item.name}</strong> (${item.id}) - ${item.type === 'weapon' ? 'Weapon' : item.type} Val: ${item.val}${atkTag}${noSellTag} 
                            <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteItem(${index})">X</button>
                            <button style="float:right; cursor:pointer; background:var(--accent-blue); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.editItem(${index})">Edit</button>`;
            itemList.appendChild(li);
        });

        // Monsters
        const monsterList = document.getElementById('monster-list');
        monsterList.innerHTML = '';
        this.dbData.monsters.forEach((mon, index) => {
            const li = document.createElement('li');
            let bossTag = mon.isBoss ? ' <span style="color:#c4a030;">★ BOSS</span>' : '';
            li.innerHTML = `<strong>${mon.name}</strong> (${mon.id}) - HP: ${mon.hp} | Gold: ${mon.gold || 0}${bossTag}
                            <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteMonster(${index})">X</button>
                            <button style="float:right; cursor:pointer; background:var(--accent-blue); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.editMonster(${index})">Edit</button>
                            <button style="float:right; cursor:pointer; background:var(--accent-green); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.copyMonsterSprite(${index})" title="Copy this sprite to the drawing grid">Copy Sprite</button>`;
            monsterList.appendChild(li);
        });

        // NPCs
        const npcList = document.getElementById('npc-list');
        if (npcList) {
            npcList.innerHTML = '';
            this.dbData.npcs.forEach((npc, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${npc.name}</strong> (${npc.id}) - Req: ${npc.reqItem || 'None'}
                                <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteNpc(${index})">X</button>
                                <button style="float:right; cursor:pointer; background:var(--accent-blue); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.editNpc(${index})">Edit</button>
                                <button style="float:right; cursor:pointer; background:var(--accent-green); border:none; color:white; padding:2px 6px; margin-right:5px;" onclick="DbEditor.copyNpcSprite(${index})" title="Copy this sprite to the drawing grid">Copy Sprite</button>`;
                npcList.appendChild(li);
            });
        }

        // NPC Required Item Selects
        const npcReqSelect = document.getElementById('npc-req-item');
        if (npcReqSelect) {
            npcReqSelect.innerHTML = '<option value="">No Required Item</option>';
            this.dbData.items.filter(i => i.type === 'key').forEach(k => {
                npcReqSelect.innerHTML += `<option value="${k.id}">${k.name}</option>`;
            });
        }
        const npcRewSelect = document.getElementById('npc-reward-item');
        if (npcRewSelect) {
            npcRewSelect.innerHTML = '<option value="">No Item Reward</option>';
            this.dbData.items.forEach(i => {
                npcRewSelect.innerHTML += `<option value="${i.id}">${i.name}</option>`;
            });
        }

        // Monster Drop Item Select
        const monDropSelect = document.getElementById('mon-drop-item');
        if (monDropSelect) {
            let curVal = monDropSelect.value;
            monDropSelect.innerHTML = '<option value="">— No Item Drop —</option>';
            this.dbData.items.forEach(i => {
                monDropSelect.innerHTML += `<option value="${i.id}">${i.name}</option>`;
            });
            monDropSelect.value = curVal;
        }
    },

    syncWithMapEditor() {
        if (typeof MapEditor !== 'undefined') {
            MapEditor.dbData = this.dbData;
            MapEditor.selectTool(MapEditor.currentTool); 
        }
    },

    // --- CLASSES LOGIC ---
    addClass() {
        const id = document.getElementById('class-id').value.trim();
        const name = document.getElementById('class-name').value.trim();
        const baseHp = parseInt(document.getElementById('class-hp').value) || 20;
        const baseAtk = parseInt(document.getElementById('class-atk').value) || 5;
        const baseSpells = parseInt(document.getElementById('class-spells').value) || 0;

        if (!id || !name) return alert("Class ID and Name are required!");

        let defaultProg = [];
        for (let i = 1; i <= 20; i++) {
            defaultProg.push({
                level: i, xpReq: i === 1 ? 0 : 50 * (i - 1),
                hpGain: i === 1 ? 0 : 5, atkGain: i === 1 ? 0 : 1, spellGain: i === 1 ? 0 : 1
            });
        }

        this.dbData.classes.push({
            id, name, baseHp, baseAtk, baseSpells,
            progression: defaultProg, spellList: []
        });

        this.renderLists();
        document.getElementById('class-id').value = '';
        document.getElementById('class-name').value = '';
        document.getElementById('class-hp').value = '';
        document.getElementById('class-atk').value = '';
        document.getElementById('class-spells').value = '';
        this.syncWithMapEditor();
    },

    deleteClass(index) {
        this.dbData.classes.splice(index, 1);
        if (this.selectedClassIndex === index) {
            this.selectedClassIndex = -1;
            document.getElementById('class-editor-section').style.display = 'none';
        } else if (this.selectedClassIndex > index) {
            this.selectedClassIndex--;
        }
        this.renderLists();
        this.syncWithMapEditor();
    },

    selectClass(index) {
        this.selectedClassIndex = index;
        document.getElementById('class-editor-section').style.display = 'block';
        document.getElementById('editing-class-title').innerText = `Editing: ${this.dbData.classes[index].name}`;
        this.renderClassEditor();
    },

    renderClassEditor() {
        if (this.selectedClassIndex === -1) return;
        const cls = this.dbData.classes[this.selectedClassIndex];

        // 1. Render class spell unlocks
        const cSpellList = document.getElementById('class-spell-list');
        cSpellList.innerHTML = '';
        if (cls.spellList.length === 0) {
            cSpellList.innerHTML = '<li><em>No spells learned natively.</em></li>';
        } else {
            cls.spellList.forEach((cs, idx) => {
                const spellObj = this.dbData.spells.find(s => s.id === cs.spellId);
                const sName = spellObj ? spellObj.name : 'Unknown Spell';
                const li = document.createElement('li');
                li.innerHTML = `Level ${cs.level}: <strong>${sName}</strong>
                                <button style="float:right; cursor:pointer;" onclick="DbEditor.deleteClassSpell(${idx})">X</button>`;
                cSpellList.appendChild(li);
            });
        }

        // 2. Render Progression Curve
        const tbody = document.getElementById('progression-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        cls.progression.forEach((prog, index) => {
            let isLvl1 = index === 0;
            let disabledAttr = isLvl1 ? 'disabled style="background:#e0dcd4; border:1px solid #ccc; color:#999; width: 60px; text-align:center;"' : 'style="width: 60px; text-align:center;"';
            
            tbody.innerHTML += `
                <tr>
                    <td style="padding: 6px; border-bottom: 1px solid var(--border-color); font-weight:bold;">${prog.level}</td>
                    <td style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                        <input type="number" ${disabledAttr} value="${prog.xpReq}" onchange="DbEditor.updateClassProgression(${index}, 'xpReq', this.value)">
                    </td>
                    <td style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                        <input type="number" ${disabledAttr} value="${prog.hpGain}" onchange="DbEditor.updateClassProgression(${index}, 'hpGain', this.value)">
                    </td>
                    <td style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                        <input type="number" ${disabledAttr} value="${prog.atkGain}" onchange="DbEditor.updateClassProgression(${index}, 'atkGain', this.value)">
                    </td>
                    <td style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                        <input type="number" ${disabledAttr} value="${prog.spellGain}" onchange="DbEditor.updateClassProgression(${index}, 'spellGain', this.value)">
                    </td>
                </tr>
            `;
        });
    },

    updateClassProgression(index, field, value) {
        if (this.selectedClassIndex === -1) return;
        this.dbData.classes[this.selectedClassIndex].progression[index][field] = parseInt(value) || 0;
    },

    addClassSpell() {
        if (this.selectedClassIndex === -1) return;
        const lvl = parseInt(document.getElementById('class-spell-level').value) || 1;
        const spellId = document.getElementById('class-spell-select').value;
        if (!spellId) return alert("Select a spell to unlock!");

        this.dbData.classes[this.selectedClassIndex].spellList.push({ level: lvl, spellId: spellId });
        this.dbData.classes[this.selectedClassIndex].spellList.sort((a, b) => a.level - b.level);
        this.renderClassEditor();
    },

    deleteClassSpell(idx) {
        if (this.selectedClassIndex === -1) return;
        this.dbData.classes[this.selectedClassIndex].spellList.splice(idx, 1);
        this.renderClassEditor();
    },

    // --- SPELLS LOGIC ---
    addSpell() {
        const id = document.getElementById('spell-id').value.trim();
        const name = document.getElementById('spell-name').value.trim();
        const type = document.getElementById('spell-type').value;
        const val = parseInt(document.getElementById('spell-val').value) || 0;

        if (!id || !name) return alert("Spell ID and Name are required!");

        if (this.editingSpell >= 0) {
            let oldId = this.dbData.spells[this.editingSpell].id;
            this.dbData.spells[this.editingSpell] = { id, name, type, val };
            // Update class spell references if ID changed
            if (oldId !== id) {
                this.dbData.classes.forEach(cls => {
                    cls.spellList.forEach(s => { if (s.spellId === oldId) s.spellId = id; });
                });
            }
            this.editingSpell = -1;
            document.getElementById('add-spell-btn').innerText = 'Add Spell';
        } else {
            this.dbData.spells.push({ id, name, type, val });
        }

        this.renderLists();
        if (this.selectedClassIndex !== -1) this.renderClassEditor();

        document.getElementById('spell-id').value = '';
        document.getElementById('spell-name').value = '';
        document.getElementById('spell-val').value = '';

        this.syncWithMapEditor();
    },

    editSpell(index) {
        let spell = this.dbData.spells[index];
        this.editingSpell = index;
        document.getElementById('spell-id').value = spell.id;
        document.getElementById('spell-name').value = spell.name;
        document.getElementById('spell-type').value = spell.type;
        document.getElementById('spell-val').value = spell.val;
        document.getElementById('add-spell-btn').innerText = 'Update Spell';
    },

    deleteSpell(index) {
        const spellToRemove = this.dbData.spells[index].id;
        this.dbData.spells.splice(index, 1);
        
        // Cascade delete: Remove this spell from all class spell lists
        this.dbData.classes.forEach(cls => {
            cls.spellList = cls.spellList.filter(s => s.spellId !== spellToRemove);
        });

        this.renderLists();
        if (this.selectedClassIndex !== -1) this.renderClassEditor();
        this.syncWithMapEditor();
    },

    // --- TOWN, ITEMS, MONSTERS, NPCS ---
    addShopItem() {
        if (this.dbData.town.shopItems.length >= 6) return alert("The shop can only hold a maximum of 6 items!");
        const itemId = document.getElementById('shop-item-select').value;
        if (!itemId) return alert("Select an item first!");
        if (this.dbData.town.shopItems.includes(itemId)) return alert("Item is already in the shop!");

        this.dbData.town.shopItems.push(itemId);
        this.renderLists();
    },

    deleteShopItem(index) {
        this.dbData.town.shopItems.splice(index, 1);
        this.renderLists();
    },

    suggestMonsterStats() {
        if (this.dbData.classes.length === 0) return alert("Create at least one class first so stats can be balanced against it.");

        let input = prompt("What player level should this monster be balanced for? (1-20)", "1");
        if (input === null) return;
        let targetLvl = Math.max(1, Math.min(20, parseInt(input) || 1));

        // Average party stats at target level across all defined classes
        let totalHp = 0, totalAtk = 0;
        this.dbData.classes.forEach(cls => {
            let hp = cls.baseHp;
            let atk = cls.baseAtk;
            for (let i = 1; i < targetLvl; i++) {
                let prog = cls.progression[i];
                if (prog) { hp += prog.hpGain; atk += prog.atkGain; }
            }
            totalHp += hp;
            totalAtk += atk;
        });

        let numClasses = this.dbData.classes.length;
        let avgHp = Math.round(totalHp / numClasses);
        let avgAtk = Math.round(totalAtk / numClasses);

        // Factor in strongest damage spell available at this level
        let bestSpellDmg = 0;
        this.dbData.classes.forEach(cls => {
            (cls.spellList || []).forEach(sl => {
                if (sl.level <= targetLvl) {
                    let spell = this.dbData.spells.find(s => s.id === sl.spellId);
                    if (spell && spell.type === 'damage') {
                        bestSpellDmg = Math.max(bestSpellDmg, spell.val);
                    }
                }
            });
        });

        // Party of 3 heroes: average damage per round ≈ 3 * (avgAtk/2) + spell bonus
        let partyDmgPerRound = Math.round(3 * (avgAtk / 2) + bestSpellDmg * 0.3);
        if (partyDmgPerRound < 1) partyDmgPerRound = 1;

        // Monster should survive 2-3 rounds
        let monHp = Math.round(partyDmgPerRound * 2.5);

        // Monster ATK: threatening but not one-shotting — deal ~20-30% of avg hero HP per hit
        let monAtk = Math.max(2, Math.round(avgHp * 0.25));

        // XP: enough that ~4-6 fights at-level covers the gap to next level
        let nextProg = this.dbData.classes[0].progression.find(p => p.level === targetLvl + 1);
        let xpToNext = nextProg ? nextProg.xpReq : 50 * targetLvl;
        let prevProg = this.dbData.classes[0].progression.find(p => p.level === targetLvl);
        let xpCurrent = prevProg ? prevProg.xpReq : 0;
        let xpGap = Math.max(10, xpToNext - xpCurrent);
        let monXp = Math.max(1, Math.round(xpGap / 5));

        // Gold: scales gently with level
        let monGold = Math.max(1, Math.round(targetLvl * 2.5));

        document.getElementById('mon-hp').value = monHp;
        document.getElementById('mon-atk').value = monAtk;
        document.getElementById('mon-xp').value = monXp;
        document.getElementById('mon-gold').value = monGold;
    },

    addItem() {
        const id = document.getElementById('item-id').value.trim();
        const name = document.getElementById('item-name').value.trim();
        const type = document.getElementById('item-type').value;
        const val = parseInt(document.getElementById('item-val').value) || 0;
        const atkBonus = type === 'weapon' ? (parseInt(document.getElementById('item-atk').value) || 0) : 0;
        const noSell = document.getElementById('item-nosell').checked;

        if (!id || !name) return alert("Item ID and Name are required!");

        let itemObj = { id, name, type, val };
        if (type === 'weapon') itemObj.atkBonus = atkBonus;
        if (noSell) itemObj.noSell = true;

        if (this.editingItem >= 0) {
            // Update existing item
            let oldId = this.dbData.items[this.editingItem].id;
            this.dbData.items[this.editingItem] = itemObj;
            // Update shop references if ID changed
            if (oldId !== id) {
                this.dbData.town.shopItems = this.dbData.town.shopItems.map(sid => sid === oldId ? id : sid);
            }
            this.editingItem = -1;
            document.getElementById('add-item-btn').innerText = 'Add Item';
        } else {
            this.dbData.items.push(itemObj);
        }

        this.renderLists();
        
        document.getElementById('item-id').value = '';
        document.getElementById('item-name').value = '';
        document.getElementById('item-val').value = '';
        document.getElementById('item-atk').value = '';
        document.getElementById('item-atk').style.display = 'none';
        document.getElementById('item-nosell').checked = false;
        document.getElementById('item-type').value = 'use';
        
        this.syncWithMapEditor();
    },

    editItem(index) {
        let item = this.dbData.items[index];
        this.editingItem = index;
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-type').value = item.type;
        document.getElementById('item-val').value = item.val;
        document.getElementById('item-atk').value = item.atkBonus || 0;
        document.getElementById('item-atk').style.display = item.type === 'weapon' ? 'inline-block' : 'none';
        document.getElementById('item-nosell').checked = item.noSell || false;
        document.getElementById('add-item-btn').innerText = 'Update Item';
    },

    addMonster() {
        const id = document.getElementById('mon-id').value.trim();
        const name = document.getElementById('mon-name').value.trim();
        const hp = parseInt(document.getElementById('mon-hp').value) || 10;
        const atk = parseInt(document.getElementById('mon-atk').value) || 2;
        const xp = parseInt(document.getElementById('mon-xp').value) || 5;
        const gold = parseInt(document.getElementById('mon-gold').value) || 0;
        const dropItem = document.getElementById('mon-drop-item').value || null;
        const dropRateRaw = parseInt(document.getElementById('mon-drop-rate').value);
        const dropRate = (!isNaN(dropRateRaw) ? Math.min(100, Math.max(0, dropRateRaw)) / 100 : 0.3);

        if (!id || !name) return alert("Monster ID and Name are required!");

        const spriteArray = InkGrid.getSpriteArray();

        if (this.editingMonster >= 0) {
            let existing = this.dbData.monsters[this.editingMonster];
            // Keep existing sprite if grid is blank (user didn't redraw)
            let isBlank = spriteArray.every(row => row.every(c => c === 0));
            this.dbData.monsters[this.editingMonster] = {
                id, name, hp, maxHp: hp, atk, xp, gold,
                dropRate, dropItem,
                sprite: isBlank ? existing.sprite : spriteArray,
                isBoss: document.getElementById('mon-boss').checked,
                winText: document.getElementById('mon-win-text').value || ""
            };
            this.editingMonster = -1;
            document.getElementById('add-mon-btn').innerText = 'Add Monster';
        } else {
            this.dbData.monsters.push({
                id, name, hp, maxHp: hp, atk, xp, gold,
                dropRate, dropItem, sprite: spriteArray,
                isBoss: document.getElementById('mon-boss').checked,
                winText: document.getElementById('mon-win-text').value || ""
            });
        }

        this.renderLists();
        InkGrid.clear();

        document.getElementById('mon-id').value = '';
        document.getElementById('mon-name').value = '';
        document.getElementById('mon-gold').value = '';
        document.getElementById('mon-boss').checked = false;
        document.getElementById('mon-win-text').value = '';
        document.getElementById('mon-win-text').style.display = 'none';
        document.getElementById('mon-drop-item').value = '';
        document.getElementById('mon-drop-rate').value = '';
        
        this.syncWithMapEditor();
    },

    editMonster(index) {
        let mon = this.dbData.monsters[index];
        this.editingMonster = index;
        document.getElementById('mon-id').value = mon.id;
        document.getElementById('mon-name').value = mon.name;
        document.getElementById('mon-hp').value = mon.hp;
        document.getElementById('mon-atk').value = mon.atk;
        document.getElementById('mon-xp').value = mon.xp;
        document.getElementById('mon-gold').value = mon.gold || 0;
        document.getElementById('mon-boss').checked = mon.isBoss || false;
        document.getElementById('mon-win-text').value = mon.winText || '';
        document.getElementById('mon-win-text').style.display = mon.isBoss ? 'block' : 'none';
        document.getElementById('mon-drop-item').value = mon.dropItem || '';
        document.getElementById('mon-drop-rate').value = mon.dropRate != null ? Math.round(mon.dropRate * 100) : 30;
        document.getElementById('add-mon-btn').innerText = 'Update Monster';
        // Load sprite into grid
        if (mon.sprite) {
            InkGrid.loadSpriteInto('ink-grid', mon.sprite);
        }
    },

    deleteItem(index) {
        const itemToRemove = this.dbData.items[index].id;
        this.dbData.items.splice(index, 1);
        this.dbData.town.shopItems = this.dbData.town.shopItems.filter(id => id !== itemToRemove);
        
        this.renderLists();
        this.syncWithMapEditor();
    },

    deleteMonster(index) {
        this.dbData.monsters.splice(index, 1);
        this.renderLists();
        this.syncWithMapEditor();
    },

    addNpc() {
        const id = document.getElementById('npc-id').value.trim();
        const name = document.getElementById('npc-name').value.trim();
        if (!id || !name) return alert("NPC ID and Name are required!");

        const spriteArray = InkGrid.getSpriteArrayFrom('npc-ink-grid');

        if (this.editingNpc >= 0) {
            let existing = this.dbData.npcs[this.editingNpc];
            let isBlank = spriteArray.every(row => row.every(c => c === 0));
            this.dbData.npcs[this.editingNpc] = {
                id, name,
                reqItem: document.getElementById('npc-req-item').value,
                dialogue: document.getElementById('npc-dialogue').value || "...",
                completeText: document.getElementById('npc-complete').value || "Thank you.",
                idleText: document.getElementById('npc-idle').value || "...",
                rewardItem: document.getElementById('npc-reward-item').value,
                rewardGold: parseInt(document.getElementById('npc-reward-gold').value) || 0,
                sprite: isBlank ? existing.sprite : spriteArray
            };
            this.editingNpc = -1;
            document.getElementById('add-npc-btn').innerText = 'Add NPC';
        } else {
            this.dbData.npcs.push({
                id, name,
                reqItem: document.getElementById('npc-req-item').value,
                dialogue: document.getElementById('npc-dialogue').value || "...",
                completeText: document.getElementById('npc-complete').value || "Thank you.",
                idleText: document.getElementById('npc-idle').value || "...",
                rewardItem: document.getElementById('npc-reward-item').value,
                rewardGold: parseInt(document.getElementById('npc-reward-gold').value) || 0,
                sprite: spriteArray
            });
        }

        this.renderLists();
        InkGrid.clearGrid('npc-ink-grid');

        document.getElementById('npc-id').value = '';
        document.getElementById('npc-name').value = '';
        document.getElementById('npc-dialogue').value = '';
        document.getElementById('npc-complete').value = '';
        document.getElementById('npc-idle').value = '';
        document.getElementById('npc-reward-gold').value = '';

        this.syncWithMapEditor();
    },

    editNpc(index) {
        let npc = this.dbData.npcs[index];
        this.editingNpc = index;
        document.getElementById('npc-id').value = npc.id;
        document.getElementById('npc-name').value = npc.name;
        document.getElementById('npc-dialogue').value = npc.dialogue || '';
        document.getElementById('npc-complete').value = npc.completeText || '';
        document.getElementById('npc-idle').value = npc.idleText || '';
        document.getElementById('npc-reward-gold').value = npc.rewardGold || 0;
        // Set selects after renderLists has populated them
        setTimeout(() => {
            document.getElementById('npc-req-item').value = npc.reqItem || '';
            document.getElementById('npc-reward-item').value = npc.rewardItem || '';
        }, 0);
        document.getElementById('add-npc-btn').innerText = 'Update NPC';
        if (npc.sprite) {
            InkGrid.loadSpriteInto('npc-ink-grid', npc.sprite);
        }
    },

    deleteNpc(index) {
        this.dbData.npcs.splice(index, 1);
        this.renderLists();
        this.syncWithMapEditor();
    },

    copyMonsterSprite(index) {
        const mon = this.dbData.monsters[index];
        if (mon && mon.sprite) {
            InkGrid.loadSpriteInto('ink-grid', mon.sprite);
        }
    },

    copyNpcSprite(index) {
        const npc = this.dbData.npcs[index];
        if (npc && npc.sprite) {
            InkGrid.loadSpriteInto('npc-ink-grid', npc.sprite);
        }
    },

    // ========== MUSIC COMPOSER ==========
    musicAudioCtx: null,
    musicPreviewSource: null,
    musicPreviewBuffer: null,

    musicGenres: {
        fantasy: { id: 'fantasy', waveMelody: 'square', waveBass: 'triangle', pitchMod: 1.0 },
        scifi:   { id: 'scifi',   waveMelody: 'sawtooth', waveBass: 'square', pitchMod: 2.0 },
        horror:  { id: 'horror',  waveMelody: 'sine', waveBass: 'sawtooth', pitchMod: 0.5 },
        weird:   { id: 'weird',   waveMelody: 'triangle', waveBass: 'sine', pitchMod: 1.0 }
    },
    musicVibes: {
        fun:      { scale: [261.6, 293.7, 329.6, 392.0, 440.0], tempoRange: [250, 350], density: 0.6 },
        action:   { scale: [329.6, 349.2, 392.0, 493.9, 523.3], tempoRange: [180, 250], density: 0.8 },
        gloomy:   { scale: [293.7, 349.2, 440.0, 466.2, 523.3], tempoRange: [500, 700], density: 0.35 },
        spooky:   { scale: [261.6, 311.1, 370.0, 440.0, 523.2], tempoRange: [400, 550], density: 0.5 },
        dramatic: { scale: [440.0, 493.9, 523.3, 587.3, 659.3], tempoRange: [300, 450], density: 0.7 },
        epic:     { scale: [392.0, 587.3, 784.0], tempoRange: [350, 450], density: 0.85 }
    },

    initMusicComposer() {
        if (!this.dbData.music) this.dbData.music = { town: null, floors: {} };
        if (!this.dbData.music.floors) this.dbData.music.floors = {};

        document.getElementById('music-generate-btn').addEventListener('click', () => this.musicGenerate());
        document.getElementById('music-play-btn').addEventListener('click', () => this.musicPlay());
        document.getElementById('music-stop-btn').addEventListener('click', () => this.musicStop());
        document.getElementById('music-lockin-btn').addEventListener('click', () => this.musicLockIn());
        document.getElementById('music-clear-btn').addEventListener('click', () => this.musicClear());

        this.musicRefreshSlots();
        this.musicRenderTrackList();
    },

    musicRefreshSlots() {
        const sel = document.getElementById('music-slot-select');
        const curVal = sel.value;
        sel.innerHTML = '<option value="town">Town</option>';
        // Build floor slots from map editor if available
        const floorCount = (typeof MapEditor !== 'undefined' && MapEditor.mapData) ? MapEditor.mapData.length : 1;
        for (let i = 0; i < floorCount; i++) {
            sel.innerHTML += `<option value="floor-${i}-explore">Floor ${i+1} — Exploration</option>`;
            sel.innerHTML += `<option value="floor-${i}-combat">Floor ${i+1} — Combat</option>`;
        }
        // Restore selection if still valid
        if (sel.querySelector(`option[value="${curVal}"]`)) sel.value = curVal;
    },

    musicRenderTrackList() {
        const list = document.getElementById('music-track-list');
        if (!list) return;
        list.innerHTML = '';
        const music = this.dbData.music || {};
        
        if (music.town) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Town</strong> — ${music.town.genre}/${music.town.vibe}`;
            list.appendChild(li);
        }
        const floors = music.floors || {};
        Object.keys(floors).sort().forEach(key => {
            const track = floors[key];
            if (!track) return;
            const li = document.createElement('li');
            const parts = key.split('-');
            const floorNum = parseInt(parts[0]) + 1;
            const type = parts[1] === 'combat' ? 'Combat' : 'Exploration';
            li.innerHTML = `<strong>Floor ${floorNum} ${type}</strong> — ${track.genre}/${track.vibe}`;
            list.appendChild(li);
        });
        if (list.children.length === 0) {
            list.innerHTML = '<li style="color:var(--text-dim);">No tracks composed yet.</li>';
        }
    },

    async musicGenerate() {
        this.musicStop();
        const status = document.getElementById('music-status');
        status.innerText = "Rendering...";
        document.getElementById('music-generate-btn').disabled = true;

        const genreKey = document.getElementById('music-genre').value;
        const vibeKey = document.getElementById('music-vibe').value;
        const genre = this.musicGenres[genreKey];
        const vibe = this.musicVibes[vibeKey];

        const tempo = Math.floor(Math.random() * (vibe.tempoRange[1] - vibe.tempoRange[0] + 1)) + vibe.tempoRange[0];
        const seqLen = Math.random() > 0.5 ? 16 : 32;
        const loopDur = seqLen * (tempo / 1000);
        const sampleRate = 22050;
        const isWeird = genre.id === 'weird';

        const offCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, sampleRate * loopDur, sampleRate);

        for (let i = 0; i < seqLen; i++) {
            let time = i * (tempo / 1000);
            let dur = (tempo / 1000) * (Math.random() * 0.4 + 0.6);

            if (Math.random() < vibe.density) {
                let freq = vibe.scale[Math.floor(Math.random() * vibe.scale.length)] * genre.pitchMod;
                if (isWeird && Math.random() > 0.8) freq *= 1.15;
                this._mTone(offCtx, freq, genre.waveMelody, dur, isWeird, time);
            }
            if (i % 2 === 0 || Math.random() < (vibe.density - 0.2)) {
                let freq = (vibe.scale[Math.floor(Math.random() * vibe.scale.length)] * 0.5) * genre.pitchMod;
                this._mTone(offCtx, freq, genre.waveBass, dur * 1.5, isWeird, time);
            }
            if (i % 4 === 0 && Math.random() > 0.2) {
                this._mKick(offCtx, 0.2, isWeird, time);
            } else if ((i % 2 === 0 && Math.random() < vibe.density) || Math.random() < (vibe.density - 0.4)) {
                this._mSnare(offCtx, 0.15, isWeird, time, sampleRate);
            }
        }

        this.musicPreviewBuffer = await offCtx.startRendering();
        document.getElementById('music-generate-btn').disabled = false;
        document.getElementById('music-play-btn').disabled = false;
        document.getElementById('music-lockin-btn').disabled = false;
        status.innerText = `Generated: ${genreKey}/${vibeKey} (${seqLen} steps). Preview or generate again.`;
    },

    musicPlay() {
        if (!this.musicPreviewBuffer) return;
        this.musicStop();
        if (!this.musicAudioCtx) this.musicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.musicAudioCtx.state === 'suspended') this.musicAudioCtx.resume();
        this.musicPreviewSource = this.musicAudioCtx.createBufferSource();
        this.musicPreviewSource.buffer = this.musicPreviewBuffer;
        this.musicPreviewSource.loop = true;
        this.musicPreviewSource.connect(this.musicAudioCtx.destination);
        this.musicPreviewSource.start();
        document.getElementById('music-play-btn').disabled = true;
        document.getElementById('music-stop-btn').disabled = false;
        document.getElementById('music-status').innerText = "Playing preview...";
    },

    musicStop() {
        if (this.musicPreviewSource) {
            try { this.musicPreviewSource.stop(); } catch(e) {}
            this.musicPreviewSource = null;
        }
        document.getElementById('music-play-btn').disabled = !this.musicPreviewBuffer;
        document.getElementById('music-stop-btn').disabled = true;
    },

    musicLockIn() {
        if (!this.musicPreviewBuffer) return;
        const slot = document.getElementById('music-slot-select').value;
        const genreKey = document.getElementById('music-genre').value;
        const vibeKey = document.getElementById('music-vibe').value;

        // Convert buffer to base64 WAV
        const wav = this._musicBufferToWavBase64(this.musicPreviewBuffer);
        const trackData = { genre: genreKey, vibe: vibeKey, wav: wav };

        if (!this.dbData.music) this.dbData.music = { town: null, floors: {} };
        if (!this.dbData.music.floors) this.dbData.music.floors = {};

        if (slot === 'town') {
            this.dbData.music.town = trackData;
        } else {
            this.dbData.music.floors[slot.replace('floor-', '')] = trackData;
        }

        this.musicStop();
        this.musicPreviewBuffer = null;
        document.getElementById('music-play-btn').disabled = true;
        document.getElementById('music-lockin-btn').disabled = true;
        document.getElementById('music-status').innerText = `Locked in: ${slot} (${genreKey}/${vibeKey}). Save DB to persist.`;
        this.musicRenderTrackList();
    },

    musicClear() {
        this.musicStop();
        const slot = document.getElementById('music-slot-select').value;
        if (!this.dbData.music) return;
        if (slot === 'town') {
            this.dbData.music.town = null;
        } else if (this.dbData.music.floors) {
            delete this.dbData.music.floors[slot.replace('floor-', '')];
        }
        document.getElementById('music-status').innerText = `Cleared: ${slot}. Save DB to persist.`;
        this.musicRenderTrackList();
    },

    _musicBufferToWavBase64(buffer) {
        const numCh = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const numSamples = buffer.length;
        const dataSize = numSamples * numCh * 2;
        const headerSize = 44;
        const arr = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(arr);
        let p = 0;
        function u32(v) { view.setUint32(p, v, true); p += 4; }
        function u16(v) { view.setUint16(p, v, true); p += 2; }
        u32(0x46464952); u32(headerSize + dataSize - 8); u32(0x45564157);
        u32(0x20746d66); u32(16); u16(1); u16(numCh);
        u32(sampleRate); u32(sampleRate * 2 * numCh); u16(numCh * 2); u16(16);
        u32(0x61746164); u32(dataSize);
        const channels = [];
        for (let i = 0; i < numCh; i++) channels.push(buffer.getChannelData(i));
        let offset = 0;
        while (p < arr.byteLength) {
            for (let i = 0; i < numCh; i++) {
                let s = Math.max(-1, Math.min(1, channels[i][offset]));
                s = (s < 0 ? s * 32768 : s * 32767) | 0;
                view.setInt16(p, s, true); p += 2;
            }
            offset++;
        }
        // Convert to base64
        const bytes = new Uint8Array(arr);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    },

    // --- Audio synthesis helpers ---
    _mTone(ctx, freq, type, duration, isWeird, time) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        if (isWeird) {
            osc.frequency.setValueAtTime(freq * 0.9, time);
            osc.frequency.linearRampToValueAtTime(freq, time + 0.08);
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.type = 'sine'; lfo.frequency.value = 6; lfoGain.gain.value = 12;
            lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
            lfo.start(time); lfo.stop(time + duration);
        } else {
            osc.frequency.setValueAtTime(freq, time);
        }
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(time); osc.stop(time + duration);
    },
    _mKick(ctx, duration, isWeird, time) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        if (isWeird) {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, time);
            osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        }
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(time); osc.stop(time + duration);
    },
    _mSnare(ctx, duration, isWeird, time, sampleRate) {
        const sr = sampleRate || ctx.sampleRate;
        const bufSize = sr * duration;
        const buf = ctx.createBuffer(1, bufSize, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        if (isWeird) { filter.type = 'bandpass'; filter.frequency.value = 600; }
        else { filter.type = 'highpass'; filter.frequency.value = 1000; }
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isWeird ? 0.3 : 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + (duration * 0.5));
        noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        noise.start(time);
    },

    setupControls() {
        document.getElementById('save-db-btn').addEventListener('click', async () => {
            const result = await API.saveDb(this.dbData);
            UI.showStatus('db-status-msg', result.message, result.status !== 'success');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => { DbEditor.init(); });