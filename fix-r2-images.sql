-- Run once in Supabase > SQL Editor: points already-saved R2 images at the new /api/img address.
update public.products
set images = regexp_replace(images::text, 'https://[^"/]+\.r2\.dev/', '/api/img/', 'g')::jsonb
where images::text like '%.r2.dev/%';
