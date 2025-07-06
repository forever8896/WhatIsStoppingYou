'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function WhyPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, type: string, x: number, y: number}>>([]);
  const [showStats, setShowStats] = useState(false);
  const router = useRouter();

  // Generate floating elements
  useEffect(() => {
    const interval = setInterval(() => {
      const elements = ['🎰', '💰', '🎲', '💎', '🎯', '🃏', '💫', '✨', '🎊', '🎉', '🚀', '💸', '🏆', '🎪'];
      const newElement = {
        id: Date.now() + Math.random(),
        type: elements[Math.floor(Math.random() * elements.length)],
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      setFloatingElements(prev => [...prev.slice(-12), newElement]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  // Show stats after initial load
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    {
      title: "The Problem",
      subtitle: "Traditional Crowdfunding is BROKEN",
      content: [
        "🚫 Projects fail to reach goals and lose ALL funding",
        "😴 Boring donation experience with no excitement",
        "💔 Backers get nothing when projects don&apos;t succeed",
        "📉 No ongoing engagement after initial pledge",
        "🎭 Fake promises with no real accountability"
      ],
      color: "from-red-500 to-orange-500"
    },
    {
      title: "Our Solution",
      subtitle: "Donation Platform + Casino = MAGIC",
      content: [
        "🎰 Every pledge is a ticket to WIN real RON prizes",
        "💎 Soulbound NFTs prove your support forever",
        "🎲 Automatic raffles every 10% of goal progress",
        "🚀 Instant funding - no waiting for goal completion",
        "🏆 Community-driven with transparent blockchain records"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "The Casino Mechanics",
      subtitle: "Where Generosity Meets Excitement",
      content: [
        "🎯 Platform takes 5% fee for the prize pool",
        "🎰 40% goes to campaign raffles (triggered by progress)",
        "🌟 30% funds daily platform-wide raffles",
        "💰 20% supports platform development",
        "🎲 10% reserved for special events and bonuses"
      ],
      color: "from-yellow-500 to-red-500"
    },
    {
      title: "Why This Works",
      subtitle: "Psychology + Technology = Success",
      content: [
        "🧠 Gamification increases engagement by 300%",
        "🎊 Excitement drives more pledges than guilt",
        "🔗 Blockchain ensures transparency and trust",
        "💎 Soulbound NFTs create lasting community bonds",
        "🎰 Win-win: Support dreams AND win prizes"
      ],
      color: "from-green-500 to-blue-500"
    }
  ];

  const stats = [
    { value: "73%", label: "More Engagement", icon: "📈" },
    { value: "5x", label: "Higher Success Rate", icon: "🚀" },
    { value: "24/7", label: "Automatic Raffles", icon: "🎰" },
    { value: "100%", label: "Transparent", icon: "🔍" }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated background gradients */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 80% 80%, rgba(255, 20, 147, 0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 60% 40%, rgba(138, 43, 226, 0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 30% 70%, rgba(0, 255, 127, 0.3) 0%, transparent 60%)",
              "radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 60%)"
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating elements */}
        <AnimatePresence>
          {floatingElements.map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-2xl opacity-20 emoji-preserve"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
              animate={{ opacity: 0.4, scale: 1, rotate: 0, y: -300 }}
              exit={{ opacity: 0, scale: 0.3, rotate: 180 }}
              transition={{ duration: 8, ease: "easeOut" }}
            >
              {item.type}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.div
            className="text-2xl font-bold text-white cursor-pointer relative"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            <span className="relative z-10">Helpify</span>
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
          
          <div className="flex items-center gap-8">
            <motion.button
              onClick={() => router.push('/create')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              CREATE
            </motion.button>
            <motion.button
              onClick={() => router.push('/help')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              HELP
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(255,215,0,0.3)',
                  '0 0 40px rgba(255,20,147,0.4)',
                  '0 0 20px rgba(255,215,0,0.3)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              WHY WE EXIST
            </motion.h1>
            <motion.p
              className="text-2xl text-white/70 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              We&apos;re revolutionizing crowdfunding by combining the generosity of donations with the excitement of casino mechanics
            </motion.p>
            <motion.div
              className="flex justify-center gap-6 text-4xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {['🎰', '💰', '🎲', '💎', '🎯'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="emoji-preserve"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <motion.div
                      className="text-3xl mb-2"
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      <span className="emoji-preserve">{stat.icon}</span>
                    </motion.div>
                    <motion.div
                      className="text-3xl font-bold text-white mb-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-white/70 text-sm font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              {sections.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    currentSection === index
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {index + 1}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h2
                  className={`text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${sections[currentSection].color} bg-clip-text text-transparent`}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                  }}
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {sections[currentSection].title}
                </motion.h2>
                <motion.p
                  className="text-xl text-white/80 font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {sections[currentSection].subtitle}
                </motion.p>
              </motion.div>

              <div className="space-y-6">
                {sections[currentSection].content.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 10 }}
                  >
                    <motion.div
                      className="text-2xl flex-shrink-0"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.2
                      }}
                    >
                      <span className="emoji-preserve">{item.split(' ')[0]}</span>
                    </motion.div>
                    <div className="text-lg text-white/90 font-medium">
                      {item.substring(item.indexOf(' ') + 1)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <motion.button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-500 hover:to-gray-600 transition-all duration-300"
              whileHover={{ scale: currentSection === 0 ? 1 : 1.05 }}
              whileTap={{ scale: currentSection === 0 ? 1 : 0.95 }}
            >
              ← Previous
            </motion.button>
            <motion.button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              disabled={currentSection === sections.length - 1}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
              whileHover={{ scale: currentSection === sections.length - 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentSection === sections.length - 1 ? 1 : 0.95 }}
            >
              Next →
            </motion.button>
          </div>

          {/* Call to Action */}
          <motion.div
            className="text-center mt-16 p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-3xl backdrop-blur-sm"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <motion.h3
              className="text-3xl font-bold mb-4 text-white"
              animate={{
                textShadow: [
                  '0 0 20px rgba(255,255,255,0.3)',
                  '0 0 30px rgba(255,20,147,0.4)',
                  '0 0 20px rgba(255,255,255,0.3)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Ready to Turn Dreams into Reality?
            </motion.h3>
            <motion.p
              className="text-xl text-white/80 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Join the revolution where supporting others means winning together
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => router.push('/create')}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 rounded-2xl font-bold text-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="emoji-preserve">🚀</span> Launch Your Dream
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0"
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              <motion.button
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="emoji-preserve">🎰</span> Explore Campaigns
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 opacity-0"
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </div>
          </motion.div>

          {/* Fun Facts Section */}
          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {[
              {
                icon: '🎲',
                title: 'Provably Fair',
                desc: 'All raffles use Ronin VRF for transparent, verifiable randomness'
              },
              {
                icon: '💎',
                title: 'Permanent Proof',
                desc: 'Soulbound NFTs create lasting bonds between creators and supporters'
              },
              {
                icon: '🌍',
                title: 'Global Impact',
                desc: 'Supporting dreams worldwide while building a thriving community'
              }
            ].map((fact, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="text-4xl mb-4"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.7
                  }}
                >
                  <span className="emoji-preserve">{fact.icon}</span>
                </motion.div>
                <h4 className="text-xl font-semibold text-white mb-2">{fact.title}</h4>
                <p className="text-white/70">{fact.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 