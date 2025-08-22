import BuildingMenu from '../ui/BuildingMenu.js';

export const RIGHT_W = 200;

export default class UISceneRight extends Phaser.Scene {
    constructor() {
        super({ key: 'ui-right' });
        this.buildingMenu = null;
    }
    
    create() {
        this.setViewport();
        
        // Setup callbacks to communicate with WorldScene
        const world = this.scene.get('world');
        const onSelectBuilding = (type) => world.events.emit('ui:select', type);
        const onToggleGrid = (show) => world.events.emit('ui:grid', show);
        const onTogglePause = () => world.events.emit('ui:pause');
        const onChangeSpeed = () => world.events.emit('ui:speed');
        
        // Create building menu with autoCreate disabled
        this.buildingMenu = new BuildingMenu(
            this,
            onSelectBuilding,
            onToggleGrid,
            onTogglePause,
            onChangeSpeed,
            { autoCreate: false }
        );
        
        // Configure layout for sidebar
        this.buildingMenu.layout.menuX = RIGHT_W / 2;
        this.buildingMenu.layout.menuY = 10;
        this.buildingMenu.layout.menuWidth = RIGHT_W - 40;
        this.buildingMenu.layout.buttonWidth = RIGHT_W - 50;
        
        // Create the menu
        this.buildingMenu.createMenu();
        
        // Handle resize events
        this.events.on('ui:resize', this.setViewport, this);
        
        // Prevent clicks from going through to world scene
        this.input.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        
        this.input.on('pointermove', (pointer) => {
            pointer.event.stopPropagation();
        });
    }

    setViewport() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.cameras.main.setViewport(w - RIGHT_W, 0, RIGHT_W, h);
        this.cameras.main.setBackgroundColor('#2c2c2c');
    }
}