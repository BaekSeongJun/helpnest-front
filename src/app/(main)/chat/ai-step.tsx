// @owner PMJ
'use client';

import { useMutation } from '@tanstack/react-query';
import { Bot, ExternalLink, Headset, Send } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_QUESTION_MAX_LENGTH, AI_TRANSCRIPT_MAX_LENGTH, askAi } from '@/lib/api/chat';
import { cn } from '@/lib/utils';
import type { AiChatResponse, AiChatTurn } from '@/types/chat';

type Turn = AiChatTurn & { references?: AiChatResponse['references'] };

interface AiStepProps {
  /** [상담원 연결] — 그동안의 대화를 글로 넘긴다. 대화가 없으면 undefined */
  onConnect: (aiTranscript: string | undefined) => void;
  connecting: boolean;
}

/**
 * CU-09 채팅 전 AI 상담 단계 (FR-CHT-07). 이 단계에서는 채팅방을 만들지 않는다 —
 * [상담원 연결]을 눌러야 기존 채팅 요청이 나간다. 대화는 서버에 남지 않아 화면 상태로만 들고 있고,
 * 새로고침하면 사라진다(진행 중 방이 없으니 잃을 순번도 없다).
 */
export function AiStep({ onConnect, connecting }: AiStepProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    // history 는 보내는 시점에 만들어 넘긴다 — mutationFn 에서 turns 를 읽으면 onMutate 가 넣은
    // 이번 질문까지 history 에 섞인다(재렌더로 mutationFn 이 바뀐 뒤 실행되기 때문)
    mutationFn: ({ q, history }: { q: string; history: AiChatTurn[] }) => askAi(q, history),
    onMutate: ({ q }) => setTurns((prev) => [...prev, { role: 'USER', content: q }]),
    onSuccess: (res) => {
      setTurns((prev) => [
        ...prev,
        { role: 'AI', content: res.answer, references: res.references },
      ]);
      setQuestion('');
    },
    onError: (error) => {
      // 질문은 입력창에 남겨 다시 보낼 수 있게 하고, 실패한 질문 말풍선만 걷어 낸다
      setTurns((prev) => prev.slice(0, -1));
      toast.error(error.message);
    },
  });

  // 응답이 오면 최신 말풍선이 보이게 내린다
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [turns.length, ask.isPending]);

  const handoff = ask.data?.handoff ?? false;

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (q && !ask.isPending) {
      ask.mutate({ q, history: turns.map(({ role, content }) => ({ role, content })) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex max-h-[28rem] min-h-64 flex-col gap-3 overflow-y-auto rounded-lg border p-4">
        <Bubble role="AI">
          궁금한 점을 적어 주시면 FAQ를 바탕으로 먼저 답해 드릴게요. 상담원과 바로 이야기하려면 아래
          [상담원 연결]을 눌러 주세요.
        </Bubble>
        {turns.map((turn, i) => (
          <Bubble key={i} role={turn.role}>
            {turn.content}
            {turn.references && turn.references.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 border-t pt-2 text-xs">
                {turn.references.map((ref) => (
                  <li key={ref.faqId}>
                    {/* 새 탭 — 이 화면의 AI 대화는 저장되지 않아 이동하면 사라진다 */}
                    <Link
                      href={`/faq?keyword=${encodeURIComponent(ref.question)}`}
                      target="_blank"
                      className="text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline"
                    >
                      {ref.question}
                      <ExternalLink className="size-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Bubble>
        ))}
        {ask.isPending && (
          <Bubble role="AI">
            <span className="text-muted-foreground">답변을 찾고 있어요…</span>
          </Bubble>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={AI_QUESTION_MAX_LENGTH}
          placeholder="궁금한 점을 입력해 주세요"
          aria-label="AI 상담 질문"
          disabled={ask.isPending}
        />
        <Button type="submit" disabled={!question.trim() || ask.isPending} aria-label="질문 보내기">
          <Send aria-hidden />
        </Button>
      </form>

      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4',
          handoff && 'border-primary bg-primary/5',
        )}
        role={handoff ? 'alert' : undefined}
      >
        <p className="text-sm">
          {handoff
            ? '이 질문은 상담원이 더 정확히 도와드릴 수 있어요.'
            : '원하는 답을 찾지 못하셨나요?'}
        </p>
        <Button
          variant={handoff ? 'default' : 'outline'}
          onClick={() => onConnect(toTranscript(turns))}
          disabled={connecting || ask.isPending}
        >
          <Headset aria-hidden />
          {connecting ? '연결 중…' : '상담원 연결'}
        </Button>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: AiChatTurn['role']; children: React.ReactNode }) {
  const ai = role === 'AI';
  return (
    <div className={cn('flex items-start gap-2', !ai && 'justify-end')}>
      {ai && (
        <span
          className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <Bot className="size-4" />
        </span>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap',
          ai ? 'bg-muted' : 'bg-primary text-primary-foreground',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 상담원이 읽을 글로 이어 붙인다. 서버 상한(2,000자)을 넘으면 <b>앞쪽</b>을 잘라 최근 대화를 남긴다 —
 * 상담원에게 필요한 건 고객이 마지막에 막힌 지점이다.
 */
function toTranscript(turns: Turn[]): string | undefined {
  if (turns.length === 0) return undefined;
  const text = turns.map((t) => `${t.role === 'USER' ? '고객' : 'AI'}: ${t.content}`).join('\n');
  return text.length > AI_TRANSCRIPT_MAX_LENGTH
    ? '…' + text.slice(-(AI_TRANSCRIPT_MAX_LENGTH - 1))
    : text;
}
