const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { execFile } = require("child_process");

const parseSlitherOutput = require("./parser/parseSlither");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend running" });
});

// Scan endpoint (REAL LOGIC)
app.post("/scan", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const solFilePath = path.resolve(req.file.path);
  const scriptPath = path.resolve(
    __dirname,
    "analyzer",
    "run_slither.py"
  );

  execFile(
    "py",
    ["-3.11", scriptPath, solFilePath],
    { maxBuffer: 1024 * 1024 * 20 },
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: "Slither execution failed",
          details: stderr || error.message,
        });
      }

      try {
        const slitherJson = JSON.parse(stdout);
        const issues = parseSlitherOutput(slitherJson);

        res.json({
          success: true,
          issues,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: "Failed to parse Slither output",
        });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});