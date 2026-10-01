// @owner BSJ
'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { FilterBar } from '@/components/common/filter-bar';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEMBER_STATUS_BADGE, ROLE_LABEL } from '@/config/badge';
import { ApiError } from '@/lib/api/client';
import { getAdminMembers, memberKeys, updateAdminMember } from '@/lib/api/member';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDate } from '@/lib/format';
import type { Role } from '@/types/auth';
import type { AdminMember, AdminMemberUpdateRequest, MemberStatus } from '@/types/member';
import { MemberCreateDialog } from './member-create-dialog';

const ALL = 'ALL';
// 역할 변경은 직원 역할끼리만 (서버 AdminMemberService.STAFF_ROLES)
const STAFF_ROLES = ['AGENT', 'LEAD', 'ADMIN'] as const satisfies readonly Role[];

interface PendingChange {
  member: AdminMember;
  req: AdminMemberUpdateRequest;
  title: string;
  description: string;
  destructive?: boolean;
}

/** 계정 관리 (AD-01, ADMIN). 상담원·팀장 생성, 역할·상태 변경 */
export function MemberAdmin() {
  const queryClient = useQueryClient();
  const { member: me } = useAuth();
  const [role, setRole] = useState<Role | typeof ALL>(ALL);
  const [status, setStatus] = useState<MemberStatus | typeof ALL>(ALL);
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);

  const query = {
    role: role === ALL ? undefined : role,
    status: status === ALL ? undefined : status,
    page,
  };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: memberKeys.admin(query),
    queryFn: () => getAdminMembers(query),
    placeholderData: keepPreviousData,
  });

  async function applyChange({ member, req }: PendingChange) {
    try {
      await updateAdminMember(member.memberId, req);
      toast.success(`${member.name} 계정을 변경했습니다`);
      await queryClient.invalidateQueries({ queryKey: memberKeys.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '변경에 실패했습니다');
      throw e; // 다이얼로그를 열어 둔다
    }
  }

  function askRole(member: AdminMember, next: Role) {
    if (next === member.role) return;
    setPending({
      member,
      req: { role: next },
      title: `역할을 ${ROLE_LABEL[next]}(으)로 바꿀까요?`,
      description: `${member.name}(${member.email}) — 바꾸면 그 계정은 다시 로그인해야 합니다.`,
    });
  }

  function askStatus(member: AdminMember) {
    const deactivate = member.status === 'ACTIVE';
    setPending({
      member,
      req: { status: deactivate ? 'INACTIVE' : 'ACTIVE' },
      title: deactivate ? '계정을 비활성화할까요?' : '계정을 다시 활성화할까요?',
      description: deactivate
        ? `${member.name}(${member.email}) — 즉시 로그아웃되고 로그인할 수 없습니다.`
        : `${member.name}(${member.email}) — 다시 로그인할 수 있게 됩니다.`,
      destructive: deactivate,
    });
  }

  const columns: DataTableColumn<AdminMember>[] = [
    { header: '이메일', cell: (m) => m.email },
    { header: '이름', cell: (m) => m.name },
    {
      header: '역할',
      className: 'w-36',
      cell: (m) =>
        // 고객 계정과 내 계정은 역할을 바꿀 수 없다 (서버도 막음)
        m.role === 'CUSTOMER' || m.memberId === me?.memberId ? (
          ROLE_LABEL[m.role]
        ) : (
          <Select value={m.role} onValueChange={(v) => askRole(m, v as Role)}>
            <SelectTrigger size="sm" className="w-28" aria-label={`${m.name} 역할`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    {
      header: '상태',
      className: 'w-24',
      cell: (m) => (
        <Badge className={MEMBER_STATUS_BADGE[m.status].className}>
          {MEMBER_STATUS_BADGE[m.status].label}
        </Badge>
      ),
    },
    { header: '가입일', cell: (m) => formatDate(m.createdAt), className: 'w-28 tabular-nums' },
    {
      header: <span className="sr-only">관리</span>,
      className: 'w-28 text-right',
      cell: (m) =>
        m.memberId !== me?.memberId && (
          <Button variant="outline" size="sm" onClick={() => askStatus(m)}>
            {m.status === 'ACTIVE' ? '비활성화' : '활성화'}
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="계정 관리"
        description="상담원·팀장 계정을 만들고 역할과 상태를 관리합니다."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            계정 생성
          </Button>
        }
      />

      <FilterBar
        onReset={() => {
          setRole(ALL);
          setStatus(ALL);
          setPage(0);
        }}
      >
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v as Role | typeof ALL);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-32" aria-label="역할">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 역할</SelectItem>
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as MemberStatus | typeof ALL);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-32" aria-label="상태">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 상태</SelectItem>
            {Object.entries(MEMBER_STATUS_BADGE).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.content}
          rowKey={(m) => m.memberId}
          loading={isPending}
          emptyText="계정이 없습니다"
          pagination={
            data && { page: data.page, totalPages: data.totalPages, onPageChange: setPage }
          }
        />
      )}

      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          title={pending.title}
          description={pending.description}
          confirmText="변경"
          destructive={pending.destructive}
          onConfirm={() => applyChange(pending)}
        />
      )}
      {creating && <MemberCreateDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
