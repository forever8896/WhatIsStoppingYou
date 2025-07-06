'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new gamified campaigns page
    router.replace('/campaigns');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-6xl mb-4 emoji-preserve">🎮</div>
        <div className="text-xl">Redirecting to gamified campaigns...</div>
      </div>
    </div>
  );
} 