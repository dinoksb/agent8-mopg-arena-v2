import Phaser from "phaser";

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private gameScene!: Phaser.Scene;
  
  constructor() {
    super({ key: "UIScene" });
  }
  
  create() {
    this.gameScene = this.scene.get("GameScene");
    
    // Create health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    
    // Create health text
    this.healthText = this.add.text(20, 20, "Health: 100", {
      fontSize: "16px",
      color: "#ffffff"
    });
    this.healthText.setScrollFactor(0);
    
    // Listen for health changes
    this.gameScene.events.on("updateHealth", this.updateHealth, this);
    
    // Make sure UI stays on top
    this.scene.bringToTop();
  }
  
  updateHealth(health: number) {
    // Update health text
    this.healthText.setText(`Health: ${health}`);
    
    // Update health bar
    this.healthBar.clear();
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(20, 40, 200, 20);
    
    // Health amount
    if (health > 60) {
      this.healthBar.fillStyle(0x00ff00, 1);
    } else if (health > 30) {
      this.healthBar.fillStyle(0xffff00, 1);
    } else {
      this.healthBar.fillStyle(0xff0000, 1);
    }
    
    this.healthBar.fillRect(20, 40, 2 * health, 20);
  }
}
