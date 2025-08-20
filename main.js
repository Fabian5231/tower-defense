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
        
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
        
        this.selectedBuildingType = null;
        this.hoverGraphic = null;
        this.selectedBuilding = null;
        this.infoPanel = null;
        this.showGrid = false;
        this.gridGraphics = null;
        this.selectedBuildingRotation = 0;
        this.buildingTypes = {
            tower: { cost: 10, name: 'Turm', symbol: '🏯', width: 1, height: 1 },
            farm: { cost: 10, name: 'Feld', symbol: '🌾', width: 1, height: 2 },
            factory: { cost: 10, name: 'Fabrik', symbol: '🏭', width: 2, height: 1 }
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
            
            // Update graphics
            const displayWidth = newDimensions.width * this.gridSize;
            const displayHeight = newDimensions.height * this.gridSize;
            
            building.graphic.setSize(displayWidth, displayHeight);
            building.healthBarBg.x = building.x;
            building.healthBarBg.y = building.y - displayHeight/2 - 10;
            building.healthBarBg.setSize(displayWidth + 2, 6);
            building.healthBar.x = building.x;
            building.healthBar.y = building.y - displayHeight/2 - 10;
            building.healthBar.setSize(displayWidth, 4);
        } else {
            // Re-occupy old space if rotation failed
            this.occupyGridArea(building.gridX, building.gridY, oldDimensions.width, oldDimensions.height);
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
        
        this.createTownHall();
        this.createBuildingMenu();
        
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
            health: this.townHallHealth,
            maxHealth: this.townHallHealth,
            radius: 45,
            gridX: townHallGridX,
            gridY: townHallGridY,
            gridWidth: 3,
            gridHeight: 3
        };
        
        const townHallSize = 3 * this.gridSize;
        const townHallGraphic = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y, townHallSize, townHallSize, 0x8b4513);
        townHallGraphic.setStrokeStyle(4, 0x654321);
        
        this.add.text(townHallWorldPos.x, townHallWorldPos.y - 5, '👑', { 
            fontSize: '32px' 
        }).setOrigin(0.5);
        
        this.townHallHealthBarBg = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize + 2, 10, 0x666666);
        this.townHallHealthBar = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize, 8, 0x00ff00);
        
        this.townHallHealthBarBg.setVisible(false);
        this.townHallHealthBar.setVisible(false);
    }
    
    createBuildingMenu() {
        const menuX = this.mapWidth - 200;
        const menuY = 20;
        
        const menuBg = this.add.rectangle(menuX + 100, menuY + 140, 180, 260, 0x333333, 0.9);
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
            const buttonY = menuY + 90 + (yOffset * 50);
            
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
            if (this.selectedBuilding.rangeIndicator) {
                this.selectedBuilding.rangeIndicator.destroy();
                this.selectedBuilding.rangeIndicator = null;
            }
            
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
        
        if (this.infoPanel) {
            this.infoPanel.destroy();
            this.infoPanel = null;
        }
        
        if (this.timerText && this.timerText.destroy) {
            this.timerText.destroy();
            this.timerText = null;
        }
        
        if (this.rotateButton) {
            this.rotateButton.destroy();
            this.rotateButton = null;
        }
        
        if (this.rotateButtonText) {
            this.rotateButtonText.destroy();
            this.rotateButtonText = null;
        }
        
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
            this.hoverGraphic = null;
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
        
        const building = this.buildingTypes[type];
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.worldToGrid(x, y);
        const worldPos = this.gridToWorld(gridPos.x, gridPos.y);
        
        const canAfford = this.currency >= building.cost;
        const canPlace = this.isGridAreaFree(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const color = canAfford && canPlace ? 0x00ff00 : 0xff0000;
        const alpha = 0.5;
        
        const displayWidth = dimensions.width * this.gridSize;
        const displayHeight = dimensions.height * this.gridSize;
        
        this.hoverGraphic = this.add.rectangle(worldPos.x, worldPos.y, displayWidth, displayHeight, color, alpha);
        this.hoverGraphic.setStrokeStyle(2, color, 0.8);
    }
    
    tryPlaceBuilding(x, y, type) {
        const building = this.buildingTypes[type];
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.worldToGrid(x, y);
        const worldPos = this.gridToWorld(gridPos.x, gridPos.y);
        
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
            health: 100,
            maxHealth: 100,
            type: 'farm',
            lastProduction: this.time.now,
            productionRate: 30000,
            productionAmount: 5,
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
            health: 150,
            maxHealth: 150,
            type: 'factory',
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
        
        const rangeCircle = this.add.circle(x, y, tower.range, 0x00ff00, 0.1);
        rangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        
        tower.healthBarBg.setVisible(false);
        tower.healthBar.setVisible(false);
        
        this.towers.push(tower);
        this.buildings.push(tower);
    }
    
    update(time, delta) {
        this.spawnEnemies(time);
        this.moveEnemies(delta);
        this.updateTowers(time);
        this.updateFarms(time);
        this.updateFarmTimer(time);
        this.moveProjectiles(delta);
        this.checkCollisions();
        this.removeDeadObjects();
        this.removeDeadBuildings();
        
        if (this.townHallHealth <= 0) {
            this.gameOver();
        }
    }
    
    spawnEnemies(time) {
        if (time - this.enemySpawnTimer > this.enemySpawnDelay) {
            this.createEnemy();
            this.enemySpawnTimer = time;
        }
    }
    
    createEnemy() {
        const spawnPoint = this.getRandomSpawnPoint();
        const enemy = {
            x: spawnPoint.x,
            y: spawnPoint.y,
            health: 50,
            maxHealth: 50,
            speed: 50,
            graphic: this.add.rectangle(spawnPoint.x, spawnPoint.y, 20, 20, 0xff0000),
            healthBarBg: this.add.rectangle(spawnPoint.x, spawnPoint.y - 15, 22, 6, 0x666666),
            healthBar: this.add.rectangle(spawnPoint.x, spawnPoint.y - 15, 20, 4, 0x00ff00)
        };
        
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
            enemy.healthBarBg.y = enemy.y - 15;
            enemy.healthBar.x = enemy.x;
            enemy.healthBar.y = enemy.y - 15;
            
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
        let nearest = null;
        let nearestDistance = tower.range;
        
        this.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                (enemy.x - tower.x) * (enemy.x - tower.x) + 
                (enemy.y - tower.y) * (enemy.y - tower.y)
            );
            if (distance < nearestDistance) {
                nearest = enemy;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }
    
    fireTower(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            speed: 200,
            damage: tower.damage,
            graphic: this.add.circle(tower.x, tower.y, 3, 0xffff00)
        };
        
        this.projectiles.push(projectile);
    }
    
    moveProjectiles(delta) {
        this.projectiles.forEach(projectile => {
            const direction = {
                x: projectile.targetX - projectile.x,
                y: projectile.targetY - projectile.y
            };
            const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            
            if (distance < 5) {
                projectile.toRemove = true;
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
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    (enemy.x - projectile.x) * (enemy.x - projectile.x) + 
                    (enemy.y - projectile.y) * (enemy.y - projectile.y)
                );
                
                if (distance < 15) {
                    enemy.health -= projectile.damage;
                    projectile.toRemove = true;
                    
                    this.showEnemyHealthBar(enemy);
                    
                    if (enemy.health <= 0) {
                        enemy.toRemove = true;
                        this.score += 10;
                        this.currency += 5;
                        this.scoreText.setText(`Punkte: ${this.score}`);
                        this.currencyText.setText(`Batzen: ${this.currency}`);
                    }
                }
            });
        });
    }
    
    removeDeadObjects() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.toRemove) {
                enemy.graphic.destroy();
                enemy.healthBarBg.destroy();
                enemy.healthBar.destroy();
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
            if (building.type === 'farm') {
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
    
    createFarmTimer(farm) {
        // Timer-Text wird direkt im Info-Panel integriert - kein separates Element nötig
        this.timerText = { isIntegrated: true };
    }
    
    updateFarmTimer(time) {
        if (this.selectedBuilding && this.selectedBuilding.type === 'farm' && this.timerText && this.infoPanel) {
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
            const baseText = `Farm\n+${farm.productionAmount} Batzen alle ${farm.productionRate / 1000} Sek\nHP: ${farm.health}/${farm.maxHealth}`;
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
                const rangeCircle = this.add.circle(clickedBuilding.x, clickedBuilding.y, clickedBuilding.range, 0xffff00, 0.2);
                rangeCircle.setStrokeStyle(2, 0xffff00, 0.6);
                clickedBuilding.rangeIndicator = rangeCircle;
            }
        } else {
            this.deselectBuilding();
        }
    }
    
    showBuildingInfo(building) {
        if (this.infoPanel) {
            this.infoPanel.destroy();
        }
        if (this.timerText && this.timerText.destroy) {
            this.timerText.destroy();
            this.timerText = null;
        }
        if (this.rotateButton) {
            this.rotateButton.destroy();
            this.rotateButton = null;
        }
        if (this.rotateButtonText) {
            this.rotateButtonText.destroy();
            this.rotateButtonText = null;
        }
        
        let infoText = '';
        if (building.type === 'tower') {
            infoText = `Turm\nReichweite: ${building.range}px\nSchaden: ${building.damage}\nHP: ${building.health}/${building.maxHealth}`;
        } else if (building.type === 'farm') {
            infoText = `Farm\n+${building.productionAmount} Batzen alle ${building.productionRate / 1000} Sek\nHP: ${building.health}/${building.maxHealth}`;
        } else if (building.type === 'factory') {
            infoText = `Fabrik\n(noch keine Funktion)\nHP: ${building.health}/${building.maxHealth}`;
        }
        
        // Für Farms erweitern wir den Text um Timer-Platz
        if (building.type === 'farm') {
            infoText += '\n\nTimer: Lade...';
        }
        
        // InfoPanel Container
        this.infoPanel = this.add.text(building.x + 50, building.y - 30, infoText, {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 8 }
        }).setOrigin(0, 0.5);
        
        // Add rotation button for non-tower buildings
        if (building.type !== 'tower') {
            const buttonY = this.infoPanel.y + this.infoPanel.height / 2 + 20;
            
            this.rotateButton = this.add.rectangle(building.x + 50, buttonY, 80, 25, 0x4a4a4a, 0.9);
            this.rotateButton.setStrokeStyle(1, 0x666666);
            this.rotateButton.setInteractive();
            this.rotateButton.setOrigin(0, 0.5);
            
            this.rotateButtonText = this.add.text(building.x + 90, buttonY, '🔄 Drehen', {
                fontSize: '10px',
                fill: '#fff'
            }).setOrigin(0.5, 0.5);
            
            this.rotateButton.on('pointerdown', () => {
                this.rotateBuilding(building);
                this.showBuildingInfo(building); // Refresh info panel
            });
            
            this.rotateButton.on('pointerover', () => {
                this.rotateButton.setFillStyle(0x5a5a5a);
            });
            
            this.rotateButton.on('pointerout', () => {
                this.rotateButton.setFillStyle(0x4a4a4a);
            });
        }
        
        if (building.type === 'farm') {
            this.createFarmTimer(building);
        }
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