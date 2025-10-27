import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: number;
  name?: string;
  email?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notifications: Notification[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly notificationsFile = path.join(this.dataDir, 'notifications.json');

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing notifications
    await this.loadNotifications();
  }

  private async loadNotifications() {
    try {
      if (fs.existsSync(this.notificationsFile)) {
        const data = fs.readFileSync(this.notificationsFile, 'utf8');
        this.notifications = JSON.parse(data);
        this.logger.log(`🔔 Loaded ${this.notifications.length} notifications from file`);
      } else {
        this.logger.log('🔔 No existing notifications file, creating sample data');
        await this.createSampleNotifications();
      }
    } catch (error) {
      this.logger.error('❌ Error loading notifications:', error);
      await this.createSampleNotifications();
    }
  }

  private async saveNotifications() {
    try {
      fs.writeFileSync(this.notificationsFile, JSON.stringify(this.notifications, null, 2));
      this.logger.log(`🔔 Saved ${this.notifications.length} notifications to file`);
    } catch (error) {
      this.logger.error('❌ Error saving notifications:', error);
    }
  }

  private async createSampleNotifications() {
    const sampleNotifications: Notification[] = [
      {
        id: Date.now() + 1,
        type: 'NEW_ENQUIRY',
        title: 'New Enquiry Received',
        message: 'New enquiry from BALAMURUGAN (Manufacturing) for ₹5,00,000 business loan received',
        data: {
          enquiryId: 9570,
          clientName: 'BALAMURUGAN',
          loanAmount: 500000,
          businessType: 'Manufacturing'
        },
        priority: 'HIGH',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: Date.now() + 2,
        type: 'DOCUMENT_UPLOADED',
        title: 'Document Uploaded',
        message: 'GST Certificate uploaded by RAJESH KUMAR - awaiting verification',
        data: {
          documentType: 'GST',
          clientName: 'RAJESH KUMAR'
        },
        priority: 'MEDIUM',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: Date.now() + 3,
        type: 'SHORTLISTED',
        title: 'Client Shortlisted',
        message: 'PRIYA SHARMA has been added to shortlist for ₹7,50,000 - ready for payment gateway',
        data: {
          shortlistId: 1003,
          clientName: 'PRIYA SHARMA',
          loanAmount: 750000
        },
        priority: 'HIGH',
        read: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updatedAt: new Date().toISOString()
      },
      {
        id: Date.now() + 4,
        type: 'PAYMENT_APPLIED',
        title: 'Payment Gateway Application',
        message: 'AMIT PATEL applied for ₹10,00,000 business loan - processing payment',
        data: {
          applicationId: 2001,
          clientName: 'AMIT PATEL',
          loanAmount: 1000000
        },
        priority: 'HIGH',
        read: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: Date.now() + 5,
        type: 'STAFF_ADDED',
        title: 'New Staff Member',
        message: 'New staff member Dinesh has been added to the system',
        data: {
          staffId: 5,
          staffName: 'Dinesh',
          role: 'EMPLOYEE'
        },
        priority: 'LOW',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
      }
    ];

    this.notifications = sampleNotifications;
    await this.saveNotifications();
    this.logger.log('🔔 Created sample notifications');
  }

  async findAll(user?: User): Promise<{ notifications: Notification[]; count: number }> {
    // Sort by creation date (newest first)
    const sortedNotifications = this.notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      notifications: sortedNotifications,
      count: sortedNotifications.length
    };
  }

  async getUnreadCount(user?: User): Promise<{ unreadCount: number }> {
    const unreadCount = this.notifications.filter(notification => !notification.read).length;
    return { unreadCount };
  }

  async markAsRead(id: number): Promise<Notification> {
    const notificationIndex = this.notifications.findIndex(notification => notification.id === id);
    
    if (notificationIndex === -1) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.notifications[notificationIndex].read = true;
    this.notifications[notificationIndex].updatedAt = new Date().toISOString();

    await this.saveNotifications();
    return this.notifications[notificationIndex];
  }

  async markAllAsRead(user?: User): Promise<{ message: string; count: number }> {
    let updatedCount = 0;
    
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    });

    await this.saveNotifications();
    return { message: 'All notifications marked as read', count: updatedCount };
  }

  async remove(id: number): Promise<{ message: string }> {
    const notificationIndex = this.notifications.findIndex(notification => notification.id === id);
    
    if (notificationIndex === -1) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.notifications.splice(notificationIndex, 1);
    await this.saveNotifications();

    return { message: 'Notification deleted successfully' };
  }

  async createSystemNotification(notificationData: {
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<Notification> {
    const newNotification: Notification = {
      id: Date.now(),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      priority: notificationData.priority || 'MEDIUM',
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notifications.push(newNotification);
    await this.saveNotifications();

    this.logger.log('✅ System notification created:', newNotification.title);
    return newNotification;
  }

  // Helper methods for other services to create notifications
  async notifyNewEnquiry(enquiryId: number, clientName: string, enquiryData?: any) {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    const loanAmountText = enquiryData?.loanAmount ? ` for ₹${enquiryData.loanAmount.toLocaleString()}` : '';
    const businessTypeText = enquiryData?.businessType ? ` (${enquiryData.businessType})` : '';
    
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
        submittedAt: new Date().toISOString()
      },
      priority: 'HIGH',
    });
  }

  async notifyDocumentUploaded(documentType: string, clientName: string, documentData?: any) {
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
        documentType,
        clientName,
        documentId: documentData?.id,
        uploadedAt: new Date().toISOString()
      },
      priority: 'MEDIUM',
    });
  }

  async notifyShortlisted(clientName: string, shortlistData?: any) {
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
        shortlistId: shortlistData?.id,
        clientName,
        loanAmount: shortlistData?.loanAmount,
        businessType: shortlistData?.businessType,
        shortlistedAt: new Date().toISOString()
      },
      priority: 'HIGH',
    });
  }

  async notifyPaymentApplied(clientName: string, amount: number, paymentData?: any) {
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
        applicationId: paymentData?.id,
        clientName,
        loanAmount: amount,
        tenure: paymentData?.tenure,
        interestRate: paymentData?.interestRate,
        appliedAt: new Date().toISOString()
      },
      priority: 'HIGH',
    });
  }
}
