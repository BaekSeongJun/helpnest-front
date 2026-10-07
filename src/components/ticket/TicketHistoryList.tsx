// @owner PMJ
// 상태·배정·분류 변경 이력 (CS-02 우측). 최신이 위로 온다
//
// 한글 라벨을 config/badge.ts 가 아니라 여기 두는 이유: 그 파일은 백성준 소유라 추가할 수 없고,
// 이력 문구는 이 컴포넌트 밖에서 쓰이지 않는다 (08 §1 — 도메인 전용 컴포넌트 내부는 자유)

import { CATEGORY_LABEL, PRIORITY_BADGE, TICKET_STATUS_BADGE } from '@/config/badge';
import { formatDateTime } from '@/lib/format';
import type { HistoryAction, TicketHistoryResponse } from '@/types/ticket';

const ACTION_LABEL: Record<HistoryAction, string> = {
  CREATE: '접수',
  STATUS_CHANGE: '상태 변경',
  ASSIGN: '배정',
  REASSIGN: '재배정',
  PRIORITY_CHANGE: '우선순위 변경',
  CATEGORY_CHANGE: '유형 변경',
};

/**
 * fromValue·toValue 는 action 에 따라 의미가 다른 문자열이다 (types/ticket 주석).
 * 아는 코드만 한글로 바꾸고, 모르는 값은 원문을 그대로 둔다 — 억지로 비우면
 * "무엇에서 무엇으로"가 사라진다.
 *
 * 배정은 값이 member_id 라 서버가 붙여 준 이름(name)을 쓴다. 탈퇴 등으로 이름이 없을 때만 '#3' 으로 둔다.
 */
function label(action: HistoryAction, value: string | null, name: string | null): string | null {
  if (!value) return null;
  switch (action) {
    // 접수는 action 문구가 이미 '접수'라 toValue(RECEIVED)를 또 쓰면 같은 말이 두 번 나온다
    case 'CREATE':
      return null;
    case 'STATUS_CHANGE':
      return TICKET_STATUS_BADGE[value as keyof typeof TICKET_STATUS_BADGE]?.label ?? value;
    case 'PRIORITY_CHANGE':
      return PRIORITY_BADGE[value as keyof typeof PRIORITY_BADGE]?.label ?? value;
    case 'CATEGORY_CHANGE':
      return CATEGORY_LABEL[value as keyof typeof CATEGORY_LABEL] ?? value;
    // 이름이 없을 때 맨 숫자만 쓰면 무엇인지 알 수 없어 '#' 로 id 임을 드러낸다
    case 'ASSIGN':
    case 'REASSIGN':
      return name ?? `#${value}`;
    default:
      return value;
  }
}

export function TicketHistoryList({ histories }: { histories: TicketHistoryResponse[] }) {
  if (histories.length === 0) {
    return <p className="text-muted-foreground text-sm">이력이 없습니다.</p>;
  }

  // 역순 정렬은 이 컴포넌트가 책임진다 (TicketTimeline 과 같은 규약)
  const items = [...histories].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <ol className="space-y-3">
      {items.map((h) => {
        const from = label(h.action, h.fromValue, h.fromName);
        const to = label(h.action, h.toValue, h.toName);
        return (
          <li key={h.historyId} className="space-y-0.5 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{ACTION_LABEL[h.action] ?? h.action}</span>
              {to && <span className="text-muted-foreground">{from ? `${from} → ${to}` : to}</span>}
            </div>
            <div className="text-muted-foreground text-xs">
              {/* actorType 이 MEMBER 가 아니면 actorName 이 null 이다 */}
              {h.actorName ?? (h.actorType === 'SYSTEM' ? '시스템' : '비회원')}
              {' · '}
              {formatDateTime(h.createdAt)}
            </div>
            {h.memo && <p className="text-muted-foreground text-xs break-words">{h.memo}</p>}
          </li>
        );
      })}
    </ol>
  );
}
