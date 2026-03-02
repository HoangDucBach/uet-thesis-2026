use crate::redis_stream::{CowEvent, RedisStreamClient};
use anyhow::Result;
use chrono::Utc;
use std::sync::Arc;
use sui_indexer_alt_framework::pipeline::Processor;
use sui_indexer_alt_framework::pipeline::sequential::Handler;
use sui_indexer_alt_framework::postgres::{Connection, Db};
use sui_indexer_alt_framework::types::full_checkpoint_content::Checkpoint;

pub struct EventLogHandler {
    pub redis_client: Arc<RedisStreamClient>,
}

#[derive(Debug, Clone)]
pub struct EventLog;

#[async_trait::async_trait]
impl Processor for EventLogHandler {
    const NAME: &'static str = "event_log_handler";

    type Value = EventLog;

    async fn process(&self, checkpoint: &Arc<Checkpoint>) -> Result<Vec<Self::Value>> {
        let cow_package_id = std::env::var("COW_PACKAGE_ID")?;
        let checkpoint_seq = checkpoint.summary.sequence_number as i64;

        let mut logs = Vec::new();

        for tx_block in checkpoint.transactions.iter() {
            let tx_digest = tx_block.transaction.digest().to_string();

            if let Some(events) = &tx_block.events {
                for event in &events.data {
                    let event_package = event.package_id.to_string();

                    if event_package == cow_package_id {
                        let module_name = event.type_.module.to_string();
                        let event_name = event.type_.name.to_string();

                        let timestamp = Utc::now().timestamp_millis();
                        println!(
                            "[{}] [Checkpoint {}] COW Event: {}::{} | TX: {}",
                            timestamp, checkpoint_seq, module_name, event_name, tx_digest
                        );

                        let cow_event = CowEvent {
                            package_id: event_package.clone(),
                            module_name: module_name.clone(),
                            event_name: event_name.clone(),
                            tx_digest: tx_digest.clone(),
                            checkpoint_seq,
                            timestamp_ms: timestamp,
                            contents: event.contents.clone(),
                        };

                        if let Err(e) = self.redis_client.publish_event(&cow_event).await {
                            eprintln!("[{}] Failed to publish event to Redis: {}", timestamp, e);
                        }

                        logs.push(EventLog);
                    }
                }
            }
        }

        Ok(logs)
    }
}

#[async_trait::async_trait]
impl Handler for EventLogHandler {
    type Store = Db;
    type Batch = Vec<EventLog>;

    fn batch(&self, batch: &mut Self::Batch, values: std::vec::IntoIter<EventLog>) {
        batch.extend(values);
    }

    async fn commit<'a>(&self, _batch: &Self::Batch, _conn: &mut Connection<'a>) -> Result<usize> {
        Ok(0)
    }
}
