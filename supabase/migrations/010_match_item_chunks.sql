-- Vector search RPC for /api/search RAG retrieval.
-- item_chunks has RLS enabled but holds only public regulatory text,
-- so SECURITY DEFINER is safe and lets the user-scoped client call it.
create or replace function match_item_chunks(
  query_embedding text,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  item_id uuid,
  content text,
  section_title text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.item_id,
    c.content,
    c.section_title,
    (1 - (c.embedding <=> query_embedding::halfvec(1536)))::float as similarity
  from item_chunks c
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding::halfvec(1536)) >= match_threshold
  order by c.embedding <=> query_embedding::halfvec(1536)
  limit match_count;
$$;

grant execute on function match_item_chunks(text, float, int) to authenticated, anon, service_role;
