// @owner BSJ
// 백엔드 공통 응답 타입 (global/common/PageResponse)

/** Spring 페이지 응답. page 는 0부터 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
