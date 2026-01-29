"""Alpha Docling Service - Document text extraction and chunking microservice."""

from fastapi import FastAPI, UploadFile, HTTPException
from docling.document_converter import DocumentConverter
from pydantic import BaseModel
import tempfile
import os
import re

app = FastAPI(title="Alpha Docling Service")
converter = DocumentConverter()

# Maximum file size: 20MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Allowed MIME types
ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

# MIME type to file extension mapping
SUFFIX_MAP = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

# Chunking configuration
DEFAULT_CHUNK_SIZE = 1000  # Target chunk size in characters
DEFAULT_CHUNK_OVERLAP = 200  # Overlap between chunks in characters


class Section(BaseModel):
    """A section extracted from a document."""

    type: str
    text: str


class Chunk(BaseModel):
    """A text chunk with metadata for vector storage."""

    content: str
    chunk_index: int
    section_title: str | None = None
    page_number: int | None = None
    char_start: int
    char_end: int


class ExtractionResult(BaseModel):
    """Result of document text extraction."""

    text: str
    metadata: dict
    sections: list[Section]


class ChunkingResult(BaseModel):
    """Result of document chunking for vector search."""

    chunks: list[Chunk]
    total_chunks: int
    total_chars: int


def get_suffix(content_type: str) -> str:
    """Get file suffix from content type."""
    return SUFFIX_MAP.get(content_type, "")


def extract_sections(document) -> list[Section]:
    """Extract document structure for better AI processing."""
    sections = []
    for item in document.iterate_items():
        if hasattr(item, "text"):
            sections.append(
                Section(
                    type=item.__class__.__name__,
                    text=item.text[:1000],  # Limit section size
                )
            )
    return sections


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Chunk]:
    """
    Split text into overlapping chunks for vector search.

    Uses sentence-aware chunking to avoid breaking mid-sentence.
    """
    if not text or len(text) == 0:
        return []

    chunks: list[Chunk] = []
    chunk_index = 0

    # Split into sentences (simple regex approach)
    # Matches periods, question marks, exclamation marks followed by space or end
    sentences = re.split(r"(?<=[.!?])\s+", text)

    current_chunk = []
    current_size = 0
    char_position = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        sentence_size = len(sentence)

        # If adding this sentence would exceed chunk size, finalize current chunk
        if current_size + sentence_size > chunk_size and current_chunk:
            chunk_text_content = " ".join(current_chunk)
            chunks.append(
                Chunk(
                    content=chunk_text_content,
                    chunk_index=chunk_index,
                    char_start=char_position - current_size,
                    char_end=char_position,
                )
            )
            chunk_index += 1

            # Keep overlap sentences for context
            overlap_size = 0
            overlap_sentences = []
            for s in reversed(current_chunk):
                if overlap_size + len(s) > chunk_overlap:
                    break
                overlap_sentences.insert(0, s)
                overlap_size += len(s) + 1  # +1 for space

            current_chunk = overlap_sentences
            current_size = overlap_size

        current_chunk.append(sentence)
        current_size += sentence_size + 1  # +1 for space
        char_position += sentence_size + 1

    # Don't forget the last chunk
    if current_chunk:
        chunk_text_content = " ".join(current_chunk)
        chunks.append(
            Chunk(
                content=chunk_text_content,
                chunk_index=chunk_index,
                char_start=char_position - current_size,
                char_end=char_position,
            )
        )

    return chunks


def chunk_by_sections(
    sections: list[Section],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Chunk]:
    """
    Create chunks from document sections, preserving section context.
    """
    all_chunks: list[Chunk] = []
    global_chunk_index = 0

    for section in sections:
        if not section.text:
            continue

        # Get section title from the text if it looks like a heading
        section_title = None
        lines = section.text.split("\n")
        if lines and len(lines[0]) < 100 and not lines[0].endswith("."):
            section_title = lines[0].strip()
            section_text = "\n".join(lines[1:])
        else:
            section_text = section.text

        # Chunk this section
        section_chunks = chunk_text(section_text, chunk_size, chunk_overlap)

        # Update chunk indices and add section metadata
        for chunk in section_chunks:
            chunk.chunk_index = global_chunk_index
            chunk.section_title = section_title
            all_chunks.append(chunk)
            global_chunk_index += 1

    return all_chunks


@app.post("/extract", response_model=ExtractionResult)
async def extract_document(file: UploadFile):
    """Extract text and structure from uploaded document."""
    # Validate file size
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB.")

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: PDF, DOC, DOCX.",
        )

    # Create temp file with appropriate suffix
    suffix = get_suffix(file.content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()

        # Double-check size after reading (in case size wasn't provided)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB.")

        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Convert document
        result = converter.convert(tmp_path)

        # Extract text and metadata
        extracted_text = result.document.export_to_text()
        metadata = result.document.metadata.dict() if result.document.metadata else {}
        sections = extract_sections(result.document)

        return ExtractionResult(
            text=extracted_text,
            metadata=metadata,
            sections=sections,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/chunk", response_model=ChunkingResult)
async def chunk_document(
    file: UploadFile,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
):
    """
    Extract and chunk a document for vector search.

    Returns text chunks with metadata for embedding and storage.
    """
    # Validate file size
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB.")

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: PDF, DOC, DOCX.",
        )

    # Create temp file with appropriate suffix
    suffix = get_suffix(file.content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()

        # Double-check size after reading
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB.")

        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Convert document
        result = converter.convert(tmp_path)

        # Extract text and sections
        extracted_text = result.document.export_to_text()
        sections = extract_sections(result.document)

        # Create chunks from sections
        chunks = chunk_by_sections(sections, chunk_size, chunk_overlap)

        # If no sections were extracted, fall back to chunking full text
        if not chunks and extracted_text:
            chunks = chunk_text(extracted_text, chunk_size, chunk_overlap)

        return ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_chars=len(extracted_text),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
