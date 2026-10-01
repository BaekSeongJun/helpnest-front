// @owner BSJ
import type { Metadata } from 'next';
import { GuestReset } from './guest-reset';

export const metadata: Metadata = { title: '조회 비밀번호 재설정 | HelpNest' };

/** 조회 비밀번호 재설정 (CU-06). ?token= 없으면 ①메일 요청, 있으면 ②새 비밀번호 */
export default async function GuestResetPage({ searchParams }: PageProps<'/inquiry/lookup/reset'>) {
  const { token } = await searchParams;
  return <GuestReset token={typeof token === 'string' ? token : ''} />;
}
