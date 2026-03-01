CREATE TABLE IF NOT EXISTS intent_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    package_id TEXT NOT NULL,
    module_name TEXT NOT NULL,
    sender TEXT NOT NULL,
    event_data JSONB NOT NULL,
    checkpoint_sequence_number BIGINT NOT NULL,
    transaction_digest TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_package_id ON intent_events(package_id);
CREATE INDEX idx_checkpoint_seq ON intent_events(checkpoint_sequence_number);
CREATE INDEX idx_transaction_digest ON intent_events(transaction_digest);
