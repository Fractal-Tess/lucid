# NotebookLM Interface Wireframe

## Overview

Three-column study/research interface with dark theme. The layout consists of a
Sources panel (left), Chat panel (center), and Studio panel (right).

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🏠  Information Sources, Entropy, and Signal Formatting    [Public]  + Create notebook  Analytics  │
│                                                                               Share    Settings  👤  │
├──────────────┬─────────────────────────────────────────────────────────────────┬───────────────────┤
│              │                                                                 │                   │
│  Sources     │  Chat                                                             │  Studio           │
│  ─────────   │  ────                                                             │  ──────           │
│              │                                                                 │                   │
│  [□]         │  • Creation of Antipodal Codes: The method for creating           │  ┌─────────────┐  │
│              │    biorthogonal codes relies on these orthogonal sets 4...        │  │ 🎧 Audio    │  │
│  + Add       │                                                                 │  │   Overview  │  │
│  sources     │  • Advantages: These methods are used because antipodal           │  ├─────────────┤  │
│              │    signal vectors provide better spatial characteristics...       │  │ 🎬 Video    │  │
│  🔍 Try Deep │                                                                 │  │   Overview  │  │
│  Research    │  ┌─────────────────────────────────────────────────────────┐      │  ├─────────────┤  │
│              │  │  🚩 Save to note  📋  👍  👎                              │      │  │ 🧠 Mind Map │  │
│  ─────────   │  └─────────────────────────────────────────────────────────┘      │  ├─────────────┤  │
│              │                                                                 │  │ 📊 Reports  │  │
│  🌐 Web  ▼   │  How do you prove that an S box is linear or non linear...      │  ├─────────────┤  │
│  ⚡ Fast      │                                                                 │  │ 🎴 Flash-   │  │
│  research ▼  │  In cryptographic systems, an S-box (substitution box) is       │  │   cards     │  │
│           →  │  a method where symbols from the "clear text" are substituted   │  ├─────────────┤  │
│              │  with other symbols from an alphabet to ensure greater          │  │ ❓ Quiz     │  │
│  ☑️ Select   │  complexity through non-linear transformation 1 2...            │  ├─────────────┤  │
│  all sources │                                                                 │  │ 📈 Info-    │  │
│              │  1. Calculate C: Perform the transformation on each input       │  │   graphic   │  │
│  ☑️ 📄 PDF   │     separately and then sum the results (using XOR for          │  ├─────────────┤  │
│  OPI_Part1_  │     binary data): C = T(a) ⊕ T(b) 3 4...                        │  │ 📑 Slide    │  │
│  Lecture-1_  │                                                                 │  │   deck      │  │
│  ...         │  2. Calculate C': Sum the inputs first, and then perform        │  ├─────────────┤  │
│              │     the transformation on that sum: C' = T(a ⊕ b) 3...          │  │ 📋 Data     │  │
│  ☑️ 📄 PDF   │                                                                 │  │   table     │  │
│  OPI_Part1_  │  3. Compare the results:                                      │  └─────────────┘  │
│  Lecture-2_1 │                                                                 │                   │
│  ...         │     • If C = C' for all possible inputs, the transformation   │  ───────────────  │
│              │       is linear 4...                                          │                   │
│  ☑️ 📄 PDF   │     • If C ≠ C' for the inputs, the transformation is         │  📋 Information   │
│  OPI_Part1_  │       non-linear 4...                                         │  Theory Quiz      │
│  Lecture-2_2 │                                                                 │  1 source • 1d ago│
│  ...         │  Example of proving non-linearity: Using a specific S-box     │  ⋮                │
│              │  mapping where the input 001 maps to 111, 010 maps to 000...  │                   │
│  ☑️ 📄 PDF   │                                                                 │  📋 Information   │
│  OPI_Part1_  │  • Let a = 001 and b = 010.                                   │  Quiz             │
│  Lecture-3_  │  • C = T(001) ⊕ T(010) = 111 ⊕ 000 = 111 4...                 │  1 source • 1d ago│
│  ...         │  • C' = T(001 ⊕ 010) = T(011) = 110 4...                      │  ⋮                │
│              │  • Since 111 ≠ 110, the S-box is proven to be non-linear 4... │                   │
│  [More PDF   │                                                                 │  📋 Information   │
│   sources    │  Non-linearity is a highly desirable property for S-boxes     │  Theory Quiz      │
│   ...]       │  because linear transformations are more vulnerable to        │  1 source • 1d ago│
│              │  cryptanalysis 8...                                           │  ⋮                │
│  ☑️ 📝 MD    │                                                                 │                   │
│  Вариант 1   │  ┌─────────────────────────────────────────────────────────┐      │  [More quiz and   │
│              │  │  🚩 Save to note  📋  👍  👎                              │      │   flashcard       │
│  ☑️ 📝 MD    │  └─────────────────────────────────────────────────────────┘      │   items...]       │
│  Вариант 2   │                                                                 │                   │
│              │                              Today • 19:34                      │                   │
│  ☑️ 📝 MD    │  ┌─────────────────────────────────────────────────────────┐      │                   │
│  Вариант 3   │  │  Start typing...                                    16 📄 │      │                   │
│              │  └─────────────────────────────────────────────────────────┘      │                   │
│  ☑️ 📝 MD    │                                                                 │  ┌─────────────┐  │
│  Вариант 4   │                                                                 │  │ 📝 Add note │  │
│              │                                                                 │  └─────────────┘  │
└──────────────┴─────────────────────────────────────────────────────────────────┴───────────────────┘
```

---

## Top Navigation Bar

**Height**: 48px **Background**: `#1a1a1a` **Border-bottom**: 1px solid
`#2a2a2a`

