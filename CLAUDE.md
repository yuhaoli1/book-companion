# Book Study Companion — Claude Code Spec

## Project Overview

A multisensory book study web app that synchronizes text and audio playback, enables AI-powered concept explanation via highlighted passages, and captures personal reflections — all exportable as a clean study document.

**Core philosophy**: Turn passive reading into active, annotated learning.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React (Vite) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) via `/v1/messages` |
| Audio | HTML5 `<audio>` API with `timeupdate` events |
| Export | `jspdf` + `jspdf-autotable` (PDF) or plain Markdown export |
| State | `useState` / `useReducer` + `localStorage` for persistence |
| No backend required | All runs client-side; API key entered by user at runtime |

---

## Design Direction

**Aesthetic**: Editorial / refined dark-mode reading environment. Think *Kindle meets Notion meets a well-designed literary magazine*. Not a flashy tool — a calm, focused space.

- **Color palette**: Deep ink background (`#0f0e0d`), warm cream text (`#f5f0e8`), amber highlight (`#e8a020`), muted teal for AI notes (`#2a6b6b`)
- **Typography**: Serif body font (e.g. `Lora` or `Playfair Display`) for book text; sans-serif (`DM Sans`) for UI chrome
- **Layout**: Two-column on desktop — book pane (left, ~65%) + notes sidebar (right, ~35%). Single column on mobile with toggleable sidebar.
- **Vibe**: Quiet, focused, zero clutter. Every UI element earns its place.

---

## Feature Specification

### 1. Book Loading

- User can **paste raw text** into a setup modal OR **upload a `.txt` file**
- User can **upload an audio file** (`.mp3`, `.m4a`, `.wav`) as the accompanying audiobook
- After loading, content is stored in `localStorage` so the session persists on refresh
- Display a library-style **"Open Book"** landing screen if no book is loaded

### 2. Synchronized Reading + Audio Player

**Audio player** (pinned bottom bar):
- Play / Pause button
- Scrub timeline
- Current time + total duration
- Playback speed selector: `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`
- Volume slider

**Text + audio sync**:
- Book text is **split into paragraphs** on load
- Each paragraph gets a `data-index` attribute
- The user manually **maps timestamps to paragraphs**: a "Sync Mode" where they click a paragraph, then press a key (e.g. `S`) to stamp the current audio time to that paragraph
- Alternatively: auto-highlight based on a simple proportional mapping (audio progress % → paragraph index) as a fallback
- While audio plays, the **currently active paragraph** scrolls into view and gets a soft amber underline/glow
- Clicking a paragraph **seeks audio** to that paragraph's timestamp

### 3. Highlighting + AI Explanation

- User selects any text in the reading pane → a **floating toolbar** appears with two buttons:
  - 💡 **Explain** — sends selection to Claude API
  - 📝 **Reflect** — opens a reflection input panel
- **Highlight is saved** to state and rendered persistently with amber background
- **Explain flow**:
  - A sidebar panel opens for the selected highlight
  - Claude is called with a system prompt instructing it to explain the concept in plain language, as if to a curious non-expert
  - Response streams into the panel (use `stream: true` if possible, otherwise show a loading spinner)
  - User can **Save Explanation** → stored as a note attached to that highlight
- **Reflect flow**:
  - A textarea opens in the sidebar for the selected highlight
  - User writes their personal reflection
  - Saved as a reflection note attached to that highlight

### 4. Notes Sidebar

Right-side panel listing all highlights in reading order, each showing:
- The **highlighted text** (truncated, quoted)
- The **paragraph reference** (e.g. "¶ 12")
- The **AI explanation** (if saved), styled with a teal left-border
- The **personal reflection** (if written), styled with a warm amber left-border
- A **delete** button per item
- Sidebar is scrollable independently from the book pane

### 5. AI System Prompt

```
You are a brilliant study companion. When the user highlights a passage from a book, explain it clearly and concisely in plain language. Assume the user is intelligent but unfamiliar with the topic. Use analogies where helpful. Keep explanations under 150 words unless the concept genuinely demands more depth. Do not repeat the passage back verbatim — jump straight into the explanation.
```

### 6. Export

A **"Export Study Notes"** button (top right) generates a document containing:

**Markdown export** (primary):
```markdown
# Study Notes: [Book Title]
_Exported: [date]_

---

## Highlight 1 — ¶ 12
> "...highlighted text..."

**AI Explanation:**
Lorem ipsum explanation...

**My Reflection:**
User's personal thought...

---
```

