

## Update PINECONE_INDEX_URL Secret

This is a simple secret update — no code changes needed.

**What will happen:**
1. I'll use the secrets tool to prompt you for the new Pinecone URL value
2. You paste in your new URL (format: `https://your-index-name-xxxxx.svc.environment.pinecone.io`)
3. The edge functions (`underwriting-chat` and `underwriting-process`) will automatically pick up the new value on next invocation — no redeployment required

**No code or config changes are needed** — the functions already reference `PINECONE_INDEX_URL` via `Deno.env.get()`.

