// @owner BSJ
// 규칙은 백엔드 TicketCreateRequest·GuestInfo 와 동일 (docs/04 §7)
import { z } from 'zod';
import { CATEGORY_LABEL } from '@/config/badge';
import type { TicketCategory } from '@/types/ticket';

export const CONTENT_MAX = 5000;
const CATEGORIES = Object.keys(CATEGORY_LABEL) as [TicketCategory, ...TicketCategory[]];

const base = z.object({
  // 고객이 고른 유형은 참고값 — 최종 유형은 AI 분류가 정한다 (docs/05)
  categoryHint: z.enum(CATEGORIES).optional(),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요')
    .max(200, '제목은 200자 이하로 입력해 주세요'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해 주세요')
    .max(CONTENT_MAX, '내용은 5,000자까지 입력할 수 있어요'),
});

const guest = z.object({
  guestName: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(50, '이름은 50자 이하로 입력해 주세요'),
  guestEmail: z
    .email('이메일 형식이 올바르지 않습니다')
    .max(100, '이메일은 100자 이하로 입력해 주세요'),
  guestPassword: z
    .string()
    .min(4, '조회 비밀번호는 4~64자로 입력해 주세요')
    .max(64, '조회 비밀번호는 4~64자로 입력해 주세요'),
});

/** 회원은 비회원 정보 칸이 없으므로 검증도 하지 않는다 */
export const memberInquirySchema = base;
export const guestInquirySchema = base.extend(guest.shape);

export type InquiryValues = z.infer<typeof base> & Partial<z.infer<typeof guest>>;
