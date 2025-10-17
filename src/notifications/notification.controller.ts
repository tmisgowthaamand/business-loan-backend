import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationCreate, NotificationFilter } from './notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Query('category') category?: string,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any
  ) {
    const filter: NotificationFilter = {
      userId: req?.user?.id,
      userRole: req?.user?.role,
      category,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const result = await this.notificationService.getNotifications(filter);
    
    // Add time ago to each notification
    const notificationsWithTimeAgo = result.notifications.map(notification => ({
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    }));

    return {
      ...result,
      notifications: notificationsWithTimeAgo
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req?: any) {
    const filter: NotificationFilter = {
      userId: req?.user?.id,
      userRole: req?.user?.role,
      isRead: false
    };

    const result = await this.notificationService.getNotifications(filter);
    return { count: result.unreadCount };
  }

  @Post()
  async createNotification(@Body() data: NotificationCreate) {
    const notification = await this.notificationService.createNotification(data);
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req?: any) {
    const count = await this.notificationService.markAllAsRead(
      req?.user?.id,
      req?.user?.role
    );
    return { markedCount: count };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    const deleted = await this.notificationService.deleteNotification(id);
    if (!deleted) {
      throw new Error('Notification not found');
    }
    return { success: true };
  }

  // Endpoints for creating specific notification types
  @Post('loan')
  async createLoanNotification(
    @Body() data: { title: string; message: string; loanId: string; type?: 'info' | 'success' | 'warning' }
  ) {
    const notification = await this.notificationService.createLoanNotification(
      data.title,
      data.message,
      data.loanId,
      data.type
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('document')
  async createDocumentNotification(
    @Body() data: { title: string; message: string; documentId: string; type?: 'info' | 'success' | 'warning' }
  ) {
    const notification = await this.notificationService.createDocumentNotification(
      data.title,
      data.message,
      data.documentId,
      data.type
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('staff')
  async createStaffNotification(
    @Body() data: { title: string; message: string; staffId: string; type?: 'info' | 'success' | 'warning' }
  ) {
    const notification = await this.notificationService.createStaffNotification(
      data.title,
      data.message,
      data.staffId,
      data.type
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('payment')
  async createPaymentNotification(
    @Body() data: { title: string; message: string; paymentId: string; type?: 'info' | 'success' | 'warning' }
  ) {
    const notification = await this.notificationService.createPaymentNotification(
      data.title,
      data.message,
      data.paymentId,
      data.type
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  // Auto-notification endpoints
  @Post('auto/enquiry-created')
  async notifyEnquiryCreated(
    @Body() data: { enquiryId: string; companyName: string }
  ) {
    const notification = await this.notificationService.notifyEnquiryCreated(
      data.enquiryId,
      data.companyName
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('auto/document-uploaded')
  async notifyDocumentUploaded(
    @Body() data: { documentId: string; fileName: string; companyName: string }
  ) {
    const notification = await this.notificationService.notifyDocumentUploaded(
      data.documentId,
      data.fileName,
      data.companyName
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('auto/document-verified')
  async notifyDocumentVerified(
    @Body() data: { documentId: string; fileName: string; companyName: string }
  ) {
    const notification = await this.notificationService.notifyDocumentVerified(
      data.documentId,
      data.fileName,
      data.companyName
    );
    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }

  @Post('test')
  async createTestNotification() {
    const testNotifications = [
      {
        title: 'New loan application',
        message: 'Global Tech Solutions submitted loan documents',
        type: 'info' as const,
        category: 'loan' as const
      },
      {
        title: 'Document verified',
        message: 'PAN card approved for StartupCorp',
        type: 'success' as const,
        category: 'document' as const
      },
      {
        title: 'Payment received',
        message: 'Processing fee received from TechVenture',
        type: 'success' as const,
        category: 'payment' as const
      }
    ];

    const randomNotif = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    
    const notification = await this.notificationService.createNotification({
      ...randomNotif,
      userRole: 'ADMIN'
    });

    return {
      ...notification,
      timeAgo: this.notificationService.getTimeAgo(notification.createdAt)
    };
  }
}
