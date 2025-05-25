import React from "react";

interface SessionListPanelProps {
  sessions: { session_id: string; created_at: string; summary: string }[];
  currentSessionId: string;
  handleNewSession: () => void;
  handleSelectSession: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => void;
}

const SessionListPanel: React.FC<SessionListPanelProps> = ({ sessions, currentSessionId, handleNewSession, handleSelectSession, handleDeleteSession }) => {
  return (
    <div className="h-full border border-zinc-700 rounded p-3 overflow-y-auto">
      <h2 className="text-sm font-bold mb-2">💬 세션</h2>
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white w-full py-1 mb-2 rounded"
        onClick={handleNewSession}
      >
        + 새 세션 시작
      </button>
      <ul className="space-y-1 text-xs">
        {sessions.map((session) => (
          <li
            key={session.session_id}
            className={`flex justify-between items-center px-2 py-1 rounded ${session.session_id === currentSessionId ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            <button
              onClick={() => handleSelectSession(session.session_id)}
              className="text-left flex-1 truncate"
            >
              {session.summary || session.session_id}
            </button>
            <button
              className="text-red-400 ml-2"
              onClick={() => handleDeleteSession(session.session_id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionListPanel;