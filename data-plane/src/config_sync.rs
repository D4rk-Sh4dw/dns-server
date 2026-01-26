use redis::AsyncCommands;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info};

use crate::filter::FilterEngine;

pub struct ConfigSync {
    client: redis::Client,
    filter_engine: Arc<FilterEngine>,
}

impl ConfigSync {
    pub fn new(filter_engine: Arc<FilterEngine>) -> anyhow::Result<Self> {
        let redis_host = std::env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
        let client = redis::Client::open(format!("redis://{}:6379/", redis_host))?;
        Ok(Self { client, filter_engine })
    }

    pub async fn start(self) -> anyhow::Result<()> {
        let client = self.client.clone();
        let filter_engine = self.filter_engine.clone();
        
        tokio::spawn(async move {
            let mut con = match client.get_async_connection().await {
                Ok(c) => c,
                Err(e) => {
                    error!("Failed to connect to Redis for sync: {}", e);
                    return;
                }
            };
            
            let mut pubsub = con.into_pubsub();
            if let Err(e) = pubsub.subscribe("config_updates").await {
                error!("Failed to subscribe to config_updates: {}", e);
                return;
            }

            info!("Subscribed to config_updates channel");

            use futures_util::StreamExt;
            while let Some(msg) = pubsub.on_message().next().await {
                match msg.get_payload::<String>() {
                    Ok(payload) => {
                        info!("Received config update: {}", payload);
                        // Basic parsing: check if it's a tenant_created event
                        // In MVP, we just reload/add a dummy domain if we see an update, 
                        // or try to parse 'payload.Name' if possible.
                        // Ideally: use serde_json to parse.
                        
                        if payload.contains("tenant_created") {
                            // Example: Block the new tenant name as a domain (just for proving sync works)
                            // In a real scenario, we'd parse the tenant's blocklist additions.
                            // For MVP demo, let's just log and maybe block "example-tenant.com"
                            info!("Applying update to Filter Engine");
                            filter_engine.load_blocklist(vec!["new-tenant-blocked.com".to_string()]); 
                        }
                    },
                    Err(e) => {
                        error!("Failed to read message payload: {}", e);
                    }
                }
            }
        });

        Ok(())
    }
}
