

## Plan: Add Clarifying Questions Block to System Prompt

**File:** `supabase/functions/underwriting-chat/index.ts`  
**Location:** After the STRICT OUTPUT RULES bullet points (line 84), before the RESPONSE FORMAT section (line 86).

Insert the following block between lines 84 and 86:

```
CLARIFYING QUESTIONS:
- If the agent's question is missing information needed to make an accurate underwriting decision, ask for it before answering.
- Key variables you need: age, gender, tobacco status, specific condition name, how long ago it was diagnosed or treated, current medications, height and weight if build chart is relevant.
- Ask only for what is missing. Do not ask for everything at once.
- Ask one to two questions maximum per response.
- Format clarifying questions like this:

**I need a bit more information:**
[Your question here]

- Once you have enough information, give the full recommendation using the standard format.
```

No other changes needed.

