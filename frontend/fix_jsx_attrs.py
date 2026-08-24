import re
import glob

files = glob.glob("src/pages/**/*.tsx", recursive=True)

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # fix placeholder=t("...") -> placeholder={t("...")}
    new_content = re.sub(r'placeholder=(t\("[^"]+"\))', r'placeholder={\1}', content)
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed {path}")

print("Fixed JSX attributes.")
