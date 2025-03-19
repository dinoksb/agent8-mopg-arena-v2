class Server {
  constructor() {
    this.MAX_PLAYERS_PER_ROOM = 8;
    this.POWERUP_SPAWN_INTERVAL = 10000; // 10 seconds
    this.POWERUP_TYPES = ["health", "speed"];
    this.OBSTACLE_COUNT = 30; // Number of random obstacles
  }

  async joinRoom(roomId) {
    try {
      // If roomId is provided, check if it exists and has space
      if (roomId) {
        const roomUsers = await $global.getRoomUserAccounts(roomId);
        if (roomUsers && roomUsers.length >= this.MAX_PLAYERS_PER_ROOM) {
          throw new Error("Room is full");
        }
      }

      // Join or create room
      const joinedRoomId = await $global.joinRoom(roomId);
      
      // Initialize player state
      await $room.updateMyState({
        x: Math.floor(Math.random() * 1800) + 100,
        y: Math.floor(Math.random() * 1800) + 100,
        health: 100,
        score: 0
      });
      
      // Initialize room state if this is a new room
      const roomState = await $room.getRoomState();
      if (!roomState.initialized) {
        // Generate obstacle positions when creating a new room
        const obstacles = this.generateObstacles();
        
        await $room.updateRoomState({
          initialized: true,
          gameTime: 0,
          powerups: [],
          obstacles: obstacles, // Save obstacle information
          lastPowerupSpawn: Date.now()
        });
      }
      
      return joinedRoomId;
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    }
  }
  
  // Function to generate obstacle positions
  generateObstacles() {
    const obstacles = [];
    
    // Border obstacles have fixed positions and are handled by the client
    
    // Generate random obstacles
    for (let i = 0; i < this.OBSTACLE_COUNT; i++) {
      const x = Math.floor(Math.random() * 1800) + 100; // 100 ~ 1900
      const y = Math.floor(Math.random() * 1800) + 100; // 100 ~ 1900
      obstacles.push({ x, y });
    }
    
    return obstacles;
  }
  
  async leaveRoom() {
    try {
      await $global.leaveRoom();
      return "success";
    } catch (error) {
      console.error("Error leaving room:", error);
      throw error;
    }
  }
  
  async setPlayerData(data) {
    try {
      await $room.updateMyState({
        name: data.name
      });
      return "success";
    } catch (error) {
      console.error("Error setting player data:", error);
      throw error;
    }
  }
  
  async updatePlayerPosition(data) {
    try {
      await $room.updateMyState({
        x: data.x,
        y: data.y,
        angle: data.angle,
        health: data.health
      });
      return "success";
    } catch (error) {
      console.error("Error updating player position:", error);
      throw error;
    }
  }
  
  async fireProjectile(projectileData) {
    try {
      // Broadcast projectile fired event to all players in the room
      await $room.broadcastToRoom("projectileFired", projectileData);
      return "success";
    } catch (error) {
      console.error("Error firing projectile:", error);
      throw error;
    }
  }
  
  async playerHit(data) {
    try {
      const { targetId, attackerId, damage } = data;
      
      // Get target player state
      const targetState = await $room.getUserState(targetId);
      if (!targetState) return "player not found";
      
      // Update health
      const newHealth = Math.max(0, (targetState.health || 100) - damage);
      await $room.updateUserState(targetId, { health: newHealth });
      
      return "success";
    } catch (error) {
      console.error("Error handling player hit:", error);
      throw error;
    }
  }
  
  async playerDied(data) {
    try {
      const { playerId, killerId } = data;
      
      // Reset player health
      await $room.updateUserState(playerId, { health: 100 });
      
      // Increment killer's score
      if (killerId && killerId !== playerId) {
        const killerState = await $room.getUserState(killerId);
        if (killerState) {
          const newScore = (killerState.score || 0) + 1;
          await $room.updateUserState(killerId, { score: newScore });
        }
      }
      
      return "success";
    } catch (error) {
      console.error("Error handling player death:", error);
      throw error;
    }
  }
  
  async spawnPowerup(roomId) {
    try {
      // Get current room state
      const roomState = await $room.getRoomState();
      
      // Generate powerup data
      const powerupId = `powerup_${Date.now()}`;
      const powerupType = this.POWERUP_TYPES[Math.floor(Math.random() * this.POWERUP_TYPES.length)];
      const powerupData = {
        id: powerupId,
        x: Math.floor(Math.random() * 1800) + 100,
        y: Math.floor(Math.random() * 1800) + 100,
        type: powerupType,
        createdAt: Date.now()
      };
      
      // Add powerup to room state
      const powerups = [...(roomState.powerups || []), powerupData];
      await $room.updateRoomState({
        powerups,
        lastPowerupSpawn: Date.now()
      });
      
      // Broadcast powerup spawned event
      await $room.broadcastToRoom("powerupSpawned", powerupData);
      
      return "success";
    } catch (error) {
      console.error("Error spawning powerup:", error);
      throw error;
    }
  }
  
  async collectPowerup(powerupId) {
    try {
      // Get current room state
      const roomState = await $room.getRoomState();
      
      // Remove powerup from room state
      const powerups = (roomState.powerups || []).filter(p => p.id !== powerupId);
      await $room.updateRoomState({ powerups });
      
      return "success";
    } catch (error) {
      console.error("Error collecting powerup:", error);
      throw error;
    }
  }
  
  // Room tick function - called periodically by the server
  async $roomTick(deltaMS, roomId) {
    try {
      // Get current room state
      const roomState = await $room.getRoomState();
      if (!roomState) return;
      
      // Update game time
      const gameTime = (roomState.gameTime || 0) + deltaMS;
      await $room.updateRoomState({ gameTime });
      
      // Check if we need to spawn a powerup
      const lastPowerupSpawn = roomState.lastPowerupSpawn || 0;
      if (Date.now() - lastPowerupSpawn > this.POWERUP_SPAWN_INTERVAL) {
        await this.spawnPowerup(roomId);
      }
      
      // Clean up old powerups (older than 30 seconds)
      if (roomState.powerups && roomState.powerups.length > 0) {
        const currentTime = Date.now();
        const powerups = roomState.powerups.filter(p => 
          currentTime - p.createdAt < 30000
        );
        
        if (powerups.length !== roomState.powerups.length) {
          await $room.updateRoomState({ powerups });
        }
      }
    } catch (error) {
      console.error("Error in room tick:", error);
    }
  }
}
