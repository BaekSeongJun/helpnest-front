// @owner BSJ
'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CATEGORY_LABEL } from '@/config/badge';
import { fillTemplate, getTemplates, type TemplateContext, templateKeys } from '@/lib/api/template';
import type { Template } from '@/types/template';
import type { TicketCategory } from '@/types/ticket';

interface TemplatePickerProps extends TemplateContext {
  /** 티켓 유형. 이 유형 템플릿을 맨 위에 보여준다 */
  category?: TicketCategory | null;
  /** 치환이 끝난 본문. 에디터에 삽입하는 건 호출 쪽(ReplyEditor 등) 책임 */
  onSelect: (text: string) => void;
  disabled?: boolean;
}

// ponytail: 사용 중 템플릿 50개를 한 번에 받아 브라우저에서 검색. 수백 개가 되면 서버 keyword 검색으로
const QUERY = { size: 50 } as const;

/**
 * 답변 템플릿 검색·삽입 (FR-TPL-02). 박민재 ReplyEditor·채팅 화면에서 쓴다:
 * <TemplatePicker category={ticket.category} customerName={...} ticketNo={ticket.ticketNo}
 *   onSelect={(text) => setContent((prev) => prev + text)} />
 */
export function TemplatePicker({
  category,
  customerName,
  ticketNo,
  onSelect,
  disabled,
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useQuery({
    queryKey: templateKeys.list(QUERY),
    queryFn: () => getTemplates(QUERY),
    enabled: open, // 처음 열 때 불러오고 이후엔 캐시
    staleTime: 5 * 60 * 1000,
  });

  // 티켓 유형 그룹을 맨 위로, 나머지는 CATEGORY_LABEL 순서
  const groups = (Object.keys(CATEGORY_LABEL) as TicketCategory[])
    .sort((a, b) => Number(b === category) - Number(a === category))
    .map((c) => ({ category: c, items: data?.content.filter((t) => t.category === c) ?? [] }))
    .filter((g) => g.items.length > 0);

  function handleSelect(template: Template) {
    onSelect(fillTemplate(template.content, { customerName, ticketNo }));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <FileText className="size-4" />
          템플릿
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="템플릿 검색" />
          <CommandList>
            {isPending ? (
              <p className="text-muted-foreground p-4 text-center text-sm">불러오는 중…</p>
            ) : isError ? (
              <p className="text-destructive p-4 text-center text-sm">
                템플릿을 불러오지 못했습니다.
              </p>
            ) : (
              <>
                <CommandEmpty>템플릿이 없습니다</CommandEmpty>
                {groups.map((g) => (
                  <CommandGroup key={g.category} heading={CATEGORY_LABEL[g.category]}>
                    {g.items.map((t) => (
                      <CommandItem
                        key={t.templateId}
                        // cmdk 는 value 로 검색한다 — 제목·본문 모두 검색되게
                        value={`${t.title} ${t.content} ${t.templateId}`}
                        onSelect={() => handleSelect(t)}
                        className="flex-col items-start gap-0.5"
                      >
                        <span className="font-medium">{t.title}</span>
                        <span className="text-muted-foreground line-clamp-1 text-xs">
                          {t.content}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
