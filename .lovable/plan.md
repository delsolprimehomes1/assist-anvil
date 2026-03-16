

## Plan: Update Embedding Model in Both Edge Functions

Replace `text-embedding-004` with `gemini-embedding-001` and use `v1beta` API version in both files.

### Changes

**`supabase/functions/underwriting-chat/index.ts`**
- Line 13: URL → `v1beta/models/gemini-embedding-001:embedContent`
- Line 19: model → `models/gemini-embedding-001`

**`supabase/functions/underwriting-process/index.ts`**
- Line 92: URL → `v1beta/models/gemini-embedding-001:batchEmbedContents`
- Line 103: model → `models/gemini-embedding-001`

No other changes.

