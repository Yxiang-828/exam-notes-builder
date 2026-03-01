import fitz  # PyMuPDF
import sys
import os
import easyocr
import shutil

def extract_pdf(pdf_path, output_dir, reader):
    """
    Extracts text and performs OCR on images from a PDF file.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file '{pdf_path}' not found.")
        return

    # Create output directory for this PDF
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    doc_out_dir = os.path.join(output_dir, base_name)
    os.makedirs(doc_out_dir, exist_ok=True)
    
    images_dir = os.path.join(doc_out_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    text_output_path = os.path.join(doc_out_dir, f"{base_name}_text.md")
    
    print(f"Opening {pdf_path}...")
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Failed to open PDF: {e}")
        return

    total_images_extracted = 0
    total_pages = len(doc)
    
    with open(text_output_path, "w", encoding="utf-8") as text_file:
        text_file.write(f"# Extracted Content: {base_name}\n\n")
        
        for page_num in range(total_pages):
            print(f"Processing page {page_num + 1}/{total_pages}...")
            page = doc.load_page(page_num)
            
            # 1. Extract Native Text
            text = page.get_text("text")
            
            text_file.write(f"## Page {page_num + 1}\n\n")
            if text.strip():
                text_file.write("### Native Text:\n")
                text_file.write(text + "\n\n")
            
            # 2. Extract and OCR Images
            image_list = page.get_images(full=True)
            
            if image_list:
                for img_index, img_info in enumerate(image_list):
                    xref = img_info[0]
                    try:
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        image_filename = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
                        image_filepath = os.path.join(images_dir, image_filename)
                        
                        # Save the image
                        with open(image_filepath, "wb") as img_file:
                            img_file.write(image_bytes)
                            
                        # Add image reference to markdown
                        text_file.write(f"![Image {img_index + 1}](images/{image_filename})\n\n")
                        
                        # Perform OCR on the saved image
                        print(f"  Running OCR on image {img_index + 1}...")
                        ocr_result = reader.readtext(image_filepath, detail=0)
                        
                        if ocr_result:
                            ocr_text = " ".join(ocr_result)
                            text_file.write("#### Extracted Text from Image:\n")
                            text_file.write(f"> {ocr_text}\n\n")
                        else:
                            text_file.write("*(No text detected in this image)*\n\n")

                        total_images_extracted += 1
                        
                    except Exception as e:
                        print(f"Warning: Failed to process image on page {page_num + 1}: {e}")

    print(f"\nExtraction complete for {base_name}!")
    print(f"- Images extracted & OCR processed: {total_images_extracted}")

def extract_single_image(image_path, output_dir, reader):
    if not os.path.exists(image_path):
        print(f"Error: Image '{image_path}' not found.")
        return
        
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    doc_out_dir = os.path.join(output_dir, base_name)
    os.makedirs(doc_out_dir, exist_ok=True)
    
    images_dir = os.path.join(doc_out_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    text_output_path = os.path.join(doc_out_dir, f"{base_name}_text.md")
    
    # Save a copy of the image
    image_ext = os.path.splitext(image_path)[1]
    image_filename = f"image_1{image_ext}"
    image_filepath = os.path.join(images_dir, image_filename)
    shutil.copy2(image_path, image_filepath)
    
    with open(text_output_path, "w", encoding="utf-8") as text_file:
        text_file.write(f"# Extracted Content: {base_name}\n\n")
        text_file.write(f"![Image 1](images/{image_filename})\n\n")
        
        print(f"  Running OCR on {image_path}...")
        try:
            ocr_result = reader.readtext(image_filepath, detail=0)
            if ocr_result:
                ocr_text = " ".join(ocr_result)
                text_file.write("#### Extracted Text from Image:\n")
                text_file.write(f"> {ocr_text}\n\n")
            else:
                text_file.write("*(No text detected in this image)*\n\n")
        except Exception as e:
            print(f"Error during OCR: {e}")
            
    print(f"\nExtraction complete for image {base_name}!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_pdf.py <path_to_file> <output_dir>")
    else:
        file_path = sys.argv[1]
        out_dir = sys.argv[2]
        
        print(f"Initializing EasyOCR for {os.path.basename(file_path)}...")
        try:
            reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            print(f"Failed to initialize EasyOCR: {e}")
            sys.exit(1)
            
        ext = file_path.lower().split('.')[-1]
        if ext == 'pdf':
            extract_pdf(file_path, out_dir, reader)
        elif ext in ['png', 'jpg', 'jpeg']:
            extract_single_image(file_path, out_dir, reader)
        else:
            print(f"Unsupported file type: {ext}")
