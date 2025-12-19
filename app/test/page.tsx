'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { questions, type Question } from '@/constants/questions';
import { calculateResultDetailed } from '@/utils/calculateResult';

/**
 * Fisher-Yates 알고리즘을 사용한 배열 셔플 함수
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TestPage() {
  const router = useRouter();
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 문항 섞기
  useEffect(() => {
    const shuffled = shuffleArray(questions);
    setShuffledQuestions(shuffled);
    setIsLoading(false);
  }, []);

  const currentQuestion = shuffledQuestions[currentIndex];
  const total = shuffledQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  const handleAnswer = (score: number) => {
    if (!currentQuestion) return;

    // ✅ 상태 업데이트 비동기 이슈 방지: nextAnswers를 먼저 만들고 동일 값으로 set + 계산에 사용
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: score,
    };
    setAnswers(nextAnswers);

    // 다음 문항으로 이동
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 모든 문항 완료 - 결과 계산 및 리다이렉트
      const { type, averages } = calculateResultDetailed(nextAnswers);
      const qs = new URLSearchParams({
        e: averages.e.toFixed(2),
        i: averages.i.toFixed(2),
        pi: averages.pi.toFixed(2),
      }).toString();
      // ✅ 정적 export 환경에서 가장 확실한 이동: 전체 페이지 네비게이션
      // trailingSlash: true와 일치하도록 경로 끝에 /를 반드시 포함
      // 경로가 깨지지 않도록 명시적으로 구성
      const resultPath = `/result/${type}/`;
      const fullUrl = qs ? `${resultPath}?${qs}` : resultPath;
      // 절대 경로로 확실하게 이동 (상대 경로 오류 방지)
      window.location.href = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"
        style={{
          minHeight: '100vh',
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-white text-xl" style={{ color: 'white', fontSize: '1.25rem' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white"
      style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        width: '100%',
      }}
    >
      {/* Progress Bar */}
      <div
        className="w-full h-1 bg-slate-700"
        style={{ width: '100%', height: '4px', backgroundColor: '#334155' }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
          style={{
            height: '100%',
            background:
              'linear-gradient(90deg, rgba(96,165,250,1), rgba(192,132,252,1), rgba(244,114,182,1))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <div
        className="container mx-auto px-4 py-12 max-w-2xl"
        style={{
          maxWidth: '42rem',
          marginInline: 'auto',
          padding: '3rem 1rem',
        }}
      >
        {/* Progress Text */}
        <div className="text-center mb-8 text-slate-400" style={{ textAlign: 'center', marginBottom: '2rem', color: '#94a3b8' }}>
          {answeredCount} / {total}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700/50"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.55)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
              }}
            >
              <h2
                className="text-2xl font-semibold mb-8 leading-relaxed"
                style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.6 }}
              >
                {currentQuestion.text}
              </h2>

              {/* Answer Options */}
              <div
                className="grid grid-cols-7 gap-3 mt-8"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '0.75rem',
                  marginTop: '2rem',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                  <motion.button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 
                             border border-slate-600/50 hover:border-purple-400/50
                             transition-colors duration-200 font-medium
                             focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    style={{
                      padding: '0.75rem 0.75rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(51, 65, 85, 0.55)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {score}
                  </motion.button>
                ))}
              </div>

              {/* Scale Labels */}
              <div
                className="flex justify-between mt-4 text-sm text-slate-400"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                }}
              >
                <span>전혀 아니다</span>
                <span>매우 그렇다</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

