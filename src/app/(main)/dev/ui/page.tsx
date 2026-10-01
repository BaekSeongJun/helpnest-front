// @owner BSJ
// 공용 조합 컴포넌트 샘플 (개발용). 운영 빌드에서는 404
import { notFound } from 'next/navigation';
import { UiShowcase } from './ui-showcase';

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <UiShowcase />;
}
