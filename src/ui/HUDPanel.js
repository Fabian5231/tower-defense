export default class HUDPanel {
    constructor(scene) {
        this.scene = scene;
        this.layout = { 
            x: 12, 
            y: 12, 
            width: 220 - 24, 
            line: 22 
        };
        this.texts = {};
        this.elements = [];
    }

    build() {
        const { x, y, width, line } = this.layout;

        // Hintergrund
        const bg = this.scene.add.rectangle(
            x + width / 2,
            y + 200,
            width,
            400,
            0x2c2c2c,
            0.95
        );
        bg.setStrokeStyle(2, 0x666666);
        bg.setDepth(9000);
        this.elements.push(bg);

        // Titel und HUD-Felder
        let cy = y + 20;
        
        // Titel
        this.texts.title = this.addLine(
            "🏰 Tower Defense", 
            x + 8, 
            cy, 
            "#ffffff", 
            22
        );
        cy += line * 1.5;

        // Separator
        const separator = this.scene.add.rectangle(
            x + width / 2, 
            cy + 5, 
            width - 16, 
            2, 
            0x666666
        );
        separator.setDepth(9001);
        this.elements.push(separator);
        cy += line;

        // Game Stats
        this.texts.hp = this.addLine("❤️ Rathaus: 100/100", x + 8, cy, "#ff6b6b");
        cy += line;
        
        this.texts.score = this.addLine("⭐ Punkte: 0", x + 8, cy, "#74c0fc");
        cy += line;
        
        this.texts.money = this.addLine("💰 Batzen: 60", x + 8, cy, "#ffd43b");
        cy += line;

        // Wave Info
        cy += line * 0.5;
        this.texts.wave = this.addLine("🌊 Welle: 1", x + 8, cy, "#51cf66");
        cy += line;
        
        this.texts.enemies = this.addLine("👹 Gegner: 0/0", x + 8, cy, "#ff8787");
        cy += line;

        // Speed Info
        cy += line * 0.5;
        this.texts.speed = this.addLine("⚡ Speed: 1.0x", x + 8, cy, "#22b8cf");
        cy += line;
        
        this.texts.paused = this.addLine("", x + 8, cy, "#fd7e14");
    }

    addLine(text, x, y, color = "#fff", size = 16) {
        const textElement = this.scene.add
            .text(x, y, text, { 
                fontSize: `${size}px`, 
                fill: color,
                fontFamily: 'Arial, sans-serif'
            })
            .setOrigin(0, 0.5)
            .setDepth(9001);
        
        this.elements.push(textElement);
        return textElement;
    }

    // Update methods for live data
    updateTownHallHealth(health, maxHealth = 100) {
        if (this.texts.hp) {
            const percentage = Math.max(0, Math.ceil((health / maxHealth) * 100));
            this.texts.hp.setText(`❤️ Rathaus: ${health}/${maxHealth} (${percentage}%)`);
            
            // Color coding
            if (percentage > 66) {
                this.texts.hp.setColor("#51cf66"); // Green
            } else if (percentage > 33) {
                this.texts.hp.setColor("#ffd43b"); // Yellow
            } else {
                this.texts.hp.setColor("#ff6b6b"); // Red
            }
        }
    }

    updateScore(score) {
        if (this.texts.score) {
            this.texts.score.setText(`⭐ Punkte: ${score.toLocaleString()}`);
        }
    }

    updateCurrency(currency) {
        if (this.texts.money) {
            this.texts.money.setText(`💰 Batzen: ${currency}`);
        }
    }

    updateWave(wave) {
        if (this.texts.wave) {
            this.texts.wave.setText(`🌊 Welle: ${wave}`);
        }
    }

    updateEnemyCount(remaining, total) {
        if (this.texts.enemies) {
            this.texts.enemies.setText(`👹 Gegner: ${remaining}/${total}`);
        }
    }

    updateSpeed(speed) {
        if (this.texts.speed) {
            this.texts.speed.setText(`⚡ Speed: ${speed}x`);
        }
    }

    updatePaused(isPaused) {
        if (this.texts.paused) {
            this.texts.paused.setText(isPaused ? "⏸️ PAUSIERT" : "");
        }
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
        this.texts = {};
    }
}