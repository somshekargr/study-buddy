import fitz  # PyMuPDF
from pathlib import Path
from pydantic import BaseModel
import os
import uuid


class PageContent(BaseModel):
    page_number: int
    text: str
    needs_ocr: bool
    image_paths: list[str] = []


class PDFParser:
    @staticmethod
    def parse_pdf(file_path: Path, output_dir: Path = None) -> list[PageContent]:
        doc = fitz.open(str(file_path))
        pages = []
        
        # Create a document-specific asset directory if output_dir is provided
        asset_dir = None
        if output_dir:
            asset_dir = output_dir / "assets"
            asset_dir.mkdir(parents=True, exist_ok=True)

        for i, page in enumerate(doc):
            text = page.get_text().strip()
            needs_ocr = len(text) < 10
            
            image_paths = []
            if asset_dir:
                # Extract images
                image_list = page.get_images(full=True)
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Generate a unique filename for the image
                    img_filename = f"page_{i+1}_img_{img_index}_{uuid.uuid4().hex[:8]}.{image_ext}"
                    img_path = asset_dir / img_filename
                    
                    with open(img_path, "wb") as f:
                        f.write(image_bytes)
                    
                    image_paths.append(str(img_path))
            
            pages.append(PageContent(
                page_number=i + 1,
                text=text,
                needs_ocr=needs_ocr,
                image_paths=image_paths
            ))
            
        doc.close()
        return pages


pdf_parser = PDFParser()
