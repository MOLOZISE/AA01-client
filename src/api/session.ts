import { api } from "./api"

export async function fetchSessions() {
  const response = await api.get(`/api/sessions?t=${Date.now()}`);  // 👈 타임스탬프 추가
  return response.data;
}


export async function deleteSession(sessionId: string) {
  const response = await api.delete(`/api/sessions/${sessionId}`);
  return response.data;
}

// ✅ 특정 세션의 대화 메시지 불러오는 함수 추가!

export async function fetchSessionMessages(sessionId: string) {
  const response = await api.get(`/api/sessions/${sessionId}/messages`);
  return response.data;
}
