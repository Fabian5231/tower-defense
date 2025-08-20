import TowerDefenseGame from './src/scenes/TowerDefenseGame.js';

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