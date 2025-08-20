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
     * Erstellt das komplette Menü mit automatischem Layout-System
     */
    createMenu() {
        // Reset Layout-Position
        this.layout.currentY = this.layout.menuY + 30; // Start mit Padding
        
        // Definiere Menü-Elemente in der gewünschten Reihenfolge
        const menuElements = [
            { type: 'title', text: 'Gebäude', fontSize: '20px', fontStyle: 'bold' },
            { type: 'spacer', height: 10 }, // Zusätzlicher Abstand nach Titel
            { type: 'button', id: 'grid', text: 'Raster: AUS', width: this.layout.buttonWidth, height: this.layout.smallButtonHeight, onClick: () => this.toggleGrid() },
            { type: 'spacer', height: 5 }, // Kleinerer Abstand vor Building-Buttons
            ...this.createBuildingMenuElements(), // Dynamisch generierte Building-Buttons
            { type: 'spacer', height: 5 }, // Abstand vor Speed-Controls
            { type: 'button-pair', 
              left: { id: 'pause', text: '⏸️ Pause', onClick: () => this.togglePause() },
              right: { id: 'speed', text: `${this.gameSpeed}x`, onClick: () => this.changeSpeed() }
            }
        ];
        
        // Berechne die benötigte Menü-Höhe
        const menuHeight = this.calculateMenuHeight(menuElements) + 60; // +60 für Padding
        
        // Erstelle Menü-Hintergrund
        this.createMenuBackground(menuHeight);
        
        // Erstelle alle Menü-Elemente automatisch
        this.renderMenuElements(menuElements);
    }
    
    /**
     * Berechnet die benötigte Höhe für das Menü basierend auf den Elementen
     */
    calculateMenuHeight(elements) {
        let totalHeight = 0;
        elements.forEach(element => {
            switch (element.type) {
                case 'title':
                    totalHeight += 25; // Geschätzte Texthöhe
                    break;
                case 'button':
                    totalHeight += element.height;
                    break;
                case 'button-pair':
                    totalHeight += this.layout.smallButtonHeight;
                    break;
                case 'spacer':
                    totalHeight += element.height;
                    break;
            }
            if (element.type !== 'spacer') {
                totalHeight += this.layout.elementSpacing; // Standard-Abstand
            }
        });
        return totalHeight;
    }
    
    /**
     * Erstellt den Menü-Hintergrund
     */
    createMenuBackground(menuHeight) {
        const menuBg = this.scene.add.rectangle(
            this.layout.menuX + 100, 
            this.layout.menuY + menuHeight/2, 
            this.layout.menuWidth, 
            menuHeight, 
            0x333333, 
            0.9
        );
        menuBg.setStrokeStyle(2, 0x666666);
    }
    
    /**
     * Generiert Menü-Elemente für alle Building-Buttons
     */
    createBuildingMenuElements() {
        return Object.keys(this.buildingTypes).map(type => {
            const building = this.buildingTypes[type];
            return {
                type: 'building-button',
                buildingType: type,
                label: `${building.symbol} ${building.name}`,
                cost: `${building.cost}B`,
                width: this.layout.buttonWidth,
                height: this.layout.buttonHeight,
                onClick: () => this.selectBuilding(type)
            };
        });
    }
    
    /**
     * Rendert alle Menü-Elemente automatisch
     */
    renderMenuElements(elements) {
        elements.forEach(element => {
            switch (element.type) {
                case 'title':
                    this.renderTitle(element);
                    break;
                case 'button':
                    this.renderButton(element);
                    break;
                case 'building-button':
                    this.renderBuildingButton(element);
                    break;
                case 'button-pair':
                    this.renderButtonPair(element);
                    break;
                case 'spacer':
                    this.renderSpacer(element);
                    break;
            }
        });
    }
    
    /**
     * Rendert einen Titel
     */
    renderTitle(element) {
        this.scene.add.text(this.layout.menuX + 100, this.layout.currentY, element.text, {
            fontSize: element.fontSize,
            fill: '#fff',
            fontStyle: element.fontStyle || 'normal'
        }).setOrigin(0.5);
        
        this.layout.currentY += 25 + this.layout.elementSpacing; // Texthöhe + Abstand
    }
    
    /**
     * Rendert einen Standard-Button
     */
    renderButton(element) {
        const button = this.scene.add.rectangle(
            this.layout.menuX + 100, 
            this.layout.currentY, 
            element.width, 
            element.height, 
            0x4a4a4a, 
            0.9
        );
        button.setStrokeStyle(2, 0x666666);
        button.setInteractive();
        
        const text = this.scene.add.text(
            this.layout.menuX + 100, 
            this.layout.currentY, 
            element.text, 
            { fontSize: '14px', fill: '#fff' }
        ).setOrigin(0.5);
        
        // Events
        button.on('pointerdown', element.onClick);
        button.on('pointerover', () => button.setFillStyle(0x5a5a5a));
        button.on('pointerout', () => button.setFillStyle(0x4a4a4a));
        
        // Speichere Element für spätere Updates
        if (element.id) {
            this.elements[element.id + 'Text'] = text;
        }
        
        this.layout.currentY += element.height + this.layout.elementSpacing;
    }
    
    /**
     * Rendert einen Building-Button mit Label und Kosten
     */
    renderBuildingButton(element) {
        const buttonObj = this.createButton(
            this.layout.menuX + 100,
            this.layout.currentY,
            element.width,
            element.height,
            element.label,
            element.cost,
            element.onClick
        );
        
        // Speichere Button-Komponenten
        const building = this.buildingTypes[element.buildingType];
        building.button = buttonObj.background;
        building.buttonText = buttonObj.labelText;
        building.costText = buttonObj.costText;
        building.buttonObj = buttonObj;
        
        this.layout.currentY += element.height + this.layout.elementSpacing;
    }
    
    /**
     * Rendert ein Button-Paar (nebeneinander)
     */
    renderButtonPair(element) {
        const buttonWidth = 75; // 50% der verfügbaren Breite
        const buttonSpacing = 10;
        const leftX = this.layout.menuX + 100 - (buttonWidth/2 + buttonSpacing/2);
        const rightX = this.layout.menuX + 100 + (buttonWidth/2 + buttonSpacing/2);
        
        // Linker Button
        const leftButton = this.scene.add.rectangle(
            leftX, this.layout.currentY, buttonWidth, this.layout.smallButtonHeight, 0x4a4a4a, 0.9
        );
        leftButton.setStrokeStyle(1, 0x666666);
        leftButton.setInteractive();
        
        const leftText = this.scene.add.text(leftX, this.layout.currentY, element.left.text, {
            fontSize: '10px', fill: '#fff'
        }).setOrigin(0.5);
        
        // Rechter Button
        const rightButton = this.scene.add.rectangle(
            rightX, this.layout.currentY, buttonWidth, this.layout.smallButtonHeight, 0x4a4a4a, 0.9
        );
        rightButton.setStrokeStyle(1, 0x666666);
        rightButton.setInteractive();
        
        const rightText = this.scene.add.text(rightX, this.layout.currentY, element.right.text, {
            fontSize: '10px', fill: '#fff'
        }).setOrigin(0.5);
        
        // Events für linken Button
        leftButton.on('pointerdown', element.left.onClick);
        leftButton.on('pointerover', () => leftButton.setFillStyle(0x5a5a5a));
        leftButton.on('pointerout', () => leftButton.setFillStyle(0x4a4a4a));
        
        // Events für rechten Button
        rightButton.on('pointerdown', element.right.onClick);
        rightButton.on('pointerover', () => rightButton.setFillStyle(0x5a5a5a));
        rightButton.on('pointerout', () => rightButton.setFillStyle(0x4a4a4a));
        
        // Speichere Referenzen
        if (element.left.id) this.elements[element.left.id + 'Text'] = leftText;
        if (element.right.id) this.elements[element.right.id + 'Text'] = rightText;
        
        this.layout.currentY += this.layout.smallButtonHeight + this.layout.elementSpacing;
    }
    
    /**
     * Rendert einen Spacer (unsichtbarer Abstand)
     */
    renderSpacer(element) {
        this.layout.currentY += element.height;
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