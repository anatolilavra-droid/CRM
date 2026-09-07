import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import tasksRouter from "./routes/tasks.js";
import db from "./db/database.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendPath = join(__dirname, "..", "frontend");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
});

app.use(helmet());
app.use(cors());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.static(frontendPath));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/tasks", apiLimiter, tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

function shutdown() {
    console.log("Shutting down gracefully...");
    server.close(() => {
        db.close();
        process.exit(0);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
