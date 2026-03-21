import os
from pathlib import Path
import logging
import json
from datetime import datetime

# Configure logging
log_file = Path('build.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='w', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

HEADERS = '#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n'

def generate_decks(files, base_name, format_type='anki', quizlet_minimal=False):
    all_entries = []
    unique_entries = []
    seen = {} # word -> first_file_found
    warnings = []
    
    logger.info(f"Processing {base_name} ({format_type}{' minimal' if quizlet_minimal else ''})")
    
    for f_path in files:
        f = Path(f_path)
        if not f.exists(): continue
        with open(f, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
            for i, l in enumerate(lines, 1):
                if not l.startswith('#') and l.strip():
                    parts = [p.strip() for p in l.split(';')]
                    if len(parts) < 3:
                        msg = f"{f.name}:{i} - Less than 3 columns"
                        warnings.append(msg)
                        logger.warning(msg)
                        continue
                    
                    word = parts[0]
                    entry_data = {
                        'level': 'B1+' if 'B1_plus' in f.name else 'B2',
                        'thema': get_num(f.name),
                        'german': word,
                        'english': parts[1],
                        'ukrainian': parts[2],
                        'example': parts[3] if len(parts) > 3 else ''
                    }
                    
                    if format_type == 'quizlet':
                        parts = [p.strip() for p in l.split(';')]
                        if len(parts) >= 3:
                            term = parts[0]
                            # Minimal usually means no example
                            if quizlet_minimal:
                                definition = f"{parts[1]} / {parts[2]}"
                            else:
                                definition = f"{parts[1]} / {parts[2]}"
                                if len(parts) > 3 and parts[3]:
                                    definition += f" | {parts[3]}"
                            l = f"{term}\t{definition}\n"
                    
                    all_entries.append(l)
                    if word not in seen:
                        unique_entries.append(l)
                        seen[word] = (f.name, entry_data)
                    else:
                        if not quizlet_minimal: 
                            logger.info(f"  Duplicate found: '{word}' in {f.name} (first seen in {seen[word][0]})")
                        unique_entries.append(None)
    
    # Filter unique_entries to remove Nones
    unique_entries = [e for e in unique_entries if e is not None]
    
    def write_deck(data, name):
        if not data: return 0
        if not data[-1].endswith('\n'):
            data[-1] += '\n'
        with open(name, 'w', encoding='utf-8') as f:
            if format_type == 'anki':
                f.write(HEADERS)
            f.writelines(data)
        return len(data)

    suffix = "_Minimal.txt" if quizlet_minimal else "_Full.txt"
    suffix_clean = "_Minimal_Clean.txt" if quizlet_minimal else "_Clean.txt"
    
    out_dir = Path('quizlet' if format_type == 'quizlet' else 'anki')
    out_dir.mkdir(exist_ok=True)
    
    n_f = write_deck(all_entries, out_dir / f'Anki_{base_name}_Full.txt' if format_type == 'anki' else out_dir / f'Quizlet_{base_name}{suffix}')
    n_c = write_deck(unique_entries, out_dir / f'Anki_{base_name}_Clean.txt' if format_type == 'anki' else out_dir / f'Quizlet_{base_name}{suffix_clean}')
    
    # Web export (only once for combined)
    if base_name == 'B1plus_B2' and format_type == 'anki':
        web_data = [info[1] for word, info in seen.items()]
        web_dir = Path('docs')
        web_dir.mkdir(exist_ok=True)
        with open(web_dir / 'data.json', 'w', encoding='utf-8') as web_file:
            json.dump(web_data, web_file, ensure_ascii=False, indent=2)
        logger.info(f"✅ Web data exported to docs/data.json ({len(web_data)} unique entries)")

    return n_f, n_c, warnings

def get_num(s):
    import re
    match = re.search(r'Thema(\d+)', str(s))
    return int(match.group(1)) if match else 0

if __name__ == "__main__":
    root = Path(__file__).parent.parent
    os.chdir(root)

    b1_files = sorted(list(Path('source').glob('B1_plus_Thema*.txt')), key=get_num)
    b2_files = sorted(list(Path('source').glob('B2_Thema*.txt')), key=get_num)
    
    logger.info("🚀 Starting build process...")
    
    # Anki
    n_f, n_c, w_anki = generate_decks(b1_files + b2_files, 'B1plus_B2', 'anki')
    logger.info(f"✅ Anki: Combined deck generated ({n_c} unique cards from {n_f} total entries)")

    # Quizlet
    n_fq, n_cq, w_q = generate_decks(b1_files + b2_files, 'B1plus_B2', 'quizlet', False)
    logger.info(f"✅ Quizlet: Clean/Full decks generated.")
    
    n_fm, n_cm, w_m = generate_decks(b1_files + b2_files, 'B1plus_B2', 'quizlet', True)
    logger.info(f"✅ Quizlet: Minimal decks generated.")

    total_warnings = set(w_anki + w_q + w_m)
    if total_warnings:
        logger.warning(f"Build completed with {len(total_warnings)} unique warnings. Check build.log for details.")
    else:
        logger.info(f"✨ Build completed successfully with 0 errors!")
