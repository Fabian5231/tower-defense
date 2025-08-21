import BuildingMenu from '../ui/BuildingMenu.js';

const SIDEBAR_W = 220;

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ui' });
        this.buildingMenu = null;
    }
    
    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        // Set viewport for UI area (right sidebar)
        this.cameras.main.setViewport(w - SIDEBAR_W, 0, SIDEBAR_W, h);
        
        // Create sidebar background
        const sidebarBg = this.add.rectangle(
            SIDEBAR_W / 2,
            h / 2,
            SIDEBAR_W,
            h,
            0x2c2c2c,
            0.95
        );
        sidebarBg.setStrokeStyle(2, 0x666666);
        sidebarBg.setDepth(9000); // Behind UI elements but above world
        
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
        this.buildingMenu.layout.menuX = SIDEBAR_W / 2;
        this.buildingMenu.layout.menuY = 10;
        this.buildingMenu.layout.menuWidth = SIDEBAR_W - 40;
        this.buildingMenu.layout.buttonWidth = SIDEBAR_W - 50;
        
        // Create the menu
        this.buildingMenu.createMenu();
        
        // Prevent clicks from going through to world scene
        this.input.on('pointerdown', (pointer) => {
            // Stop propagation of pointer events to world scene
            pointer.event.stopPropagation();
        });
        
        this.input.on('pointermove', (pointer) => {
            // Stop propagation of pointer events to world scene
            pointer.event.stopPropagation();
        });
    }
}