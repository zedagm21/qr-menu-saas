# 🍽️ QR Menu SaaS — Modern Digital Restaurant Menu Platform

A production-ready, high-performance, multi-tenant QR Menu SaaS platform designed for restaurants, cafes, bars, and bistros. Features full bilingual support (**English 🇬🇧 & Amharic 🇪🇹**), custom QR code generation, real-time menu styling studio, live mobile previews, optimistic dashboard updates, and high-throughput in-memory caching.

---

## ✨ Features & Highlights

### 📱 Public Diner Experience
* **⚡ Blazing Fast Menus:** In-memory TTL caching with millisecond response times under peak dining rush.
* **🌐 Bilingual Translations:** Native toggle between English and Amharic with full Ge'ez script typography.
* **🎨 4 Responsive Menu Styles:**
  * **Classic:** Warm tones with structured grid layout.
  * **Modern:** Card-based layout with bold typography.
  * **Elegant:** Editorial full-width imagery with serif styling.
  * **Minimal:** Clean, distraction-free typographic list.
* **🔍 Instant Search & Category Filtering:** Sticky category pills and instant client-side search across names, descriptions, and ingredients.
* **🏷️ Dietary & Item Badges:** Visual indicators for Featured ⭐, Spicy 🌶️, and Sold Out states.

### 🏢 Restaurant Management Dashboard
* **📊 Live Overview & Analytics:** Interactive stats counters, onboarding checklist, and category distribution charts.
* **🗂️ Category & Menu Catalog:**
  * Bilingual dish editing (Names, Descriptions, Ingredients, Allergens).
  * Instant availability toggles with **0ms latency (Optimistic UI)**.
  * Drag & drop / arrow reordering of categories and dishes.
* **🎨 Menu Customization Studio:**
  * 14 curated color palette presets (Amber, Emerald, Purple, Café, Fine Dining, Ocean, etc.).
  * Interactive color pickers & custom Hex inputs for Primary and Accent branding.
  * Live responsive multi-device preview (**Mobile, Tablet, Desktop**).
* **📱 Dynamic QR Code Generator:**
  * High-resolution canvas rendering.
  * Single-click **PNG download** and **Native Web Share API** integration.
  * Permanent dynamic URLs — update your menu anytime without re-printing QR codes.
* **🇪🇹 Amharic Transliteration Engine:**
  * Automatically converts Ge'ez script (e.g. `ሐበሻ ባህላዊ ምግብ`) into clean, memorable Latin slugs (`habesha-bahlawi-migib`).
* **🖼️ Dual-Tier Image Processing:**
  * **Client-side:** Instant HTML5 Canvas downsampling (reduces 10MB phone uploads to ~200KB in ~100ms).
  * **Server-side:** Sharp magic-byte validation, EXIF stripping, decompression bomb protection, WebP compression, and Cloudflare R2 / Local storage.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge)
