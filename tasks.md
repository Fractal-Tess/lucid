# Alpha - Task Tracker

## Setup & Infrastructure

- [x] User provides SvelteKit/shadcn-svelte/Turborepo template
- [x] Set up SvelteKit project structure
- [x] Set up Turborepo with Bun
- [x] Configure shared UI package with shadcn-svelte
- [x] Set up Convex project + schema
- [x] Integrate Better Auth with Convex adapter
- [x] Build Docling Python microservice
- [x] Create Dockerfile for Docling service
- [x] Implement LLM Router with OpenRouter
- [x] Configure router rules (config-driven)
- [x] Set up Vitest for unit testing
- [x] Set up Playwright for e2e testing
- [x] Configure Docker Compose for Dokploy
- [x] Set up environment variables

## Phase 1: MVP - Core Study Tools

### Organization System

- [x] Subject Groups CRUD (create, read, update, delete)
- [x] Subjects CRUD with icons/colors
- [x] Folders CRUD with nesting support
- [x] Drag & drop reordering
- [x] File tree UI component

### Document Management

- [x] Document upload UI (drag & drop)
- [x] File type validation (PDF, DOC, DOCX)
- [x] File size validation (max 20MB)
- [x] Upload progress indicator
- [x] Convex file storage integration
- [x] Document download functionality
- [x] Document processing workflow (Convex → Docling)
- [x] Processing status indicators
- [x] Error handling for failed processing

### Flashcards

- [x] Flashcard generation from documents
- [x] AI prompt for flashcard extraction
- [x] Flashcard viewer UI (flip cards)
- [x] Keyboard shortcuts (space, arrows)
- [x] SM-2 spaced repetition algorithm
- [x] "Cards due today" queue
- [x] Flashcard visual editor (add/edit/delete/reorder)
- [x] Rating UI (1-5 difficulty)

### Quizzes

- [x] Quiz generation from documents
- [x] AI prompt for quiz creation
- [x] Multiple choice quiz UI
- [x] Answer validation + scoring
- [x] Explanation display for wrong answers
- [x] Quiz results summary
  - [x] Quiz editor (add/edit/delete questions)

### Summaries

- [x] Summary generation from documents
- [x] AI prompt for summarization
- [x] Section-based summary display
- [ ] Summary text editor

### Notes

- [x] Notes generation from documents
- [x] AI prompt for notes extraction
- [x] Key points extraction
- [x] Rich text/Markdown editor
- [x] Notes viewer

### Generations System

- [x] Generations folder per subject (virtual)
- [x] Generation creation workflow
- [x] Source document selection UI
- [x] Generation status tracking
- [x] Source document references display
- [x] Filter generations by type
- [x] Filter generations by source document
- [x] Generation rename/delete

### Sharing

- [x] Generate share codes for generations
- [x] Share code input/import UI
- [x] Public sharing toggle
- [x] Shared deck viewer

### Export

- [ ] Flashcards → Anki (.apkg) export
- [x] Flashcards → CSV export
- [x] Flashcards → JSON export
- [ ] Flashcards → PDF (printable cards)
- [ ] Quiz → PDF export
- [x] Quiz → JSON export
- [x] Notes → Markdown export
- [ ] Notes → PDF export
- [x] Summary → Markdown export
- [ ] Summary → PDF export
- [x] Batch export (multiple generations)
- [ ] Subject ZIP export

### Beta Deployment

- [x] Deploy to Dokploy
- [x] Configure Convex Cloud production
- [x] Set up domain + SSL
- [x] Beta flag: all users = paid

---

## Phase 2: Enhanced Learning

### Chat with Document

- [ ] Chat UI component
- [ ] Message history per document
- [ ] Context-aware AI responses
- [ ] Citation display (link to source sections)
- [ ] Follow-up questions support

### Solve Mode (Homework Help)

- [ ] Solve mode UI
- [ ] Question input (text + image?)
- [ ] Step-by-step solution generation
- [ ] Subject/topic classification
- [ ] Solution history

### Progress Dashboard

- [ ] Dashboard page layout
- [ ] Daily stats tracking
- [ ] Study streak calculation
- [ ] Streak display (fire icon, count)
- [ ] Cards studied chart
- [ ] Quiz performance chart
- [ ] Time spent studying
- [ ] Weekly/monthly views
- [ ] Weak areas identification
- [ ] Recommended review items

---

## Phase 3: Advanced Features

### Study Guide Generator

- [ ] Study guide generation from documents
- [ ] AI prompt for study guide creation
- [ ] Topic importance ranking
- [ ] Time estimates per topic
- [ ] Structured topic editor UI
- [ ] Topic completion tracking
- [ ] Pre-test generation
- [ ] Post-test generation
- [ ] Score comparison display
- [ ] Study Guide → PDF export
- [ ] Study Guide → Notion export

### Audio Recording & Lecture Notes

- [ ] Audio recording UI
- [ ] Audio file upload
- [ ] Whisper API integration
- [ ] Transcription workflow
- [ ] Transcription status tracking
- [ ] Auto-generated lecture notes
- [ ] Key points extraction from audio
- [ ] Action items extraction
- [ ] Audio playback with transcript sync

### Practice Problem Generator

- [ ] Practice problem generation
- [ ] Difficulty level selection (easy/medium/hard)
- [ ] Step-by-step solutions
- [ ] Answer input + validation
- [ ] Topic-based problem sets
- [ ] Mastery tracking per topic

### Concept Map

- [ ] Concept map generation from documents
- [ ] AI prompt for concept extraction
- [ ] Interactive graph visualization
- [ ] Node editing (add/edit/delete)
- [ ] Edge editing (connections)
- [ ] Drag & drop node positioning
- [ ] Auto-layout algorithm
- [ ] Concept Map → PNG export
- [ ] Concept Map → SVG export
- [ ] Concept Map → JSON export (re-import)

### Pomodoro Timer

- [ ] Timer UI component
- [ ] Work/break duration settings
- [ ] Timer notifications
- [ ] Session tracking
- [ ] Integration with study sessions
- [ ] Pomodoro stats in dashboard

### Additional Exports

- [ ] Quiz → Google Forms export
- [ ] Quiz → Kahoot export
- [ ] Notes → HTML export
- [ ] Notes → DOCX export
- [ ] Notes → Notion export
- [ ] Summary → HTML export
- [ ] Summary → DOCX export
- [ ] Study Guide → Google Docs export

---

## Post-Launch

### User Plans & Billing

- [ ] Plan definitions (free vs paid limits)
- [ ] Stripe/payment integration
- [ ] Usage tracking
- [ ] Upgrade prompts
- [ ] Plan management UI

### Mobile App

- [ ] Mobile app project setup (TBD: Svelte Native or alternative)
- [ ] Shared package integration
- [ ] Mobile-optimized flashcard UI
- [ ] Mobile quiz UI
- [ ] Offline study mode (if feasible)
- [ ] Push notifications for review reminders

### Performance & Polish

- [ ] Performance optimization
- [ ] Loading states
- [ ] Error boundaries
- [ ] Analytics integration
- [ ] User feedback system
- [ ] Onboarding flow
