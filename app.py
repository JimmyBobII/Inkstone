from flask import Flask, render_template, request, jsonify
import json
import os
import re

app = Flask(__name__)

# Directory Setup
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
EXPORT_DIR = os.path.join(BASE_DIR, 'exports')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

MAP_FILE = os.path.join(DATA_DIR, 'map.json')
DB_FILE = os.path.join(DATA_DIR, 'db.json')

# Helper to generate a default 20-level progression curve for new classes
def get_default_class_progression():
    prog = []
    for i in range(1, 21):
        prog.append({
            "level": i,
            "xpReq": 0 if i == 1 else 50 * (i - 1),
            "hpGain": 0 if i == 1 else 5,
            "atkGain": 0 if i == 1 else 1,
            "spellGain": 0 if i == 1 else 1
        })
    return prog

DEFAULT_DB = {
    "items": [{"id": "potion1", "name": "Health Potion", "type": "use", "val": 10}],
    "monsters": [],
    "npcs": [],
    "spells": [
        {"id": "heal1", "name": "Lesser Heal", "type": "heal", "val": 15},
        {"id": "dmg1", "name": "Magic Missile", "type": "damage", "val": 8}
    ],
    "classes": [
        {
            "id": "warrior",
            "name": "Warrior",
            "baseHp": 25,
            "baseAtk": 6,
            "baseSpells": 0,
            "progression": get_default_class_progression(),
            "spellList": []
        }
    ],
    "town": {
        "name": "Oakhaven",
        "shopkeeper": "Grom the Merchant",
        "shopGreeting": "Welcome to my shop. Have a look around.",
        "tavernCost": 10,
        "churchCost": 50,
        "shopItems": []
    },
    "gameName": "The Grimoire Engine",
    "music": {"town": None, "floors": {}},
    "introText": ""
}

def get_empty_floor():
    return {
        "grid": [[0 for _ in range(20)] for _ in range(20)],
        "placements": {"items": {}, "monsters": {}, "chests": {}, "doors": {}, "npcs": {}, "wins": {}, "lore": {}, "traps": {}, "breakwalls": {}}
    }

def get_default_map():
    return [get_empty_floor()]

@app.route('/')
def editor():
    return render_template('editor.html')

@app.route('/api/save_map', methods=['POST'])
def save_map():
    with open(MAP_FILE, 'w') as f:
        json.dump(request.json, f, indent=4)
    return jsonify({"status": "success", "message": "Map saved!"})

@app.route('/api/load_map', methods=['GET'])
def load_map():
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, 'r') as f:
            data = json.load(f)
            if isinstance(data, dict) and "grid" in data:
                data = [data]
            for floor in data:
                if "chests" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["chests"] = {}
                if "doors" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["doors"] = {}
                if "npcs" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["npcs"] = {}
                if "wins" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["wins"] = {}
                if "lore" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["lore"] = {}
                if "traps" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["traps"] = {}
                if "breakwalls" not in floor.get("placements", {}):
                    floor.setdefault("placements", {})["breakwalls"] = {}
            return jsonify(data)
    return jsonify(get_default_map())

@app.route('/api/save_db', methods=['POST'])
def save_db():
    with open(DB_FILE, 'w') as f:
        json.dump(request.json, f, indent=4)
    return jsonify({"status": "success", "message": "Database saved!"})

@app.route('/api/load_db', methods=['GET'])
def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            db_data = json.load(f)
            # Ensure required DB structures exist
            if "town" not in db_data:
                db_data["town"] = DEFAULT_DB["town"]
            if "npcs" not in db_data:
                db_data["npcs"] = []
            if "spells" not in db_data:
                db_data["spells"] = DEFAULT_DB["spells"]
            if "classes" not in db_data:
                db_data["classes"] = DEFAULT_DB["classes"]
            
            # Remove deprecated top-level progression field if present
            if "progression" in db_data:
                del db_data["progression"]
            
            # Ensure gameName and shopGreeting exist
            if "gameName" not in db_data:
                db_data["gameName"] = "The Grimoire Engine"
            if "shopGreeting" not in db_data.get("town", {}):
                db_data.setdefault("town", {})["shopGreeting"] = "Welcome to my shop. Have a look around."
            if "music" not in db_data:
                db_data["music"] = {"town": None, "floors": {}}
            if "introText" not in db_data:
                db_data["introText"] = ""

            return jsonify(db_data)
    return jsonify(DEFAULT_DB)

