class TowerDefenseGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerDefenseGame' });
        
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.townHallHealth = 100;
        this.score = 0;
        this.currency = 50;
        
        this.mapCenter = { x: 600, y: 400 };
        this.mapWidth = 1200;
        this.mapHeight = 800;
        
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
        
        this.selectedBuildingType = null;
        this.hoverGraphic = null;
        this.buildingTypes = {
            tower: { cost: 10, name: 'Turm', symbol: '🏯' },
            farm: { cost: 10, name: 'Feld', symbol: '🌾' },
            factory: { cost: 10, name: 'Fabrik', symbol: '🏭' }
        };
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
        this.createInitialTower();
        
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer);
        });
        
        this.input.on('pointermove', (pointer) => {
            this.handleMouseMove(pointer);
        });
    }
    
    createTownHall() {
        this.townHall = {
            x: this.mapCenter.x,
            y: this.mapCenter.y,
            health: this.townHallHealth,
            maxHealth: this.townHallHealth,
            radius: 40
        };
        
        const townHallGraphic = this.add.circle(this.mapCenter.x, this.mapCenter.y, 40, 0x8b4513);
        townHallGraphic.setStrokeStyle(4, 0x654321);
        
        this.add.text(this.mapCenter.x, this.mapCenter.y - 5, '👑', { 
            fontSize: '32px' 
        }).setOrigin(0.5);
        
        const healthBarBg = this.add.rectangle(this.mapCenter.x, this.mapCenter.y - 60, 80, 8, 0x666666);
        this.townHallHealthBar = this.add.rectangle(this.mapCenter.x, this.mapCenter.y - 60, 80, 8, 0x00ff00);
    }
    
    createBuildingMenu() {
        const menuX = this.mapWidth - 200;
        const menuY = 20;
        
        const menuBg = this.add.rectangle(menuX + 100, menuY + 120, 180, 220, 0x333333, 0.9);
        menuBg.setStrokeStyle(2, 0x666666);
        
        this.add.text(menuX + 100, menuY + 30, 'Gebäude', { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        let yOffset = 0;
        Object.keys(this.buildingTypes).forEach((type, index) => {
            const building = this.buildingTypes[type];
            const buttonY = menuY + 70 + (yOffset * 50);
            
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
    
    createInitialTower() {
        this.placeTowerFree(this.mapCenter.x - 100, this.mapCenter.y - 100);
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
    
    handleClick(pointer) {
        if (pointer.x > this.mapWidth - 200) return;
        
        if (this.selectedBuildingType && pointer.y > 100) {
            this.tryPlaceBuilding(pointer.x, pointer.y, this.selectedBuildingType);
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
        const canAfford = this.currency >= building.cost;
        const color = canAfford ? 0x00ff00 : 0xff0000;
        const alpha = 0.5;
        
        if (type === 'tower') {
            this.hoverGraphic = this.add.circle(x, y, 15, color, alpha);
            this.hoverGraphic.setStrokeStyle(2, color, 0.8);
        } else if (type === 'farm') {
            this.hoverGraphic = this.add.rectangle(x, y, 30, 30, color, alpha);
            this.hoverGraphic.setStrokeStyle(2, color, 0.8);
        } else if (type === 'factory') {
            this.hoverGraphic = this.add.rectangle(x, y, 40, 25, color, alpha);
            this.hoverGraphic.setStrokeStyle(2, color, 0.8);
        }
    }
    
    tryPlaceBuilding(x, y, type) {
        const building = this.buildingTypes[type];
        if (this.currency >= building.cost) {
            this.currency -= building.cost;
            this.currencyText.setText(`Batzen: ${this.currency}`);
            
            if (type === 'tower') {
                this.placeTowerFree(x, y);
            } else if (type === 'farm') {
                this.placeFarm(x, y);
            } else if (type === 'factory') {
                this.placeFactory(x, y);
            }
            
            if (this.hoverGraphic) {
                this.hoverGraphic.destroy();
                this.hoverGraphic = null;
            }
        } else {
            this.showInsufficientFundsMessage();
        }
    }
    
    placeFarm(x, y) {
        const farmGraphic = this.add.rectangle(x, y, 30, 30, 0x8b4513);
        farmGraphic.setStrokeStyle(2, 0x654321);
        
        this.add.text(x, y, '🌾', { fontSize: '20px' }).setOrigin(0.5);
    }
    
    placeFactory(x, y) {
        const factoryGraphic = this.add.rectangle(x, y, 40, 25, 0x666666);
        factoryGraphic.setStrokeStyle(2, 0x444444);
        
        this.add.text(x, y, '🏭', { fontSize: '18px' }).setOrigin(0.5);
    }
    
    
    placeTowerFree(x, y) {
        const tower = {
            x: x,
            y: y,
            range: 120,
            damage: 25,
            fireRate: 1000,
            lastFired: 0,
            graphic: this.add.circle(x, y, 15, 0x00ff00)
        };
        
        const rangeCircle = this.add.circle(x, y, tower.range, 0x00ff00, 0.1);
        rangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        
        this.towers.push(tower);
    }
    
    update(time, delta) {
        this.spawnEnemies(time);
        this.moveEnemies(delta);
        this.updateTowers(time);
        this.moveProjectiles(delta);
        this.checkCollisions();
        this.removeDeadObjects();
        
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
            healthBar: this.add.rectangle(spawnPoint.x, spawnPoint.y - 15, 20, 4, 0x00ff00)
        };
        
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
            enemy.healthBar.x = enemy.x;
            enemy.healthBar.y = enemy.y - 15;
            
            enemy.healthBar.scaleX = enemy.health / enemy.maxHealth;
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