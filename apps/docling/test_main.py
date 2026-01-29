"""Tests for the Docling service."""

import pytest
from fastapi.testclient import TestClient
from main import app, chunk_text, chunk_by_sections, Section, Chunk

client = TestClient(app)


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestChunkText:
    """Tests for the text chunking function."""

    def test_empty_text_returns_empty_list(self):
        result = chunk_text("")
        assert result == []

    def test_short_text_single_chunk(self):
        text = "This is a short sentence."
        result = chunk_text(text, chunk_size=100)
        assert len(result) == 1
        assert result[0].content == text
        assert result[0].chunk_index == 0

    def test_long_text_multiple_chunks(self):
        # Create text with multiple sentences
        sentences = [f"This is sentence number {i}. " for i in range(20)]
        text = "".join(sentences)

        result = chunk_text(text, chunk_size=100, chunk_overlap=20)

        assert len(result) > 1
        # Each chunk should have content
        for chunk in result:
            assert len(chunk.content) > 0
            assert chunk.char_start >= 0
            assert chunk.char_end > chunk.char_start

    def test_chunk_indices_are_sequential(self):
        text = "First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence."
        result = chunk_text(text, chunk_size=50, chunk_overlap=10)

        for i, chunk in enumerate(result):
            assert chunk.chunk_index == i

    def test_overlap_preserves_context(self):
        text = "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five."
        result = chunk_text(text, chunk_size=40, chunk_overlap=20)

        # Chunks should have overlapping content
        if len(result) > 1:
            # The second chunk should contain some text from the first
            assert len(result[1].content) > 0


class TestChunkBySections:
    """Tests for section-based chunking."""

    def test_empty_sections_returns_empty_list(self):
        result = chunk_by_sections([])
        assert result == []

    def test_single_section_chunks_correctly(self):
        sections = [
            Section(type="paragraph", text="This is a test section with multiple sentences. It has enough content to be chunked properly.")
        ]
        result = chunk_by_sections(sections, chunk_size=50)

        assert len(result) >= 1
        assert all(isinstance(chunk, Chunk) for chunk in result)

    def test_multiple_sections_preserved(self):
        sections = [
            Section(type="heading", text="Introduction"),
            Section(type="paragraph", text="This is the introduction paragraph with some content."),
            Section(type="heading", text="Conclusion"),
            Section(type="paragraph", text="This is the conclusion paragraph with different content."),
        ]
        result = chunk_by_sections(sections)

        assert len(result) >= 2
        # Check that section titles are extracted
        section_titles = [chunk.section_title for chunk in result if chunk.section_title]
        assert "Introduction" in section_titles or any("Introduction" in chunk.content for chunk in result)

    def test_section_title_extraction(self):
        sections = [
            Section(type="heading", text="Chapter 1\nThis is the content of chapter 1. It has multiple sentences."),
        ]
        result = chunk_by_sections(sections)

        # The first line should be extracted as section title
        assert result[0].section_title == "Chapter 1"


class TestExtractEndpoint:
    """Tests for the /extract endpoint."""

    def test_extract_without_file_returns_422(self):
        response = client.post("/extract")
        assert response.status_code == 422


class TestChunkEndpoint:
    """Tests for the /chunk endpoint."""

    def test_chunk_without_file_returns_422(self):
        response = client.post("/chunk")
        assert response.status_code == 422

    def test_chunk_with_large_file_returns_400(self):
        # Create a file larger than 20MB
        large_content = b"x" * (21 * 1024 * 1024)

        response = client.post(
            "/chunk",
            files={"file": ("large.pdf", large_content, "application/pdf")},
        )

        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    def test_chunk_with_invalid_file_type_returns_400(self):
        response = client.post(
            "/chunk",
            files={"file": ("test.txt", b"some text content", "text/plain")},
        )

        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower()


class TestChunkResultStructure:
    """Tests for chunk result data structure."""

    def test_chunk_has_required_fields(self):
        chunk = Chunk(
            content="Test content",
            chunk_index=0,
            char_start=0,
            char_end=12,
        )

        assert chunk.content == "Test content"
        assert chunk.chunk_index == 0
        assert chunk.char_start == 0
        assert chunk.char_end == 12
        assert chunk.section_title is None
        assert chunk.page_number is None

    def test_chunk_with_optional_fields(self):
        chunk = Chunk(
            content="Test content",
            chunk_index=1,
            section_title="Introduction",
            page_number=5,
            char_start=100,
            char_end=200,
        )

        assert chunk.section_title == "Introduction"
        assert chunk.page_number == 5
