class TowerDefenseGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerDefenseGame' });
        
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.lives = 3;
        this.score = 0;
        this.currency = 50;
        
        this.path = [
            { x: -50, y: 300 },
            { x: 850, y: 300 }
        ];
        
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
    }
    
    preload() {
        this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    create() {
        this.add.text(10, 10, 'Tower Defense', { fontSize: '24px', fill: '#fff' });
        this.livesText = this.add.text(10, 40, `Leben: ${this.lives}`, { fontSize: '18px', fill: '#fff' });
        this.scoreText = this.add.text(10, 65, `Punkte: ${this.score}`, { fontSize: '18px', fill: '#fff' });
        this.currencyText = this.add.text(10, 90, `Batzen: ${this.currency}`, { fontSize: '18px', fill: '#ffd700' });
        this.add.text(200, 40, 'Tower: 10 Batzen', { fontSize: '14px', fill: '#aaa' });
        
        this.drawPath();
        this.createInitialTower();
        
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > 100) {
                this.tryPlaceTower(pointer.x, pointer.y);
            }
        });
    }
    
    drawPath() {
        const graphics = this.add.graphics();
        graphics.lineStyle(20, 0x666666);
        graphics.beginPath();
        graphics.moveTo(this.path[0].x, this.path[0].y);
        graphics.lineTo(this.path[1].x, this.path[1].y);
        graphics.strokePath();
    }
    
    createInitialTower() {
        this.placeTowerFree(400, 200);
    }
    
    tryPlaceTower(x, y) {
        const towerCost = 10;
        if (this.currency >= towerCost) {
            this.currency -= towerCost;
            this.currencyText.setText(`Batzen: ${this.currency}`);
            this.placeTowerFree(x, y);
        } else {
            this.showInsufficientFundsMessage();
        }
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
        
        if (this.lives <= 0) {
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
        const enemy = {
            x: this.path[0].x,
            y: this.path[0].y,
            health: 50,
            maxHealth: 50,
            speed: 50,
            graphic: this.add.rectangle(this.path[0].x, this.path[0].y, 20, 20, 0xff0000),
            healthBar: this.add.rectangle(this.path[0].x, this.path[0].y - 15, 20, 4, 0x00ff00)
        };
        
        this.enemies.push(enemy);
    }
    
    moveEnemies(delta) {
        this.enemies.forEach(enemy => {
            const direction = {
                x: this.path[1].x - this.path[0].x,
                y: this.path[1].y - this.path[0].y
            };
            const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= distance;
            direction.y /= distance;
            
            enemy.x += direction.x * enemy.speed * (delta / 1000);
            enemy.y += direction.y * enemy.speed * (delta / 1000);
            
            enemy.graphic.x = enemy.x;
            enemy.graphic.y = enemy.y;
            enemy.healthBar.x = enemy.x;
            enemy.healthBar.y = enemy.y - 15;
            
            enemy.healthBar.scaleX = enemy.health / enemy.maxHealth;
            
            if (enemy.x > 850) {
                this.lives--;
                this.livesText.setText(`Leben: ${this.lives}`);
                enemy.toRemove = true;
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
        this.add.text(400, 300, 'GAME OVER', { 
            fontSize: '48px', 
            fill: '#ff0000',
            originX: 0.5,
            originY: 0.5
        }).setOrigin(0.5);
        
        this.add.text(400, 350, `Endpunktzahl: ${this.score}`, { 
            fontSize: '24px', 
            fill: '#fff',
            originX: 0.5,
            originY: 0.5
        }).setOrigin(0.5);
        
        this.add.text(400, 400, 'F5 zum Neustarten', { 
            fontSize: '18px', 
            fill: '#aaa',
            originX: 0.5,
            originY: 0.5
        }).setOrigin(0.5);
        
        this.scene.pause();
    }
    
    showInsufficientFundsMessage() {
        const message = this.add.text(400, 150, 'Nicht genug Batzen!', {
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
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2c5f3f',
    scene: TowerDefenseGame,
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);