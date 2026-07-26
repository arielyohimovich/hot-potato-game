export interface Potato {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
}

export interface GameState {
  potato: Potato;
  gravity: number;
  score: number;
  isGameOver: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
}