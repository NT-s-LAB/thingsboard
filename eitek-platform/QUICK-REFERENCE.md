# EITEK Platform - Quick Reference

## 📋 Tóm Tắt Nhanh

### Mục tiêu
- Xây dựng nền tảng IoT riêng tích hợp ThingsBoard
- ThingsBoard = IoT Core, EITEK = Business Logic + UI
- Không sửa code ThingsBoard, chỉ gọi API

### Tech Stack
- **Backend**: NestJS + PostgreSQL + Prisma
- **Frontend**: Next.js + TypeScript + Tailwind
- **Auth**: JWT độc lập (không dùng TB auth)
- **Integration**: ThingsBoard REST API

### Database
- **2 databases riêng biệt**: thingsboard + eitek_platform
- **EITEK tables**: tenants, users, projects, sites, areas, devices, scada_views
- **Mapping**: devices.tbDeviceId → ThingsBoard device

### Kiến trúc
```
Frontend (Next.js) 
    ↕ HTTP/WebSocket
EITEK Backend (NestJS)
    ↕ REST API  
ThingsBoard (IoT Core)
    ↕ MQTT/HTTP
IoT Devices
```

### Setup Commands
```bash
# Database
.\setup-eitek-database.bat

# Backend
cd backend
npm install
npm run start:dev

# Frontend  
cd frontend
npm install
npm run dev
```

### Login
```
Email: admin@eitek.com
Password: admin123
```

### Key Features
- Multi-tenant: tenant → project → site → area → device
- Device UI: Custom templates per device type
- SCADA: Drag-drop widgets + real-time data
- Widget System: Charts, gauges, controls
- Permissions: Granular RBAC với business context

### Files Generated
- ✅ Backend skeleton (NestJS modules)
- ✅ Frontend skeleton (Next.js structure)  
- ✅ Database schema (Prisma)
- ✅ Setup scripts (PowerShell/Batch)
- ✅ Seed data (admin user, roles, sample project)

### Implementation Status
- [x] Architecture design
- [x] Database schema  
- [x] Code skeleton
- [x] Setup scripts
- [ ] Auth implementation
- [ ] Device management
- [ ] SCADA editor
- [ ] Widget system