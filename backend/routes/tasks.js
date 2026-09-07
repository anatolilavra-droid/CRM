import { Router } from "express";
import db from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks").all();
    res.json(tasks);
});

router.get("/:id", (req, res) => {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
});

router.post("/", (req, res) => {
    const { title, done = false } = req.body;
    if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }
    if (typeof done !== "boolean") {
        return res.status(400).json({ error: "done must be a boolean" });
    }
    const result = db
        .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
        .run(title.trim(), done ? 1 : 0);
    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newTask);
});

router.patch("/:id", (req, res) => {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    if (req.body.title !== undefined && (typeof req.body.title !== "string" || req.body.title.trim() === "")) {
        return res.status(400).json({ error: "title must be a non-empty string" });
    }
    if (req.body.done !== undefined && typeof req.body.done !== "boolean") {
        return res.status(400).json({ error: "done must be a boolean" });
    }
    const title = req.body.title !== undefined ? req.body.title.trim() : task.title;
    const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : task.done;
    db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(title, done, req.params.id);
    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    res.json(updated);
});

router.delete("/:id", (req, res) => {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).end();
});

export default router;
