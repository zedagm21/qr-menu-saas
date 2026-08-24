import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

patterns = {
    'title': re.compile(r'title=["\']([A-Za-z][^"\'{}]+)["\']'),
    'placeholder': re.compile(r'placeholder=["\']([A-Za-z][^"\'{}]+)["\']'),
    'aria-label': re.compile(r'aria-label=["\']([A-Za-z][^"\'{}]+)["\']'),
    'JSX Text': re.compile(r'>\s*([A-Za-z][a-zA-Z0-9\s,&’\'-]+)\s*<'),
    'Fallback': re.compile(r'(?:\|\||\?\?)\s*["\']([A-Z][a-z][^"\'{}]+)["\']')
}

results = []
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        for name, p in patterns.items():
            for m in p.finditer(content):
                text = m.group(1).strip()
                if len(text) > 2 and not text.startswith('var') and text not in ["USD", "ETB", "EUR", "POST", "GET", "PUT", "DELETE"]:
                    if name == 'JSX Text' and (text.startswith("p-") or text.startswith("bg-") or "http" in text or "www" in text):
                        continue
                    results.append(f"[{name}] {f}: {text}")

for r in sorted(set(results)):
    print(r)
