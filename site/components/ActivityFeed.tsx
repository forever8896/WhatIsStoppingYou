'use client';

import { motion } from 'framer-motion';

interface ActivityFeed {
  id: string;
  type: 'pledge' | 'raffle_win' | 'raffle_request' | 'campaign_created';
  message: string;
  timestamp: Date;
  user?: string;
  amount?: string;
}

interface ActivityFeedProps {
  activities: ActivityFeed[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        🔥 Live Activity Feed
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-white/50 text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <div>Waiting for the action to begin...</div>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 text-sm py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                activity.type === 'pledge' ? 'bg-purple-500' :
                activity.type === 'raffle_win' ? 'bg-yellow-500' :
                activity.type === 'raffle_request' ? 'bg-pink-500' :
                'bg-green-500'
              }`}></div>
              <span className="text-white/90 flex-1">{activity.message}</span>
              <span className="text-white/50 text-xs">
                {activity.timestamp.toLocaleTimeString()}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
} 