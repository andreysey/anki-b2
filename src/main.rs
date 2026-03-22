use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

static RE_PARENS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?x)\s*\(.*?\)").unwrap());
static RE_PREFIX: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^(jdn\.|etw\.)\s+").unwrap());
static RE_THEMA: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"Thema(\d+)").unwrap());

#[derive(Serialize, Clone)]
struct EntryData {
    level: String,
    thema: i32,
    german: String,
    german_audio: String,
    english: String,
    ukrainian: String,
    example: String,
}

fn clean_german_for_audio(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let t = RE_PARENS.replace_all(text, "");
    let t = t.split(',').next().unwrap_or("");
    let t = t.split('/').next().unwrap_or("");
    let t = RE_PREFIX.replace(t, "");
    t.trim().to_string()
}

fn standardize_file(f_path: &PathBuf) -> (bool, usize) {
    if !f_path.exists() {
        return (false, 0);
    }
    let content = fs::read_to_string(f_path).unwrap_or_default();
    let mut cleaned_data = String::new();
    let mut count = 0;

    for line in content.lines() {
        let l = line.trim();
        if l.starts_with('#') || l.is_empty() {
            continue;
        }
        let mut parts: Vec<&str> = l.split(';').map(|s| s.trim()).collect();
        if parts.len() < 3 {
            println!("  {}: Skipped (Less than 3 columns)", f_path.display());
            continue;
        }
        if parts.len() < 4 {
            println!("  {}: Added missing example column for '{}'", f_path.display(), parts[0]);
            while parts.len() < 4 {
                parts.push("");
            }
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

fn get_num(s: &str) -> i32 {
    RE_THEMA

        .captures(s)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse().ok())
        .unwrap_or(0)
}

fn generate_decks(
    files: &[PathBuf],
    base_name: &str,
    format_type: &str,
    quizlet_minimal: bool,
) -> (usize, usize, Vec<String>) {
    let mut all_entries = Vec::new();
    let mut unique_entries: Vec<Option<String>> = Vec::new();
    let mut seen: HashMap<String, String> = HashMap::new();
    let mut warnings = Vec::new();
    let mut web_data = Vec::new();

    for f_path in files {
        let content = fs::read_to_string(f_path).unwrap_or_default();
        let fname = f_path.file_name().unwrap().to_string_lossy().to_string();

        for (i, line) in content.lines().enumerate() {
            let l = line.trim();
            if l.is_empty() || l.starts_with('#') {
                continue;
            }
            let parts: Vec<&str> = l.split(';').map(|s| s.trim()).collect();
            if parts.len() < 3 {
                warnings.push(format!("{}:{}: Less than 3 columns", fname, i + 1));
                continue;
            }

            let word_display = parts[0].to_string();
            let word_audio = clean_german_for_audio(&word_display);
            let english = parts[1].to_string();
            let ukrainian = parts[2].to_string();
            let example = if parts.len() > 3 { parts[3].to_string() } else { String::new() };

            let level = if fname.contains("B1_plus") { "B1+".to_string() } else { "B2".to_string() };
            let thema = get_num(&fname);

            let entry_data = EntryData {
                level,
                thema,
                german: word_display.clone(),
                german_audio: word_audio.clone(),
                english: english.clone(),
                ukrainian: ukrainian.clone(),
                example: example.clone(),
            };

            let output_line = if format_type == "anki" {
                format!("{};{};{};{};{}\n", word_display, word_audio, english, ukrainian, example)
            } else {
                let definition = if quizlet_minimal || example.is_empty() {
                    format!("{} / {}", english, ukrainian)
                } else {
                    format!("{} / {} | {}", english, ukrainian, example)
                };
                format!("{}\t{}\n", word_display, definition)
            };

            all_entries.push(output_line.clone());

            if !seen.contains_key(&word_display) {
                unique_entries.push(Some(output_line));
                seen.insert(word_display.clone(), fname.clone());
                if base_name == "B1plus_B2" && format_type == "anki" {
                    web_data.push(entry_data);
                }
            } else {
                unique_entries.push(None);
            }
        }
    }

    let out_dir = PathBuf::from(if format_type == "quizlet" { "quizlet" } else { "anki" });
    fs::create_dir_all(&out_dir).unwrap();

    let write_deck = |data: Vec<String>, name: PathBuf| -> usize {
        if data.is_empty() {
            return 0;
        }
        let mut content = String::new();
        if format_type == "anki" {
            content.push_str("#separator:;\n#html:true\n#columns:German;German_Audio;English;Ukrainian;Example\n");
        }
        for line in &data {
            content.push_str(line);
        }
        fs::write(name, content).unwrap();
        data.len()
    };

    let suffix = if quizlet_minimal { "_Minimal.txt" } else { "_Full.txt" };
    let suffix_clean = if quizlet_minimal { "_Minimal_Clean.txt" } else { "_Clean.txt" };

    let filename_full = if format_type == "anki" {
        format!("Anki_{}_Full.txt", base_name)
    } else {
        format!("Quizlet_{}{}", base_name, suffix)
    };
    let n_f = write_deck(all_entries.clone(), out_dir.join(filename_full));

    let u_entries: Vec<String> = unique_entries.into_iter().flatten().collect();
    let filename_clean = if format_type == "anki" {
        format!("Anki_{}_Clean.txt", base_name)
    } else {
        format!("Quizlet_{}{}", base_name, suffix_clean)
    };
    let n_c = write_deck(u_entries, out_dir.join(filename_clean));

    if base_name == "B1plus_B2" && format_type == "anki" {
        let web_dir = PathBuf::from("docs");
        fs::create_dir_all(&web_dir).unwrap();
        let json = serde_json::to_string_pretty(&web_data).unwrap();
        fs::write(web_dir.join("data.json"), json).unwrap();
        println!("✅ Web data exported to docs/data.json ({} unique entries)", web_data.len());
    }

    (n_f, n_c, warnings)
}

fn main() {
    let current_dir = std::env::current_dir().unwrap();
    let root = if current_dir.ends_with("rs_build") {
        current_dir.parent().unwrap().parent().unwrap().to_path_buf()
    } else if current_dir.ends_with("tools") {
        current_dir.parent().unwrap().to_path_buf()
    } else {
        current_dir
    };
    std::env::set_current_dir(&root).unwrap();

    let mut b1_files: Vec<PathBuf> = Vec::new();
    let mut b2_files: Vec<PathBuf> = Vec::new();

    for entry in fs::read_dir("source").unwrap() {
        if let Ok(e) = entry {
            let p = e.path();
            let fname = p.file_name().unwrap().to_string_lossy();
            if fname.contains("B1_plus_Thema") {
                b1_files.push(p.clone());
            } else if fname.contains("B2_Thema") {
                b2_files.push(p.clone());
            }
        }
    }

    b1_files.sort_by_key(|p| get_num(&p.file_name().unwrap().to_string_lossy()));
    b2_files.sort_by_key(|p| get_num(&p.file_name().unwrap().to_string_lossy()));

    let mut combined = b1_files.clone();
    combined.extend(b2_files.clone());

    println!("🧹 Starting standardization process...");
    let mut total_standardized = 0;
    for f in &combined {
        let (success, count) = standardize_file(f);
        if success {
            total_standardized += count;
            println!("✅ {} processed ({} cards)", f.display(), count);
        }
    }
    println!("✨ Finished! Standardized {} files with {} total cards.\n", combined.len(), total_standardized);

    println!("🚀 Starting build process...");

    let (n_f1, n_c1, w1) = generate_decks(&b1_files, "B1plus", "anki", false);
    println!("✅ Anki: B1+ deck generated ({} unique cards from {} total entries)", n_c1, n_f1);

    let (n_f2, n_c2, w2) = generate_decks(&b2_files, "B2", "anki", false);
    println!("✅ Anki: B2 deck generated ({} unique cards from {} total entries)", n_c2, n_f2);

    let (n_fc, n_cc, wc) = generate_decks(&combined, "B1plus_B2", "anki", false);
    println!("✅ Anki: Combined deck generated ({} unique cards from {} total entries)", n_cc, n_fc);

    generate_decks(&b1_files, "B1plus", "quizlet", false);
    generate_decks(&b2_files, "B2", "quizlet", false);
    generate_decks(&combined, "B1plus_B2", "quizlet", false);
    println!("✅ Quizlet: Clean/Full decks generated.");

    generate_decks(&b1_files, "B1plus", "quizlet", true);
    generate_decks(&b2_files, "B2", "quizlet", true);
    generate_decks(&combined, "B1plus_B2", "quizlet", true);
    println!("✅ Quizlet: Minimal decks generated.");

    let total_warnings = w1.len() + w2.len() + wc.len();
    if total_warnings > 0 {
        println!("Build completed with {} warnings.", total_warnings);
    } else {
        println!("✨ Build completed successfully with 0 errors!");
    }
}
