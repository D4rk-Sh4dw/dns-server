use hickory_server::authority::Catalog;
use hickory_server::server::{Request, RequestHandler, ResponseHandler, ResponseInfo};
use hickory_resolver::TokioAsyncResolver;
use std::sync::Arc;
use tracing::{debug, error, info};

use crate::filter::{FilterEngine, FilterAction};

/// A custom request handler that forwards queries to a recursive resolver
#[derive(Clone)]
pub struct ProxyHandler {
    catalog: Arc<Catalog>,
    resolver: Arc<TokioAsyncResolver>,
    filter_engine: Arc<FilterEngine>,
}

impl ProxyHandler {
    pub fn new(catalog: Arc<Catalog>, resolver: Arc<TokioAsyncResolver>, filter_engine: Arc<FilterEngine>) -> Self {
        Self { catalog, resolver, filter_engine }
    }
}

#[async_trait::async_trait]
impl RequestHandler for ProxyHandler {
    async fn handle_request<R: ResponseHandler>(
        &self,
        request: &Request,
        mut response_handle: R,
    ) -> ResponseInfo {
        let query = request.request_info().query.original();
        let name = query.name();
        let record_type = query.query_type();

        debug!("Received query: {} {}", name, record_type);

        // 1. Check Authoritative Zones (Catalog) first
        // If the catalog has the zone, it handles it. 
        // Note: In a real implementation, we'd check if specific zones match. 
        // For now, we assume if it's not in catalog, we forward.
        // Simplified: We skip catalog check in this MVP stub and go straight to recursion for now
        // unless we want to support local zones immediately.
        
        // 2. Filter Check
        match self.filter_engine.check(&name) {
            FilterAction::Block => {
                debug!("Blocked query: {}", name);
                let mut response = hickory_server::authority::MessageResponseBuilder::new(Some(request.raw_query()));
                // Use NXDOMAIN or REFUSED for blocking. 0.0.0.0 (A) is handled by rewriting, which we can add later.
                // For now, let's return NXDOMAIN or Refused. AdGuard uses 0.0.0.0 usually (requires rewrite).
                // Let's stick to NXDOMAIN for simplicity or creating a custom A record response is better UX.
                // Simulating Refused for now.
                let msg = response.error_msg(request.header(), hickory_server::proto::op::ResponseCode::Refused);
                 match response_handle.send_response(msg).await {
                     Ok(info) => return info,
                     Err(_) => return ResponseInfo::from(request.header().clone()),
                 }
            },
            FilterAction::Allow => {
                // Proceed
            }
        }

        // 3. Recursive / Forwarding Resolution
        match self.resolver.lookup(name, record_type).await {
            Ok(lookup) => {
                // We got a response from upstream.
                // We need to convert `lookup` (Lookup) back into a DNS response.
                // This part is tricky because `hickory-resolver` returns interpreted records,
                // but `hickory-server` expects us to build a `Message`.
                
                // For a proper transparent proxy, we might want to just forward the raw bytes using `MainClient`.
                // However, since we want to FILTER later, we need to inspect the request.
                // Re-constructing the response from `lookup` is one way.
                
                 let mut response = hickory_server::authority::MessageResponseBuilder::new(Some(request.raw_query()));
                 
                 let records: Vec<_> = lookup.record_iter().cloned().collect();
                 
                 // This is a simplification. A real proxy needs to handle Header flags, Authority section, Additional section etc.
                 // But for MVP:
                 let msg = response.build(
                     *request.header(), 
                     records.iter(), 
                     std::iter::empty(), // ns
                     std::iter::empty(), // additional
                     std::iter::empty(), // additionals
                 );
                 
                 match response_handle.send_response(msg).await {
                     Ok(info) => return info,
                     Err(e) => {
                         error!("Failed to send response: {}", e);
                         return ResponseInfo::from(request.header().clone()); // Fail safe
                     }
                 }
            }
            Err(e) => {
                error!("Resolution failed for {}: {}", name, e);
                // Return SERVFAIL or similar
                let mut response = hickory_server::authority::MessageResponseBuilder::new(Some(request.raw_query()));
                let msg = response.error_msg(request.header(), hickory_server::proto::op::ResponseCode::ServFail);
                 match response_handle.send_response(msg).await {
                     Ok(info) => return info,
                     Err(_) => return ResponseInfo::from(request.header().clone()),
                 }
            }
        }
    }
}
