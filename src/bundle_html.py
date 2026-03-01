import os
import shutil
import json
import sys

def build_app(temp_dir, template_dir, output_dir):
    print("Building application...")
    
    # Clean output directory (except if it's the root we are in, which shouldn't happen)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
        
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Copy over HTML/CSS/JS templates
    shutil.copytree(template_dir, output_dir, dirs_exist_ok=True)
    
    # 2. Setup images dir in output
    images_out_dir = os.path.join(output_dir, "images")
    os.makedirs(images_out_dir, exist_ok=True)
    
    chapters = []
    ch_id = 1
    
    if not os.path.exists(temp_dir):
        print("No temp extractions found. Build complete (empty structure).")
        return

    # 3. Bundle extractions into chapters.js
    for folder_name in sorted(os.listdir(temp_dir)):
        folder_path = os.path.join(temp_dir, folder_name)
        if not os.path.isdir(folder_path):
            continue
            
        # Find and concatenate all .md files in the folder
        content = ""
        for file in os.listdir(folder_path):
            if file.endswith(".md"):
                md_file = os.path.join(folder_path, file)
                with open(md_file, "r", encoding="utf-8") as f:
                    content += f.read() + "\n\n"
                    
        if not content.strip():
            continue
            
        images_in_dir = os.path.join(folder_path, "images")
        if os.path.exists(images_in_dir):
            for img_name in os.listdir(images_in_dir):
                if not os.path.isfile(os.path.join(images_in_dir, img_name)):
                    continue
                new_img_name = f"ch{ch_id}_{img_name}"
                src_img = os.path.join(images_in_dir, img_name)
                dst_img = os.path.join(images_out_dir, new_img_name)
                shutil.copy2(src_img, dst_img)
                
                content = content.replace(f"images/{img_name}", f"images/{new_img_name}")
                
        chapters.append({
            "id": f"ch{ch_id}",
            "title": folder_name,
            "content": content
        })
        print(f"Bundled: {folder_name}")
        ch_id += 1

    js_content = f"const chaptersData = {json.dumps(chapters, indent=4)};\n"
    output_js = os.path.join(output_dir, "js", "chapters.js")
    
    with open(output_js, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"\nWebsite successfully built at: {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python bundle_html.py <temp_dir> <template_dir> <output_dir>")
    else:
        build_app(sys.argv[1], sys.argv[2], sys.argv[3])
