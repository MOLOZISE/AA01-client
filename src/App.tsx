import { useEffect, useState } from "react";
import { sendChat, runWorkflow } from "./api/chat"; // ✅ runWorkflow 추가
import { fetchSessions, deleteSession as deleteSessionAPI, fetchSessionMessages } from "./api/session";
import { saveMessage, loadMessages, deleteSessionMessages } from "./api/memory";
import { clipMessages } from "./utils/clipMessages";
import { readFileContent } from "./utils/readFileContent";
import FileListPanel from "./components/FileListPanel";
import SessionListPanel from "./components/SessionListPanel";
import ChatPanel from "./components/ChatPanel";
import TodoListPanel from "./components/TodoListPanel";
import NotePanel from "./components/NotePanel";
import { vectorStoreAdd } from "./api/vectorstore"; // ✅ VectorStore API 추가


function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [sessions, setSessions] = useState<{ session_id: string; created_at: string, summary?: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"chat" | "agentic">("chat"); // ✅ 모드 추가 (chat | agentic)

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await fetchSessions();
    setSessions(data);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      if (mode === "agentic") {
        // ✅ Agentic 모드: runWorkflow 호출
        const reply = await runWorkflow(input);
        const assistantMessage = { role: "assistant", content: reply };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
      } else {
        // ✅ 기존 Chat 모드: sendChat 호출
        const contextMessages = clipMessages(updatedMessages, 10);
        const fileMessages = updatedMessages.filter(msg => msg.role === "file");
        const allContext = [...fileMessages, ...contextMessages];
        const contextText = allContext.map(msg => `${msg.role}: ${msg.content}`).join("\n");

        const reply = await sendChat(contextText, currentSessionId);

        const assistantMessage = { role: "assistant", content: reply };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        await saveMessage(currentSessionId, "user", input);
        await saveMessage(currentSessionId, "assistant", reply);

        if (finalMessages.length >= 10 && !sessions.find(s => s.session_id === currentSessionId)?.summary) {
          generateSummary(finalMessages);
        }
      }
    } catch (error) {
      console.error(error);
    }

    setInput("");
  };

  const generateSummary = async (messagesToSummarize: { role: string; content: string }[]) => {
    const summaryText = messagesToSummarize.map(m => `${m.role}: ${m.content}`).join("\n");
    try {
      const summaryReply = await sendChat(`다음 대화를 한 문장으로 요약해줘:\n${summaryText}`, currentSessionId);
      setSessions(prev => prev.map(s => s.session_id === currentSessionId ? { ...s, summary: summaryReply } : s));
    } catch (error) {
      console.error("요약 실패", error);
    }
  };
  const handleDeleteSession = async (sessionId: string) => {
    try {
      console.log("🔵 세션 삭제 요청 시작", sessionId);
      const res1 = await deleteSessionAPI(sessionId);
      console.log("🟢 deleteSessionAPI 성공", res1);

      const res2 = await deleteSessionMessages(sessionId);
      console.log("🟢 deleteSessionMessages 성공", res2);

      const updatedSessions = await fetchSessions();
      console.log("🟣 fetchSessions 응답", updatedSessions);

      setSessions(updatedSessions);

      if (currentSessionId === sessionId) {
        setCurrentSessionId("");
        setMessages([]);
      }
    } catch (error) {
      console.error("🔴 세션 삭제 실패:", error);
    }
  };


  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const msgs = await loadMessages(sessionId);
    setMessages(msgs);
  };

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);

      for (const file of files) {
        try {
          const content = await readFileContent(file);
          if (currentSessionId) {
            const fileMessage = { role: "file", content: `(파일 업로드 내용 일부) ${content.slice(0, 1000)}` };
            const updatedMessages = [...messages, fileMessage];
            setMessages(updatedMessages);
            await saveMessage(currentSessionId, "file", content.slice(0, 1000));

            // ✅ VectorStore에 저장
            await vectorStoreAdd(file.name, content);
          }
        } catch (error) {
          console.error("파일 읽기 실패", error);
        }
      }
    }
  };


  return (
    <div className="w-full h-screen bg-zinc-900 text-white overflow-hidden">
      <div className="flex flex-row w-full h-full">

        {/* 왼쪽 패널: 파일 + 세션 */}
        <div className="flex flex-col gap-4 w-1/5 min-w-[240px] p-4 border-r border-zinc-700 overflow-y-auto">
          <FileListPanel uploadedFiles={uploadedFiles} handleFileUpload={handleFileUpload} />
          <SessionListPanel
            sessions={sessions}
            currentSessionId={currentSessionId}
            handleNewSession={handleNewSession}
            handleSelectSession={handleSelectSession}
            handleDeleteSession={handleDeleteSession}
          />
        </div>

        {/* 중앙 패널: 채팅 + 모드 전환 버튼 */}
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          {/* ✅ 모드 전환 버튼 */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded ${mode === "chat" ? "bg-blue-500" : "bg-gray-700"}`}
              onClick={() => setMode("chat")}
            >
              일반 채팅 모드
            </button>
            <button
              className={`px-4 py-2 rounded ${mode === "agentic" ? "bg-green-500" : "bg-gray-700"}`}
              onClick={() => setMode("agentic")}
            >
              Agentic 모드
            </button>
          </div>

          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            currentSessionId={currentSessionId}
          />
        </div>

        {/* 오른쪽 패널: 할 일 + 메모 */}
        <div className="flex flex-col gap-4 w-1/5 min-w-[240px] p-4 border-l border-zinc-700 overflow-y-auto">
          <TodoListPanel />
          <NotePanel />
        </div>

      </div>
    </div>
  );
}

export default App;
