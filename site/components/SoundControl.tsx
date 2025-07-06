import { motion } from 'framer-motion';
import { useSounds } from '@/hooks/useSounds';

interface SoundControlProps {
  className?: string;
}

export default function SoundControl({ className = '' }: SoundControlProps) {
  const { soundEnabled, toggleSound } = useSounds();

  return (
    <motion.button
      onClick={toggleSound}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
    >
      <motion.span
        className="text-lg"
        animate={soundEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: soundEnabled ? Infinity : 0, repeatDelay: 2 }}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </motion.span>
      <span className="text-sm text-white/70 hidden sm:inline">
        {soundEnabled ? 'Sound On' : 'Sound Off'}
      </span>
    </motion.button>
  );
} 