@app.route('/playtest')
def playtest():
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, 'r') as f:
            map_data = json.load(f)
        if isinstance(map_data, dict) and "grid" in map_data:
            map_data = [map_data]
        for floor in map_data:
            p = floor.setdefault("placements", {})
            for key in ["chests", "doors", "npcs", "wins", "lore", "traps", "breakwalls"]:
                if key not in p:
                    p[key] = {}
    else:
        map_data = get_default_map()

    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            db_data = json.load(f)
    else:
        db_data = DEFAULT_DB

    if "town" not in db_data: db_data["town"] = DEFAULT_DB["town"]
    if "npcs" not in db_data: db_data["npcs"] = []
    if "spells" not in db_data: db_data["spells"] = DEFAULT_DB["spells"]
    if "classes" not in db_data: db_data["classes"] = DEFAULT_DB["classes"]
    if "gameName" not in db_data: db_data["gameName"] = "The Grimoire Engine"
    if "shopGreeting" not in db_data.get("town", {}):
        db_data.setdefault("town", {})["shopGreeting"] = "Welcome to my shop. Have a look around."
    if "music" not in db_data: db_data["music"] = {"town": None, "floors": {}}
    if "introText" not in db_data: db_data["introText"] = ""

    return render_template('game_template.html', map_data=map_data, db_data=db_data, playtest=True)

@app.route('/api/export_game', methods=['POST'])
def export_game():
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, 'r') as f:
            map_data = json.load(f)
        if isinstance(map_data, dict) and "grid" in map_data:
            map_data = [map_data]
        for floor in map_data:
            if "chests" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["chests"] = {}
            if "doors" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["doors"] = {}
            if "npcs" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["npcs"] = {}
            if "wins" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["wins"] = {}
            if "lore" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["lore"] = {}
            if "traps" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["traps"] = {}
            if "breakwalls" not in floor.get("placements", {}):
                floor.setdefault("placements", {})["breakwalls"] = {}
    else:
        map_data = get_default_map()

    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            db_data = json.load(f)
    else:
        db_data = DEFAULT_DB
    
    if "town" not in db_data:
        db_data["town"] = DEFAULT_DB["town"]
    if "npcs" not in db_data:
        db_data["npcs"] = []
    if "spells" not in db_data:
        db_data["spells"] = DEFAULT_DB["spells"]
    if "classes" not in db_data:
        db_data["classes"] = DEFAULT_DB["classes"]
    if "gameName" not in db_data:
        db_data["gameName"] = "The Grimoire Engine"
    if "shopGreeting" not in db_data.get("town", {}):
        db_data.setdefault("town", {})["shopGreeting"] = "Welcome to my shop. Have a look around."
    if "music" not in db_data:
        db_data["music"] = {"town": None, "floors": {}}
    if "introText" not in db_data:
        db_data["introText"] = ""
        
    try:
        html_content = render_template('game_template.html', map_data=map_data, db_data=db_data)
        # Sanitize game name for filename
        safe_name = re.sub(r'[^\w\s-]', '', db_data.get('gameName', 'my_game')).strip().replace(' ', '_').lower()
        if not safe_name:
            safe_name = 'my_game'
        export_path = os.path.join(EXPORT_DIR, f'{safe_name}.html')
        with open(export_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        return jsonify({"status": "success", "message": "Game Exported!", "html": html_content})
    except Exception as e:
        return jsonify({"status": "error", "message": "Template missing or error: " + str(e)}), 500

if __name__ == '__main__':
    print("Starting Inkstone Engine Backend...")
    app.run(debug=True, port=5000)