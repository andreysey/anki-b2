import os
import glob
import re

# Anki Headers
HEADERS = '#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n'

def standardize_file(filepath):
    """Fixes formatting for a single Anki theme file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    data_lines = [l for l in lines if not l.startswith('#') and l.strip()]
    cleaned_data = []
    
    for line in data_lines:
        parts = line.split(';')
        if len(parts) < 3:
            continue
            
        german = parts[0].strip()
        english = parts[1].strip()
        
        # Consolidation logic: if example was buried in Ukrainian field
        remaining = ';'.join(parts[2:]).strip()
        
        # Simple split if we find HTML tags often used for examples
        if '<i>' in remaining or '<br>' in remaining:
            # This is a heuristic based on previous fixes
            # For simplicity in this tool, we assume if it's already 4 columns, it's mostly fine
            pass 
        
        # Ensure exactly 4 columns
        if len(parts) == 3:
            parts.append('') # Add empty example if missing
        
        cleaned_line = ';'.join([p.strip() for p in parts[:4]]) + '\n'
        cleaned_data.append(cleaned_line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(HEADERS)
        f.writelines(cleaned_data)
    print(f"Standardized: {os.path.basename(filepath)}")

if __name__ == "__main__":
    # Change to root if running from tools/
    if os.path.basename(os.getcwd()) == 'tools':
        os.chdir('..')
    
    files = glob.glob('source/*.txt')
    for f in files:
        standardize_file(f)
