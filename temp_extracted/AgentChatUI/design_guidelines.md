# Design Guidelines: AI Agents Group Chat Application

## Design Approach
**Design System Approach** - This utility-focused application prioritizes efficiency, clarity, and usability. Drawing inspiration from:
- **Linear**: Clean, minimal interface with excellent typography hierarchy
- **Slack/Discord**: Proven chat patterns and real-time messaging UX
- **Notion**: Flexible panel-based layouts for content management

**Core Principle**: Create a distraction-free environment that enables efficient AI agent management and seamless group conversations.

---

## Layout System

### Three-Panel Architecture
```
[Left Sidebar: 280px] | [Main Chat: flex-1] | [Right Panel: 320px, toggleable]
```

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, and 16** consistently
- Component padding: `p-4` to `p-6`
- Section spacing: `space-y-4` or `space-y-6`
- Card gaps: `gap-4`
- Container margins: `m-4` or `m-6`

### Responsive Behavior
- **Desktop (lg+)**: Three-panel layout
- **Tablet (md)**: Two-panel (sidebar collapsible, no right panel)
- **Mobile**: Single panel with navigation drawer

---

## Typography Hierarchy

**Font Stack**: Inter or similar geometric sans-serif from Google Fonts CDN
```
Headings: font-semibold
- H1: text-2xl (Agent/Group names)
- H2: text-xl (Section headers)
- H3: text-lg (Panel titles)

Body Text: font-normal
- Primary: text-base (Chat messages, descriptions)
- Secondary: text-sm (Metadata, timestamps, roles)
- Tertiary: text-xs (Labels, helper text)

Monospace: font-mono text-sm (Agent IDs, technical info)
```

---

## Component Library

### Left Sidebar: Agent & Group Management
**Structure**:
- Header with "Create Agent" button (`h-14`)
- Group list (scrollable, `overflow-y-auto`)
- Agent list within each group
- Bottom actions bar (`h-16`)

**Agent Card**:
- Compact layout: Avatar (40x40) + Name + Role
- Height: `h-16`
- Padding: `p-3`
- Hover state with subtle elevation
- Active/selected state with border accent

**Group Section**:
- Collapsible header with chevron icon
- Agent count badge
- Add agent button (icon-only, small)

### Main Chat Area
**Message Container**:
- Max width: `max-w-4xl mx-auto` for optimal readability
- Padding: `px-8 py-6`
- Auto-scroll to latest message

**Message Bubbles**:
- User messages: Aligned right, `max-w-2xl`
- Agent messages: Aligned left with avatar, `max-w-2xl`
- Padding: `px-4 py-3`
- Rounded: `rounded-2xl`
- Spacing between messages: `space-y-3`

**Agent Avatar + Name Header**:
- Avatar: `w-8 h-8` circular
- Name: `font-semibold text-sm`
- Role: `text-xs opacity-70`
- Timestamp: `text-xs opacity-60`

**Message Input Area**:
- Fixed bottom, full width
- Height: `min-h-20` with auto-expand up to `max-h-40`
- Padding: `p-4`
- Border top separator
- Send button: Icon-only, positioned absolute right

### Right Panel: Agent Details (Toggleable)
**Content**:
- Agent profile card (`p-6`)
- Role description textarea
- Configuration options
- Remove from group action
- Close/collapse button

**Profile Card**:
- Avatar: `w-20 h-20` centered
- Name: `text-xl font-semibold`
- Role badge below name
- Edit button (icon + text)

### Modals/Drawers

**Create Agent Modal**:
- Size: `max-w-md`
- Form fields with clear labels
- Name input (required)
- Role input (required)
- Description textarea (optional)
- Cancel + Create buttons (right-aligned)

**Create Group Modal**:
- Size: `max-w-lg`
- Group name input
- Multi-select agent list with checkboxes
- Visual agent cards in selection grid (`grid-cols-2 gap-3`)

### Navigation & Actions

**Top Navigation Bar** (`h-16`):
- Group name/title (left)
- Action buttons (right): Settings, Add Agent, Toggle Right Panel
- Breadcrumb if nested views

**Button Sizes**:
- Primary actions: `h-10 px-4`
- Secondary: `h-9 px-3`
- Icon-only: `w-9 h-9`

---

## Icons
**Library**: Heroicons (via CDN)
- Navigation: outline style
- Actions: solid style for primary, outline for secondary
- Status indicators: solid mini icons

**Common Icons**:
- Plus circle (create agent)
- User group (groups)
- Chat bubble (messages)
- Cog (settings)
- Chevron down (collapse/expand)
- X (close/remove)

---

## State Indicators

**Loading States**:
- Skeleton screens for initial load
- Inline spinner for message sending
- Shimmer effect on cards

**Empty States**:
- Centered with icon + heading + description
- "Create your first agent" CTA
- Illustration or simple icon graphic

**Real-time Indicators**:
- Typing indicator: animated dots below last message
- Online status: small dot on agent avatar
- Unread count: badge on group items

---

## Accessibility

- All interactive elements: `min-h-11` touch target
- Form labels: visible, `text-sm font-medium`
- Focus rings: prominent, consistent
- ARIA labels for icon-only buttons
- Keyboard navigation: full support with visible focus
- Screen reader announcements for new messages

---

## Images
**No images required** - This is a functional chat application. Use:
- Generated avatar placeholders (initials with distinct background patterns)
- Icon-based empty states
- Simple geometric shapes for agent differentiation

---

## Animations
**Minimal and Purposeful**:
- Message appearance: subtle fade-up (`transition-opacity duration-200`)
- Panel toggle: slide transition (`transition-transform duration-300`)
- No scroll-triggered or decorative animations
- Focus on performance and clarity

---

This design creates a professional, efficient workspace for managing AI agent conversations with clear visual hierarchy, intuitive navigation, and real-time collaboration patterns proven in modern chat applications.