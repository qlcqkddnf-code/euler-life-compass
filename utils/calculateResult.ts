export type ResultType = 
  | 'rocket'      // 가속하는 로켓
  | 'cloud'       // 부유하는 구름
  | 'guardian'    // 고립된 수호자
  | 'island'      // 고립된 섬
  | 'bureaucrat'  // 경직된 관료
  | 'priest'      // 무능한 성직자
  | 'void'        // 공허한 심연
  | 'circle';     // 오일러의 원

export type AxisAverages = {
  e: number;
  i: number;
  pi: number;
  voidAvg: number;
};

export type ResultDetailed = {
  type: ResultType;
  averages: AxisAverages;
};

const E_DIRECT = [1, 2, 3, 10, 22] as const;
const I_DIRECT = [4, 5, 6, 11, 13, 14, 15, 24] as const;
const PI_DIRECT = [7, 8, 9, 12, 23] as const;
const VOID_IDS = [19, 20, 21] as const;

function clampScore(v: number) {
  if (!Number.isFinite(v)) return 4; // neutral fallback
  if (v < 1) return 1;
  if (v > 7) return 7;
  return v;
}

function getScore(answers: Record<number, number>, id: number) {
  return clampScore(answers[id] ?? 4);
}

export function calculateAxisAverages(answers: Record<number, number>): AxisAverages {
  const voidAvg =
    VOID_IDS.map((id) => getScore(answers, id)).reduce((a, b) => a + b, 0) / VOID_IDS.length;

  const eSum = E_DIRECT.map((id) => getScore(answers, id)).reduce((a, b) => a + b, 0) + (8 - getScore(answers, 25));
  const iSum = I_DIRECT.map((id) => getScore(answers, id)).reduce((a, b) => a + b, 0) + (8 - getScore(answers, 26));
  const piSum = PI_DIRECT.map((id) => getScore(answers, id)).reduce((a, b) => a + b, 0) + (8 - getScore(answers, 27));

  // ✅ 문항 수 불균형은 "평균"으로 보정 (고정 문항 수 기반)
  const e = eSum / (E_DIRECT.length + 1);
  const i = iSum / (I_DIRECT.length + 1);
  const pi = piSum / (PI_DIRECT.length + 1);

  return { e, i, pi, voidAvg };
}

export function calculateResultDetailed(answers: Record<number, number>): ResultDetailed {
  const averages = calculateAxisAverages(answers);

  // 1) Void Kill Switch 유지
  if (averages.voidAvg >= 5.5) {
    return { type: 'void', averages };
  }

  // 2) Octant mapping (High >= 4.0)
  const eLevel = averages.e >= 4.0 ? 'H' : 'L';
  const iLevel = averages.i >= 4.0 ? 'H' : 'L';
  const piLevel = averages.pi >= 4.0 ? 'H' : 'L';
  const key = `${eLevel}/${iLevel}/${piLevel}`;

  const typeMap: Record<string, ResultType> = {
    'H/L/L': 'rocket',
    'L/H/L': 'cloud',
    'L/L/H': 'guardian',
    'H/H/L': 'island',
    'H/L/H': 'bureaucrat',
    'L/H/H': 'priest',
    'L/L/L': 'void',
    'H/H/H': 'circle',
  };

  return { type: typeMap[key] ?? 'void', averages };
}

/**
 * 사용자의 응답(1~7점)을 기반으로 최종 유형을 계산하는 함수
 * @param answers - 문항 ID를 키로 하고 점수(1~7)를 값으로 하는 객체
 * @returns 계산된 유형의 slug string
 */
export function calculateResult(answers: Record<number, number>): ResultType {
  return calculateResultDetailed(answers).type;
}

