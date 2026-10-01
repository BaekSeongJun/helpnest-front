// @owner BSJ
// 규칙은 백엔드 SignupRequest 와 동일 (docs/04 §2)
import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z
      .email('이메일 형식이 올바르지 않습니다')
      .max(100, '이메일은 100자 이하로 입력해 주세요'),
    password: z
      .string()
      .min(8, '비밀번호는 8~64자로 입력해 주세요')
      .max(64, '비밀번호는 8~64자로 입력해 주세요'),
    passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요'),
    name: z
      .string()
      .trim()
      .min(1, '이름을 입력해 주세요')
      .max(50, '이름은 50자 이하로 입력해 주세요'),
    phone: z.string().regex(/^[0-9-]{0,20}$/, '연락처는 숫자와 - 만 20자 이하로 입력해 주세요'),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

export type SignupValues = z.infer<typeof signupSchema>;
