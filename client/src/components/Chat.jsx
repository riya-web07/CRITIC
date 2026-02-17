import React, { useState, useEffect, useRef } from "react";

const Chat = ({ socket, roomId, username }) => {
  const [isOpen, setIsOpen] = useState(false); // Collapsible state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
      setIsOpen((currentIsOpen) => {
        if (!currentIsOpen) {
          setHasNewMessage(true);
        }
        return currentIsOpen;
      });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    socket.on("chat:receive", handleReceiveMessage);

    return () => {
      socket.off("chat:receive", handleReceiveMessage);
    };
  }, [socket]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      // REMOVED 'username' from here.
      // The server will attach the correct name based on socket.id
      socket.emit("chat:send", { roomId, message: newMessage });
      setNewMessage("");
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end transition-all ${isOpen ? "w-80" : "w-auto"}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg mb-2 flex items-center justify-center transition-colors"
      >
        {hasNewMessage && !isOpen && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}

        {isOpen ? (
          // Close Icon (X)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Chat Icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full h-96 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-gray-200">Room Chat</div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.username === username ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.username === username ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}
                >
                  {msg.message}
                </div>
                <span className="text-xs text-gray-500 mt-1">{msg.username}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
