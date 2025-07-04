'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [phase, setPhase] = useState<'initial' | 'typing' | 'complete' | 'fadeOut' | 'money' | 'ask'>('initial');
  const [displayText, setDisplayText] = useState('');
  const router = useRouter();
  
  const initialText = "What's Stopping You?";
  
  useEffect(() => {
    const sequence = async () => {
      // Initial delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Start typing
      setPhase('typing');
      
      // Type each character
      for (let i = 0; i <= initialText.length; i++) {
        setDisplayText(initialText.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      setPhase('complete');
      
      // Wait before fade out
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Fade out
      setPhase('fadeOut');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show MONEY
      setPhase('money');
      
      // Wait before showing ASK
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show ASK
      setPhase('ask');
    };
    
    sequence();
  }, []);

  const handleAskClick = () => {
    router.push('/create');
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Elegant Animated Background */}
      <div className="absolute inset-0">
        {/* Pure black base */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Subtle animated accent overlays */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Minimal floating orbs */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-white/3 backdrop-blur-sm"
            style={{
              width: `${Math.random() * 150 + 80}px`,
              height: `${Math.random() * 150 + 80}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 60 - 30, 0],
              y: [0, Math.random() * 60 - 30, 0],
              scale: [1, 1.05, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: Math.random() * 15 + 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
        
        {/* Subtle particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-px h-px bg-white/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 4,
              repeat: Infinity,
              ease: "easeOut",
              delay: Math.random() * 8
            }}
          />
        ))}
      </div>
      
      <div className="relative text-center z-10">
        <AnimatePresence mode="wait">
          {/* Initial Question */}
          {phase !== 'money' && phase !== 'ask' && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'fadeOut' ? 0 : 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative"
            >
              <div className="flex items-center justify-center flex-wrap">
                {initialText.split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={index < displayText.length ? 
                      { opacity: 1, y: 0, scale: 1 } : 
                      { opacity: 0, y: 50, scale: 0.8 }
                    }
                    transition={{ 
                      type: "spring", 
                      damping: 12, 
                      stiffness: 200 
                    }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontWeight: 900,
                      textShadow: '0 0 30px rgba(255,255,255,0.3)'
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
                
                {/* Animated cursor */}
                {phase === 'typing' && (
                  <motion.span
                    animate={{
                      opacity: [0, 0, 1, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-white ml-2"
                  >
                    |
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
          
          {/* MONEY Text */}
          {phase === 'money' && (
            <motion.div
              key="money"
              initial={{ opacity: 0, scale: 0.3, rotateX: -90, y: 100 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 1.2
              }}
              className="relative"
            >
              <div className="relative">
                {/* Main MONEY text */}
                <motion.h1 
                  className="text-7xl md:text-9xl lg:text-[12rem] font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                >
                  MONEY
                </motion.h1>
                
                {/* Subtle glow */}
                <motion.div
                  className="absolute inset-0 text-7xl md:text-9xl lg:text-[12rem] font-black text-yellow-400 opacity-10 blur-2xl"
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                >
                  MONEY
                </motion.div>
                
                {/* Elegant sparkles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${30 + Math.random() * 40}%`,
                      top: `${30 + Math.random() * 40}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.4
                    }}
                  />
                ))}
              </div>
              
              {/* Subtitle */}
              <motion.p
                className="text-xl md:text-2xl text-white/80 mt-8 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                The only thing between you and your dreams
              </motion.p>
            </motion.div>
          )}
          
          {/* ASK Section */}
          {phase === 'ask' && (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <motion.span
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-white"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                  }}
                >
                  Just
                </motion.span>
                
                <motion.button
                  onClick={handleAskClick}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25"
                  initial={{ opacity: 0, x: 30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 40px rgba(168, 85, 247, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    delay: 0.4, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                  }}
                >
                  ASK
                </motion.button>
              </div>
              
              {/* Subtle instruction */}
              <motion.p
                className="text-lg md:text-xl text-white/60 mt-8 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Click to create your campaign
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
