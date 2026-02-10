

# Unified Management OS — Full Build Plan

## Overview
A premium, Apple-esque productivity command center with 8 business Kanban buckets, a central Daily Playbook with sprint timers, and a built-in AI Strategy Assistant — all accessible from any device.

---

## 1. AI Strategy Assistant (Chat Panel)
- A slide-out chat panel accessible from a persistent icon/button on the screen
- Powered by Lovable AI (streamed responses, markdown rendering)
- Use it to strategize on tasks, break down work, brainstorm, or get advice on any of your 8 buckets
- Conversation history maintained during the session
- Clean, minimal chat UI matching the glassmorphism design language

## 2. The 8 Kanban Buckets (Sidebar/Perimeter)
- **Buckets:** Finance, Admin/Ops, Content, Ads, Product Dev, Website/UX, Branding, Music (Bjarke)
- Each bucket is a mini-Kanban with **To-Do → In-Progress → Done** columns (inspired by the uploaded board reference)
- Task cards show title, description snippet, and priority badge
- Rich task cards with glassmorphism styling — semi-transparent backgrounds, soft shadows
- Users can create, edit, and delete tasks within each bucket

## 3. Central "Daily Playbook"
- 8 numbered vertical slots in the center of the screen
- **Drag & Drop:** Drag a task from any bucket Kanban and drop it into a Playbook slot — the task **moves** out of the Kanban
- Each slot shows the task card info once filled
- Empty slots show a subtle dashed placeholder

## 4. Sprint Timer System
- Each of the 8 Playbook slots has a **Start/Stop timer** (60-minute countdown)
- Active timer highlighted with **Electric Blue** accent
- **At 55 minutes:** A subtle chime plays and a "Status Log" modal appears
- The modal requires the user to log what they accomplished and their next micro-step before the timer can close
- Timer visually counts down with a clean progress indicator

## 5. Visual Design & Style
- **Color palette:** Monochromatic (grays, white, black) + Electric Blue accent for active elements
- **Glassmorphism** cards with frosted-glass backgrounds
- **Font:** Inter (clean sans-serif)
- **Icons:** Lucide-react throughout
- Ultra-clean layout — generous white space, no clutter
- Fully responsive so it works on phone screens too

## 6. Data Persistence (Backend)
- Set up with **Lovable Cloud** so your tasks, timer logs, and Kanban state are saved and accessible from any device (phone, desktop, etc.)
- This is what makes it work when you connect via GitHub and open it on your phone later

## 7. Drag & Drop
- Smooth drag-and-drop using dnd-kit library
- Tasks dragged from bucket Kanbans to Daily Playbook slots
- Visual feedback during drag (card lifts, slot highlights)

---

## Build Order
1. **Core layout** — Sidebar with 8 buckets + central Playbook area + AI chat panel
2. **Kanban boards** — Task CRUD within each bucket
3. **Daily Playbook** — 8 slots with drag-and-drop from buckets
4. **Sprint timers** — Countdown, chime, status log modal
5. **AI Strategy Assistant** — Chat panel with Lovable AI integration
6. **Backend & persistence** — Lovable Cloud for cross-device data sync
7. **Polish** — Glassmorphism, animations, responsive mobile layout

