import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import db from "../db/database.js";
import { suggestNextAction } from "../services/aiService.js";

const router = Router();

router.post("/suggest-action", async (req, res) => {
    const { deal_id } = req.body;

    if (deal_id === undefined) {
        return res.status(400).json({ error: "deal_id is required" });
    }

    // Ownership check #1: the deal must belong to the authenticated manager.
    const deal = db.prepare("SELECT * FROM deals WHERE id = ? AND owner_id = ?").get(deal_id, req.user.id);
    if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
    }

    // Ownership check #2: re-verify the client independently (defense in depth —
    // don't assume deal.client_id -> clients.owner_id consistency holds forever).
    const client = db
        .prepare("SELECT * FROM clients WHERE id = ? AND owner_id = ?")
        .get(deal.client_id, req.user.id);
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }

    try {
        const suggestion = await suggestNextAction({ deal, client });
        return res.json({ success: true, suggestion });
    } catch (err) {
        if (err.code === "AI_NOT_CONFIGURED") {
            return res.status(503).json({ error: "AI assistant is not configured on this server" });
        }
        if (err instanceof Anthropic.AuthenticationError) {
            console.error("AI assistant: invalid ANTHROPIC_API_KEY", err.message);
            return res.status(503).json({ error: "AI assistant is misconfigured. Please contact the administrator." });
        }
        if (err instanceof Anthropic.RateLimitError) {
            console.error("AI assistant: rate limited by Anthropic API", err.message);
            return res.status(503).json({ error: "AI assistant is busy right now. Please try again in a moment." });
        }
        if (err instanceof Anthropic.APIConnectionError) {
            console.error("AI assistant: connection/timeout error", err.message);
            return res.status(503).json({ error: "Could not reach the AI assistant. Please try again." });
        }
        if (err instanceof Anthropic.APIError) {
            console.error("AI assistant: API error", err.status, err.message);
            return res.status(502).json({ error: "The AI assistant failed to respond. Please try again." });
        }
        console.error("AI assistant: unexpected error", err);
        return res.status(500).json({ error: "Something went wrong generating the suggestion." });
    }
});

export default router;
