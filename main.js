import WorldScene from './src/scenes/WorldScene.js';
import UISceneLeft from './src/scenes/UISceneLeft.js';
import UISceneRight from './src/scenes/UISceneRight.js';
import UIGameOver from "./src/scenes/UIGameOver.js";

const config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#1e1e1e',
    scene: [WorldScene, UISceneLeft, UISceneRight, UIGameOver],
    physics: {
        default: 'arcade'
    },
    render: { 
        pixelArt: false, 
        antialias: true 
    },
    input: {
        keyboard: true
    }
};

const game = new Phaser.Game(config);