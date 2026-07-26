import { useEffect, useRef, useState } from "react";
import { createGame, updateGame, handleJump } from "../game/Game";
import type { Particle, SmokeParticle } from "../game/types";

interface Player {
  name: string;
  email: string;
  score: number;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(createGame());

  const [showForm, setShowForm] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [isStarted, setIsStarted] = useState(false);
  const [hasGameBegun, setHasGameBegun] = useState(false);

  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const particlesRef = useRef<Particle[]>([]);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);

  const jumpSound = useRef<HTMLAudioElement | null>(null);
  const backgroundSound = useRef<HTMLAudioElement | null>(null);
  const gameOverSound = useRef<HTMLAudioElement | null>(null);
  const gameOverPlayed = useRef(false);

  const spotsRef = useRef([
    { x: -15, y: -8, r: 4 },
    { x: 10, y: 5, r: 3 },
    { x: -5, y: 12, r: 3.5 },
    { x: 20, y: -5, r: 2.5 },
  ]);

  // Load sounds & preload
  useEffect(() => {
    jumpSound.current = new Audio("/sounds/jump.wav");
    jumpSound.current.preload = "auto";

    backgroundSound.current = new Audio("/sounds/background.wav");
    backgroundSound.current.loop = true;
    backgroundSound.current.volume = 0.3;
    backgroundSound.current.preload = "auto";

    gameOverSound.current = new Audio("/sounds/gameover.wav");
    gameOverSound.current.volume = 0.8;
    gameOverSound.current.preload = "auto";

    const unlockAudio = () => {
      [jumpSound, backgroundSound, gameOverSound].forEach((ref) => {
        if (ref.current) {
          ref.current.play().catch(() => {});
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
      window.removeEventListener("mousedown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("mousedown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("mousedown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Resize canvas
  useEffect(() => {
    const handleResize = () =>
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!hasGameBegun || isStarted) return;

    setCountdown(3); // אתחול ספירה

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        clearInterval(interval);

        // אחרי הספירה מתחילים את המשחק
        setIsStarted(true);
        if (backgroundSound.current) {
          backgroundSound.current.play().catch(() => {});
        }

        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasGameBegun]);

  // Canvas rendering & game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, "#87CEEB");
      sky.addColorStop(1, "#E0F6FF");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isStarted) {
        updateGame(gameRef.current, canvas.width, canvas.height);
      }

      const potato = gameRef.current.potato;

      ctx.save();
      ctx.translate(potato.x, potato.y);
      ctx.rotate(potato.rotation);

      const gradient = ctx.createRadialGradient(-10, -10, 10, 0, 0, 50);
      gradient.addColorStop(0, "#d2a679");
      gradient.addColorStop(0.5, "#a97442");
      gradient.addColorStop(1, "#5c3b1e");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4a2c15";
      spotsRef.current.forEach((spot) => {
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // ground
      const groundGradient = ctx.createLinearGradient(
        0,
        canvas.height - 40,
        0,
        canvas.height
      );
      groundGradient.addColorStop(0, "#4CAF50");
      groundGradient.addColorStop(1, "#2E7D32");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

      // score
      ctx.fillStyle = "black";
      ctx.font = "18px Arial";
      ctx.fillText(`Score: ${gameRef.current.score}`, 20, 30);

      // countdown
      if (hasGameBegun && !isStarted) {
        ctx.fillStyle = "blue";
        ctx.font = "60px Arial";
        ctx.fillText(`${countdown}`, canvas.width / 2 - 15, canvas.height / 2);
      }

      // game over
      if (gameRef.current.isGameOver) {
        if (!gameOverPlayed.current) {
          if (backgroundSound.current) backgroundSound.current.pause();
          if (gameOverSound.current)
            gameOverSound.current.play().catch(() => {});
          gameOverPlayed.current = true;
        }
        setShowForm(true);
      }

      // particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        ctx.fillStyle = `rgba(139,69,19,${p.life / 30})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      // smoke
      smokeParticlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02;
        p.life--;
        p.alpha -= 0.01;
        ctx.fillStyle = `rgba(100,100,100,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      smokeParticlesRef.current = smokeParticlesRef.current.filter(
        (p) => p.life > 0 && p.alpha > 0
      );

      requestAnimationFrame(loop);
    };

    loop();

    let lastJump = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isStarted || gameRef.current.isGameOver) return;
      const potato = gameRef.current.potato;
      const dx = e.clientX - potato.x;
      const dy = e.clientY - potato.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = 80;
      const now = Date.now();
      if (now - lastJump < 200) return;
      if (distance < radius) {
        handleJump(gameRef.current);
        if (jumpSound.current) {
          jumpSound.current.currentTime = 0;
          jumpSound.current.play().catch(() => {});
        }
        lastJump = now;

        for (let i = 0; i < 8; i++) {
          particlesRef.current.push({
            x: potato.x,
            y: potato.y,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -4,
            life: 30,
          });
        }

        for (let i = 0; i < 6; i++) {
          smokeParticlesRef.current.push({
            x: potato.x,
            y: potato.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * -1 - 0.5,
            alpha: 0.6 + Math.random() * 0.4,
            size: 8 + Math.random() * 4,
            life: 40 + Math.random() * 20,
          });
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [hasGameBegun, isStarted, countdown]);

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    setPlayers((prev) =>
      [...prev, { name, email, score: gameRef.current.score }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    );
    setShowForm(false);
  };

  // Start button
  const startGame = () => {
    setHasGameBegun(true);
    setCountdown(3);
  };

  // Play Again button
  const playAgain = () => {
    gameRef.current = createGame();
    setCountdown(3);
    setIsStarted(false);
    setHasGameBegun(true); // מפעיל את ספירה לאחור
    gameOverPlayed.current = false;
    setShowForm(false);
    if (backgroundSound.current) backgroundSound.current.currentTime = 0;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: "block" }}
      />

      {/* Start screen */}
      {!hasGameBegun && !isStarted && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "url('/images/hotPotato.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "64px",
              marginBottom: "30px",
              color: "#fff",
              textShadow: "2px 2px 8px #000",
            }}
          >
            Hot Potato
          </h1>
          <button
            onClick={startGame}
            style={{
              fontSize: "24px",
              padding: "15px 30px",
              cursor: "pointer",
              backgroundColor: "rgba(255, 112, 67, 0.8)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
            }}
          >
            Start
          </button>
        </div>
      )}

      {/* Game over form */}
      {showForm && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 224, 178,0.9)",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <input
              name="name"
              placeholder="Full Name"
              required
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "2px solid #FF7043",
                fontSize: "18px",
                textAlign: "center",
              }}
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              required
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "2px solid #FF7043",
                fontSize: "18px",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px",
                fontSize: "20px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#FF7043",
                color: "white",
                cursor: "pointer",
                boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
              }}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Leaderboard */}
      {players.length > 0 && !hasGameBegun && (
        <div
          style={{
            position: "absolute",
            top: 400,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 224, 178,0.9)",
            padding: "20px",
            borderRadius: "20px",
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
            textAlign: "center",
            minWidth: "400px",
          }}
        >
          <h2 style={{ marginBottom: "15px" }}>Leaderboard - Top 10</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "center",
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "2px solid #FF7043", padding: "10px" }}>
                  Name
                </th>
                <th style={{ borderBottom: "2px solid #FF7043", padding: "10px" }}>
                  Email
                </th>
                <th style={{ borderBottom: "2px solid #FF7043", padding: "10px" }}>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, index) => (
                <tr key={index}>
                  <td style={{ padding: "8px" }}>{p.name}</td>
                  <td style={{ padding: "8px" }}>{p.email}</td>
                  <td style={{ padding: "8px" }}>{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Play Again button */}
          <button
            onClick={playAgain}
            style={{
              marginTop: "20px",
              padding: "10px 25px",
              fontSize: "20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#FF5722",
              color: "white",
              cursor: "pointer",
              boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}