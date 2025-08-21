export default class Mine {
    constructor(scene, x, y, gridPos, rotation = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        this.rotation = rotation;
        
        // Mine is always 1x1
        this.gridWidth = 1;
        this.gridHeight = 1;
        
        // Mine stats
        this.level = 1;
        this.health = 120;
        this.maxHealth = 120;
        this.type = 'mine';
        this.lastProduction = this.scene.time.now;
        this.productionRate = 60000; // 60 seconds (1 minute)
        this.productionAmount = 50; // 50 Batzen per minute
        this.suppliesFactory = false;
        this.isProducing = false; // Wird durch Berg-Check gesetzt
        
        // Flags
        this.toRemove = false;
        
        // Check if mine is adjacent to mountain
        this.checkMountainProximity();
        
        this.createGraphics();
    }
    
    checkMountainProximity() {
        const terrainManager = this.scene.terrainManager;
        if (!terrainManager) {
            this.isProducing = false;
            return;
        }
        
        // Check all 8 adjacent cells for mountains
        const directions = [
            {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
            {x: -1, y: 0},                 {x: 1, y: 0},
            {x: -1, y: 1},  {x: 0, y: 1},  {x: 1, y: 1}
        ];
        
        for (let dir of directions) {
            const checkX = this.gridX + dir.x;
            const checkY = this.gridY + dir.y;
            
            if (terrainManager.isTerrainType(checkX, checkY, 'mountain')) {
                this.isProducing = true;
                return;
            }
        }
        
        this.isProducing = false;
    }
    
    createGraphics() {
        const gridSize = 30;
        const displaySize = gridSize;
        
        // Main mine graphic (dark gray/brown)
        this.graphic = this.scene.add.rectangle(this.x, this.y, displaySize, displaySize, 0x4a4a4a);
        this.graphic.setStrokeStyle(2, 0x2a2a2a);
        
        // Mine symbol
        this.symbol = this.scene.add.text(this.x, this.y, '⛏️', { fontSize: '16px' }).setOrigin(0.5);
        
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
    
    update(time, gameSpeed) {
        // Don't produce if not adjacent to mountain or supplying factory
        if (!this.isProducing || this.suppliesFactory) return null;
        
        const adjustedProductionRate = this.productionRate / gameSpeed;
        
        if (time - this.lastProduction > adjustedProductionRate) {
            this.lastProduction = time;
            
            // Create gold animation with mine-specific color (bronze/yellow)
            const coinText = this.scene.add.text(this.x, this.y - 40, `+${this.productionAmount}`, {
                fontSize: '14px',
                fill: '#DAA520', // Goldenrod for mine production
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
    
    upgrade() {
        if (this.level >= 5) return false;
        
        this.level++;
        
        // Apply level-based improvements
        this.productionAmount = 50 + ((this.level - 1) * 20); // Level 1: 50, Level 2: 70, Level 3: 90, Level 4: 110, Level 5: 130
        this.productionRate = Math.max(30000, 60000 - ((this.level - 1) * 7500)); // Level 1: 60s, Level 2: 52.5s, Level 3: 45s, Level 4: 37.5s, Level 5: 30s
        this.maxHealth = 120 + ((this.level - 1) * 30); // Level 1: 120, Level 2: 150, Level 3: 180, Level 4: 210, Level 5: 240
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
        if (!this.isProducing) return 'Kein Berg in der Nähe!';
        if (this.suppliesFactory) return 'Versorgt Fabrik';
        
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