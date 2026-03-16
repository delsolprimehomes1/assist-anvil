

## Fix Claude System Prompt in `underwriting-chat`

**File:** `supabase/functions/underwriting-chat/index.ts`  
**Lines:** 76–94 (the return string inside `buildSystemPrompt()`)

Replace the entire prompt text with the user's stricter instructions:

- New role line: "You are an expert insurance underwriting advisor. You give clean, accurate, direct answers."
- Add STRICT OUTPUT RULES block (no contradictions, lead with correct answer, minimal info, one carrier max, cite only used sections, handle conflicts)
- Add RESPONSE FORMAT block (Answer → Details → Source)
- Keep the `${context}` injection at the end unchanged

No other files or logic changes needed.

