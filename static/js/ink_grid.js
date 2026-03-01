const InkGrid = {
    isDrawing: false,
    inkMode: 1, // 1 for drawing ink, 0 for erasing
    activeGridId: null, // Track which grid is being drawn on

    init() {
        this.renderGridFor('ink-grid');
        this.renderGridFor('npc-ink-grid');
        
        // Global mouseup to stop drawing
        document.addEventListener('mouseup', () => { 
            this.isDrawing = false; 
            this.activeGridId = null;
        });
    },

    renderGridFor(elementId) {
        const gridElement = document.getElementById(elementId);
        if (!gridElement) return;
        
        gridElement.innerHTML = '';

        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                let cell = document.createElement('div');
                cell.className = 'ink-cell';
                
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.isDrawing = true;
                    this.activeGridId = elementId;
                    this.inkMode = cell.classList.contains('inked') ? 0 : 1;
                    this.toggleCell(cell);
                });

                cell.addEventListener('mouseenter', () => {
                    if (this.isDrawing && this.activeGridId === elementId) {
                        this.toggleCell(cell);
                    }
                });

                gridElement.appendChild(cell);
            }
        }
    },

    toggleCell(cell) {
        if (this.inkMode === 1) {
            cell.classList.add('inked');
        } else {
            cell.classList.remove('inked');
        }
    },

    clearGrid(elementId) {
        const gridElement = document.getElementById(elementId);
        if (!gridElement) return;
        const cells = gridElement.querySelectorAll('.ink-cell');
        cells.forEach(cell => cell.classList.remove('inked'));
    },

    // Legacy clear for monster grid
    clear() {
        this.clearGrid('ink-grid');
    },

    // Load a sprite array into a grid for editing
    loadSpriteInto(elementId, spriteArray) {
        const gridElement = document.getElementById(elementId);
        if (!gridElement || !spriteArray) return;
        const cells = gridElement.querySelectorAll('.ink-cell');
        let idx = 0;
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                if (spriteArray[r] && spriteArray[r][c] === 1) {
                    cells[idx].classList.add('inked');
                } else {
                    cells[idx].classList.remove('inked');
                }
                idx++;
            }
        }
    },

    getSpriteArrayFrom(elementId) {
        const gridElement = document.getElementById(elementId);
        if (!gridElement) return Array(16).fill(null).map(() => Array(16).fill(0));
        
        let spriteArray = [];
        let cells = gridElement.querySelectorAll('.ink-cell');
        let idx = 0;
        
        for (let r = 0; r < 16; r++) {
            let row = [];
            for (let c = 0; c < 16; c++) {
                row.push(cells[idx].classList.contains('inked') ? 1 : 0);
                idx++;
            }
            spriteArray.push(row);
        }
        return spriteArray;
    },

    // Legacy getter for monster grid
    getSpriteArray() {
        return this.getSpriteArrayFrom('ink-grid');
    }
};

// Initialize grids when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    InkGrid.init();
});
