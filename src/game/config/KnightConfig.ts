export interface AnimationConfig {
  key: string;
  frames: {
    start: number;
    end: number;
  };
  frameRate: number;
  repeat: number;
}

export const KnightConfig = {
  spriteSheet: "https://agent8-games.verse8.io/assets/2D/sprite_characters/medieval-knight.png",
  frameWidth: 192,
  frameHeight: 192,
  scale: 0.5,
  animations: {
    idle: {
      key: "knight-idle",
      frames: {
        start: 0,
        end: 3
      },
      frameRate: 8,
      repeat: -1
    },
    walk: {
      key: "knight-walk",
      frames: {
        start: 4,
        end: 11
      },
      frameRate: 12,
      repeat: -1
    },
    attack: {
      key: "knight-attack",
      frames: {
        start: 12,
        end: 17
      },
      frameRate: 15,
      repeat: 0
    }
  }
};
