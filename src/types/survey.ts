// @owner BSJ
// 만족도 설문 (docs/04 §5)

/** GET /surveys/{token}. 만료·제출 여부로 화면이 폼/안내를 가른다 */
export interface Survey {
  ticketNo: string;
  title: string;
  expired: boolean;
  submitted: boolean;
}

export interface SurveySubmitRequest {
  /** 1~5 */
  rating: number;
  /** 선택, 1,000자 이하 */
  comment?: string;
}
