// src/api/chat.ts

import { api } from "./api";

// LLM 종류 타입 정의
export type LLMType = "lm" | "google";

// 일반 Chat 요청 (비동기 한방 요청)
export async function sendChat(
  userInput: string,
  sessionId: string,
  llm: LLMType = "lm"
) {
  const endpoint = llm === "lm" ? "/api/lm/chat" : "/api/google/chat";

  const response = await api.post(endpoint, {
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

  return response.data.response;
}


export async function sendChatStream(
  userInput: string,
  sessionId: string,
  model: "lm" | "google",
  onMessage: (chunk: string) => void,
): Promise<void> {
  const response = await fetch(`/api/${model === "google" ? "google" : "lm"}/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, user_input: userInput }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onMessage(chunk);
  }
}