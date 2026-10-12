// @owner BSJ
import {
  ArrowRight,
  Bot,
  Gauge,
  type LucideIcon,
  MessageCircle,
  PenSquare,
  Search,
  Sparkles,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Bot,
    title: 'AI 상담',
    description: '자주 묻는 질문을 바탕으로 AI가 먼저 답하고, 필요하면 상담원에게 넘깁니다.',
  },
  {
    icon: MessageCircle,
    title: '실시간 채팅',
    description: '상담원과 1:1로 대화하고, 대기 순번과 경과 시간을 바로 확인합니다.',
  },
  {
    icon: Tags,
    title: '자동 분류',
    description: '문의 유형과 긴급도를 AI가 분류해 맞는 상담원에게 배정합니다.',
  },
  {
    icon: Gauge,
    title: '응답 기한 관리',
    description: '문의마다 응답 기한을 두고, 늦어지기 전에 담당자에게 알립니다.',
  },
];

/** 진행 흐름 미리보기 — 화면 장식이라 실제 데이터가 아니다 */
const FLOW: { step: string; title: string; meta: string }[] = [
  { step: '접수', title: '환불은 언제 되나요?', meta: '방금 전' },
  { step: 'AI 분류', title: '환불 · 보통 · 자동 배정', meta: '2초' },
  { step: '답변', title: '영업일 기준 3~5일 안에 환불됩니다.', meta: '상담원' },
];

/** 계단처럼 어긋나게 쌓는다 — 좁은 화면에서는 어긋내지 않는다 */
const FLOW_OFFSET = ['', 'lg:ml-6', 'lg:ml-12'];

/**
 * 비로그인 홈(소개 화면). 셸이 이 화면을 `.dark` 로 감싸 항상 어둡다 — 색을 새로 정하지 않고
 * 다크 테마 토큰을 그대로 쓴다(08 D1).
 * children 은 소개 아래에 이어지는 내용.
 */
export function Landing({ children }: { children?: React.ReactNode }) {
  return (
    // -mt-18 pt-18: 배경 빛 번짐이 헤더(h-18) 뒤까지 이어지도록 헤더 높이만큼 위로 올린다
    <div className="relative isolate -mt-18 overflow-hidden pt-18">
      {/* 배경 빛 번짐 */}
      <div
        aria-hidden
        className="bg-primary/30 absolute -top-40 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-info/20 absolute right-0 bottom-0 -z-10 size-[28rem] translate-x-1/3 translate-y-1/3 rounded-full blur-3xl"
      />

      <section className="mx-auto grid min-h-[calc(100svh-4.5rem)] w-full max-w-6xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="border-border text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Sparkles className="text-primary size-3.5" aria-hidden />
            AI 상담 · 실시간 채팅 · 자동 분류
          </p>
          <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-6xl md:leading-[1.1] xl:text-7xl">
            문의부터 해결까지,
            <br />
            <span className="text-primary">하나의 흐름</span>으로
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-base md:text-lg">
            궁금한 점은 AI가 먼저 답하고, 더 필요한 도움은 상담원이 이어받습니다. 남긴 문의는
            언제든 진행 상황을 확인할 수 있어요.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/inquiry/new">
                <PenSquare className="size-4" aria-hidden />
                문의하기
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/login?next=/chat">
                로그인하고 채팅 상담
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* 자바스크립트 없이도 동작하는 GET 폼 — /faq?keyword= */}
          <form role="search" action="/faq" className="mt-8 flex max-w-md gap-2">
            <Input
              name="keyword"
              placeholder="자주 묻는 질문 검색 (예: 환불)"
              aria-label="FAQ 검색어"
              className="rounded-full px-4"
            />
            <Button type="submit" variant="secondary" className="rounded-full">
              <Search className="size-4" aria-hidden />
              검색
            </Button>
          </form>
        </div>

        <ol aria-hidden className="relative flex flex-col gap-4">
          {FLOW.map(({ step, title, meta }, i) => (
            <li
              key={step}
              className={cn(
                'bg-card/80 border-border rounded-2xl border p-5 backdrop-blur',
                FLOW_OFFSET[i],
              )}
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 font-medium">
                  {step}
                </span>
                <span className="text-muted-foreground">{meta}</span>
              </div>
              <p className="text-sm font-medium">{title}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-label="주요 기능"
        className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 md:px-6 md:pb-24 lg:grid-cols-4"
      >
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="bg-card/60 border-border rounded-2xl border p-5">
            <Icon className="text-primary mb-4 size-6" aria-hidden />
            <h2 className="mb-1 text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        ))}
      </section>

      {children && <div className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-6">{children}</div>}
    </div>
  );
}
