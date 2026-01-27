use hickory_server::proto::rr::Name;
use aho_corasick::AhoCorasick;
use regex::RegexSet;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq)]
pub enum FilterAction {
    Allow,
    Block,
    // Future: Rewrite(Name)
}

use std::sync::RwLock;

pub struct FilterEngine {
    // Exact match for full domains (fastest)
    exact_blocklist: RwLock<std::collections::HashSet<String>>,
    patterns: Option<AhoCorasick>, 
    regexes: Option<RegexSet>,
}

impl FilterEngine {
    pub fn new() -> Self {
        Self {
            exact_blocklist: RwLock::new(std::collections::HashSet::new()),
            patterns: None,
            regexes: None,
        }
    }

    pub fn load_blocklist(&self, domains: Vec<String>) {
        if let Ok(mut list) = self.exact_blocklist.write() {
             list.clear(); // Complete reload
             for d in domains {
                 list.insert(d.to_lowercase());
             }
             tracing::info!("Blocklist reloaded with {} domains", list.len());
        }
    }

    pub fn check(&self, name: &Name) -> FilterAction {
        let name_str = name.to_string().trim_end_matches('.').to_lowercase();

        // 1. Exact Match
        if let Ok(list) = self.exact_blocklist.read() {
            if list.contains(&name_str) {
                 return FilterAction::Block;
            }
        }

        // 2. Regex / Pattern Match (Placeholder logic)
        // if let Some(re) = &self.regexes {
        //     if re.is_match(&name_str) {
        //         return FilterAction::Block;
        //     }
        // }

        FilterAction::Allow
    }
}
