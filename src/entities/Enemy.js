export default class Enemy {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Enemy properties
        this.health = config.health || 50;
        this.maxHealth = this.health;
        this.speed = config.speed || 50;
        this.isBoss = config.isBoss || false;
        this.goldReward = config.goldReward || 5;
        this.size = this.isBoss ? 35 : 20;
        this.color = this.isBoss ? 0x800080 : 0xff0000;
        
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
        // Main enemy graphic
        this.graphic = this.scene.add.rectangle(this.x, this.y, this.size, this.size, this.color);
        
        // Health bars
        this.healthBarBg = this.scene.add.rectangle(
            this.x, 
            this.y - (this.size/2 + 10), 
            this.size + 2, 
            6, 
            0x666666
        );
        this.healthBar = this.scene.add.rectangle(
            this.x, 
            this.y - (this.size/2 + 10), 
            this.size, 
            4, 
            0x00ff00
        );
        
        // Boss specific graphics
        if (this.isBoss) {
            this.graphic.setStrokeStyle(3, 0xffff00); // Yellow outline for boss
            this.bossSymbol = this.scene.add.text(this.x, this.y, '👑', { 
                fontSize: '16px' 
            }).setOrigin(0.5);
        }
        
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
        
        // Use pathfinding if available
        if (pathfindingManager && terrainManager) {
            this.updateWithPathfinding(delta, townHall, gameSpeed, terrainManager, pathfindingManager);
        } else {
            // Fallback to direct movement
            this.updateDirectMovement(delta, townHall, gameSpeed, terrainManager);
        }
        
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
                this.avoidObstacle(direction, effectiveSpeed, delta);
                return;
            }
        }
        
        this.x += direction.x * effectiveSpeed * (delta / 1000);
        this.y += direction.y * effectiveSpeed * (delta / 1000);
    }
    
    avoidObstacle(direction, effectiveSpeed, delta) {
        // Simple obstacle avoidance: try perpendicular directions
        const perp1 = { x: -direction.y, y: direction.x };
        const perp2 = { x: direction.y, y: -direction.x };
        
        // Try both perpendicular directions, use the first one that works
        this.x += perp1.x * effectiveSpeed * (delta / 1000) * 0.5;
        this.y += perp1.y * effectiveSpeed * (delta / 1000) * 0.5;
    }
    
    updateGraphics() {
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
        this.graphic.destroy();
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        if (this.bossSymbol) {
            this.bossSymbol.destroy();
        }
    }
}