use hickory_server::authority::{
    Authority, LookupError, LookupOptions, MessageRequest, UpdateResult, ZoneType,
};
use hickory_server::store::forwarder::ForwardLookup;
use hickory_server::server::RequestInfo;
use hickory_resolver::TokioAsyncResolver;
use hickory_proto::rr::{LowerName, Name, RecordType};
use hickory_proto::op::ResponseCode;
use std::sync::Arc;
use crate::filter::{FilterEngine, FilterAction};
use crate::analytics::{StatsCollector, QueryLog};
use tracing::{debug, error};

/// A custom Authority that forwards queries to a recursive resolver (Forwarder)
/// with integrated filtering capability.
pub struct DNSProxy {
    resolver: Arc<TokioAsyncResolver>,
    filter_engine: Arc<FilterEngine>,
    stats: Arc<StatsCollector>,
    origin: LowerName,
}

impl DNSProxy {
    pub fn new(resolver: Arc<TokioAsyncResolver>, filter_engine: Arc<FilterEngine>, stats: Arc<StatsCollector>) -> Self {
        Self {
            resolver,
            filter_engine,
            stats,
            origin: LowerName::from(Name::root()),
        }
    }
}

#[async_trait::async_trait]
impl Authority for DNSProxy {
    type Lookup = ForwardLookup;

    fn zone_type(&self) -> ZoneType {
        ZoneType::Forward
    }

    fn is_axfr_allowed(&self) -> bool {
        false
    }

    async fn update(&self, _update: &MessageRequest) -> UpdateResult<bool> {
        // DNS updates not supported for forwarding proxy
        Err(ResponseCode::Refused)
    }

    fn origin(&self) -> &LowerName {
        &self.origin
    }

    async fn lookup(
        &self,
        name: &LowerName,
        record_type: RecordType,
        _lookup_options: LookupOptions,
    ) -> Result<Self::Lookup, LookupError> {
        let name_converted = Name::from(name.clone());
        let start = std::time::Instant::now();
        let mut status = "ALLOWED";

        // Filter Check
        let result = match self.filter_engine.check(&name_converted) {
            FilterAction::Block => {
                debug!("Blocked query: {}", name);
                status = "BLOCKED";
                Err(LookupError::ResponseCode(ResponseCode::Refused))
            }
            FilterAction::Allow => {
                // Forward to Resolver
                match self.resolver.lookup(name_converted.clone(), record_type).await {
                    Ok(lookup) => Ok(ForwardLookup(lookup)),
                    Err(e) => {
                         error!("Resolution failed for {}: {}", name, e);
                         Err(LookupError::ResponseCode(ResponseCode::ServFail))
                    }
                }
            }
        };

        // Async Logging
        let duration = start.elapsed().as_millis() as u64;
        let log_entry = QueryLog {
            client_ip: "0.0.0.0".to_string(), // Placeholder, real IP is in search(), assuming direct call doesn't have it easily without RequestInfo
            domain: name.to_string(),
            query_type: record_type.to_string(),
            status: status.to_string(),
            duration_ms: duration,
            timestamp: chrono::Utc::now().timestamp(),
        };
        // Trigger log (fire and forget)
        self.stats.log_query(log_entry).await;

        result
    }

    async fn search(
        &self,
        request_info: RequestInfo<'_>,
        lookup_options: LookupOptions,
    ) -> Result<Self::Lookup, LookupError> {
        self.lookup(request_info.query.name(), request_info.query.query_type(), lookup_options).await
    }

    async fn get_nsec_records(
        &self,
        _name: &LowerName,
        _lookup_options: LookupOptions,
    ) -> Result<Self::Lookup, LookupError> {
        // No DNSSEC for forwarding proxy - return empty
        Err(LookupError::ResponseCode(ResponseCode::NoError))
    }
}
