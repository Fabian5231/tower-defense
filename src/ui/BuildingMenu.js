export default class BuildingMenu {
    constructor(scene, onSelectBuilding, onToggleGrid, onTogglePause, onChangeSpeed) {
        this.scene = scene;
        this.onSelectBuilding = onSelectBuilding;
        this.onToggleGrid = onToggleGrid;
        this.onTogglePause = onTogglePause;
        this.onChangeSpeed = onChangeSpeed;
        
        this.selectedBuildingType = null;
        this.showGrid = false;
        this.gameSpeed = 1.0;
        this.isPaused = false;
        
        this.buildingTypes = {
            tower: { cost: 10, name: 'Turm', symbol: '🏯', width: 1, height: 1, maxLevel: 3 },
            farm: { cost: 10, name: 'Feld', symbol: '🌾', width: 1, height: 2, maxLevel: 3 },
            factory: { cost: 10, name: 'Fabrik', symbol: '🏭', width: 2, height: 1, maxLevel: 3 }
        };
        
        this.elements = {};
        
        // Layout-Konfiguration
        this.layout = {
            menuX: 1200 - 200, // mapWidth - 200
            menuY: 50,
            menuWidth: 180,
            elementSpacing: 20,
            buttonWidth: 160,
            buttonHeight: 40,
            smallButtonHeight: 30,
            currentY: 0 // Wird beim Layout automatisch berechnet
        };
        
        this.createMenu();
    }
    
    /**
     * Erstellt das komplette Menü mit einfachem, gleichmäßigem Layout
     */
    createMenu() {
        const menuX = this.layout.menuX;
        const startY = this.layout.menuY + 30; // Start-Position
        const buttonSpacing = 60; // 40px Button-Höhe + 20px Abstand
        
        let currentY = startY;
        
        // 1. Grid-Button (fix positioniert)
        this.createSimpleButton(menuX + 100, currentY, 160, 30, 'Raster: AUS', () => this.toggleGrid(), 'grid');
        currentY += buttonSpacing;
        
        // 2. Building-Buttons (alle mit gleichem Abstand)
        Object.keys(this.buildingTypes).forEach(type => {
            const building = this.buildingTypes[type];
            const buttonObj = this.createButton(
                menuX + 100,
                currentY,
                160,
                40,
                `${building.symbol} ${building.name}`,
                `${building.cost}B`,
                () => this.selectBuilding(type)
            );
            
            // Speichere Button-Referenzen
            this.buildingTypes[type].button = buttonObj.background;
            this.buildingTypes[type].buttonText = buttonObj.labelText;
            this.buildingTypes[type].costText = buttonObj.costText;
            this.buildingTypes[type].buttonObj = buttonObj;
            
            currentY += buttonSpacing;
        });
        
        // 3. Speed-Control Buttons (nebeneinander)
        this.createSpeedControlButtons(menuX, currentY);
        currentY += 50; // 30px Button-Höhe + 20px Abstand
        
        // 4. Menü-Hintergrund (basierend auf tatsächlicher Höhe)
        const totalHeight = currentY - this.layout.menuY + 20; // +20px unterer Rand
        const menuBg = this.scene.add.rectangle(
            menuX + 100, 
            this.layout.menuY + totalHeight/2, 
            180, 
            totalHeight, 
            0x333333, 
            0.9
        );
        menuBg.setStrokeStyle(2, 0x666666);
        menuBg.setDepth(-1); // Hintergrund hinter alle anderen Elemente
    }
    
    /**
     * Erstellt einen einfachen Button ohne Label/Cost-Trennung
     */
    createSimpleButton(x, y, width, height, text, onClick, id = null) {
        const button = this.scene.add.rectangle(x, y, width, height, 0x4a4a4a, 0.9);
        button.setStrokeStyle(2, 0x666666);
        button.setInteractive();
        
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Events
        button.on('pointerdown', onClick);
        button.on('pointerover', () => button.setFillStyle(0x5a5a5a));
        button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
        
        // Speichere Referenz für Updates
        if (id) {
            this.elements[id + 'Text'] = buttonText;
        }
        
        return { button, text: buttonText };
    }
    
    /**
     * Erstellt die Speed-Control Buttons nebeneinander
     */
    createSpeedControlButtons(menuX, y) {
        const buttonWidth = 75;
        const spacing = 10;
        const leftX = menuX + 100 - (buttonWidth/2 + spacing/2);
        const rightX = menuX + 100 + (buttonWidth/2 + spacing/2);
        
        // Pause Button
        const pauseBtn = this.createSimpleButton(leftX, y, buttonWidth, 30, '⏸️ Pause', () => this.togglePause(), 'pause');
        
        // Speed Button  
        const speedBtn = this.createSimpleButton(rightX, y, buttonWidth, 30, `${this.gameSpeed}x`, () => this.changeSpeed(), 'speed');
    }
    
    
    
    /**
     * Creates a standardized button with background, label and cost text
     * @param {number} x - Center X position of the button
     * @param {number} y - Center Y position of the button  
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {string} label - Left-aligned label text (e.g., "🏯 Turm")
     * @param {string} cost - Right-aligned cost text (e.g., "10B")
     * @param {function} onClick - Click callback function
     * @returns {object} Button object with background, labelText, costText, and methods
     */
    createButton(x, y, width, height, label, cost, onClick) {
        // Create button background
        const button = this.scene.add.rectangle(x, y, width, height, 0x4a4a4a, 0.9);
        button.setStrokeStyle(2, 0x666666);
        button.setInteractive();
        
        // Create left-aligned label text (symbol + name)
        const labelText = this.scene.add.text(
            x - (width / 2) + 10, // Left margin of 10px
            y, 
            label, 
            { fontSize: '14px', fill: '#fff' }
        ).setOrigin(0, 0.5); // Left-aligned, vertically centered
        
        // Create right-aligned cost text
        const costText = this.scene.add.text(
            x + (width / 2) - 10, // Right margin of 10px
            y, 
            cost, 
            { fontSize: '12px', fill: '#ffd700' }
        ).setOrigin(1, 0.5); // Right-aligned, vertically centered
        
        // Add click event
        button.on('pointerdown', onClick);
        
        // Add hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x5a5a5a);
        });
        
        button.on('pointerout', () => {
            // Only reset if this button is not selected
            if (!button._isSelected) {
                button.setFillStyle(0x4a4a4a);
            }
        });
        
        // Return button object with all components and utility methods
        return {
            background: button,
            labelText: labelText,
            costText: costText,
            
            // Utility methods for button management
            setSelected: (selected) => {
                button._isSelected = selected;
                button.setFillStyle(selected ? 0x6a6a6a : 0x4a4a4a);
            },
            
            updateCost: (newCost) => {
                costText.setText(newCost);
            },
            
            updateLabel: (newLabel) => {
                labelText.setText(newLabel);
            },
            
            destroy: () => {
                button.destroy();
                labelText.destroy();
                costText.destroy();
            }
        };
    }

    
    selectBuilding(type) {
        // Deselect previously selected building
        if (this.selectedBuildingType) {
            const prevButtonObj = this.buildingTypes[this.selectedBuildingType].buttonObj;
            if (prevButtonObj) {
                prevButtonObj.setSelected(false);
            }
        }
        
        // Select new building
        this.selectedBuildingType = type;
        const buttonObj = this.buildingTypes[type].buttonObj;
        if (buttonObj) {
            buttonObj.setSelected(true);
        }
        
        this.onSelectBuilding(type);
    }
    
    deselectBuilding() {
        if (this.selectedBuildingType) {
            const buttonObj = this.buildingTypes[this.selectedBuildingType].buttonObj;
            if (buttonObj) {
                buttonObj.setSelected(false);
            }
            this.selectedBuildingType = null;
        }
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        if (this.elements.gridText) {
            this.elements.gridText.setText(`Raster: ${this.showGrid ? 'AN' : 'AUS'}`);
        }
        this.onToggleGrid(this.showGrid);
    }
    
    togglePause() {
        // Nur Callback auslösen – Scene kümmert sich um den Status
        this.onTogglePause();
    }
    
    changeSpeed() {
        if (this.isPaused) return;
        this.onChangeSpeed();
    }
    
    updateSpeedDisplay(gameSpeed) {
        this.gameSpeed = gameSpeed;
        if (this.elements.speedText) {
            this.elements.speedText.setText(`${this.gameSpeed}x`);
        }
    }
    
    updatePauseDisplay(isPaused) {
        this.isPaused = isPaused;
        if (this.elements.pauseText) {
            this.elements.pauseText.setText(this.isPaused ? '▶️ Weiter' : '⏸️ Pause');
        }
    }
    
    getBuildingType(type) {
        return this.buildingTypes[type];
    }
    
    getSelectedBuildingType() {
        return this.selectedBuildingType;
    }
}