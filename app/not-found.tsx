'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center text-white">
      <div className="text-center space-y-3">
        <p className="text-lg text-slate-200">잘못된 경로입니다.</p>
        <p className="text-sm text-slate-400">홈으로 이동 중…</p>
      </div>
    </div>
  );
}



