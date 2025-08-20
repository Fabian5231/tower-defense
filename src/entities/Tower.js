export default class Tower {
    constructor(scene, x, y, gridPos, rotation = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        this.gridWidth = 1;
        this.gridHeight = 1;
        this.rotation = rotation;
        
        // Tower stats
        this.level = 1;
        this.health = 75;
        this.maxHealth = 75;
        this.range = 60;
        this.damage = 25;
        this.fireRate = 500; // milliseconds
        this.lastFired = 0;
        this.type = 'tower';
        
        // Flags
        this.toRemove = false;
        
        this.createGraphics();
    }
    
    createGraphics() {
        const displaySize = 30; // gridSize
        
        // Main tower graphic
        this.graphic = this.scene.add.rectangle(this.x, this.y, displaySize, displaySize, 0x00ff00);
        this.graphic.setStrokeStyle(2, 0x00aa00);
        
        // Health bars
        this.healthBarBg = this.scene.add.rectangle(
            this.x, 
            this.y - displaySize/2 - 10, 
            displaySize + 2, 
            6, 
            0x666666
        );
        this.healthBar = this.scene.add.rectangle(
            this.x, 
            this.y - displaySize/2 - 10, 
            displaySize, 
            4, 
            0x00ff00
        );
        
        // Hide health bars initially
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }
    
    update(time, enemies, gameSpeed) {
        const adjustedFireRate = this.fireRate / gameSpeed;
        
        if (time - this.lastFired > adjustedFireRate) {
            const target = this.findBestTarget(enemies);
            if (target) {
                const projectile = this.fire(target);
                this.lastFired = time;
                return projectile;
            }
        }
        
        return null;
    }
    
    findBestTarget(enemies) {
        let bestTarget = null;
        let shortestDistanceToTownHall = Infinity;
        
        enemies.forEach(enemy => {
            // Check if enemy is in range
            const distanceToTower = Math.sqrt(
                (enemy.x - this.x) * (enemy.x - this.x) + 
                (enemy.y - this.y) * (enemy.y - this.y)
            );
            
            if (distanceToTower <= this.range) {
                // Calculate distance from enemy to town hall (assuming center at 600, 400)
                const townHallX = 600, townHallY = 400;
                const distanceToTownHall = Math.sqrt(
                    (enemy.x - townHallX) * (enemy.x - townHallX) + 
                    (enemy.y - townHallY) * (enemy.y - townHallY)
                );
                
                // Prioritize enemy closest to town hall
                if (distanceToTownHall < shortestDistanceToTownHall) {
                    bestTarget = enemy;
                    shortestDistanceToTownHall = distanceToTownHall;
                }
            }
        });
        
        return bestTarget;
    }
    
    fire(target) {
        return {
            x: this.x,
            y: this.y,
            targetX: target.x,
            targetY: target.y,
            target: target, // Reference for guaranteed hit
            speed: 300,
            damage: this.damage,
            graphic: this.scene.add.circle(this.x, this.y, 3, 0xffff00)
        };
    }
    
    upgrade() {
        if (this.level >= 3) return false; // Max level reached
        
        this.level++;
        
        // Apply level-based improvements
        this.damage = 25 + ((this.level - 1) * 15); // Level 1: 25, Level 2: 40, Level 3: 55
        this.range = 60 + ((this.level - 1) * 20);   // Level 1: 60, Level 2: 80, Level 3: 100
        this.maxHealth = 75 + ((this.level - 1) * 25); // Level 1: 75, Level 2: 100, Level 3: 125
        this.health = this.maxHealth; // Heal to full on upgrade
        
        return true;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.showHealthBar();
        
        if (this.health <= 0) {
            this.toRemove = true;
        }
    }
    
    showHealthBar() {
        if (!this.healthBarBg.visible) {
            this.healthBarBg.setVisible(true);
            this.healthBar.setVisible(true);
        }
        this.healthBar.scaleX = this.health / this.maxHealth;
    }
    
    showRange() {
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
        }
        
        this.rangeCircle = this.scene.add.circle(this.x, this.y, this.range, 0x00ff00, 0.1);
        this.rangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        
        return this.rangeCircle;
    }
    
    hideRange() {
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
            this.rangeCircle = null;
        }
    }
    
    destroy() {
        this.graphic.destroy();
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
        }
    }
}