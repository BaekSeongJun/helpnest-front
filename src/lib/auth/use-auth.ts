// @owner BSJ
'use client';

import { useSyncExternalStore } from 'react';
import {
  type AuthSnapshot,
  getAuthSnapshot,
  INITIAL_AUTH_SNAPSHOT,
  subscribeAuth,
} from '@/lib/api/client';

/** 로그인 상태·회원. status: loading(세션 복원 중) → authenticated | anonymous */
export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => INITIAL_AUTH_SNAPSHOT);
}
