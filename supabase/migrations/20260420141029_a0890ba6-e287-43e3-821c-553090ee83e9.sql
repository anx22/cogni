
INSERT INTO storage.buckets (id, name, public)
VALUES ('intake-files', 'intake-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own intake files"
ON storage.objects FOR SELECT
USING (bucket_id = 'intake-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own intake files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'intake-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own intake files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'intake-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own intake files"
ON storage.objects FOR DELETE
USING (bucket_id = 'intake-files' AND auth.uid()::text = (storage.foldername(name))[1]);
