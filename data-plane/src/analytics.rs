use redis::AsyncCommands;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Serialize};
use tracing::{error, debug};

#[derive(Serialize)]
pub struct QueryLog {
    pub client_ip: String,
    pub domain: String,
    pub query_type: String,
    pub status: String,
    pub duration_ms: u64,
    pub timestamp: i64,
}

#[derive(Clone)]
pub struct StatsCollector {
    client: redis::Client,
}

impl StatsCollector {
    pub fn new() -> anyhow::Result<Self> {
        let redis_host = std::env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
        // Use a separate connection string or pool if needed, but client is thread-safe to clone
        let client = redis::Client::open(format!("redis://{}:6379/", redis_host))?;
        Ok(Self { client })
    }

    pub async fn log_query(&self, log: QueryLog) {
        let mut client = self.client.clone();
        tokio::spawn(async move {
            let json = match serde_json::to_string(&log) {
                Ok(j) => j,
                Err(e) => {
                    error!("Failed to serialize log: {}", e);
                    return;
                }
            };

            let mut con = match client.get_async_connection().await {
                Ok(c) => c,
                Err(e) => {
                    error!("Redis connection failed for logging: {}", e);
                    return;
                }
            };

            // Push to Redis Stream "dns_logs"
            // MAXLEN ~ 10000 to keep memory unchecked usage low
            let _: redis::RedisResult<()> = con.xadd_maxlen_map(
                "dns_logs", 
                redis::streams::StreamMaxlen::Approx(10000), 
                "*", 
                &[("data", json)]
            ).await;
        });
    }
}
