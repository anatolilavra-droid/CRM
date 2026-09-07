import { Router } from "express";
import db from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients WHERE owner_id = ?").all(req.user.id);
    res.json(clients);
});

router.get("/:id", (req, res) => {
    const client = db
        .prepare("SELECT * FROM clients WHERE id = ? AND owner_id = ?")
        .get(req.params.id, req.user.id);
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    res.json(client);
});

router.post("/", (req, res) => {
    const { name, email, phone } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "name is required and must be a non-empty string" });
    }
    if (email !== undefined && email !== null && typeof email !== "string") {
        return res.status(400).json({ error: "email must be a string" });
    }
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
        return res.status(400).json({ error: "phone must be a string" });
    }
    const result = db
        .prepare("INSERT INTO clients (owner_id, name, email, phone) VALUES (?, ?, ?, ?)")
        .run(req.user.id, name.trim(), email ?? null, phone ?? null);
    const newClient = db.prepare("SELECT * FROM clients WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newClient);
});

router.patch("/:id", (req, res) => {
    const client = db
        .prepare("SELECT * FROM clients WHERE id = ? AND owner_id = ?")
        .get(req.params.id, req.user.id);
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    if (req.body.name !== undefined && (typeof req.body.name !== "string" || req.body.name.trim() === "")) {
        return res.status(400).json({ error: "name must be a non-empty string" });
    }
    if (req.body.email !== undefined && req.body.email !== null && typeof req.body.email !== "string") {
        return res.status(400).json({ error: "email must be a string" });
    }
    if (req.body.phone !== undefined && req.body.phone !== null && typeof req.body.phone !== "string") {
        return res.status(400).json({ error: "phone must be a string" });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : client.name;
    const email = req.body.email !== undefined ? req.body.email : client.email;
    const phone = req.body.phone !== undefined ? req.body.phone : client.phone;
    db.prepare("UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?").run(
        name,
        email,
        phone,
        req.params.id
    );
    const updated = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    res.json(updated);
});

router.delete("/:id", (req, res) => {
    const client = db
        .prepare("SELECT * FROM clients WHERE id = ? AND owner_id = ?")
        .get(req.params.id, req.user.id);
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    const dealCount = db
        .prepare("SELECT COUNT(*) AS count FROM deals WHERE client_id = ?")
        .get(req.params.id).count;
    if (dealCount > 0) {
        return res.status(409).json({ error: "Cannot delete a client that has deals" });
    }
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.status(204).end();
});

export default router;
