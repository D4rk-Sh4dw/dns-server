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
            // Also subscribe to specific blocklist update trigger
            if let Err(e) = pubsub.subscribe("blocklist_update").await {
                error!("Failed to subscribe to blocklist_update: {}", e);
            }

            info!("Subscribed to config_updates and blocklist_update channels");

            use futures_util::StreamExt;
            while let Some(msg) = pubsub.on_message().next().await {
                let channel = msg.get_channel_name();
                
                if channel == "blocklist_update" {
                     info!("Received blocklist update signal. Fetching from Redis...");
                     // Fetch entire set from Redis
                     // We need a fresh connection or clone the client outside the loop? 
                     // Using the existing 'con' which is pubsub might be tricky if we want to run command.
                     // Better to use a separate client/connection for querying.
                     
                     // Quick fix: create a new connection from the client we have
                     let mut query_con = match client.get_async_connection().await {
                        Ok(c) => c,
                         Err(e) => {
                             error!("Failed to get redis connection for blocklist fetch: {}", e);
                             continue;
                         }
                     };

                     let domains: Vec<String> = match query_con.smembers("blocklist:global").await {
                         Ok(d) => d,
                         Err(e) => {
                             error!("Failed to fetch blocklist:global: {}", e);
                             Vec::new()
                         }
                     };
                     
                     if !domains.is_empty() {
                         filter_engine.load_blocklist(domains);
                     }
                } else if channel == "config_updates" {
                    // Existing logic for tenants...
                    match msg.get_payload::<String>() {
                        Ok(payload) => {
                             info!("Received config update: {}", payload);
                             if payload.contains("tenant_created") {
                                 // Minimal action for now
                             }
                        },
                        Err(e) => error!("Failed to read payload: {}", e),
                    }
                }
            }
        });

        Ok(())
    }
}
