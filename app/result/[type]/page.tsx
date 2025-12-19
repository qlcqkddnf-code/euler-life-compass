import { redirect } from 'next/navigation';
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

  // 정적 export 환경에서는 잘못된 type 경로는 기본적으로 404가 되므로,
  // 클라이언트 네비게이션/개발 환경에서도 일관되게 홈으로 보냄.
  // trailingSlash: true와 일치하도록 홈 경로도 /로 끝나게 처리
  if (!validTypes.includes(type)) {
    redirect('/');
  }

  return <ResultClient type={type} />;
}

