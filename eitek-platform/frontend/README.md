# EITEK Platform – Frontend

## Tổng quan

Giao diện quản trị nền tảng IoT/SCADA của EITEK, xây dựng trên **Next.js 14** (App Router) với TypeScript, Tailwind CSS và Zustand.

- **URL phát triển:** `http://localhost:3000`
- **Backend API:** `http://localhost:3001`
- **Tài khoản test:** `admin@eitek.com` / `admin123`

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Next.js | 14.2.35 | Framework React (App Router, SSR) |
| TypeScript | 5.x | Kiểu dữ liệu tĩnh |
| Tailwind CSS | 3.3 | Styling utility-first |
| Zustand | 4.x | State management (devtools + persist + immer) |
| react-hook-form + Zod | — | Form validation |
| Konva / react-konva | — | SCADA canvas 2D (vẽ widget) |
| Radix UI | — | Dialog, primitives accessible |
| lucide-react | — | Icon library |

---

## Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: xác thực
│   │   ├── layout.tsx
│   │   └── login/page.tsx        # Trang đăng nhập
│   ├── (dashboard)/              # Route group: sau đăng nhập
│   │   ├── layout.tsx            # Layout chính (sidebar, header)
│   │   ├── page.tsx              # Dashboard tổng quan
│   │   ├── devices/page.tsx      # Quản lý thiết bị
│   │   ├── projects/
│   │   │   ├── page.tsx          # Danh sách dự án
│   │   │   └── [id]/page.tsx     # Chi tiết dự án + SCADA dashboards
│   │   ├── scada/
│   │   │   └── [id]/page.tsx     # SCADA Editor (Konva canvas)
│   │   ├── settings/page.tsx     # Cài đặt hệ thống
│   │   └── templates/page.tsx    # Quản lý templates
│   ├── globals.css               # Tailwind directives + global CSS
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   └── providers.tsx             # Client-side providers
│
├── features/                     # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── services/authService.ts   # API: login, register, refresh, profile
│   │   └── stores/authStore.ts       # Zustand: token, user, isAuthenticated
│   ├── devices/
│   │   ├── components/           # DeviceCard, DeviceFilters, DeviceListItem, DeviceToolbar
│   │   ├── services/deviceService.ts
│   │   ├── stores/deviceStore.ts
│   │   └── types/index.ts
│   ├── projects/
│   │   ├── components/           # ProjectCard, ProjectFormModal, ProjectDeleteDialog
│   │   ├── services/projectService.ts  # 35+ methods (CRUD, favorites, search)
│   │   ├── stores/projectStore.ts      # Full Zustand store (889 lines)
│   │   └── types/index.ts
│   └── scada/
│       ├── components/           # ScadaCanvas, WidgetPalette, ScadaCard, ScadaFormModal, ScadaDeleteDialog
│       ├── services/scadaService.ts    # 35+ methods (CRUD, widgets, layers, runtime, export/import)
│       ├── stores/scadaStore.ts        # Editor state, widgets, selection, history (1051 lines)
│       └── types/index.ts             # ScadaDashboard, Widget types, Editor types (528 lines)
│
└── shared/                       # Code dùng chung
    ├── components/
    │   ├── layout/DashboardLayout.tsx  # Sidebar + Header + Content
    │   ├── providers/            # AuthProvider, ThemeProvider, WebSocketProvider
    │   └── ui/                   # Button, Input, Dialog, Card, Badge, LoadingSpinner, Toast...
    ├── lib/utils.ts              # cn() helper (clsx + tailwind-merge)
    ├── services/
    │   └── api.ts                # API client: auto-unwrap { success, data } → data
    ├── stores/globalStore.ts     # Global UI state
    ├── types/index.ts            # Shared TypeScript types
    └── utils/                    # auth, cn, date, format, helpers
```

---

## Luồng hoạt động chính

### 1. Xác thực (Auth)

```
Login → POST /auth/login → { accessToken, refreshToken, user }
     → api.ts lưu token in-memory (setToken)
     → authStore persist user vào localStorage
     → redirect → /dashboard
```

### 2. Quản lý dự án (Projects)

```
/projects             → Danh sách dự án (grid/list, search, pagination, favorites)
/projects/[id]        → Chi tiết dự án: tổng quan, sites, SCADA dashboards
                       → Tạo / sửa / xóa SCADA dashboard ngay trong trang này
