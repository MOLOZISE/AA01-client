import { api } from "./api"

export async function sendChat(userInput: string, sessionId: string) {
  const response = await api.post("/api/chat", {
    session_id: sessionId,
    user_input: userInput,
  });
  return response.data.reply;
}

// 워크플로우 실행 API (Agentic AI용)
export async function runWorkflow(input: string) {
  const response = await api.post("/api/run_workflow", {
    input: input,
  });
  return response.data.response;  // 최종 응답만 가져오기
}