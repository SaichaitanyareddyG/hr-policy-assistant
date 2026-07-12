-- =====================================================
-- Step 5: Semantic Search with pgvector Embeddings
-- =====================================================
-- This migration adds vector embeddings support to enable
-- semantic search of policy chunks using Supabase pgvector.

-- 1. Enable pgvector extension
-- =====================================================
create extension if not exists vector;

-- 2. Add embedding columns to policy_document_chunks
-- =====================================================
-- Using vector(768) for Gemini text-embedding-004 model
-- which outputs 768-dimensional embeddings

alter table policy_document_chunks
add column if not exists embedding vector(768),
add column if not exists embedding_model text,
add column if not exists embedded_at timestamp with time zone;

-- 3. Create indexes for better performance
-- =====================================================

-- Index for vector similarity search (cosine distance)
-- This enables fast semantic search
create index if not exists policy_document_chunks_embedding_idx
on policy_document_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Index for filtering by embedding status
create index if not exists policy_document_chunks_embedded_at_idx
on policy_document_chunks (embedded_at)
where embedded_at is not null;

-- 4. Create semantic search function
-- =====================================================
-- This function performs similarity search with visibility filtering

create or replace function match_policy_chunks_semantic(
  query_embedding vector(768),
  match_org_id uuid,
  match_department text default null,
  match_location text default null,
  match_employment_type text default null,
  match_count int default 5,
  similarity_threshold float default 0.68
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  section_title text,
  page_number int,
  similarity float,
  document_title text,
  document_category text
)
language plpgsql
as $$
begin
  return query
  select
    pdc.id as chunk_id,
    pdc.document_id,
    pdc.content,
    pdc.section_title,
    pdc.page_number,
    -- Calculate similarity (1 - cosine distance)
    1 - (pdc.embedding <=> query_embedding) as similarity,
    pd.title as document_title,
    pd.category as document_category
  from policy_document_chunks pdc
  inner join policy_documents pd on pdc.document_id = pd.id
  where
    -- Organization filter
    pdc.org_id = match_org_id
    -- Only active documents
    and pd.status = 'ACTIVE'
    -- Only completed processing
    and pd.processing_status = 'COMPLETED'
    -- Only chunks with embeddings
    and pdc.embedding is not null
    -- Similarity threshold
    and (1 - (pdc.embedding <=> query_embedding)) >= similarity_threshold
    -- Audience visibility filter
    and (
      -- Case 1: Document is visible to all
      pd.audience_type = 'ALL'
      or
      -- Case 2: Document has custom audience that matches employee
      (
        pd.audience_type = 'CUSTOM'
        and (
          -- No filters set (should be visible)
          (
            (pd.allowed_departments is null or array_length(pd.allowed_departments, 1) is null)
            and (pd.allowed_locations is null or array_length(pd.allowed_locations, 1) is null)
            and (pd.allowed_employment_types is null or array_length(pd.allowed_employment_types, 1) is null)
          )
          or
          -- At least one filter matches
          (
            (
              pd.allowed_departments is null
              or array_length(pd.allowed_departments, 1) is null
              or match_department = any(pd.allowed_departments)
            )
            or
            (
              pd.allowed_locations is null
              or array_length(pd.allowed_locations, 1) is null
              or match_location = any(pd.allowed_locations)
            )
            or
            (
              pd.allowed_employment_types is null
              or array_length(pd.allowed_employment_types, 1) is null
              or match_employment_type = any(pd.allowed_employment_types)
            )
          )
        )
      )
    )
  order by similarity desc
  limit match_count;
end;
$$;

-- 5. Grant permissions
-- =====================================================

-- Grant execute permission on the function to authenticated users
grant execute on function match_policy_chunks_semantic to authenticated;

-- 6. Add helper function to count embedded chunks
-- =====================================================

create or replace function count_embedded_chunks(doc_id uuid)
returns table (
  total_chunks bigint,
  embedded_chunks bigint,
  embedding_percentage numeric
)
language sql
stable
as $$
  select
    count(*) as total_chunks,
    count(embedding) as embedded_chunks,
    case
      when count(*) > 0 then
        round((count(embedding)::numeric / count(*)::numeric) * 100, 2)
      else
        0
    end as embedding_percentage
  from policy_document_chunks
  where document_id = doc_id;
$$;

grant execute on function count_embedded_chunks to authenticated;

-- 7. Add comments for documentation
-- =====================================================

comment on column policy_document_chunks.embedding is 
'Vector embedding of the chunk content for semantic search (768 dimensions from Gemini text-embedding-004)';

comment on column policy_document_chunks.embedding_model is 
'Name of the embedding model used (e.g., "text-embedding-004")';

comment on column policy_document_chunks.embedded_at is 
'Timestamp when the embedding was generated';

comment on function match_policy_chunks_semantic is 
'Performs semantic similarity search on policy chunks with visibility filtering';

comment on function count_embedded_chunks is 
'Returns embedding statistics for a document (total chunks, embedded chunks, percentage)';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. Generate embeddings for existing chunks using HR admin UI
-- 2. Employee questions will now use semantic search
-- 3. Keyword search remains as fallback
