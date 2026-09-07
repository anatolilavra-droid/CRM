import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let client = null;

function getClient() {
    if (!process.env.ANTHROPIC_API_KEY) {
        return null;
    }
    if (!client) {
        client = new Anthropic();
    }
    return client;
}

const SYSTEM_PROMPT = `You are an AI sales assistant embedded in a CRM used by account managers.
Given details about one deal and its client, respond with:
1) a brief 1-2 sentence summary of where this deal currently stands, and
2) a concrete "Next Best Action" the manager should take right now.
If the best action is to reach out to the client, include a short, ready-to-send draft message (2-4 sentences) they could copy directly.
Keep the entire response under 200 words. Write in plain prose with a blank line between the summary and the recommendation — no markdown headers, no bullet points, no bold/asterisks — this is displayed as-is in a simple UI panel.`;

function buildUserPrompt({ deal, client }) {
    const amount = deal.amount != null ? `$${deal.amount}` : "not specified";
    return [
        `Deal: ${deal.title}`,
        `Status: ${deal.status}`,
        `Amount: ${amount}`,
        `Created: ${deal.created_at}`,
        "",
        `Client: ${client.name}`,
        `Client email: ${client.email ?? "not provided"}`,
        `Client phone: ${client.phone ?? "not provided"}`,
    ].join("\n");
}

/**
 * Calls Claude to get a short summary + next-best-action for one deal.
 * Throws on failure — callers are expected to catch and translate to an HTTP response.
 */
export async function suggestNextAction({ deal, client }) {
    const anthropic = getClient();
    if (!anthropic) {
        const err = new Error("AI assistant is not configured (missing ANTHROPIC_API_KEY)");
        err.code = "AI_NOT_CONFIGURED";
        throw err;
    }

    const response = await anthropic.messages.create(
        {
            model: MODEL,
            max_tokens: 700,
            output_config: { effort: "low" },
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildUserPrompt({ deal, client }) }],
        },
        { timeout: 20_000 }
    );

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || !textBlock.text.trim()) {
        const err = new Error("AI assistant returned an empty response");
        err.code = "AI_EMPTY_RESPONSE";
        throw err;
    }

    return textBlock.text.trim();
}
