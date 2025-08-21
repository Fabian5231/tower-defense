import Enemy from '../entities/Enemy.js';
import Tower from '../entities/Tower.js';
import Werfer from '../entities/Werfer.js';
import Farm from '../entities/Farm.js';
import Factory from '../entities/Factory.js';
import Mine from '../entities/Mine.js';
import HUD from '../ui/HUD.js';
import InfoPanel from '../ui/InfoPanel.js';
import GridManager from '../utils/GridManager.js';
import WaveManager from '../utils/WaveManager.js';
import TerrainManager from '../utils/TerrainManager.js';
import PathfindingManager from '../utils/PathfindingManager.js';

const SIDEBAR_W = 220;

export default class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'world' });
        
        // Game objects
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.buildings = [];
        this.townHall = null;
        
        // Game state
        this.townHallHealth = 100;
        this.score = 0;
        this.currency = 60;
        this.gameSpeed = 1.0;
        this.isPaused = false;
        this.speedLevels = [0.5, 1.0, 2.0, 3.0];
        this.currentSpeedIndex = 1;
        
        // Map properties (adjusted for sidebar)
        this.mapCenter = { x: 490, y: 360 }; // Adjusted for smaller world area
        this.mapWidth = 980; // 1200 - 220 sidebar
        this.mapHeight = 720;
        this.gridSize = 30;
        
        // Building state
        this.selectedBuildingType = null;
        this.selectedBuilding = null;
        this.selectedBuildingRotation = 0;
        this.hoverGraphic = null;
        this.hoverRangeCircle = null;
        this.towerRangeCircles = [];
        
        // Managers
        this.gridManager = null;
        this.waveManager = null;
        this.terrainManager = null;
        this.pathfindingManager = null;
        
        // UI Components (HUD stays in world, BuildingMenu moves to UI scene)
        this.hud = null;
        this.infoPanel = null;
    }
    
    preload() {
        this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        // Set viewport for world area (left side, excluding sidebar)
        this.cameras.main.setViewport(0, 0, w - SIDEBAR_W, h);
        
        // Initialize managers
        this.gridManager = new GridManager(this.mapWidth, this.mapHeight, this.gridSize);
        this.waveManager = new WaveManager();
        this.terrainManager = new TerrainManager(this, this.mapWidth, this.mapHeight, this.gridSize);
        this.pathfindingManager = new PathfindingManager(this.terrainManager, this.mapWidth, this.mapHeight, this.gridSize);
        
        // Initialize UI (HUD stays in world scene)
        this.hud = new HUD(this);
        this.infoPanel = new InfoPanel(this);
        
        // Create town hall
        this.createTownHall();
        
        // Initialize first wave
        this.waveManager.enemiesInWave = this.waveManager.getWaveEnemyCount(this.waveManager.currentWave);
        this.updateWaveUI();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Setup UI event handlers
        this.setupUIEventHandlers();
        
        // Launch and setup UI scene
        this.scene.launch('ui');
        this.scene.bringToTop('ui');
    }
    
    setupUIEventHandlers() {
        // Events from UI scene
        this.events.on('ui:select', (type) => {
            this.selectBuilding(type);
        });
        
        this.events.on('ui:grid', (show) => {
            this.toggleGrid(show);
        });
        
        this.events.on('ui:pause', () => {
            this.togglePause();
        });
        
        this.events.on('ui:speed', () => {
            this.changeSpeed();
        });
    }
    
    setupInputHandlers() {
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer);
        });
        
        this.input.on('pointermove', (pointer) => {
            this.handleMouseMove(pointer);
        });
        
        // Keyboard shortcuts
        this.input.keyboard.on('keydown-R', () => {
            if (this.selectedBuildingType) {
                this.selectedBuildingRotation = (this.selectedBuildingRotation + 90) % 360;
            }
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.togglePause();
        });
        
        this.input.keyboard.on('keydown-ONE', () => {
            this.setSpeed(0.5);
        });
        
        this.input.keyboard.on('keydown-TWO', () => {
            this.setSpeed(1.0);
        });
        
        this.input.keyboard.on('keydown-THREE', () => {
            this.setSpeed(2.0);
        });
        
        this.input.keyboard.on('keydown-FOUR', () => {
            this.setSpeed(3.0);
        });
    }
    
    createTownHall() {
        const centerGridPos = this.gridManager.worldToGrid(this.mapCenter.x, this.mapCenter.y);
        const townHallGridX = centerGridPos.x - 1;
        const townHallGridY = centerGridPos.y - 1;
        const townHallWorldPos = this.gridManager.gridToWorld(townHallGridX + 1, townHallGridY + 1);
        
        this.gridManager.occupyGridArea(townHallGridX, townHallGridY, 3, 3);
        
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
        
        // Create town hall graphics
        const townHallGraphic = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y, townHallSize, townHallSize, 0xd4af37);
        townHallGraphic.setStrokeStyle(4, 0xb8860b);
        
        const innerRect = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y, townHallSize - 8, townHallSize - 8, 0xffd700);
        innerRect.setStrokeStyle(2, 0xdaa520);
        
        // Crown symbol with shadow
        this.add.text(townHallWorldPos.x + 1, townHallWorldPos.y - 4, '👑', { 
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);
        
        this.add.text(townHallWorldPos.x, townHallWorldPos.y - 5, '👑', { 
            fontSize: '32px' 
        }).setOrigin(0.5);
        
        // Health bars
        this.townHallHealthBarBg = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize + 2, 10, 0x666666);
        this.townHallHealthBar = this.add.rectangle(townHallWorldPos.x, townHallWorldPos.y - townHallSize/2 - 15, townHallSize, 8, 0x00ff00);
        
        this.townHallHealthBarBg.setVisible(false);
        this.townHallHealthBar.setVisible(false);
    }
    
    selectBuilding(type) {
        this.selectedBuildingType = type;
        this.deselectCurrentBuilding();
        
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
            this.hoverGraphic = null;
        }
        
        // Clear range preview when deselecting
        if (type === null && this.hoverRangeCircle) {
            this.hoverRangeCircle.destroy();
            this.hoverRangeCircle = null;
        }
    }
    
    deselectCurrentBuilding() {
        if (this.selectedBuilding) {
            this.clearAllTowerRanges();
            this.selectedBuilding = null;
        }
        this.infoPanel.clear();
        
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
            this.hoverGraphic = null;
        }
        
        // Clear range preview
        if (this.hoverRangeCircle) {
            this.hoverRangeCircle.destroy();
            this.hoverRangeCircle = null;
        }
    }
    
    handleClick(pointer) {
        if (pointer.x > this.mapWidth) return; // Ignore clicks in sidebar area
        
        if (this.selectedBuildingType && pointer.y > 100) {
            this.tryPlaceBuilding(pointer.x, pointer.y, this.selectedBuildingType);
        } else if (!this.selectedBuildingType && pointer.y > 100) {
            this.selectExistingBuilding(pointer.x, pointer.y);
        }
    }
    
    handleMouseMove(pointer) {
        if (!this.selectedBuildingType || pointer.x > this.mapWidth) {
            // Clear building preview when outside game area
            if (this.hoverGraphic) {
                this.hoverGraphic.setVisible(false);
            }
            return;
        }
        
        if (pointer.y > 100) {
            this.showBuildingPreview(pointer.x, pointer.y, this.selectedBuildingType);
        } else {
            // Clear preview when in UI area
            if (this.hoverGraphic) {
                this.hoverGraphic.setVisible(false);
            }
        }
    }
    
    showBuildingPreview(x, y, type) {
        if (this.hoverGraphic) {
            this.hoverGraphic.destroy();
        }
        
        const building = this.getBuildingTypeInfo(type);
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.gridManager.worldToGrid(x, y);
        const worldPos = this.gridManager.gridToWorldForBuilding(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        
        const canAfford = this.currency >= building.cost;
        const canPlaceGrid = this.gridManager.isGridAreaFree(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const canPlaceTerrain = this.checkTerrainForBuilding(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const canPlace = canPlaceGrid && canPlaceTerrain;
        const color = canAfford && canPlace ? 0x00ff00 : 0xff0000;
        const alpha = 0.5;
        
        const displayWidth = dimensions.width * this.gridSize;
        const displayHeight = dimensions.height * this.gridSize;
        
        // Building-Preview Rectangle
        this.hoverGraphic = this.add.rectangle(worldPos.x, worldPos.y, displayWidth, displayHeight, color, alpha);
        this.hoverGraphic.setStrokeStyle(2, color, 0.8);
        
        // Range preview for towers
        if (building.range) {
            if (this.hoverRangeCircle) {
                this.hoverRangeCircle.destroy();
            }
            this.hoverRangeCircle = this.add.circle(worldPos.x, worldPos.y, building.range, 0x00ff00, 0.1);
            this.hoverRangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        }
    }
    
    getBuildingTypeInfo(type) {
        const buildingTypes = {
            tower: { cost: 10, range: 80 },
            werfer: { cost: 50, range: 200 },
            farm: { cost: 10 },
            factory: { cost: 10 },
            mine: { cost: 30 }
        };
        return buildingTypes[type];
    }
    
    tryPlaceBuilding(x, y, type) {
        const building = this.getBuildingTypeInfo(type);
        const dimensions = this.getRotatedDimensions(type, this.selectedBuildingRotation);
        const gridPos = this.gridManager.worldToGrid(x, y);
        const worldPos = this.gridManager.gridToWorldForBuilding(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        
        const canAfford = this.currency >= building.cost;
        const canPlaceGrid = this.gridManager.isGridAreaFree(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const canPlaceTerrain = this.checkTerrainForBuilding(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
        const canPlace = canPlaceGrid && canPlaceTerrain;
        
        if (canAfford && canPlace) {
            this.currency -= building.cost;
            this.hud.updateCurrency(this.currency);
            
            this.gridManager.occupyGridArea(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
            
            this.createBuilding(type, worldPos.x, worldPos.y, gridPos, this.selectedBuildingRotation);
            
            if (this.hoverGraphic) {
                this.hoverGraphic.destroy();
                this.hoverGraphic = null;
            }
            
            this.selectedBuildingRotation = 0;
            // Notify UI scene to deselect
            const uiScene = this.scene.get('ui');
            if (uiScene && uiScene.buildingMenu) {
                uiScene.buildingMenu.deselectBuilding();
            }
            this.selectedBuildingType = null;
        } else if (!canAfford) {
            this.hud.showInsufficientFundsMessage();
        }
    }
    
    createBuilding(type, x, y, gridPos, rotation) {
        let newBuilding = null;
        
        switch (type) {
            case 'tower':
                newBuilding = new Tower(this, x, y, gridPos, rotation);
                this.towers.push(newBuilding);
                break;
            case 'werfer':
                newBuilding = new Werfer(this, x, y, gridPos, rotation);
                this.towers.push(newBuilding);
                break;
            case 'farm':
                newBuilding = new Farm(this, x, y, gridPos, rotation);
                break;
            case 'factory':
                newBuilding = new Factory(this, x, y, gridPos, rotation);
                break;
            case 'mine':
                newBuilding = new Mine(this, x, y, gridPos, rotation);
                break;
        }
        
        if (newBuilding) {
            this.buildings.push(newBuilding);
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
                this.deselectCurrentBuilding();
            }
            
            this.selectedBuilding = clickedBuilding;
            this.infoPanel.show(
                clickedBuilding, 
                (building) => this.upgradeBuilding(building),
                (building) => this.rotateBuilding(building),
                (building) => this.destroyBuilding(building)
            );
            
            if (clickedBuilding.type === 'tower' || clickedBuilding.type === 'werfer') {
                this.showAllTowerRanges();
            }
        } else {
            this.deselectCurrentBuilding();
        }
    }
    
    upgradeBuilding(building) {
        const upgradeCost = this.getUpgradeCost(building.type, building.level);
        if (this.currency < upgradeCost) {
            this.hud.showInsufficientFundsMessage();
            return;
        }
        
        if (building.upgrade && building.upgrade()) {
            this.currency -= upgradeCost;
            this.hud.updateCurrency(this.currency);
            this.infoPanel.show(
                building, 
                (b) => this.upgradeBuilding(b),
                (b) => this.rotateBuilding(b),
                (b) => this.destroyBuilding(b)
            );
        }
    }
    
    rotateBuilding(building) {
        if (building.type === 'tower') return;
        
        const rotationData = building.rotate();
        const oldDimensions = rotationData.currentDimensions;
        const newDimensions = rotationData.newDimensions;
        
        // Free old grid space
        this.gridManager.freeGridArea(building.gridX, building.gridY, oldDimensions.width, oldDimensions.height);
        
        // Check if new rotation fits
        if (this.gridManager.isGridAreaFree(building.gridX, building.gridY, newDimensions.width, newDimensions.height)) {
            // Occupy new grid space
            this.gridManager.occupyGridArea(building.gridX, building.gridY, newDimensions.width, newDimensions.height);
            
            // Calculate new world position
            const newWorldPos = this.gridManager.gridToWorldForBuilding(
                building.gridX,
                building.gridY,
                newDimensions.width,
                newDimensions.height
            );
            
            // Apply rotation to building
            building.applyRotation(rotationData.newRotation, newDimensions, newWorldPos);
        } else {
            // Re-occupy old space if rotation failed
            this.gridManager.occupyGridArea(building.gridX, building.gridY, oldDimensions.width, oldDimensions.height);
        }
    }
    
    getRotatedDimensions(buildingType, rotation) {
        const building = this.getBuildingTypeInfo(buildingType);
        const dimensions = {
            tower: { width: 1, height: 1 },
            werfer: { width: 1, height: 1 },
            farm: { width: 1, height: 2 },
            factory: { width: 2, height: 1 },
            mine: { width: 1, height: 1 }
        };
        
        const base = dimensions[buildingType];
        if (rotation === 90 || rotation === 270) {
            return { width: base.height, height: base.width };
        }
        return { width: base.width, height: base.height };
    }
    
    getUpgradeCost(buildingType, currentLevel) {
        const baseCosts = {
            tower: 10,
            werfer: 50,
            farm: 10,
            factory: 10,
            mine: 30
        };
        const baseCost = baseCosts[buildingType];
        return Math.floor(baseCost * (currentLevel + 1) * 1.5);
    }
    
    destroyBuilding(building) {
        // Refund 50% of the building's total investment
        const buildingCost = this.getBuildingTypeInfo(building.type).cost;
        let totalInvestment = buildingCost;
        
        // Add upgrade costs
        for (let i = 1; i < building.level; i++) {
            totalInvestment += this.getUpgradeCost(building.type, i);
        }
        
        const refund = Math.floor(totalInvestment * 0.5);
        this.currency += refund;
        this.hud.updateCurrency(this.currency);
        
        // Show refund animation
        const refundText = this.add.text(building.x, building.y - 40, `+${refund}B`, {
            fontSize: '14px',
            fill: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: refundText,
            y: building.y - 60,
            alpha: 0,
            duration: 1500,
            onComplete: () => refundText.destroy()
        });
        
        // Free grid space
        this.gridManager.freeGridArea(building.gridX, building.gridY, building.gridWidth, building.gridHeight);
        
        // Remove from towers array if it's a combat building
        if (building.type === 'tower' || building.type === 'werfer') {
            this.towers = this.towers.filter(tower => tower !== building);
        }
        
        // Mark building for removal
        building.toRemove = true;
        
        // Close info panel
        this.deselectCurrentBuilding();
    }
    
    toggleGrid(showGrid) {
        this.gridManager.toggleGrid(this);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        // Notify UI scene
        const uiScene = this.scene.get('ui');
        if (uiScene && uiScene.buildingMenu) {
            uiScene.buildingMenu.updatePauseDisplay(this.isPaused);
        }
    }
    
    changeSpeed() {
        if (this.isPaused) return;
        
        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedLevels.length;
        this.gameSpeed = this.speedLevels[this.currentSpeedIndex];
        
        // Notify UI scene
        const uiScene = this.scene.get('ui');
        if (uiScene && uiScene.buildingMenu) {
            uiScene.buildingMenu.updateSpeedDisplay(this.gameSpeed);
        }
        
        this.physics.world.timeScale = this.gameSpeed;
    }
    
    setSpeed(speed) {
        if (this.isPaused) return;
        
        const speedIndex = this.speedLevels.indexOf(speed);
        if (speedIndex !== -1) {
            this.currentSpeedIndex = speedIndex;
            this.gameSpeed = speed;
            
            // Notify UI scene
            const uiScene = this.scene.get('ui');
            if (uiScene && uiScene.buildingMenu) {
                uiScene.buildingMenu.updateSpeedDisplay(this.gameSpeed);
            }
            
            this.physics.world.timeScale = this.gameSpeed;
        }
    }
    
    showAllTowerRanges() {
        this.clearAllTowerRanges();
        
        this.towers.forEach(tower => {
            const rangeCircle = tower.showRange();
            this.towerRangeCircles.push(rangeCircle);
        });
    }
    
    clearAllTowerRanges() {
        this.towerRangeCircles.forEach(circle => {
            if (circle) circle.destroy();
        });
        this.towerRangeCircles = [];
        
        this.towers.forEach(tower => {
            tower.hideRange();
        });
    }
    
    updateWaveUI() {
        const waveInfo = this.waveManager.getCurrentWaveInfo();
        this.hud.updateWave(waveInfo.wave);
        this.hud.updateEnemyCount(waveInfo.remaining, waveInfo.total);
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
            
            // Check if any positions are adjacent
            let isAdjacent = false;
            buildingGridPositions.forEach(pos1 => {
                otherGridPositions.forEach(pos2 => {
                    const dx = Math.abs(pos1.x - pos2.x);
                    const dy = Math.abs(pos1.y - pos2.y);
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
            } else if (building.type === 'mine') {
                building.suppliesFactory = false;
            } else if (building.type === 'factory') {
                building.clearSupplyChain();
            }
        });
        
        // Update factory supply chains
        this.buildings.forEach(building => {
            if (building.type === 'factory') {
                const adjacent = this.getAdjacentBuildings(building);
                const suppliers = adjacent.filter(adj => adj.type === 'farm' || adj.type === 'mine');
                building.updateSupplyChain(suppliers);
            }
        });
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
    
    update(time, delta) {
        if (this.isPaused) return;
        
        const scaledDelta = delta * this.gameSpeed;
        
        this.spawnEnemies(time);
        this.updateEnemies(scaledDelta);
        this.updateTowers(time);
        this.updateSupplyChains();
        this.updateBuildings(time);
        this.updateProjectiles(scaledDelta);
        this.removeDeadObjects();
        this.removeDeadBuildings();
        
        // Update info panel timer for farms
        this.infoPanel.updateFarmTimer(time, this.gameSpeed);
        
        // Check for wave completion
        if (this.waveManager.isWaveComplete(this.enemies.length)) {
            this.waveManager.startNextWave();
            this.updateWaveUI();
        }
        
        if (this.townHallHealth <= 0) {
            this.gameOver();
        }
    }
    
    spawnEnemies(time) {
        if (this.waveManager.canSpawnEnemy(time, this.gameSpeed)) {
            const spawnPoint = this.getRandomSpawnPoint();
            const enemyConfig = this.waveManager.getEnemyConfig();
            
            const enemy = new Enemy(this, spawnPoint.x, spawnPoint.y, enemyConfig);
            this.enemies.push(enemy);
            
            this.waveManager.spawnEnemy(time);
            this.updateWaveUI();
        }
    }
    
    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            const result = enemy.update(delta, this.townHall, this.gameSpeed, this.terrainManager, this.pathfindingManager);
            if (result.hitTownHall) {
                this.townHallHealth -= result.damage;
                this.hud.updateTownHallHealth(this.townHallHealth);
                
                if (!this.townHallHealthBar.visible) {
                    this.townHallHealthBarBg.setVisible(true);
                    this.townHallHealthBar.setVisible(true);
                }
                this.townHallHealthBar.scaleX = this.townHallHealth / this.townHall.maxHealth;
            }
        });
    }
    
    updateTowers(time) {
        this.towers.forEach(tower => {
            const projectile = tower.update(time, this.enemies, this.gameSpeed);
            if (projectile) {
                projectile.toRemove = false;
                this.projectiles.push(projectile);
            }
        });
    }
    
    updateBuildings(time) {
        this.buildings.forEach(building => {
            if (building.type === 'farm' || building.type === 'factory' || building.type === 'mine') {
                const goldEarned = building.update(time, this.gameSpeed);
                if (goldEarned) {
                    this.currency += goldEarned;
                    this.hud.updateCurrency(this.currency);
                }
            }
        });
    }
    
    updateProjectiles(delta) {
        this.projectiles.forEach(projectile => {
            if (projectile.target && !projectile.target.toRemove) {
                projectile.targetX = projectile.target.x;
                projectile.targetY = projectile.target.y;
            }
            
            const direction = {
                x: projectile.targetX - projectile.x,
                y: projectile.targetY - projectile.y
            };
            const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            
            if (distance < 8) {
                projectile.toRemove = true;
                
                if (projectile.target && !projectile.target.toRemove) {
                    // Check terrain-based accuracy modifier
                    let hitChance = 1.0; // 100% hit chance by default
                    if (this.terrainManager) {
                        const targetGridX = Math.floor(projectile.target.x / this.gridSize);
                        const targetGridY = Math.floor(projectile.target.y / this.gridSize);
                        hitChance = this.terrainManager.getAccuracyModifier(targetGridX, targetGridY);
                    }
                    
                    // Roll for hit based on terrain
                    if (Math.random() <= hitChance) {
                        const result = projectile.target.takeDamage(projectile.damage);
                        
                        if (result.killed) {
                            this.score += result.score;
                            this.currency += result.gold;
                            this.hud.updateScore(this.score);
                            this.hud.updateCurrency(this.currency);
                        }
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
    
    removeDeadObjects() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.toRemove) {
                enemy.destroy();
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
    
    removeDeadBuildings() {
        this.buildings = this.buildings.filter(building => {
            if (building.toRemove) {
                building.destroy();
                
                if (building.gridX !== undefined && building.gridY !== undefined) {
                    this.gridManager.freeGridArea(building.gridX, building.gridY, building.gridWidth, building.gridHeight);
                }
                
                if (building.type === 'tower') {
                    this.towers = this.towers.filter(tower => tower !== building);
                }
                
                return false;
            }
            return true;
        });
    }
    
    checkTerrainForBuilding(gridX, gridY, width, height) {
        // Check if all cells in the building area are suitable for construction
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (!this.terrainManager.canPlaceBuildingAt(x, y)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    gameOver() {
        this.hud.showGameOver(this.score);
        this.scene.pause();
    }
}