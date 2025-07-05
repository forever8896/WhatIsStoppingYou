'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function WhyPage() {
  const [activeSection, setActiveSection] = useState<'intro' | 'individuals' | 'founders' | 'donate' | 'trust'>('intro');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const sections = [
    { id: 'intro', title: 'The Problem', emoji: '🤔' },
    { id: 'individuals', title: 'Dreamers', emoji: '💭' },
    { id: 'founders', title: 'Crypto Rich', emoji: '💎' },
    { id: 'donate', title: 'Why Donate?', emoji: '🤝' },
    { id: 'trust', title: 'Trust Game', emoji: '🎲' }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.div
            className="text-2xl font-bold text-white cursor-pointer"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            WhatsStoppingYou
          </motion.div>
          
          <div className="flex items-center gap-8">
            <motion.button
              onClick={() => router.push('/help')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              HELP
            </motion.button>
            <motion.button
              onClick={() => router.push('/create')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              CREATE
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        {/* Section Navigation */}
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <motion.h1
            className="text-6xl md:text-8xl font-black text-center mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            WHY?
          </motion.h1>

          {/* Interactive Section Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                onMouseEnter={() => setHoveredCard(section.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  activeSection === section.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-4xl mb-2">{section.emoji}</div>
                <div className="text-sm font-semibold">{section.title}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {/* Intro Section */}
            {activeSection === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-8"
              >
                <motion.h2
                  className="text-4xl md:text-6xl font-bold"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Money Stops Dreams
                </motion.h2>
                <motion.p
                  className="text-xl md:text-2xl text-white/80 leading-relaxed"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Every day, brilliant ideas die because of one thing: funding.
                  <br />
                  Traditional crowdfunding takes 30% fees and excludes millions.
                  <br />
                  <span className="text-purple-400 font-semibold">Ronin makes it instant, cheap, and global.</span>
                </motion.p>
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-6xl">💡➡️🌐</div>
                </motion.div>
              </motion.div>
            )}

            {/* Individuals Section */}
            {activeSection === 'individuals' && (
              <motion.div
                key="individuals"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <motion.h2
                  className="text-4xl md:text-6xl font-bold text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  For Dreamers
                </motion.h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div
                    className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-8 rounded-2xl border border-purple-500/20"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-2xl font-bold mb-4 text-purple-300">The Problem</h3>
                    <p className="text-lg text-white/80 leading-relaxed">
                      You have the idea. You have the passion. You have the skills.
                      <br /><br />
                      But Kickstarter takes 30% fees. GoFundMe blocks crypto. Banks say no.
                      <br /><br />
                      <span className="text-red-400 font-semibold">Your dream dies in bureaucracy.</span>
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-green-900/30 to-blue-900/30 p-8 rounded-2xl border border-green-500/20"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-2xl font-bold mb-4 text-green-300">The Solution</h3>
                    <p className="text-lg text-white/80 leading-relaxed">
                      Create your campaign. Set your goal. Share your story.
                      <br /><br />
                      Supporters pledge with Ronin Wallet. No middleman. No borders.
                      <br /><br />
                      <span className="text-green-400 font-semibold">Your dream goes live instantly.</span>
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  className="text-center text-6xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  🚀
                </motion.div>
              </motion.div>
            )}

            {/* Founders Section */}
            {activeSection === 'founders' && (
              <motion.div
                key="founders"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <motion.h2
                  className="text-4xl md:text-6xl font-bold text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  For Project Founders
                </motion.h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div
                    className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 p-8 rounded-2xl border border-yellow-500/20"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-2xl font-bold mb-4 text-yellow-300">The Trap</h3>
                    <p className="text-lg text-white/80 leading-relaxed">
                      You launched a meme token. An NFT project. It took off!
                      <br /><br />
                      Your project is worth millions. But you can't touch it.
                      <br /><br />
                      <span className="text-yellow-400 font-semibold">Selling = rugging your own community.</span>
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-8 rounded-2xl border border-blue-500/20"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="text-2xl font-bold mb-4 text-blue-300">The Solution</h3>
                    <p className="text-lg text-white/80 leading-relaxed">
                      Create a campaign for your project development. 
                      <br /><br />
                      Your community can fund real utility. Game development. Apps. Tools.
                      <br /><br />
                      <span className="text-blue-400 font-semibold">Turn hype into substance.</span>
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="text-6xl mb-4">🚀💎</div>
                  <p className="text-xl text-white/70">
                    From meme to machine - fund your project's future
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Donate Section */}
            {activeSection === 'donate' && (
              <motion.div
                key="donate"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <motion.h2
                  className="text-4xl md:text-6xl font-bold text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Why Should I Pledge?
                </motion.h2>
                
                <motion.div
                  className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 p-8 rounded-2xl border border-pink-500/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-6xl mb-6">🎁</div>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-6">
                    Same reason you bought that meme coin because some influencer said 
                    <span className="text-pink-400 font-semibold"> "Big news coming"</span> 
                    in a Twitter Space.
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed">
                    But here you get something real: a <span className="text-purple-400 font-semibold">Soulbound NFT</span> that proves you believed first.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: '🏆', title: 'Soulbound NFT', desc: 'Permanent proof you supported early' },
                    { icon: '💰', title: 'Revenue Share', desc: 'Weekly earnings from platform fees' },
                    { icon: '🌟', title: 'Be Part of History', desc: 'Fund the next breakthrough' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/5 p-6 rounded-xl border border-white/10 text-center hover:border-white/30 transition-all duration-300"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-white/70">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="bg-gradient-to-br from-indigo-900/30 to-cyan-900/30 p-6 rounded-2xl border border-indigo-500/20 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <h3 className="text-xl font-bold mb-3 text-indigo-300">The Revenue Share Pool</h3>
                  <p className="text-white/80">
                    Every week, platform earnings get distributed to all pledgers based on their total pledge ratio.
                    <br />
                    <span className="text-indigo-400 font-semibold">Your support literally pays you back.</span>
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Trust Section */}
            {activeSection === 'trust' && (
              <motion.div
                key="trust"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <motion.h2
                  className="text-4xl md:text-6xl font-bold text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  It's All About Trust
                </motion.h2>
                
                <motion.div
                  className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-8 rounded-2xl border border-indigo-500/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-6xl mb-6">🎲</div>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
                    Everything is a game of trust.
                    <br />
                    Every system collapses without trust in the people.
                  </p>
                  <motion.div
                    className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    You choose the people.
                    <br />
                    You ARE the people.
                  </motion.div>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/20">
                    <h3 className="text-xl font-bold mb-3 text-red-300">Traditional Crowdfunding</h3>
                    <p className="text-white/80">
                      Kickstarter, GoFundMe decide what gets funded. 30% fees. Geographic restrictions.
                      <br />
                      <span className="text-red-400">You trust their gatekeepers.</span>
                    </p>
                  </div>
                  <div className="bg-green-900/20 p-6 rounded-xl border border-green-500/20">
                    <h3 className="text-xl font-bold mb-3 text-green-300">Our System</h3>
                    <p className="text-white/80">
                      You browse campaigns. You choose who to support. Your Ronin Wallet, your decision.
                      <br />
                      <span className="text-green-400">You trust your own judgment.</span>
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.button
                    onClick={() => router.push('/create')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-xl font-bold hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Building Trust
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 