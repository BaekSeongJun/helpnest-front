// @owner BSJ
// 날짜·숫자 표시 포맷 (docs/08 §10). 컴포넌트에서 toLocaleString() 직접 호출 금지 (D6)

type DateInput = string | number | Date | null | undefined;

const EMPTY = '-';

// 표시는 항상 Asia/Seoul (브라우저·서버 시간대와 무관)
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const numberFormat = new Intl.NumberFormat('ko-KR');

function toDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function seoulParts(date: Date) {
  const parts: Record<string, string> = {};
  for (const { type, value } of dateTimeFormat.formatToParts(date)) parts[type] = value;
  return parts;
}

/** 2026.10.02 14:05 */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const p = seoulParts(date);
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/** 2026.10.02 */
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const p = seoulParts(date);
  return `${p.year}.${p.month}.${p.day}`;
}

/** 24시간 이내는 "방금 전 / n분 전 / n시간 전", 그 외(미래 포함)는 날짜시간 */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMinutes < 0 || diffMinutes >= 24 * 60) return formatDateTime(date);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  return `${Math.floor(diffMinutes / 60)}시간 전`;
}

/** 분 → "3시간 12분" / "45분" / "2시간" */
export function formatDuration(totalMinutes: number | null | undefined): string {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return EMPTY;
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 1,204 */
export function formatNumber(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? EMPTY : numberFormat.format(value);
}

/** 백분율 값(12.49) → "12.5%" */
export function formatPercent(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? EMPTY : `${value.toFixed(1)}%`;
}
