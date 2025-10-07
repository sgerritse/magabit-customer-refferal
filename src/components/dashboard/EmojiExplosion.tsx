import { useEffect, useState } from "react";

interface Emoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

interface EmojiExplosionProps {
  active: boolean;
}

const celebrationEmojis = ['🎉', '🎊', '✨', '🌟', '⭐', '💫', '🎆', '🎇', '😊', '🥳', '🎈', '🏆', '💪', '👏', '🙌'];

export const EmojiExplosion = ({ active }: EmojiExplosionProps) => {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    if (!active) {
      setEmojis([]);
      setNextId(0);
      return;
    }

    console.log('🎉 Emoji explosion activated!');

    // Create firework bursts at different positions
    const createBurst = (burstX: number, startId: number) => {
      const newEmojis: Emoji[] = [];
      const emojiCount = 15;

      for (let i = 0; i < emojiCount; i++) {
        const angle = (Math.PI * 2 * i) / emojiCount + (Math.random() - 0.5) * 0.5;
        const speed = 3 + Math.random() * 3;
        
        newEmojis.push({
          id: startId + i,
          emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
          x: burstX,
          y: 100, // Start from bottom
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 15, // Much stronger upward velocity
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 6,
        });
      }

      return newEmojis;
    };

    let currentId = 0;

    // Create multiple bursts at different times and positions (even slower timing)
    const burstPositions = [
      { x: 30, delay: 0 },
      { x: 50, delay: 600 },
      { x: 70, delay: 1200 },
      { x: 40, delay: 1800 },
      { x: 60, delay: 2400 },
    ];

    const burstTimeouts: NodeJS.Timeout[] = [];

    burstPositions.forEach(({ x, delay }) => {
      const timeout = setTimeout(() => {
        console.log(`💥 Creating burst at x=${x}`);
        const burst = createBurst(x, currentId);
        currentId += burst.length;
        setEmojis(prev => [...prev, ...burst]);
      }, delay);
      burstTimeouts.push(timeout);
    });

    // Animation loop (slower movement)
    const animationInterval = setInterval(() => {
      setEmojis(prev => 
        prev.map(emoji => ({
          ...emoji,
          x: emoji.x + emoji.vx * 0.1,
          y: emoji.y + emoji.vy * 0.1,
          vy: emoji.vy + 0.3, // Very slow gravity
          rotation: emoji.rotation + emoji.rotationSpeed,
        })).filter(emoji => emoji.y < 130 && emoji.y > -20) // Remove emojis that fall off screen
      );
    }, 16);

    // Clear after 5 seconds
    const clearTimer = setTimeout(() => {
      setEmojis([]);
    }, 5000);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(clearTimer);
      burstTimeouts.forEach(t => clearTimeout(t));
    };
  }, [active]);

  if (!active || emojis.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          className="absolute text-4xl md:text-5xl"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            transform: `translate(-50%, -50%) rotate(${emoji.rotation}deg)`,
            opacity: emoji.y > 100 ? 0 : emoji.y < 0 ? 0 : 1,
            textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};
