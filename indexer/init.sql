-- SubQuery PostgreSQL Initialization Script
-- Enables required extensions for SubQuery indexer

-- btree_gist is required for historical data feature
-- It enables efficient indexing of ranges for temporal queries
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Additional extensions that may be useful
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search
