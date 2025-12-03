-- Custom SQL migration file, put your code below! --
ALTER TABLE events ADD COLUMN network_id INTEGER NOT NULL;

-- Multichain-friendly indexes (do not drop old ones for now)
CREATE INDEX IF NOT EXISTS idx_events_network_contract_event_block
  ON events (network_id, contract_address, event_name, block_number);

CREATE INDEX IF NOT EXISTS idx_events_network_topic0 ON events (network_id, topic0);
CREATE INDEX IF NOT EXISTS idx_events_network_topic1 ON events (network_id, topic1);
CREATE INDEX IF NOT EXISTS idx_events_network_topic2 ON events (network_id, topic2);
CREATE INDEX IF NOT EXISTS idx_events_network_topic3 ON events (network_id, topic3);

CREATE INDEX IF NOT EXISTS idx_events_network_block_number ON events (network_id, block_number);
