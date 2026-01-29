# Docling Service

```python
# apps/docling/main.py
from fastapi import FastAPI, UploadFile, HTTPException
from docling.document_converter import DocumentConverter
from pydantic import BaseModel
import tempfile
import os

app = FastAPI(title="Alpha Docling Service")
converter = DocumentConverter()

class ExtractionResult(BaseModel):
    text: str
    metadata: dict
    sections: list[dict]

@app.post("/extract", response_model=ExtractionResult)
async def extract_document(file: UploadFile):
    if file.size > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(400, "File too large")

    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Unsupported file type")

    with tempfile.NamedTemporaryFile(delete=False, suffix=get_suffix(file.content_type)) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = converter.convert(tmp_path)
        return ExtractionResult(
            text=result.document.export_to_text(),
            metadata=result.document.metadata.dict() if result.document.metadata else {},
            sections=extract_sections(result.document)
        )
    finally:
        os.unlink(tmp_path)

def get_suffix(content_type: str) -> str:
    return {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
    }.get(content_type, "")

def extract_sections(document) -> list[dict]:
    # Extract document structure for better AI processing
    sections = []
    for item in document.iterate_items():
        if hasattr(item, 'text'):
            sections.append({
                "type": item.__class__.__name__,
                "text": item.text[:1000]  # Limit section size
            })
    return sections

@app.get("/health")
async def health():
    return {"status": "ok"}
```

```dockerfile
# apps/docling/Dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```txt
# apps/docling/requirements.txt
fastapi>=0.109.0
uvicorn>=0.27.0
python-multipart>=0.0.6
docling>=0.1.0
```
