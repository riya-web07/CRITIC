import React from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { codeState, languageState } from "../store/atoms";
import { FILE_EXTENSIONS } from "../constants";

const Sidebar = ({ clients }) => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const code = useRecoilValue(codeState);
  const language = useRecoilValue(languageState);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId || "");
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Could not copy Room ID");
    }
  };

  const leaveRoom = () => {
    navigate("/home");
  };

  const downloadCode = () => {
    const extension = FILE_EXTENSIONS[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `CodeCollab_Snippet.${extension}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#151515] text-white p-4">
      {/* 1. HEADER (Logo/Title) */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4 shrink-0">
        <span className="text-2xl">👥</span>
        <h2 className="font-bold text-lg text-green-500">Connected</h2>
      </div>

      {/* 2. SCROLLABLE LIST (Grows to fill space) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="flex flex-col gap-3">
          {clients.map((client) => (
            <div key={client.socketId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition cursor-default">
              <Avatar name={client.username} size="36" round="8px" className="font-bold" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate max-w-[120px]" title={client.username}>
                  {client.username}
                </span>
                <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FIXED BOTTOM BUTTONS (Stays at bottom) */}
      <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-gray-700 shrink-0 pb-6 md:pb-0">
        <button onClick={copyRoomId} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded text-sm transition">
          Copy Room ID
        </button>

        <button onClick={downloadCode} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded text-sm transition">
          Download Code
        </button>

        <button onClick={leaveRoom} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-sm transition">
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