### Left Section

- **Logo icon** (circular, gradient)
- **Notebook title**: "Information Sources, Entropy, and Signal Formatting"
- **Public badge**: Rounded pill, dark background with "Public" text

### Right Section

- **+ Create notebook** button: White background, dark text, rounded
- **Analytics** button: Icon + text
- **Share** button: Icon + text
- **Settings** button: Gear icon + text
- **PLUS** badge
- **Grid menu icon** (9 dots)
- **User avatar** (circular)

---

## Left Panel: Sources

**Width**: 280px **Background**: `#1a1a1a` **Border-right**: 1px solid `#2a2a2a`

### Header

- **Title**: "Sources"
- **Expand icon** (square with arrows)

### Add Sources Section

- **+ Add sources** button: Full-width, centered, bordered, rounded (8px)
- **🔍 Try Deep Research** banner: Green gradient background, text "Try Deep
  Research for an in-depth report and new sources!"

### Search Bar

- **Placeholder**: "Search the web for new sources"
- **Dropdown**: "🌐 Web ▼"
- **Dropdown**: "⚡ Fast research ▼"
- **Arrow button**: Submit search

### Source List

- **Checkbox**: "Select all sources"
- **Individual sources** (each with checkbox + PDF/MD icon + filename)
  - PDF files: Red PDF icon
  - MD files: Blue Markdown icon
  - Truncated filenames with ellipsis
  - 16 sources total shown

---

## Center Panel: Chat

**Background**: `#1a1a1a` **Flex**: 1 (takes remaining space)

### Header

- **Title**: "Chat"
- **Settings icon** (sliders)
- **More options icon** (three dots)

### Chat Messages

Messages displayed as rich text with:

- **Bullet points** with bold section headers
- **Superscript citations** (e.g., "4", "1 2", "3")
- **Inline code/formulas** (e.g., "C = T(a) ⊕ T(b)")
- **Numbered lists** for procedures
- **Mathematical notation** support

### Message Actions Bar

- **🚩 Save to note** button
- **📋 Copy** button
- **👍 Thumbs up** button
- **👎 Thumbs down** button

### User Query Bubble

- Centered, dark gray background (`#2a2a2a`)
- Rounded pill shape
- Text: User's question

### Input Area

**Position**: Fixed at bottom of chat panel **Background**: `#1a1a1a` with top
border

- **Input field**:
  - Placeholder: "Start typing..."
  - Background: `#252525`
  - Rounded: 24px (pill shape)
  - Padding: 16px 20px
