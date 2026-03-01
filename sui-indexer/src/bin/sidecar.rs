use anyhow::Result;
use redis::aio::ConnectionManager;
use redis::Client;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tonic::{Request, Response, Status};

mod cow_event {
    tonic::include_proto!("cow_event");
}

use cow_event::{event_stream_server::{EventStream, EventStreamServer}, CowEvent, Empty};

struct EventStreamService {
    redis_client: Arc<ConnectionManager>,
}

#[tonic::async_trait]
impl EventStream for EventStreamService {
    type SubscribeCowEventsStream = ReceiverStream<Result<CowEvent, Status>>;

    async fn subscribe_cow_events(
        &self,
        _request: Request<Empty>,
    ) -> Result<Response<Self::SubscribeCowEventsStream>, Status> {
        let (tx, rx) = mpsc::channel(100);
        let redis_client = self.redis_client.clone();

        tokio::spawn(async move {
            if let Err(e) = stream_events(redis_client, tx).await {
                eprintln!("[gRPC] Stream error: {}", e);
            }
        });

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}

async fn stream_events(
    redis_client: Arc<ConnectionManager>,
    tx: mpsc::Sender<Result<CowEvent, Status>>,
) -> Result<()> {
    let mut last_id = "0".to_string();
    let mut error_count = 0;

    loop {
        let mut conn = (*redis_client).clone();
        let result: std::result::Result<Vec<(String, Vec<(String, Vec<(String, String)>)>)>, redis::RedisError> =
            redis::cmd("XREAD")
                .arg("COUNT")
                .arg(10)
                .arg("STREAMS")
                .arg("cow:events")
                .arg(&last_id)
                .query_async(&mut conn)
                .await;

        match result {
            Ok(streams) => {
                error_count = 0;
                let mut has_events = false;
                for (_stream_key, messages) in streams {
                    for (msg_id, fields) in messages {
                        has_events = true;
                        last_id = msg_id;

                        let data_str = fields
                            .iter()
                            .position(|(k, _)| k == "data")
                            .and_then(|idx| fields.get(idx).map(|(_, v)| v));

                        if let Some(payload) = data_str {
                            match serde_json::from_str::<CowEvent>(payload) {
                                Ok(event) => {
                                    if tx.send(Ok(event)).await.is_err() {
                                        return Ok(());
                                    }
                                }
                                Err(e) => {
                                    eprintln!("[gRPC] JSON parse error: {}", e);
                                }
                            }
                        }
                    }
                }
                if !has_events {
                    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                }
            }
            Err(e) => {
                error_count += 1;
                if error_count % 5 == 1 {
                    eprintln!("[gRPC] Redis error (attempt {}): {}", error_count, e);
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let host = std::env::var("REDIS_HOST")?;
    let port = std::env::var("REDIS_PORT").unwrap_or_else(|_| "6379".to_string());
    let redis_url = format!("redis://{}:{}", host, port);

    let client = Client::open(redis_url)?;
    let conn = ConnectionManager::new(client).await?;
    eprintln!("[gRPC] Connected to Redis");

    let addr = "0.0.0.0:50051".parse()?;
    let service = EventStreamService {
        redis_client: Arc::new(conn),
    };

    eprintln!("[gRPC] Server listening on {}", addr);
    tonic::transport::Server::builder()
        .add_service(EventStreamServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}
