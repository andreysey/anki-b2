import os
import glob
import re

HEADERS = '#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n'

def get_num(s):
    match = re.search(r'Thema(\d+)', s)
    return int(match.group(1)) if match else 0

def generate_decks(files, base_name, format_type='anki'):
    all_entries = []
    unique_entries = []
    seen = set()
    
    for f in files:
        if not os.path.exists(f): continue
        with open(f, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
            for l in lines:
                if not l.startswith('#') and l.strip() and ';' in l:
                    word = l.split(';')[0].strip()
                    
                    if format_type == 'quizlet':
                        # Quizlet usually works best with 2 fields: Term and Definition
                        # We combine English, Ukrainian and Example into one definition
                        parts = [p.strip() for p in l.split(';')]
                        if len(parts) >= 3:
                            term = parts[0]
                            # Combine: English / Ukrainian | Example
                            definition = f"{parts[1]} / {parts[2]}"
                            if len(parts) > 3 and parts[3]:
                                definition += f" | {parts[3]}"
                            l = f"{term}\t{definition}\n"
                    
                    all_entries.append(l)
                    if word not in seen:
                        unique_entries.append(l)
                        seen.add(word)
    
    def write_deck(data, name):
        if not data: return 0
        if not data[-1].endswith('\n'):
            data[-1] += '\n'
        with open(name, 'w', encoding='utf-8') as f:
            if format_type == 'anki':
                f.write(HEADERS)
            f.writelines(data)
        return len(data)

    n_full = write_deck(all_entries, f'Quizlet_{base_name}_Full.txt' if format_type == 'quizlet' else f'Anki_{base_name}_Full.txt')
    n_clean = write_deck(unique_entries, f'Quizlet_{base_name}_Clean.txt' if format_type == 'quizlet' else f'Anki_{base_name}_Clean.txt')
    return n_full, n_clean

if __name__ == "__main__":
    # Change to parent directory if running from tools/
    if os.path.basename(os.getcwd()) == 'tools':
        os.chdir('..')

    b1_files = sorted(glob.glob('B1_plus_Thema*.txt'), key=get_num)
    b2_files = sorted(glob.glob('B2_Thema*.txt'), key=get_num)

    for ft in ['anki', 'quizlet']:
        if b1_files:
            f, c = generate_decks(b1_files, 'B1plus', ft)
            print(f'B1+ ({ft}): Created Full ({f}) and Clean ({c})')

        if b2_files:
            f, c = generate_decks(b2_files, 'B2', ft)
            print(f'B2 ({ft}): Created Full ({f}) and Clean ({c})')

        if b1_files and b2_files:
            f, c = generate_decks(b1_files + b2_files, 'B1plus_B2', ft)
            print(f'Combined ({ft}): Created Full ({f}) and Clean ({c})')
