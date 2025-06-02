import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { searchByLLM } from "../api/fileSearch"; // ✅ LLM 검색 API
import { FileSearchResultPanel } from "./FileSearchResultPanel"; // ✅ 결과 표시 컴포넌트

interface Message {
  role: string;
  content: string;
}

interface FileSearchResult {
  filename: string;
  reason?: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  setInput: (text: string) => void;
  handleSend: () => void;
  currentSessionId: string;
  onAddTodo: (text: string) => void;
  onAddNote: (text: string) => void;
  onRegenerate: (original: string) => void;
  onSummarize: (text: string) => void;
  streamingReply?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  input,
  setInput,
  handleSend,
  currentSessionId,
  onAddTodo,
  onAddNote,
  onRegenerate,
  onSummarize,
  streamingReply
}) => {
  const [addTodo, setAddTodo] = useState(false);
  const [addNote, setAddNote] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]); // ✅ 파일 검색 결과

  const handleSendWithOptions = async () => {
    if (addTodo) onAddTodo(input);
    if (addNote) onAddNote(input);
    handleSend();
    setAddTodo(false);
    setAddNote(false);

    // ✅ 사용자 입력 기반 LLM 파일 검색 실행
    if (input.trim()) {
      try {
        const results = await searchByLLM(input);
        setSearchResults(results);
      } catch (err) {
        console.error("LLM 파일 검색 실패:", err);
        setSearchResults([]);
      }
    }
  };

  const renderContent = (text: string, idx: number) => {
    const regex = /<think>([\s\S]*?)<\/think>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(<div key={`${idx}-pre-${lastIndex}`}>{before}</div>);

      const content = match[1];
      const isOpen = expanded[idx];
      parts.push(
        <div key={`${idx}-think`} className="bg-zinc-800 rounded p-2 mt-2">
          <button
            className="text-xs text-blue-300 underline mb-1"
            onClick={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
          >
            {isOpen ? "접기" : "GPT 생각 보기"}
          </button>
          {isOpen && (
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<div key={`${idx}-post`}>{text.slice(lastIndex)}</div>);
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${msg.role === "user" ? "bg-zinc-800 text-white" : "bg-zinc-700 text-white"}`}
          >
            <div className="whitespace-pre-wrap">{renderContent(msg.content, idx)}</div>
            {msg.role === "assistant" && (
              <div className="mt-2 flex gap-2 text-sm flex-wrap">
                <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => onAddTodo(msg.content)}>🗓 할 일로 추가</button>
                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => onAddNote(msg.content)}>📝 메모로 저장</button>
                <button className="px-2 py-1 bg-yellow-600 text-white rounded" onClick={() => onSummarize(msg.content)}>📄 요약하기</button>
                <button className="px-2 py-1 bg-purple-600 text-white rounded" onClick={() => onRegenerate(msg.content)}>🔁 다시 생성</button>
              </div>
            )}
          </div>
        ))}

        {streamingReply && currentSessionId && (
          <div className="p-2 rounded bg-zinc-700 text-white whitespace-pre-wrap">
            <ReactMarkdown>{streamingReply}</ReactMarkdown>
          </div>
        )}

        {/* ✅ 관련 파일 결과 표시 */}
        {searchResults.length > 0 && (
          <FileSearchResultPanel results={searchResults} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center text-sm">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={addTodo} onChange={(e) => setAddTodo(e.target.checked)} /> 할 일로 추가
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={addNote} onChange={(e) => setAddNote(e.target.checked)} /> 메모로 저장
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-zinc-800 text-white p-2 rounded"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendWithOptions();
              }
            }}
          />
          <button
            onClick={handleSendWithOptions}
            className="bg-blue-500 px-4 py-2 rounded text-white"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
