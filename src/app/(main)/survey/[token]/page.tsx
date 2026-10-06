// @owner BSJ
import type { Metadata } from 'next';
import { SurveyView } from './survey-view';

// 토큰이 든 개인 링크라 검색에 노출하지 않는다
export const metadata: Metadata = {
  title: '만족도 설문 | HelpNest',
  robots: { index: false, follow: false },
};

/** 만족도 설문 (CU-11). 메일의 /survey/{token} 링크로 들어온다 */
export default async function SurveyPage({ params }: PageProps<'/survey/[token]'>) {
  const { token } = await params;
  return <SurveyView token={token} />;
}
