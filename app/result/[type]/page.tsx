import { Suspense } from 'react';
import type { ResultType } from '@/utils/calculateResult';
import { ResultClient } from './ResultClient';

export const dynamicParams = false;

export function generateStaticParams(): Array<{ type: ResultType }> {
  return [
    { type: 'rocket' },
    { type: 'cloud' },
    { type: 'guardian' },
    { type: 'island' },
    { type: 'bureaucrat' },
    { type: 'priest' },
    { type: 'void' },
    { type: 'circle' },
  ];
}

const validTypes: readonly ResultType[] = [
  'rocket',
  'cloud',
  'guardian',
  'island',
  'bureaucrat',
  'priest',
  'void',
  'circle',
];

export default function ResultPage({ params }: { params: { type: string } }) {
  const type = params.type as ResultType;

  // ✅ 정적 export 환경: generateStaticParams로 생성된 페이지만 존재하므로
  // 잘못된 타입은 빌드 타임에 404가 됨. 런타임 검증은 클라이언트에서 처리
  // redirect()는 정적 export에서 작동하지 않으므로 제거
  if (!validTypes.includes(type)) {
    // 정적 export에서는 이 코드가 실행될 일이 거의 없지만,
    // 혹시 모를 경우를 대비해 클라이언트 컴포넌트에서 처리
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
        <ResultClient type={type} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
      <ResultClient type={type} />
    </Suspense>
  );
}

