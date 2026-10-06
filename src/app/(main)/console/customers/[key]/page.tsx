// @owner BSJ
// CS-07 고객 이력 (docs/09 §2.3, FR-HIS-02). customerKey = M-{memberId} 또는 G-{email}
import { notFound } from 'next/navigation';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { CustomerHistoryView } from './customer-history-view';

/** 이메일의 @ 는 %40 으로 올 수 있어 한 번 풀어 준다. 이미 풀린 값이 깨져 있으면 원문을 그대로 쓴다 */
function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function ConsoleCustomerPage({
  params,
}: PageProps<'/console/customers/[key]'>) {
  const { key } = await params;
  const customerKey = safeDecode(key);
  // 형식이 틀린 경로는 API 를 때리기 전에 끊는다 (서버도 400 으로 거른다)
  if (!/^(M-\d+|G-.+)$/.test(customerKey)) notFound();

  return (
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      <CustomerHistoryView customerKey={customerKey} />
    </AuthGuard>
  );
}
