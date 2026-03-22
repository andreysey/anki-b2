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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_german_for_audio() {
        assert_eq!(clean_german_for_audio("der Tisch, -e"), "der Tisch");
        assert_eq!(clean_german_for_audio("die Lampe (n)"), "die Lampe");
        assert_eq!(clean_german_for_audio("das Haus/Gebäude"), "das Haus");
        assert_eq!(clean_german_for_audio("jdn. kontaktieren"), "kontaktieren");
        assert_eq!(clean_german_for_audio("etw. gewähren"), "gewähren");
        assert_eq!(clean_german_for_audio(""), "");
    }

    #[test]
    fn test_colorize_gender() {
        assert_eq!(colorize_gender("der Tisch"), "<span style=\"color: #00d2ff; font-weight: bold;\">der</span> Tisch");
        assert_eq!(colorize_gender("die Lampe"), "<span style=\"color: #ef4444; font-weight: bold;\">die</span> Lampe");
        assert_eq!(colorize_gender("das Haus"), "<span style=\"color: #22c55e; font-weight: bold;\">das</span> Haus");
        assert_eq!(colorize_gender("gehen"), "gehen");
    }

    #[test]
    fn test_highlight_word_in_example() {
        let ex = "Ich sehe den Tisch.";
        let res = highlight_word_in_example("Tisch", ex);
        assert!(res.contains("style=\"color: #eab308;\""));
        assert!(res.contains("Tisch"));

        // Case insensitive
        let res2 = highlight_word_in_example("tisch", ex);
        assert!(res2.contains("<b "));

        // Derivative (plural)
        let ex3 = "Wir haben viele Tische.";
        let res3 = highlight_word_in_example("Tisch", ex3);
        assert!(res3.contains("<b "));
        assert!(res3.contains("Tische"));

        // No match
        assert_eq!(highlight_word_in_example("Auto", ex), ex);
    }
}

