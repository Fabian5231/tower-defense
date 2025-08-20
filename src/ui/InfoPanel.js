export default class InfoPanel {
    constructor(scene) {
        this.scene = scene;
        this.currentBuilding = null;
        this.elements = {};

        // UI-Layer erstellen (liegt immer ganz vorne)
        this.uiLayer = this.scene.add.layer();
        this.uiLayer.setDepth(1000);
    }
    
    show(building, onUpgrade, onRotate) {
        this.clear();
        
        this.currentBuilding = building;
        
        // Create info text
        const infoText = this.generateInfoText(building);
        
        this.elements.infoPanel = this.scene.add.text(building.x + 50, building.y - 50, infoText, {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 8 }
        }).setOrigin(0, 0.5);

        // ins UI-Layer packen
        this.uiLayer.add(this.elements.infoPanel);
        
        // Create upgrade button
        this.createUpgradeButton(building, onUpgrade);
        
        // Create rotation button for non-tower buildings
        if (building.type !== 'tower') {
            this.createRotationButton(building, onRotate);
        }
    }
    
    generateInfoText(building) {
        let infoText = '';
        
        if (building.type === 'tower') {
            infoText = `Turm - Level ${building.level}\nReichweite: ${building.range}px\nSchaden: ${building.damage}\nHP: ${building.health}/${building.maxHealth}`;
        } else if (building.type === 'werfer') {
            infoText = `Werfer - Level ${building.level}\nReichweite: ${building.range}px\nSchaden: ${building.damage}\nHP: ${building.health}/${building.maxHealth}`;
        } else if (building.type === 'farm') {
            if (building.suppliesFactory) {
                infoText = `Feld - Level ${building.level}\nBeliefert Fabrik\nKeine direkte Produktion\nHP: ${building.health}/${building.maxHealth}`;
            } else {
                infoText = `Feld - Level ${building.level}\n+${building.productionAmount} Batzen alle ${building.productionRate / 1000} Sek\nHP: ${building.health}/${building.maxHealth}\n\nTimer: Lade...`;
            }
        } else if (building.type === 'factory') {
            const supplierInfo = building.getSupplierInfo();
            if (supplierInfo.hasSuppliers) {
                infoText = `Fabrik - Level ${building.level}\n+${supplierInfo.productionAmount} Batzen alle ${building.productionRate / 1000} Sek\nBeliefert durch: ${supplierInfo.supplierCount} ${supplierInfo.supplierCount === 1 ? 'Feld' : 'Felder'}\nHP: ${building.health}/${building.maxHealth}`;
            } else {
                infoText = `Fabrik - Level ${building.level}\nKeine Belieferung\nKeine Produktion\nHP: ${building.health}/${building.maxHealth}`;
            }
        }
        
        return infoText;
    }
    
    createUpgradeButton(building, onUpgrade) {
        const buttonY = this.elements.infoPanel.y + this.elements.infoPanel.height / 2 + 25;
        const buildingTypes = {
            tower: { maxLevel: 3 },
            werfer: { maxLevel: 3 },
            farm: { maxLevel: 3 },
            factory: { maxLevel: 3 }
        };
        const maxLevel = buildingTypes[building.type].maxLevel;
        
        if (building.level < maxLevel) {
            const upgradeCost = this.getUpgradeCost(building.type, building.level);
            
            // Create upgrade button
            this.elements.upgradeButton = this.scene.add.rectangle(building.x + 50, buttonY, 120, 25, 0x4a4a4a, 0.9);
            this.elements.upgradeButton.setStrokeStyle(1, 0x666666);
            this.elements.upgradeButton.setInteractive();
            this.elements.upgradeButton.setOrigin(0, 0.5);
            
            this.elements.upgradeButtonText = this.scene.add.text(building.x + 110, buttonY, `⬆️ Upgrade (${upgradeCost}B)`, {
                fontSize: '10px',
                fill: '#fff'
            }).setOrigin(0.5, 0.5);
            
            // ins UI-Layer packen
            this.uiLayer.add([this.elements.upgradeButton, this.elements.upgradeButtonText]);
            
            // Button interactions
            this.elements.upgradeButton.on('pointerdown', () => {
                onUpgrade(building);
            });
            
            this.elements.upgradeButton.on('pointerover', () => {
                this.elements.upgradeButton.setFillStyle(0x5a5a5a);
            });
            
            this.elements.upgradeButton.on('pointerout', () => {
                this.elements.upgradeButton.setFillStyle(0x4a4a4a);
            });
        } else {
            // Max level indicator
            this.elements.upgradeButtonText = this.scene.add.text(building.x + 50, buttonY, '✨ Max Level', {
                fontSize: '10px',
                fill: '#ffd700'
            }).setOrigin(0, 0.5);

            this.uiLayer.add(this.elements.upgradeButtonText);
        }
    }
    
    createRotationButton(building, onRotate) {
        const buttonY = this.elements.upgradeButton ? 
            this.elements.upgradeButton.y + 35 : 
            this.elements.infoPanel.y + this.elements.infoPanel.height / 2 + 25;
        
        // Create rotation button
        this.elements.rotateButton = this.scene.add.rectangle(building.x + 50, buttonY, 120, 25, 0x4a4a4a, 0.9);
        this.elements.rotateButton.setStrokeStyle(1, 0x666666);
        this.elements.rotateButton.setInteractive();
        this.elements.rotateButton.setOrigin(0, 0.5);
        
        this.elements.rotateButtonText = this.scene.add.text(building.x + 110, buttonY, '🔄 Drehen', {
            fontSize: '10px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5);

        // ins UI-Layer packen
        this.uiLayer.add([this.elements.rotateButton, this.elements.rotateButtonText]);
        
        // Button interactions
        this.elements.rotateButton.on('pointerdown', () => {
            onRotate(building);
        });
        
        this.elements.rotateButton.on('pointerover', () => {
            this.elements.rotateButton.setFillStyle(0x5a5a5a);
        });
        
        this.elements.rotateButton.on('pointerout', () => {
            this.elements.rotateButton.setFillStyle(0x4a4a4a);
        });
    }
    
    updateFarmTimer(currentTime, gameSpeed) {
        if (!this.currentBuilding || this.currentBuilding.type !== 'farm' || this.currentBuilding.suppliesFactory) {
            return;
        }
        
        const timerInfo = this.currentBuilding.getTimerInfo(currentTime, gameSpeed);
        if (timerInfo && this.elements.infoPanel) {
            const baseText = `Feld - Level ${this.currentBuilding.level}\n+${this.currentBuilding.productionAmount} Batzen alle ${this.currentBuilding.productionRate / 1000} Sek\nHP: ${this.currentBuilding.health}/${this.currentBuilding.maxHealth}`;
            const fullText = `${baseText}\n\n${timerInfo}`;
            
            this.elements.infoPanel.setText(fullText);
        }
    }
    
    getUpgradeCost(buildingType, currentLevel) {
        const baseCosts = {
            tower: 10,
            werfer: 50,
            farm: 10,
            factory: 10
        };
        const baseCost = baseCosts[buildingType];
        return Math.floor(baseCost * (currentLevel + 1) * 1.5);
    }
    
    clear() {
        this.currentBuilding = null;
        
        Object.values(this.elements).forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        
        this.elements = {};
    }
}