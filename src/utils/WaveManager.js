export default class WaveManager {
    constructor() {
        this.currentWave = 1;
        this.enemiesInWave = 5;
        this.enemiesSpawned = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
        this.baseEnemyHealth = 50;
        this.baseEnemySpeed = 50;
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
    }
    
    isWaveComplete(activeEnemies) {
        return this.enemiesSpawned >= this.enemiesInWave && activeEnemies === 0;
    }
    
    canSpawnEnemy(currentTime, gameSpeed) {
        const adjustedSpawnDelay = this.enemySpawnDelay / gameSpeed;
        return this.enemiesSpawned < this.enemiesInWave && 
               currentTime - this.enemySpawnTimer > adjustedSpawnDelay;
    }
    
    spawnEnemy(currentTime) {
        this.enemiesSpawned++;
        this.enemySpawnTimer = currentTime;
    }
    
    getCurrentWaveInfo() {
        return {
            wave: this.currentWave,
            remaining: this.enemiesInWave - this.enemiesSpawned,
            total: this.enemiesInWave
        };
    }
    
    getEnemyConfig() {
        const isBoss = this.shouldSpawnBoss(this.currentWave) && 
                      this.enemiesSpawned === this.enemiesInWave - 1;
        
        if (isBoss) {
            return {
                health: this.getBossHealth(this.currentWave),
                speed: Math.max(20, this.getWaveEnemySpeed(this.currentWave) - 20), // Bosses are slower
                isBoss: true,
                goldReward: 5 // Proportional reduziert: 25 → 5 (5x normale Gegner)
            };
        } else {
            return {
                health: this.getWaveEnemyHealth(this.currentWave),
                speed: this.getWaveEnemySpeed(this.currentWave),
                isBoss: false,
                goldReward: 1
            };
        }
    }
}