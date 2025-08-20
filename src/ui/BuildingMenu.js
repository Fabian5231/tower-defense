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
    
    createBuildingButtons(menuX, menuY) {
        let yOffset = 0;
        Object.keys(this.buildingTypes).forEach((type, index) => {
            const building = this.buildingTypes[type];
            const buttonY = menuY + 110 + (yOffset * 50);
            
            const button = this.scene.add.rectangle(menuX + 100, buttonY, 160, 40, 0x4a4a4a, 0.9);
            button.setStrokeStyle(2, 0x666666);
            button.setInteractive();
            
            const buttonText = this.scene.add.text(menuX + 50, buttonY, 
                `${building.symbol} ${building.name}`, 
                { fontSize: '14px', fill: '#fff' }
            ).setOrigin(0, 0.5);
            
            const costText = this.scene.add.text(menuX + 150, buttonY, 
                `${building.cost}B`, 
                { fontSize: '12px', fill: '#ffd700' }
            ).setOrigin(1, 0.5);
            
            button.on('pointerdown', () => {
                this.selectBuilding(type);
            });
            
            button.on('pointerover', () => {
                button.setFillStyle(0x5a5a5a);
            });
            
            button.on('pointerout', () => {
                if (this.selectedBuildingType !== type) {
                    button.setFillStyle(0x4a4a4a);
                }
            });
            
            this.buildingTypes[type].button = button;
            this.buildingTypes[type].buttonText = buttonText;
            this.buildingTypes[type].costText = costText;
            
            yOffset++;
        });
    }
    
    selectBuilding(type) {
        if (this.selectedBuildingType) {
            this.buildingTypes[this.selectedBuildingType].button.setFillStyle(0x4a4a4a);
        }
        
        this.selectedBuildingType = type;
        this.buildingTypes[type].button.setFillStyle(0x6a6a6a);
        
        this.onSelectBuilding(type);
    }
    
    deselectBuilding() {
        if (this.selectedBuildingType) {
            this.buildingTypes[this.selectedBuildingType].button.setFillStyle(0x4a4a4a);
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