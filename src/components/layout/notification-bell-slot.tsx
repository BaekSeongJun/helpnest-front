// @owner BSJ
// 알림 벨 자리 (docs/02 §3). 박민재의 components/notification/NotificationBell 을 렌더한다 (CR #34).
//
// 조건을 여기서 걸지 않는다 — 비로그인·비회원(Guest)이면 NotificationBell 이 스스로 null 을
// 돌려준다. 서버가 Guest 토큰에 403 을 주므로(NotificationController) 컴포넌트 안에서 막아 두었고,
// 슬롯이 같은 판정을 한 번 더 하면 두 곳이 어긋날 때 벨이 사라지거나 두 번 뜬다.
import { NotificationBell } from '@/components/notification/NotificationBell';

export function NotificationBellSlot() {
  return <NotificationBell />;
}
