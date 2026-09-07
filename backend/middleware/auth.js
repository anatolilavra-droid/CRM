import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice("Bearer ".length);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
