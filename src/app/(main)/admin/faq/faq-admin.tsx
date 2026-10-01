// @owner BSJ
'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { FilterBar } from '@/components/common/filter-bar';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_LABEL } from '@/config/badge';
import { ApiError } from '@/lib/api/client';
import { deleteFaq, faqKeys, getAdminFaqs } from '@/lib/api/faq';
import type { Faq } from '@/types/faq';
import type { TicketCategory } from '@/types/ticket';
import { FaqFormDialog } from './faq-form-dialog';

const ALL = 'ALL';

/** FAQ 관리 (AD-02, LEAD+). 비공개 포함 최신순 */
export function FaqAdmin() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<TicketCategory | typeof ALL>(ALL);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  // undefined = 닫힘, null = 새로 작성, Faq = 수정
  const [editing, setEditing] = useState<Faq | null | undefined>(undefined);

  const query = { category: category === ALL ? undefined : category, keyword, page };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: faqKeys.admin(query),
    queryFn: () => getAdminFaqs(query),
    placeholderData: keepPreviousData,
  });

  async function handleDelete(faq: Faq) {
    try {
      await deleteFaq(faq.faqId);
      toast.success('FAQ를 삭제했습니다');
      await queryClient.invalidateQueries({ queryKey: faqKeys.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '삭제에 실패했습니다');
      throw e; // 다이얼로그를 열어 둔다
    }
  }

  const columns: DataTableColumn<Faq>[] = [
    { header: '유형', cell: (f) => CATEGORY_LABEL[f.category], className: 'w-28' },
    { header: '질문', cell: (f) => f.question, className: 'whitespace-normal' },
    {
      header: '공개',
      cell: (f) => (f.published ? <Badge>공개</Badge> : <Badge variant="secondary">비공개</Badge>),
      className: 'w-24',
    },
    {
      header: '조회수',
      cell: (f) => f.viewCount.toLocaleString(),
      className: 'w-20 text-right tabular-nums',
    },
    {
      header: <span className="sr-only">관리</span>,
      className: 'w-24 text-right',
      cell: (f) => (
        // 행 클릭(수정)과 겹치지 않게 버튼 영역에서는 전파를 막는다
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${f.question} 수정`}
            onClick={() => setEditing(f)}
          >
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            title="FAQ를 삭제할까요?"
            description={`"${f.question}" — 삭제하면 되돌릴 수 없습니다.`}
            confirmText="삭제"
            destructive
            onConfirm={() => handleDelete(f)}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`${f.question} 삭제`}>
                <Trash2 className="text-destructive size-4" />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="FAQ 관리"
        description="공개한 FAQ는 고객 FAQ 화면과 AI 답변 초안에 쓰입니다."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            FAQ 작성
          </Button>
        }
      />

      <FilterBar
        onReset={() => {
          setCategory(ALL);
          setKeyword('');
          setPage(0);
        }}
      >
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v as TicketCategory | typeof ALL);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36" aria-label="유형">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 유형</SelectItem>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-64"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          placeholder="질문·답변 검색"
          aria-label="검색어"
        />
      </FilterBar>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.content}
          rowKey={(f) => f.faqId}
          loading={isPending}
          emptyText="FAQ가 없습니다"
          onRowClick={setEditing}
          pagination={
            data && { page: data.page, totalPages: data.totalPages, onPageChange: setPage }
          }
        />
      )}

      {editing !== undefined && (
        <FaqFormDialog faq={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
