export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'loan' | 'document' | 'payment' | 'staff' | 'system';
  userId?: string;
  userRole?: 'ADMIN' | 'EMPLOYEE';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    entityId?: string;
    entityType?: string;
    actionType?: string;
    [key: string]: any;
  };
}

export interface NotificationCreate {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'loan' | 'document' | 'payment' | 'staff' | 'system';
  userId?: string;
  userRole?: 'ADMIN' | 'EMPLOYEE';
  metadata?: {
    entityId?: string;
    entityType?: string;
    actionType?: string;
    [key: string]: any;
  };
}

export interface NotificationFilter {
  userId?: string;
  userRole?: 'ADMIN' | 'EMPLOYEE';
  category?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
