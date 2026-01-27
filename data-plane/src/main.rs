use std::sync::Arc;
use tokio::net::UdpSocket as TokioUdpSocket;
use tokio::net::TcpListener;
use hickory_server::authority::Catalog;
use hickory_proto::rr::Name;
use hickory_server::ServerFuture;
use hickory_resolver::TokioAsyncResolver;
use hickory_resolver::config::{ResolverConfig, ResolverOpts};
use crate::handler::DNSProxy;
use crate::filter::FilterEngine;

mod analytics; 
mod handler;
mod filter;
mod config_sync;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    tracing::info!("Unified DNS Data Plane starting...");

    // 1. Initialize Resolver (Forwarder/Recursor)
    // For MVP, we use Google as upstream if not fully recursive yet, or Root hints for full recursion.
    // Here we use the system config or default (Quad9/Cloudflare/Google) for forwarding.
    let resolver = TokioAsyncResolver::tokio(
        ResolverConfig::google(),
        ResolverOpts::default(),
    );

    // 2. Create Catalog (The "Database" of zones/handlers)
    // We will eventually implement a custom RequestHandler to intercept requests for filtering.
    // For now, we use a basic catalog.
    let mut catalog = Catalog::new();
    
    // TODO: Add Authoritative Zones to catalog here
    
    // 3. Setup Listeners
    let udp_socket = TokioUdpSocket::bind("0.0.0.0:1053").await?;
    let tcp_listener = TcpListener::bind("0.0.0.0:1053").await?;

    tracing::info!("Listening on 0.0.0.0:1053 (UDP/TCP)");

    // 4. Start Server
    // Initialize Filter Engine with sample data
    let engine = FilterEngine::new();
    engine.load_blocklist(vec!["doubleclick.net".to_string(), "ads.google.com".to_string()]);
    let filter_engine = Arc::new(engine);

    // Start Config Sync
    if let Ok(sync) = config_sync::ConfigSync::new(filter_engine.clone()) {
        if let Err(e) = sync.start().await {
            tracing::error!("Failed to start config sync: {}", e);
        }
    } else {
        tracing::error!("Failed to initialize Redis client");
    }



    // Use our custom DNSProxy as Authority for the root zone "."
    let resolver = Arc::new(resolver);
    let proxy = DNSProxy::new(resolver, filter_engine);
    
    // Register proxy authority for all zones (Root)
    catalog.upsert(
        hickory_proto::rr::LowerName::from(Name::root()), 
        Box::new(Arc::new(proxy))
    );

    let mut server = ServerFuture::new(catalog);
    server.register_socket(udp_socket);
    server.register_listener(tcp_listener, std::time::Duration::from_secs(10));

    // block until shutdown
    server.block_until_done().await?;

    Ok(())
}
