import { Router } from "express";
import db from "../db/database.js";

const router = Router();

const VALID_STATUSES = ["open", "won", "lost"];

router.get("/", (req, res) => {
    if (req.query.client_id !== undefined) {
        const deals = db
            .prepare("SELECT * FROM deals WHERE owner_id = ? AND client_id = ?")
            .all(req.user.id, req.query.client_id);
        return res.json(deals);
    }
    const deals = db.prepare("SELECT * FROM deals WHERE owner_id = ?").all(req.user.id);
    res.json(deals);
});

router.get("/:id", (req, res) => {
    const deal = db
        .prepare("SELECT * FROM deals WHERE id = ? AND owner_id = ?")
        .get(req.params.id, req.user.id);
    if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
    }
    res.json(deal);
});

router.post("/", (req, res) => {
    const { client_id, title, status = "open", amount } = req.body;

    if (client_id === undefined) {
        return res.status(400).json({ error: "client_id is required" });
    }
    if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "title is required and must be a non-empty string" });
    }
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    if (amount !== undefined && amount !== null && typeof amount !== "number") {
        return res.status(400).json({ error: "amount must be a number" });
    }

    const client = db
        .prepare("SELECT * FROM clients WHERE id = ? AND owner_id = ?")
        .get(client_id, req.user.id);
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }

    const result = db
        .prepare("INSERT INTO deals (owner_id, client_id, title, status, amount) VALUES (?, ?, ?, ?, ?)")
        .run(req.user.id, client_id, title.trim(), status, amount ?? null);
    const newDeal = db.prepare("SELECT * FROM deals WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newDeal);
});

router.patch("/:id", (req, res) => {
    const deal = db
        .prepare("SELECT * FROM deals WHERE id = ? AND owner_id = ?")
        .get(req.params.id, req.user.id);
    if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
    }
    if (req.body.title !== undefined && (typeof req.body.title !== "string" || req.body.title.trim() === "")) {
        return res.status(400).json({ error: "title must be a non-empty string" });
    }
    if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    if (req.body.amount !== undefined && req.body.amount !== null && typeof req.body.amount !== "number") {
        return res.status(400).json({ error: "amount must be a number" });
    }

    const title = req.body.title !== undefined ? req.body.title.trim() : deal.title;
    const status = req.body.status !== undefined ? req.body.status : deal.status;
    const amount = req.body.amount !== undefined ? req.body.amount : deal.amount;

    db.prepare("UPDATE deals SET title = ?, status = ?, amount = ? WHERE id = ?").run(
        title,
        status,
        amount,
        req.params.id
    );
    const updated = db.prepare("SELECT * FROM deals WHERE id = ?").get(req.params.id);
    res.json(updated);
});

router.delete("/:id", (req, res) => {
    const result = db
        .prepare("DELETE FROM deals WHERE id = ? AND owner_id = ?")
        .run(req.params.id, req.user.id);
    if (result.changes === 0) {
        return res.status(404).json({ error: "Deal not found" });
    }
    res.status(204).end();
});

export default router;
