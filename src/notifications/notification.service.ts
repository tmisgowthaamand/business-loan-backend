import { Injectable, Logger } from '@nestjs/common';
import { Notification, NotificationCreate, NotificationFilter } from './notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private notifications: Notification[] = [];
  private notificationListeners: Map<string, (notification: Notification) => void> = new Map();

  constructor() {
    // Initialize with some sample notifications for demo
    this.initializeSampleNotifications();
  }

  private initializeSampleNotifications() {
    const sampleNotifications: NotificationCreate[] = [
      {
        title: 'New loan application',
        message: 'Rajesh Enterprises submitted documents',
        type: 'info',
        category: 'loan',
        userRole: 'ADMIN',
        metadata: {
          entityId: 'loan-001',
          entityType: 'enquiry',
          actionType: 'created'
        }
      },
      {
        title: 'Document verified',
        message: 'GST certificate approved for TechSoft',
        type: 'success',
        category: 'document',
        userRole: 'ADMIN',
        metadata: {
          entityId: 'doc-001',
          entityType: 'document',
          actionType: 'verified'
        }
      },
      {
        title: 'Payment Gateway update',
        message: 'Application status changed to approved',
        type: 'success',
        category: 'payment',
        userRole: 'ADMIN',
        metadata: {
          entityId: 'payment-001',
          entityType: 'payment',
          actionType: 'approved'
        }
      }
    ];

    // Create notifications with different timestamps
    const now = new Date();
    sampleNotifications.forEach((notif, index) => {
      const createdAt = new Date(now.getTime() - (index + 1) * 60 * 60 * 1000); // Hours ago
      this.createNotification({
        ...notif,
      }, createdAt);
    });
  }

  async createNotification(data: NotificationCreate, customCreatedAt?: Date): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      ...data,
      isRead: false,
      createdAt: customCreatedAt || new Date(),
      updatedAt: new Date()
    };

    this.notifications.unshift(notification); // Add to beginning for latest first
    
    this.logger.log(`📢 New notification created: ${notification.title}`);
    
    // Notify all listeners
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        this.logger.error('Error notifying listener:', error);
      }
    });

    return notification;
  }

  async getNotifications(filter: NotificationFilter = {}): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    let filtered = [...this.notifications];

    // Apply filters
    if (filter.userId) {
      filtered = filtered.filter(n => n.userId === filter.userId);
    }

    if (filter.userRole) {
      filtered = filtered.filter(n => !n.userRole || n.userRole === filter.userRole);
    }

    if (filter.category) {
      filtered = filtered.filter(n => n.category === filter.category);
    }

    if (filter.isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === filter.isRead);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const unreadCount = filtered.filter(n => !n.isRead).length;

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      notifications: paginated,
      total,
      unreadCount
    };
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date();
      this.logger.log(`📖 Notification marked as read: ${notification.id}`);
    }
    return notification || null;
  }

  async markAllAsRead(userId?: string, userRole?: 'ADMIN' | 'EMPLOYEE'): Promise<number> {
    let count = 0;
    this.notifications.forEach(notification => {
      if (!notification.isRead) {
        const matchesUser = !userId || notification.userId === userId;
        const matchesRole = !userRole || !notification.userRole || notification.userRole === userRole;
        
        if (matchesUser && matchesRole) {
          notification.isRead = true;
          notification.updatedAt = new Date();
          count++;
        }
      }
    });

    this.logger.log(`📖 Marked ${count} notifications as read`);
    return count;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.logger.log(`🗑️ Notification deleted: ${notificationId}`);
      return true;
    }
    return false;
  }

  // Real-time notification methods
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): void {
    this.notificationListeners.set(userId, callback);
    this.logger.log(`🔔 User ${userId} subscribed to notifications`);
  }

  unsubscribeFromNotifications(userId: string): void {
    this.notificationListeners.delete(userId);
    this.logger.log(`🔕 User ${userId} unsubscribed from notifications`);
  }

  // Utility methods for creating specific notification types
  async createLoanNotification(title: string, message: string, loanId: string, type: 'info' | 'success' | 'warning' = 'info'): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type,
      category: 'loan',
      userRole: 'ADMIN',
      metadata: {
        entityId: loanId,
        entityType: 'enquiry',
        actionType: 'updated'
      }
    });
  }

  async createDocumentNotification(title: string, message: string, documentId: string, type: 'info' | 'success' | 'warning' = 'info'): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type,
      category: 'document',
      userRole: 'ADMIN',
      metadata: {
        entityId: documentId,
        entityType: 'document',
        actionType: 'updated'
      }
    });
  }

  async createStaffNotification(title: string, message: string, staffId: string, type: 'info' | 'success' | 'warning' = 'info'): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type,
      category: 'staff',
      userRole: 'ADMIN',
      metadata: {
        entityId: staffId,
        entityType: 'staff',
        actionType: 'updated'
      }
    });
  }

  async createPaymentNotification(title: string, message: string, paymentId: string, type: 'info' | 'success' | 'warning' = 'info'): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type,
      category: 'payment',
      userRole: 'ADMIN',
      metadata: {
        entityId: paymentId,
        entityType: 'payment',
        actionType: 'updated'
      }
    });
  }

  // Auto-generate notifications for common actions
  async notifyEnquiryCreated(enquiryId: string, companyName: string): Promise<Notification> {
    return this.createLoanNotification(
      'New loan application',
      `${companyName} submitted a new loan enquiry`,
      enquiryId,
      'info'
    );
  }

  async notifyDocumentUploaded(documentId: string, fileName: string, companyName: string): Promise<Notification> {
    return this.createDocumentNotification(
      'Document uploaded',
      `${companyName} uploaded ${fileName}`,
      documentId,
      'info'
    );
  }

  async notifyDocumentVerified(documentId: string, fileName: string, companyName: string): Promise<Notification> {
    return this.createDocumentNotification(
      'Document verified',
      `${fileName} approved for ${companyName}`,
      documentId,
      'success'
    );
  }

  async notifyStaffAdded(staffId: string, staffName: string, role: string): Promise<Notification> {
    return this.createStaffNotification(
      'New staff member',
      `${staffName} added as ${role}`,
      staffId,
      'info'
    );
  }

  async notifyPaymentReceived(paymentId: string, amount: number, companyName: string): Promise<Notification> {
    return this.createPaymentNotification(
      'Payment received',
      `₹${amount.toLocaleString()} received from ${companyName}`,
      paymentId,
      'success'
    );
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get time ago string for notifications
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
}
