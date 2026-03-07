# 📦 Order Tracking Dashboard

A modern, production-ready order tracking dashboard for real-time logistics management. Built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui. **Powered by AppSheet API**.

## ✨ Features

### Core Functionality
- **Order Management**: Track **4,680+ orders** through various stages of the fulfillment process
- **Status Tracking**: Monitor order status from new order to dispatch
- **Search & Filter**: Quickly find orders by ID, company, product, or customer name
- **Real-time Updates**: Auto-refresh every 30 seconds for live data
- **AppSheet Integration**: Data stored and managed via AppSheet API

### Status Workflow
Based on actual data, orders progress through these statuses:
1. **New Order** (Blue) - 2 orders
2. **Material In Process** (Orange) - 40 orders
3. **Loading Point** (Yellow) - 12 orders ⚡ **Actionable**
4. **Loading Done** (Purple) - 21 orders
5. **Documents Ready** (Teal) - 1 order
6. **Dispatched** (Green) - 4,445 orders

Special statuses:
- **Hold** (Red) - 2 orders
- **Cancel** (Gray) - 157 orders

### Data Fields from AppSheet
Each order contains:
- `Unique Id` - Order ID (e.g., "FAV-975")
- `COMPANY NAME` - Customer company
- `PRUDUCT` - Product type
- `Total Order Quantity in Kg` - Order quantity
- `Status` - Current order status
- `Name` - Customer name
- `Phone` - Contact phone
- `Address` - Delivery address
- `Email` - Customer email
- And more...

## 🎨 UI/UX Features

### Desktop Layout
- Top navbar with search and refresh
- Sidebar navigation with status filters and counts
- Card-based order display (4 columns)
- KPI summary cards

### Mobile Layout
- Responsive single-column design
- Sticky bottom navigation
- Large touch-friendly buttons
- Slide-out menu for filters

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Bun package manager

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The app will automatically connect to the configured AppSheet API.

## 🔌 API Configuration

The app connects to AppSheet using:
```
URL: https://api.appsheet.com/api/v2/apps/fd753d2f-bcb4-49ae-a8ad-9a333bba0d97/tables/OrderTracking/Action
```

API credentials are configured in `src/lib/appsheet.ts`.

## 📁 Project Structure

```
src/
├── app/api/orders/
│   ├── route.ts              # Get orders with filters
│   ├── stats/route.ts        # KPI statistics
│   └── [id]/route.ts         # Update order status
├── components/dashboard/
│   ├── dashboard.tsx         # Main container
│   ├── navbar.tsx            # Top navigation
│   ├── sidebar.tsx           # Desktop sidebar
│   ├── mobile-nav.tsx        # Mobile bottom nav
│   ├── order-card.tsx        # Order card
│   ├── status-badge.tsx      # Status badges
│   ├── kpi-cards.tsx         # KPI summary
│   ├── orders-list.tsx       # Orders grid
│   └── confirm-modal.tsx     # Update modal
└── lib/
    ├── appsheet.ts           # AppSheet API service
    ├── constants.ts          # Status constants
    └── utils.ts              # Utilities
```

## 🎨 Status Badge Colors

| Status | Color | Count |
|--------|-------|-------|
| New Order | Blue | 2 |
| Material In Process | Orange | 40 |
| Loading Point | Yellow | 12 |
| Loading Done | Purple | 21 |
| Documents Ready | Teal | 1 |
| Dispatched | Green | 4,445 |
| Hold | Red | 2 |
| Cancel | Gray | 157 |

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (single column, bottom nav)
- **Tablet**: 640px - 1024px (two columns, bottom nav)
- **Desktop**: > 1024px (four columns, sidebar)

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Component library
- **Lucide React** - Icons

### Backend
- **AppSheet API** - Data storage (4,680 orders)
- **Next.js API Routes** - Server-side logic

---

Built for logistics teams managing large-scale order operations.
