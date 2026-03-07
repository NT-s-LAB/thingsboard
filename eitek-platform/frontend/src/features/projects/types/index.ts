// Project Hierarchy Types for EITEK Platform
export type ProjectStatus = 'Active' | 'Inactive' | 'Archived' | 'Maintenance';

export type ProjectType = 'Industrial' | 'Building' | 'Infrastructure' | 'Energy' | 'Custom';

export interface ProjectSettings {
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
  unitSystem: 'metric' | 'imperial';
  
  // Access control
  isPublic: boolean;
  allowGuests: boolean;
  requireApproval: boolean;
  
  // Features
  enableRealtime: boolean;
  enableAlarms: boolean;
  enableReports: boolean;
  enableBackup: boolean;
  enableVersionControl: boolean;
  
  // Limits
  maxDevices: number;
  maxUsers: number;
  maxDashboards: number;
  dataRetentionDays: number;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  webhookUrl?: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  permissions: string[];
  joinedDate: string;
  lastActivity?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  
  // Hierarchy
  parentId?: string;
  level: number;
  path: string;
  children?: Project[];
  
  // Settings and configuration
  settings: ProjectSettings;
  
  // Members and permissions
  ownerId: string;
  members: ProjectMember[];
  
  // Resources
  deviceCount: number;
  dashboardCount: number;
  templateCount: number;
  
  // Statistics
  stats: {
    totalDevices: number;
    onlineDevices: number;
    totalAlarms: number;
    activeAlarms: number;
    totalDataPoints: number;
    lastDataUpdate?: string;
    averageResponseTime?: number;
    uptimePercentage?: number;
  };
  
  // File attachments
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
    uploadedDate: string;
    url: string;
  }>;
  
  // Tags and metadata
  tags: string[];
  metadata: Record<string, any>;
  
  // Version control
  version: string;
  
  // Audit
  createdTime: string;
  updatedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: ProjectType;
  thumbnail?: string;
  
  // Template content
  structure: {
    projects: Omit<Project, 'id' | 'createdTime' | 'updatedTime' | 'createdBy' | 'lastModifiedBy'>[];
    devices?: any[];
    dashboards?: any[];
    variables?: any[];
    scripts?: any[];
  };
  
  // Configuration
  defaultSettings: Partial<ProjectSettings>;
  requiredPermissions: string[];
  
  // Metadata
  metadata: {
    author: string;
    version: string;
    tags: string[];
    compatibility: string[];
    documentation?: string;
    changeLog?: Array<{
      version: string;
      date: string;
      changes: string[];
    }>;
  };
  
  // Usage statistics
  usageCount: number;
  rating?: number;
  reviews?: Array<{
    userId: string;
    userName: string;
    rating: number;
    comment?: string;
    date: string;
  }>;
  
  createdTime: string;
  updatedTime: string;
  createdBy: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: ProjectMember['role'];
  permissions: string[];
  message?: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  expiresAt: string;
  createdTime: string;
  respondedTime?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  type: 'create' | 'update' | 'delete' | 'join' | 'leave' | 'invite' | 'device_add' | 'device_remove' | 'dashboard_create' | 'alarm_trigger' | 'custom';
  action: string;
  details: {
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    changes?: Record<string, { old?: any; new?: any }>;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProjectBackup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'manual' | 'scheduled' | 'automatic';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  // Backup content
  includes: {
    projectSettings: boolean;
    devices: boolean;
    dashboards: boolean;
    users: boolean;
    data: boolean;
    files: boolean;
  };
  
  // Progress and results
  progress?: {
    total: number;
    completed: number;
    current: string;
  };
  
  size?: number;
  downloadUrl?: string;
  
  // Retention
  retentionDays: number;
  expiresAt: string;
  
  // Metadata
  error?: string;
  createdTime: string;
  completedTime?: string;
  createdBy: string;
}

// Tree view and navigation types
export interface ProjectTreeNode {
  id: string;
  name: string;
  type: 'project' | 'folder';
  level: number;
  parentId?: string;
  children: ProjectTreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
  project?: Project;
  
  // UI state
  isSelected: boolean;
  isDragging: boolean;
  canDrop: boolean;
}

export interface ProjectFilters {
  search: string;
  types: ProjectType[];
  statuses: ProjectStatus[];
  tags: string[];
  ownedByMe: boolean;
  memberOfMe: boolean;
  createdDateFrom?: string;
  createdDateTo?: string;
}

export interface ProjectSort {
  field: keyof Project;
  direction: 'asc' | 'desc';
}

// API request/response types
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  type: ProjectType;
  parentId?: string;
  templateId?: string;
  settings?: Partial<ProjectSettings>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ProjectUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  settings?: Partial<ProjectSettings>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ProjectListParams {
  parentId?: string;
  search?: string;
  types?: ProjectType[];
  statuses?: ProjectStatus[];
  tags?: string[];
  ownedByMe?: boolean;
  memberOfMe?: boolean;
  includeChildren?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectListResponse {
  data: Project[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  tree?: ProjectTreeNode[];
}

export interface ProjectMemberUpdateRequest {
  projectId: string;
  userId: string;
  role: ProjectMember['role'];
  permissions: string[];
}

export interface ProjectInviteRequest {
  projectId: string;
  emails: string[];
  role: ProjectMember['role'];
  permissions: string[];
  message?: string;
  expiresIn?: number; // hours
}

export interface ProjectMoveRequest {
  projectId: string;
  newParentId?: string;
  position?: number;
}

export interface ProjectCloneRequest {
  projectId: string;
  name: string;
  parentId?: string;
  includeDevices?: boolean;
  includeDashboards?: boolean;
  includeMembers?: boolean;
  includeData?: boolean;
}

export interface ProjectExportRequest {
  projectId: string;
  format: 'json' | 'zip' | 'sql';
  includes: {
    settings: boolean;
    devices: boolean;
    dashboards: boolean;
    users: boolean;
    data: boolean;
    files: boolean;
  };
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ProjectImportRequest {
  parentId?: string;
  file: File;
  options: {
    mergeExisting: boolean;
    updateExisting: boolean;
    preserveIds: boolean;
    createBackup: boolean;
  };
}

export interface ProjectStatsRequest {
  projectId: string;
  timeRange: {
    from: string;
    to: string;
  };
  metrics: string[];
  aggregation: 'hour' | 'day' | 'week' | 'month';
}

export interface ProjectStatsResponse {
  projectId: string;
  timeRange: {
    from: string;
    to: string;
  };
  data: Array<{
    timestamp: string;
    metrics: Record<string, number>;
  }>;
  summary: {
    totalDataPoints: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// Project Node for hierarchical display
export interface ProjectNode extends Omit<Project, 'type' | 'children'> {
  type: 'project' | 'folder';
  parentId?: string;
  children?: ProjectNode[];
  depth?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
}