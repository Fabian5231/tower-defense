class TowerDefenseGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerDefenseGame' });
        
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.buildings = [];
        this.townHallHealth = 100;
        this.score = 0;
        this.currency = 60;
        
        this.mapCenter = { x: 600, y: 400 };
        this.mapWidth = 1200;
        this.mapHeight = 800;
        
        this.gridSize = 30;
        this.gridWidth = Math.floor(this.mapWidth / this.gridSize);
        this.gridHeight = Math.floor(this.mapHeight / this.gridSize);
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        
        this.currentWave = 1;
        this.enemiesInWave = 5;
        this.enemiesSpawned = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
        this.baseEnemyHealth = 50;
        this.baseEnemySpeed = 50;
        
        this.selectedBuildingType = null;
        this.hoverGraphic = null;
        this.selectedBuilding = null;
        this.infoPanel = null;
        this.upgradeButton = null;
        this.upgradeButtonText = null;
        this.showGrid = false;
        this.gridGraphics = null;
        this.selectedBuildingRotation = 0;
        this.towerRangeCircles = [];
        this.hoverRangeCircle = null;
        this.buildingTypes = {
            tower: { cost: 10, name: 'Turm', symbol: '🏯', width: 1, height: 1, maxLevel: 3 },
            farm: { cost: 10, name: 'Feld', symbol: '🌾', width: 1, height: 2, maxLevel: 3 },
            factory: { cost: 10, name: 'Fabrik', symbol: '🏭', width: 2, height: 1, maxLevel: 3 }
        };
    }
    
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }
    
    gridToWorld(gridX, gridY) {
        return {
            x: (gridX + 0.5) * this.gridSize,
            y: (gridY + 0.5) * this.gridSize
        };
    }
    
    isGridAreaFree(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
                    return false;
                }
                if (this.grid[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    occupyGridArea(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    this.grid[y][x] = true;
                }
            }
        }
    }
    
    freeGridArea(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    this.grid[y][x] = false;
                }
            }
        }
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.gridButtonText.setText(`Raster: ${this.showGrid ? 'AN' : 'AUS'}`);
        
        if (this.showGrid) {
            this.createGridGraphics();
        } else {
            this.destroyGridGraphics();
        }
    }
    
    createGridGraphics() {
        if (this.gridGraphics) {
            this.destroyGridGraphics();
        }
        
        this.gridGraphics = this.add.group();
        
        for (let x = 0; x <= this.gridWidth; x++) {
            const line = this.add.line(0, 0, x * this.gridSize, 0, x * this.gridSize, this.mapHeight, 0x666666, 0.3);
            line.setOrigin(0, 0);
            this.gridGraphics.add(line);
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            const line = this.add.line(0, 0, 0, y * this.gridSize, this.mapWidth, y * this.gridSize, 0x666666, 0.3);
            line.setOrigin(0, 0);
            this.gridGraphics.add(line);
        }
    }
    
    destroyGridGraphics() {
        if (this.gridGraphics) {
            this.gridGraphics.clear(true, true);
            this.gridGraphics = null;
        }
    }
    
    showAllTowerRanges() {
        this.clearAllTowerRanges();
        
        this.towers.forEach(tower => {
            const rangeCircle = this.add.circle(tower.x, tower.y, tower.range, 0x00ff00, 0.1);
            rangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
            this.towerRangeCircles.push(rangeCircle);
        });
    }
    
    clearAllTowerRanges() {
        this.towerRangeCircles.forEach(circle => {
            circle.destroy();
        });
        this.towerRangeCircles = [];
    }
    
    getRotatedDimensions(buildingType, rotation) {
        const building = this.buildingTypes[buildingType];
        if (rotation === 90 || rotation === 270) {
            return { width: building.height, height: building.width };
        }
        return { width: building.width, height: building.height };
    }
    
    rotateBuilding(building) {
    if (building.type === 'tower') {
        return; // Towers are square, no need to rotate
    }

    const newRotation = (building.rotation + 90) % 360;
    const oldDimensions = this.getRotatedDimensions(building.type, building.rotation);
    const newDimensions = this.getRotatedDimensions(building.type, newRotation);

    // Free old grid space
    this.freeGridArea(building.gridX, building.gridY, oldDimensions.width, oldDimensions.height);

    // Check if new rotation fits
    if (this.isGridAreaFree(building.gridX, building.gridY, newDimensions.width, newDimensions.height)) {
        // Occupy new grid space
        this.occupyGridArea(building.gridX, building.gridY, newDimensions.width, newDimensions.height);

        // Update building properties
        building.rotation = newRotation;
        building.gridWidth = newDimensions.width;
        building.gridHeight = newDimensions.height;

        // 🔥 NEU: Weltposition anhand der neuen Dimensionen berechnen
        const newWorldPos = this.gridToWorldForBuilding(
            building.gridX,
            building.gridY,
            newDimensions.width,
            newDimensions.height
        );

        building.x = newWorldPos.x;
        building.y = newWorldPos.y;

        // Update graphics
        const displayWidth = newDimensions.width * this.gridSize;
        const displayHeight = newDimensions.height * this.gridSize;

        building.graphic.setSize(displayWidth, displayHeight);
        building.graphic.setPosition(newWorldPos.x, newWorldPos.y);

        if (building.symbol) {
            building.symbol.setPosition(newWorldPos.x, newWorldPos.y);
        }

        building.healthBarBg.setSize(displayWidth + 2, 6);
        building.healthBarBg.setPosition(newWorldPos.x, newWorldPos.y - displayHeight / 2 - 10);

        building.healthBar.setSize(displayWidth, 4);
        building.healthBar.setPosition(newWorldPos.x, newWorldPos.y - displayHeight / 2 - 10);
    } else {
        // Re-occupy old space if rotation failed
        this.occupyGridArea(building.gridX, building.gridY, oldDimensions.width, oldDimensions.height);
    }
}

    getWaveEnemyCount(wave) {
        return Math.floor(5 + (wave * 2)); // Start at 5, increase by 2 each wave
    }
    
    getWaveEnemyHealth(wave) {
        return Math.floor(this.baseEnemyHealth + (wave * 15)); // +15 HP per wave
    }
    
    getWaveEnemySpeed(wave) {
        return Math.floor(this.baseEnemySpeed + (wave * 3)); // +3 speed per wave
    }
    
    getBossHealth(wave) {
        return Math.floor(this.getWaveEnemyHealth(wave) * 8); // Boss has 8x normal enemy health
    }
    
    shouldSpawnBoss(wave) {
        return wave % 10 === 0; // Boss every 10 waves
    }
    
    startNextWave() {
        this.currentWave++;
        this.enemiesInWave = this.getWaveEnemyCount(this.currentWave);
        this.enemiesSpawned = 0;
        
        // Add boss to enemy count if it's a boss wave
        if (this.shouldSpawnBoss(this.currentWave)) {
            this.enemiesInWave++; // Add one for the boss
        }
        
        this.updateWaveUI();
    }
    
    updateWaveUI() {
        this.waveText.setText(`Welle: ${this.currentWave}`);
        this.enemyCountText.setText(`Gegner: ${this.enemiesInWave - this.enemiesSpawned}/${this.enemiesInWave}`);
    }
    
    isWaveComplete() {
        return this.enemiesSpawned >= this.enemiesInWave && this.enemies.length === 0;
    }
    
    getUpgradeCost(buildingType, currentLevel) {
        const baseCost = this.buildingTypes[buildingType].cost;
        return Math.floor(baseCost * (currentLevel + 1) * 1.5); // Escalating cost
    }
    
    upgradeBuilding(building) {
        const maxLevel = this.buildingTypes[building.type].maxLevel;
        if (building.level >= maxLevel) {
            return; // Already at max level
        }
        
        const upgradeCost = this.getUpgradeCost(building.type, building.level);
        if (this.currency < upgradeCost) {
            this.showInsufficientFundsMessage();
            return;
        }
        
        // Deduct cost and upgrade
        this.currency -= upgradeCost;
        this.currencyText.setText(`Batzen: ${this.currency}`);
        building.level++;
        
        // Apply level-based improvements
        this.applyLevelUpgrades(building);
        
        // Refresh info panel
        this.showBuildingInfo(building);
    }
    
    getAdjacentBuildings(building) {
        const adjacent = [];
        const buildingGridPositions = [];
        
        // Get all grid positions this building occupies
        for (let y = building.gridY; y < building.gridY + building.gridHeight; y++) {
            for (let x = building.gridX; x < building.gridX + building.gridWidth; x++) {
                buildingGridPositions.push({x, y});
            }
        }
        
        // Check all other buildings
        this.buildings.forEach(otherBuilding => {
            if (otherBuilding === building) return;
            
            // Get all grid positions the other building occupies
            const otherGridPositions = [];
            for (let y = otherBuilding.gridY; y < otherBuilding.gridY + otherBuilding.gridHeight; y++) {
                for (let x = otherBuilding.gridX; x < otherBuilding.gridX + otherBuilding.gridWidth; x++) {
                    otherGridPositions.push({x, y});
                }
            }
            
            // Check if any positions are adjacent (directly touching)
            let isAdjacent = false;
            buildingGridPositions.forEach(pos1 => {
                otherGridPositions.forEach(pos2 => {
                    const dx = Math.abs(pos1.x - pos2.x);
                    const dy = Math.abs(pos1.y - pos2.y);
                    // Adjacent means one tile away in any direction (including diagonal)
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1)) {
                        isAdjacent = true;
                    }
                });
            });
            
            if (isAdjacent) {
                adjacent.push(otherBuilding);
            }
        });
        
        return adjacent;
    }
    
    updateSupplyChains() {
        // Reset all supply relationships
        this.buildings.forEach(building => {
            if (building.type === 'farm') {
                building.suppliesFactory = false;
            } else if (building.type === 'factory') {
                building.suppliedBy = [];
                building.productionAmount = 0;
            }
        });
        
        // Update factory supply chains
        this.buildings.forEach(building => {
            if (building.type === 'factory') {
                const adjacent = this.getAdjacentBuildings(building);
                const supplierFarms = adjacent.filter(adj => adj.type === 'farm');
                
                building.suppliedBy = supplierFarms;
                
                // Calculate factory production based on suppliers
                let totalProduction = 0;
                supplierFarms.forEach(farm => {
                    farm.suppliesFactory = true;
                    totalProduction += farm.productionAmount * 1.5; // 1.5x multiplier
                });
                
                building.productionAmount = Math.floor(totalProduction);
            }
        });
    }

    applyLevelUpgrades(building) {
        const level = building.level;
        
        if (building.type === 'tower') {
            // Increase damage and range
            building.damage = 25 + ((level - 1) * 15); // Level 1: 25, Level 2: 40, Level 3: 55
            building.range = 60 + ((level - 1) * 20);   // Level 1: 60, Level 2: 80, Level 3: 100
            building.maxHealth = 75 + ((level - 1) * 25); // Level 1: 75, Level 2: 100, Level 3: 125
            building.health = building.maxHealth; // Heal to full on upgrade
        } else if (building.type === 'farm') {
            // Increase production and reduce time
            building.productionAmount = 5 + ((level - 1) * 3); // Level 1: 5, Level 2: 8, Level 3: 11
            building.productionRate = Math.max(15000, 30000 - ((level - 1) * 7500)); // Level 1: 30s, Level 2: 22.5s, Level 3: 15s
            building.maxHealth = 100 + ((level - 1) * 30); // Level 1: 100, Level 2: 130, Level 3: 160
            building.health = building.maxHealth; // Heal to full on upgrade
        } else if (building.type === 'factory') {
            // Increase health (future: add factory functionality)
            building.maxHealth = 150 + ((level - 1) * 50); // Level 1: 150, Level 2: 200, Level 3: 250
            building.health = building.maxHealth; // Heal to full on upgrade
        }
    }

    preload() {
        this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        this.add.text(10, 10, 'Tower Defense', { fontSize: '24px', fill: '#fff' });
        this.townHallHealthText = this.add.text(10, 40, `Rathaus: ${this.townHallHealth} HP`, { fontSize: '18px', fill: '#ff6b6b' });
        this.scoreText = this.add.text(10, 65, `Punkte: ${this.score}`, { fontSize: '18px', fill: '#fff' });
        this.currencyText = this.add.text(10, 90, `Batzen: ${this.currency}`, { fontSize: '18px', fill: '#ffd700' });
        this.waveText = this.add.text(10, 115, `Welle: ${this.currentWave}`, { fontSize: '18px', fill: '#00ff00' });
        this.enemyCountText = this.add.text(10, 140, `Gegner: ${this.enemiesInWave - this.enemiesSpawned}/${this.enemiesInWave}`, { fontSize: '16px', fill: '#ffaa00' });
        
        this.createTownHall();
        this.createBuildingMenu();
        
        // Initialize first wave
        this.enemiesInWave = this.getWaveEnemyCount(this.currentWave);
        this.updateWaveUI();
        
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer);
        });
        
        this.input.on('pointermove', (pointer) => {
            this.handleMouseMove(pointer);
        });
        
        this.input.keyboard.on('keydown-R', () => {
            if (this.selectedBuildingType) {
                this.selectedBuildingRotation = (this.selectedBuildingRotation + 90) % 360;
            }
        });
    }
    
    createTownHall() {
        const centerGridPos = this.worldToGrid(this.mapCenter.x, this.mapCenter.y);
        const townHallGridX = centerGridPos.x - 1;
        const townHallGridY = centerGridPos.y - 1;
        const townHallWorldPos = this.gridToWorld(townHallGridX + 1, townHallGridY + 1);
        
        this.occupyGridArea(townHallGridX, townHallGridY, 3, 3);
        
        this.townHall = {
            x: townHallWorldPos.x,
            y: townHallWorldPos.y,
            level: 1,
            health: this.townHallHealth,
            maxHealth: this.townHallHealth,
            radius: 45,
            gridX: townHallGridX,
            gridY: townHallGridY,
            gridWidth: 3,
            gridHeight: 3
        };
        
        const townHallSize = 3 * this.gridSize;
        
        // Main townhall building with gradient-like effect using multiple rectangles
        const townHallGraphic = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y, townHallSize, townHallSize, 0xd4af37); // Gold color
        townHallGraphic.setStrokeStyle(4, 0xb8860b); // Dark golden rod border
        
        // Inner decorative rectangle for depth
        const innerRect = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y, townHallSize - 8, townHallSize - 8, 0xffd700); // Brighter gold
        innerRect.setStrokeStyle(2, 0xdaa520); // Golden rod inner border
        
        // Crown symbol with shadow effect
        this.add.text(townHallWorldPos.x + 1, townHallWorldPos.y - 4, '👑', { 
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5); // Shadow
        
        this.add.text(townHallWorldPos.x, townHallWorldPos.y - 5, '👑', { 
            fontSize: '32px' 
        }).setOrigin(0.5); // Main crown
        
        this.townHallHealthBarBg = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize + 2, 10, 0x666666);
        this.townHallHealthBar = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize, 8, 0x00ff00);
        
        this.townHallHealthBarBg.setVisible(false);
        this.townHallHealthBar.setVisible(false);
    }
    
    createBuildingMenu() {
        const menuX = this.mapWidth - 200;
        const menuY = 20;
        
        const menuBg = this.add.rectangle(menuX + 100, menuY + 160, 180, 300, 0x333333, 0.9);
        menuBg.setStrokeStyle(2, 0x666666);
        
        this.add.text(menuX + 100, menuY + 30, 'Gebäude', { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const gridButton = this.add.rectangle(menuX + 100, menuY + 60, 160, 30, 0x4a4a4a, 0.9);
        gridButton.setStrokeStyle(2, 0x666666);
        gridButton.setInteractive();
        
        this.gridButtonText = this.add.text(menuX + 100, menuY + 60, 'Raster: AUS', { 
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
        
        let yOffset = 0;
        Object.keys(this.buildingTypes).forEach((type, index) => {
            const building = this.buildingTypes[type];
            const buttonY = menuY + 110 + (yOffset * 50); // +20px mehr Abstand
            
            const button = this.add.rectangle(menuX + 100, buttonY, 160, 40, 0x4a4a4a, 0.9);
            button.setStrokeStyle(2, 0x666666);
            button.setInteractive();
            
            const buttonText = this.add.text(menuX + 50, buttonY, 
                `${building.symbol} ${building.name}`, 
                { fontSize: '14px', fill: '#fff' }
            ).setOrigin(0, 0.5);
            
            const costText = this.add.text(menuX + 150, buttonY, 
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
        
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
        }
    }
    
    deselectBuilding() {
        if (this.selectedBuildingType) {
            this.buildingTypes[this.selectedBuildingType].button.setFillStyle(0x4a4a4a);
            this.selectedBuildingType = null;
        }
        
        if (this.selectedBuilding) {
            this.clearAllTowerRanges();
            
            // Progress-Bar cleanup für die ausgewählte Farm
            if (this.selectedBuilding.progressBar) {
                this.selectedBuilding.progressBar.destroy();
                this.selectedBuilding.progressBar = null;
            }
            
            if (this.selectedBuilding.progressBarBg) {
                this.selectedBuilding.progressBarBg.destroy();
                this.selectedBuilding.progressBarBg = null;
            }
            
            this.selectedBuilding = null;
        }
        
        this.clearBuildingInfo();
        
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
            this.hoverGraphic = null;
        }
        
        if (this.hoverRangeCircle) {
            this.hoverRangeCircle.destroy();
            this.hoverRangeCircle = null;
        }
    }
    
    handleClick(pointer) {
        if (pointer.x > this.mapWidth - 200) return;
        
        if (this.selectedBuildingType && pointer.y > 100) {
            this.tryPlaceBuilding(pointer.x, pointer.y, this.selectedBuildingType);
        } else if (!this.selectedBuildingType && pointer.y > 100) {
            this.selectExistingBuilding(pointer.x, pointer.y);
        }
    }
    
    handleMouseMove(pointer) {
        if (!this.selectedBuildingType || pointer.x > this.mapWidth - 200) {
            if (this.hoverGraphic) {
                this.hoverGraphic.setVisible(false);
            }
            if (this.hoverRangeCircle) {
                this.hoverRangeCircle.setVisible(false);
            }
            return;
        }
        
        if (pointer.y > 100) {
            this.showBuildingPreview(pointer.x, pointer.y, this.selectedBuildingType);
        }
    }
    
    showBuildingPreview(x, y, type) {
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
        }
        if (this.hoverRangeCircle) {
            this.hoverRangeCircle.destroy();
            this.hoverRangeCircle = null;
        }
        
        const building = this.buildingTypes[type];
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.worldToGrid(x, y);
        const worldPos = this.gridToWorldForBuilding(
    gridPos.x,
    gridPos.y,
    dimensions.width,
    dimensions.height
);
        
        const canAfford = this.currency >= building.cost;
        const canPlace = this.isGridAreaFree(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const color = canAfford && canPlace ? 0x00ff00 : 0xff0000;
        const alpha = 0.5;
        
        const displayWidth = dimensions.width * this.gridSize;
        const displayHeight = dimensions.height * this.gridSize;
        
        this.hoverGraphic = this.add.rectangle(worldPos.x, worldPos.y, displayWidth, displayHeight, color, alpha);
        this.hoverGraphic.setStrokeStyle(2, color, 0.8);
        
        // Show range preview for towers
        if (type === 'tower') {
            const towerRange = 60; // Default tower range
            const rangeColor = canAfford && canPlace ? 0x00ff00 : 0xff0000;
            this.hoverRangeCircle = this.add.circle(worldPos.x, worldPos.y, towerRange, rangeColor, 0.1);
            this.hoverRangeCircle.setStrokeStyle(2, rangeColor, 0.3);
        }
    }

    gridToWorldForBuilding(gridX, gridY, width, height) {
    return {
        x: (gridX + width / 2) * this.gridSize,
        y: (gridY + height / 2) * this.gridSize
    };
}
    
    tryPlaceBuilding(x, y, type) {
        const building = this.buildingTypes[type];
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.worldToGrid(x, y);
        const worldPos = this.gridToWorldForBuilding(
    gridPos.x,
    gridPos.y,
    dimensions.width,
    dimensions.height
);
        
        const canAfford = this.currency >= building.cost;
        const canPlace = this.isGridAreaFree(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        
        if (canAfford && canPlace) {
            this.currency -= building.cost;
            this.currencyText.setText(`Batzen: ${this.currency}`);
            
            this.occupyGridArea(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
            
            if (type === 'tower') {
                this.placeTowerFree(worldPos.x, worldPos.y, gridPos, this.selectedBuildingRotation);
            } else if (type === 'farm') {
                this.placeFarm(worldPos.x, worldPos.y, gridPos, this.selectedBuildingRotation);
            } else if (type === 'factory') {
                this.placeFactory(worldPos.x, worldPos.y, gridPos, this.selectedBuildingRotation);
            }
            
            if (this.hoverGraphic) {
                this.hoverGraphic.destroy();
                this.hoverGraphic = null;
            }
            
            this.selectedBuildingRotation = 0; // Reset rotation after placement
            this.deselectBuilding();
        } else if (!canAfford) {
            this.showInsufficientFundsMessage();
        }
    }
    
    placeFarm(x, y, gridPos, rotation = 0) {
        const dimensions = this.getRotatedDimensions('farm', rotation);
        const displayWidth = dimensions.width * this.gridSize;
        const displayHeight = dimensions.height * this.gridSize;
        
        const farm = {
            x: x,
            y: y,
            gridX: gridPos.x,
            gridY: gridPos.y,
            gridWidth: dimensions.width,
            gridHeight: dimensions.height,
            rotation: rotation,
            level: 1,
            health: 100,
            maxHealth: 100,
            type: 'farm',
            lastProduction: this.time.now,
            productionRate: 30000,
            productionAmount: 5,
            suppliesFactory: false, // Whether this farm supplies a factory
            graphic: this.add.rectangle(x, y, displayWidth, displayHeight, 0x8b4513),
            symbol: this.add.text(x, y, '🌾', { fontSize: '20px' }).setOrigin(0.5),
            healthBarBg: this.add.rectangle(x, y - displayHeight/2 - 10, displayWidth + 2, 6, 0x666666),
            healthBar: this.add.rectangle(x, y - displayHeight/2 - 10, displayWidth, 4, 0x00ff00)
        };
        
        farm.graphic.setStrokeStyle(2, 0x654321);
        farm.healthBarBg.setVisible(false);
        farm.healthBar.setVisible(false);
        
        this.buildings.push(farm);
    }
    
    placeFactory(x, y, gridPos, rotation = 0) {
        const dimensions = this.getRotatedDimensions('factory', rotation);
        const displayWidth = dimensions.width * this.gridSize;
        const displayHeight = dimensions.height * this.gridSize;
        
        const factory = {
            x: x,
            y: y,
            gridX: gridPos.x,
            gridY: gridPos.y,
            gridWidth: dimensions.width,
            gridHeight: dimensions.height,
            rotation: rotation,
            level: 1,
            health: 150,
            maxHealth: 150,
            type: 'factory',
            suppliedBy: [], // Array of buildings that supply this factory
            lastProduction: this.time.now,
            productionRate: 30000, // Same base rate as farms
            productionAmount: 0, // Will be calculated based on suppliers
            graphic: this.add.rectangle(x, y, displayWidth, displayHeight, 0x666666),
            symbol: this.add.text(x, y, '🏭', { fontSize: '18px' }).setOrigin(0.5),
            healthBarBg: this.add.rectangle(x, y - displayHeight/2 - 10, displayWidth + 2, 6, 0x666666),
            healthBar: this.add.rectangle(x, y - displayHeight/2 - 10, displayWidth, 4, 0x00ff00)
        };
        
        factory.graphic.setStrokeStyle(2, 0x444444);
        factory.healthBarBg.setVisible(false);
        factory.healthBar.setVisible(false);
        
        this.buildings.push(factory);
    }
    
    
    placeTowerFree(x, y, gridPos, rotation = 0) {
        const displaySize = this.gridSize;
        
        const tower = {
            x: x,
            y: y,
            gridX: gridPos.x,
            gridY: gridPos.y,
            gridWidth: this.buildingTypes.tower.width,
            gridHeight: this.buildingTypes.tower.height,
            rotation: rotation,
            level: 1,
            health: 75,
            maxHealth: 75,
            range: 60,
            damage: 25,
            fireRate: 500,
            lastFired: 0,
            type: 'tower',
            graphic: this.add.rectangle(x, y, displaySize, displaySize, 0x00ff00),
            healthBarBg: this.add.rectangle(x, y - displaySize/2 - 10, displaySize + 2, 6, 0x666666),
            healthBar: this.add.rectangle(x, y - displaySize/2 - 10, displaySize, 4, 0x00ff00)
        };
        
        tower.graphic.setStrokeStyle(2, 0x00aa00);
        
        tower.healthBarBg.setVisible(false);
        tower.healthBar.setVisible(false);
        
        this.towers.push(tower);
        this.buildings.push(tower);
    }
    
    update(time, delta) {
        this.spawnEnemies(time);
        this.moveEnemies(delta);
        this.updateTowers(time);
        this.updateSupplyChains(); // Update supply chains every frame
        this.updateFarms(time);
        this.updateFactories(time);
        this.updateFarmTimer(time);
        this.moveProjectiles(delta);
        this.checkCollisions();
        this.removeDeadObjects();
        this.removeDeadBuildings();
        
        // Check for wave completion
        if (this.isWaveComplete()) {
            this.startNextWave();
        }
        
        if (this.townHallHealth <= 0) {
            this.gameOver();
        }
    }
    
    spawnEnemies(time) {
        if (this.enemiesSpawned < this.enemiesInWave && time - this.enemySpawnTimer > this.enemySpawnDelay) {
            this.createEnemy();
            this.enemiesSpawned++;
            this.enemySpawnTimer = time;
            this.updateWaveUI();
        }
    }
    
    createEnemy() {
        const spawnPoint = this.getRandomSpawnPoint();
        const isBoss = this.shouldSpawnBoss(this.currentWave) && this.enemiesSpawned === this.enemiesInWave - 1;
        
        let health, speed, size, color, goldReward;
        
        if (isBoss) {
            health = this.getBossHealth(this.currentWave);
            speed = Math.max(20, this.getWaveEnemySpeed(this.currentWave) - 20); // Bosses are slower
            size = 35;
            color = 0x800080; // Purple for boss
            goldReward = 25; // Boss gives more gold
        } else {
            health = this.getWaveEnemyHealth(this.currentWave);
            speed = this.getWaveEnemySpeed(this.currentWave);
            size = 20;
            color = 0xff0000; // Red for normal enemies
            goldReward = 5;
        }
        
        const enemy = {
            x: spawnPoint.x,
            y: spawnPoint.y,
            health: health,
            maxHealth: health,
            speed: speed,
            isBoss: isBoss,
            goldReward: goldReward,
            graphic: this.add.rectangle(spawnPoint.x, spawnPoint.y, size, size, color),
            healthBarBg: this.add.rectangle(spawnPoint.x, spawnPoint.y - (size/2 + 10), size + 2, 6, 0x666666),
            healthBar: this.add.rectangle(spawnPoint.x, spawnPoint.y - (size/2 + 10), size, 4, 0x00ff00)
        };
        
        // Add boss indicator
        if (isBoss) {
            enemy.graphic.setStrokeStyle(3, 0xffff00); // Yellow outline for boss
            enemy.bossSymbol = this.add.text(spawnPoint.x, spawnPoint.y, '👑', { 
                fontSize: '16px' 
            }).setOrigin(0.5);
        }
        
        enemy.healthBarBg.setVisible(false);
        enemy.healthBar.setVisible(false);
        
        this.enemies.push(enemy);
    }
    
    getRandomSpawnPoint() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // Top
                x = Math.random() * this.mapWidth;
                y = -50;
                break;
            case 1: // Right  
                x = this.mapWidth + 50;
                y = Math.random() * this.mapHeight;
                break;
            case 2: // Bottom
                x = Math.random() * this.mapWidth;
                y = this.mapHeight + 50;
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * this.mapHeight;
                break;
        }
        
        return { x, y };
    }
    
    moveEnemies(delta) {
        this.enemies.forEach(enemy => {
            const direction = {
                x: this.mapCenter.x - enemy.x,
                y: this.mapCenter.y - enemy.y
            };
            const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            
            if (distance < this.townHall.radius + 10) {
                this.townHallHealth -= 10;
                this.townHallHealthText.setText(`Rathaus: ${this.townHallHealth} HP`);
                
                if (!this.townHallHealthBar.visible) {
                    this.townHallHealthBarBg.setVisible(true);
                    this.townHallHealthBar.setVisible(true);
                }
                this.townHallHealthBar.scaleX = this.townHallHealth / this.townHall.maxHealth;
                
                enemy.toRemove = true;
                return;
            }
            
            direction.x /= distance;
            direction.y /= distance;
            
            enemy.x += direction.x * enemy.speed * (delta / 1000);
            enemy.y += direction.y * enemy.speed * (delta / 1000);
            
            enemy.graphic.x = enemy.x;
            enemy.graphic.y = enemy.y;
            enemy.healthBarBg.x = enemy.x;
            enemy.healthBarBg.y = enemy.y - (enemy.isBoss ? 25 : 15);
            enemy.healthBar.x = enemy.x;
            enemy.healthBar.y = enemy.y - (enemy.isBoss ? 25 : 15);
            
            if (enemy.bossSymbol) {
                enemy.bossSymbol.x = enemy.x;
                enemy.bossSymbol.y = enemy.y;
            }
            
            if (enemy.healthBar.visible) {
                enemy.healthBar.scaleX = enemy.health / enemy.maxHealth;
            }
        });
    }
    
    updateTowers(time) {
        this.towers.forEach(tower => {
            if (time - tower.lastFired > tower.fireRate) {
                const target = this.findNearestEnemy(tower);
                if (target) {
                    this.fireTower(tower, target);
                    tower.lastFired = time;
                }
            }
        });
    }
    
    findNearestEnemy(tower) {
        let bestTarget = null;
        let shortestDistanceToTownHall = Infinity;
        
        this.enemies.forEach(enemy => {
            // Check if enemy is in range of tower
            const distanceToTower = Math.sqrt(
                (enemy.x - tower.x) * (enemy.x - tower.x) + 
                (enemy.y - tower.y) * (enemy.y - tower.y)
            );
            
            if (distanceToTower <= tower.range) {
                // Calculate distance from enemy to town hall
                const distanceToTownHall = Math.sqrt(
                    (enemy.x - this.townHall.x) * (enemy.x - this.townHall.x) + 
                    (enemy.y - this.townHall.y) * (enemy.y - this.townHall.y)
                );
                
                // Prioritize enemy closest to town hall
                if (distanceToTownHall < shortestDistanceToTownHall) {
                    bestTarget = enemy;
                    shortestDistanceToTownHall = distanceToTownHall;
                }
            }
        });
        
        return bestTarget;
    }
    
    fireTower(tower, target) {
        // Create visual projectile for effect
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            target: target, // Reference to target for guaranteed hit
            speed: 300, // Faster projectiles
            damage: tower.damage,
            graphic: this.add.circle(tower.x, tower.y, 3, 0xffff00)
        };
        
        this.projectiles.push(projectile);
    }
    
    moveProjectiles(delta) {
        this.projectiles.forEach(projectile => {
            // Update target position if target still exists
            if (projectile.target && !projectile.target.toRemove) {
                projectile.targetX = projectile.target.x;
                projectile.targetY = projectile.target.y;
            }
            
            const direction = {
                x: projectile.targetX - projectile.x,
                y: projectile.targetY - projectile.y
            };
            const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            
            if (distance < 8) { // Slightly larger hit detection
                projectile.toRemove = true;
                
                // Guaranteed hit - damage the target if it still exists
                if (projectile.target && !projectile.target.toRemove) {
                    projectile.target.health -= projectile.damage;
                    this.showEnemyHealthBar(projectile.target);
                    
                    if (projectile.target.health <= 0) {
                        projectile.target.toRemove = true;
                        this.score += projectile.target.isBoss ? 50 : 10;
                        this.currency += projectile.target.goldReward;
                        this.scoreText.setText(`Punkte: ${this.score}`);
                        this.currencyText.setText(`Batzen: ${this.currency}`);
                    }
                }
                return;
            }
            
            direction.x /= distance;
            direction.y /= distance;
            
            projectile.x += direction.x * projectile.speed * (delta / 1000);
            projectile.y += direction.y * projectile.speed * (delta / 1000);
            
            projectile.graphic.x = projectile.x;
            projectile.graphic.y = projectile.y;
        });
    }
    
    checkCollisions() {
        // Collision detection is now handled in moveProjectiles for guaranteed hits
    }
    
    removeDeadObjects() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.toRemove) {
                enemy.graphic.destroy();
                enemy.healthBarBg.destroy();
                enemy.healthBar.destroy();
                if (enemy.bossSymbol) {
                    enemy.bossSymbol.destroy();
                }
                return false;
            }
            return true;
        });
        
        this.projectiles = this.projectiles.filter(projectile => {
            if (projectile.toRemove) {
                projectile.graphic.destroy();
                return false;
            }
            return true;
        });
    }
    
    gameOver() {
        this.add.text(this.mapCenter.x, this.mapCenter.y - 100, 'RATHAUS ZERSTÖRT!', { 
            fontSize: '48px', 
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        this.add.text(this.mapCenter.x, this.mapCenter.y - 40, `Endpunktzahl: ${this.score}`, { 
            fontSize: '24px', 
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        this.add.text(this.mapCenter.x, this.mapCenter.y + 10, 'F5 zum Neustarten', { 
            fontSize: '18px', 
            fill: '#aaa',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        this.scene.pause();
    }
    
    updateFarms(time) {
        this.buildings.forEach(building => {
            if (building.type === 'farm' && !building.suppliesFactory) {
                // Only produce gold if farm is not supplying a factory
                if (time - building.lastProduction > building.productionRate) {
                    this.currency += building.productionAmount;
                    this.currencyText.setText(`Batzen: ${this.currency}`);
                    building.lastProduction = time;
                    
                    const coinText = this.add.text(building.x, building.y - 40, `+${building.productionAmount}`, {
                        fontSize: '14px',
                        fill: '#ffd700',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: coinText,
                        y: building.y - 60,
                        alpha: 0,
                        duration: 1500,
                        onComplete: () => coinText.destroy()
                    });
                }
            }
        });
    }
    
    updateFactories(time) {
        this.buildings.forEach(building => {
            if (building.type === 'factory' && building.productionAmount > 0) {
                // Only produce if factory has suppliers
                if (time - building.lastProduction > building.productionRate) {
                    this.currency += building.productionAmount;
                    this.currencyText.setText(`Batzen: ${this.currency}`);
                    building.lastProduction = time;
                    
                    const coinText = this.add.text(building.x, building.y - 40, `+${building.productionAmount}`, {
                        fontSize: '14px',
                        fill: '#00ff00', // Green for factory production
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: coinText,
                        y: building.y - 60,
                        alpha: 0,
                        duration: 1500,
                        onComplete: () => coinText.destroy()
                    });
                }
            }
        });
    }
    
    createFarmTimer(farm) {
        // Timer-Text wird direkt im Info-Panel integriert - kein separates Element nötig
        this.timerText = { isIntegrated: true };
    }
    
    updateFarmTimer(time) {
        if (this.selectedBuilding && this.selectedBuilding.type === 'farm' && this.infoPanel && !this.selectedBuilding.suppliesFactory) {
            // Only show timer for farms that are not supplying factories
            const farm = this.selectedBuilding;
            const timeSinceLastProduction = time - farm.lastProduction;
            const timeRemaining = Math.max(0, farm.productionRate - timeSinceLastProduction);
            const secondsRemaining = Math.ceil(timeRemaining / 1000);
            
            let timerInfo = '';
            if (secondsRemaining > 0) {
                timerInfo = `Nächste Auszahlung: ${secondsRemaining}s`;
            } else {
                timerInfo = 'Bereit für Auszahlung!';
            }
            
            // Update den gesamten Info-Panel Text mit Timer-Information
            const baseText = `Feld - Level ${farm.level}\n+${farm.productionAmount} Batzen alle ${farm.productionRate / 1000} Sek\nHP: ${farm.health}/${farm.maxHealth}`;
            const fullText = `${baseText}\n\n${timerInfo}`;
            
            this.infoPanel.setText(fullText);
        }
    }
    
    selectExistingBuilding(x, y) {
        let clickedBuilding = null;
        let minDistance = 50;
        
        this.buildings.forEach(building => {
            const distance = Math.sqrt(
                (building.x - x) * (building.x - x) + 
                (building.y - y) * (building.y - y)
            );
            
            if (distance < minDistance) {
                clickedBuilding = building;
                minDistance = distance;
            }
        });
        
        if (clickedBuilding) {
            if (this.selectedBuilding) {
                this.deselectBuilding();
            }
            
            this.selectedBuilding = clickedBuilding;
            this.showBuildingInfo(clickedBuilding);
            
            if (clickedBuilding.type === 'tower') {
                this.showAllTowerRanges();
            }
        } else {
            this.deselectBuilding();
        }
    }
    
    showBuildingInfo(building) {
        // Clean up existing UI elements
        this.clearBuildingInfo();
        
        // Create basic info text (include timer placeholder for farms)
        let infoText = '';
        if (building.type === 'tower') {
            infoText = `Turm - Level ${building.level}\nReichweite: ${building.range}px\nSchaden: ${building.damage}\nHP: ${building.health}/${building.maxHealth}`;
        } else if (building.type === 'farm') {
            if (building.suppliesFactory) {
                infoText = `Feld - Level ${building.level}\nBeliefert Fabrik\nKeine direkte Produktion\nHP: ${building.health}/${building.maxHealth}`;
            } else {
                infoText = `Feld - Level ${building.level}\n+${building.productionAmount} Batzen alle ${building.productionRate / 1000} Sek\nHP: ${building.health}/${building.maxHealth}\n\nTimer: Lade...`;
            }
        } else if (building.type === 'factory') {
            if (building.suppliedBy.length > 0) {
                const supplierNames = building.suppliedBy.map(supplier => {
                    if (supplier.type === 'farm') return 'Feld';
                    return supplier.type;
                });
                const supplierText = supplierNames.join(', ');
                infoText = `Fabrik - Level ${building.level}\n+${building.productionAmount} Batzen alle ${building.productionRate / 1000} Sek\nBeliefert durch: ${supplierNames.length} ${supplierNames.length === 1 ? 'Feld' : 'Felder'}\nHP: ${building.health}/${building.maxHealth}`;
            } else {
                infoText = `Fabrik - Level ${building.level}\nKeine Belieferung\nKeine Produktion\nHP: ${building.health}/${building.maxHealth}`;
            }
        }
        
        // Create info panel (text only)
        this.infoPanel = this.add.text(building.x + 50, building.y - 50, infoText, {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 8 }
        }).setOrigin(0, 0.5);
        
        // Create upgrade button
        this.createUpgradeButton(building);
        
        // Create rotation button for non-tower buildings
        if (building.type !== 'tower') {
            this.createRotationButton(building);
        }
        
        // Timer for farms is now integrated into the main info text (only for non-supplying farms)
    }
    
    clearBuildingInfo() {
        if (this.infoPanel) {
            this.infoPanel.destroy();
            this.infoPanel = null;
        }
        if (this.upgradeButton) {
            this.upgradeButton.destroy();
            this.upgradeButton = null;
        }
        if (this.upgradeButtonText) {
            this.upgradeButtonText.destroy();
            this.upgradeButtonText = null;
        }
        if (this.rotateButton) {
            this.rotateButton.destroy();
            this.rotateButton = null;
        }
        if (this.rotateButtonText) {
            this.rotateButtonText.destroy();
            this.rotateButtonText = null;
        }
        if (this.timerText && this.timerText.destroy) {
            this.timerText.destroy();
            this.timerText = null;
        }
    }
    
    createUpgradeButton(building) {
        const maxLevel = this.buildingTypes[building.type].maxLevel;
        const buttonY = this.infoPanel.y + this.infoPanel.height / 2 + 25; // Consistent spacing
        
        if (building.level < maxLevel) {
            const upgradeCost = this.getUpgradeCost(building.type, building.level);
            
            // Create upgrade button
            this.upgradeButton = this.add.rectangle(building.x + 50, buttonY, 120, 25, 0x4a4a4a, 0.9);
            this.upgradeButton.setStrokeStyle(1, 0x666666);
            this.upgradeButton.setInteractive();
            this.upgradeButton.setOrigin(0, 0.5);
            
            this.upgradeButtonText = this.add.text(building.x + 110, buttonY, `⬆️ Upgrade (${upgradeCost}B)`, {
                fontSize: '10px',
                fill: '#fff'
            }).setOrigin(0.5, 0.5);
            
            // Button interactions
            this.upgradeButton.on('pointerdown', () => {
                this.upgradeBuilding(building);
            });
            
            this.upgradeButton.on('pointerover', () => {
                this.upgradeButton.setFillStyle(0x5a5a5a);
            });
            
            this.upgradeButton.on('pointerout', () => {
                this.upgradeButton.setFillStyle(0x4a4a4a);
            });
        } else {
            // Max level indicator
            this.upgradeButtonText = this.add.text(building.x + 50, buttonY, '✨ Max Level', {
                fontSize: '10px',
                fill: '#ffd700'
            }).setOrigin(0, 0.5);
        }
    }
    
    createRotationButton(building) {
        const buttonY = this.upgradeButton ? 
            this.upgradeButton.y + 35 : // Consistent spacing between buttons
            this.infoPanel.y + this.infoPanel.height / 2 + 25;
        
        // Create rotation button
        this.rotateButton = this.add.rectangle(building.x + 50, buttonY, 120, 25, 0x4a4a4a, 0.9);
        this.rotateButton.setStrokeStyle(1, 0x666666);
        this.rotateButton.setInteractive();
        this.rotateButton.setOrigin(0, 0.5);
        
        this.rotateButtonText = this.add.text(building.x + 110, buttonY, '🔄 Drehen', {
            fontSize: '10px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5);
        
        // Button interactions
        this.rotateButton.on('pointerdown', () => {
            this.rotateBuilding(building);
            this.showBuildingInfo(building);
        });
        
        this.rotateButton.on('pointerover', () => {
            this.rotateButton.setFillStyle(0x5a5a5a);
        });
        
        this.rotateButton.on('pointerout', () => {
            this.rotateButton.setFillStyle(0x4a4a4a);
        });
    }
    
    showEnemyHealthBar(enemy) {
        if (!enemy.healthBarBg.visible) {
            enemy.healthBarBg.setVisible(true);
            enemy.healthBar.setVisible(true);
        }
        enemy.healthBar.scaleX = enemy.health / enemy.maxHealth;
    }
    
    showBuildingHealthBar(building) {
        if (!building.healthBarBg.visible) {
            building.healthBarBg.setVisible(true);
            building.healthBar.setVisible(true);
        }
        building.healthBar.scaleX = building.health / building.maxHealth;
    }
    
    damageBuildingAt(x, y, damage) {
        this.buildings.forEach(building => {
            const distance = Math.sqrt(
                (building.x - x) * (building.x - x) + 
                (building.y - y) * (building.y - y)
            );
            
            if (distance < 30) {
                building.health -= damage;
                this.showBuildingHealthBar(building);
                
                if (building.health <= 0) {
                    building.toRemove = true;
                }
            }
        });
    }
    
    showInsufficientFundsMessage() {
        const message = this.add.text(this.mapCenter.x, 150, 'Nicht genug Batzen!', {
            fontSize: '20px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        this.time.delayedCall(1500, () => {
            message.destroy();
        });
    }
    
    removeDeadBuildings() {
        this.buildings = this.buildings.filter(building => {
            if (building.toRemove) {
                building.graphic.destroy();
                if (building.symbol) building.symbol.destroy();
                building.healthBarBg.destroy();
                building.healthBar.destroy();
                
                if (building.gridX !== undefined && building.gridY !== undefined) {
                    this.freeGridArea(building.gridX, building.gridY, building.gridWidth, building.gridHeight);
                }
                
                if (building.type === 'tower') {
                    this.towers = this.towers.filter(tower => tower !== building);
                }
                
                return false;
            }
            return true;
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#2c5f3f',
    scene: TowerDefenseGame,
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);