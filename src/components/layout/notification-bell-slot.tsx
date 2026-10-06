// @owner BSJ
// 알림 벨 자리 (docs/02 §3). 박민재의 components/notification/NotificationBell 을 렌더한다
// 비로그인·비회원(Guest)은 컴포넌트가 스스로 null 을 돌려주므로 여기서 조건을 걸지 않는다
import { NotificationBell } from '@/components/notification/NotificationBell';

export function NotificationBellSlot() {
  return <NotificationBell />;
}
