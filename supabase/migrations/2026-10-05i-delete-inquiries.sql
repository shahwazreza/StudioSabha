-- Lets the artist delete inquiries (and their reference photos) from /admin.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.

drop policy if exists "Authenticated users delete inquiries" on inquiries;
create policy "Authenticated users delete inquiries"
  on inquiries for delete
  using (auth.role() = 'authenticated');

-- Reference photos visitors attached (private bucket). Deleting a file also
-- needs the "view" permission, which already exists for this bucket.
drop policy if exists "Authenticated users delete inquiry references" on storage.objects;
create policy "Authenticated users delete inquiry references"
  on storage.objects for delete to authenticated
  using (bucket_id = 'inquiry-references');
