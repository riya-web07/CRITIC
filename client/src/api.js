import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

// 1. Client for Code Execution (Switched to Wandbox - Free/Public)
const CODE_API = axios.create({
  baseURL: "https://wandbox.org/api",
});

// 2. Client for Your Backend (Saving/Auth) - UNCHANGED
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

// ==========================================
// 🚀 UPDATED EXECUTION FUNCTION
// ==========================================
export const executeCode = async (language, sourceCode) => {
  // 1. Map Piston Languages -> Wandbox Compilers
  const compilers = {
    javascript: "nodejs-20.17.0",
    typescript: "typescript-5.6.2",
    python: "cpython-3.14.0",
    java: "openjdk-jdk-22+36",
    csharp: "mono-6.12.0.199",
    php: "php-8.3.12",
    c: "gcc-13.2.0",
    cpp: "gcc-13.2.0",
  };

  const selectedCompiler = compilers[language] || "nodejs-head";

  // 2. Java Fix (Wandbox requires default classes, no 'public')
  let codeToSend = sourceCode;
  if (language === "java") {
    codeToSend = sourceCode.replace(/public\s+class/g, "class");
  }

  try {
    const response = await CODE_API.post("/compile.json", {
      code: codeToSend,
      compiler: selectedCompiler,
      save: false,
    });

    const result = response.data;

    // 3. ADAPTER: Convert Wandbox Output -> Piston Format
    // The frontend expects { run: { output, stderr } }
    return {
      run: {
        output: result.program_message || "",
        stderr: result.compiler_message || "",
      },
    };
  } catch (error) {
    console.error("Execution Error:", error);
    return {
      run: {
        output: "⚠️ Execution Failed",
        stderr: "Could not reach the execution server (Wandbox).",
      },
    };
  }
};

// ==========================================
// 💾 SAVE & PROJECT APIs (Unchanged)
// ==========================================

export const saveProject = async (roomId, code, language) => {
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
