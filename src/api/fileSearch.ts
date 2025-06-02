import { api } from "./api";

// 📁 파일 요약 업로드 (백엔드에 저장용)
export async function uploadFileSummary(
  filename: string,
  summary: string,
  content: string
): Promise<void> {
  await api.post("/api/files", {
    filename,
    summary,
    content,
  });
}

// 🔍 LLM 기반 검색 요청
export async function searchByLLM(query: string): Promise<
  { filename: string; reason?: string }[]
> {
  const response = await api.post("/api/search-by-llm", {
    query,
  });

  try {
    // Gemini가 문자열로 JSON을 반환하는 경우 parsing 필요
    const raw = response.data.results;
    if (typeof raw === "string") {
      return JSON.parse(raw);
    } else {
      return raw;
    }
  } catch (e) {
    console.error("LLM 검색 결과 파싱 실패:", e);
    return [];
  }
}
