import WorldScene from './src/scenes/WorldScene.js';
import UIScene from './src/scenes/UIScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1e1e1e',
    scene: [WorldScene, UIScene],
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);