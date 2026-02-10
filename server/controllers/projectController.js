const Project = require("../models/Project");
const { v4: uuidv4 } = require("uuid");

// 1. Get all projects for the logged-in user
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. Get a single project by Room ID
const getProjectByRoomId = async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });

    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. Create or Update a Project
const saveProject = async (req, res) => {
  const { roomId, code, language, name } = req.body;
  const userId = req.user._id; // The ID of the person trying to save

  try {
    // 1. Find the project
    let project = await Project.findOne({ roomId });

    if (project) {
      // 2. SECURITY CHECK: Is the requester the Owner?
      if (project.owner.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Only the owner can save this project!" });
      }

      // 3. If yes, proceed with update
      project.code = code;
      project.language = language;
      project.name = name || project.name;
      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      // 4. If project doesn't exist, create it (Requester becomes Owner)
      const newProject = new Project({
        owner: userId,
        roomId,
        name: name || "Untitled Project",
        code,
        language,
      });
      const createdProject = await newProject.save();
      res.status(201).json(createdProject);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteProject = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  try {
    const project = await Project.findOne({ roomId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // SECURITY CHECK: Only Owner can delete
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    await Project.deleteOne({ roomId });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getProjects, getProjectByRoomId, saveProject, deleteProject };
