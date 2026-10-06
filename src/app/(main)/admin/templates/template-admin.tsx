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
import { deleteTemplate, getAdminTemplates, templateKeys } from '@/lib/api/template';
import { formatDate } from '@/lib/format';
import type { Template } from '@/types/template';
import type { TicketCategory } from '@/types/ticket';
import { TemplateFormDialog } from './template-form-dialog';

const ALL = 'ALL';

/** 답변 템플릿 관리 (AD-03, LEAD+). 미사용 포함 최신순 */
export function TemplateAdmin() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<TicketCategory | typeof ALL>(ALL);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  // undefined = 닫힘, null = 새로 작성, Template = 수정
  const [editing, setEditing] = useState<Template | null | undefined>(undefined);

  const query = { category: category === ALL ? undefined : category, keyword, page };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: templateKeys.admin(query),
    queryFn: () => getAdminTemplates(query),
    placeholderData: keepPreviousData,
  });

  async function handleDelete(template: Template) {
    try {
      await deleteTemplate(template.templateId);
      toast.success('템플릿을 삭제했습니다');
      await queryClient.invalidateQueries({ queryKey: templateKeys.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '삭제에 실패했습니다');
      throw e; // 다이얼로그를 열어 둔다
    }
  }

  const columns: DataTableColumn<Template>[] = [
    { header: '유형', cell: (t) => CATEGORY_LABEL[t.category], className: 'w-28' },
    {
      header: '제목',
      className: 'whitespace-normal',
      cell: (t) => (
        <div className="min-w-0">
          <p className="font-medium">{t.title}</p>
          <p className="text-muted-foreground line-clamp-1 text-xs">{t.content}</p>
        </div>
      ),
    },
    {
      header: '사용',
      cell: (t) => (t.active ? <Badge>사용</Badge> : <Badge variant="secondary">미사용</Badge>),
      className: 'w-24',
    },
    { header: '수정일', cell: (t) => formatDate(t.updatedAt), className: 'w-28 tabular-nums' },
    {
      header: <span className="sr-only">관리</span>,
      className: 'w-24 text-right',
      cell: (t) => (
        // 행 클릭(수정)과 겹치지 않게 버튼 영역에서는 전파를 막는다
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${t.title} 수정`}
            onClick={() => setEditing(t)}
          >
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            title="템플릿을 삭제할까요?"
            description={`"${t.title}" — 삭제하면 되돌릴 수 없습니다. 잠시 쓰지 않을 거라면 미사용으로 바꿔 주세요.`}
            confirmText="삭제"
            destructive
            onConfirm={() => handleDelete(t)}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`${t.title} 삭제`}>
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
        title="템플릿 관리"
        description="상담원이 답변을 쓸 때 [템플릿]으로 불러오는 문구입니다."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            템플릿 작성
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
          placeholder="제목·본문 검색"
          aria-label="검색어"
        />
      </FilterBar>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.content}
          rowKey={(t) => t.templateId}
          loading={isPending}
          emptyText="템플릿이 없습니다"
          onRowClick={setEditing}
          pagination={
            data && { page: data.page, totalPages: data.totalPages, onPageChange: setPage }
          }
        />
      )}

      {editing !== undefined && (
        <TemplateFormDialog template={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
