

## Plan: Clarifying Question Visual Treatment

**File:** `src/pages/UnderwritingAI.tsx`

### Changes

**1. Update `ChatBubble` component (lines 280–301)**
- Add a check: `const isClarifying = !isUser && message.content.includes("I need a bit more information")`
- When `isClarifying` is true, replace the `bg-muted/30` background with a teal left border style: `border-l-4 border-l-[#8BBAC4] bg-[#8BBAC4]/5`
- This visually distinguishes clarifying questions from standard answers

**2. Update textarea placeholder (line 465)**
- Derive `lastIsClarifying` from messages array: check if last assistant message contains the clarifying phrase
- Change placeholder to `"Answer the question above..."` when true, otherwise keep the default `"Describe the client profile or ask an underwriting question..."`

Two small, localized changes — no new files or dependencies.

