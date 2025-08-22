export default class Enemy {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Enemy properties
        this.health = config.health || 50;
        this.maxHealth = this.health;
        this.speed = config.speed || 50;
        this.type = config.type || 'normal';
        this.isBoss = config.isBoss || this.type === 'boss';
        this.goldReward = config.goldReward || 1;
        
        // Visueller Typ-basierte Eigenschaften
        this.symbol = config.symbol || '👹';
        this.size = this.isBoss ? 35 : (this.type === 'fast' ? 15 : 20);
        this.color = config.color || (this.isBoss ? 0x800080 : 0xff0000);
        
        // Pathfinding properties
        this.path = []; // Current path to follow
        this.currentPathIndex = 0;
        this.pathRecalculateTimer = 0;
        this.pathRecalculateInterval = 1000; // Recalculate path every 1 second
        this.lastKnownTarget = null;
        
        // Flags
        this.toRemove = false;
        
        this.createGraphics();
    }
    
    createGraphics() {
        // Nur das Symbol als Hauptgrafik (kein Rechteck mehr)
        this.symbolText = this.scene.add.text(this.x, this.y, this.symbol, {
            fontSize: this.isBoss ? '24px' : '18px',
            align: 'center'
        }).setOrigin(0.5);
        
        // Referenz für Kompatibilität (symbolText fungiert als graphic)
        this.graphic = this.symbolText;
        
        // Health bars (angepasst für Symbol-basierte Darstellung)
        const healthBarY = this.y - 15; // Fixe Position über Symbol
        const healthBarWidth = this.isBoss ? 30 : 20;
        
        this.healthBarBg = this.scene.add.rectangle(
            this.x, 
            healthBarY, 
            healthBarWidth + 2, 
            6, 
            0x666666
        );
        this.healthBar = this.scene.add.rectangle(
            this.x, 
            healthBarY, 
            healthBarWidth, 
            4, 
            0x00ff00
        );
        
        // Boss-spezifische Hervorhebung durch größere Schrift (schon oben gesetzt)
        // Kein extra Crown-Symbol mehr nötig, da Boss-Symbole bereits eindeutig sind
        
        // Hide health bars initially
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }
    
    update(delta, townHall, gameSpeed, terrainManager = null, pathfindingManager = null) {
        if (this.toRemove) return;
        
        const distance = Math.sqrt(
            (townHall.x - this.x) * (townHall.x - this.x) + 
            (townHall.y - this.y) * (townHall.y - this.y)
        );
        
        // Check collision with town hall
        if (distance < townHall.radius + 10) {
            this.toRemove = true;
            return { hitTownHall: true, damage: 10 };
        }
        
        // Temporarily disable pathfinding and use simple terrain-aware movement
        this.updateTerrainAwareMovement(delta, townHall, gameSpeed, terrainManager);
        
        this.updateGraphics();
        
        return { hitTownHall: false };
    }
    
    updateWithPathfinding(delta, townHall, gameSpeed, terrainManager, pathfindingManager) {
        this.pathRecalculateTimer += delta;
        
        // Recalculate path periodically or if we don't have one
        const targetChanged = !this.lastKnownTarget || 
            this.lastKnownTarget.x !== townHall.x || 
            this.lastKnownTarget.y !== townHall.y;
            
        if (this.path.length === 0 || this.pathRecalculateTimer > this.pathRecalculateInterval || targetChanged) {
            this.calculateNewPath(townHall, pathfindingManager);
            this.pathRecalculateTimer = 0;
            this.lastKnownTarget = { x: townHall.x, y: townHall.y };
            
        }
        
        if (this.path.length > 0) {
            this.followPath(delta, gameSpeed, terrainManager);
        } else {
            // No path found, try direct movement as fallback
            this.updateDirectMovement(delta, townHall, gameSpeed, terrainManager);
        }
    }
    
    calculateNewPath(townHall, pathfindingManager) {
        const startPos = { x: this.x, y: this.y };
        const goalPos = { x: townHall.x, y: townHall.y };
        
        this.path = pathfindingManager.findPathOptimized(startPos, goalPos);
        this.currentPathIndex = 0;
        
        // Remove the first point if it's too close to current position
        if (this.path.length > 0) {
            const firstPoint = this.path[0];
            const distToFirst = Math.sqrt(
                (firstPoint.x - this.x) * (firstPoint.x - this.x) +
                (firstPoint.y - this.y) * (firstPoint.y - this.y)
            );
            if (distToFirst < 10) {
                this.currentPathIndex = 1;
            }
        }
    }
    
    followPath(delta, gameSpeed, terrainManager) {
        if (this.currentPathIndex >= this.path.length) {
            this.path = []; // Path completed
            return;
        }
        
        const target = this.path[this.currentPathIndex];
        const direction = {
            x: target.x - this.x,
            y: target.y - this.y
        };
        const distanceToTarget = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        
        // If we're close enough to the current waypoint, move to next one
        if (distanceToTarget < 8) {
            this.currentPathIndex++;
            return;
        }
        
        // Move towards current waypoint
        direction.x /= distanceToTarget;
        direction.y /= distanceToTarget;
        
        // Apply terrain movement modifier
        let effectiveSpeed = this.speed * gameSpeed;
        if (terrainManager) {
            const gridX = Math.floor(this.x / 30); // gridSize is 30
            const gridY = Math.floor(this.y / 30);
            const modifier = terrainManager.getMovementModifier(gridX, gridY);
            effectiveSpeed *= modifier;
        }
        
        this.x += direction.x * effectiveSpeed * (delta / 1000);
        this.y += direction.y * effectiveSpeed * (delta / 1000);
    }
    
    updateDirectMovement(delta, townHall, gameSpeed, terrainManager) {
        const direction = {
            x: townHall.x - this.x,
            y: townHall.y - this.y
        };
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        
        // Move towards town hall
        direction.x /= distance;
        direction.y /= distance;
        
        // Apply terrain movement modifier
        let effectiveSpeed = this.speed * gameSpeed;
        if (terrainManager) {
            const gridX = Math.floor(this.x / 30); // gridSize is 30
            const gridY = Math.floor(this.y / 30);
            const modifier = terrainManager.getMovementModifier(gridX, gridY);
            effectiveSpeed *= modifier;
            
            // If blocked by mountain, try to avoid it
            if (modifier === 0) {
                this.avoidObstacleImproved(direction, effectiveSpeed, delta, terrainManager);
                return;
            }
        }
        
        this.x += direction.x * effectiveSpeed * (delta / 1000);
        this.y += direction.y * effectiveSpeed * (delta / 1000);
    }
    
    avoidObstacleImproved(direction, effectiveSpeed, delta, terrainManager) {
        // Improved obstacle avoidance: try multiple directions
        const directions = [
            { x: -direction.y, y: direction.x },    // perpendicular left
            { x: direction.y, y: -direction.x },    // perpendicular right
            { x: -direction.x * 0.7 - direction.y * 0.7, y: -direction.y * 0.7 + direction.x * 0.7 }, // back-left
            { x: -direction.x * 0.7 + direction.y * 0.7, y: -direction.y * 0.7 - direction.x * 0.7 }, // back-right
        ];
        
        for (const testDir of directions) {
            const testX = this.x + testDir.x * 15; // Test 15 pixels ahead
            const testY = this.y + testDir.y * 15;
            const testGridX = Math.floor(testX / 30);
            const testGridY = Math.floor(testY / 30);
            
            if (terrainManager.getMovementModifier(testGridX, testGridY) > 0) {
                // This direction is not blocked, use it
                this.x += testDir.x * effectiveSpeed * (delta / 1000) * 0.7;
                this.y += testDir.y * effectiveSpeed * (delta / 1000) * 0.7;
                return;
            }
        }
        
        // If all directions are blocked, try moving backwards
        this.x -= direction.x * effectiveSpeed * (delta / 1000) * 0.3;
        this.y -= direction.y * effectiveSpeed * (delta / 1000) * 0.3;
    }
    
    updateTerrainAwareMovement(delta, townHall, gameSpeed, terrainManager) {
        const direction = {
            x: townHall.x - this.x,
            y: townHall.y - this.y
        };
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        
        // Normalize direction
        direction.x /= distance;
        direction.y /= distance;
        
        // Check if current position is blocked
        const currentGridX = Math.floor(this.x / 30);
        const currentGridY = Math.floor(this.y / 30);
        let currentModifier = 1.0;
        
        if (terrainManager) {
            currentModifier = terrainManager.getMovementModifier(currentGridX, currentGridY);
        }
        
        // If we're stuck on a mountain, use smart escape logic
        if (currentModifier === 0) {
            this.escapeFromMountain(delta, townHall, gameSpeed, terrainManager);
            return;
        }
        
        // Check if the next position would be blocked
        const nextX = this.x + direction.x * 20; // Look ahead 20 pixels
        const nextY = this.y + direction.y * 20;
        const nextGridX = Math.floor(nextX / 30);
        const nextGridY = Math.floor(nextY / 30);
        
        let nextModifier = 1.0;
        if (terrainManager) {
            nextModifier = terrainManager.getMovementModifier(nextGridX, nextGridY);
        }
        
        // If next position would be blocked, use avoidance
        if (nextModifier === 0) {
            this.avoidMountainAhead(direction, delta, townHall, gameSpeed, terrainManager);
            return;
        }
        
        // Normal movement with terrain modifier
        let effectiveSpeed = this.speed * gameSpeed * currentModifier;
        this.x += direction.x * effectiveSpeed * (delta / 1000);
        this.y += direction.y * effectiveSpeed * (delta / 1000);
    }
    
    escapeFromMountain(delta, townHall, gameSpeed, terrainManager) {
        // If we're stuck in a mountain, try to escape in all directions
        const escapeDirections = [
            { x: 1, y: 0 },   // right
            { x: -1, y: 0 },  // left
            { x: 0, y: 1 },   // down
            { x: 0, y: -1 },  // up
            { x: 1, y: 1 },   // down-right
            { x: -1, y: 1 },  // down-left
            { x: 1, y: -1 },  // up-right
            { x: -1, y: -1 }  // up-left
        ];
        
        let effectiveSpeed = this.speed * gameSpeed;
        
        for (const dir of escapeDirections) {
            const testX = this.x + dir.x * 15;
            const testY = this.y + dir.y * 15;
            const testGridX = Math.floor(testX / 30);
            const testGridY = Math.floor(testY / 30);
            
            if (terrainManager.getMovementModifier(testGridX, testGridY) > 0) {
                // Found an escape direction
                this.x += dir.x * effectiveSpeed * (delta / 1000) * 0.8;
                this.y += dir.y * effectiveSpeed * (delta / 1000) * 0.8;
                return;
            }
        }
        
        // If completely surrounded, try to move toward the nearest edge
        const mapCenterX = 600; // mapWidth / 2
        const mapCenterY = 400; // mapHeight / 2
        const awayFromCenter = {
            x: this.x - mapCenterX,
            y: this.y - mapCenterY
        };
        const awayDistance = Math.sqrt(awayFromCenter.x * awayFromCenter.x + awayFromCenter.y * awayFromCenter.y);
        
        if (awayDistance > 0) {
            awayFromCenter.x /= awayDistance;
            awayFromCenter.y /= awayDistance;
            
            this.x += awayFromCenter.x * effectiveSpeed * (delta / 1000) * 0.5;
            this.y += awayFromCenter.y * effectiveSpeed * (delta / 1000) * 0.5;
        }
    }
    
    avoidMountainAhead(direction, delta, townHall, gameSpeed, terrainManager) {
        // Try perpendicular directions to go around the obstacle
        const perpDirections = [
            { x: -direction.y, y: direction.x },  // perpendicular left
            { x: direction.y, y: -direction.x }   // perpendicular right
        ];
        
        let effectiveSpeed = this.speed * gameSpeed;
        
        // Test both perpendicular directions
        for (const perpDir of perpDirections) {
            const testX = this.x + perpDir.x * 20;
            const testY = this.y + perpDir.y * 20;
            const testGridX = Math.floor(testX / 30);
            const testGridY = Math.floor(testY / 30);
            
            if (terrainManager.getMovementModifier(testGridX, testGridY) > 0) {
                // This direction is clear, go around the obstacle
                // Mix the perpendicular direction with a bit of forward movement
                const mixedX = perpDir.x * 0.7 + direction.x * 0.3;
                const mixedY = perpDir.y * 0.7 + direction.y * 0.3;
                
                this.x += mixedX * effectiveSpeed * (delta / 1000);
                this.y += mixedY * effectiveSpeed * (delta / 1000);
                return;
            }
        }
        
        // If both perpendicular directions are blocked, try diagonal backwards
        const backwardDirections = [
            { x: -direction.x + perpDirections[0].x, y: -direction.y + perpDirections[0].y },
            { x: -direction.x + perpDirections[1].x, y: -direction.y + perpDirections[1].y }
        ];
        
        for (const backDir of backwardDirections) {
            const length = Math.sqrt(backDir.x * backDir.x + backDir.y * backDir.y);
            if (length > 0) {
                backDir.x /= length;
                backDir.y /= length;
                
                const testX = this.x + backDir.x * 20;
                const testY = this.y + backDir.y * 20;
                const testGridX = Math.floor(testX / 30);
                const testGridY = Math.floor(testY / 30);
                
                if (terrainManager.getMovementModifier(testGridX, testGridY) > 0) {
                    this.x += backDir.x * effectiveSpeed * (delta / 1000) * 0.6;
                    this.y += backDir.y * effectiveSpeed * (delta / 1000) * 0.6;
                    return;
                }
            }
        }
        
        // Last resort: move backwards
        this.x -= direction.x * effectiveSpeed * (delta / 1000) * 0.4;
        this.y -= direction.y * effectiveSpeed * (delta / 1000) * 0.4;
    }
    
    updateGraphics() {
        // Nur das Symbol positionieren (graphic ist jetzt symbolText)
        this.graphic.x = this.x;
        this.graphic.y = this.y;
        this.healthBarBg.x = this.x;
        this.healthBarBg.y = this.y - (this.isBoss ? 25 : 15);
        this.healthBar.x = this.x;
        this.healthBar.y = this.y - (this.isBoss ? 25 : 15);
        
        if (this.bossSymbol) {
            this.bossSymbol.x = this.x;
            this.bossSymbol.y = this.y;
        }
        
        if (this.healthBar.visible) {
            this.healthBar.scaleX = this.health / this.maxHealth;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.showHealthBar();
        
        if (this.health <= 0) {
            this.toRemove = true;
            return {
                killed: true,
                score: this.isBoss ? 50 : 10,
                gold: this.goldReward
            };
        }
        
        return { killed: false };
    }
    
    showHealthBar() {
        if (!this.healthBarBg.visible) {
            this.healthBarBg.setVisible(true);
            this.healthBar.setVisible(true);
        }
        this.healthBar.scaleX = this.health / this.maxHealth;
    }
    
    destroy() {
        this.graphic.destroy(); // symbolText wird zerstört
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        // Kein bossSymbol mehr vorhanden
    }
}