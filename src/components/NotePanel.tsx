// components/NotePanel.tsx
import React, { useState, useMemo } from "react";

interface NotePanelProps {
  notes: { id: number; text: string; checked: boolean }[];
  setNotes: React.Dispatch<React.SetStateAction<any[]>>;
}

const NotePanel: React.FC<NotePanelProps> = ({ notes, setNotes }) => {
  const [newNote, setNewNote] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleNoteCheck = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, checked: !n.checked } : n));
  };
  const deleteNote = (id: number) => setNotes(notes.filter(n => n.id !== id));
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value);
  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, { id: Date.now(), text: newNote, checked: false }]);
      setNewNote("");
    }
  };

  const extractTags = (text: string): string[] => {
    return text.match(/#[\w가-힣]+/g) || [];
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => extractTags(note.text).forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [notes]);

  const filteredNotes = filter
    ? notes.filter(n => extractTags(n.text).includes(filter))
    : notes;

  const renderContent = (text: string, id: number) => {
    const regex = /<think>([\s\S]*?)<\/think>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(<div key={`${id}-pre-${lastIndex}`}>{before}</div>);

      const content = match[1];
      const isOpen = expanded[id];
      parts.push(
        <div key={`${id}-think`} className="bg-zinc-800 rounded p-2 mt-2">
          <button
            className="text-xs text-blue-300 underline mb-1"
            onClick={() => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
          >
            {isOpen ? "접기" : "GPT 생각 보기"}
          </button>
          {isOpen && <div className="text-sm text-gray-300 whitespace-pre-wrap">{content}</div>}
        </div>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<div key={`${id}-post`}>{text.slice(lastIndex)}</div>);
    }

    return parts;
  };

  return (
    <div className="h-full border border-zinc-700 rounded p-3">
      <h3 className="text-sm font-semibold mb-2">📝 메모</h3>
      <textarea
        className="w-full h-24 bg-zinc-800 text-white p-2 rounded border border-zinc-700 resize-none"
        placeholder="메모를 작성하세요..."
        value={newNote}
        onChange={handleNoteChange}
      />
      <button onClick={handleAddNote} className="mt-2 w-full bg-blue-500 py-1 rounded text-sm">
        메모 추가
      </button>

      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="text-gray-400">태그 필터:</span>
          <button onClick={() => setFilter(null)} className={`px-2 py-1 rounded ${filter === null ? "bg-blue-600" : "bg-zinc-700"}`}>전체</button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-2 py-1 rounded ${filter === tag ? "bg-blue-600" : "bg-zinc-700"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-3 space-y-2 text-sm">
        {filteredNotes.map(note => (
          <li key={note.id} className="flex flex-col gap-1 bg-zinc-800 p-2 rounded">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={note.checked} onChange={() => toggleNoteCheck(note.id)} />
              <button onClick={() => deleteNote(note.id)} className="ml-auto text-red-400 text-xs">삭제</button>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">
              {renderContent(note.text, note.id)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotePanel;
