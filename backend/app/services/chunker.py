import re
from pydantic import BaseModel
from app.services.pdf_parser import PageContent


class Chunk(BaseModel):
    document_id: str | None = None
    chunk_index: int
    content: str
    page_number: int


class Chunker:
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_pages(self, pages: list[PageContent]) -> list[Chunk]:
        all_chunks = []
        chunk_index = 0

        for page in pages:
            text = page.text
            if not text:
                continue

            # Preservation of sentence boundaries (simple version)
            # Split by common sentence enders followed by space
            sentences = re.split(r'(?<=[.!?])\s+', text)
            
            current_chunk_text = ""
            
            for sentence in sentences:
                if len(current_chunk_text) + len(sentence) <= self.chunk_size:
                    current_chunk_text += (sentence + " ")
                else:
                    # Save current chunk
                    if current_chunk_text.strip():
                        all_chunks.append(Chunk(
                            chunk_index=chunk_index,
                            content=current_chunk_text.strip(),
                            page_number=page.page_number
                        ))
                        chunk_index += 1
                    
                    # Start new chunk with overlap
                    # Taking the last 'overlap' characters from current chunk to start new one
                    overlap_text = current_chunk_text[-self.overlap:] if len(current_chunk_text) > self.overlap else current_chunk_text
                    current_chunk_text = overlap_text + sentence + " "

            # Add final chunk for current page
            if current_chunk_text.strip():
                all_chunks.append(Chunk(
                    chunk_index=chunk_index,
                    content=current_chunk_text.strip(),
                    page_number=page.page_number
                ))
                chunk_index += 1

        return all_chunks


chunker = Chunker()
