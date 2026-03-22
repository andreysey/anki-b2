use regex::Regex;
use crate::models::{RE_PARENS, RE_PREFIX};

pub fn clean_german_for_audio(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let t = RE_PARENS.replace_all(text, "");
    let t = t.split(',').next().unwrap_or("");
    let t = t.split('/').next().unwrap_or("");
    let t = RE_PREFIX.replace(t, "");
    t.trim().to_string()
}

pub fn colorize_gender(german: &str) -> String {
    if german.starts_with("der ") {
        format!("<span style=\"color: #00d2ff; font-weight: bold;\">der</span>{}", &german[3..])
    } else if german.starts_with("die ") {
        format!("<span style=\"color: #ef4444; font-weight: bold;\">die</span>{}", &german[3..])
    } else if german.starts_with("das ") {
        format!("<span style=\"color: #22c55e; font-weight: bold;\">das</span>{}", &german[3..])
    } else {
        german.to_string()
    }
}

pub fn highlight_word_in_example(clean_german: &str, example: &str) -> String {
    if example.is_empty() { return String::new(); }
    
    let main_word = clean_german.split_whitespace().last().unwrap_or("").replace('|', "");
    
    if main_word.len() > 3 {
        // 1. Try case-insensitive matching for the word or its derivative
        let pattern = format!(r"(?i)\b{}\w*", regex::escape(&main_word));
        if let Ok(re) = Regex::new(&pattern) {
            if re.is_match(example) {
                return re.replace(example, "<b style=\"color: #eab308;\">$0</b>").to_string();
            }
        }
        
        // 2. Fallback: try a 4-char prefix match to catch plural/conjugated forms
        let prefix: String = main_word.chars().take(4).collect();
        if prefix.len() >= 4 {
            let pattern_p = format!(r"(?i)\b{}\w*", regex::escape(&prefix));
            if let Ok(re_p) = Regex::new(&pattern_p) {
                return re_p.replace(example, "<b style=\"color: #eab308;\">$0</b>").to_string();
            }
        }
    }
    
    example.to_string()
}