- **Source count badge**: "16 sources" with document icon
- **Send button**: Circular, arrow icon

---

## Right Panel: Studio

**Width**: 320px **Background**: `#1a1a1a` **Border-left**: 1px solid `#2a2a2a`

### Header

- **Title**: "Studio"
- **Expand icon** (square with arrows)

### Tools Grid (3x3)

**Card size**: ~100px x 80px **Gap**: 8px **Border-radius**: 12px

| Tool           | Icon | Background                  |
| -------------- | ---- | --------------------------- |
| Audio Overview | 🎧   | Dark gray `#2a2a2a`         |
| Video Overview | 🎬   | Dark green `#1a3a2a`        |
| Mind Map       | 🧠   | Dark purple `#2a1a3a`       |
| Reports        | 📊   | Dark yellow/olive `#3a3a1a` |
| Flashcards     | 🎴   | Dark orange `#3a2a1a`       |
| Quiz           | ❓   | Dark gray `#2a2a2a`         |
| Infographic    | 📈   | Dark purple `#2a1a3a`       |
| Slide deck     | 📑   | Dark green `#1a3a2a`        |
| Data table     | 📋   | Dark gray `#2a2a2a`         |

Each tool card:

- Icon at top-left
- Label below icon
- Edit/pencil icon at top-right (on some cards)

### Generated Content List

**Section title**: None (implicit)

List of generated study materials:

- **Icon**: Quiz or flashcard icon
- **Title**: Content name (e.g., "Information Theory Quiz")
- **Subtitle**: "X sources • Xd ago"
- **More options**: Three-dot menu on right

Examples shown:

1. 📋 Information Theory Quiz (1 source • 1d ago)
2. 📋 Information Quiz (1 source • 1d ago)
3. 📋 Information Theory Quiz (1 source • 1d ago)
4. 📋 Communication Quiz (1 source • 1d ago)
5. 🎴 Communication Flashcards (1 source • 1d ago)
6. 🎴 Information Flashcards (1 source • 1d ago)
7. [More items...]

### Add Note Button

**Position**: Bottom-right, floating

- **Icon**: Document with plus
- **Text**: "Add note"
- **Style**: White background, dark text, rounded pill

---

## Color Scheme

| Element               | Color             | Hex Code  |
| --------------------- | ----------------- | --------- |
| Background (main)     | Very dark gray    | `#1a1a1a` |
| Background (cards)    | Dark gray         | `#252525` |
| Background (elevated) | Lighter dark gray | `#2a2a2a` |
| Border                | Subtle gray       | `#2a2a2a` |
| Text primary          | White             | `#ffffff` |
| Text secondary        | Muted gray        | `#9ca3af` |
| Text tertiary         | Darker gray       | `#6b7280` |
| Accent green          | Green             | `#22c55e` |
| Accent green dark     | Dark green        | `#1a3a2a` |
| Accent orange         | Orange            | `#f97316` |
| Accent orange dark    | Dark orange       | `#3a2a1a` |
| Accent purple         | Purple            | `#a855f7` |
| Accent purple dark    | Dark purple       | `#2a1a3a` |
| Accent blue           | Blue              | `#3b82f6` |
| Accent yellow/olive   | Yellow-green      | `#84cc16` |
| Accent yellow dark    | Dark olive        | `#3a3a1a` |
| PDF icon red          | Red               | `#ef4444` |
| Markdown icon blue    | Blue              | `#3b82f6` |

---

## Typography

