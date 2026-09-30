// @owner BSJ
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다'),
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
});

export type LoginValues = z.infer<typeof loginSchema>;
