'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [phase, setPhase] = useState<'initial' | 'typing' | 'complete' | 'fadeOut' | 'casino' | 'donation' | 'ask'>('initial');
  const [displayText, setDisplayText] = useState('');
  const [showNavbar, setShowNavbar] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{id: number, value: string, x: number, y: number}>>([]);
  const router = useRouter();
  
  const initialText = "What's Stopping You?";
  
  // Generate floating numbers for casino effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (phase === 'casino' || phase === 'donation' || phase === 'ask') {
        const casinoElements = ['🎰', '💰', '🎲', '💎', '🎯', '🃏', '🎊', '🎉'];
        const newNumber = {
          id: Date.now() + Math.random(),
          value: Math.random() > 0.7 ? `+${Math.floor(Math.random() * 100)}` : casinoElements[Math.floor(Math.random() * casinoElements.length)],
          x: Math.random() * 100,
          y: Math.random() * 100
        };
        setFloatingNumbers(prev => [...prev.slice(-8), newNumber]);
      }
    }, 1200);
    
    return () => clearInterval(interval);
  }, [phase]);
  
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fade out
      setPhase('fadeOut');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show CASINO
      setPhase('casino');
      
      // Wait before showing DONATION
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Show DONATION
      setPhase('donation');
      
      // Wait before showing ASK
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Show ASK
      setPhase('ask');
      
      // Wait before showing navbar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show navbar
      setShowNavbar(true);
    };
    
    sequence();
  }, []);

  const handleAskClick = () => {
    router.push('/create');
  };

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Navbar */}
      <AnimatePresence>
        {showNavbar && (
          <motion.nav
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 p-6"
          >
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              {/* Logo/Brand */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-2xl font-bold text-white cursor-pointer relative"
                onClick={() => handleNavClick('/')}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 900,
                }}
              >
                <span className="relative z-10">WhatsStoppingYou</span>
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-20 blur"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              
              {/* Navigation Items */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-8"
              >
                <motion.button
                  onClick={() => handleNavClick('/campaigns')}
                  className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  CAMPAIGNS
                  <motion.div
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 group-hover:w-full transition-all duration-300"
                    whileHover={{ width: '100%' }}
                  />
                </motion.button>
                
                <motion.button
                  onClick={() => handleNavClick('/why')}
                  className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  WHY
                  <motion.div
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 group-hover:w-full transition-all duration-300"
                    whileHover={{ width: '100%' }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Consistent Moving Background */}
      <div className="absolute inset-0">
        {/* Deep space black base */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Consistent casino-themed animated background */}
        <motion.div
          className="absolute inset-0 opacity-15"
          style={{
            background: "radial-gradient(circle at 30% 70%, rgba(255, 215, 0, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 20, 147, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(138, 43, 226, 0.1) 0%, transparent 50%)"
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating casino orbs that move consistently */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`casino-orb-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-yellow-400/10 to-pink-500/10 backdrop-blur-sm border border-white/5"
            style={{
              width: `${Math.random() * 80 + 40}px`,
              height: `${Math.random() * 80 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
        
        {/* Floating casino elements */}
        <AnimatePresence>
          {floatingNumbers.map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-2xl font-bold pointer-events-none emoji-preserve"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                color: item.value.includes('+') ? '#fbbf24' : 'initial',
              }}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 0.6, scale: 1, y: -150 }}
              exit={{ opacity: 0, scale: 0.5, y: -300 }}
              transition={{ duration: 4, ease: "easeOut" }}
            >
              {item.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="relative text-center z-10">
        <AnimatePresence mode="wait">
          {/* Initial Question */}
          {phase !== 'casino' && phase !== 'donation' && phase !== 'ask' && (
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
          
          {/* CASINO Text - Story: The excitement begins */}
          {phase === 'casino' && (
            <motion.div
              key="casino"
              initial={{ opacity: 0, scale: 0.3, rotateY: -90, y: 100 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -100 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 1.5
              }}
              className="relative"
            >
              <div className="relative">
                {/* Main CASINO text */}
                <motion.h1 
                  className="text-6xl md:text-8xl lg:text-[10rem] font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255,215,0,0.3)',
                      '0 0 40px rgba(255,20,147,0.4)',
                      '0 0 20px rgba(255,215,0,0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="emoji-preserve">🎰</span> CASINO
                </motion.h1>
                
                {/* Neon glow effect */}
                <motion.div
                  className="absolute inset-0 text-6xl md:text-8xl lg:text-[10rem] font-black text-yellow-400 opacity-20 blur-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                >
                  <span className="emoji-preserve">🎰</span> CASINO
                </motion.div>
                
                {/* Casino symbols */}
                {['💰', '🎲', '🃏', '💎', '🎯'].map((symbol, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl emoji-preserve"
                    style={{
                      left: `${20 + (i * 15)}%`,
                      top: `${20 + (i % 2) * 60}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      rotate: [0, 360],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5
                    }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              {/* Story context */}
              <motion.p
                className="text-lg md:text-xl text-white/70 mt-8 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                Where every pledge becomes a chance to win
              </motion.p>
            </motion.div>
          )}
          
          {/* DONATION Text - Story: The heart of the platform */}
          {phase === 'donation' && (
            <motion.div
              key="donation"
              initial={{ opacity: 0, scale: 0.3, rotateY: 90, y: 100 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 1.5
              }}
              className="relative"
            >
              <div className="relative">
                {/* Main DONATION text */}
                <motion.h1 
                  className="text-5xl md:text-7xl lg:text-[8rem] font-black bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(34,197,94,0.3)',
                      '0 0 40px rgba(59,130,246,0.4)',
                      '0 0 20px rgba(34,197,94,0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="emoji-preserve">💝</span> DONATION
                </motion.h1>
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 text-5xl md:text-7xl lg:text-[8rem] font-black text-green-400 opacity-20 blur-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                >
                  <span className="emoji-preserve">💝</span> DONATION
                </motion.div>
                
                {/* Heart symbols */}
                {['💖', '🎁', '✨', '🌟', '💫'].map((symbol, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl emoji-preserve"
                    style={{
                      left: `${15 + (i * 17)}%`,
                      top: `${30 + (i % 2) * 40}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.3, 1]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3
                    }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              {/* Story context */}
              <motion.p
                className="text-lg md:text-xl text-white/70 mt-8 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                Supporting dreams while building community rewards
              </motion.p>
            </motion.div>
          )}
          
          {/* ASK Section - Story: The call to action */}
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
                  So
                </motion.span>
                
                <motion.button
                  onClick={handleAskClick}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl border-2 border-white/20 backdrop-blur-sm hover:border-white/40 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 relative overflow-hidden"
                  initial={{ opacity: 0, x: 30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 60px rgba(168, 85, 247, 0.6)"
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
                  <span className="relative z-10">ASK</span>
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-0"
                    whileHover={{ opacity: 0.2 }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Sparkle effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${20 + (i % 2) * 60}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.button>
              </div>
              
              {/* Story conclusion */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <p className="text-lg md:text-xl text-white/70 font-medium mb-4">
                  Turn your dreams into reality with community power
                </p>
                <div className="flex justify-center gap-4 text-2xl">
                  <motion.span
                    className="emoji-preserve"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎲
                  </motion.span>
                  <motion.span
                    className="emoji-preserve"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    💰
                  </motion.span>
                  <motion.span
                    className="emoji-preserve"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    🎯
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
