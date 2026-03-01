const API = {
    // --- Map Endpoints ---
    async loadMap() {
        try {
            const res = await fetch('/api/load_map');
            return await res.json();
        } catch (error) {
            console.error("Failed to load map:", error);
            return null;
        }
    },

    async saveMap(mapData) {
        try {
            const res = await fetch('/api/save_map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapData)
            });
            return await res.json();
        } catch (error) {
            console.error("Failed to save map:", error);
            return { status: "error", message: "Network error saving map." };
        }
    },

    // --- Database Endpoints ---
    async loadDb() {
        try {
            const res = await fetch('/api/load_db');
            return await res.json();
        } catch (error) {
            console.error("Failed to load database:", error);
            return null;
        }
    },

    async saveDb(dbData) {
        try {
            const res = await fetch('/api/save_db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbData)
            });
            return await res.json();
        } catch (error) {
            console.error("Failed to save database:", error);
            return { status: "error", message: "Network error saving database." };
        }
    },

    // --- Exporter Endpoint ---
    async exportGame() {
        try {
            const res = await fetch('/api/export_game', { method: 'POST' });
            return await res.json();
        } catch (error) {
            console.error("Failed to export game:", error);
            return { status: "error", message: "Network error exporting game." };
        }
    }
};