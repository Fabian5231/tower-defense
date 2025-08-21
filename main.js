import WorldScene from './src/scenes/WorldScene.js';
import UISceneLeft from './src/scenes/UISceneLeft.js';
import UISceneRight from './src/scenes/UISceneRight.js';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1e1e1e',
    scene: [WorldScene, UISceneLeft, UISceneRight],
    physics: {
        default: 'arcade'
    },
    render: { 
        pixelArt: false, 
        antialias: true 
    }
};

const game = new Phaser.Game(config);