// @owner BSJ
'use client';

import { CircleCheck, LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { NewPasswordForm } from '@/components/auth/new-password-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resetPassword } from '@/lib/api/auth';

/** 링크가 없거나 만료·사용됨이면 서버 메시지를 폼 아래에 보여 주고, 다시 요청하는 길을 둔다 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <LinkIcon className="text-muted-foreground size-10" aria-hidden />
          <p className="font-medium">링크가 올바르지 않습니다</p>
          <p className="text-muted-foreground text-sm">메일의 링크를 다시 눌러 주세요.</p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/forgot-password">재설정 링크 다시 받기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <CircleCheck className="text-success size-10" aria-hidden />
          <p className="font-medium">비밀번호를 바꿨어요</p>
          <p className="text-muted-foreground text-sm">
            다른 기기의 로그인도 모두 끊겼어요. 새 비밀번호로 다시 로그인해 주세요.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href="/login">로그인</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">비밀번호 재설정</CardTitle>
        <CardDescription>새로 사용할 비밀번호를 입력해 주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <NewPasswordForm
          minLength={8}
          submitLabel="비밀번호 변경"
          onSubmit={async (password) => {
            await resetPassword(token, password);
            setDone(true);
          }}
        />
        <div className="text-muted-foreground mt-6 text-center text-sm">
          링크가 만료됐나요?{' '}
          <Link href="/forgot-password" className="text-primary hover:underline">
            다시 받기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
