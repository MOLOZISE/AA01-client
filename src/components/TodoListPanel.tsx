import React from "react";

const TodoListPanel: React.FC<{
  todos: { id: number; text: string; done: boolean }[];
  setTodos: React.Dispatch<React.SetStateAction<any[]>>;
}> = ({ todos, setTodos }) => {
  const toggleTodoDone = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="h-full border border-zinc-700 rounded p-3">
      <h3 className="text-sm font-semibold mb-2">✅ 할 일</h3>
      <ul className="space-y-2 text-sm">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center space-x-2">
            <input type="checkbox" checked={todo.done} onChange={() => toggleTodoDone(todo.id)} />
            <span className={todo.done ? "line-through text-gray-400" : ""}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} className="text-red-400 ml-auto">삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoListPanel;
