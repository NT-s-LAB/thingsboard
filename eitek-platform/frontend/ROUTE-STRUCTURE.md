# EITEK Platform Route Structure

## Route Hierarchy

```
/                               # Home (redirect to /dashboard)
├── /login                      # Login page
├── /register                   # Register page (if enabled)
└── /dashboard/                 # Protected routes
    ├── /                       # Dashboard home
    ├── /projects/              # Projects management
    │   ├── /                   # Projects list
    │   ├── /new                # Create project
    │   └── /[id]/              # Project detail
    │       ├── /               # Project overview
    │       ├── /edit           # Edit project
    │       └── /sites/         # Sites in project
    │           ├── /           # Sites list
    │           ├── /new        # Create site
    │           └── /[siteId]/  # Site detail
    │               ├── /       # Site overview
    │               ├── /edit   # Edit site
    │               └── /areas/ # Areas in site
    │                   ├── /   # Areas list
    │                   ├── /new # Create area
    │                   └── /[areaId]/ # Area detail
    │                       ├── /         # Area overview
    │                       ├── /edit     # Edit area
    │                       ├── /devices/ # Devices in area
    │                       │   ├── /     # Devices list
    │                       │   ├── /new  # Add device
    │                       │   └── /[deviceId]/ # Device detail
    │                       │       ├── /     # Device overview
    │                       │       ├── /edit # Edit device
    │                       │       └── /ui   # Device UI renderer
    │                       └── /scada/   # SCADA views for area
    │                           ├── /     # SCADA views list
    │                           ├── /new  # Create SCADA view
    │                           └── /[viewId]/ # SCADA view
    │                               ├── /     # View SCADA
    │                               └── /edit # Edit SCADA
    ├── /templates/             # Template management
    │   ├── /                   # Templates home
    │   ├── /devices/           # Device templates
    │   ├── /widgets/           # Widget templates
    │   └── /symbols/           # Symbol library
    ├── /settings/              # Settings
    │   ├── /                   # Settings home
    │   ├── /profile/           # User profile
    │   ├── /users/             # User management
    │   ├── /roles/             # Role management
    │   └── /system/            # System settings
    └── /reports/               # Reports & analytics
        ├── /                   # Reports home
        ├── /devices/           # Device reports
        ├── /telemetry/         # Telemetry reports
        └── /alarms/            # Alarm reports
```

## Route Groups & Layouts

### Auth Group: `(auth)`
- **Layout**: Centered form layout, no sidebar
- **Routes**: `/login`, `/register`
- **Features**: Authentication forms, public access

### Dashboard Group: `(dashboard)`
- **Layout**: Header + sidebar + main content
- **Routes**: All protected routes under `/dashboard`
- **Features**: Navigation, user menu, notifications

## Route Parameters

### Dynamic Segments
- `[id]` - Project ID
- `[siteId]` - Site ID  
- `[areaId]` - Area ID
- `[deviceId]` - Device ID
- `[viewId]` - SCADA View ID

### Optional Segments
- `[[...slug]]` - Catch-all for flexible routing

## Route Guards

### Authentication
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

### Permission-based Guards
```typescript
// components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

## Route Metadata

### Page Titles
```typescript
// Dynamic page titles based on route
export const generatePageTitle = (
  route: string, 
  params: Record<string, string>
) => {
  const titleMap = {
    '/dashboard': 'Dashboard',
    '/dashboard/projects': 'Projects',
    '/dashboard/projects/[id]': `Project: ${params.projectName}`,
    '/dashboard/projects/[id]/sites/[siteId]': `Site: ${params.siteName}`,
    // etc...
  };
  
  return titleMap[route] || 'EITEK Platform';
};
```

### Breadcrumbs
```typescript
// Auto-generate breadcrumbs from route structure
export const generateBreadcrumbs = (pathname: string, params: any) => {
  const segments = pathname.split('/').filter(Boolean);
  
  return segments.map((segment, index) => ({
    label: getBreadcrumbLabel(segment, params),
    href: '/' + segments.slice(0, index + 1).join('/'),
  }));
};
```

## Route Performance

### Code Splitting
```typescript
// Lazy load heavy components
const ScadaEditor = lazy(() => import('@/features/scada/components/ScadaEditor'));
const DeviceUI = lazy(() => import('@/features/devices/components/DeviceUI'));

// Route-based code splitting automatic in Next.js App Router
```

### Prefetching
```typescript
// Prefetch critical routes
<Link href="/dashboard/projects/123" prefetch={true}>
  Project Details
</Link>
```