import Phaser from "phaser";
import { KnightConfig } from "../config/KnightConfig";

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 100;
  private scene: Phaser.Scene;
  private nameText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private speedBoostTimer: number | null = null;
  private normalSpeed: number = 200;
  private boostedSpeed: number = 300;
  private id: string;
  private name: string;
  private isLocalPlayer: boolean;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  } | null = null;
  
  // Animation state
  private currentAnimation: string = "idle";
  private isAttacking: boolean = false;
  private lastDirection: { x: number, y: number } = { x: 0, y: 0 };
  
  // Player color tint
  private colorTint: number;
  
  // Available colors for players
  private static readonly PLAYER_COLORS = [
    0xffffff,  // White (no tint) - for local player
    0xff0000,  // Red
    0x00ff00,  // Green
    0x0000ff,  // Blue
    0xffff00,  // Yellow
    0xff00ff,  // Magenta
    0x00ffff,  // Cyan
    0xff8800,  // Orange
    0x8800ff   // Purple
  ];
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    name: string,
    id: string,
    colorIndex?: number
  ) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.isLocalPlayer = id === (scene as any).myAccount;
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setScale(KnightConfig.scale);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData("id", id);
    
    // Set body size for better collision
    this.sprite.setSize(KnightConfig.frameWidth * 0.5, KnightConfig.frameHeight * 0.5);
    this.sprite.setOffset(KnightConfig.frameWidth * 0.25, KnightConfig.frameHeight * 0.25);
    
    // Set color tint based on whether this is the local player or an opponent
    if (this.isLocalPlayer) {
      this.colorTint = Player.PLAYER_COLORS[0]; // Local player uses default color (white/no tint)
    } else {
      // For opponents, use the provided colorIndex or calculate one based on the id
      const index = colorIndex !== undefined ? 
        colorIndex : 
        Math.abs(this.hashCode(id) % (Player.PLAYER_COLORS.length - 1)) + 1;
      this.colorTint = Player.PLAYER_COLORS[index];
    }
    
    // Apply the color tint
    this.sprite.setTint(this.colorTint);
    
    // Create name text
    this.nameText = scene.add.text(x, y - 50, name, {
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    });
    this.nameText.setOrigin(0.5);
    
    // Create health bar
    this.healthBar = scene.add.graphics();
    
    // Set depth to ensure player is above background but below UI
    this.sprite.setDepth(10);
    this.nameText.setDepth(11);
    this.healthBar.setDepth(11);
    
    // Initialize input controls for local player
    if (this.isLocalPlayer) {
      this.initializeControls();
    }
    
    // Start idle animation
    this.playIdleAnimation();
    
    // Listen for animation complete events
    this.sprite.on('animationcomplete', this.onAnimationComplete, this);
  }
  
  // Simple string hash function to generate a consistent number from player ID
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  
  private initializeControls() {
    // Initialize cursor keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Initialize WASD keys
    this.wasdKeys = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }
  
  update() {
    // Update name text and health bar position
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 50);
    this.updateHealthBar();
    
    // Handle movement for local player
    if (this.isLocalPlayer && !this.isAttacking) {
      this.handleMovement();
      this.handleRotation();
    }
  }
  
  private handleMovement() {
    if (!this.cursors || !this.wasdKeys) return;
    
    // Reset velocity
    this.sprite.setVelocity(0);
    
    // Get current speed (normal or boosted)
    const speed = this.speedBoostTimer !== null ? this.boostedSpeed : this.normalSpeed;
    
    // Track if player is moving
    let isMoving = false;
    let directionX = 0;
    let directionY = 0;
    
    // Apply movement based on input
    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      this.sprite.setVelocityX(-speed);
      directionX = -1;
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      this.sprite.setVelocityX(speed);
      directionX = 1;
      isMoving = true;
    }
    
    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      this.sprite.setVelocityY(-speed);
      directionY = -1;
      

      isMoving = true;
    } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      this.sprite.setVelocityY(speed);
      directionY = 1;
      isMoving = true;
    }
    
    // Normalize diagonal movement
    if (this.sprite.body.velocity.x !== 0 || this.sprite.body.velocity.y !== 0) {
      this.sprite.body.velocity.normalize().scale(speed);
    }
    
    // Update animation based on movement
    if (isMoving) {
      // Save last direction for sprite flipping
      if (directionX !== 0) {
        this.lastDirection.x = directionX;
      }
      
      // Flip sprite based on horizontal direction
      if (directionX < 0) {
        this.sprite.setFlipX(true);
      } else if (directionX > 0) {
        this.sprite.setFlipX(false);
      }
      
      // Play walk animation if not already playing
      if (this.currentAnimation !== "walk") {
        this.playWalkAnimation();
      }
    } else {
      // Play idle animation if not already playing
      if (this.currentAnimation !== "idle") {
        this.playIdleAnimation();
      }
    }
  }
  
  private handleRotation() {
    // We don't rotate the knight sprite, we just flip it based on direction
    // which is handled in handleMovement
  }
  
  moveTo(x: number, y: number) {
    // For non-local players, smoothly move to the target position
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: 100,
      ease: "Linear",
      onUpdate: () => {
        // Determine if this is movement and play appropriate animation
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
        if (distance > 5) {
          // Flip sprite based on movement direction
          if (x < this.sprite.x) {
            this.sprite.setFlipX(true);
          } else if (x > this.sprite.x) {
            this.sprite.setFlipX(false);
          }
          
          // Play walk animation if not already playing
          if (this.currentAnimation !== "walk") {
            this.playWalkAnimation();
          }
        } else {
          // Play idle animation if not already playing and not too far
          if (this.currentAnimation !== "idle") {
            this.playIdleAnimation();
          }
        }
      }
    });
  }
  
  playIdleAnimation() {
    this.sprite.play(KnightConfig.animations.idle.key);
    this.currentAnimation = "idle";
  }
  
  playWalkAnimation() {
    this.sprite.play(KnightConfig.animations.walk.key);
    this.currentAnimation = "walk";
  }
  
  playAttackAnimation() {
    if (this.isAttacking) return;
    
    this.isAttacking = true;
    this.sprite.play(KnightConfig.animations.attack.key);
    this.currentAnimation = "attack";
  }
  
  private onAnimationComplete(animation: Phaser.Animations.Animation) {
    // When attack animation completes, go back to idle
    if (animation.key === KnightConfig.animations.attack.key) {
      this.isAttacking = false;
      this.playIdleAnimation();
    }
  }
  
  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    
    // Emit event for UI updates
    this.scene.events.emit("updateHealth", this.health);
    
    // Visual feedback
    this.scene.cameras.main.shake(100, 0.01);
    
    // Store original tint
    const originalTint = this.colorTint;
    
    // Flash red for damage
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      // Restore original tint
      this.sprite.setTint(originalTint);
    });
  }
  
  heal(amount: number) {
    this.health = Math.min(100, this.health + amount);
    
    // Emit event for UI updates
    this.scene.events.emit("updateHealth", this.health);
    
    // Visual feedback
    // Store original tint
    const originalTint = this.colorTint;
    
    // Flash green for healing
    this.sprite.setTint(0x00ff00);
    this.scene.time.delayedCall(100, () => {
      // Restore original tint
      this.sprite.setTint(originalTint);
    });
  }
  
  applySpeedBoost(duration: number) {
    // Clear existing timer if any
    if (this.speedBoostTimer !== null) {
      this.scene.time.removeEvent(this.speedBoostTimer);
    }
    
    // Store original tint
    const originalTint = this.colorTint;
    
    // Apply visual effect (cyan tint)
    this.sprite.setTint(0x00ffff);
    
    // Set timer to remove boost after duration
    this.speedBoostTimer = this.scene.time.delayedCall(duration, () => {
      // Restore original tint
      this.sprite.setTint(originalTint);
      this.speedBoostTimer = null;
    });
  }
  
  setHealth(health: number) {
    this.health = health;
    this.updateHealthBar();
  }
  
  reset() {
    this.health = 100;
    this.scene.events.emit("updateHealth", this.health);
    
    // Restore original tint
    this.sprite.setTint(this.colorTint);
    
    // Clear speed boost if active
    if (this.speedBoostTimer !== null) {
      this.scene.time.removeEvent(this.speedBoostTimer);
      this.speedBoostTimer = null;
    }
    
    // Reset animation state
    this.isAttacking = false;
    this.playIdleAnimation();
  }
  
  destroy() {
    this.sprite.destroy();
    this.nameText.destroy();
    this.healthBar.destroy();
  }
  
  private updateHealthBar() {
    this.healthBar.clear();
    
    // Draw background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.sprite.x - 25, this.sprite.y - 40, 50, 5);
    
    // Draw health amount
    if (this.health > 60) {
      this.healthBar.fillStyle(0x00ff00, 1);
    } else if (this.health > 30) {
      this.healthBar.fillStyle(0xffff00, 1);
    } else {
      this.healthBar.fillStyle(0xff0000, 1);
    }
    
    const width = Math.max(0, (this.health / 100) * 50);
    this.healthBar.fillRect(this.sprite.x - 25, this.sprite.y - 40, width, 5);
  }
}
