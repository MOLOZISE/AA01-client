import React from "react";

const NotePanel: React.FC = () => {
  return (
    <div className="h-full border border-zinc-700 rounded p-3">
      <h3 className="text-sm font-semibold mb-2">📝 메모</h3>
      <textarea
        className="w-full h-32 min-h-[8rem] bg-zinc-800 text-white p-2 rounded border border-zinc-700 resize-none"
        placeholder="메모를 작성하세요..."
      />
    </div>
  );
};

export default NotePanel;
