CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS locations_name_unaccent_trgm_idx
  ON locations USING gin (public.immutable_unaccent(lower(name)) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS locations_full_slug_prefix_idx
  ON locations (full_slug text_pattern_ops);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.listings_update_search_text()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_text :=
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(NEW.city, '') || ' ' || coalesce(NEW.district, '') || ' ' || coalesce(NEW.street, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(NEW.description, ''))), 'C');
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS listings_search_text_trigger ON listings;
--> statement-breakpoint
CREATE TRIGGER listings_search_text_trigger
  BEFORE INSERT OR UPDATE OF title, description, city, district, street
  ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.listings_update_search_text();