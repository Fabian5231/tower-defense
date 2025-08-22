export default class Werfer {
    constructor(scene, x, y, gridPos, rotation = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.gridX = gridPos.x;
        this.gridY = gridPos.y;
        this.gridWidth = 1;
        this.gridHeight = 1;
        this.rotation = rotation;

        // Werfer Level
        this.level = 1;
        this.type = "werfer";

        // Level-basierte Stats definieren (erhöhter Schaden und extreme Reichweite)
        this.levelStats = {
            1: { damage: 100, range: 300, health: 100 }, // EXTREME Range & erhöhter Schaden
            2: { damage: 150, range: 370, health: 140 },
            3: { damage: 200, range: 440, health: 180 },
            4: { damage: 260, range: 520, health: 230 },
            5: { damage: 330, range: 600, health: 280 }
        };

        // Langsamere Fire-Rate als Tower (da stärker)
        this.fireRate = 800; // ms (langsamer als Tower mit 300ms)
        this.lastFired = 0;

        // Flags
        this.toRemove = false;

        // Stats initial anwenden
        this.applyLevelStats();

        this.createGraphics();
    }

    /**
     * Wendet die Stats des aktuellen Levels an
     */
    applyLevelStats() {
        const stats = this.levelStats[this.level];
        this.damage = stats.damage;
        this.range = stats.range;
        this.maxHealth = stats.health;
        this.health = this.maxHealth;
    }

    createGraphics() {
        const displaySize = 30; // gridSize

        // Main werfer graphic (dunkler als Tower)
        this.graphic = this.scene.add.rectangle(
            this.x,
            this.y,
            displaySize,
            displaySize,
            0x8B0000 // Dunkles Rot für Werfer
        );
        this.graphic.setStrokeStyle(2, 0x660000); // Noch dunklerer Rand

        // Werfer-Symbol
        this.symbol = this.scene.add.text(this.x, this.y, '💥', { 
            fontSize: '16px' 
        }).setOrigin(0.5);

        // Health bars
        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y - displaySize / 2 - 10,
            displaySize + 2,
            6,
            0x666666
        );
        this.healthBar = this.scene.add.rectangle(
            this.x,
            this.y - displaySize / 2 - 10,
            displaySize,
            4,
            0x00ff00
        );

        // Hide health bars initially
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
    }

    update(time, enemies, gameSpeed = 1) {
        const effectiveFireRate = this.fireRate / (gameSpeed > 0 ? gameSpeed : 1);

        if (time - this.lastFired >= effectiveFireRate) {
            const target = this.findBestTarget(enemies);
            if (target) {
                const projectile = this.fireWithPrediction(target, gameSpeed);
                this.lastFired = time;
                return projectile;
            }
        }

        return null;
    }

    findBestTarget(enemies) {
        let bestTarget = null;
        let shortestDistanceToTownHall = Infinity;

        enemies.forEach((enemy) => {
            // Check if enemy is in range
            const distanceToWerfer = Math.sqrt(
                (enemy.x - this.x) * (enemy.x - this.x) +
                    (enemy.y - this.y) * (enemy.y - this.y)
            );

            if (distanceToWerfer <= this.range) {
                // Calculate distance from enemy to town hall
                const townHallX = 600,
                    townHallY = 400;
                const distanceToTownHall = Math.sqrt(
                    (enemy.x - townHallX) * (enemy.x - townHallX) +
                        (enemy.y - townHallY) * (enemy.y - townHallY)
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

    calculateLeadTarget(enemy, projectileSpeed, gameSpeed) {
        const enemyX = enemy.x;
        const enemyY = enemy.y;
        const enemySpeedX = enemy.velocityX || 0;
        const enemySpeedY = enemy.velocityY || 0;
        
        if (enemySpeedX === 0 && enemySpeedY === 0) {
            return { x: enemyX, y: enemyY };
        }
        
        const dx = enemyX - this.x;
        const dy = enemyY - this.y;
        const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
        const timeToReach = distanceToEnemy / (projectileSpeed * gameSpeed);
        
        const predictedX = enemyX + (enemySpeedX * gameSpeed * timeToReach);
        const predictedY = enemyY + (enemySpeedY * gameSpeed * timeToReach);
        
        return { x: predictedX, y: predictedY };
    }
    
    fireWithPrediction(target, gameSpeed) {
        const projectileSpeed = 200;
        const leadTarget = this.calculateLeadTarget(target, projectileSpeed, gameSpeed);
        
        return {
            x: this.x,
            y: this.y,
            targetX: leadTarget.x,
            targetY: leadTarget.y,
            target: target,
            speed: projectileSpeed,
            damage: this.damage,
            type: 'werfer',
            graphic: this.scene.add.circle(this.x, this.y, 6, 0xFF6600)
        };
    }

    upgrade() {
        if (this.level >= 5) return false; // Max level reached

        this.level++;
        this.applyLevelStats(); // Neue Stats anwenden
        return true;
    }

    takeDamage(damage) {
        this.health -= damage;
        this.showHealthBar();

        if (this.health <= 0) {
            this.toRemove = true;
        }
    }

    showHealthBar() {
        if (!this.healthBarBg.visible) {
            this.healthBarBg.setVisible(true);
            this.healthBar.setVisible(true);
        }
        this.healthBar.scaleX = this.health / this.maxHealth;
    }

    showRange(isSelected = false) {
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
        }

        // Highlight für ausgewähltes Gebäude
        if (isSelected) {
            this.rangeCircle = this.scene.add.circle(
                this.x,
                this.y,
                this.range,
                0xFF6600, // Orange für Werfer-Range
                0.2  // Höhere Transparenz für ausgewähltes Gebäude
            );
            this.rangeCircle.setStrokeStyle(4, 0xFF6600, 0.8); // Dickerer, sichtbarerer Rahmen
        } else {
            this.rangeCircle = this.scene.add.circle(
                this.x,
                this.y,
                this.range,
                0xFF6600, // Orange für Werfer-Range
                0.05  // Weniger sichtbar für nicht-ausgewählte Gebäude
            );
            this.rangeCircle.setStrokeStyle(1, 0xFF6600, 0.2); // Dünnerer Rahmen
        }

        return this.rangeCircle;
    }

    hideRange() {
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
            this.rangeCircle = null;
        }
    }

    destroy() {
        this.graphic.destroy();
        this.symbol.destroy();
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        if (this.rangeCircle) {
            this.rangeCircle.destroy();
        }
    }
}