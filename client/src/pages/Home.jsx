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

  // 1. Fetch Projects on Mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.log("Failed to fetch projects (user might not be logged in yet)");
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

  // <--- NEW: Handler for clicking a project card
  const openProject = (project) => {
    // We need a username to join. If state is empty, prompt or use "Owner"
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
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const handleDelete = async (e, roomId) => {
    e.stopPropagation(); // Prevent clicking the card (which opens the project)

    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(roomId);
      toast.success("Project deleted");
      // Refresh the list locally
      setProjects((prev) => prev.filter((p) => p.roomId !== roomId));
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user"); // Clear data
            navigate("/"); // Redirect to Login
            toast.success("Logged out");
          }}
          className="bg-red-600 hover:bg-red-400 cursor-pointer text-white font-bold py-2 px-4 rounded transition text-sm shadow-lg"
        >
          Logout
        </button>
      </div>

      {/* LEFT SIDE: Join/Create Form */}
      <div className="w-full max-w-md p-8 flex flex-col justify-center bg-gray-800 border-r border-gray-700">
        <div className="mb-8 text-center">
          <span className="text-4xl">🚀</span>
          <h4 className="text-2xl font-bold mt-2">CRITIC</h4>
          <p className="text-gray-400 text-sm mt-1">Real-time collaboration suite</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Join a Room</div>
          <input
            type="text"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500 font-bold"
            placeholder="ROOM ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500 font-bold"
            placeholder="USERNAME"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="btn bg-green-600 hover:bg-green-500 cursor-pointer text-white font-bold py-2 rounded transition" onClick={joinRoom}>
            Join
          </button>

          <div className="text-center text-gray-400 mt-4 text-sm">
            If you don't have an invite then &nbsp;
            <a onClick={createNewRoom} href="" className="text-green-500 hover:underline font-bold">
              Create new room
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Project Dashboard */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📂</span> Your Projects
        </h2>

        {isLoading ? (
          <p className="text-gray-400">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
            No saved projects yet. Create a room and click "Save"!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => openProject(project)}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-green-500 cursor-pointer transition shadow-lg group relative"
              >
                <button
                  onClick={(e) => handleDelete(e, project.roomId)}
                  className="absolute bottom-2 left-2 p-1 bg-gray-700 rounded-full hover:bg-red-600 transition group-hover:opacity-100 opacity-0" // Hidden until hover
                  title="Delete Project"
                >
                  🗑️
                </button>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-green-400 group-hover:text-green-300 truncate">{project.name || "Untitled"}</h3>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 uppercase">{project.language}</span>
                </div>
                <p className="text-gray-500 text-xs mb-4 font-mono">ID: {project.roomId}</p>
                <div className="text-xs text-gray-400 text-right">{new Date(project.updatedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
