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
    
    update(delta, townHall, gameSpeed, terrainManager = null) {
        if (this.toRemove) return;
        
        const direction = {
            x: townHall.x - this.x,
            y: townHall.y - this.y
        };
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        
        // Check collision with town hall
        if (distance < townHall.radius + 10) {
            this.toRemove = true;
            return { hitTownHall: true, damage: 10 };
        }
        
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
        }
        
        this.x += direction.x * effectiveSpeed * (delta / 1000);
        this.y += direction.y * effectiveSpeed * (delta / 1000);
        
        this.updateGraphics();
        
        return { hitTownHall: false };
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