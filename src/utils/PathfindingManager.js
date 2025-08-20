export default class PathfindingManager {
    constructor(terrainManager, mapWidth, mapHeight, gridSize) {
        this.terrainManager = terrainManager;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.gridSize = gridSize;
        
        this.cols = Math.floor(mapWidth / gridSize);
        this.rows = Math.floor(mapHeight / gridSize);
        
        // Cache für berechnete Pfade (Performance-Optimierung)
        this.pathCache = new Map();
        this.maxCacheSize = 100;
    }
    
    /**
     * Findet den besten Pfad von start zu goal mit A* Algorithmus
     * @param {Object} start - {x, y} Grid-Koordinaten
     * @param {Object} goal - {x, y} Grid-Koordinaten
     * @returns {Array} Array von {x, y} Grid-Koordinaten als Pfad
     */
    findPath(start, goal) {
        // Cache-Key für diesen Pfad
        const cacheKey = `${start.x},${start.y}->${goal.x},${goal.y}`;
        if (this.pathCache.has(cacheKey)) {
            return this.pathCache.get(cacheKey);
        }
        
        // Validierung der Start- und Zielpositionen
        if (!this.isValidPosition(start.x, start.y) || !this.isValidPosition(goal.x, goal.y)) {
            return [];
        }
        
        // A* Datenstrukturen
        const openSet = []; // Knoten zum Untersuchen
        const closedSet = new Set(); // Bereits untersuchte Knoten
        const cameFrom = new Map(); // Parent-Tracking für Pfad-Rekonstruktion
        const gScore = new Map(); // Kosten von start bis zu diesem Knoten
        const fScore = new Map(); // gScore + heuristische Kosten zum Ziel
        
        const startKey = `${start.x},${start.y}`;
        const goalKey = `${goal.x},${goal.y}`;
        
        // Initialisierung
        openSet.push(start);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        
        while (openSet.length > 0) {
            // Finde Knoten mit niedrigstem fScore
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                const key = `${openSet[i].x},${openSet[i].y}`;
                const currentKey = `${current.x},${current.y}`;
                if ((fScore.get(key) || Infinity) < (fScore.get(currentKey) || Infinity)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            const currentKey = `${current.x},${current.y}`;
            
            // Ziel erreicht!
            if (currentKey === goalKey) {
                const path = this.reconstructPath(cameFrom, current);
                this.cacheStoreWithLimit(cacheKey, path);
                return path;
            }
            
            // Current aus openSet entfernen und zu closedSet hinzufügen
            openSet.splice(currentIndex, 1);
            closedSet.add(currentKey);
            
            // Alle Nachbarn untersuchen
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) {
                    continue; // Bereits untersucht
                }
                
                // Bewegungskosten für diesen Schritt
                const movementCost = this.getMovementCost(neighbor);
                const tentativeGScore = (gScore.get(currentKey) || Infinity) + movementCost;
                
                // Neighbor zu openSet hinzufügen wenn nicht vorhanden
                if (!openSet.find(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
                
                // Wenn dieser Pfad nicht besser ist als bereits bekannte, skip
                if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                // Dieser Pfad ist besser! Speichere ihn
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));
            }
        }
        
        // Kein Pfad gefunden
        return [];
    }
    
    /**
     * Gibt alle begehbaren Nachbarknoten zurück
     */
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // oben
            { x: 1, y: 0 },  // rechts
            { x: 0, y: 1 },  // unten
            { x: -1, y: 0 }, // links
            // Diagonale Bewegungen
            { x: -1, y: -1 }, // oben-links
            { x: 1, y: -1 },  // oben-rechts
            { x: 1, y: 1 },   // unten-rechts
            { x: -1, y: 1 }   // unten-links
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            
            if (this.isValidPosition(newX, newY) && this.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Überprüft ob eine Position gültig und begehbar ist
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }
    
    /**
     * Überprüft ob eine Position begehbar ist
     */
    isWalkable(x, y) {
        const terrain = this.terrainManager.getTerrainAt(x, y);
        // Berge sind nicht begehbar
        return terrain !== 'mountain';
    }
    
    /**
     * Berechnet Bewegungskosten für eine Position basierend auf Terrain
     */
    getMovementCost(node) {
        const terrain = this.terrainManager.getTerrainAt(node.x, node.y);
        
        switch (terrain) {
            case 'river':
                return 2.0; // Flüsse sind schwerer zu durchqueren
            case 'forest':
                return 1.5; // Wälder sind etwas schwerer
            case 'bridge':
                return 1.0; // Brücken sind normal
            case 'grass':
            default:
                return 1.0; // Normales Gelände
        }
    }
    
    /**
     * Heuristische Kostenschätzung (Manhattan + Diagonal Distanz)
     */
    heuristic(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        
        // Oktile Distanz (bessere Heuristik für 8-directional movement)
        return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
    }
    
    /**
     * Rekonstruiert den Pfad vom Ziel zum Start
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            currentKey = `${current.x},${current.y}`;
            path.unshift(current);
        }
        
        return path;
    }
    
    /**
     * Cache-Management mit Größenlimit
     */
    cacheStoreWithLimit(key, value) {
        if (this.pathCache.size >= this.maxCacheSize) {
            // Entferne den ältesten Eintrag (FIFO)
            const firstKey = this.pathCache.keys().next().value;
            this.pathCache.delete(firstKey);
        }
        this.pathCache.set(key, value);
    }
    
    /**
     * Konvertiert Grid-Koordinaten in Welt-Koordinaten
     */
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }
    
    /**
     * Konvertiert Welt-Koordinaten in Grid-Koordinaten
     */
    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.gridSize),
            y: Math.floor(worldY / this.gridSize)
        };
    }
    
    /**
     * Cache leeren (z.B. wenn sich Terrain ändert)
     */
    clearCache() {
        this.pathCache.clear();
    }
    
    /**
     * Optimierter Pfad für häufige Start->Ziel Kombinationen
     */
    findPathOptimized(startWorld, goalWorld) {
        const start = this.worldToGrid(startWorld.x, startWorld.y);
        const goal = this.worldToGrid(goalWorld.x, goalWorld.y);
        
        const gridPath = this.findPath(start, goal);
        
        // Konvertiere Grid-Pfad zu Welt-Koordinaten
        return gridPath.map(point => this.gridToWorld(point.x, point.y));
    }
}