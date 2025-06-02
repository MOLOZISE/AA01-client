interface FileSearchResult {
  filename: string;
  reason?: string;
}

export const FileSearchResultPanel: React.FC<{ results: FileSearchResult[] }> = ({ results }) => (
  <div className="mt-4 border-t border-zinc-600 pt-4">
    <h3 className="text-lg font-bold text-white mb-2">📂 관련 파일 추천</h3>
    {results.map((r, i) => (
      <div key={i} className="bg-zinc-800 p-3 rounded mb-2">
        <div className="text-white font-medium">{r.filename}</div>
        {r.reason && <div className="text-sm text-gray-400 mt-1">{r.reason}</div>}
      </div>
    ))}
  </div>
);
