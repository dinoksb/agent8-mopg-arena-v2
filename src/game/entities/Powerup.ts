import Phaser from "phaser";

export class Powerup {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private id: string;
  private type: string;
  private glowEffect: Phaser.GameObjects.Graphics;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    type: string
  ) {
    this.scene = scene;
    this.id = id;
    this.type = type;
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setScale(0.5);
    this.sprite.setData("id", id);
    this.sprite.setData("type", type);
    
    // Set color based on powerup type
    if (type === "health") {
      this.sprite.setTint(0xff0000); // Red for health
    } else if (type === "speed") {
      this.sprite.setTint(0x00ffff); // Cyan for speed
    }
    
    // Add glow effect
    this.glowEffect = scene.add.graphics();
    this.updateGlowEffect();
    
    // Add pulsing animation
    scene.tweens.add({
      targets: this.sprite,
      scale: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Set depth to ensure powerup is above background
    this.sprite.setDepth(5);
    this.glowEffect.setDepth(4);
    
    // Add event to update glow effect position
    scene.events.on('update', this.updateGlowEffect, this);
  }
  
  private updateGlowEffect() {
    if (!this.sprite || !this.sprite.active) return;
    
    this.glowEffect.clear();
    
    // Set glow color based on powerup type
    let color = 0xffffff;
    if (this.type === "health") {
      color = 0xff0000; // Red for health
    } else if (this.type === "speed") {
      color = 0x00ffff; // Cyan for speed
    }
    
    // Draw glow
    this.glowEffect.fillStyle(color, 0.3);
    this.glowEffect.fillCircle(this.sprite.x, this.sprite.y, 20);
  }
  
  destroy() {
    if (this.sprite && this.sprite.active) {
      // Remove update event
      this.scene.events.off('update', this.updateGlowEffect, this);
      
      // Destroy graphics
      this.glowEffect.destroy();
      
      // Destroy sprite
      this.sprite.destroy();
    }
  }
}
