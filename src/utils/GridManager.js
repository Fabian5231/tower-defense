export default class GridManager {
    constructor(mapWidth, mapHeight, gridSize) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridSize = gridSize;
        this.gridWidth = Math.floor(mapWidth / gridSize);
        this.gridHeight = Math.floor(mapHeight / gridSize);
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        
        this.showGrid = false;
        this.gridGraphics = null;
    }
    
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }
    
    gridToWorld(gridX, gridY) {
        return {
            x: (gridX + 0.5) * this.gridSize,
            y: (gridY + 0.5) * this.gridSize
        };
    }
    
    gridToWorldForBuilding(gridX, gridY, width, height) {
        return {
            x: (gridX + width / 2) * this.gridSize,
            y: (gridY + height / 2) * this.gridSize
        };
    }
    
    isGridAreaFree(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
                    return false;
                }
                if (this.grid[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    occupyGridArea(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    this.grid[y][x] = true;
                }
            }
        }
    }
    
    freeGridArea(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    this.grid[y][x] = false;
                }
            }
        }
    }
    
    toggleGrid(scene) {
        this.showGrid = !this.showGrid;
        
        if (this.showGrid) {
            this.createGridGraphics(scene);
        } else {
            this.destroyGridGraphics();
        }
    }
    
    createGridGraphics(scene) {
        if (this.gridGraphics) {
            this.destroyGridGraphics();
        }
        
        this.gridGraphics = scene.add.group();
        
        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const line = scene.add.line(0, 0, x * this.gridSize, 0, x * this.gridSize, this.mapHeight, 0x666666, 0.3);
            line.setOrigin(0, 0);
            this.gridGraphics.add(line);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const line = scene.add.line(0, 0, 0, y * this.gridSize, this.mapWidth, y * this.gridSize, 0x666666, 0.3);
            line.setOrigin(0, 0);
            this.gridGraphics.add(line);
        }
    }
    
    destroyGridGraphics() {
        if (this.gridGraphics) {
            this.gridGraphics.clear(true, true);
            this.gridGraphics = null;
        }
    }
}