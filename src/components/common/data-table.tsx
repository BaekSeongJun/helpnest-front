// @owner BSJ
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Key, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EmptyState, LoadingSkeleton } from './states';

export interface DataTableColumn<T> {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** 열 너비·정렬 등 (예: 'w-32 text-right') */
  className?: string;
}

export interface DataTablePagination {
  /** 0부터 (PageResponse.page) */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  rowKey: (row: T) => Key;
  loading?: boolean;
  emptyText?: string;
  /** 빈 목록일 때 다음 행동 버튼 */
  emptyAction?: ReactNode;
  pagination?: DataTablePagination;
  onRowClick?: (row: T) => void;
}

/**
 * 목록 공통 표. 서버 페이지 응답(PageResponse)을 그대로 쓴다:
 * data={res?.content} pagination={{ page: res.page, totalPages: res.totalPages, onPageChange: setPage }}
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyText = '데이터가 없습니다',
  emptyAction,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data?.length ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyText} action={emptyAction} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick && (() => onRowClick(row))}
                  // 행 클릭을 키보드로도 (Enter)
                  onKeyDown={onRowClick && ((e) => e.key === 'Enter' && onRowClick(row))}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {columns.map((col, i) => (
                    <TableCell key={i} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && !!data?.length && (
        <nav aria-label="페이지" className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="이전 페이지"
            disabled={pagination.page <= 0}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {pagination.page + 1} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="다음 페이지"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
