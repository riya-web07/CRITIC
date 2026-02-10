import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EditorComponent from "../components/Editor";
import TerminalComponent from "../components/Terminal";
import Sidebar from "../components/Sidebar";
import { useRecoilState, useRecoilValue } from "recoil";
import { codeState, languageState, outputState } from "../store/atoms";
import { executeCode, saveProject, getProject } from "../api"; // <--- Updated import
import { initSocket } from "../socket";
import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "../constants";

const EditorPage = () => {
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  // State
  const [code, setCode] = useRecoilState(codeState);
  const [language, setLanguage] = useRecoilState(languageState); // <--- We need setLanguage now
  const [output, setOutput] = useRecoilState(outputState);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Refs (To fix stale closures in socket listeners)
  const socketRef = useRef(null);
  const codeRef = useRef(code); // <--- NEW: Tracks latest code
  const languageRef = useRef(language); // <--- NEW: Tracks latest language

  // Update refs whenever state changes
  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const init = async () => {
      // Try to load saved code from DB
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUserId(user._id);
      }
      try {
        const savedProject = await getProject(roomId || "");
        if (savedProject) {
          setCode(savedProject.code);
          setLanguage(savedProject.language);
          setOwnerId(savedProject.owner);
          codeRef.current = savedProject.code; // Update Ref
          languageRef.current = savedProject.language; // Update Ref
        }
      } catch (error) {
        // No project found, that's fine (it's a new room)
        console.log("No saved project found, starting fresh.");
      }

      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/home");
      }

      socketRef.current.emit("join", {
        roomId,
        username: location.state?.username,
      });

      // ... inside the useEffect, after socket emit 'join'

      // 1. LISTEN FOR JOINED EVENT
      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room.`);

          // <--- NEW: Sync both Code and Language to the new user
          socketRef.current.emit("sync-code", {
            code: codeRef.current,
            language: languageRef.current, // Send current language too!
            socketId,
          });
        }
        setClients(clients);
      });

      // 2. LISTEN FOR CODE CHANGE
      socketRef.current.on("code-change", ({ code }) => {
        setCode(code);
      });

      // 3. LISTEN FOR LANGUAGE CHANGE (<--- NEW)
      socketRef.current.on("language-change", ({ language }) => {
        setLanguage(language);
        languageRef.current = language; // Update ref immediately
      });

      socketRef.current.on("disconnected", ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };

    if (location.state?.username) {
      init();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off("joined");
        socketRef.current.off("disconnected");
      }
      setCode("// Write your code here\nconsole.log('Hello World!');");
      setLanguage("javascript");
      setOutput(["Click 'Run' to see output..."]);
    };
  }, []);

  const runCode = async () => {
    const sourceCode = code;
    if (!sourceCode) return;
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
    } catch (error) {
      console.log(error);
      setOutput(["Error: Failed to execute code."]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCode = async () => {
    try {
      await saveProject(roomId || "", code, language);
      toast.success("Project saved successfully!");
    } catch (error) {
      toast.error("Failed to save project.");
      console.error(error);
    }
  };

  // 4. EMIT CODE CHANGE
  const onCodeChange = (code) => {
    codeRef.current = code; // Update ref
    if (socketRef.current) {
      socketRef.current.emit("code-change", {
        roomId,
        code,
      });
    }
    setCode(code);
  };

  // 5. EMIT LANGUAGE CHANGE (<--- NEW)
  const onSelectChange = (e) => {
    const newLang = e.target.value;

    // 1. Update Language State
    setLanguage(newLang);
    languageRef.current = newLang;

    // 2. Get the specific snippet (e.g., "print('Hello World')")
    const newCode = CODE_SNIPPETS[newLang];

    // 3. Update Code State locally
    setCode(newCode);
    codeRef.current = newCode;

    // 4. Broadcast BOTH changes to the room
    if (socketRef.current) {
      // Tell others: "Switch to Python"
      socketRef.current.emit("language-change", {
        roomId,
        language: newLang,
      });

      // Tell others: "Here is the new Python template"
      socketRef.current.emit("code-change", {
        roomId,
        code: newCode,
      });
    }
  };

  if (!location.state) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-gray-900 text-white overflow-hidden">
      <header className="flex-none h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {/* Simple Hamburger Icon (3 lines) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-bold text-lg tracking-tight hidden md:block">CRITIC</span>
          </div>

          <div className="relative">
            <select
              value={language}
              onChange={onSelectChange} // <--- Attached the new function
              className="bg-gray-700 text-white text-xs font-bold py-1 px-2 rounded border border-gray-600 focus:outline-none focus:border-green-500 capitalize cursor-pointer"
            >
              {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded hidden md:block">Room: {roomId}</span>
        </div>

        {/* Right side of Header */}
        <div className="flex items-center gap-2">
          {(ownerId === null || ownerId === currentUserId) && (
            <button
              onClick={saveCode}
              className="p-1 md:px-3 md:py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition"
              title="Save Project" // Tooltip for hover
            >
              <span className="text-lg">💾</span>
              {/* HIDDEN on mobile, VISIBLE on medium screens up */}
              <span className="hidden md:block font-semibold text-sm">Save</span>
            </button>
          )}

          {/* Optional: Show a "Read Only" badge for guests */}
          {ownerId && ownerId !== currentUserId && (
            <span className="p-1 md:px-3 md:py-1 rounded text-sm font-semibold bg-gray-700 text-gray-400 border border-gray-600 cursor-not-allowed">
              Guest Mode (No Save)
            </span>
          )}

          <button
            onClick={runCode}
            disabled={isLoading}
            className={`p-1 md:px-3 md:py-1 rounded transition flex items-center gap-2
            ${isLoading ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}
        `}
          >
            <span className="text-lg">▶</span>
            {/* HIDDEN on mobile, VISIBLE on medium screens up */}
            <span className="hidden md:block font-semibold text-sm">{isLoading ? "Running..." : "Run"}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`
    fixed md:relative z-50 h-full w-64 bg-gray-900 border-r border-gray-700 flex flex-col transition-transform duration-300 ease-in-out
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
`}
        >
          {/* Close Button for Mobile Sidebar */}
          <div className="md:hidden flex justify-end p-2">
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
              ✖
            </button>
          </div>

          <Sidebar clients={clients} />
        </aside>
        {/* Add a dark overlay when sidebar is open on mobile */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        <main className="flex-1 flex flex-col min-w-0">
          <section className="flex-1 relative min-h-0">
            <div className="absolute inset-0">
              <EditorComponent key={roomId} onCodeChange={onCodeChange} />
            </div>
          </section>
          <section className="h-32 md:h-64 bg-black border-t border-gray-700 shrink-0">
            <TerminalComponent />
          </section>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
