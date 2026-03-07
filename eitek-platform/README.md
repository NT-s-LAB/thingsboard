# 🏭 EITEK IoT Platform - Thiết Kế Kiến Trúc Hệ Thống

> **Tài liệu thiết kế**: Nền tảng IoT riêng tích hợp với ThingsBoard  
> **Ngày tạo**: March 7, 2026  
> **Phiên bản**: 1.0.0

---

## 📋 Mục Lục

1. [Tổng Quan Hệ Thống](#tổng-quan-hệ-thống)
2. [Kiến Trúc Tổng Thể](#kiến-trúc-tổng-thể)
3. [Kiến Trúc Backend](#kiến-trúc-backend)
4. [Kiến Trúc Frontend](#kiến-trúc-frontend)
5. [Thiết Kế Database](#thiết-kế-database)
6. [Integration ThingsBoard](#integration-thingsboard)
7. [Workflow Chính](#workflow-chính)
8. [Cấu Trúc Code](#cấu-trúc-code)
9. [Database Setup](#database-setup)
10. [Code Conventions](#code-conventions)

---

## 🎯 Tổng Quan Hệ Thống

### **Mục Tiêu**
Xây dựng nền tảng IoT riêng có backend và frontend độc lập, hoạt động tách biệt với ThingsBoard UI nhưng tận dụng ThingsBoard làm IoT Core.

### **Nguyên Tắc Thiết Kế**
- ✅ Không sửa code gốc ThingsBoard
- ✅ Không fork, patch hay customize ThingsBoard
- ✅ ThingsBoard chỉ đóng vai trò IoT Core
- ✅ Frontend không gọi trực tiếp ThingsBoard
- ✅ Tách rõ domain nghiệp vụ riêng

### **Chức Năng Chính**
1. **Quản lý tổ chức**: User, Role, Tenant, Project, Site, Area, Device
2. **Device UI**: Giao diện riêng cho từng loại thiết bị
3. **SCADA UI**: Màn hình tổng hợp theo khu vực
4. **Widget System**: Kéo thả widget, gán với device/telemetry/RPC
5. **Layout Builder**: Canvas editor với drag & drop
6. **Realtime**: WebSocket cho monitoring và control

---

## 🏗️ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    EITEK IoT Platform                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Mobile Apps   │   Web Frontend  │    Desktop Apps         │
│   (Future)      │   (Next.js)     │    (Electron/Future)    │
└─────────────────┴─────────────────┴─────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                EITEK Backend API                            │
│              (NestJS + PostgreSQL)                          │
├─────────────────────────────────────────────────────────────┤
│  Auth │ User Mgmt │ Device UI │ SCADA │ Widget │ Realtime   │
└─────────────────────────────────────────────────────────────┘
                          │ REST API Only
┌─────────────────────────────────────────────────────────────┐
│                 ThingsBoard IoT Core                        │
│              (Device + Telemetry + RPC)                     │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                    IoT Devices                              │
│            (MQTT/HTTP/CoAP/LwM2M)                          │
└─────────────────────────────────────────────────────────────┘
```

### **Tech Stack**
- **Backend**: NestJS + PostgreSQL + Prisma
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Auth**: JWT + Refresh Token
- **Realtime**: WebSocket (Socket.io)
- **Cache**: Redis (optional)
- **Integration**: ThingsBoard REST API

---

## ⚙️ Kiến Trúc Backend

### **Module Organization**
| Module | Trách Nhiệm |
|--------|-------------|
| `auth` | Authentication, JWT, Authorization |
| `users` | User management, profiles |
| `tenants` | Multi-tenant organization |
| `projects` | Project management |
| `sites` | Site management per project |
| `areas` | Area management per site |
| `devices` | Device management & TB mapping |
| `device-templates` | Device UI templates |
| `scada-views` | SCADA screen management |
| `widgets` | Widget library & runtime |
| `thingsboard-integration` | TB API client (isolated) |
| `realtime` | WebSocket gateway |

### **Cấu Trúc Thư Mục Backend**
```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── dto/
│   │   │   └── decorators/
│   │   ├── devices/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   └── repositories/
│   │   ├── thingsboard-integration/
│   │   │   ├── services/
│   │   │   ├── interfaces/
│   │   │   ├── mappers/
│   │   │   └── dto/
│   │   └── [other-modules]/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── interfaces/
│   ├── config/
│   └── database/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seeds/
│       └── database.module.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
└── .env.example
```

---

## 🖥️ Kiến Trúc Frontend

### **Feature-Based Structure**
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── devices/
│   │   │   ├── scada/
│   │   │   └── projects/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── stores/
│   │   ├── devices/
│   │   │   ├── components/
│   │   │   │   └── DeviceUI/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── scada/
│   │   │   ├── components/
│   │   │   │   ├── ScadaEditor/
│   │   │   │   └── ScadaViewer/
│   │   │   ├── hooks/
│   │   │   └── stores/
│   │   └── widgets/
│   │       ├── components/
│   │       │   └── WidgetRenderer/
│   │       └── stores/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── layout/
│   │   ├── services/
│   │   │   ├── api/
│   │   │   └── websocket/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   └── lib/
├── public/
├── package.json
└── next.config.js
```

---

## 🗄️ Thiết Kế Database

### **Cấu Trúc Database**
```
┌─────────────────────┐    ┌─────────────────────┐
│   ThingsBoard DB    │    │   EITEK Platform    │
│   (Existing)        │    │   Database (New)    │
├─────────────────────┤    ├─────────────────────┤
│ • tb_device         │    │ • tenants           │
│ • tb_telemetry      │    │ • users             │
│ • tb_attribute      │    │ • projects          │
│ • tb_alarm          │    │ • sites             │
│ • etc...            │    │ • areas             │
│                     │    │ • devices           │
│ (Port: 5432)        │    │ • scada_views       │
│ (DB: thingsboard)   │    │ • widgets           │
└─────────────────────┘    │ • symbols           │
                           │                     │
                           │ (Port: 5432)        │
                           │ (DB: eitek_platform)│
                           └─────────────────────┘
```

### **Entity Relationship**
```
Tenants
└── Users (Auth + Roles)
    └── Projects
        └── Sites
            └── Areas
                └── Devices (+ tbDeviceId mapping)
                    ├── DeviceStates (cached data)
                    └── DeviceTemplates (UI)
                └── ScadaViews
                    └── ScadaWidgets
                        └── Widgets
                            └── Symbols
```

### **Key Tables**
- **tenants**: Multi-tenant organization
- **users, roles, user_roles**: Authentication & RBAC
- **projects, sites, areas**: Organizational hierarchy
- **devices**: Device registry với tbDeviceId mapping
- **device_states**: Cached telemetry data từ ThingsBoard
- **scada_views, scada_widgets**: SCADA system
- **widgets, symbols**: Widget library

---

## 🔗 Integration ThingsBoard

### **Integration Strategy**
```
┌─────────────────────────────────────────────────────────┐
│              EITEK Backend Services                      │
├─────────────────────────────────────────────────────────┤
│  Device Service │ Telemetry Svc │ RPC Service │ etc     │
└─────────────────┴───────┬───────┴─────────────┴─────────┘
                          │
┌─────────────────────────▽───────────────────────────────┐
│           ThingsBoard Integration Layer                  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │Device API   │ │Telemetry API│ │   RPC API           │ │
│ │Service      │ │Service      │ │   Service           │ │
│ └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ HTTP REST API
┌─────────────────────────▽───────────────────────────────┐
│                 ThingsBoard Server                       │
│              (Không sửa code gốc)                       │
└─────────────────────────────────────────────────────────┘
```

### **API Mapping**
- **Device Creation**: EITEK creates → calls TB API → stores tbDeviceId
- **Telemetry**: TB pushes → EITEK transforms → Frontend
- **RPC**: Frontend → EITEK validates → TB executes → Device
- **Authentication**: EITEK sử dụng system credentials với TB

---

## 🔄 Workflow Chính

### **1. Create Device**
```
User → Frontend → EITEK API → Validate → TB API → Store mapping → Response
```

### **2. Real-time Monitoring**
```
Device → TB → EITEK WebSocket → Frontend → Update UI
```

### **3. Device Control**
```
User → SCADA → EITEK API → Validate → TB RPC → Device
```

### **4. SCADA Editor**
```
User → Drag Widget → Bind Device → Save Layout → Real-time Data
```

---

## 📁 Cấu Trúc Code Generated

### **Files Created**

#### **Backend Structure**
```
eitek-platform/backend/
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── thingsboard.config.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── dto/pagination.dto.ts
│   │   └── interfaces/common.interface.ts
│   └── modules/
│       ├── devices/
│       │   ├── devices.module.ts
│       │   ├── controllers/devices.controller.ts
│       │   ├── services/devices.service.ts
│       │   └── dto/create-device.dto.ts
│       └── thingsboard-integration/
│           ├── thingsboard-integration.module.ts
│           └── interfaces/thingsboard-api.interface.ts
```

#### **Frontend Structure**
```
eitek-platform/frontend/
├── package.json
├── next.config.js
├── tailwind.config.js
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── providers.tsx
    │   └── globals.css
    └── shared/
        ├── services/api/
        │   ├── apiClient.ts
        │   └── endpoints.ts
        └── types/index.ts
```

#### **Database Setup Scripts**
```
eitek-platform/
├── setup-database.ps1
├── setup-eitek-database.bat
└── verify-databases.js
```

---

## 💾 Database Setup

### **Quick Setup**
```bash
# Chạy script tự động
.\setup-eitek-database.bat

# Hoặc manual setup
psql -U postgres -c "CREATE DATABASE eitek_platform;"
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

### **Database Configuration**
```env
DATABASE_URL="postgresql://postgres:01041998@@localhost:5432/eitek_platform"
THINGSBOARD_URL="http://localhost:9090"
THINGSBOARD_USERNAME="sysadmin@thingsboard.org"
THINGSBOARD_PASSWORD="sysadmin"
```

### **Default Credentials**
```
Email: admin@eitek.com
Password: admin123
Role: System Administrator
```

---

## 📏 Code Conventions

### **Naming Rules**
- **Backend Files**: kebab-case (users.controller.ts)
- **Frontend Files**: PascalCase for components (DeviceList.tsx)
- **Classes**: PascalCase (DevicesService)
- **Methods**: camelCase (findAll, createDevice)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS)

### **Import Organization**
```typescript
// 1. Node modules
import { Injectable } from '@nestjs/common';

// 2. Internal modules (absolute paths)
import { PrismaService } from '../../../database/prisma.service';

// 3. Relative imports
import { DeviceDto } from './dto/device.dto';
```

### **Error Handling**
```typescript
// Backend - NestJS exceptions
throw new NotFoundException('Device not found');
throw new BadRequestException('Invalid data');

// Frontend - React Query
const { data, error } = useQuery({
  queryKey: ['devices'],
  queryFn: () => devicesApi.getAll(),
});
```

### **Response Format**
```typescript
// Consistent API response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  timestamp: string;
}
```

---

## 🚀 Next Steps

### **Implementation Priority**
1. ✅ **Database Setup** - Complete
2. 🔄 **Auth Module** - In Progress
3. ⏳ **Device Management** - Next
4. ⏳ **SCADA Editor** - Future
5. ⏳ **Widget System** - Future

### **Development Commands**
```bash
# Backend Development
cd backend
npm run start:dev

# Frontend Development  
cd frontend
npm run dev

# Database Management
npx prisma studio
npx prisma db reset
```

---

## 📞 Support & Documentation

### **Key Design Decisions**
- **Separation of Concerns**: ThingsBoard = IoT Core, EITEK = Business Logic
- **No Direct Coupling**: Frontend never calls ThingsBoard directly
- **Rich Authorization**: Granular RBAC với context-aware permissions
- **Modular Architecture**: Easy to maintain và scale

### **Benefits**
- ✅ Full control over UX/UI
- ✅ Business-specific features
- ✅ Scalable architecture
- ✅ Easy integration với enterprise systems
- ✅ Không bị lock-in với ThingsBoard

### **File Locations**
- **Main Documentation**: `README.md` (this file)
- **Backend Code**: `eitek-platform/backend/`
- **Frontend Code**: `eitek-platform/frontend/`
- **Database Scripts**: `eitek-platform/*.bat`, `*.ps1`
- **Schema Definition**: `backend/prisma/schema.prisma`

---

**📅 Created**: March 7, 2026  
**👨‍💻 Architect**: AI Assistant  
**🏢 Project**: EITEK IoT Platform  
**📋 Version**: 1.0.0