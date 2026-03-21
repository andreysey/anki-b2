import os
import glob
import re

HEADERS = '#separator:;\n#html:true\n#columns:German;English;Ukrainian;Example\n'

def get_num(s):
    match = re.search(r'Thema(\d+)', s)
    return int(match.group(1)) if match else 0

def generate_decks(files, base_name):
    all_entries = []
    unique_entries = []
    seen = set()
    
    for f in files:
        if not os.path.exists(f): continue
        with open(f, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
            for l in lines:
                if not l.startswith('#') and l.strip() and ';' in l:
                    all_entries.append(l)
                    word = l.split(';')[0].strip()
                    if word not in seen:
                        unique_entries.append(l)
                        seen.add(word)
    
    def write_deck(data, name):
        if not data: return 0
        if not data[-1].endswith('\n'):
            data[-1] += '\n'
        with open(name, 'w', encoding='utf-8') as f:
            f.write(HEADERS)
            f.writelines(data)
        return len(data)

    n_full = write_deck(all_entries, f'Anki_{base_name}_Full.txt')
    n_clean = write_deck(unique_entries, f'Anki_{base_name}_Clean.txt')
    return n_full, n_clean

if __name__ == "__main__":
    # Change to parent directory if running from tools/
    if os.path.basename(os.getcwd()) == 'tools':
        os.chdir('..')

    b1_files = sorted(glob.glob('B1_plus_Thema*.txt'), key=get_num)
    b2_files = sorted(glob.glob('B2_Thema*.txt'), key=get_num)

    if b1_files:
        f, c = generate_decks(b1_files, 'B1plus')
        print(f'B1+: Created Full ({f} words) and Clean ({c} words)')

    if b2_files:
        f, c = generate_decks(b2_files, 'B2')
        print(f'B2 : Created Full ({f} words) and Clean ({c} words)')

    if b1_files and b2_files:
        f, c = generate_decks(b1_files + b2_files, 'B1plus_B2')
        print(f'Combined: Created Full ({f} words) and Clean ({c} words)')
