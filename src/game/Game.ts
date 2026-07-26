import type { GameState } from "./types";
import { applyGravity, jump } from "./physics";

export function createGame(): GameState {
  return {
    potato: { x: 200, y: 50, velocityX: 0, velocityY: 0, rotation: 0 },
    gravity: 0.6,
    score: 0,
    isGameOver: false,
  };
}

export function updateGame(state: GameState, canvasWidth: number, canvasHeight: number) {
  if (state.isGameOver) return;

  applyGravity(state.potato, state.gravity, canvasWidth);

  // Game Over – פגיעה ברצפה
  if (state.potato.y >= canvasHeight - 20) {
    state.isGameOver = true;
    state.potato.y = canvasHeight - 20;
  }
}

export function handleJump(state: GameState) {
  if (state.isGameOver) return;

  jump(state.potato, 12);
  state.score++;
  state.gravity += 0.02; // יותר קשה בכל קפיצה
}