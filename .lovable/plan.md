

# Add Underwriting AI Tab

## Key Consideration: Don't Replace Existing Functions

The guide says to **replace** `rag-chat` and `process-guideline`, but those are actively used by the existing **AI Assist** page and the **Admin → Guidelines** upload flow. Replacing them would break both features and make previously indexed documents incompatible (different embedding model/vector store).

**Recommended approach**: Create **new** edge functions (`underwriting-chat` and `underwriting-process`) so both systems coexist. The Underwriting AI tab gets its own pipeline (LlamaParse → Gemini embeddings → Pinecone → Claude), while the existing AI Assist + guideline management continues working unchanged.

---

## Missing API Keys (4 new secrets required)

Before implementation can proceed, you need to provide these secrets:

| Secret | Where to get it |
|---|---|
| `PINECONE_API_KEY` | [Pinecone Console](https://app.pinecone.io) → API Keys |
| `PINECONE_INDEX_URL` | Pinecone Console → your index host URL (768 dims, cosine metric) |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) → API Keys |
| `LLAMA_PARSE_API_KEY` | [LlamaIndex Cloud](https://cloud.llamaindex.ai) → API Keys |

`GEMINI_API_KEY` already exists and will be used for embeddings. You also need to create a Pinecone index with **768 dimensions** and **cosine** metric before providing the URL.

---

## Implementation Plan

### 1. Add secrets
Use the secrets tool to request all 4 keys from you.

### 2. Create `underwriting-process` edge function
- Accepts PDF upload + carrier name
- Sends PDF to LlamaParse API for text extraction (handles tables/columns)
- Chunks by markdown section headers with carrier prefix
- Generates 768-dim embeddings via Gemini (`text-embedding-004`, `RETRIEVAL_DOCUMENT` task type)
- Upserts vectors + metadata to Pinecone

### 3. Create `underwriting-chat` edge function
- Receives user question + conversation history
- Generates query embedding via Gemini (`RETRIEVAL_QUERY` task type)
- Queries Pinecone for top 12 matching chunks
- Sends chunks + question to Claude for structured recommendation
- Streams response back via SSE

### 4. Create `src/pages/UnderwritingAI.tsx`
- Full-page chat UI matching existing AI Assist design
- "Upload Guidelines" button that opens a dialog for carrier name + PDF file
- Streaming response display with markdown rendering
- Source badges showing which carrier documents were referenced
- Quick prompt suggestions for common underwriting queries

### 5. Wire routing and navigation
- Add route in `App.tsx`: `<Route path="underwriting" element={<UnderwritingAI />} />`
- Add sidebar entry in `Sidebar.tsx` with `FileSearch` icon after "AI Assist"
- Add config entries in `supabase/config.toml` for both new functions

### Files to create/modify
- **New**: `src/pages/UnderwritingAI.tsx`
- **New**: `supabase/functions/underwriting-chat/index.ts`
- **New**: `supabase/functions/underwriting-process/index.ts`
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/layout/Sidebar.tsx` — add nav item
- **Edit**: `supabase/config.toml` — register new functions