- **Font Family**: System sans-serif (-apple-system, BlinkMacSystemFont, 'Segoe
  UI', Roboto, sans-serif)
- **Top nav title**: 14px, font-weight 500
- **Panel headers**: 14px, font-weight 600
- **Section headers in chat**: 14px, font-weight 600
- **Body text**: 14px, font-weight 400, line-height 1.6
- **Card labels**: 13px, font-weight 500
- **Source filenames**: 13px, font-weight 400
- **Timestamps**: 12px, font-weight 400, muted color
- **Button text**: 14px, font-weight 500

---

## Spacing & Layout

### Panels

- **Left panel width**: 280px
- **Right panel width**: 320px
- **Center panel**: Flexible (fills remaining space)

### Sources Panel

- **Padding**: 16px
- **Section gaps**: 16px
- **Source item height**: 40px
- **Source item gap**: 4px

### Chat Panel

- **Message padding**: 20px 24px
- **Message gap**: 16px
- **Action bar margin**: 12px top
- **Input area height**: 80px
- **Input padding**: 16px 24px

### Studio Panel

- **Padding**: 16px
- **Tools grid gap**: 8px
- **Tool card padding**: 12px
- **Generated item height**: 56px
- **Generated item gap**: 8px

### Global

- **Border radius (small)**: 6px
- **Border radius (medium)**: 8px
- **Border radius (large)**: 12px
- **Border radius (pill)**: 24px
- **Border radius (full)**: 9999px

---

## Components

### Buttons

**Primary Button (Create notebook)**:

- Background: white
- Text: dark (`#1a1a1a`)
- Padding: 8px 16px
- Border-radius: 8px
- Font-weight: 500

**Secondary Button (Add sources)**:

- Background: transparent
- Border: 1px solid `#3a3a3a`
- Text: white
- Padding: 12px
- Border-radius: 8px
- Full-width

**Icon Button**:

- Background: transparent
- Padding: 8px
- Border-radius: 6px
- Hover: `#2a2a2a` background

**Floating Action Button (Add note)**:

- Background: white
- Text: dark
- Padding: 12px 20px
- Border-radius: 24px
- Shadow: subtle drop shadow

### Cards

**Tool Card**:

- Background: colored (varies by tool)
- Border-radius: 12px
- Padding: 12px
- Aspect ratio: ~4:3

**Chat Message**:

- No background (transparent)
- Padding: 20px 0
- Border-bottom: none

### Input Fields

**Search Input**:

- Background: `#252525`
- Border: 1px solid `#3a3a3a`
- Border-radius: 8px
- Padding: 12px 16px

**Chat Input**:

- Background: `#252525`
- Border: none
- Border-radius: 24px
- Padding: 16px 20px
- Min-height: 56px

### Badges

**Public Badge**:

- Background: `#2a2a2a`
- Text: white
- Padding: 4px 12px
- Border-radius: 12px
- Font-size: 12px

**Source Count Badge**:

- Background: transparent
- Text: muted gray
- Icon: document
- Font-size: 12px

### Icons

All icons use consistent sizing:

- **Small**: 16px
- **Medium**: 20px
- **Large**: 24px

Icon colors:

- **Default**: `#9ca3af` (muted gray)
- **Active**: `#ffffff` (white)
- **Accent**: Context-dependent (green, orange, purple, etc.)

---

## Interactions

### Hover States

- **Cards**: Background lightens by 5-10%
- **Buttons**: Opacity 0.9 or background shift
- **List items**: Background `#252525`
- **Icons**: Color shifts to white
- **Transition**: 150ms ease

### Active States

- **Buttons**: Scale 0.98
- **List items**: Background `#2a2a2a`
- **Selected sources**: Checkbox checked, row highlighted

### Focus States

- **Inputs**: Border color `#3b82f6` (blue), subtle glow
- **Buttons**: Outline 2px offset

### Scroll Behavior

- **Smooth scrolling** enabled
- **Scrollbars**: Thin, dark themed
- **Auto-scroll** to bottom in chat on new messages

---

## Responsive Behavior

### Desktop (1200px+)

- All three panels visible
- Full layout as shown

### Tablet (768px - 1199px)

- Right panel collapses to drawer
- Toggle button to show/hide Studio

### Mobile (< 768px)

- Single column view
- Bottom navigation for panel switching
- Chat takes full width
- Sources and Studio in drawers

---

## Special Features

### Citations

- Superscript numbers in chat messages
- Clickable (opens source reference)
- Color: muted gray with hover state

### Source Selection

- Checkbox for each source
- "Select all" toggle
- Selected count shown in input area

### Content Generation

- One-click generation from Studio tools
- Progress indicators during generation
- Generated content appears in list below tools

### Chat Actions

- Save to note (creates new note from message)
- Copy to clipboard
- Thumbs up/down for feedback
