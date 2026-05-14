
-- A3.3: JSONB-Validierung für canonical_facts.content und proposed_facts.content
-- Per BEFORE-INSERT/UPDATE-Trigger (CHECK-Constraints scheiden aus, weil sie IMMUTABLE sein müssten).
-- Pro fact_type Pflichtfelder. Verstoß → RAISE EXCEPTION mit klarer Message.

CREATE OR REPLACE FUNCTION public.validate_fact_content(_content jsonb, _fact_type fact_type)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _has_title boolean := (_content ? 'title') AND length(coalesce(_content->>'title','')) > 0;
  _has_name  boolean := (_content ? 'name')  AND length(coalesce(_content->>'name',''))  > 0;
  _has_label boolean := _has_title OR _has_name;
BEGIN
  IF _content IS NULL OR jsonb_typeof(_content) <> 'object' THEN
    RAISE EXCEPTION 'fact_content_invalid: content muss ein JSON-Objekt sein (fact_type=%)', _fact_type;
  END IF;

  CASE _fact_type
    WHEN 'decision' THEN
      IF NOT _has_title THEN
        RAISE EXCEPTION 'fact_content_invalid: decision benötigt "title"';
      END IF;
    WHEN 'deadline' THEN
      IF NOT _has_title THEN
        RAISE EXCEPTION 'fact_content_invalid: deadline benötigt "title"';
      END IF;
      IF NOT (_content ? 'due_date') OR length(coalesce(_content->>'due_date','')) = 0 THEN
        RAISE EXCEPTION 'fact_content_invalid: deadline benötigt "due_date" (ISO-String)';
      END IF;
      -- Parsebar?
      BEGIN
        PERFORM (_content->>'due_date')::timestamptz;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'fact_content_invalid: deadline.due_date ist nicht parsebar (got %)', _content->>'due_date';
      END;
    WHEN 'task' THEN
      IF NOT _has_title THEN
        RAISE EXCEPTION 'fact_content_invalid: task benötigt "title"';
      END IF;
    WHEN 'open_point' THEN
      IF NOT _has_title THEN
        RAISE EXCEPTION 'fact_content_invalid: open_point benötigt "title"';
      END IF;
    WHEN 'topic' THEN
      IF NOT _has_label THEN
        RAISE EXCEPTION 'fact_content_invalid: topic benötigt "title" oder "name"';
      END IF;
    WHEN 'stakeholder' THEN
      IF NOT _has_label THEN
        RAISE EXCEPTION 'fact_content_invalid: stakeholder benötigt "title" oder "name"';
      END IF;
    WHEN 'reference' THEN
      IF NOT _has_title THEN
        RAISE EXCEPTION 'fact_content_invalid: reference benötigt "title"';
      END IF;
    WHEN 'other' THEN
      -- keine Pflicht
      NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_validate_fact_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.validate_fact_content(NEW.content, NEW.fact_type);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS canonical_facts_validate_content ON public.canonical_facts;
CREATE TRIGGER canonical_facts_validate_content
BEFORE INSERT OR UPDATE OF content, fact_type ON public.canonical_facts
FOR EACH ROW EXECUTE FUNCTION public.trg_validate_fact_content();

DROP TRIGGER IF EXISTS proposed_facts_validate_content ON public.proposed_facts;
CREATE TRIGGER proposed_facts_validate_content
BEFORE INSERT OR UPDATE OF content, fact_type ON public.proposed_facts
FOR EACH ROW EXECUTE FUNCTION public.trg_validate_fact_content();

COMMENT ON FUNCTION public.validate_fact_content(jsonb, fact_type) IS
  'A3.3: erzwingt Pflichtfelder pro fact_type für canonical_facts.content und proposed_facts.content. RAISE EXCEPTION mit Prefix "fact_content_invalid:".';