```

### 3. SCADA Dashboard

```
/projects/[id]        → Xem danh sách SCADA của dự án, tạo mới
/scada/[id]           → Mở SCADA Editor
                       → Canvas (Konva): vẽ widget, kéo thả, zoom, pan
                       → Widget Palette: thêm widget theo loại
                       → Properties Panel: cấu hình widget
                       → Runtime mode: chạy dashboard thời gian thực
```

**Quan hệ:** Một dự án (Project) có nhiều SCADA Dashboards.

---

## API Pattern

### Request
```typescript
apiClient.get<T>(url)    // GET + Authorization: Bearer <token>
apiClient.post<T>(url, body)
apiClient.put<T>(url, body)
apiClient.delete(url)
```

### Response (auto-unwrap)
Backend trả về:
```json
{ "success": true, "data": { ... }, "timestamp": "..." }
```
Frontend `api.ts` tự động unwrap → chỉ trả về phần `data`.

Với response có pagination:
```json
{ "success": true, "data": [...], "pagination": { "total": 100, "page": 1 } }
```
→ Frontend map thành `{ data, totalElements, totalPages, hasNext }`.

---

## API Endpoints (Backend)

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Projects | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`, `/projects/recent`, `/projects/favorites` |
| SCADA Views | `GET/POST /scada-views`, `GET/PUT/DELETE /scada-views/:id` — filter: `?projectId=`, `?areaId=` |
| Sites | `GET/POST /sites`, `GET/PUT/DELETE /sites/:id` |
| Areas | `GET/POST /areas`, `GET/PUT/DELETE /areas/:id` |
| Devices | `GET/POST /devices`, `GET/PUT/DELETE /devices/:id`, `/devices/:id/telemetry`, `/devices/:id/rpc` |
| Templates | `GET/POST /device-templates`, `GET/PUT/DELETE /device-templates/:id` |
| Widgets | `GET/POST /widgets`, `GET/PUT/DELETE /widgets/:id` |
| Files | `POST /files/upload`, `GET /files`, `GET /files/:id` |

---

## Hướng dẫn chạy

### Yêu cầu
- Node.js 18+
- Backend đang chạy tại `http://localhost:3001`

### Cài đặt & chạy

```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

### Build production

```bash
npm run build
npm start
```

---

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001` | URL Backend API |

Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## Cấu trúc dữ liệu quan trọng

### Project
```typescript
{
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  tenantId: string;
  sites: Site[];
  scadaViews: ScadaView[];    // Một dự án có nhiều SCADA
}
```

### ScadaDashboard (Frontend type)
```typescript
{
  id: string;
  name: string;
  description?: string;
  projectId: string;          // Liên kết trực tiếp đến dự án
  canvasSize: { width, height };
  widgets: Widget[];          // button, gauge, chart, text, image, shape, container
  layers: ScadaLayer[];
  variables: ScadaVariable[];
  scripts: ScadaScript[];
  settings: { grid, zoom, runtime, security };
}
```

---

## Tính năng SCADA

| Tính năng | Trạng thái |
|---|---|
| Tạo / sửa / xóa SCADA dashboard trong dự án | ✅ Hoàn thành |
| SCADA Editor (Konva canvas) | ✅ Cơ bản |
| Widget Palette (thêm widget) | ✅ Hoàn thành |
| Widget types: button, gauge, text, shape, container | ✅ Render cơ bản |
| Widget types: chart, image, video, map, alarm | 🔄 Placeholder |
| Properties Panel | 🔄 Cơ bản (visibility/lock) |
| Data Binding (kết nối thiết bị) | ❌ Chưa có UI |
| Runtime mode (chạy thời gian thực) | 🔄 Scaffold |
| Undo/Redo | 🔄 Structure có, logic TODO |
| Export/Import dashboard | ❌ Chưa có UI |
| Templates browser | ❌ Chưa có UI |

---

## Ghi chú phát triển

1. **Feature-based architecture:** Mỗi feature (`auth`, `projects`, `scada`, `devices`) tự chứa components, services, stores, types riêng.
2. **Zustand pattern:** Sử dụng middleware `devtools` + `persist` + `subscribeWithSelector` + `immer` cho state management.
3. **API auto-unwrap:** `shared/services/api.ts` tự động unwrap response wrapper từ backend, FE nhận trực tiếp data.
4. **SSR safety:** SCADA canvas dùng `ScadaCanvasWrapper` (dynamic import) để tránh lỗi SSR với Konva.
5. **exactOptionalPropertyTypes:** tsconfig bật strict, các optional props cần `| undefined`.
