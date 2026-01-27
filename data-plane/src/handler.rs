use hickory_server::authority::{
    Authority, LookupError, LookupOptions, LookupRecords, MessageRequest, UpdateResult, ZoneType,
};
use hickory_server::server::RequestInfo;
use hickory_resolver::TokioAsyncResolver;
use hickory_proto::rr::{LowerName, Name, Record, RecordType};
use hickory_proto::op::ResponseCode;
use std::sync::Arc;
use crate::filter::{FilterEngine, FilterAction};
use tracing::{debug, error};

/// A custom Authority that forwards queries to a recursive resolver (Forwarder)
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
}

#[async_trait::async_trait]
impl Authority for DNSProxy {
    type Lookup = LookupRecords;

    fn zone_type(&self) -> ZoneType {
        ZoneType::Forward
    }

    fn is_axfr_allowed(&self) -> bool {
        false
    }

    async fn update(&self, _update: &MessageRequest) -> UpdateResult<bool> {
        Err(LookupError::from(ResponseCode::Refused))
    }

    fn origin(&self) -> &LowerName {
        &self.origin
    }

    async fn lookup(
        &self,
        name: &LowerName,
        record_type: RecordType,
        lookup_options: LookupOptions,
    ) -> Result<Self::Lookup, LookupError> {
        // Filter Check
        let name_str = Name::from(name.clone());
        match self.filter_engine.check(&name_str) {
            FilterAction::Block => {
                debug!("Blocked query: {}", name);
                return Err(LookupError::from(ResponseCode::Refused));
            }
            FilterAction::Allow => {}
        }

        // Forward to Resolver
        // resolver.lookup expects name: Name (or IntoName). LowerName can be converted?
        // Note: hickory_resolver might expect just Name.
        
        match self.resolver.lookup(name_str, record_type).await {
            Ok(lookup) => {
                 let records: Vec<Record> = lookup.record_iter().cloned().collect();
                 // Create LookupRecords
                 // Note: new() might be different in 0.24, checking most standard init.
                 // LookupRecords usually has a new(lookup_options, records).
                 Ok(LookupRecords::new(lookup_options, Arc::new(records)))
            }
            Err(e) => {
                 error!("Resolution failed for {}: {}", name, e);
                 // If NotFound -> NXDomain
                 Err(LookupError::from(ResponseCode::ServFail))
            }
        }
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
        Ok(LookupRecords::default()) 
    }
}
