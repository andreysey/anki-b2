use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use crate::models::{RE_THEMA, EntryData};
use crate::utils::{clean_german_for_audio, colorize_gender, highlight_word_in_example};

pub fn get_num(s: &str) -> i32 {
    RE_THEMA
        .captures(s)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse().ok())
        .unwrap_or(0)
}

pub fn generate_decks(
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
            let example_raw = if parts.len() > 3 { parts[3].to_string() } else { String::new() };

            let level = if fname.contains("B1_plus") { "B1+".to_string() } else { "B2".to_string() };
            let thema = get_num(&fname);

            let entry_data = EntryData {
                level: level.clone(),
                thema,
                german: colorize_gender(&word_display),
                german_audio: word_audio.clone(),
                english: english.clone(),
                ukrainian: ukrainian.clone(),
                example: highlight_word_in_example(&word_audio, &example_raw),
            };

            let output_line = if format_type == "anki" {
                let entry_tag = format!("{} Thema{}", level, thema).replace("+", "plus");
                format!("{};{};{};{};{};{}\n", colorize_gender(&word_display), word_audio, english, ukrainian, highlight_word_in_example(&word_audio, &example_raw), entry_tag)
            } else {
                let definition = if quizlet_minimal || example_raw.is_empty() {
                    format!("{} / {}", english, ukrainian)
                } else {
                    format!("{} / {} | {}", english, ukrainian, example_raw)
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
            content.push_str("#separator:;\n#html:true\n#columns:German;German_Audio;English;Ukrainian;Example;Tags\n");
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
