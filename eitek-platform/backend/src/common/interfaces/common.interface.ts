export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

export interface RequestUser {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
  isDeleted: boolean;
}