'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ParticleProps {
  trigger: boolean;
  type: 'win' | 'pledge' | 'raffle';
}

export default function ParticleEffect({ trigger, type }: ParticleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
      symbol: string;
    }> = [];

    const colors = {
      win: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      pledge: ['#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24'],
      raffle: ['#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#F59E0B']
    };

    const symbols = {
      win: ['🏆', '🎉', '⭐', '💎', '🔥'],
      pledge: ['💰', '🎯', '🚀', '💫', '✨'],
      raffle: ['🎰', '🎲', '🔮', '🎪', '🎭']
    };

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: colors[type][Math.floor(Math.random() * colors[type].length)],
        size: Math.random() * 20 + 10,
        life: 1,
        symbol: symbols[type][Math.floor(Math.random() * symbols[type].length)]
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.size *= 0.98;

        ctx.globalAlpha = particle.life;
        ctx.font = `${particle.size}px serif`;
        ctx.fillStyle = particle.color;
        ctx.fillText(particle.symbol, particle.x, particle.y);

        if (particle.life <= 0) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [trigger, type]);

  if (!trigger) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
} 