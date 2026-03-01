import os
import re

STAGING_DIR = r"c:\Users\xiang\y2s2\cg2028\exam-notes-builder\staging"

# Common repetitive header/footer texts to strip
JUNK_LINES = [
    r"Dr Henry Tan, ECE, NUS",
    r"Dr Henry Tan.*NUS",
    r"E-mail: eletanh@nus\.edu\.sg",
    r"CG2028\s*Lecture.*",
    r"© Dr Henry Tan, ECE NUS",
    r"NUS National University of Singapore",
    r"Computer Organization",
    r"CG2028",
    r"^\d+$" # Just a page number
]

# Compile regexes for speed
junk_regexes = [re.compile(pattern, re.IGNORECASE) for pattern in JUNK_LINES]

def is_junk(line):
    line = line.strip()
    if not line:
        return True
    if line == "### Native Text:" or line == "#### Extracted Text from Image:":
        return True
    if line == "*(No text detected in this image)*":
        return True
    
    for regex in junk_regexes:
        if regex.match(line):
            return True
            
    return False

def clean_markdown(filepath):
    print(f"Cleaning: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    cleaned_lines = []
    in_image_block = False
    
    for line in lines:
        original = line.rstrip()
        stripped = original.strip()
        
        # Keep MarkDown headers and image links always
        if stripped.startswith("#") or stripped.startswith("![Image"):
            # Ensure some spacing around headers/images
            if cleaned_lines and cleaned_lines[-1].strip() != "":
                cleaned_lines.append("")
            cleaned_lines.append(original)
            if stripped.startswith("![Image"):
                cleaned_lines.append("")
            continue
            
        # Skip junk lines
        if is_junk(original):
            continue
            
        # Clean up blockquotes from OCR
        if stripped.startswith("> "):
            stripped = stripped[2:].strip()
            if is_junk(stripped):
                continue
            cleaned_lines.append(stripped)
            continue
            
        cleaned_lines.append(original)
        
    # Remove excessive blank lines
    final_text = "\n".join(cleaned_lines)
    final_text = re.sub(r'\n{3,}', '\n\n', final_text)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_text)

def run_cleaner():
    for folder_name in sorted(os.listdir(STAGING_DIR)):
        folder_path = os.path.join(STAGING_DIR, folder_name)
        if not os.path.isdir(folder_path):
            continue
            
        md_file = os.path.join(folder_path, f"{folder_name}_text.md")
        if os.path.exists(md_file):
            clean_markdown(md_file)
            
    print("All markdown files cleaned and formatted!")

if __name__ == "__main__":
    run_cleaner()
