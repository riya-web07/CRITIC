const express = require("express");
const { getProjects, getProjectByRoomId, saveProject, deleteProject } = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all projects for the user
router.get("/", protect, getProjects);

// Get a specific project by Room ID
router.get("/:roomId", protect, getProjectByRoomId);

// Save (Create/Update) a project
router.post("/save", protect, saveProject);

// Delete a project (Protected)
router.delete("/:roomId", protect, deleteProject);

module.exports = router;