**PDF export** (secondary, using `jspdf`):
- Title page with book name and export date
- Each highlight as a block with the same structure as above
- Clean serif typography

Trigger a **file download** for both formats.

---

## Component Architecture

```
src/
├── App.jsx                   # Root: state, routing between views
├── components/
│   ├── Landing.jsx           # Book + audio upload screen
│   ├── Reader/
│   │   ├── ReaderLayout.jsx  # Two-column layout shell
│   │   ├── BookPane.jsx      # Scrollable text with paragraph rendering
│   │   ├── Paragraph.jsx     # Single paragraph, handles click/select
│   │   └── FloatingToolbar.jsx # Appears on text selection
│   ├── AudioPlayer.jsx       # Bottom audio bar
│   ├── Sidebar/
│   │   ├── Sidebar.jsx       # Notes list container
│   │   └── NoteCard.jsx      # Individual highlight + notes block
│   ├── AIPanel.jsx           # Streaming explanation panel
│   └── ExportButton.jsx      # Triggers markdown/PDF export
├── hooks/
│   ├── useAudioSync.js       # Audio ↔ paragraph sync logic
│   ├── useHighlights.js      # CRUD for highlights + notes state
│   └── useClaudeStream.js    # Anthropic API call + streaming
├── utils/
│   ├── textParser.js         # Split raw text into paragraph array
│   ├── exportMarkdown.js     # Build markdown string
│   └── exportPDF.js          # jspdf export logic
└── styles/
    └── index.css             # Tailwind + custom CSS vars
```

---

## State Shape

```js
{
  book: {
    title: string,
    paragraphs: [{ id, text, timestamp: number | null }],
    audioUrl: string | null,       // blob URL for uploaded audio
    currentParagraphIndex: number,
  },
  highlights: [
    {
      id: string,                  // uuid
      paragraphId: string,
      selectedText: string,
      startOffset: number,
      endOffset: number,
      aiExplanation: string | null,
      reflection: string | null,
      createdAt: ISO string,
    }
  ],
  ui: {
    activeHighlightId: string | null,
    sidebarOpen: boolean,
    syncModeActive: boolean,
    apiKey: string,               // stored in localStorage only
  }
}
```

---

## API Integration

```js
// hooks/useClaudeStream.js
const explainPassage = async (selectedText, apiKey) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: STUDY_COMPANION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Explain this passage: "${selectedText}"` }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
};
```

API key is entered by the user in a settings modal and saved to `localStorage`. Never hardcoded.

---

## Key Interactions (UX Details)

| Interaction | Behavior |
|---|---|
| Select text in book | FloatingToolbar fades in near selection |
| Click "Explain" | Sidebar opens, AI explanation loads, highlight persists |
| Click "Reflect" | Sidebar opens with textarea focused |
| Click paragraph while audio plays | Seek audio to paragraph timestamp |
| Audio plays past paragraph boundary | Auto-scroll + highlight active paragraph |
| Press `S` in Sync Mode | Stamp current audio time to hovered paragraph |
| Click highlight in sidebar | Scroll book pane to that paragraph |
| Click "Export" | File download modal with Markdown / PDF choice |

---

## Persistence

- All state (book text, audio timestamps, highlights, notes) serialized to `localStorage` under key `book-companion-state`
- Audio file stored as a blob URL (session only — re-upload required after browser close)
- API key stored separately under `book-companion-apikey`

---

## Out of Scope (v1)

- Multi-book library
- User accounts / cloud sync
- Real-time audio transcription / automatic word-level sync
- Epub/PDF parsing (text input only for v1)
- Mobile app

---

## Implementation Order

1. **Scaffold**: Vite + React + Tailwind setup
2. **Landing screen**: Text paste + file upload UI
3. **Book pane**: Paragraph rendering, basic scroll
4. **Audio player**: HTML5 audio bar, playback controls
5. **Text selection + FloatingToolbar**
6. **Highlights state + rendering**
7. **Claude API integration + AIPanel**
8. **Reflection input**
9. **Notes Sidebar**
10. **Audio ↔ paragraph sync (manual stamp + proportional fallback)**
11. **Export (Markdown first, then PDF)**
12. **localStorage persistence**
13. **Polish: animations, typography, responsive layout**
