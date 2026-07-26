import type { Potato } from "./types";

// עדכון פיזיקה
export function applyGravity(potato: Potato, gravity: number, canvasWidth: number) {
  potato.velocityY += gravity;
  potato.y += potato.velocityY;
  potato.x += potato.velocityX;

  // החזרת כיוון מקירות
  if (potato.x <= 20) {
    potato.x = 20;
    potato.velocityX = -potato.velocityX * 0.8;
  }
  if (potato.x >= canvasWidth - 20) {
    potato.x = canvasWidth - 20;
    potato.velocityX = -potato.velocityX * 0.8;
  }

  // סיבוב
  potato.rotation += potato.velocityX * 0.05;
}

// קפיצה רנדומלית
export function jump(potato: Potato, baseForce: number) {
  const verticalForce = baseForce * (1.3 + Math.random() * 0.6); // בין 2 ל-2.6
  potato.velocityY = -verticalForce;

  // כיוון אופקי אקראי
  potato.velocityX += Math.random() * 6 - 3;
  if (potato.velocityX > 6) potato.velocityX = 6;
  if (potato.velocityX < -6) potato.velocityX = -6;
}