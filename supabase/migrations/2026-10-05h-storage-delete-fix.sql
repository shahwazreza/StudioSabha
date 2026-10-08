-- Fix: deleting a painting (or removing a photo) didn't delete the picture
-- file. Supabase only lets a user delete files they're also allowed to look
-- up, and the logged-in artist had no "select" permission on artwork-images.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
drop policy if exists "Authenticated users view artwork images" on storage.objects;
create policy "Authenticated users view artwork images"
  on storage.objects for select to authenticated
  using (bucket_id = 'artwork-images');
