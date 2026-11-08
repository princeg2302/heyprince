# Humanoid Virtual Office UI Plan
**HeyPrince Autonomous AI Workforce Platform**
*Audit Date: 2026-11-08*

---

## 1. Visual Design Philosophy & Stack Integration

The HeyPrince AI Company Virtual Office UI extends the existing high-performance, dark-mode cyberpunk aesthetic used across `heyprince.in/admin`.
- **Target URL:** `/admin/company` (integrated into Payload Admin navigation).
- **Technology Choice:** React 19, Tailwind CSS, Lucide icons, Framer Motion / CSS keyframe transitions, and modular SVG rendering for the virtual company floorplan.
- **Pragmatic Visual Decision:** Avoid heavy 3D WebGL bundle overhead that degrades mobile loading. Utilize responsive isometric 2.5D SVG architecture and real-time activity glows to deliver a fluid 60 FPS experience on both desktop and mobile devices.

---

## 2. Page Architecture & Sub-Views

The Virtual Office consists of five integrated views accessible via an executive sub-navigation bar:

### View 1: Virtual Office Floor & Room Hub
- **Interactive Floorplan:** Visual map of the 5 virtual rooms (`War Room`, `Daily Standup`, `Innovation Lab`, `Growth & Sales`, `Dev Room`).
- **Live Room Indicators:** Pulsing neon badges showing active participants, discussion title, and turn counts.
- **One-Click Teleport:** Clicking a room opens the live meeting streamer for that space.

### View 2: Live Meeting Streamer
- **Turn-by-Turn Feed:** Agent avatar, display name, department badge, statement type pill (`evidence`, `challenge`, `consensus`).
- **Live Transcript:** Formatted clean text with evidence attachments (URLs, metrics, code snippets).
- **Meeting Controls for CEO:**
  - `Advance Turn` (triggers immediate autonomous next turn from Python backend).
  - `Conclude & Synthesize` (forces instant executive summary and proposal generation).
  - `New Meeting` modal (select room, set objective, select participants).

### View 3: Workforce Identity Matrix
- **Humanoid Cards:** Card for each employee showing avatar, name, department, status pill (`in_meeting`, `working`, `idle`), bio, personality archetype, and performance rating (e.g. 5.0 stars, 12 tasks completed).
- **Identity Drawer:** Clicking an employee reveals their allowed tools, model preferences, recent task history, and memory scope.

### View 4: Task Matrix & Kanban Board
- Columns: `Pending`, `In Progress`, `Review Ready`, `Completed`.
- Task Cards: Title, assigned agent avatar, reviewer avatar, priority badge, acceptance criteria checklist, and verification notes.
- Quick Actions: Manual task assignment button for CEO.

### View 5: CEO Approval Gate
- Clean queue of pending proposals requiring human sign-off.
- Shows proposal type, sponsor avatar, business justification, estimated cost, and action preview.
- Direct `Approve & Execute`, `Request Changes`, or `Reject` buttons.

---

## 3. Responsive Mobile Optimizations

1. **Touch-friendly drawers:** On iOS Safari / Android Chrome, drawers slide up from bottom sheet with native momentum.
2. **Push Notification Bridge:** Direct integration with existing Apple Web Push service (`/admin/push/subscribe`) so Prince receives instant approval notifications on his phone.
