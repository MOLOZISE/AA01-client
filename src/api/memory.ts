import { api } from "./api"

export interface Message {
  role: string;
  content: string;
}

// 메시지 저장
export async function saveMessage(session_id: string, role: string, content: string) {
  const response = await api.post("/api/messages", {
    session_id,
    role,
    content,
  });
  return response.data;
}

// 세션별 메시지 불러오기
export async function loadMessages(sessionId: string): Promise<Message[]> {
  const response = await api.get(`/api/messages/${sessionId}`);
  return response.data;
}

// 세션 전체 삭제
export async function deleteSessionMessages(sessionId: string) {
  const response = await api.delete(`/api/messages/${sessionId}`);
  return response.data;
}
