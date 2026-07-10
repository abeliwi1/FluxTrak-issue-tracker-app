# FluxTrak

A Kanban-style issue tracker built with React and TypeScript, inspired by Linear. Built as a portfolio project to demonstrate state management, drag-and-drop, and component architecture.

---

## Tech Stack

- **React 19** + **Vite**
- **TypeScript** (strict mode)
- **Zustand** with Immer middleware for global state
- **@dnd-kit** for drag-and-drop
- **Tailwind CSS v3**
- **Lucide React** for icons

---

## Features

- Kanban board with drag-and-drop across columns (Backlog → Todo → In Progress → Done)
- Create, edit, and delete issues with a detail modal
- Inline editing with explicit Save/Cancel and unsaved-changes warnings
- Comments and activity log per issue
- Live search and filter by assignee and priority
- Light/dark theme toggle, persisted across sessions
- Full localStorage persistence — board state survives page refresh

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

To reset to the original mock data/receive most recent updates to application:
```js
// In browser console
localStorage.removeItem("fluxtrak-storage");
location.reload();
```

---

## Project Structure

```
src/
├── types/index.ts              # TypeScript interfaces and enums
├── lib/mock-data.ts            # Seeded relational mock data
├── store/board-store.ts        # Zustand store with all actions
├── hooks/use-board-filters.ts  # Filtered board selectors
└── components/
    ├── layout/                 # AppShell, Sidebar, TopBar
    ├── board/                  # KanbanBoard, BoardColumn, IssueCard
    └── ui/                     # Avatar, modals, icons, ThemeToggle
```

---

## A Few Things Worth Noting

**Normalized state.** Issues, users, and labels are stored as `Record<string, T>` maps. Columns hold ordered arrays of IDs. Any update to an entity is O(1) — no array scanning.

**Selector discipline.** Array derivations like `.map().filter()` are never run inside Zustand selectors, since they return new references on every call and cause infinite re-render loops. Transformations happen outside the selector in the render body or a `useMemo`.

**Optimistic drag-and-drop.** `moveIssue` updates both the column `issueIds` arrays and the issue's `status` field atomically inside a single Immer draft. No intermediate states.

**Selective persistence.** Zustand's `partialize` option persists only data state (issues, columns, comments). UI state (open modals, active filters, drag state) is intentionally excluded so the app always reloads clean.

**Theme system.** Light and dark mode are driven by CSS custom properties on `data-theme` on `<html>`. No component-level changes needed — switching themes is one DOM attribute change.

---

## License

MIT
