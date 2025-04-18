import React, { useEffect, useRef } from 'react';
import useAppStore from '../store';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isMobileRef = useRef<boolean>(false);
  const store = useAppStore();
  const isListening = store?.isListening ?? false;
  const themeMode = store?.themeMode ?? 'dark';

  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * (isMobileRef.current ? 1.5 : 2) + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5,
      color: Math.random() > 0.5 ? 
        (themeMode === 'dark' ? '#3B82F6' : '#2563EB') : 
        (themeMode === 'dark' ? '#A855F7' : '#8B5CF6')
    });

    // Initialize particles
    const particleCount = isMobileRef.current ? 12 : 35;
    particlesRef.current = Array(particleCount).fill(null).map(createParticle);

    let animationFrame: number;
    let lastFrame = performance.now();
    const targetFPS = isMobileRef.current ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const animate = () => {
      if (!canvas || !ctx) return;
      
      const now = performance.now();
      const elapsed = now - lastFrame;
      
      if (elapsed < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      lastFrame = now - (elapsed % frameInterval);
      
      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current?.forEach(particle => {
        if (!particle) return;
        const speedMultiplier = isMobileRef.current ? 0.75 : 1;
        
        particle.x += particle.speedX * (isListening ? 2 : 1) * speedMultiplier;
        particle.y += particle.speedY * (isListening ? 2 : 1) * speedMultiplier;
        particle.opacity += (Math.random() - 0.5) * 0.01;

        // Reset particles that go off screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Keep opacity in bounds
        particle.opacity = Math.max(0.1, Math.min(0.5, particle.opacity));

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [isListening, themeMode]);

  return (
    <div className="fixed inset-0 -z-1 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 ${
          themeMode === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
        } rounded-full filter blur-[120px] sm:blur-[180px] opacity-[1.23]`} />
        <div className={`absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 ${
          themeMode === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
        } rounded-full filter blur-[120px] sm:blur-[180px] opacity-[1.23]`} />
      </div>
    </div>
  );
};

export default AnimatedBackground;