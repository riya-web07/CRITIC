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

  // DOWNLOAD CODE
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
    <div className="flex flex-col h-full bg-[#151515] p-4 text-white">
      {/* Logo */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h2 className="font-bold text-lg text-green-500 flex items-center gap-2">
          <span>👥</span> Connected
        </h2>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => (
            <div key={client.socketId} className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded transition cursor-pointer">
              <Avatar name={client.username} size="40" round="10px" />
              <div className="flex flex-col">
                <span className="font-bold text-sm">{client.username}</span>
                <span className="text-xs text-green-400">● Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={copyRoomId}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2"
        >
          Copy Room ID
        </button>
        <button onClick={downloadCode} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition text-sm">
          Download Code
        </button>
        <button onClick={leaveRoom} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
