'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);
  const router = useRouter();

  // Refs for scroll animations
  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const howItWorksRef = useRef(null);
  const valueRef = useRef(null);
  const ctaRef = useRef(null);

  // InView hooks with better settings
  const isHeroInView = useInView(heroRef, { once: true, margin: "-50px" });
  const isProblemInView = useInView(problemRef, { once: true, margin: "-50px" });
  const isSolutionInView = useInView(solutionRef, { once: true, margin: "-50px" });
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, margin: "-50px" });
  const isValueInView = useInView(valueRef, { once: true, margin: "-50px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-50px" });

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Create Campaigns',
      description: 'Launch your project and get funded',
      detail: 'Turn your ideas into reality with community support'
    },
    {
      icon: '🎰',
      title: 'Win Prizes',
      description: 'Every donation = chance to win',
      detail: 'Sponsors add NFTs, tokens, and exclusive rewards'
    },
    {
      icon: '💰',
      title: 'Daily Rewards',
      description: 'Daily prize draws for recent donors',
      detail: 'Random winners selected every 24 hours'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/20" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 backdrop-blur-sm"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white cursor-pointer flex items-center gap-2"
            onClick={() => router.push('/')}
          >
            <span className="text-4xl">🚀</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Helpify
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <button
              onClick={() => router.push('/campaigns')}
              className="text-white/80 hover:text-white transition-colors font-semibold"
            >
              🎯 Campaigns
            </button>
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              ✨ Create
            </button>
          </motion.div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          className="text-center py-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isHeroInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-8xl mb-6"
          >
            🧠💫
          </motion.div>
          
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Crowdfunding
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              With Prizes
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Support great projects and win rewards while doing it
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <motion.button
              onClick={() => router.push('/create')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/25"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Start a Campaign
            </motion.button>
            <motion.button
              onClick={() => router.push('/campaigns')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎯 Browse Projects
            </motion.button>
          </motion.div>
        </motion.section>

        {/* The Problem Section */}
        <motion.section
          ref={problemRef}
          className="py-20"
        >
          <motion.div
            className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-12 border border-red-500/30"
            initial={{ opacity: 0, x: -50 }}
            animate={isProblemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isProblemInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">😭</div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The Problem
              </h2>
              <p className="text-2xl text-red-300 mb-4 font-semibold">
                Donating feels unrewarding
              </p>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                You support a cause, feel good for a moment, then nothing. 
                Your brain craves that reward feedback loop.
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* The Solution Section */}
        <motion.section
          ref={solutionRef}
          className="py-20"
        >
          <motion.div
            className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl p-12 border border-green-500/30"
            initial={{ opacity: 0, x: 50 }}
            animate={isSolutionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isSolutionInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🎁✨</div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The Solution
              </h2>
              <p className="text-2xl text-green-300 mb-4 font-semibold">
                Win prizes while supporting causes
              </p>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Every donation gives you a chance to win. 
                Support amazing projects AND get rewarded for it.
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          ref={howItWorksRef}
          className="py-20"
        >
          <div className="text-center mb-16">
            <div className="text-6xl mb-4">
              🎮
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`p-8 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-lg shadow-purple-500/25'
                    : 'bg-black/30 backdrop-blur-sm border-white/10 hover:border-white/20'
                }`}
                onClick={() => setActiveFeature(index)}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                }}
                style={{
                  background: activeFeature === index 
                    ? 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1), rgba(0, 0, 0, 0.3))'
                    : 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.3))'
                }}
              >
                <motion.div 
                  className="text-6xl mb-4 text-center"
                  animate={activeFeature === index ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-center mb-4">
                  {feature.description}
                </p>
                <p className="text-purple-300 text-center text-sm">
                  {feature.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Value Proposition */}
        <motion.section
          ref={valueRef}
          className="py-20"
        >
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={isValueInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isValueInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-6xl mb-6"
            >
              🤝💎
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sponsors Power the Prizes
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Anyone can sponsor prizes to incentivize donations to causes they care about.
              NFT projects, token communities, brands, or individuals can deposit rewards
              to boost funding for meaningful projects.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                animate={isValueInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold text-white mb-2">Causes Get More Funding</h3>
                <p className="text-gray-400 text-sm">Prize incentives attract more donors and larger donations</p>
              </motion.div>
              
              <motion.div
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                animate={isValueInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <div className="text-4xl mb-3">📢</div>
                <h3 className="text-lg font-bold text-white mb-2">Sponsors Get Exposure</h3>
                <p className="text-gray-400 text-sm">Connect with passionate communities who care about causes</p>
              </motion.div>
              
              <motion.div
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                animate={isValueInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="text-4xl mb-3">🎁</div>
                <h3 className="text-lg font-bold text-white mb-2">Donors Get Rewards</h3>
                <p className="text-gray-400 text-sm">Win NFTs, tokens, and exclusive items while supporting causes</p>
              </motion.div>
            </div>
            
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          ref={ctaRef}
          className="py-20 text-center"
        >
          <motion.div
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30"
            initial={{ opacity: 0, y: 50 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isCtaInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-6xl mb-6"
            >
              🚀
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Join the new way of crowdfunding where everyone wins.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.button
                onClick={() => router.push('/create')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Create Campaign
              </motion.button>
              <motion.button
                onClick={() => router.push('/campaigns')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎯 Support Projects
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
