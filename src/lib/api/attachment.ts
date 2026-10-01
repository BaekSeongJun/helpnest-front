// @owner BSJ
// 첨부 API (docs/04 §3). 업로드는 Next 프록시를 거치지 않고 백엔드로 직접 보낸다 (02 §2.1 — 10MB 본문 프록시 회피)
import { apiFetch, apiFetchBlob } from './client';

export interface UploadedAttachment {
  attachmentId: number;
  originalName: string;
  size: number;
}

/** 서버(AttachmentService)와 같은 제한. 서버가 최종 판정하고, 여기선 보내기 전에 걸러 준다 */
export const ATTACHMENT_LIMIT = {
  maxFiles: 5,
  maxBytes: 10 * 1024 * 1024,
  extensions: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'txt',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'hwp',
    'hwpx',
  ],
} as const;

const UPLOAD_BASE = `${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ?? ''}/api`;

/** 여러 파일을 한 요청으로. 비회원도 가능(IP 10분 5건 제한) */
export function uploadAttachments(files: File[]): Promise<UploadedAttachment[]> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return apiFetch<UploadedAttachment[]>('/attachments', {
    method: 'POST',
    body: form,
    baseUrl: UPLOAD_BASE,
  });
}

/**
 * 첨부 다운로드. 링크로는 Authorization 헤더를 못 붙이므로 받아서 저장시킨다.
 * ponytail: 파일 전체를 메모리에 올림(≤10MB 라 허용). prod 302(S3 presigned)는 S3 CORS 설정 필요
 */
export async function downloadAttachment(attachmentId: number, fileName: string): Promise<void> {
  const blob = await apiFetchBlob(`/attachments/${attachmentId}/download`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
