import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import db from "../db/database.js";

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: "Too many login attempts. Please try again later." },
});

function issueToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}

router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ error: "email is required and must be a non-empty string" });
    }
    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ error: "password is required and must be at least 8 characters" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim());
    if (existing) {
        return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db
        .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email.trim(), passwordHash);

    const user = { id: result.lastInsertRowid, email: email.trim() };
    res.status(201).json({ token: issueToken(user), user });
});

router.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim());
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ token: issueToken(user), user: { id: user.id, email: user.email } });
});

export default router;
