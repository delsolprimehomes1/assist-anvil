-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Carrier Guidelines Documents
create table if not exists carrier_guidelines (
  id uuid primary key default uuid_generate_v4(),
  carrier_id uuid references carriers(id),
  carrier_name text not null,
  product_type text not null, -- 'Term Life', 'Whole Life', etc.
  document_type text not null, -- 'Full Guide', 'Quick Reference', etc.
  file_name text not null,
  file_url text not null,
  file_size integer,
  coverage_min decimal,
  coverage_max decimal,
  age_min integer,
  age_max integer,
  effective_date date not null,
  expiration_date date,
  version_number text,
  state_availability text[], -- Array of state codes
  status text default 'processing', -- 'processing', 'active', 'archived', 'error'
  processing_error text,
  notes text,
  uploaded_by uuid references auth.users(id), -- Changed to auth.users for safety, or public.users if generic
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Document Chunks (for RAG retrieval)
create table if not exists guideline_chunks (
  id uuid primary key default uuid_generate_v4(),
  guideline_id uuid references carrier_guidelines(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null,
  page_number integer,
  section_title text,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata jsonb, -- Store additional context
  created_at timestamp with time zone default now()
);

-- Create vector similarity search index
create index if not exists guideline_chunks_embedding_idx on guideline_chunks using ivfflat (embedding vector_cosine_ops);

-- Chat Sessions
create table if not exists underwriting_chats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  session_title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat Messages
create table if not exists underwriting_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references underwriting_chats(id) on delete cascade,
  role text not null, -- 'user', 'assistant', 'system'
  content text not null,
  sources jsonb, -- Array of source guideline references
  confidence_score decimal,
  created_at timestamp with time zone default now()
);

-- RLS Policies

-- carrier_guidelines
alter table carrier_guidelines enable row level security;

create policy "Enable read access for authenticated users"
on carrier_guidelines for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on carrier_guidelines for insert
to authenticated
with check ( true );

create policy "Enable update for authenticated users"
on carrier_guidelines for update
to authenticated
using ( true );

create policy "Enable delete for authenticated users"
on carrier_guidelines for delete
to authenticated
using ( true );

-- guideline_chunks
alter table guideline_chunks enable row level security;

create policy "Enable read access for authenticated users"
on guideline_chunks for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on guideline_chunks for insert
to authenticated
with check (true);

-- underwriting_chats
alter table underwriting_chats enable row level security;

create policy "Users can view their own chats"
on underwriting_chats for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own chats"
on underwriting_chats for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own chats"
on underwriting_chats for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own chats"
on underwriting_chats for delete
to authenticated
using (auth.uid() = user_id);

-- underwriting_messages
alter table underwriting_messages enable row level security;

create policy "Users can view messages from their chats"
on underwriting_messages for select
to authenticated
using (
  exists (
    select 1 from underwriting_chats
    where underwriting_chats.id = underwriting_messages.chat_id
    and underwriting_chats.user_id = auth.uid()
  )
);

create policy "Users can insert messages to their chats"
on underwriting_messages for insert
to authenticated
with check (
  exists (
    select 1 from underwriting_chats
    where underwriting_chats.id = underwriting_messages.chat_id
    and underwriting_chats.user_id = auth.uid()
  )
);

-- Bucket setup (idempotent-ish via policy)
insert into storage.buckets (id, name, public)
values ('carrier-guidelines', 'carrier-guidelines', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload carrier guidelines"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'carrier-guidelines' );

create policy "Authenticated users can read carrier guidelines"
on storage.objects for select
to authenticated
using ( bucket_id = 'carrier-guidelines' );

create policy "Authenticated users can update carrier guidelines"
on storage.objects for update
to authenticated
using ( bucket_id = 'carrier-guidelines' );

create policy "Authenticated users can delete carrier guidelines"
on storage.objects for delete
to authenticated
using ( bucket_id = 'carrier-guidelines' );
