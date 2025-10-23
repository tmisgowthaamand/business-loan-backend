import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: string;
  userId: number;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

interface User {
  id: number;
  role: string;
}

export interface SystemNotificationData {
  type: 'NEW_ENQUIRY' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'DOCUMENT_DELETED' | 'SHORTLISTED' | 'PAYMENT_APPLIED' | 'STAFF_ADDED' | 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'STATUS_UPDATED' | 'ENQUIRY_ASSIGNED' | 'ENQUIRY_COMPLETED';
  title: string;
  message: string;
  data?: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EnquiryStatusData {
  enquiryId: number;
  clientName: string;
  status: 'NEW' | 'ASSIGNED' | 'DOCUMENTS_PENDING' | 'DOCUMENTS_UPLOADED' | 'DOCUMENTS_VERIFIED' | 'SHORTLISTED' | 'PAYMENT_APPLIED' | 'COMPLETED' | 'REJECTED';
  previousStatus?: string;
  assignedStaff?: string;
  loanAmount?: number;
  businessType?: string;
  mobile?: string;
  updatedBy?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy?: string;
    notes?: string;
  }>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notifications: Notification[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly notificationsFile = path.join(this.dataDir, 'notifications.json');
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly isRender = process.env.RENDER === 'true';
  private readonly isVercel = process.env.VERCEL === '1';
  
  private mockUsers: User[] = [
    { id: 1, role: 'ADMIN' },
    { id: 2, role: 'ADMIN' },
    { id: 3, role: 'EMPLOYEE' },
  ];

  constructor() {
    this.logger.log('🔔 NotificationsService initialized for deployment');
    this.logger.log(`🌐 Environment: ${this.isProduction ? 'Production' : 'Development'}`);
    this.logger.log(`🚀 Platform: ${this.isRender ? 'Render' : this.isVercel ? 'Vercel' : 'Local'}`);
    
    // Ensure data directory exists
    this.ensureDataDirectory();
    
    // Load existing notifications or create samples
    this.loadNotifications();
    
    this.logger.log(`🔔 Loaded ${this.notifications.length} notifications for deployment`);
    
    // Log deployment readiness
    this.logger.log('🔔 Notification system deployment status:');
    this.logger.log(`   - File persistence: ${this.dataDir}`);
    this.logger.log(`   - Mock users: ${this.mockUsers.length}`);
    this.logger.log(`   - Sample notifications: ${this.notifications.length}`);
    this.logger.log('🔔 Ready for staff notification creation!');
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        this.logger.log('📁 Created data directory for notifications persistence');
      }
    } catch (error) {
      this.logger.error('Error creating data directory:', error);
    }
  }

  private loadNotifications() {
    try {
      if (fs.existsSync(this.notificationsFile)) {
        const data = fs.readFileSync(this.notificationsFile, 'utf8');
        this.notifications = JSON.parse(data);
        this.logger.log(`📋 Loaded ${this.notifications.length} notifications from file`);
      } else {
        this.logger.log('📋 No existing notifications file, creating sample notifications');
        this.createSampleNotifications();
        this.saveNotifications();
      }
    } catch (error) {
      this.logger.error('Error loading notifications file, creating sample notifications:', error);
      this.createSampleNotifications();
      this.saveNotifications();
    }
  }

  private saveNotifications() {
    try {
      fs.writeFileSync(this.notificationsFile, JSON.stringify(this.notifications, null, 2));
      this.logger.log(`💾 Saved ${this.notifications.length} notifications to file`);
    } catch (error) {
      this.logger.error('Error saving notifications file:', error);
    }
  }

  private createSampleNotifications() {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    const sampleNotifications = [
      {
        type: 'STATUS_UPDATED',
        title: 'New Enquiry Received',
        message: `📋 New enquiry received from BALAMURUGAN (Manufacturing) for ₹8,00,000 - Status updated on ${currentDate} at ${currentTime}`,
        priority: 'HIGH' as const,
        data: {
          enquiryId: 9570,
          clientName: 'BALAMURUGAN',
          currentStatus: 'NEW',
          loanAmount: 800000,
          businessType: 'Manufacturing',
          mobile: '9876543215',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now()
          },
          statusHistory: [{
            status: 'NEW',
            timestamp: new Date().toISOString(),
            notes: 'Initial enquiry submission'
          }]
        }
      },
      {
        type: 'STATUS_UPDATED',
        title: 'Enquiry Assigned',
        message: `👤 Enquiry assigned to Pankil for Rajesh Kumar (Electronics) for ₹5,00,000 - Status updated from NEW on ${currentDate} at ${currentTime}`,
        priority: 'MEDIUM' as const,
        data: {
          enquiryId: 1001,
          clientName: 'Rajesh Kumar',
          currentStatus: 'ASSIGNED',
          previousStatus: 'NEW',
          assignedStaff: 'Pankil',
          loanAmount: 500000,
          businessType: 'Electronics',
          mobile: '9876543210',
          updatedBy: 'System',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 300000 // 5 minutes ago
          },
          statusHistory: [{
            status: 'ASSIGNED',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            updatedBy: 'System',
            notes: 'Assigned to Pankil'
          }]
        }
      },
      {
        type: 'STATUS_UPDATED',
        title: 'Documents Uploaded',
        message: `📤 Documents uploaded by Priya Sharma (Textiles) for ₹7,50,000 - Status updated from ASSIGNED on ${currentDate} at ${currentTime}`,
        priority: 'MEDIUM' as const,
        data: {
          enquiryId: 1002,
          clientName: 'Priya Sharma',
          currentStatus: 'DOCUMENTS_UPLOADED',
          previousStatus: 'ASSIGNED',
          assignedStaff: 'Venkat',
          loanAmount: 750000,
          businessType: 'Textiles',
          mobile: '9876543211',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 600000 // 10 minutes ago
          },
          statusHistory: [{
            status: 'DOCUMENTS_UPLOADED',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            notes: 'GST Certificate, Bank Statement uploaded'
          }]
        }
      },
      {
        type: 'STATUS_UPDATED',
        title: 'Documents Verified',
        message: `✅ Documents verified for Amit Patel (Trading) for ₹3,00,000 - Status updated from DOCUMENTS_UPLOADED on ${currentDate} at ${currentTime}`,
        priority: 'MEDIUM' as const,
        data: {
          enquiryId: 1003,
          clientName: 'Amit Patel',
          currentStatus: 'DOCUMENTS_VERIFIED',
          previousStatus: 'DOCUMENTS_UPLOADED',
          assignedStaff: 'Dinesh',
          loanAmount: 300000,
          businessType: 'Trading',
          mobile: '9876543212',
          updatedBy: 'Dinesh',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 900000 // 15 minutes ago
          },
          statusHistory: [{
            status: 'DOCUMENTS_VERIFIED',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            updatedBy: 'Dinesh',
            notes: 'All documents verified and approved'
          }]
        }
      },
      {
        type: 'STATUS_UPDATED',
        title: 'Client Shortlisted',
        message: `⭐ Sunita Gupta has been shortlisted (Manufacturing) for ₹10,00,000 - Status updated from DOCUMENTS_VERIFIED on ${currentDate} at ${currentTime}`,
        priority: 'HIGH' as const,
        data: {
          enquiryId: 1004,
          clientName: 'Sunita Gupta',
          currentStatus: 'SHORTLISTED',
          previousStatus: 'DOCUMENTS_VERIFIED',
          assignedStaff: 'Harish',
          loanAmount: 1000000,
          businessType: 'Manufacturing',
          mobile: '9876543213',
          updatedBy: 'Harish',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 1200000 // 20 minutes ago
          },
          statusHistory: [{
            status: 'SHORTLISTED',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            updatedBy: 'Harish',
            notes: 'Client added to shortlist - ready for payment gateway'
          }]
        }
      },
      {
        type: 'STATUS_UPDATED',
        title: 'Payment Application',
        message: `💳 Payment application submitted by Vikram Singh (Automotive) for ₹6,00,000 - Status updated from SHORTLISTED on ${currentDate} at ${currentTime}`,
        priority: 'HIGH' as const,
        data: {
          enquiryId: 1005,
          clientName: 'Vikram Singh',
          currentStatus: 'PAYMENT_APPLIED',
          previousStatus: 'SHORTLISTED',
          assignedStaff: 'Nanciya',
          loanAmount: 600000,
          businessType: 'Automotive',
          mobile: '9876543214',
          updatedBy: 'Nanciya',
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 1800000 // 30 minutes ago
          },
          statusHistory: [{
            status: 'PAYMENT_APPLIED',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            updatedBy: 'Nanciya',
            notes: 'Payment gateway application submitted - processing payment'
          }]
        }
      },
      {
        type: 'STAFF_ADDED',
        title: 'New Staff Member',
        message: `Dinesh added as EMPLOYEE at ${currentTime}`,
        priority: 'LOW' as const,
        data: {
          staffId: 3,
          staffName: 'Dinesh',
          role: 'EMPLOYEE',
          addedAt: new Date().toISOString(),
          dateTime: {
            date: currentDate,
            time: currentTime,
            dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
            timestamp: Date.now() - 2400000 // 40 minutes ago
          }
        }
      },
    ];

    sampleNotifications.forEach((notif, index) => {
      this.mockUsers.forEach((user) => {
        this.notifications.push({
          id: `notif_${Date.now()}_${index}_${user.id}`,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data,
          priority: notif.priority,
          userId: user.id,
          read: false,
          createdAt: new Date(Date.now() - index * 300000), // Stagger times by 5 minutes each
        });
      });
    });
  }

  async create(createNotificationDto: CreateNotificationDto, userId: number) {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...createNotificationDto,
      userId,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);

    return {
      message: 'Notification created successfully',
      notification,
    };
  }

  async findAll(user: User, query: any) {
    console.log('🔔 Finding notifications for user:', user.id, 'Total notifications:', this.notifications.length);
    let userNotifications = this.notifications.filter(n => n.userId === user.id);
    console.log('🔔 User notifications found:', userNotifications.length);

    // Add filters
    if (query.read !== undefined) {
      userNotifications = userNotifications.filter(n => n.read === (query.read === 'true'));
    }

    if (query.type) {
      userNotifications = userNotifications.filter(n => n.type === query.type);
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.offset ? parseInt(query.offset) : 0;
    const paginatedNotifications = userNotifications.slice(offset, offset + limit);

    console.log('🔔 Returning', paginatedNotifications.length, 'notifications');
    return {
      message: 'Notifications retrieved successfully',
      notifications: paginatedNotifications,
      count: paginatedNotifications.length,
    };
  }

  async getUnreadCount(userId: number) {
    const count = this.notifications.filter(n => n.userId === userId && !n.read).length;
    console.log('🔔 Unread count for user', userId, ':', count);

    return {
      unreadCount: count,
    };
  }

  async findOne(id: string) {
    const notification = this.notifications.find(n => n.id === id);

    if (!notification) {
      throw new Error('Notification not found');
    }

    return {
      message: 'Notification retrieved successfully',
      notification,
    };
  }

  async markAsRead(id: string, userId: number) {
    const notificationIndex = this.notifications.findIndex(n => n.id === id && n.userId === userId);
    
    if (notificationIndex !== -1) {
      this.notifications[notificationIndex].read = true;
      this.notifications[notificationIndex].readAt = new Date();
      // Save to file for persistence
      this.saveNotifications();
    }

    return {
      message: 'Notification marked as read',
      updated: notificationIndex !== -1,
    };
  }

  async markAllAsRead(userId: number) {
    let updatedCount = 0;
    
    this.notifications.forEach(notification => {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      // Save to file for persistence
      this.saveNotifications();
    }

    return {
      message: 'All notifications marked as read',
      updatedCount,
    };
  }

  async remove(id: string, userId: number) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => !(n.id === id && n.userId === userId));
    const deleted = this.notifications.length < initialLength;

    if (deleted) {
      // Save to file for persistence
      this.saveNotifications();
    }

    return {
      message: 'Notification deleted successfully',
      deleted,
    };
  }

  // System notification methods (for creating notifications from other services)
  async createSystemNotification(data: SystemNotificationData) {
    console.log('🔔 Creating system notification:', data.type, '-', data.title);
    
    // Check for duplicate notifications (same type, title, and message within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isDuplicate = this.notifications.some(notification => 
      notification.type === data.type &&
      notification.title === data.title &&
      notification.message === data.message &&
      new Date(notification.createdAt) > fiveMinutesAgo
    );

    if (isDuplicate) {
      console.log('🔔 Duplicate notification detected, skipping creation');
      return {
        message: 'Duplicate notification skipped',
        notifications: [],
        count: 0,
      };
    }

    // Get all admin users to notify
    const adminUsers = this.mockUsers.filter(user => user.role === 'ADMIN');
    console.log('🔔 Notifying', adminUsers.length, 'admin users');

    // Create notifications for all admin users
    const notifications = adminUsers.map(admin => {
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        priority: data.priority,
        userId: admin.id,
        read: false,
        createdAt: new Date(),
      };
      
      this.notifications.push(notification);
      return notification;
    });

    // Save to file for persistence in production
    this.saveNotifications();
    
    console.log('🔔 Created', notifications.length, 'notifications. Total notifications now:', this.notifications.length);
    return {
      message: 'System notification created successfully',
      notifications,
      count: notifications.length,
    };
  }

  // Enhanced helper methods for detailed enquiry status tracking
  async notifyEnquiryStatusUpdate(statusData: EnquiryStatusData) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    const statusMessages = {
      'NEW': `📋 New enquiry received from ${statusData.clientName}`,
      'ASSIGNED': `👤 Enquiry assigned to ${statusData.assignedStaff || 'staff member'}`,
      'DOCUMENTS_PENDING': `📄 Documents pending for ${statusData.clientName}`,
      'DOCUMENTS_UPLOADED': `📤 Documents uploaded by ${statusData.clientName}`,
      'DOCUMENTS_VERIFIED': `✅ Documents verified for ${statusData.clientName}`,
      'SHORTLISTED': `⭐ ${statusData.clientName} has been shortlisted`,
      'PAYMENT_APPLIED': `💳 Payment application submitted by ${statusData.clientName}`,
      'COMPLETED': `🎉 Loan process completed for ${statusData.clientName}`,
      'REJECTED': `❌ Application rejected for ${statusData.clientName}`
    };
    
    const statusTitle = {
      'NEW': 'New Enquiry Received',
      'ASSIGNED': 'Enquiry Assigned',
      'DOCUMENTS_PENDING': 'Documents Required',
      'DOCUMENTS_UPLOADED': 'Documents Uploaded',
      'DOCUMENTS_VERIFIED': 'Documents Verified',
      'SHORTLISTED': 'Client Shortlisted',
      'PAYMENT_APPLIED': 'Payment Application',
      'COMPLETED': 'Loan Completed',
      'REJECTED': 'Application Rejected'
    };
    
    const loanAmountText = statusData.loanAmount ? ` for ₹${statusData.loanAmount.toLocaleString()}` : '';
    const businessTypeText = statusData.businessType ? ` (${statusData.businessType})` : '';
    const previousStatusText = statusData.previousStatus ? ` from ${statusData.previousStatus}` : '';
    
    const detailedMessage = `${statusMessages[statusData.status]}${businessTypeText}${loanAmountText} - Status updated${previousStatusText} on ${currentDate} at ${currentTime}`;
    
    return this.createSystemNotification({
      type: 'STATUS_UPDATED',
      title: statusTitle[statusData.status],
      message: detailedMessage,
      data: {
        enquiryId: statusData.enquiryId,
        clientName: statusData.clientName,
        currentStatus: statusData.status,
        previousStatus: statusData.previousStatus,
        assignedStaff: statusData.assignedStaff,
        loanAmount: statusData.loanAmount,
        businessType: statusData.businessType,
        mobile: statusData.mobile,
        updatedBy: statusData.updatedBy,
        statusHistory: statusData.statusHistory,
        fullTimestamp: new Date().toISOString(),
        dateTime: {
          date: currentDate,
          time: currentTime,
          dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
          timestamp: Date.now()
        }
      },
      priority: statusData.status === 'NEW' || statusData.status === 'COMPLETED' ? 'HIGH' : 'MEDIUM',
    });
  }

  // Helper method to create notifications for specific events
  async notifyNewEnquiry(enquiryId: number, clientName: string, enquiryData?: any) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const loanAmountText = enquiryData?.loanAmount ? ` for ₹${enquiryData.loanAmount.toLocaleString()}` : '';
    const businessTypeText = enquiryData?.businessType ? ` (${enquiryData.businessType})` : '';
    
    // Also create detailed status notification
    await this.notifyEnquiryStatusUpdate({
      enquiryId,
      clientName,
      status: 'NEW',
      loanAmount: enquiryData?.loanAmount,
      businessType: enquiryData?.businessType,
      mobile: enquiryData?.mobile,
      statusHistory: [{
        status: 'NEW',
        timestamp: new Date().toISOString(),
        notes: 'Initial enquiry submission'
      }]
    });
    
    return this.createSystemNotification({
      type: 'NEW_ENQUIRY',
      title: 'New Enquiry Received',
      message: `New enquiry from ${clientName}${businessTypeText}${loanAmountText} business loan received at ${currentTime}`,
      data: { 
        enquiryId,
        clientName,
        loanAmount: enquiryData?.loanAmount,
        businessType: enquiryData?.businessType,
        mobile: enquiryData?.mobile,
        submittedAt: new Date().toISOString(),
        currentStatus: 'NEW',
        dateTime: {
          date: new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Kolkata'
          }),
          time: currentTime,
          dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
          timestamp: Date.now()
        }
      },
      priority: 'HIGH',
    });
  }

  async notifyDocumentUploaded(documentId: number, clientName: string, documentType: string) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    return this.createSystemNotification({
      type: 'DOCUMENT_UPLOADED',
      title: 'Document Uploaded',
      message: `${documentType} document uploaded by ${clientName} at ${currentTime} - awaiting verification`,
      data: { 
        documentId,
        clientName,
        documentType,
        uploadedAt: new Date().toISOString()
      },
      priority: 'MEDIUM',
    });
  }

  async notifyDocumentVerified(documentId: number, clientName: string, documentType: string) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    return this.createSystemNotification({
      type: 'DOCUMENT_VERIFIED',
      title: 'Document Verified',
      message: `${documentType} document verified for ${clientName} at ${currentTime} - ready for next step`,
      data: { 
        documentId,
        clientName,
        documentType,
        verifiedAt: new Date().toISOString()
      },
      priority: 'MEDIUM',
    });
  }

  async notifyShortlisted(shortlistId: number, clientName: string, shortlistData?: any) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const loanAmountText = shortlistData?.loanAmount ? ` for ₹${shortlistData.loanAmount.toLocaleString()}` : '';
    
    return this.createSystemNotification({
      type: 'SHORTLISTED',
      title: 'Client Shortlisted',
      message: `${clientName} has been added to shortlist${loanAmountText} at ${currentTime} - ready for payment gateway`,
      data: { 
        shortlistId,
        clientName,
        loanAmount: shortlistData?.loanAmount,
        businessType: shortlistData?.businessType,
        shortlistedAt: new Date().toISOString()
      },
      priority: 'HIGH',
    });
  }

  async notifyPaymentApplied(applicationId: number, clientName: string, amount: number, paymentData?: any) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const tenureText = paymentData?.tenure ? ` for ${paymentData.tenure} months` : '';
    
    return this.createSystemNotification({
      type: 'PAYMENT_APPLIED',
      title: 'Payment Gateway Application',
      message: `${clientName} applied for ₹${amount.toLocaleString()} business loan${tenureText} at ${currentTime} - processing payment`,
      data: { 
        applicationId,
        clientName,
        loanAmount: amount,
        tenure: paymentData?.tenure,
        interestRate: paymentData?.interestRate,
        appliedAt: new Date().toISOString()
      },
      priority: 'HIGH',
    });
  }

  async notifyStaffAdded(staffId: number, staffName: string, role: string) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    console.log('🔔 Creating staff notification for:', staffName, 'Role:', role);
    console.log('🔔 Current notifications count before creation:', this.notifications.length);
    
    const result = await this.createSystemNotification({
      type: 'STAFF_ADDED',
      title: 'New Staff Member Added',
      message: `👤 ${staffName} has been added as ${role} on ${currentDate} at ${currentTime} - Staff management system updated`,
      data: { 
        staffId,
        staffName,
        role,
        addedAt: new Date().toISOString(),
        dateTime: {
          date: currentDate,
          time: currentTime,
          dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
          timestamp: Date.now()
        },
        actionRequired: false,
        category: 'staff_management'
      },
      priority: 'MEDIUM',
    });
    
    console.log('🔔 Staff notification created successfully. Total notifications now:', this.notifications.length);
    console.log('🔔 Created notifications for', result.count, 'admin users');
    
    // Force save to file for deployment persistence
    this.saveNotifications();
    
    return result;
  }

  // New method for enquiry assignment notifications
  async notifyEnquiryAssigned(enquiryId: number, clientName: string, assignedStaff: string, assignedBy?: string) {
    const statusData: EnquiryStatusData = {
      enquiryId,
      clientName,
      status: 'ASSIGNED',
      previousStatus: 'NEW',
      assignedStaff,
      updatedBy: assignedBy,
      statusHistory: [{
        status: 'ASSIGNED',
        timestamp: new Date().toISOString(),
        updatedBy: assignedBy,
        notes: `Assigned to ${assignedStaff}`
      }]
    };
    
    return this.notifyEnquiryStatusUpdate(statusData);
  }

  // New method for enquiry completion notifications
  async notifyEnquiryCompleted(enquiryId: number, clientName: string, loanAmount?: number, completedBy?: string) {
    const statusData: EnquiryStatusData = {
      enquiryId,
      clientName,
      status: 'COMPLETED',
      previousStatus: 'PAYMENT_APPLIED',
      loanAmount,
      updatedBy: completedBy,
      statusHistory: [{
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        updatedBy: completedBy,
        notes: 'Loan process completed successfully'
      }]
    };
    
    return this.notifyEnquiryStatusUpdate(statusData);
  }
}
