from pathlib import Path
import os
import logging

# Configure logging
log_file = Path('standardize.log')
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

def standardize_file(filepath):
    """Fixes formatting for a single Anki theme file."""
    f = Path(filepath)
    if not f.exists(): return False, 0
    
    with open(f, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()
    
    data_lines = [l for l in lines if not l.startswith('#') and l.strip()]
    cleaned_data = []
    
    for i, line in enumerate(data_lines, 1):
        parts = [p.strip() for p in line.split(';')]
        if len(parts) < 3:
            logger.warning(f"  {f.name}:{i} - Skipped (Less than 3 columns)")
            continue
            
        # Audit formatting
        if len(parts) < 4:
            logger.info(f"  {f.name}:{i} - Added missing example column for '{parts[0]}'")
            while len(parts) < 4:
                parts.append('')
        
        cleaned_line = ';'.join(parts[:4]) + '\n'
        cleaned_data.append(cleaned_line)

    with open(f, 'w', encoding='utf-8') as outfile:
        outfile.write(HEADERS)
        outfile.writelines(cleaned_data)
    return True, len(cleaned_data)

if __name__ == "__main__":
    root = Path(__file__).parent.parent
    os.chdir(root)
    
    logger.info("🧹 Starting standardization process...")
    
    files = list(Path('source').glob('*.txt'))
    total_cards = 0
    for f in files:
        success, count = standardize_file(f)
        if success:
            total_cards += count
            logger.info(f"✅ {f.name} processed ({count} cards)")
    
    logger.info(f"✨ Finished! Standardized {len(files)} files with {total_cards} total cards.")
