-- Custom SQL migration file, put your code below! --
CREATE TABLE IF NOT EXISTS event_scan_cursors (
  network_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  last_scanned_block BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (network_id, contract_address, event_name)
);
