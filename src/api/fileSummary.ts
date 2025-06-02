// src/api/fileSummary.ts
import { api } from "./api";

export async function summarizeFileContent(content: string): Promise<string> {
  const res = await api.post("/api/summarize", { content });
  return res.data.summary;
}

export async function uploadFileSummary(filename: string, summary: string, content: string) {
  await api.post("/api/files", { filename, summary, content });
}
