export default class BuildingMenu {
    constructor(
        scene,
        onSelectBuilding,
        onToggleGrid,
        onTogglePause,
        onChangeSpeed
    ) {
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
            tower: {
                cost: 10,
                name: "Turm",
                symbol: "🏯",
                width: 1,
                height: 1,
                maxLevel: 5,
                range: 80 // Direkte Range-Angabe (Level 1)
            },
            werfer: {
                cost: 50,
                name: "Werfer",
                symbol: "💥",
                width: 1,
                height: 1,
                maxLevel: 5,
                range: 200 // MASSIVE Range!
            },
            farm: {
                cost: 10,
                name: "Feld",
                symbol: "🌾",
                width: 1,
                height: 2,
                maxLevel: 5
            },
            factory: {
                cost: 10,
                name: "Fabrik",
                symbol: "🏭",
                width: 2,
                height: 1,
                maxLevel: 5
            },
            mine: {
                cost: 30,
                name: "Mine",
                symbol: "⛏️",
                width: 1,
                height: 1,
                maxLevel: 5
            }
        };
        
        // Range-Preview State
        this.previewRangeCircle = null;

        this.elements = {};

        // Layout-Konfiguration
        this.layout = {
            menuX: 1200 - 200, // mapWidth - 200
            menuY: 50,
            menuWidth: 180,
            elementSpacing: 20,
            buttonWidth: 160,
            buttonHeight: 40, // ALLE Buttons 40px
            smallButtonHeight: 40, // auch die "kleinen" jetzt 40px
            currentY: 0
        };

