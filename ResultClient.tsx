'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { results } from '@/constants/results';
import type { ResultType } from '@/utils/calculateResult';

type Star = {
  id: number;
  x: number; // 0~100 (%)
  y: number; // 0~100 (%)
  delay: number;
  duration: number;
  size: number; // px
  opacity: number;
};

type Theme = {
  from: string;
  via: string;
  to: string;
  glow: string;
};

const THEME_BY_TYPE: Record<ResultType, Theme> = {
  rocket: { from: '#ff2d2d', via: '#ff6a00', to: '#7c2d12', glow: '#ff2d2d' }, // Red
  cloud: { from: '#2563eb', via: '#22d3ee', to: '#0ea5e9', glow: '#38bdf8' }, // Blue
  guardian: { from: '#10b981', via: '#22c55e', to: '#16a34a', glow: '#34d399' }, // Green
  island: { from: '#14b8a6', via: '#0ea5e9', to: '#1d4ed8', glow: '#22d3ee' }, // Teal/Blue
  bureaucrat: { from: '#f59e0b', via: '#f97316', to: '#b45309', glow: '#fbbf24' }, // Amber/Orange
  priest: { from: '#fb7185', via: '#a78bfa', to: '#f472b6', glow: '#fb7185' }, // Rose/Purple
  void: { from: '#0b1220', via: '#111827', to: '#000000', glow: '#334155' }, // Deep space
  circle: { from: '#7c3aed', via: '#a855f7', to: '#ec4899', glow: '#a855f7' }, // Purple
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashToSeed(input: string) {
  // 간단한 FNV-1a 유사 해시 (deterministic)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(count: number, seed: number): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const size = clamp(Math.round(1 + rand() * 2), 1, 3);
    return {
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      delay: rand() * 2,
      duration: 2 + rand() * 3,
      size,
      opacity: 0.25 + rand() * 0.6,
    };
  });
}

async function copyWithFallback(text: string) {
  // 1) Clipboard API
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore and fallback
  }

  // 2) textarea fallback (legacy)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function splitToLines(text: string): string[] {
  // “한 줄씩” = 문장 단위로 줄을 나누는 느낌(한국어 마침표/물음표/느낌표 기준)
  const normalized = text.replace(/\s+/g, ' ').trim();
  const parts = normalized.split(/(?<=[.!?。])\s+/);
  return parts.filter(Boolean);
}

const TYPE_STANDARD = {
  // ✅ 모든 유형에서 동일한 표준 속도 (읽기 경험 최적화)
  lineDelayMs: 420,
  charDelayMs: 16,
} as const;

function TypewriterLines({
  text,
  lineDelayMs = TYPE_STANDARD.lineDelayMs,
  charDelayMs = TYPE_STANDARD.charDelayMs,
}: {
  text: string;
  lineDelayMs?: number;
  charDelayMs?: number;
}) {
  const lines = useMemo(() => splitToLines(text), [text]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    // type 변경 시 초기화
    setLineIndex(0);
    setCharIndex(0);
  }, [text]);

  useEffect(() => {
    if (lines.length === 0) return;
    if (lineIndex >= lines.length) return;

    const current = lines[lineIndex] ?? '';
    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), charDelayMs);
      return () => window.clearTimeout(t);
    }

    // 한 줄 타이핑 완료 → 다음 줄로
    const t = window.setTimeout(() => {
      setLineIndex((l) => l + 1);
      setCharIndex(0);
    }, lineDelayMs);
    return () => window.clearTimeout(t);
  }, [lines, lineIndex, charIndex, charDelayMs, lineDelayMs]);

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const isPast = idx < lineIndex;
        const isCurrent = idx === lineIndex;
        const visible = isPast ? line : isCurrent ? line.slice(0, charIndex) : '';

        return (
          <p key={`${idx}-${line.slice(0, 12)}`} className="text-lg md:text-xl text-slate-100 leading-relaxed">
            {visible}
            {isCurrent && charIndex < line.length ? (
              <span className="inline-block w-[10px] translate-y-[2px] ml-1 text-slate-300/90 animate-pulse">
                ▍
              </span>
            ) : null}
          </p>
        );
      })}
    </div>
  );
}

