import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getAllProjects, deleteProject } from "../api";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.log("Failed to fetch projects");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID & Username is required");
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: { username },
    });
  };

  const openProject = (project) => {
    let user = username;
    if (!user) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        user = JSON.parse(storedUser).username;
      }
    }
    navigate(`/editor/${project.roomId}`, {
      state: { username: user || "Owner" },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  const handleDelete = async (e, roomId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(roomId);
      toast.success("Project deleted");
      setProjects((prev) => prev.filter((p) => p.roomId !== roomId));
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    toast.success("Logged out");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      {/* LEFT PANEL: Join Form */}
      {/* TWEAK: Reduced mobile padding (p-4) so it doesn't hog the screen */}
      <div className="w-full md:w-[450px] p-4 md:p-8 flex flex-col justify-center bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 shrink-0">
        <div className="mb-6 md:mb-8 text-center">
          <span className="text-4xl">🚀</span>
          <h4 className="text-2xl font-bold mt-2">CRITIC</h4>
          <p className="text-gray-400 text-sm mt-1">Real-time collaboration suite</p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Join a Room</div>
          <input
            type="text"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500 font-bold text-white w-full"
            placeholder="ROOM ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500 font-bold text-white w-full"
            placeholder="USERNAME"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition shadow-lg mt-2" onClick={joinRoom}>
            Join Room
          </button>

          <div className="text-center text-gray-400 mt-2 text-sm">
            <span className="opacity-70">No invite? </span>
            <a onClick={createNewRoom} href="" className="text-green-500 hover:underline font-bold">
              Create new room
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Projects */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-900">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📂</span> Your Projects
          </h2>

          {/* TWEAK: SVG Icon for Logout (Clean on mobile) */}
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded text-sm transition shadow-md"
            title="Logout"
          >
            <span className="hidden md:inline">Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>

        {/* LOADING / EMPTY STATES */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 animate-pulse text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg p-8 md:p-12 text-center text-sm md:text-base">
            No saved projects yet. <br /> Create a room and click "Save"!
          </div>
        ) : (
          /* PROJECT GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => openProject(project)}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-green-500 cursor-pointer transition shadow-lg group relative"
              >
                {/* TWEAK: SVG Icon for Delete */}
                <button
                  onClick={(e) => handleDelete(e, project.roomId)}
                  className="absolute bottom-3 right-3 p-2 bg-gray-700/50 hover:bg-red-600 text-gray-400 hover:text-white rounded-full transition z-10 backdrop-blur-sm"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-green-400 truncate w-[70%]">{project.name || "Untitled"}</h3>
                  <span className="text-[10px] bg-gray-700 px-2 py-1 rounded text-gray-300 uppercase font-semibold border border-gray-600">
                    {project.language}
                  </span>
                </div>

                <p className="text-gray-500 text-[10px] md:text-xs mb-4 font-mono">ID: {project.roomId.substring(0, 8)}...</p>

                <div className="text-[10px] text-gray-500 text-left">{new Date(project.updatedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
