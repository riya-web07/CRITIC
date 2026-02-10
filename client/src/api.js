import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

// 1. Client for Piston (Code Execution)
const CODE_API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

// 2. Client for Your Backend (Saving/Auth)
const BACKEND_API = axios.create({
  baseURL: "https://critic.onrender.com/api",
});

// Add Interceptor ONLY to Backend API (to attach the Token)
BACKEND_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const executeCode = async (language, sourceCode) => {
  const response = await CODE_API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [{ content: sourceCode }],
  });
  return response.data;
};

export const saveProject = async (roomId, code, language) => {
  // This now goes to localhost:5000/api/projects/save
  const response = await BACKEND_API.post("/projects/save", {
    roomId,
    code,
    language,
    name: `Project ${roomId}`,
  });
  return response.data;
};

export const getProject = async (roomId) => {
  const response = await BACKEND_API.get(`/projects/${roomId}`);
  return response.data;
};

export const getAllProjects = async () => {
  const response = await BACKEND_API.get("/projects");
  return response.data;
};

export const deleteProject = async (roomId) => {
  const response = await BACKEND_API.delete(`/projects/${roomId}`);
  return response.data;
};
