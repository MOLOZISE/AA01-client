import React from "react";

interface FileListPanelProps {
  uploadedFiles: File[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileListPanel: React.FC<FileListPanelProps> = ({ uploadedFiles, handleFileUpload }) => {
  return (
    <div className="h-full border border-zinc-700 rounded p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-2">📁 파일 업로드</h3>
      <input
        type="file"
        multiple
        onChange={handleFileUpload}
        className="text-sm bg-zinc-800 border border-zinc-700 p-2 rounded w-full"
      />
      <ul className="mt-2 text-xs max-h-48 overflow-y-auto list-disc list-inside">
        {uploadedFiles.map((file, idx) => (
          <li key={idx}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default FileListPanel;
