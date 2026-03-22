use std::fs;
use std::path::PathBuf;
use crate::models::RE_CYRILLIC;

pub fn standardize_file(f_path: &PathBuf) -> (bool, usize) {
    if !f_path.exists() {
        return (false, 0);
    }
    let content = fs::read_to_string(f_path).unwrap_or_default();
    let mut cleaned_data = String::new();
    let mut count = 0;
    
    let mut local_seen = std::collections::HashSet::new();

    for (line_idx, line) in content.lines().enumerate() {
        let l = line.trim();
        if l.starts_with('#') || l.is_empty() {
            continue;
        }
        
        let mut parts: Vec<String> = l.split(';').map(|s| {
            s.trim().split_whitespace().collect::<Vec<_>>().join(" ")
        }).collect();

        if parts.len() < 3 {
            println!("  {}:{}: Skipped (Less than 3 columns)", f_path.display(), line_idx + 1);
            continue;
        }

        if parts.len() < 4 {
            println!("  {}:{}: Added missing example column for '{}'", f_path.display(), line_idx + 1, parts[0]);
            while parts.len() < 4 {
                parts.push(String::new());
            }
        }

        // 1. Empty fields check
        if parts[0].is_empty() || parts[1].is_empty() || parts[2].is_empty() {
            println!("  ⚠️ WARNING: Empty field detected in {}:{}", f_path.display(), line_idx + 1);
        }

        // 2. Intra-file duplicate check
        if !local_seen.insert(parts[0].clone()) {
            println!("  ❌ ERROR: Duplicate entry '{}' in the same file {}:{}", parts[0], f_path.display(), line_idx + 1);
        }

        // 3. Balanced Parentheses
        let left_p = parts[0].chars().filter(|&c| c == '(').count();
        let right_p = parts[0].chars().filter(|&c| c == ')').count();
        if left_p != right_p {
            println!("  ⚠️ WARNING: Unbalanced parentheses in German field: {}:{} -> '{}'", f_path.display(), line_idx + 1, parts[0]);
        }

        // 4. Punctuation checks
        if (parts[1].ends_with('.') && !parts[1].ends_with("sb.") && !parts[1].ends_with("sth.") && !parts[1].ends_with("...")) || 
           (parts[2].ends_with('.') && !parts[2].ends_with("...")) {
            println!("  ⚠️ WARNING: Translation ends with a period (.), might be a typo: {}:{}", f_path.display(), line_idx + 1);
        }
        if !parts[3].is_empty() && !parts[3].ends_with('.') && !parts[3].ends_with('?') && !parts[3].ends_with('!') && !parts[3].ends_with(".\"") && !parts[3].ends_with(".\'") {
            println!("  ⚠️ WARNING: Example does not end with punctuation: {}:{} -> '{}'", f_path.display(), line_idx + 1, parts[3]);
        }

        // 5. Cyrillic characters checks
        if RE_CYRILLIC.is_match(&parts[0]) {
            println!("  ⚠️ WARNING: Cyrillic characters found in German column: {}:{} -> '{}'", f_path.display(), count + 1, parts[0]);
        }
        if RE_CYRILLIC.is_match(&parts[1]) {
            println!("  ⚠️ WARNING: Cyrillic characters found in English column: {}:{} -> '{}'", f_path.display(), count + 1, parts[1]);
        }
        if RE_CYRILLIC.is_match(&parts[3]) {
            println!("  ⚠️ WARNING: Cyrillic characters found in Example column: {}:{} -> '{}'", f_path.display(), count + 1, parts[3]);
        }

        cleaned_data.push_str(&format!("{};{};{};{}\n", parts[0], parts[1], parts[2], parts[3]));
        count += 1;
    }

    let header = "#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n";
    let mut out_content = String::from(header);
    out_content.push_str(&cleaned_data);
    fs::write(f_path, out_content).unwrap();

    (true, count)
}
