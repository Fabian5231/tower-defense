export default class Factory {
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
        
        // Factory stats
        this.level = 1;
        this.health = 150;
        this.maxHealth = 150;
        this.type = 'factory';
        this.suppliedBy = [];
        this.lastProduction = this.scene.time.now;
        this.productionRate = 30000; // Same base rate as farms
        this.productionAmount = 0; // Will be calculated based on suppliers
        
        // Flags
        this.toRemove = false;
        
        this.createGraphics();
    }
    
    getRotatedDimensions(rotation) {
        // Factory is 2x1 by default
        if (rotation === 90 || rotation === 270) {
            return { width: 1, height: 2 };
        }
        return { width: 2, height: 1 };
    }
    
    createGraphics() {
        const gridSize = 30;
        const displayWidth = this.gridWidth * gridSize;
        const displayHeight = this.gridHeight * gridSize;
        
        // Main factory graphic
        this.graphic = this.scene.add.rectangle(this.x, this.y, displayWidth, displayHeight, 0x666666);
        this.graphic.setStrokeStyle(2, 0x444444);
        
        // Factory symbol
        this.symbol = this.scene.add.text(this.x, this.y, '🏭', { fontSize: '18px' }).setOrigin(0.5);
        
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
        if (this.productionAmount <= 0) return null; // No suppliers, no production
        
        const adjustedProductionRate = this.productionRate / gameSpeed;
        
        if (time - this.lastProduction > adjustedProductionRate) {
            this.lastProduction = time;
            
            // Create gold animation (green for factory)
            const coinText = this.scene.add.text(this.x, this.y - 40, `+${this.productionAmount}`, {
                fontSize: '14px',
                fill: '#00ff00', // Green for factory production
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
    
    updateSupplyChain(suppliers) {
        this.suppliedBy = suppliers;
        
        // Calculate production based on suppliers with level-based multiplier
        let totalProduction = 0;
        const levelMultiplier = 1.2 + (this.level * 0.3); // Level 1: 1.5x, Level 2: 1.8x, Level 3: 2.1x, Level 4: 2.4x, Level 5: 2.7x
        
        suppliers.forEach(supplier => {
            if (supplier.type === 'farm') {
                supplier.suppliesFactory = true;
                totalProduction += supplier.productionAmount * levelMultiplier;
            } else if (supplier.type === 'mine') {
                supplier.suppliesFactory = true;
                totalProduction += supplier.productionAmount * levelMultiplier;
            }
        });
        
        this.productionAmount = Math.floor(totalProduction);
    }
    
    clearSupplyChain() {
        this.suppliedBy = [];
        this.productionAmount = 0;
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
        if (this.level >= 5) return false;
        
        this.level++;
        
        // Apply level-based improvements - höhere Level geben noch höheren Multiplikator
        this.maxHealth = 150 + ((this.level - 1) * 40); // Level 1: 150, Level 2: 190, Level 3: 230, Level 4: 270, Level 5: 310
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
    
    getSupplierInfo() {
        if (this.suppliedBy.length > 0) {
            return {
                hasSuppliers: true,
                supplierCount: this.suppliedBy.length,
                productionAmount: this.productionAmount
            };
        }
        
        return {
            hasSuppliers: false,
            supplierCount: 0,
            productionAmount: 0
        };
    }
    
    destroy() {
        this.graphic.destroy();
        this.symbol.destroy();
        this.healthBarBg.destroy();
        this.healthBar.destroy();
    }
}