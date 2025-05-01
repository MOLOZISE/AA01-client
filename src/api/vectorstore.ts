// src/api/vectorstore.ts

import { api } from "./api";  // 이미 있는 axios 인스턴스

export async function vectorStoreAdd(docId: string, content: string) {
  const response = await api.post(`/api/vectorstore/add`, {
    doc_id: docId,
    content,
  });
  return response.data;
}
