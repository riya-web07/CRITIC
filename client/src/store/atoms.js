import { atom, selector } from "recoil";

// 1. The Code inside the editor
export const codeState = atom({
  key: "codeState",
  default: "// Write your code here\nconsole.log('Hello World!');",
});

// 2. The Output from the Piston API (Terminal)
export const outputState = atom({
  key: "outputState",
  default: ["Click 'Run' to see output..."], // Array of strings for log lines
});

// 3. The Selected Language (for Piston API)
export const languageState = atom({
  key: "languageState",
  default: "javascript", // Options: "javascript", "python", "java"
});

// 4. (Optional) Is the code currently running?
export const isRunningState = atom({
  key: "isRunningState",
  default: false,
});
