
-- 1. FK umbiegen: review_cases.session_id → dialog_sessions
ALTER TABLE public.review_cases DROP CONSTRAINT IF EXISTS review_cases_session_id_fkey;
ALTER TABLE public.review_cases
  ADD CONSTRAINT review_cases_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.dialog_sessions(id) ON DELETE CASCADE;

-- 2. commit_results.session_id ebenfalls auf dialog_sessions umbiegen (zeigte vorher auf review_sessions)
ALTER TABLE public.commit_results DROP CONSTRAINT IF EXISTS commit_results_session_id_fkey;
ALTER TABLE public.commit_results
  ADD CONSTRAINT commit_results_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.dialog_sessions(id) ON DELETE CASCADE;

-- 3. Alttabelle review_sessions droppen
DROP TABLE IF EXISTS public.review_sessions CASCADE;

-- 4. Hängende failed/running Assets zurücksetzen, damit sie erneut laufen können
UPDATE public.assets
SET understanding_status = 'pending',
    understanding_error = NULL
WHERE understanding_status IN ('failed', 'running');
