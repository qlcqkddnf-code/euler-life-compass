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
  // ✅ 사람 기준 번호: 0이 절대 표시되지 않도록 Math.max로 보장
  // currentIndex는 0부터 시작하므로 +1, 하지만 최소값을 1로 강제
  const currentQuestionNumber = Math.max(1, currentIndex + 1);
  // ✅ Progress Bar도 currentIndex 기반으로 계산 (답변 개수가 아닌 현재 질문 번호 기준)
  // total이 0이면 progress도 0, 그 외에는 항상 1 이상의 값으로 계산
  const progress = total > 0 ? Math.max(1, (currentQuestionNumber / total) * 100) : 0;

  const handleAnswer = (score: number) => {
    if (!currentQuestion) return;

    // ✅ 상태 업데이트 비동기 이슈 방지: nextAnswers를 먼저 만들고 동일 값으로 set + 계산에 사용
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: score,
    };
    setAnswers(nextAnswers);

    // ✅ 마지막 질문 완주 보장: currentIndex는 0~26 (27개 질문)
    // currentIndex === 26 (27번째 질문)일 때 답변을 클릭하면 모든 질문 완료
    // 조건: currentIndex === total - 1 (26 === 27 - 1)이면 마지막 질문
    const isLastQuestion = currentIndex === total - 1;

    if (!isLastQuestion) {
      // 다음 문항으로 이동 (currentIndex 증가)
      // currentIndex가 0~25일 때는 다음 질문으로 이동
      setCurrentIndex(prev => prev + 1);
    } else {
      // ✅ 마지막 질문(27번, currentIndex === 26) 답변 클릭 시
      // 모든 27개 질문이 완료된 상태이므로 결과 계산 후 리다이렉트
      // ✅ 모든 문항 완료 - 결과 계산이 완료된 후에만 리다이렉트
      // 계산이 끝나기 전에 페이지 이동을 시도하지 않도록 보장
      try {
        const { type, averages } = calculateResultDetailed(nextAnswers);
        const qs = new URLSearchParams({
          e: averages.e.toFixed(2),
          i: averages.i.toFixed(2),
          pi: averages.pi.toFixed(2),
        }).toString();
        // ✅ 정적 export 환경: Vercel 정적 호스팅에서 가장 확실한 방법
        // trailingSlash: true와 일치하도록 경로 끝에 /를 반드시 포함
        const resultPath = `/result/${type}/`;
        const fullUrl = qs ? `${resultPath}?${qs}` : resultPath;
        
        // 정적 export에서는 window.location.href가 가장 확실함
        // 계산이 완료된 후에만 이동하도록 보장
        window.location.href = fullUrl;
      } catch (error) {
        console.error('결과 계산 중 오류 발생:', error);
        // 에러 발생 시에도 홈으로 이동하지 않고 에러 표시
        alert('결과를 계산하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
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
        {/* Progress Text - 사람 기준 번호로 표시 (1/27부터 시작, 0 절대 표시 안 됨) */}
        <div className="text-center mb-8 text-slate-400" style={{ textAlign: 'center', marginBottom: '2rem', color: '#94a3b8' }}>
          {Math.max(1, currentQuestionNumber)} / {Math.max(1, total)}
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

