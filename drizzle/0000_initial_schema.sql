-- Create events table to persist all contract events
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  contract_address TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL,
  topic0 TEXT,
  topic1 TEXT,
  topic2 TEXT,
  topic3 TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_tx_log_unique UNIQUE (tx_hash, log_index)
);

-- Helpful indexes for common query paths
-- Retrieve by contract + event ordered by block
CREATE INDEX IF NOT EXISTS idx_events_contract_event_block
  ON events (contract_address, event_name, block_number);

-- Fast filter by topics (topic0 is the event signature)
CREATE INDEX IF NOT EXISTS idx_events_topic0 ON events (topic0);
CREATE INDEX IF NOT EXISTS idx_events_topic1 ON events (topic1);
CREATE INDEX IF NOT EXISTS idx_events_topic2 ON events (topic2);
CREATE INDEX IF NOT EXISTS idx_events_topic3 ON events (topic3);

-- Fetch newest first / incremental syncs
CREATE INDEX IF NOT EXISTS idx_events_block_number ON events (block_number);

-- Lookup by transaction
CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON events (tx_hash);

-- Custom SQL migration file, put your code below! --