* **State & Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
* **Internationalization:** [i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/)
* **Routing:** [React Router v6](https://reactrouter.com/) (Lazy-loaded routes with Suspense)
* **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
* **Icons & Notifications:** [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/)
* **QR Codes:** [qrcode.react](https://github.com/zpao/qrcode.react)

### Backend
* **Runtime & Framework:** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
* **Database & ORM:** [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
* **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/), [Multer](https://github.com/expressjs/multer)
* **Authentication & Security:** JWT (stored in HttpOnly, SameSite cookies), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), CORS
* **Object Storage:** Cloudflare R2 (S3-compatible SDK) with fallback to Local Disk Storage

---

## 📂 Project Architecture

```
qr-menu-saas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Multi-tenant DB schema with compound indexes
│   │   └── seed.ts                # Database seeder for demo restaurant
│   ├── src/
│   │   ├── config/                # Database, environment, and security configs
│   │   ├── controllers/           # Express request handlers
│   │   ├── middleware/            # Auth, tenantGuard, rateLimiting, errorHandler
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # Business logic (Auth, Menu, Cache, ImageProcessor)
│   │   ├── utils/                 # Ge'ez transliteration, slug generator, JWT helpers
│   │   ├── validators/            # Zod validation schemas
│   │   └── app.ts                 # Express application entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components (Buttons, Modals, Cards, Skeletons)
│   │   ├── contexts/              # AuthContext, DashboardThemeContext
│   │   ├── hooks/                 # TanStack Query custom hooks
│   │   ├── i18n/                  # Bilingual locale JSONs (EN / AM)
│   │   ├── lib/                   # Utils, formatting, client image compression
│   │   ├── pages/
│   │   │   ├── auth/              # LoginPage, RegisterPage
│   │   │   ├── dashboard/         # Overview, Restaurant, Categories, Menu, QR, Customize, Settings
│   │   │   └── public/            # PublicMenuPage (Diner-facing menu viewer)
│   │   ├── services/              # Axios instance & API client definitions
│   │   ├── types/                 # TypeScript interfaces and shared types
│   │   ├── App.tsx                # App routing & providers
│   │   └── main.tsx               # DOM root mount
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher (recommended `v20+`)
* **NPM**: `v9.0.0` or higher
* **PostgreSQL**: Local instance or cloud database (e.g. Supabase, Neon, Railway)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/qr-menu-saas.git
cd qr-menu-saas
```

---

### 2. Backend Setup

1. **Navigate to the backend directory & install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL="postgresql://postgres:password@localhost:5432/qrmenu_db"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET="your-cookie-secret"
   FRONTEND_URL="http://localhost:5173"
   APP_URL="http://localhost:5173"
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE=5242880
   ```

3. **Run Prisma Migrations & Generate Client:**
   ```bash
   npx prisma migrate dev --name init
   npm run db:generate
   ```

4. **(Optional) Seed Demo Data:**
   ```bash
   npm run db:seed
   ```

5. **Start the Backend Server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:3001`.

---

### 3. Frontend Setup

1. **Open a new terminal, navigate to the frontend directory & install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new owner + restaurant tenant |
| `POST` | `/api/auth/login` | Authenticate user & issue HttpOnly cookie |
| `POST` | `/api/auth/logout` | Clear auth session cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user session |
| `POST` | `/api/auth/password` | Update account password |

### 🏬 Restaurant & Theme (`/api/restaurant`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/restaurant` | Get current tenant restaurant details |
| `PUT` | `/api/restaurant` | Update profile, address, phone, currency |
| `PUT` | `/api/restaurant/theme` | Update colors, fonts, layout style, dark mode |
| `POST` | `/api/restaurant/logo` | Upload & compress restaurant logo |
| `POST` | `/api/restaurant/cover` | Upload & compress restaurant cover banner |
| `POST` | `/api/restaurant/publish` | Toggle menu status (`PUBLISHED` $\leftrightarrow$ `DRAFT`) |
| `GET` | `/api/restaurant/stats` | Overview metric counters |

### 📑 Categories (`/api/categories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | List all categories with translations |
| `POST` | `/api/categories` | Create category with bilingual translations |
| `PUT` | `/api/categories/:id` | Update category details & translations |
| `DELETE` | `/api/categories/:id` | Delete category (blocked if items exist) |
| `PUT` | `/api/categories/reorder` | Batch update category display sequence |

### 🍔 Menu Items (`/api/menu-items`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/menu-items` | List menu items (optional `?categoryId=`) |
| `GET` | `/api/menu-items/:id` | Get single menu item |
| `POST` | `/api/menu-items` | Create menu item with bilingual translations |
| `PUT` | `/api/menu-items/:id` | Update item details, prices, availability |
| `DELETE` | `/api/menu-items/:id` | Delete item & prune image storage |
| `POST` | `/api/menu-items/:id/image` | Upload food photo with WebP conversion |
| `PUT` | `/api/menu-items/reorder` | Batch update item display sequence |

### 🌐 Public Menu API (`/api/public`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/restaurants/:slug` | Public restaurant branding & theme (Cached) |
| `GET` | `/api/public/restaurants/:slug/menu` | Public bilingual menu catalog (Cached) |

---

## 🔒 Security & Performance Features

* **Multi-Tenant Guard (`tenantGuard.ts`):** `restaurantId` is strictly extracted from verified JWT tokens on every mutating request, completely preventing cross-tenant data tampering.
* **HttpOnly Auth Cookies:** JWT tokens are stored in secure HttpOnly cookies, protecting against XSS token theft.
* **Compound DB Indexes:** High-concurrency B-Tree indexes on `[restaurantId, isActive, displayOrder]` allow sub-2ms lookups during peak table scan hours.
* **Automated Cache Invalidation:** Public menu caching automatically purges expired entries and invalidates relevant restaurant prefixes on any catalog write.
* **Image Sanitization:** Multi-step Sharp image pipeline validates magic bytes, strips GPS/EXIF metadata, protects against decompression pixel bombs, and encodes outputs into lightweight WebP format.

---

## 📜 Available Scripts

### Backend
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with hot-reload (`ts-node-dev`) |
| `npm run build` | Generate Prisma client and compile TypeScript to `dist/` |
| `npm run start` | Start compiled production server |
| `npm run lint` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:generate` | Regenerate Prisma Client types |
| `npm run db:studio` | Open Prisma Studio database GUI |

### Frontend
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Run TypeScript check and compile production bundle |
| `npm run preview` | Locally preview production build |
| `npm run lint` | Run TypeScript type checks (`tsc --noEmit`) |

---

## 📄 License
This project is licensed under the **ISC License**.
