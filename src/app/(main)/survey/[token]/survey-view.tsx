// @owner BSJ
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CircleCheck, Clock, Link2Off, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { PageHeader } from '@/components/common/page-header';
import { StarRating } from '@/components/survey/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { getSurvey, submitSurvey } from '@/lib/api/survey';

const COMMENT_MAX = 1000;

/** 그 사이 제출(409)·만료(410)된 경우 — 에러 문구 대신 서버 상태를 다시 읽어 알맞은 안내로 바꾼다 */
const isStale = (e: unknown) => e instanceof ApiError && (e.status === 409 || e.status === 410);

/** 설문 (CU-11). 메일 링크의 토큰만으로 들어오므로 로그인·권한 확인이 없다 */
export function SurveyView({ token }: { token: string }) {
  const [thanks, setThanks] = useState(false);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['survey', token],
    queryFn: () => getSurvey(token),
    retry: false, // 없는 토큰(404)은 다시 불러도 같다
  });

  return (
    <div>
      <PageHeader
        title="만족도 설문"
        description="남겨 주신 의견은 상담 품질을 높이는 데 쓰여요."
      />
      <Card>
        {isPending ? (
          <CardContent>
            <LoadingSkeleton variant="detail" />
          </CardContent>
        ) : error ? (
          error instanceof ApiError && error.status === 404 ? (
            <Notice
              icon={Link2Off}
              title="설문 링크가 올바르지 않아요"
              description="메일의 링크를 그대로 눌렀는지 확인해 주세요."
            />
          ) : (
            <ErrorState message="설문을 불러오지 못했습니다." onRetry={() => refetch()} />
          )
        ) : thanks ? (
          <Notice
            icon={CircleCheck}
            title="소중한 의견 감사합니다"
            description="남겨 주신 의견은 더 나은 상담을 위해 사용할게요."
          />
        ) : data.submitted ? (
          <Notice
            icon={CircleCheck}
            title="이미 응답해 주셨어요"
            description="설문은 한 번만 참여할 수 있어요. 감사합니다."
          />
        ) : data.expired ? (
          <Notice
            icon={Clock}
            title="설문 기간이 지났어요"
            description="링크는 발송 후 72시간 동안만 쓸 수 있어요. 문의가 다시 처리되면 새 링크를 보내 드려요."
          />
        ) : (
          <SurveyForm
            token={token}
            ticketNo={data.ticketNo}
            title={data.title}
            onDone={() => setThanks(true)}
            onStale={() => refetch()}
          />
        )}
      </Card>
    </div>
  );
}

function SurveyForm({
  token,
  ticketNo,
  title,
  onDone,
  onStale,
}: {
  token: string;
  ticketNo: string;
  title: string;
  onDone: () => void;
  /** 그 사이 제출·만료된 경우 — 서버 상태를 다시 읽어 알맞은 안내로 바꾼다 */
  onStale: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState(false);

  const submit = useMutation({
    mutationFn: () => submitSurvey(token, { rating, comment: comment.trim() || undefined }),
    onSuccess: onDone,
    onError: (e) => {
      if (isStale(e)) onStale();
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    submit.mutate();
  }

  return (
    <>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-7">
            {/* 시안 A안: 어떤 문의에 대한 설문인지 회색 상자로 */}
            <div className="bg-muted flex flex-col gap-0.5 rounded-lg px-4 py-3.5 text-sm">
              <span className="font-semibold">{title}</span>
              <span className="text-muted-foreground font-mono text-xs">{ticketNo}</span>
            </div>
            <Field data-invalid={ratingError}>
              <FieldLabel className="text-base font-semibold">상담은 만족스러우셨나요?</FieldLabel>
              <StarRating
                value={rating}
                disabled={submit.isPending}
                onChange={(n) => {
                  setRating(n);
                  setRatingError(false);
                }}
              />
              {ratingError && <FieldError>만족도를 선택해 주세요</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="survey-comment" className="text-base font-semibold">
                더 하고 싶은 말이 있나요?{' '}
                <span className="text-muted-foreground text-sm font-normal">(선택)</span>
              </FieldLabel>
              <Textarea
                id="survey-comment"
                rows={4}
                maxLength={COMMENT_MAX}
                value={comment}
                disabled={submit.isPending}
                onChange={(e) => setComment(e.target.value)}
                placeholder="자유롭게 남겨 주세요"
                className="bg-muted border-transparent"
              />
              <FieldDescription className="text-right">
                {comment.length} / {COMMENT_MAX}
              </FieldDescription>
            </Field>
            {submit.isError && !isStale(submit.error) && (
              <FieldError>
                {submit.error instanceof ApiError
                  ? submit.error.message
                  : '제출하지 못했습니다. 잠시 후 다시 시도해 주세요.'}
              </FieldError>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={submit.isPending}
                className="w-full sm:w-auto"
              >
                {submit.isPending ? '제출하는 중…' : '의견 보내기'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </>
  );
}

function Notice({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <CardContent>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/">HelpNest 홈으로</Link>
          </Button>
        }
      />
    </CardContent>
  );
}
