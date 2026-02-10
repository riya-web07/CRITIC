import { useRecoilState } from "recoil";
import { outputState } from "../store/atoms"; // <--- Connect to the brain

const TerminalComponent = () => {
  const [output, setOutput] = useRecoilState(outputState); // <--- Listen for changes

  const clearTerminal = () => {
    // Reset the state to an empty array or initial message
    setOutput(["// Terminal Cleared"]);
  };

  return (
    <div className="w-full h-full text-sm font-mono p-4 overflow-auto custom-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800 sticky top-0 bg-black z-10">
        <span className="font-bold text-gray-400 text-xs tracking-wider uppercase">Terminal</span>
        <button className="text-xs text-gray-500 hover:text-white transition" onClick={clearTerminal}>
          Clear
        </button>
      </div>

      {/* The Logs */}
      <div className="space-y-1">
        {output.map((line, index) => (
          <p key={index} className={`${line.startsWith("Error") || line.includes("stderr") ? "text-red-500" : "text-green-400"}`}>
            {line}
          </p>
        ))}

        {/* Blinking Cursor Effect */}
        <p className="text-gray-500 animate-pulse">_</p>
      </div>
    </div>
  );
};

export default TerminalComponent;
