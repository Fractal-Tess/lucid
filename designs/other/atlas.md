# Alpha Study App - Wireframe

## Overview

Dark-themed study app dashboard with a clean, modern interface.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                       │
│  │  🏠   │    New space                                        │
│  ├──────┤                                                       │
│  │  📁   │    ┌─────────────────────────────────────┐           │
│  │  📝🟢 │    │  💬 Chat with AI                    │           │
│  │  📁🔵 │    └─────────────────────────────────────┘           │
│  │  📝🟢 │                                                       │
│  │  📝🟠 │    Studying                                           │
│  │  📝🟢 │    ┌────────────┬────────────┬────────────┐          │
│  │  📝🟠 │    │ 📖 Study   │ ✅ Quiz    │ 🗂️ Flash   │          │
│  ├──────┤    │   guide    │            │   cards    │          │
│  │  ➕   │    │ Prepare    │ Test your  │ Bite-sized │          │
│  ├──────┤    │ for a test │ knowledge  │  studying  │          │
│  │  📱   │    └────────────┴────────────┴────────────┘          │
│  │  ✈️   │                                                       │
│  │  ⚙️   │    Homework                                           │
│  │  👤   │    ┌────────────────┬────────────────┐               │
│  ├──────┤    │ ☑️ Solve       │ ✏️ Write       │               │
│  │  ∞   │    │ Get answers    │ Draft          │               │
│  │ Pro  │    │ and            │ paragraphs     │               │
│  └──────┘    │ explanations   │ or papers      │               │
│              └────────────────┴────────────────┘               │
│                                                                 │
│              Notes                                              │
│              ┌────────────────┬────────────────┐               │
│              │ 🎤 Recording   │ 📝 Notes       │               │
│              │ Automatic      │ Detailed notes │               │
│              │ lecture notes  │ for any        │               │
│              │                │ resource       │               │
│              └────────────────┴────────────────┘               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ➕  Ask Atlas anything...                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

| Element                | Color              | Hex Code  |
| ---------------------- | ------------------ | --------- |
| Background             | Very dark gray     | `#1a1a1a` |
| Sidebar                | Same as background | `#1a1a1a` |
| Cards                  | Dark gray          | `#2a2a2a` |
| Card hover             | Lighter gray       | `#3a3a3a` |
| Text primary           | White              | `#ffffff` |
| Text secondary         | Muted gray         | `#9ca3af` |
| Accent green           |                    | `#22c55e` |
| Accent orange          |                    | `#f97316` |
| Accent purple          |                    | `#a855f7` |
| Accent blue            |                    | `#3b82f6` |
| Icon background green  | Dark green         | `#1a3a1a` |
| Icon background orange | Dark orange        | `#3a2a1a` |
| Icon background blue   | Dark blue          | `#1a2a3a` |
| Icon background purple | Dark purple        | `#2a1a3a` |

---

## Components

### Left Sidebar (64px width)

**Top Section:**

- **Home icon** (white/active)
- **Divider line**
- **Folder icon** (gray)
- **Document icon** (green background)
- **Folder icon** (blue background)
- **Document icon** (green background)
- **Document icon** (orange background)
- **Document icon** (green background)
- **Document icon** (orange background)
- **Divider line**
- **Plus button** (add new)

**Bottom Section:**

- **Phone/mobile icon**
- **Send/share icon**
- **Settings/gear icon**
- **User profile icon**
- **Pro badge** (gradient purple with infinity icon)

### Main Content Area

#### New Space Button

- Plus icon + "New space" text
- Muted color, hover to white

#### Chat with AI Card

- Full-width card
- Chat bubble icon + text
- Dark background with hover state

#### Studying Section (3-column grid)

1. **Study guide**
   - Book icon
   - "Prepare for a test"

2. **Quiz**
   - Checklist icon
   - "Test your knowledge"

3. **Flashcards**
   - Layers icon
   - "Bite-sized studying"

#### Homework Section (2-column grid)

1. **Solve**
   - List icon
   - "Get answers and explanations"

2. **Write**
   - Pencil icon
   - "Draft paragraphs or papers"

#### Notes Section (2-column grid)

1. **Recording**
   - Microphone icon
   - "Automatic lecture notes"

2. **Notes**
   - Document/list icon
   - "Detailed notes for any resource"

### Bottom Input Bar

- Fixed position at bottom
- Centered, max-width 700px
- Plus icon + placeholder text "Ask Atlas anything..."
- Rounded corners (12px radius)

---

## Typography

- **Font Family**: System sans-serif (-apple-system, BlinkMacSystemFont, 'Segoe
  UI', Roboto)
- **Section Headers**: 16px, font-weight 600
- **Card Titles**: 14px, font-weight 600
- **Card Descriptions**: 13px, font-weight 400, muted color
- **Body Text**: 14px, font-weight 400

---

## Spacing & Layout

- **Sidebar icons**: 40x40px with 8px gap
- **Sidebar icon backgrounds**: Rounded rectangles with colored backgrounds (not
  just icons)
- **Sidebar dividers**: 1px horizontal lines, 24px width
- **Card padding**: 20px
- **Card border-radius**: 12px
- **Card gap**: 12px
- **Section margin-bottom**: 32px
- **Main content padding**: 40px 60px
- **Bottom input padding**: 16px 20px

---

## Interactions

- **Hover states**: Cards lighten to `#3a3a3a`
- **Active sidebar icon**: Background `#2a2a2a`
- **Cursor**: Pointer on all interactive elements
- **Transitions**: 200ms ease on background-color
