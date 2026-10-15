const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const cctvRoutes = require("./routes/cctv.routes");
const proxyRoutes = require("./routes/proxy.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Routes
app.use("/api/cctv", cctvRoutes);
app.use("/api/proxy", proxyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "CCTV Live Server",
  });
});

// Serve built React client in Production / Docker container
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[CCTV Server] Running on http://0.0.0.0:${PORT}`);
});
