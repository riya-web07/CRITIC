import React from "react";
import Editor from "@monaco-editor/react";
import { useRecoilState } from "recoil";
import { codeState, languageState } from "../store/atoms";

const EditorComponent = ({ onCodeChange }) => {
  const [code] = useRecoilState(codeState); // Removed setCode, we use the prop now
  const [language] = useRecoilState(languageState);

  const handleEditorChange = (value) => {
    if (value !== undefined) {
      onCodeChange(value); // <--- Call the socket function
    }
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        language={language}
        theme="vs-dark"
        value={code} // Value comes from Recoil (which is updated by Socket)
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default EditorComponent;
