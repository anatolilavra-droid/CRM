import express from "express";
import cors from "cors";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.get("/",(req,res) => {
    res.json({message:"tasks-api is running"});
});

app.use("/tasks", tasksRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});