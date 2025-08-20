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
        
        this.createMenu();
    }
    
    createMenu() {
        const menuX = 1200 - 200; // mapWidth - 200
        const menuY = 20;
        
        // Menu background
        const menuBg = this.scene.add.rectangle(menuX + 100, menuY + 160, 180, 400, 0x333333, 0.9);
        menuBg.setStrokeStyle(2, 0x666666);
        
        // Menu title
        this.scene.add.text(menuX + 100, menuY + 30, 'Gebäude', { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Grid toggle button
        this.createGridButton(menuX, menuY);
        
        // Speed control section
        this.createSpeedControls(menuX, menuY);
        
        // Building buttons
        this.createBuildingButtons(menuX, menuY);
    }
    
    createGridButton(menuX, menuY) {
        const gridButton = this.scene.add.rectangle(menuX + 100, menuY + 60, 160, 30, 0x4a4a4a, 0.9);
        gridButton.setStrokeStyle(2, 0x666666);
        gridButton.setInteractive();
        
        this.elements.gridButtonText = this.scene.add.text(menuX + 100, menuY + 60, 'Raster: AUS', { 
            fontSize: '14px', 
            fill: '#fff' 
        }).setOrigin(0.5);
        
        gridButton.on('pointerdown', () => {
            this.toggleGrid();
        });
        
        gridButton.on('pointerover', () => {
            gridButton.setFillStyle(0x5a5a5a);
        });
        
        gridButton.on('pointerout', () => {
            gridButton.setFillStyle(0x4a4a4a);
        });
    }
    
    createSpeedControls(menuX, menuY) {
        // Pause button
        const pauseButton = this.scene.add.rectangle(menuX + 50, menuY + 315, 70, 25, 0x4a4a4a, 0.9);
        pauseButton.setStrokeStyle(1, 0x666666);
        pauseButton.setInteractive();
        
        this.elements.pauseButtonText = this.scene.add.text(menuX + 50, menuY + 315, '⏸️ Pause', { 
            fontSize: '10px', 
            fill: '#fff' 
        }).setOrigin(0.5);
        
        pauseButton.on('pointerdown', () => {
            this.togglePause();
        });
        
        pauseButton.on('pointerover', () => {
            pauseButton.setFillStyle(0x5a5a5a);
        });
        
        pauseButton.on('pointerout', () => {
            pauseButton.setFillStyle(0x4a4a4a);
        });
        
        // Speed button
        const speedButton = this.scene.add.rectangle(menuX + 150, menuY + 315, 70, 25, 0x4a4a4a, 0.9);
        speedButton.setStrokeStyle(1, 0x666666);
        speedButton.setInteractive();
        
        this.elements.speedButtonText = this.scene.add.text(menuX + 150, menuY + 315, `${this.gameSpeed}x`, { 
            fontSize: '10px', 
            fill: '#fff' 
        }).setOrigin(0.5);
        
        speedButton.on('pointerdown', () => {
            this.changeSpeed();
        });
        
        speedButton.on('pointerover', () => {
            speedButton.setFillStyle(0x5a5a5a);
        });
        
        speedButton.on('pointerout', () => {
            speedButton.setFillStyle(0x4a4a4a);
        });
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

    createBuildingButtons(menuX, menuY) {
        const buttonWidth = 160;
        const buttonHeight = 40;
        const buttonSpacing = 50;
        const startY = menuY + 110;
        
        let yOffset = 0;
        Object.keys(this.buildingTypes).forEach((type) => {
            const building = this.buildingTypes[type];
            const buttonY = startY + (yOffset * buttonSpacing);
            
            // Create button using the new helper function
            const buttonObj = this.createButton(
                menuX + 100, // X position (centered in menu)
                buttonY,     // Y position
                buttonWidth, // Width
                buttonHeight, // Height
                `${building.symbol} ${building.name}`, // Label
                `${building.cost}B`, // Cost
                () => this.selectBuilding(type) // Click handler
            );
            
            // Store button components for later access
            this.buildingTypes[type].button = buttonObj.background;
            this.buildingTypes[type].buttonText = buttonObj.labelText;
            this.buildingTypes[type].costText = buttonObj.costText;
            this.buildingTypes[type].buttonObj = buttonObj; // Store complete button object
            
            yOffset++;
        });
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
        this.elements.gridButtonText.setText(`Raster: ${this.showGrid ? 'AN' : 'AUS'}`);
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
        this.elements.speedButtonText.setText(`${this.gameSpeed}x`);
    }
    
    updatePauseDisplay(isPaused) {
        this.isPaused = isPaused;
        this.elements.pauseButtonText.setText(this.isPaused ? '▶️ Weiter' : '⏸️ Pause');
    }
    
    getBuildingType(type) {
        return this.buildingTypes[type];
    }
    
    getSelectedBuildingType() {
        return this.selectedBuildingType;
    }
}