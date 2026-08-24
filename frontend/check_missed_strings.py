import re
import glob

def find_hardcoded():
    files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)
    results = []
    
    # Catch basic strings inside elements: <span>Hello World</span>
    # Or text nodes: Hello World
    jsx_text_pattern = re.compile(r'>\s*([A-Za-z][a-zA-Z0-9\s,&’\'-]+)\s*<')
    
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            matches = jsx_text_pattern.finditer(content)
            for m in matches:
                text = m.group(1).strip()
                if text and len(text) > 2 and text not in ["USD", "ETB", "EUR"] and not text.startswith("var(--"):
                    results.append(f"{f}: {text}")
                    
    with open('hardcoded_audit.txt', 'w', encoding='utf-8') as out:
        for r in sorted(set(results)):
            out.write(r + '\n')
            
if __name__ == '__main__':
    find_hardcoded()
