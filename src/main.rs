mod models;
mod utils;
mod standardizer;
mod builder;

use std::fs;
use std::path::PathBuf;
use builder::{get_num, generate_decks};
use standardizer::standardize_file;

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

    if let Ok(entries) = fs::read_dir("source") {
        for entry in entries {
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
    } else {
        println!("❌ ERROR: 'source' directory not found in {}", root.display());
        return;
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
    let start_build = std::time::Instant::now();

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

    let duration = start_build.elapsed();
    let total_warnings = w1.len() + w2.len() + wc.len();
    if total_warnings > 0 {
        println!("✨ Build completed in {:?} with {} warnings.", duration, total_warnings);
    } else {
        println!("✨ Build completed successfully in {:?} with 0 errors!", duration);
    }
}
