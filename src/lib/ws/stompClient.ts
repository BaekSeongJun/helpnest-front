// @owner PMJ
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

/**
 * STOMP over WebSocket 단일 연결 (docs/02 §6, docs/04 §11).
 *
 * 탭마다 소켓 하나를 공유하고 목적지별 구독만 얹는다. 알림 벨·콘솔 목록 갱신·채팅(S3)이
 * 각자 연결을 열면 같은 사용자가 소켓을 서너 개 들고 있게 되고, 서버의 SimpleBroker 는
 * 세션 수만큼 메모리를 쓴다.
 *
 * ## 토큰을 받아 두지 않고 매번 가져온다
 * 핸드셰이크에는 헤더를 넣을 수 없어 인증은 STOMP CONNECT 프레임의 `Authorization` 으로 한다
 * ({@link https://github.com/BaekSeongJun/helpnest-back StompAuthInterceptor}). 그래서
 * {@link activateStomp} 는 토큰 문자열이 아니라 **읽어 오는 함수**를 받는다 — 끊겼다 다시 붙을 때
 * `connectHeaders` 를 새로 만들어야 하고, 그 사이 토큰이 재발급됐으면 예전 값으로는 CONNECT 가
 * 거부되기 때문이다. `beforeConnect` 가 재연결마다 호출되는 것이 이 설계의 핵심이다.
 *
 * ## 구독은 모듈이 기억했다가 재연결 때 다시 건다
 * 끊김은 서버 재기동·네트워크 전환으로 늘 일어나고, stompjs 는 재연결은 해 주지만 **구독은
 * 복구하지 않는다.** 복구하지 않으면 소켓은 멀쩡히 붙어 있는데 알림만 조용히 끊긴다 —
 * 사용자가 "알림이 안 와요"로 신고하기 전까지 아무도 모르는 실패다. 그래서 등록된 목적지를
 * 들고 있다가 `onConnect` 마다 전부 다시 건다.
 */

/** 연결 자체를 들고 있는 단일 인스턴스. 서버 사이드에서는 만들지 않는다 */
let client: Client | null = null;

/** 목적지 → 구독자들. 같은 목적지를 두 컴포넌트가 구독해도 소켓 구독은 하나다 */
const handlers = new Map<string, Set<(body: unknown) => void>>();
const subscriptions = new Map<string, StompSubscription>();

/**
 * STOMP 연결을 시작한다. 이미 활성이면 아무 일도 하지 않으므로 여러 번 불러도 된다.
 *
 * @param getToken Access 토큰을 읽어 오는 함수. 메모리 보관이라(docs/04 §0) 재연결 시점의
 *                 최신 값을 돌려줘야 한다. `null` 이면 연결하지 않는다 — 비로그인 상태에서
 *                 붙어 봐야 CONNECT 에서 거부된다.
 */
export function activateStomp(getToken: () => string | null): void {
  if (client || typeof window === 'undefined') return;

  client = new Client({
    brokerURL: process.env.NEXT_PUBLIC_WS_URL,
    // 재연결마다 헤더를 다시 만든다 — 토큰이 그 사이 재발급됐을 수 있다
    beforeConnect: () => {
      const token = getToken();
      if (!token) {
        // 토큰이 없으면 연결을 포기한다. 그대로 두면 거부당할 CONNECT 를 5초마다 반복한다
        void client?.deactivate();
        return;
      }
      client!.connectHeaders = { Authorization: `Bearer ${token}` };
    },
    reconnectDelay: 5000,
    onConnect: () => {
      // 재연결이면 이전 구독은 서버에 남아 있지 않다 — 등록된 목적지를 전부 다시 건다
      subscriptions.clear();
      handlers.forEach((_, destination) => openSubscription(destination));
    },
    onStompError: (frame) => {
      // CONNECT 거부(만료·Guest 토큰)가 여기로 온다. 서버는 이미 세션을 끊었다
      console.error('[stomp] 서버 오류', frame.headers.message, frame.body);
    },
  });

  client.activate();
}

/** 로그아웃·언마운트 시 연결과 구독을 모두 버린다 */
export function deactivateStomp(): void {
  handlers.clear();
  subscriptions.clear();
  void client?.deactivate();
  client = null;
}

/**
 * 목적지를 구독하고 해지 함수를 돌려준다. 연결 전에 불러도 되며, 연결되는 시점에 걸린다 —
 * 컴포넌트가 마운트 순서를 신경 쓰지 않아도 되게 하려는 것이다.
 *
 * @param destination `/user/queue/notifications` 처럼 docs/04 §11 의 목적지
 * @param onMessage   payload 가 JSON 이 아니면 호출되지 않는다(아래 주석 참고)
 * @returns 해지 함수. 같은 목적지의 마지막 구독자가 빠지면 소켓 구독도 끊는다
 */
export function subscribeStomp<T>(destination: string, onMessage: (body: T) => void): () => void {
  const handler = onMessage as (body: unknown) => void;
  const existing = handlers.get(destination);

  if (existing) {
    existing.add(handler);
  } else {
    handlers.set(destination, new Set([handler]));
    openSubscription(destination);
  }

  return () => {
    const set = handlers.get(destination);
    if (!set) return;
    set.delete(handler);
    if (set.size > 0) return;

    handlers.delete(destination);
    subscriptions.get(destination)?.unsubscribe();
    subscriptions.delete(destination);
  };
}

/** 연결돼 있을 때만 실제 SUBSCRIBE 를 보낸다. 아직이면 {@code onConnect} 가 대신 건다 */
function openSubscription(destination: string): void {
  if (!client?.connected || subscriptions.has(destination)) return;

  const subscription = client.subscribe(destination, (message: IMessage) => {
    const body = parse(message.body);
    // 파싱 실패는 구독자에게 넘기지 않는다 — 각 구독자가 try/catch 를 중복해서 들고 있게 된다
    if (body !== undefined) handlers.get(destination)?.forEach((handler) => handler(body));
  });

  subscriptions.set(destination, subscription);
}

function parse(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    console.error('[stomp] JSON 이 아닌 메시지', body);
    return undefined;
  }
}
