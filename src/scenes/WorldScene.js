import Enemy from '../entities/Enemy.js';
import Tower from '../entities/Tower.js';
import Werfer from '../entities/Werfer.js';
import Farm from '../entities/Farm.js';
import Factory from '../entities/Factory.js';
import Mine from '../entities/Mine.js';
import InfoPanel from '../ui/InfoPanel.js';
import GridManager from '../utils/GridManager.js';
import WaveManager from '../utils/WaveManager.js';
import TerrainManager from '../utils/TerrainManager.js';
import PathfindingManager from '../utils/PathfindingManager.js';

export const LEFT_W = 220;
export const RIGHT_W = 220;

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
        
        // World properties (actual map size)
        this.worldWidth = 2000;  // Expanded world size
        this.worldHeight = 1500; // Expanded world size
        this.mapCenter = { x: this.worldWidth / 2, y: this.worldHeight / 2 };
        this.gridSize = 30;
        
        // Camera/Zoom properties
        this.maxZoom = 2.5;
        this.minZoom = 0.1; // Will be calculated dynamically
        
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
        
        // UI Components
        this.infoPanel = null;
    }
    
    preload() {
        this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        const gameW = this.scale.width;
        const gameH = this.scale.height;
        
        // Setup world camera viewport (center between left and right UI)
        this.cameras.main.setViewport(LEFT_W, 0, gameW - LEFT_W - RIGHT_W, gameH);
        this.worldCam = this.cameras.main;
        this.worldCam.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.worldCam.setRoundPixels(true);
        this.worldCam.setBackgroundColor(0x1c3a29);
        
        // Create world background
        this.createWorldBackground();
        
        // Initialize managers
        this.gridManager = new GridManager(this.worldWidth, this.worldHeight, this.gridSize);
        this.waveManager = new WaveManager();
        this.terrainManager = new TerrainManager(this, this.worldWidth, this.worldHeight, this.gridSize);
        this.pathfindingManager = new PathfindingManager(this.terrainManager, this.worldWidth, this.worldHeight, this.gridSize);
        
        // Initialize UI (InfoPanel for building selection)
        this.infoPanel = new InfoPanel(this);
        
        // Create town hall
        this.createTownHall();
        
        // Initialize first wave
        this.waveManager.enemiesInWave = this.waveManager.getWaveEnemyCount(this.waveManager.currentWave);
        this.updateHUD();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Setup UI event handlers
        this.setupUIEventHandlers();
        
        // Launch UI scenes
        this.scene.launch('ui-left');
        this.scene.launch('ui-right');
        this.scene.bringToTop('ui-left');
        this.scene.bringToTop('ui-right');
        
        // Setup zoom system
        this.recomputeMinZoom();
        this.worldCam.setZoom(this.minZoom * 1.2); // Slightly zoomed in from minimum
        this.initZoomInput();
        this.scale.on('resize', this.onResize, this);
        
        // Setup camera controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');
    }
    
    createWorldBackground() {
        // Create textured green background with grass pattern
        const graphics = this.add.graphics();
        
        // Base green background
        graphics.fillStyle(0x2d5c2b, 1.0);
        graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);
        
        // Add lighter green texture patches
        const patchSize = 60;
        const patches = Math.floor((this.worldWidth * this.worldHeight) / 6000); // Scale patches with world size
        
        for (let i = 0; i < patches; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            const size = patchSize + Math.random() * 30 - 15;
            
            const greenShades = [0x3a6b38, 0x2f5f2d, 0x426c40, 0x377d35];
            const color = greenShades[Math.floor(Math.random() * greenShades.length)];
            
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(x, y, size);
        }
        
        // Add subtle dirt patches
        for (let i = 0; i < patches / 4; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            const size = 20 + Math.random() * 15;
            
            graphics.fillStyle(0x6b4423, 0.4);
            graphics.fillCircle(x, y, size);
        }
        
        // Add small grass detail dots
        for (let i = 0; i < patches * 1.5; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            const size = 2 + Math.random() * 3;
            
            graphics.fillStyle(0x4a7c48, 0.8);
            graphics.fillCircle(x, y, size);
        }
        
        graphics.setDepth(-1000);
    }
    
    recomputeMinZoom() {
        // Calculate minimum zoom so world always fills viewport
        const vpW = this.worldCam.width;
        const vpH = this.worldCam.height;
        const zW = vpW / this.worldWidth;
        const zH = vpH / this.worldHeight;
        this.minZoom = Math.max(zW, zH);
    }
    
    clampCameraToBounds() {
        // Keep camera within world bounds
        const cam = this.worldCam;
        const halfW = cam.width * 0.5 / cam.zoom;
        const halfH = cam.height * 0.5 / cam.zoom;
        const minX = halfW;
        const maxX = this.worldWidth - halfW;
        const minY = halfH;
        const maxY = this.worldHeight - halfH;
        
        // Only clamp if we have valid bounds (maxX > minX, maxY > minY)
        if (maxX > minX && maxY > minY) {
            cam.centerOn(
                Phaser.Math.Clamp(cam.midPoint.x, minX, maxX),
                Phaser.Math.Clamp(cam.midPoint.y, minY, maxY)
            );
        }
    }
    
    initZoomInput() {
        const cam = this.worldCam;
        
        this.input.on('wheel', (_p, _go, _dx, dy) => {
            const factor = dy > 0 ? 0.9 : 1.1;
            
            // Remember world position under pointer before zoom
            const pointer = this.input.activePointer;
            const worldPoint = cam.getWorldPoint(pointer.x - LEFT_W, pointer.y); // Adjust for left UI
            const worldX = worldPoint.x;
            const worldY = worldPoint.y;
            
            const nextZoom = Phaser.Math.Clamp(
                cam.zoom * factor,
                this.minZoom,
                this.maxZoom
            );
            cam.setZoom(nextZoom);
            
            // After zoom: adjust camera so pointer stays on same world position
            const worldPoint2 = cam.getWorldPoint(pointer.x - LEFT_W, pointer.y);
            const worldX2 = worldPoint2.x;
            const worldY2 = worldPoint2.y;
            cam.scrollX += worldX - worldX2;
            cam.scrollY += worldY - worldY2;
            
            this.clampCameraToBounds();
        }, this);
    }
    
    onResize(gameSize) {
        const gameW = gameSize.width;
        const gameH = gameSize.height;
        
        // Update viewport
        this.worldCam.setViewport(LEFT_W, 0, gameW - LEFT_W - RIGHT_W, gameH);
        
        // Recompute min zoom and clamp current zoom
        this.recomputeMinZoom();
        this.worldCam.setZoom(
            Phaser.Math.Clamp(this.worldCam.zoom, this.minZoom, this.maxZoom)
        );
        this.clampCameraToBounds();
        
        // Notify UI scenes to update their viewports
        const uiL = this.scene.get('ui-left');
        const uiR = this.scene.get('ui-right');
        if (uiL) uiL.events.emit('ui:resize');
        if (uiR) uiR.events.emit('ui:resize');
    }
    
    setupUIEventHandlers() {
        // Events from UI scenes
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
    
    updateCameraMovement(delta) {
        const camera = this.worldCam;
        const speed = 400 / camera.zoom; // Speed inversely proportional to zoom
        const moveDistance = speed * (delta / 1000);
        
        let moved = false;
        
        // WASD and Arrow key movement
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            camera.scrollX -= moveDistance;
            moved = true;
        }
        if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            camera.scrollX += moveDistance;
            moved = true;
        }
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            camera.scrollY -= moveDistance;
            moved = true;
        }
        if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            camera.scrollY += moveDistance;
            moved = true;
        }
        
        if (moved) {
            this.clampCameraToBounds();
        }
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
        
        if (this.hoverRangeCircle) {
            this.hoverRangeCircle.destroy();
            this.hoverRangeCircle = null;
        }
    }
    
    handleClick(pointer) {
        // Convert screen coordinates to world coordinates
        const worldPoint = this.worldCam.getWorldPoint(pointer.x - LEFT_W, pointer.y);
        const worldX = worldPoint.x;
        const worldY = worldPoint.y;
        
        // Ignore clicks in UI areas
        if (pointer.x <= LEFT_W || pointer.x >= this.scale.width - RIGHT_W) return;
        
        if (this.selectedBuildingType && pointer.y > 100) {
            this.tryPlaceBuilding(worldX, worldY, this.selectedBuildingType);
        } else if (!this.selectedBuildingType && pointer.y > 100) {
            this.selectExistingBuilding(worldX, worldY);
        }
    }
    
    handleMouseMove(pointer) {
        // Convert screen coordinates to world coordinates
        const worldPoint = this.worldCam.getWorldPoint(pointer.x - LEFT_W, pointer.y);
        const worldX = worldPoint.x;
        const worldY = worldPoint.y;
        
        if (!this.selectedBuildingType || pointer.x <= LEFT_W || pointer.x >= this.scale.width - RIGHT_W) {
            // Clear building preview when outside game area
            if (this.hoverGraphic) {
                this.hoverGraphic.setVisible(false);
            }
            return;
        }
        
        if (pointer.y > 100) {
            this.showBuildingPreview(worldX, worldY, this.selectedBuildingType);
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
        
        // Building preview rectangle
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
            this.updateHUD();
            
            this.gridManager.occupyGridArea(gridPos.x, gridPos.y, dimensions.width, dimensions.height);
            
            this.createBuilding(type, worldPos.x, worldPos.y, gridPos, this.selectedBuildingRotation);
            
            if (this.hoverGraphic) {
                this.hoverGraphic.destroy();
                this.hoverGraphic = null;
            }
            
            this.selectedBuildingRotation = 0;
            // Notify UI scene to deselect
            const uiScene = this.scene.get('ui-right');
            if (uiScene && uiScene.buildingMenu) {
                uiScene.buildingMenu.deselectBuilding();
            }
            this.selectedBuildingType = null;
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
            // Show insufficient funds message
            return;
        }
        
        if (building.upgrade && building.upgrade()) {
            this.currency -= upgradeCost;
            this.updateHUD();
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
        this.updateHUD();
        
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
        this.updateHUD();
        // Notify UI scene
        const uiScene = this.scene.get('ui-right');
        if (uiScene && uiScene.buildingMenu) {
            uiScene.buildingMenu.updatePauseDisplay(this.isPaused);
        }
    }
    
    changeSpeed() {
        if (this.isPaused) return;
        
        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedLevels.length;
        this.gameSpeed = this.speedLevels[this.currentSpeedIndex];
        this.updateHUD();
        
        // Notify UI scene
        const uiScene = this.scene.get('ui-right');
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
            this.updateHUD();
            
            // Notify UI scene
            const uiScene = this.scene.get('ui-right');
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
    
    updateHUD() {
        // Emit events to update left HUD
        this.events.emit('hud:updateTownHall', this.townHallHealth, this.townHall ? this.townHall.maxHealth : 100);
        this.events.emit('hud:updateScore', this.score);
        this.events.emit('hud:updateCurrency', this.currency);
        this.events.emit('hud:updateSpeed', this.gameSpeed);
        this.events.emit('hud:updatePaused', this.isPaused);
        
        const waveInfo = this.waveManager.getCurrentWaveInfo();
        this.events.emit('hud:updateWave', waveInfo.wave);
        this.events.emit('hud:updateEnemies', waveInfo.remaining, waveInfo.total);
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
                x = Math.random() * this.worldWidth;
                y = -50;
                break;
            case 1: // Right  
                x = this.worldWidth + 50;
                y = Math.random() * this.worldHeight;
                break;
            case 2: // Bottom
                x = Math.random() * this.worldWidth;
                y = this.worldHeight + 50;
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * this.worldHeight;
                break;
        }
        
        return { x, y };
    }
    
    update(time, delta) {
        // Camera movement (works even when paused)
        this.updateCameraMovement(delta);
        
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
        
        // Update info panel timer for farms/mines
        this.infoPanel.updateFarmTimer(time, this.gameSpeed);
        
        // Check for wave completion
        if (this.waveManager.isWaveComplete(this.enemies.length)) {
            this.waveManager.startNextWave();
            this.updateHUD();
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
            this.updateHUD();
        }
    }
    
    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            const result = enemy.update(delta, this.townHall, this.gameSpeed, this.terrainManager, this.pathfindingManager);
            if (result.hitTownHall) {
                this.townHallHealth -= result.damage;
                this.updateHUD();
                
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
                    this.updateHUD();
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
                    let hitChance = 1.0;
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
                            this.updateHUD();
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
        this.events.emit('hud:gameOver', this.score);
        this.scene.pause();
    }
}