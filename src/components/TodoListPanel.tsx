import React from "react";

const TodoListPanel: React.FC = () => {
  return (
    <div className="h-full border border-zinc-700 rounded p-3">
      <h3 className="text-sm font-semibold mb-2">✅ 할 일</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center space-x-2">
          <input type="checkbox" />
          <span>LLM 연동 개선하기</span>
        </li>
        <li className="flex items-center space-x-2">
          <input type="checkbox" />
          <span>Prompt 저장 기능 추가</span>
        </li>
      </ul>
    </div>
  );
};

export default TodoListPanel;