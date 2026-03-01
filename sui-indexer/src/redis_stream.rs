use anyhow::Result;
use redis::Client;
use redis::aio::ConnectionManager;
use serde::Serialize;

#[derive(Serialize)]
pub struct CowEvent {
    pub package_id: String,
    pub module_name: String,
    pub event_name: String,
    pub tx_digest: String,
    pub checkpoint_seq: i64,
    pub timestamp_ms: i64,
}

pub struct RedisStreamClient {
    conn: ConnectionManager,
}

impl RedisStreamClient {
    pub async fn new() -> Result<Self> {
        let host = std::env::var("REDIS_HOST")?;
        let port = std::env::var("REDIS_PORT").unwrap_or_else(|_| "6379".to_string());
        let url = format!("redis://{}:{}", host, port);
        let client = Client::open(url)?;
        let conn = ConnectionManager::new(client).await?;
        Ok(Self { conn })
    }

    pub async fn publish_event(&self, event: &CowEvent) -> Result<()> {
        let payload = serde_json::to_string(event)?;
        let mut conn = self.conn.clone();
        let _: String = redis::cmd("XADD")
            .arg("cow:events")
            .arg("*")
            .arg("data")
            .arg(payload)
            .query_async(&mut conn)
            .await?;
        Ok(())
    }
}