        this.createMenu();
    }

    /**
     * Erstellt das komplette Menü mit einfachem, gleichmäßigem Layout
     */
    createMenu() {
        const menuX = this.layout.menuX;
        const startY = this.layout.menuY + 30;
        let currentY = startY;

        // 1. Grid-Button
        this.createSimpleButton(
            menuX + 100,
            currentY,
            this.layout.buttonWidth,
            this.layout.buttonHeight,
            "Raster: AUS",
            () => this.toggleGrid(),
            "grid"
        );
        currentY += this.layout.buttonHeight + this.layout.elementSpacing;

        // 2. Pause + Speed Buttons (Block)
        const speedControls = this.createSpeedControlButtons(menuX, currentY);
        currentY += speedControls.totalHeight + this.layout.elementSpacing;

        // 3. Gebäude-Buttons
        Object.keys(this.buildingTypes).forEach((type) => {
            const building = this.buildingTypes[type];
            const buttonObj = this.createButton(
                menuX + 100,
                currentY,
                this.layout.buttonWidth,
                this.layout.buttonHeight,
                `${building.symbol} ${building.name}`,
                `${building.cost}B`,
                () => this.selectBuilding(type)
            );

            this.buildingTypes[type].button = buttonObj.background;
            this.buildingTypes[type].buttonText = buttonObj.labelText;
            this.buildingTypes[type].costText = buttonObj.costText;
            this.buildingTypes[type].buttonObj = buttonObj;

            currentY += this.layout.buttonHeight + this.layout.elementSpacing;
        });

        // 4. Menü-Hintergrund
        const totalHeight = currentY - this.layout.menuY + 20;
        const menuBg = this.scene.add.rectangle(
            menuX + 100,
            this.layout.menuY + totalHeight / 2,
            this.layout.menuWidth,
            totalHeight,
            0x333333,
            0.9
        );
        menuBg.setStrokeStyle(2, 0x666666);
        menuBg.setDepth(-1);
    }

    /**
     * Erstellt einen einfachen Button ohne Label/Cost-Trennung
     */
    createSimpleButton(x, y, width, height, text, onClick, id = null) {
        const button = this.scene.add.rectangle(
            x,
            y,
            width,
            height,
            0x4a4a4a,
            0.9
        );
        button.setStrokeStyle(2, 0x666666);
        button.setInteractive();

        const buttonText = this.scene.add
            .text(x, y, text, {
                fontSize: "14px",
                fill: "#fff"
            })
            .setOrigin(0.5);

        button.on("pointerdown", onClick);
        button.on("pointerover", () => button.setFillStyle(0x5a5a5a));
        button.on("pointerout", () => button.setFillStyle(0x4a4a4a));

        if (id) {
            this.elements[id + "Text"] = buttonText;
        }

        return { button, text: buttonText };
    }

    /**
     * Erstellt die Speed-Control Buttons untereinander
     */
    createSpeedControlButtons(menuX, y) {
        const buttonWidth = this.layout.buttonWidth;
        const buttonHeight = this.layout.buttonHeight; // jetzt 40px
        const spacing = this.layout.elementSpacing; // 20px

        // Pause Button
        const pauseBtn = this.createSimpleButton(
            menuX + 100,
            y,
            buttonWidth,
            buttonHeight,
            "⏸️ Pause",
            () => this.togglePause(),
            "pause"
        );

        // Speed Button (direkt darunter)
        const speedBtn = this.createSimpleButton(
            menuX + 100,
            y + buttonHeight + spacing,
            buttonWidth,
            buttonHeight,
            `${this.gameSpeed}x`,
            () => this.changeSpeed(),
            "speed"
        );

        return {
            pauseBtn,
            speedBtn,
            totalHeight: buttonHeight * 2 + spacing
        };
    }

    /**
     * Creates a standardized button with background, label and cost text
     */
    createButton(x, y, width, height, label, cost, onClick) {
        const button = this.scene.add.rectangle(
            x,
            y,
            width,
            height,
            0x4a4a4a,
            0.9
        );
        button.setStrokeStyle(2, 0x666666);
        button.setInteractive();

        const labelText = this.scene.add
            .text(x - width / 2 + 10, y, label, {
                fontSize: "14px",
                fill: "#fff"
            })
            .setOrigin(0, 0.5);

        const costText = this.scene.add
            .text(x + width / 2 - 10, y, cost, {
                fontSize: "12px",
                fill: "#ffd700"
            })
            .setOrigin(1, 0.5);

        button.on("pointerdown", onClick);

        button.on("pointerover", () => {
            button.setFillStyle(0x5a5a5a);
        });

        button.on("pointerout", () => {
            if (!button._isSelected) {
                button.setFillStyle(0x4a4a4a);
            }
        });

        return {
            background: button,
            labelText: labelText,
            costText: costText,

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
        // ✅ Toggle-Funktion: Wenn das gleiche Gebäude nochmal angeklickt wird
        if (this.selectedBuildingType === type) {
            // Deselect current building (Toggle OFF)
            this.deselectBuilding();
            return;
        }

        // Deselect previously selected building
        if (this.selectedBuildingType) {
            const prevButtonObj = this.buildingTypes[this.selectedBuildingType].buttonObj;
            if (prevButtonObj) {
                prevButtonObj.setSelected(false);
            }
        }

        // Clear any existing preview
        this.clearRangePreview();

        // Select new building
        this.selectedBuildingType = type;
        const buttonObj = this.buildingTypes[type].buttonObj;
        if (buttonObj) {
            buttonObj.setSelected(true);
        }

        this.onSelectBuilding(type);
    }

    /**
     * Zeigt Range-Preview für Gebäude mit Range (z.B. Tower) an der Maus-Position
     */
    showRangePreview(x, y, buildingType) {
        // Nur für Gebäude mit Range
        const building = this.buildingTypes[buildingType];
        if (!building || !building.range) {
            return;
        }

        // Entferne alten Preview-Kreis
        this.clearRangePreview();

        // Erstelle neuen Range-Kreis an der Maus-Position
        this.previewRangeCircle = this.scene.add.circle(
            x, y, 
            building.range, 
            0x00ff00, 
            0.1
        );
        this.previewRangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        this.previewRangeCircle.setDepth(100); // Über anderen Objekten anzeigen
    }

    /**
     * Entfernt den Range-Preview Kreis sauber
     */
    clearRangePreview() {
        if (this.previewRangeCircle) {
            this.previewRangeCircle.destroy();
            this.previewRangeCircle = null;
        }
    }

    deselectBuilding() {
        if (this.selectedBuildingType) {
            const buttonObj = this.buildingTypes[this.selectedBuildingType].buttonObj;
            if (buttonObj) {
                buttonObj.setSelected(false);
            }
            this.selectedBuildingType = null;
            
            // ✅ Informiere das Game-System über die Deselection
            this.onSelectBuilding(null);
        }

        // Range-Preview entfernen
        this.clearRangePreview();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        if (this.elements.gridText) {
            this.elements.gridText.setText(
                `Raster: ${this.showGrid ? "AN" : "AUS"}`
            );
        }
        this.onToggleGrid(this.showGrid);
    }

    togglePause() {
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
            this.elements.pauseText.setText(
                this.isPaused ? "▶️ Weiter" : "⏸️ Pause"
            );
        }
    }

    getBuildingType(type) {
        return this.buildingTypes[type];
    }

    getSelectedBuildingType() {
        return this.selectedBuildingType;
    }
}