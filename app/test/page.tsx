'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { questions, type Question } from '@/constants/questions';
import { calculateResultDetailed } from '@/utils/calculateResult';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TestPage() {
  const total = questions.length; // ✅ 항상 27 (절대 0 안 됨)

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    const shuffled = shuffleArray(questions);
    setShuffledQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers({});
  }, []);

  // ✅ 질문 준비 전에는 진행 UI 자체를 렌더하지 않음 → 0/27 원천 봉쇄
  const ready = shuffledQuestions.length === total;
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-black text-white"
        style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}
      >
        로딩 중...
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), total - 1);
  const currentQuestion = shuffledQuestions[safeIndex];
  const currentQuestionNumber = safeIndex + 1; // ✅ 무조건 1~27
  const progress = (currentQuestionNumber / total) * 100;

  const handleAnswer = (score: number) => {
    const nextAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(nextAnswers);

    const isLastQuestion = safeIndex === total - 1;

    if (!isLastQuestion) {
      setCurrentIndex(safeIndex + 1);
      return;
    }

    try {
      const { type, averages } = calculateResultDetailed(nextAnswers);
      const qs = new URLSearchParams({
        e: averages.e.toFixed(2),
        i: averages.i.toFixed(2),
        pi: averages.pi.toFixed(2),
      }).toString();

      const resultPath = `/result/${type}/`;
      window.location.href = qs ? `${resultPath}?${qs}` : resultPath;
    } catch (err) {
      console.error(err);
      alert('결과를 계산하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', width: '100%' }}
    >
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-700" style={{ width: '100%', height: 4, backgroundColor: '#334155' }}>
        <motion.div
          className="h-full"
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

      <div className="container mx-auto px-4 py-12 max-w-2xl" style={{ maxWidth: '42rem', marginInline: 'auto', padding: '3rem 1rem' }}>
        {/* ✅ 무조건 1/27부터 */}
        <div className="text-center mb-8 text-slate-400" style={{ textAlign: 'center', marginBottom: '2rem', color: '#94a3b8' }}>
          {currentQuestionNumber} / {total}
        </div>

        <AnimatePresence mode="wait">
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
            <h2 className="text-2xl font-semibold mb-8 leading-relaxed" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.6 }}>
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-7 gap-3 mt-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.75rem', marginTop: '2rem' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <motion.button
                  key={s}
                  onClick={() => handleAnswer(s)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-purple-400/50 transition-colors duration-200 font-medium"
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
                  {s}
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between mt-4 text-sm text-slate-400" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              <span>전혀 아니다</span>
              <span>매우 그렇다</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
