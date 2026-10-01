// @owner PMJ
// 답변·내부 메모 입력 스키마. 서버 제약(TICKET_REPLY.content, docs/04 §7)과 같은 상한을 쓴다
import { z } from 'zod';

export const REPLY_MAX_LENGTH = 5000;

export const replySchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해 주세요')
    .max(REPLY_MAX_LENGTH, '5,000자까지 입력할 수 있어요'),
  isInternal: z.boolean(),
});

export type ReplyValues = z.infer<typeof replySchema>;
