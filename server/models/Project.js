const mongoose = require("mongoose");

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true, // Every room ID must be unique
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: "javascript",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Link to the User model
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
