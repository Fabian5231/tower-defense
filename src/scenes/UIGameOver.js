export default class UIGameOver extends Phaser.Scene {
    constructor() {
        super({ key: "ui-gameover" });
    }

    create(data) {
        const { score } = data;

        // Schwarzes Overlay über den ganzen Bildschirm
        const overlay = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.8
        );
        overlay.setOrigin(0.5);

        // Game Over Titel
        const gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 60,
            "💀 RATHAUS ZERSTÖRT! 💀",
            {
                fontSize: "48px",
                fill: "#ff0000",
                fontFamily: "Arial, sans-serif",
                align: "center",
            }
        );
        gameOverText.setOrigin(0.5);

        // Score Anzeige
        const scoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            `Endpunktzahl: ${score.toLocaleString()}`,
            {
                fontSize: "24px",
                fill: "#ffffff",
                fontFamily: "Arial, sans-serif",
                align: "center",
            }
        );
        scoreText.setOrigin(0.5);

        // Restart Hinweis
        const restartText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 50,
            "F5 zum Neustarten",
            {
                fontSize: "18px",
                fill: "#888888",
                fontFamily: "Arial, sans-serif",
                align: "center",
            }
        );
        restartText.setOrigin(0.5);

        // Input blockieren, damit man nicht mehr ins Spiel klicken kann
        this.input.on("pointerdown", (pointer) => {
            pointer.event.stopPropagation();
        });
    }
}