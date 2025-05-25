// ✅ App.tsx 재수정: system 메시지는 UI에만 표시, DB에는 저장하지 않음 + 중복 제거

import { useEffect, useState, useRef } from "react";
import { sendChat, runWorkflow } from "./api/chat";
import { fetchSessions, deleteSession as deleteSessionAPI } from "./api/session";
import { saveMessage, loadMessages, deleteSessionMessages } from "./api/memory";
import { clipMessages } from "./utils/clipMessages";
import { readFileContent } from "./utils/readFileContent";
import FileListPanel from "./components/FileListPanel";
import SessionListPanel from "./components/SessionListPanel";
import ChatPanel from "./components/ChatPanel";
import TodoListPanel from "./components/TodoListPanel";
import NotePanel from "./components/NotePanel";
import { vectorStoreAdd } from "./api/vectorstore";
import { sendChatStream } from "./api/chat";
import { saveSessionSummary } from "./api/session";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [sessions, setSessions] = useState<{ session_id: string; created_at: string; summary: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"chat" | "agentic">("chat");

  const [todos, setTodos] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [notes, setNotes] = useState<{ id: number; text: string; checked: boolean }[]>([]);
  const [noteFilter, setNoteFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("user01");

  const [selectedModel, setSelectedModel] = useState<"lm" | "google">("google");
  const [streamingReply, setStreamingReply] = useState("");
  const [isNewSession, setIsNewSession] = useState(false);

//  const isNewSessionRef = useRef(false);

  useEffect(() => {
    loadSessions();
    setMessages([{ role: "system", content: "💬 새 세션이 시작되었습니다. 메시지를 입력해 보세요!" }]);
    const storedTodos = localStorage.getItem("todos");
    const storedNotes = localStorage.getItem("notes");
    if (storedTodos) setTodos(JSON.parse(storedTodos));
    if (storedNotes) setNotes(JSON.parse(storedNotes));
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const loadSessions = async () => {
    const data = await fetchSessions();
    setSessions(data);
    
  };
 
  const handleSend = async () => {
    if (!input.trim()) return;

    //const isNewSession = isNewSessionRef.current || !currentSessionId;
    const sessionId = currentSessionId || `session-${Date.now()}`;

    if (isNewSession || !currentSessionId) {
      setCurrentSessionId(sessionId);
      setSessions(prev => [...prev, {
        session_id: sessionId,
        created_at: new Date().toISOString(),
        summary: "요약 생성 중..."
      }]);
      setIsNewSession(false);
      //isNewSessionRef.current = false;
    }

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      if (mode === "agentic") {
        const reply = await runWorkflow(input);
        const assistantMessage = { role: "assistant", content: reply };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        await saveMessage(sessionId, "user", input);
        await saveMessage(sessionId, "assistant", reply);
      } else {
        const contextMessages = clipMessages(updatedMessages, 10);
        const fileMessages = updatedMessages.filter(m => m.role === "file");
        const allContext = [...fileMessages, ...contextMessages];
        const noteContext = notes.filter(n => n.checked).map(n => `- ${n.text}`).join("\n");

        const ragPrompt = noteContext
          ? `🧠 참고 메모:\n${noteContext}\n\n📨 대화:\n${allContext.map(m => `${m.role}: ${m.content}`).join("\n")}`
          : allContext.map(m => `${m.role}: ${m.content}`).join("\n");

        let replyBuffer = "";
        setStreamingReply("");

        await sendChatStream(ragPrompt, sessionId, selectedModel, (chunk) => {
          replyBuffer += chunk;
          setStreamingReply(replyBuffer);
        });

        const assistantMessage = { role: "assistant", content: replyBuffer };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        setStreamingReply("");

        await saveMessage(sessionId, "user", input);
        await saveMessage(sessionId, "assistant", replyBuffer);

        const newTodos = replyBuffer
          .split(/\r?\n/)
          .filter(line => line.trim().startsWith("#TODO:"))
          .map(line => line.replace("#TODO:", "").trim());

        if (newTodos.length > 0) {
          setTodos(prev => [
            ...prev,
            ...newTodos.map(text => ({ id: Date.now() + Math.random(), text, done: false }))
          ]);
        }

        if (isNewSession) {
          try {
            const summary = await sendChat(
              `다음은 AI의 응답입니다:\n\"${replyBuffer}\"\n이 응답의 핵심 주제를 10자 이내 한국어로 간결하게 요약해줘.`,
              sessionId,
              selectedModel
            );
            await saveSessionSummary(sessionId, summary);
            //await loadSessions();
            setSessions(prev =>
              prev.map(s =>
                s.session_id === sessionId ? { ...s, summary } : s
              )
            );
          } catch (err) {
            console.warn("세션 요약 실패:", err);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }

    setInput("");
  };

 

  const handleAddTodoFromGPT = (text: string) => {
    setTodos(prev => [...prev, { id: Date.now() + Math.random(), text, done: false }]);
  };

  const handleAddNoteFromGPT = (text: string) => {
    setNotes(prev => [...prev, { id: Date.now() + Math.random(), text, checked: false }]);
  };

  const handleRegenerate = async (original: string) => {
    if (!currentSessionId) return;
    const reply = await sendChat(original, currentSessionId, selectedModel);
    const assistantMessage = { role: "assistant", content: reply };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleSummarize = async (text: string) => {
    if (!currentSessionId) return;
    const reply = await sendChat(`다음을 한 문장으로 요약해줘:\n${text}`, currentSessionId, selectedModel);
    const assistantMessage = { role: "assistant", content: reply };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const generateSummary = async (messagesToSummarize: { role: string; content: string }[]) => {
    const summaryText = messagesToSummarize.map(m => `${m.role}: ${m.content}`).join("\n");
    try {
      const summaryReply = await sendChat(`다음 대화를 한 문장으로 요약해줘:\n${summaryText}`, currentSessionId, selectedModel);
      setSessions(prev => prev.map(s => s.session_id === currentSessionId ? { ...s, summary: summaryReply } : s));
    } catch (error) {
      console.error("요약 실패", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSessionAPI(sessionId);                         // 세션 목록용
      await fetch(`/messages/${sessionId}`, { method: "DELETE" });// 메시지+JSON 삭제
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId("");
        setMessages([]);
      }
    } catch (error) {
      console.error("세션 삭제 실패:", error);
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
    //setMessages([]);
    setMessages([{ role: "system", content: "💬 새 세션이 시작되었습니다. 메시지를 입력해 보세요!" }]);
    setIsNewSession(true);
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

        


        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          {/* 중앙 영역 상단에 사용자 선택 UI 추가 */}
          <div className="flex justify-between items-center mb-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <label htmlFor="user-select">사용자:</label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-zinc-800 border border-zinc-600 px-2 py-1 rounded text-white"
              >
                <option value="user01">user01</option>
                <option value="user02">user02</option>
                <option value="user03">user03</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="model-select">모델:</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as "lm" | "google")}
                className="bg-zinc-800 border border-zinc-600 px-2 py-1 rounded text-white"
              >
                <option value="lm">LM Studio</option>
                <option value="google">Gemini</option>
              </select>
            </div>
            <span>{selectedUser}님, 안녕하세요 🙌</span>
          </div>
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
            onAddTodo={handleAddTodoFromGPT}
            onAddNote={handleAddNoteFromGPT}
            onRegenerate={handleRegenerate}
            onSummarize={handleSummarize}
            streamingReply={streamingReply}
          />
        </div>

        <div className="flex flex-col gap-4 w-1/5 min-w-[240px] p-4 border-l border-zinc-700 overflow-y-auto">
          <TodoListPanel todos={todos} setTodos={setTodos} />
          <NotePanel notes={notes} setNotes={setNotes} />
        </div>
      </div>
    </div>
  );
}

export default App;
