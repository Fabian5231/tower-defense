export default class TerrainManager {
    constructor(scene, mapWidth, mapHeight, gridSize) {
        this.scene = scene;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridSize = gridSize;
        
        // Terrain grid - stores terrain types for each grid cell
        this.terrainGrid = [];
        this.terrainGraphics = [];
        
        this.initializeGrid();
        this.generateTerrain();
    }
    
    initializeGrid() {
        const cols = Math.floor(this.mapWidth / this.gridSize);
        const rows = Math.floor(this.mapHeight / this.gridSize);
        
        for (let y = 0; y < rows; y++) {
            this.terrainGrid[y] = [];
            for (let x = 0; x < cols; x++) {
                this.terrainGrid[y][x] = 'grass'; // Default terrain
            }
        }
    }
    
    generateTerrain() {
        // Generate some interesting terrain features
        this.generateMountains();
        this.generateRivers();
        this.generateForests();
        this.generateBridges();
        this.renderTerrain();
    }
    
    // Hilfsfunktion: Prüft ob Position in Town Hall Schutzzone liegt
    isInTownHallProtectionZone(x, y) {
        const townHallGridX = Math.floor(this.mapWidth / 2 / this.gridSize);
        const townHallGridY = Math.floor(this.mapHeight / 2 / this.gridSize);
        const minDistanceToTownHall = 5; // 2-Kachel-Radius + Town Hall (3x3) = 5
        
        const distanceToTownHall = Math.hypot(x - townHallGridX, y - townHallGridY);
        return distanceToTownHall <= minDistanceToTownHall;
    }
    
    generateMountains() {
  const cols = Math.floor(this.mapWidth / this.gridSize);
  const rows = Math.floor(this.mapHeight / this.gridSize);

  // Wenn die Map kleiner als 9x9 ist, keine Berge setzen
  const size = 3; // feste 9x9-Berge
  if (cols < size || rows < size) return;

  // Anzahl Berg-Cluster (3–5)
  const mountainCount = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < mountainCount; i++) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      attempts++;

      // zufällige Top-Left-Position, damit 9x9 sicher auf die Map passt
      const topLeftX = Math.floor(Math.random() * (cols - size + 1));
      const topLeftY = Math.floor(Math.random() * (rows - size + 1));

      // Prüfen: Berührt der 9x9-Block die Town Hall Schutzzone?
      let tooClose = false;
      for (let dy = 0; dy < size && !tooClose; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = topLeftX + dx;
          const y = topLeftY + dy;
          if (this.isInTownHallProtectionZone(x, y)) {
            tooClose = true;
            break;
          }
        }
      }

      if (tooClose) continue;

      // 9x9 Block setzen (vollständig)
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = topLeftX + dx;
          const y = topLeftY + dy;
          this.terrainGrid[y][x] = "mountain";
        }
      }

      placed = true;
    }
  }
}
    
    generateRivers() {
        const cols = Math.floor(this.mapWidth / this.gridSize);
        const rows = Math.floor(this.mapHeight / this.gridSize);
        
        // Generate 1-2 rivers
        const riverCount = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < riverCount; i++) {
            // River flows from one edge to another
            let startX, startY, endX, endY;
            
            if (Math.random() > 0.5) {
                // Horizontal river
                startX = 0;
                startY = Math.floor(rows * 0.3 + Math.random() * rows * 0.4);
                endX = cols - 1;
                endY = Math.floor(rows * 0.3 + Math.random() * rows * 0.4);
            } else {
                // Vertical river
                startX = Math.floor(cols * 0.3 + Math.random() * cols * 0.4);
                startY = 0;
                endX = Math.floor(cols * 0.3 + Math.random() * cols * 0.4);
                endY = rows - 1;
            }
            
            // Draw river path with some curves
            this.drawRiverPath(startX, startY, endX, endY);
        }
    }
    
    drawRiverPath(startX, startY, endX, endY) {
        const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
        
        for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            const x = Math.floor(startX + (endX - startX) * t + (Math.random() - 0.5) * 2);
            const y = Math.floor(startY + (endY - startY) * t + (Math.random() - 0.5) * 2);
            
            // Make river wider (2-3 tiles wide)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const riverX = x + dx;
                    const riverY = y + dy;
                    
                    if (riverX >= 0 && riverX < this.terrainGrid[0].length && 
                        riverY >= 0 && riverY < this.terrainGrid.length && 
                        this.terrainGrid[riverY][riverX] !== 'mountain' &&
                        !this.isInTownHallProtectionZone(riverX, riverY)) {
                        this.terrainGrid[riverY][riverX] = 'river';
                    }
                }
            }
        }
    }
    
    generateForests() {
        const cols = Math.floor(this.mapWidth / this.gridSize);
        const rows = Math.floor(this.mapHeight / this.gridSize);
        
        // Generate 4-8 forest patches
        const forestCount = 4 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < forestCount; i++) {
            const centerX = Math.floor(Math.random() * cols);
            const centerY = Math.floor(Math.random() * rows);
            const size = 2 + Math.floor(Math.random() * 2); // 2-3 tiles radius
            
            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (x >= 0 && x < cols && y >= 0 && y < rows && 
                        distance <= size && Math.random() > 0.4 &&
                        !this.isInTownHallProtectionZone(x, y)) {
                        
                        if (this.terrainGrid[y][x] === 'grass') {
                            this.terrainGrid[y][x] = 'forest';
                        }
                    }
                }
            }
        }
    }
    
    generateBridges() {
        const cols = Math.floor(this.mapWidth / this.gridSize);
        const rows = Math.floor(this.mapHeight / this.gridSize);
        
        // Find river tiles and create bridges
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (this.terrainGrid[y][x] === 'river') {
                    // Chance to create a bridge
                    if (Math.random() < 0.1) { // 10% chance per river tile
                        this.terrainGrid[y][x] = 'bridge';
                    }
                }
            }
        }
    }
    
    renderTerrain() {
        // Clear existing terrain graphics
        this.terrainGraphics.forEach(graphic => graphic.destroy());
        this.terrainGraphics = [];
        
        const cols = Math.floor(this.mapWidth / this.gridSize);
        const rows = Math.floor(this.mapHeight / this.gridSize);
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const terrainType = this.terrainGrid[y][x];
                const worldX = x * this.gridSize + this.gridSize / 2;
                const worldY = y * this.gridSize + this.gridSize / 2;
                
                this.renderTerrainTile(terrainType, worldX, worldY);
            }
        }
    }
    
    renderTerrainTile(terrainType, x, y) {
        let graphic = null;
        
        switch (terrainType) {
            case 'mountain':
                graphic = this.scene.add.rectangle(
                    x, y, 
                    this.gridSize - 2, this.gridSize - 2, 
                    0x8B7355 // Brown for mountains
                );
                graphic.setStrokeStyle(1, 0x654321);
                // Add mountain symbol
                const mountainSymbol = this.scene.add.text(x, y, '⛰️', {
                    fontSize: '16px'
                }).setOrigin(0.5);
                this.terrainGraphics.push(mountainSymbol);
                break;
                
            case 'river':
                graphic = this.scene.add.rectangle(
                    x, y, 
                    this.gridSize - 2, this.gridSize - 2, 
                    0x4682B4 // Steel blue for river
                );
                graphic.setAlpha(0.7);
                break;
                
            case 'forest':
                graphic = this.scene.add.rectangle(
                    x, y, 
                    this.gridSize - 2, this.gridSize - 2, 
                    0x228B22 // Forest green
                );
                graphic.setAlpha(0.6);
                // Add tree symbol
                const treeSymbol = this.scene.add.text(x, y, '🌲', {
                    fontSize: '14px'
                }).setOrigin(0.5);
                this.terrainGraphics.push(treeSymbol);
                break;
                
            case 'bridge':
                // Bridge over river
                graphic = this.scene.add.rectangle(
                    x, y, 
                    this.gridSize - 2, this.gridSize - 2, 
                    0x8B4513 // Brown for bridge
                );
                break;
                
            // 'grass' is default - no special rendering needed
        }
        
        if (graphic) {
            graphic.setDepth(-10); // Behind other objects
            this.terrainGraphics.push(graphic);
        }
    }
    
    getTerrainAt(gridX, gridY) {
        if (gridY >= 0 && gridY < this.terrainGrid.length &&
            gridX >= 0 && gridX < this.terrainGrid[0].length) {
            return this.terrainGrid[gridY][gridX];
        }
        return 'grass';
    }
    
    canPlaceBuildingAt(gridX, gridY) {
        const terrain = this.getTerrainAt(gridX, gridY);
        // Can't build on mountains or rivers (but can build on bridges)
        return terrain !== 'mountain' && terrain !== 'river';
    }
    
    getMovementModifier(gridX, gridY) {
        const terrain = this.getTerrainAt(gridX, gridY);
        
        switch (terrain) {
            case 'river':
                return 0.5; // 50% speed (slow movement through water)
            case 'forest':
                return 0.8; // 80% speed (slightly slower through forest)
            case 'bridge':
                return 1.0; // Normal speed on bridges
            case 'mountain':
                return 0; // Can't move through mountains
            default:
                return 1.0; // Normal speed on grass
        }
    }
    
    getAccuracyModifier(targetGridX, targetGridY) {
        const terrain = this.getTerrainAt(targetGridX, targetGridY);
        
        switch (terrain) {
            case 'forest':
                return 0.7; // 70% accuracy (trees provide cover)
            default:
                return 1.0; // Normal accuracy
        }
    }
    
    isPathBlocked(gridX, gridY) {
        const terrain = this.getTerrainAt(gridX, gridY);
        return terrain === 'mountain';
    }
    
    isTerrainType(gridX, gridY, terrainType) {
        const terrain = this.getTerrainAt(gridX, gridY);
        return terrain === terrainType;
    }
    
    destroy() {
        this.terrainGraphics.forEach(graphic => graphic.destroy());
        this.terrainGraphics = [];
    }
}