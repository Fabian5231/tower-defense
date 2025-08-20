export default class HUD {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};
        
        this.createHUD();
    }
    
    createHUD() {
        // Game title
        this.elements.title = this.scene.add.text(10, 10, 'Tower Defense', { 
            fontSize: '24px', 
            fill: '#fff' 
        });
        
        // Town hall health
        this.elements.townHallHealth = this.scene.add.text(10, 40, 'Rathaus: 100 HP', { 
            fontSize: '18px', 
            fill: '#ff6b6b' 
        });
        
        // Score
        this.elements.score = this.scene.add.text(10, 65, 'Punkte: 0', { 
            fontSize: '18px', 
            fill: '#fff' 
        });
        
        // Currency
        this.elements.currency = this.scene.add.text(10, 90, 'Batzen: 60', { 
            fontSize: '18px', 
            fill: '#ffd700' 
        });
        
        // Wave info
        this.elements.wave = this.scene.add.text(10, 115, 'Welle: 1', { 
            fontSize: '18px', 
            fill: '#00ff00' 
        });
        
        // Enemy count
        this.elements.enemyCount = this.scene.add.text(10, 140, 'Gegner: 5/5', { 
            fontSize: '16px', 
            fill: '#ffaa00' 
        });
    }
    
    updateTownHallHealth(health) {
        this.elements.townHallHealth.setText(`Rathaus: ${health} HP`);
    }
    
    updateScore(score) {
        this.elements.score.setText(`Punkte: ${score}`);
    }
    
    updateCurrency(currency) {
        this.elements.currency.setText(`Batzen: ${currency}`);
    }
    
    updateWave(currentWave) {
        this.elements.wave.setText(`Welle: ${currentWave}`);
    }
    
    updateEnemyCount(remaining, total) {
        this.elements.enemyCount.setText(`Gegner: ${remaining}/${total}`);
    }
    
    showInsufficientFundsMessage() {
        const message = this.scene.add.text(600, 150, 'Nicht genug Batzen!', {
            fontSize: '20px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        this.scene.time.delayedCall(1500, () => {
            message.destroy();
        });
    }
    
    showGameOver(score) {
        // Game over title
        this.scene.add.text(600, 300, 'RATHAUS ZERSTÖRT!', { 
            fontSize: '48px', 
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // Final score
        this.scene.add.text(600, 360, `Endpunktzahl: ${score}`, { 
            fontSize: '24px', 
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Restart instruction
        this.scene.add.text(600, 410, 'F5 zum Neustarten', { 
            fontSize: '18px', 
            fill: '#aaa',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
    }
}