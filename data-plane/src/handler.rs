use hickory_server::authority::{
    Authority, LookupError, LookupOptions, MessageRequest, UpdateResult, ZoneType,
};
use hickory_server::server::RequestInfo;
use hickory_resolver::TokioAsyncResolver;
use hickory_resolver::lookup::Lookup;
use hickory_proto::rr::{LowerName, Name, RecordType};
use hickory_proto::op::ResponseCode;
use std::sync::Arc;
use crate::filter::{FilterEngine, FilterAction};
use tracing::{debug, error};

/// A custom Authority that forwards queries to a recursive resolver (Forwarder)
/// with integrated filtering capability.
pub struct DNSProxy {
    resolver: Arc<TokioAsyncResolver>,
    filter_engine: Arc<FilterEngine>,
    origin: LowerName,
}

impl DNSProxy {
    pub fn new(resolver: Arc<TokioAsyncResolver>, filter_engine: Arc<FilterEngine>) -> Self {
        Self {
            resolver,
            filter_engine,
            origin: LowerName::from(Name::root()),
        }
    }

    /// Perform the actual forwarding lookup
    async fn forward_lookup(&self, name: Name, record_type: RecordType) -> Result<Lookup, LookupError> {
        match self.resolver.lookup(name.clone(), record_type).await {
            Ok(lookup) => Ok(lookup),
            Err(e) => {
                error!("Resolution failed for {}: {}", name, e);
                Err(LookupError::ResponseCode(ResponseCode::ServFail))
            }
        }
    }
}

#[async_trait::async_trait]
impl Authority for DNSProxy {
    type Lookup = Lookup;

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
        
        // Filter Check
        match self.filter_engine.check(&name_converted) {
            FilterAction::Block => {
                debug!("Blocked query: {}", name);
                return Err(LookupError::ResponseCode(ResponseCode::Refused));
            }
            FilterAction::Allow => {}
        }

        // Forward to Resolver
        self.forward_lookup(name_converted, record_type).await
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
        // No DNSSEC for forwarding proxy
        Err(LookupError::ResponseCode(ResponseCode::NoError))
    }
}
