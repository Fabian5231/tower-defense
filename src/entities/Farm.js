export default class Farm {
    constructor(scene, x, y, gridPos, rotation = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        this.rotation = rotation;
        
        // Calculate dimensions based on rotation
        const dimensions = this.getRotatedDimensions(rotation);
        this.gridWidth = dimensions.width;
        this.gridHeight = dimensions.height;
        
        // Farm stats
        this.level = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.type = 'farm';
        this.lastProduction = this.scene.time.now;
        this.productionRate = 30000; // 30 seconds
        this.productionAmount = 5;
        this.suppliesFactory = false;
        
        // Flags
        this.toRemove = false;
        
        this.createGraphics();
    }
    
    getRotatedDimensions(rotation) {
        // Farm is 1x2 by default
        if (rotation === 90 || rotation === 270) {
            return { width: 2, height: 1 };
        }
        return { width: 1, height: 2 };
    }
    
    createGraphics() {
        const gridSize = 30;
        const displayWidth = this.gridWidth * gridSize;
        const displayHeight = this.gridHeight * gridSize;
        
        // Main farm graphic
        this.graphic = this.scene.add.rectangle(this.x, this.y, displayWidth, displayHeight, 0x8b4513);
        this.graphic.setStrokeStyle(2, 0x654321);
        
        // Farm symbol
        this.symbol = this.scene.add.text(this.x, this.y, '🌾', { fontSize: '20px' }).setOrigin(0.5);
        
        // Health bars
        this.healthBarBg = this.scene.add.rectangle(
            this.x, 
            this.y - displayHeight/2 - 10, 
            displayWidth + 2, 
            6, 
            0x666666
        );
        this.healthBar = this.scene.add.rectangle(
            this.x, 
            this.y - displayHeight/2 - 10, 
            displayWidth, 
            4, 
            0x00ff00
        );
        
        // Hide health bars initially
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }
    
    update(time, gameSpeed) {
        if (this.suppliesFactory) return null; // Don't produce gold if supplying factory
        
        const adjustedProductionRate = this.productionRate / gameSpeed;
        
        if (time - this.lastProduction > adjustedProductionRate) {
            this.lastProduction = time;
            
            // Create gold animation
            const coinText = this.scene.add.text(this.x, this.y - 40, `+${this.productionAmount}`, {
                fontSize: '14px',
                fill: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: coinText,
                y: this.y - 60,
                alpha: 0,
                duration: 1500,
                onComplete: () => coinText.destroy()
            });
            
            return this.productionAmount; // Return gold amount
        }
        
        return null;
    }
    
    rotate() {
        const newRotation = (this.rotation + 90) % 360;
        const newDimensions = this.getRotatedDimensions(newRotation);
        
        return {
            newRotation,
            newDimensions,
            currentDimensions: { width: this.gridWidth, height: this.gridHeight }
        };
    }
    
    applyRotation(newRotation, newDimensions, newWorldPos) {
        this.rotation = newRotation;
        this.gridWidth = newDimensions.width;
        this.gridHeight = newDimensions.height;
        this.x = newWorldPos.x;
        this.y = newWorldPos.y;
        
        // Update graphics
        const gridSize = 30;
        const displayWidth = newDimensions.width * gridSize;
        const displayHeight = newDimensions.height * gridSize;
        
        this.graphic.setSize(displayWidth, displayHeight);
        this.graphic.setPosition(newWorldPos.x, newWorldPos.y);
        this.symbol.setPosition(newWorldPos.x, newWorldPos.y);
        
        this.healthBarBg.setSize(displayWidth + 2, 6);
        this.healthBarBg.setPosition(newWorldPos.x, newWorldPos.y - displayHeight / 2 - 10);
        
        this.healthBar.setSize(displayWidth, 4);
        this.healthBar.setPosition(newWorldPos.x, newWorldPos.y - displayHeight / 2 - 10);
    }
    
    upgrade() {
        if (this.level >= 3) return false;
        
        this.level++;
        
        // Apply level-based improvements
        this.productionAmount = 5 + ((this.level - 1) * 3); // Level 1: 5, Level 2: 8, Level 3: 11
        this.productionRate = Math.max(15000, 30000 - ((this.level - 1) * 7500)); // Level 1: 30s, Level 2: 22.5s, Level 3: 15s
        this.maxHealth = 100 + ((this.level - 1) * 30); // Level 1: 100, Level 2: 130, Level 3: 160
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
    
    getTimerInfo(currentTime, gameSpeed) {
        if (this.suppliesFactory) return null;
        
        const timeSinceLastProduction = currentTime - this.lastProduction;
        const adjustedProductionRate = this.productionRate / gameSpeed;
        const timeRemaining = Math.max(0, adjustedProductionRate - timeSinceLastProduction);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        if (secondsRemaining > 0) {
            return `Nächste Auszahlung: ${secondsRemaining}s`;
        } else {
            return 'Bereit für Auszahlung!';
        }
    }
    
    destroy() {
        this.graphic.destroy();
        this.symbol.destroy();
        this.healthBarBg.destroy();
        this.healthBar.destroy();
    }
}