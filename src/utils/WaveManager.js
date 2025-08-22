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
        // Exponentielles Scaling: +35% HP pro Welle (wird schnell gefährlich)
        return Math.floor(this.baseEnemyHealth * Math.pow(1.35, wave - 1));
    }
    
    getWaveEnemySpeed(wave) {
        // Moderates exponentielles Speed-Scaling: +15% pro Welle
        return Math.floor(this.baseEnemySpeed * Math.pow(1.15, wave - 1));
    }
    
    getBossHealth(wave) {
        // Boss wird mit jeder Welle proportional stärker
        return Math.floor(this.getWaveEnemyHealth(wave) * (8 + wave * 2)); // 8x + 2x pro Welle
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
            // Spezialisierte Monster-Typen basierend auf Welle
            const enemyType = this.getEnemyType();
            const baseHealth = this.getWaveEnemyHealth(this.currentWave);
            const baseSpeed = this.getWaveEnemySpeed(this.currentWave);
            
            return this.getSpecializedEnemyStats(enemyType, baseHealth, baseSpeed);
        }
    }
    
    getEnemyType() {
        // Ab Welle 3 spawnen verschiedene Typen
        if (this.currentWave < 3) return 'normal';
        
        const rand = Math.random();
        const wave = this.currentWave;
        
        // Wahrscheinlichkeiten ändern sich mit der Welle
        if (wave >= 8 && rand < 0.25) return 'armored';  // 25% ab Welle 8
        if (wave >= 5 && rand < 0.35) return 'fast';     // 35% ab Welle 5
        if (wave >= 10 && rand < 0.15) return 'stealth'; // 15% ab Welle 10
        return 'normal'; // Rest sind normale Gegner
    }
    
    getSpecializedEnemyStats(type, baseHealth, baseSpeed) {
        switch (type) {
            case 'fast':
                return {
                    health: Math.floor(baseHealth * 0.6),  // 60% HP
                    speed: Math.floor(baseSpeed * 1.8),    // 180% Speed
                    type: 'fast',
                    symbol: '💨',  // Wind-Symbol
                    color: 0x00FFFF,  // Cyan
                    goldReward: 1
                };
                
            case 'armored':
                return {
                    health: Math.floor(baseHealth * 2.5),  // 250% HP
                    speed: Math.floor(baseSpeed * 0.6),    // 60% Speed
                    type: 'armored',
                    symbol: '🛡️',   // Schild-Symbol
                    color: 0x888888,  // Grau
                    goldReward: 2
                };
                
            case 'stealth':
                return {
                    health: Math.floor(baseHealth * 0.8),  // 80% HP
                    speed: Math.floor(baseSpeed * 1.2),    // 120% Speed
                    type: 'stealth',
                    symbol: '🕵️',   // Detective-Symbol
                    color: 0x4B0082,  // Indigo
                    goldReward: 2
                };
                
            default: // normal
                return {
                    health: baseHealth,
                    speed: baseSpeed,
                    type: 'normal',
                    symbol: '👹',   // Standard Ogre
                    color: 0xff0000,  // Rot
                    goldReward: 1
                };
        }
    }
}