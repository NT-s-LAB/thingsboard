# EITEK Platform - Cuộc Trò Chuyện Thiết Kế

**Ngày**: March 7, 2026  
**Chủ đề**: Thiết kế nền tảng IoT riêng tích hợp ThingsBoard

---

## Câu Hỏi Ban Đầu

**User**: Tôi muốn xây dựng một nền tảng IoT riêng, có backend và frontend riêng, hoạt động độc lập với ThingsBoard UI.

**Yêu cầu**:
1. Quản lý người dùng, phân quyền, tenant/project/site/area/device
2. Quản lý thiết bị thông qua API của ThingsBoard
3. Không sửa code gốc ThingsBoard
4. ThingsBoard chỉ đóng vai trò IoT Core
5. Device UI: giao diện riêng cho từng loại thiết bị
6. SCADA UI: màn hình tổng hợp nhiều thiết bị theo khu vực
7. Kéo thả widget/icon trên canvas
8. Chạy trên desktop và mobile

---

## Phân Tích & Thiết Kế

### 1. Kiến Trúc Tổng Thể
- **EITEK Platform**: Chủ sở hữu toàn bộ business logic, UI, UX
- **ThingsBoard**: Chỉ đóng vai trò infrastructure IoT Core
- **Không có coupling trực tiếp** giữa EITEK Frontend và ThingsBoard
- **Single source of truth**: EITEK Database cho business data

### 2. Backend Architecture (NestJS)
**Modules**:
- auth, users, roles, tenants
- projects, sites, areas, devices  
- device-templates, scada-views, widgets
- thingsboard-integration (isolated)
- realtime, files

**Responsibilities**:
- EITEK Backend sở hữu business logic
- Integration layer cô lập với ThingsBoard
- JWT authentication riêng (không dùng TB auth)

### 3. Frontend Architecture (Next.js)
**Structure**:
- Feature-based organization
- Device UI renderer
- SCADA editor với drag-drop
- Widget system
- Real-time WebSocket

### 4. Database Design
**Hai databases riêng biệt**:
- ThingsBoard DB: tb_device, tb_telemetry, etc.
- EITEK Platform DB: tenants, users, projects, devices (+ tbDeviceId mapping)

**Entity Relationship**:
```
Tenants → Users → Projects → Sites → Areas → Devices
                                              ↓
                                        DeviceStates (cached)
                                              ↓  
                                        ScadaViews → Widgets
```

---

## Câu Hỏi Tiếp Theo

### Authentication System

**User**: Hiện tại login là sử dụng auth của thingsboard hay là nền tảng riêng?

**Trả lời**: **Nền tảng riêng của EITEK Platform**, không sử dụng auth của ThingsBoard.

**Lý do**:
1. Business Independence: EITEK có logic nghiệp vụ riêng
2. User Management: Quản lý user, role theo yêu cầu riêng  
3. Multi-tenant: Hỗ trợ nhiều tổ chức
4. Security Control: Kiểm soát hoàn toàn quyền truy cập
5. Scalability: Dễ mở rộng và customize

**Flow**:
```
User → EITEK Frontend → EITEK Backend (JWT)
EITEK Backend → ThingsBoard (system credentials)
```

### Device Management & Permissions

**User**: Các chức năng quản lý thiết bị, phân quyền có giống thingsboard không?

**Trả lời**: **Khác biệt đáng kể** - EITEK Platform có hệ thống phức tạp và linh hoạt hơn.

**So sánh**:

| Aspect | ThingsBoard | EITEK Platform |
|--------|-------------|----------------|
| **Hierarchy** | Tenant→Customer→Device | Tenant→Project→Site→Area→Device |
| **Permissions** | 3 basic roles | 20+ granular permissions |
| **Business Context** | Generic IoT | Industrial/Enterprise |
| **SCADA** | Basic dashboards | Advanced editor + runtime |
| **Device UI** | Generic | Custom templates |

**EITEK Permissions Example**:
- project.create, site.manage, device.control
- scada.edit, widget.create, user.manage
- Context-aware: project, site, area level restrictions

### Database Setup

**User**: Vậy tôi phải tạo 1 database riêng có đúng không? Rồi cấu hình database đó.

**Trả lời**: **Đúng vậy!** EITEK Platform cần database riêng hoàn toàn.

**Setup**:
1. Database riêng: `eitek_platform` (cùng PostgreSQL instance)
2. Environment configuration
3. Prisma schema với full business model
4. Seed data với admin user, roles, sample data

**Generated Files**:
- setup-eitek-database.bat
- backend/.env.example  
- prisma/schema.prisma
- prisma/seed.ts

**Default Login**:
```
Email: admin@eitek.com
Password: admin123
```

---

## Files Được Tạo

### Backend Structure
```
eitek-platform/backend/
├── package.json (NestJS + Prisma)
├── .env.example (DB config)
├── prisma/
│   ├── schema.prisma (Full business model)
│   └── seed.ts (Initial data)
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/ (app, database, thingsboard)
│   ├── database/ (Prisma service)
│   ├── common/ (shared utilities)
│   └── modules/
│       ├── devices/ (controller, service, dto)
│       └── thingsboard-integration/
```

### Frontend Structure  
```
eitek-platform/frontend/
├── package.json (Next.js + TypeScript)
├── next.config.js
├── tailwind.config.js  
└── src/
    ├── app/ (Next.js app router)
    └── shared/ (components, services, types)
```

### Database Scripts
```
eitek-platform/
├── setup-database.ps1
├── setup-eitek-database.bat  
├── verify-databases.js
└── README.md (full documentation)
```

---

## Code Conventions Đã Định

### Naming
- **Backend**: kebab-case files, PascalCase classes
- **Frontend**: PascalCase components, camelCase hooks
- **Database**: snake_case tables

### Structure
- **Modular architecture** với clear responsibilities
- **Feature-based** organization cho frontend  
- **Isolation** cho ThingsBoard integration
- **Consistent** error handling và response format

### Standards
- TypeScript strict mode
- Prisma for type-safe DB access
- JWT authentication
- RESTful API design
- WebSocket for real-time

---

## Tóm Tắt Cuối

**Kết quả đạt được**:
✅ Architecture design hoàn chỉnh  
✅ Database schema với business model  
✅ Backend skeleton (NestJS modules)  
✅ Frontend skeleton (Next.js structure)  
✅ Setup scripts tự động  
✅ Code conventions và standards  
✅ Documentation đầy đủ

**Next steps**:
1. Chạy setup scripts
2. Implement auth module  
3. Develop device management
4. Build SCADA editor
5. Create widget system

**Files quan trọng**:
- `README.md`: Full documentation
- `QUICK-REFERENCE.md`: Tóm tắt nhanh
- `setup-eitek-database.bat`: Setup script
- `backend/prisma/schema.prisma`: Database model
- `backend/src/`: Code skeleton

---

**Kết luận**: Thiết kế hoàn chỉnh một nền tảng IoT enterprise-grade với kiến trúc modular, tách biệt rõ ràng với ThingsBoard nhưng tận dụng tối đa IoT capabilities của TB.