function scoreToAngle(score: number) {
  // 1~7 -> -120deg ~ +120deg
  const s = clamp(score, 1, 7);
  const t = (s - 1) / 6; // 0..1
  return -120 + t * 240;
}

function HudGauge({
  e,
  i,
  pi,
  hasAll,
  theme,
  seed,
}: {
  e: number;
  i: number;
  pi: number;
  hasAll: boolean;
  theme: Theme;
  seed: number;
}) {
  const eAngle = scoreToAngle(hasAll ? e : 4);
  const iAngle = scoreToAngle(hasAll ? i : 4);
  const piAngle = scoreToAngle(hasAll ? pi : 4);

  const jitter = useMemo(() => {
    const rand = mulberry32(seed);
    return {
      e: { amp: 1.3 + rand() * 0.7, dur: 1.6 + rand() * 0.8, delay: rand() * 0.6 },
      i: { amp: 1.0 + rand() * 0.7, dur: 1.7 + rand() * 0.9, delay: rand() * 0.6 },
      pi: { amp: 0.9 + rand() * 0.7, dur: 1.8 + rand() * 0.9, delay: rand() * 0.6 },
      sweepDur: 4.8 + rand() * 1.2,
    };
  }, [seed]);

  return (
    <div className="mx-auto w-fit">
      <div
        className="relative rounded-2xl px-4 py-3 border backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.45)',
          borderColor: `${theme.glow}55`,
          boxShadow: `0 0 40px ${theme.glow}22`,
        }}
      >
        {/* HUD Header */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/80">HUD • Coordinate</p>
          <span className="text-[11px] text-slate-300/60">e / i / π</span>
        </div>

        <div className="mt-2 flex items-center gap-4">
          {/* Dial */}
          <div className="relative w-[92px] h-[92px]">
            {/* Glow halo */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{
                background: `radial-gradient(55% 55% at 50% 50%, ${theme.glow}55 0%, transparent 70%)`,
              }}
            />

            {/* Radar Sweep (with trail) */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-full mix-blend-screen"
              style={{
                background: `conic-gradient(from 0deg,
                  transparent 0deg,
                  ${theme.glow}00 0deg,
                  ${theme.glow}55 10deg,
                  ${theme.glow}22 28deg,
                  ${theme.glow}10 45deg,
                  transparent 70deg)`,
                filter: 'blur(0.6px)',
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 34%, rgba(0,0,0,1) 76%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 34%, rgba(0,0,0,1) 76%, rgba(0,0,0,0) 100%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: jitter.sweepDur, repeat: Infinity, ease: 'linear' }}
            />

            {/* Sweep afterglow (extra trailing softness) */}
            <motion.div
              aria-hidden="true"
              className="absolute -inset-1 rounded-full mix-blend-screen opacity-30"
              style={{
                background: `conic-gradient(from 0deg,
                  transparent 0deg,
                  ${theme.glow}00 0deg,
                  ${theme.glow}33 14deg,
                  ${theme.glow}14 40deg,
                  transparent 78deg)`,
                filter: 'blur(2.2px)',
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: jitter.sweepDur, repeat: Infinity, ease: 'linear' }}
            />

            <svg
              width="92"
              height="92"
              viewBox="0 0 92 92"
              className="relative z-10"
              aria-label="좌표 HUD 게이지"
            >
              <defs>
                <filter id="hudGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="hudTipGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer ring */}
              <circle cx="46" cy="46" r="40" stroke={`${theme.glow}66`} strokeWidth="1.5" fill="rgba(2,6,23,0.25)" />
              <circle cx="46" cy="46" r="34" stroke="rgba(148,163,184,0.25)" strokeWidth="1" fill="none" />

              {/* Ticks */}
              {Array.from({ length: 13 }).map((_, idx) => {
                const a = (-120 + (240 / 12) * idx) * (Math.PI / 180);
                const x1 = 46 + Math.cos(a) * 33;
                const y1 = 46 + Math.sin(a) * 33;
                const x2 = 46 + Math.cos(a) * 38;
                const y2 = 46 + Math.sin(a) * 38;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(226,232,240,0.20)"
                    strokeWidth={idx % 3 === 0 ? 1.2 : 0.8}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Needles (e/i/pi) — Dynamic Equilibrium Jitter + Glow Trail */}
              <g>
                {/* e needle */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    dur={`${jitter.e.dur}s`}
                    repeatCount="indefinite"
                    begin={`${jitter.e.delay}s`}
                    values={`${eAngle - jitter.e.amp} 46 46; ${eAngle + jitter.e.amp} 46 46; ${eAngle - jitter.e.amp * 0.6} 46 46; ${eAngle - jitter.e.amp} 46 46`}
                  />
                  {/* trail */}
                  <line x1="46" y1="46" x2="46" y2="20" stroke={`${theme.from}66`} strokeWidth="5" strokeLinecap="round" filter="url(#hudGlow)" />
                  {/* core */}
                  <line x1="46" y1="46" x2="46" y2="20" stroke={theme.from} strokeWidth="2" strokeLinecap="round" />
                  {/* tip light */}
                  <circle cx="46" cy="20" r="3.2" fill={theme.from} filter="url(#hudTipGlow)" opacity="0.9" />
                  <circle cx="46" cy="20" r="1.7" fill="white" opacity="0.85" />
                </g>

                {/* i needle */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    dur={`${jitter.i.dur}s`}
                    repeatCount="indefinite"
                    begin={`${jitter.i.delay}s`}
                    values={`${iAngle - jitter.i.amp} 46 46; ${iAngle + jitter.i.amp} 46 46; ${iAngle - jitter.i.amp * 0.6} 46 46; ${iAngle - jitter.i.amp} 46 46`}
                  />
                  <line x1="46" y1="46" x2="46" y2="24" stroke={`${theme.via}55`} strokeWidth="5" strokeLinecap="round" filter="url(#hudGlow)" />
                  <line x1="46" y1="46" x2="46" y2="24" stroke={theme.via} strokeWidth="2" strokeLinecap="round" />
                  <circle cx="46" cy="24" r="3.0" fill={theme.via} filter="url(#hudTipGlow)" opacity="0.88" />
                  <circle cx="46" cy="24" r="1.6" fill="white" opacity="0.8" />
                </g>

                {/* pi needle */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    dur={`${jitter.pi.dur}s`}
                    repeatCount="indefinite"
                    begin={`${jitter.pi.delay}s`}
                    values={`${piAngle - jitter.pi.amp} 46 46; ${piAngle + jitter.pi.amp} 46 46; ${piAngle - jitter.pi.amp * 0.6} 46 46; ${piAngle - jitter.pi.amp} 46 46`}
                  />
                  <line x1="46" y1="46" x2="46" y2="28" stroke={`${theme.to}55`} strokeWidth="5" strokeLinecap="round" filter="url(#hudGlow)" />
                  <line x1="46" y1="46" x2="46" y2="28" stroke={theme.to} strokeWidth="2" strokeLinecap="round" />
                  <circle cx="46" cy="28" r="2.8" fill={theme.to} filter="url(#hudTipGlow)" opacity="0.86" />
                  <circle cx="46" cy="28" r="1.5" fill="white" opacity="0.78" />
                </g>

                {/* Pivot */}
                <circle cx="46" cy="46" r="4" fill="rgba(2,6,23,0.85)" stroke={`${theme.glow}88`} strokeWidth="1.2" />
              </g>
            </svg>
          </div>

          {/* Numeric readout */}
          <div className="space-y-1">
            <p className="text-xs text-slate-300/80 tracking-wide">
              당신의 좌표:{' '}
              {hasAll ? (
                <>
                  <span className="text-slate-100/90">e={e.toFixed(2)}</span>,{' '}
                  <span className="text-slate-100/90">i={i.toFixed(2)}</span>,{' '}
                  <span className="text-slate-100/90">π={pi.toFixed(2)}</span>
                </>
              ) : (
                <>e=—, i=—, π=—</>
              )}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-300/65">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: theme.from }} /> e
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: theme.via }} /> i
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: theme.to }} /> π
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResultClient({ type }: { type: ResultType }) {
  const searchParams = useSearchParams();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('복사되었습니다');

  const theme = THEME_BY_TYPE[type];
  const result = results[type];

  // ✅ stars: useMemo + sessionStorage 캐시로 "페이지 이동/리렌더" 시 재배치 방지
  const stars = useMemo(() => {
    const key = `elc:stars:v1:${type}`;
    if (typeof window === 'undefined') return [] as Star[];

    const cached = window.sessionStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached) as Star[];
      } catch {
        // ignore
      }
    }

    const seed = hashToSeed(`elc:${type}`);
    const generated = generateStars(60, seed);
    window.sessionStorage.setItem(key, JSON.stringify(generated));
    return generated;
  }, [type]);

  // 애니메이션 오브젝트도 useMemo로 고정(불필요한 객체 재생성 방지)
  const pageTransition = useMemo(
    () => ({
      duration: 0.7,
      ease: 'easeOut' as const,
    }),
    [],
  );

  const titleMotion = useMemo(
    () => ({
      initial: { opacity: 0, y: 28 },
      animate: { opacity: 1, y: 0 },
      transition: { ...pageTransition, delay: 0.08 },
    }),
    [pageTransition],
  );

  const cardMotion = useMemo(
    () => ({
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      transition: { ...pageTransition, delay: 0.18 },
    }),
    [pageTransition],
  );

  const scores = useMemo(() => {
    const e = searchParams.get('e');
    const i = searchParams.get('i');
    const pi = searchParams.get('pi');

    const hasAll = e !== null && i !== null && pi !== null;
    const eNum = Number(e);
    const iNum = Number(i);
    const piNum = Number(pi);

    return {
      hasAll,
      e: Number.isFinite(eNum) ? eNum : 0,
      i: Number.isFinite(iNum) ? iNum : 0,
      pi: Number.isFinite(piNum) ? piNum : 0,
    };
  }, [searchParams]);

  const handleShare = useCallback(async () => {
    const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
    const base = `${window.location.origin}${pathname}`;
    const url = new URL(base);

    // ✅ 평균값은 /test → /result 이동 시 쿼리로 전달됨
    if (scores.hasAll) {
      url.searchParams.set('e', scores.e.toFixed(2));
      url.searchParams.set('i', scores.i.toFixed(2));
      url.searchParams.set('pi', scores.pi.toFixed(2));
    } else {
      // 직접 접근 등으로 점수가 없는 경우: 정직하게 안내하고 기본 링크만 복사
      setToastMessage('점수 정보가 없어 기본 링크만 복사합니다');
    }

    const ok = await copyWithFallback(url.toString());
    setToastMessage((prev) => (ok ? prev : '복사에 실패했습니다'));
    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 2500);
  }, [scores.e, scores.i, scores.pi, scores.hasAll]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black relative overflow-hidden flex items-center justify-center text-white">
      {/* 타입별 테마 그라데이션 (Framer Motion) */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 600px at 20% 15%, ${theme.from}55 0%, transparent 55%),
                       radial-gradient(700px 520px at 85% 25%, ${theme.via}44 0%, transparent 60%),
                       radial-gradient(900px 700px at 55% 90%, ${theme.to}44 0%, transparent 62%)`,
        }}
        animate={{ opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 필름 노이즈 레이어 */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.14] bg-[url('/noise.svg')] bg-repeat"
        style={{ backgroundSize: '220px 220px' }}
        animate={{ backgroundPosition: ['0px 0px', '220px 220px'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* 스캔라인/미세 그리드 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '100% 6px',
        }}
      />

      {/* 별빛 배경 */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            animate={{
              opacity: [star.opacity * 0.6, star.opacity, star.opacity * 0.6],
              scale: [1, 1.6, 1],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="px-5 py-3 rounded-full backdrop-blur-md border shadow-lg"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderColor: `${theme.glow}66`,
              }}
            >
              <p className="font-semibold text-slate-100">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl px-4 py-12">
        <motion.div {...titleMotion} className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            {result.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 italic">{result.subtitle}</p>

          {/* ✅ HUD 계기판 (테마 컬러 동기화) */}
          <div className="pt-3">
            <HudGauge
              e={scores.e}
              i={scores.i}
              pi={scores.pi}
              hasAll={scores.hasAll}
              theme={theme}
              seed={hashToSeed(`hud:${type}`)}
            />
          </div>
        </motion.div>

        <motion.div {...cardMotion} className="mt-10 space-y-8">
          {/* Prescription */}
          <div
            className="rounded-2xl p-8 backdrop-blur-md border-2 border-dashed shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(2, 6, 23, 0.55)',
              borderColor: `${theme.glow}88`,
            }}
          >
            {/* 네온 글로우 */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[28px] blur-3xl opacity-35 pointer-events-none z-0"
              style={{
                background: `radial-gradient(60% 60% at 50% 35%, ${theme.glow}55 0%, transparent 70%)`,
              }}
            />
            <div className="absolute top-4 right-4 text-xs uppercase tracking-[0.25em] text-slate-300/80">
              Prescription
            </div>
            <p className="relative z-10 text-center text-2xl md:text-3xl font-semibold leading-relaxed">
              “{result.prescription}”
            </p>
          </div>

          {/* Description */}
          <div className="rounded-2xl p-8 backdrop-blur-md border border-slate-700/50 bg-slate-950/35 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300/70">Analysis</p>
              <span
                className="text-[11px] text-slate-300/60"
                style={{ textShadow: `0 0 18px ${theme.glow}55` }}
              >
                Euler Life Compass • AI Narrative
              </span>
            </div>

            {/* ✅ 레이아웃 고정: 숨은 전체 텍스트로 높이를 미리 확보하고, 위에 타이핑 레이어를 올림 */}
            <div className="relative">
              <div aria-hidden="true" className="opacity-0 pointer-events-none select-none">
                {splitToLines(result.description).map((line, idx) => (
                  <p key={idx} className="text-lg md:text-xl leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
              <div className="absolute inset-0">
                <TypewriterLines text={result.description} />
              </div>
            </div>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-3 justify-center">
            {result.traits.map((trait, idx) => (
              <motion.span
                key={trait}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.15 + idx * 0.08 }}
                className="px-5 py-2.5 rounded-full text-sm font-medium border backdrop-blur-md shadow-md"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.55)',
                  borderColor: `${theme.glow}55`,
                }}
              >
                {trait}
              </motion.span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/test/"
              className="px-8 py-4 rounded-full text-white font-semibold text-lg text-center border shadow-lg backdrop-blur-md
                         bg-slate-800/40 border-slate-600/50 hover:bg-slate-700/50 transition-colors"
            >
              다시 진단하기
            </Link>

            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg focus:outline-none focus:ring-2"
              style={{
                background: `linear-gradient(90deg, ${theme.from}, ${theme.via}, ${theme.to})`,
                boxShadow: `0 12px 40px ${theme.glow}33`,
              }}
            >
              링크 복사하기
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


