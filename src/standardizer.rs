use std::fs;
use std::path::PathBuf;
use std::collections::HashSet;
use crate::models::RE_CYRILLIC;

pub fn standardize_content(content: &str, file_name: &str) -> (String, usize, Vec<String>) {
    let mut cleaned_data = String::new();
    let mut count = 0;
    let mut warnings = Vec::new();
    let mut local_seen = HashSet::new();

    for (line_idx, line) in content.lines().enumerate() {
        let l = line.trim();
        if l.starts_with('#') || l.is_empty() {
            continue;
        }
        
        let mut parts: Vec<String> = l.split(';').map(|s| {
            s.trim().split_whitespace().collect::<Vec<_>>().join(" ")
        }).collect();

        if parts.len() < 3 {
            warnings.push(format!("  {}:{}: Skipped (Less than 3 columns)", file_name, line_idx + 1));
            continue;
        }

        if parts.len() < 4 {
            warnings.push(format!("  {}:{}: Added missing example column for '{}'", file_name, line_idx + 1, parts[0]));
            while parts.len() < 4 {
                parts.push(String::new());
            }
        }

        // 1. Empty fields check
        if parts[0].is_empty() || parts[1].is_empty() || parts[2].is_empty() {
            warnings.push(format!("  ⚠️ WARNING: Empty field detected in {}:{}", file_name, line_idx + 1));
        }

        // 2. Intra-file duplicate check
        if !local_seen.insert(parts[0].clone()) {
            warnings.push(format!("  ❌ ERROR: Duplicate entry '{}' in the same file {}:{}", parts[0], file_name, line_idx + 1));
        }

        // 3. Balanced Parentheses
        let left_p = parts[0].chars().filter(|&c| c == '(').count();
        let right_p = parts[0].chars().filter(|&c| c == ')').count();
        if left_p != right_p {
            warnings.push(format!("  ⚠️ WARNING: Unbalanced parentheses in German field: {}:{} -> '{}'", file_name, line_idx + 1, parts[0]));
        }

        // 4. Punctuation checks
        if (parts[1].ends_with('.') && !parts[1].ends_with("sb.") && !parts[1].ends_with("sth.") && !parts[1].ends_with("...")) || 
           (parts[2].ends_with('.') && !parts[2].ends_with("...")) {
            warnings.push(format!("  ⚠️ WARNING: Translation ends with a period (.), might be a typo: {}:{}", file_name, line_idx + 1));
        }
        if !parts[3].is_empty() && !parts[3].ends_with('.') && !parts[3].ends_with('?') && !parts[3].ends_with('!') && !parts[3].ends_with(".\"") && !parts[3].ends_with(".\'") {
            warnings.push(format!("  ⚠️ WARNING: Example does not end with punctuation: {}:{} -> '{}'", file_name, line_idx + 1, parts[3]));
        }

        // 5. Cyrillic characters checks
        if RE_CYRILLIC.is_match(&parts[0]) {
            warnings.push(format!("  ⚠️ WARNING: Cyrillic characters found in German column: {}:{} -> '{}'", file_name, line_idx + 1, parts[0]));
        }
        if RE_CYRILLIC.is_match(&parts[1]) {
            warnings.push(format!("  ⚠️ WARNING: Cyrillic characters found in English column: {}:{} -> '{}'", file_name, line_idx + 1, parts[1]));
        }
        if RE_CYRILLIC.is_match(&parts[3]) {
            warnings.push(format!("  ⚠️ WARNING: Cyrillic characters found in Example column: {}:{} -> '{}'", file_name, line_idx + 1, parts[3]));
        }

        cleaned_data.push_str(&format!("{};{};{};{}\n", parts[0], parts[1], parts[2], parts[3]));
        count += 1;
    }

    let header = "#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n";
    let mut out_content = String::from(header);
    out_content.push_str(&cleaned_data);
    
    (out_content, count, warnings)
}

pub fn standardize_file(f_path: &PathBuf) -> (bool, usize) {
    if !f_path.exists() {
        return (false, 0);
    }
    let content = fs::read_to_string(f_path).unwrap_or_default();
    let file_name = f_path.file_name().unwrap().to_string_lossy();
    
    let (out_content, count, warnings) = standardize_content(&content, &file_name);
    
    for w in warnings {
        println!("{}", w);
    }
    
    fs::write(f_path, out_content).unwrap();

    (true, count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standardize_content_success() {
        let input = "der Tisch;table;стіл;Das ist ein Tisch.";
        let (out, count, warnings) = standardize_content(input, "test.txt");
        assert_eq!(count, 1);
        assert!(out.contains("der Tisch;table;стіл;Das ist ein Tisch."));
        assert!(warnings.is_empty());
    }

    #[test]
    fn test_standardize_content_duplicate() {
        let input = "der Tisch;table;стіл;Ex1.\nder Tisch;desk;стіл;Ex2.";
        let (_, count, warnings) = standardize_content(input, "test.txt");
        assert_eq!(count, 2);
        assert!(warnings.iter().any(|w| w.contains("Duplicate entry")));
    }

    #[test]
    fn test_standardize_content_missing_column() {
        let input = "der Tisch;table;стіл";
        let (out, count, warnings) = standardize_content(input, "test.txt");
        assert_eq!(count, 1);
        assert!(out.contains("der Tisch;table;стіл;\n"));
        assert!(warnings.iter().any(|w| w.contains("Added missing example column")));
    }
}
