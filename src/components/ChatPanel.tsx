import React from "react";

interface ChatPanelProps {
  messages: { role: string; content: string }[];
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  currentSessionId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, input, setInput, handleSend, currentSessionId }) => {
  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* 상단 제목 */}
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold tracking-wide mb-2">Agentic AI - Chat</h1>
        <p className="text-sm text-gray-400">세션 ID: {currentSessionId || "없음"}</p>
      </header>

      {/* 대화창 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-800 rounded-2xl shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-md break-words ${msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-3 rounded-2xl bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
        />
        <button
          onClick={handleSend}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all"
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
