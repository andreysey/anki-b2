use serde::Serialize;
use regex::Regex;
use std::sync::LazyLock;

pub static RE_PARENS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?x)\s*\(.*?\)").unwrap());
pub static RE_PREFIX: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^(jdn\.|etw\.)\s+").unwrap());
pub static RE_THEMA: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"Thema(\d+)").unwrap());
pub static RE_CYRILLIC: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\p{Cyrillic}").unwrap());

#[derive(Serialize, Clone)]
pub struct EntryData {
    pub level: String,
    pub levels: Vec<String>,
    pub thema: i32,
    pub german: String,
    pub german_audio: String,
    pub english: String,
    pub ukrainian: String,
    pub example: String,
}
