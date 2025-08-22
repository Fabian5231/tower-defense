import HUDPanel from '../ui/HUDPanel.js';

export const LEFT_W = 200;

export default class UISceneLeft extends Phaser.Scene {
    constructor() {
        super({ key: 'ui-left' });
        this.hudPanel = null;
    }

    create() {
        this.setViewport();

        // Create HUD panel
        this.hudPanel = new HUDPanel(this);
        this.hudPanel.layout.x = 12;
        this.hudPanel.layout.y = 12;
        this.hudPanel.layout.width = LEFT_W - 24;
        this.hudPanel.build();

        // Listen to world scene events for updates
        const worldScene = this.scene.get('world');
        if (worldScene) {
            // Subscribe to game state updates
            worldScene.events.on('hud:updateTownHall', (health, maxHealth) => {
                this.hudPanel.updateTownHallHealth(health, maxHealth);
            });
            
            worldScene.events.on('hud:updateScore', (score) => {
                this.hudPanel.updateScore(score);
            });
            
            worldScene.events.on('hud:updateCurrency', (currency) => {
                this.hudPanel.updateCurrency(currency);
            });
            
            worldScene.events.on('hud:updateWave', (wave) => {
                this.hudPanel.updateWave(wave);
            });
            
            worldScene.events.on('hud:updateEnemies', (remaining, total) => {
                this.hudPanel.updateEnemyCount(remaining, total);
            });
            
            worldScene.events.on('hud:updateSpeed', (speed) => {
                this.hudPanel.updateSpeed(speed);
            });
            
            worldScene.events.on('hud:updatePaused', (isPaused) => {
                this.hudPanel.updatePaused(isPaused);
            });
            
            // Game over is now handled by WorldScene directly
        }

        // Handle resize events
        this.events.on('ui:resize', this.setViewport, this);
        
        // Prevent input from going through to world scene
        this.input.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        
        this.input.on('pointermove', (pointer) => {
            pointer.event.stopPropagation();
        });
    }

    setViewport() {
        const h = this.scale.height;
        this.cameras.main.setViewport(0, 0, LEFT_W, h);
        this.cameras.main.setBackgroundColor('#2c2c2c');
    }


    destroy() {
        if (this.hudPanel) {
            this.hudPanel.destroy();
            this.hudPanel = null;
        }
        super.destroy();
    }
}