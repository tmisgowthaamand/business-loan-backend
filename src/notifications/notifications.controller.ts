import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { NotificationsService, Notification } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
// import { JwtGuard } from '../auth/guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @GetUser() user?: User,
  ): Promise<{ message: string; notification: Notification }> {
    const userId = user?.id || 1; // Demo user fallback
    return this.notificationsService.create(createNotificationDto, userId);
  }

  @Get()
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  findAll(@GetUser() user?: User, @Query() query?: any): Promise<{ message: string; notifications: Notification[]; count: number }> {
    console.log('🔔 Getting notifications for user:', user?.id || 1);
    // For demo mode, use default user if no auth
    const demoUser = user || { id: 1, role: 'ADMIN' } as User;
    const result = this.notificationsService.findAll(demoUser, query || {});
    console.log('🔔 Returning notifications result');
    return result;
  }

  @Get('count')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  getUnreadCount(@GetUser() user?: User): Promise<{ unreadCount: number }> {
    console.log('🔔 Getting unread count for user:', user?.id || 1);
    // For demo mode, use default user if no auth
    const userId = user?.id || 1;
    const result = this.notificationsService.getUnreadCount(userId);
    console.log('🔔 Returning unread count result');
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<{ message: string; notification: Notification }> {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  markAsRead(@Param('id') id: string, @GetUser() user?: User): Promise<{ message: string; updated: boolean }> {
    console.log('🔔 Marking notification as read:', id, 'for user:', user?.id || 1);
    const userId = user?.id || 1;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  markAllAsRead(@GetUser() user?: User): Promise<{ message: string; updatedCount: number }> {
    console.log('🔔 Marking all notifications as read for user:', user?.id || 1);
    const userId = user?.id || 1;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  remove(@Param('id') id: string, @GetUser() user?: User): Promise<{ message: string; deleted: boolean }> {
    console.log('🔔 Deleting notification:', id, 'for user:', user?.id || 1);
    const userId = user?.id || 1;
    return this.notificationsService.remove(id, userId);
  }

  // Test endpoint to create sample notifications
  @Post('test/create-sample')
  createSampleNotification(): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'NEW_ENQUIRY',
      title: 'Test Notification',
      message: `Test notification created at ${new Date().toLocaleTimeString()}`,
      priority: 'HIGH',
    });
  }

  @Post('status-update')
  async createStatusUpdateNotification(
    @Body() statusData: {
      enquiryId: number;
      clientName: string;
      status: string;
      previousStatus?: string;
      assignedStaff?: string;
      loanAmount?: number;
      businessType?: string;
      mobile?: string;
      updatedBy?: string;
      notes?: string;
    }
  ) {
    console.log('🔔 Creating status update notification:', statusData);
    
    return this.notificationsService.notifyEnquiryStatusUpdate({
      enquiryId: statusData.enquiryId,
      clientName: statusData.clientName,
      status: statusData.status as any,
      previousStatus: statusData.previousStatus,
      assignedStaff: statusData.assignedStaff,
      loanAmount: statusData.loanAmount,
      businessType: statusData.businessType,
      mobile: statusData.mobile,
      updatedBy: statusData.updatedBy,
      statusHistory: [{
        status: statusData.status,
        timestamp: new Date().toISOString(),
        updatedBy: statusData.updatedBy,
        notes: statusData.notes || `Status updated to ${statusData.status}`
      }]
    });
  }

  @Get('enquiry/:id/status-history')
  async getEnquiryStatusHistory(@Param('id') enquiryId: string) {
    console.log('📊 Getting status history for enquiry:', enquiryId);
    
    // Filter notifications for this specific enquiry
    const enquiryNotifications = this.notificationsService['notifications'].filter(
      (notification: any) => 
        notification.data?.enquiryId === parseInt(enquiryId) &&
        (notification.type === 'STATUS_UPDATED' || notification.type === 'NEW_ENQUIRY')
    );
    
    // Sort by creation date (newest first)
    enquiryNotifications.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return {
      message: 'Status history retrieved successfully',
      enquiryId: parseInt(enquiryId),
      notifications: enquiryNotifications,
      count: enquiryNotifications.length
    };
  }

  @Get('dashboard-summary')
  async getDashboardNotificationSummary() {
    console.log('📊 Getting dashboard notification summary');
    
    const allNotifications = this.notificationsService['notifications'];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const summary = {
      total: allNotifications.length,
      unread: allNotifications.filter((n: any) => !n.read).length,
      last24Hours: allNotifications.filter((n: any) => new Date(n.createdAt) > last24Hours).length,
      byType: {
        newEnquiries: allNotifications.filter((n: any) => n.type === 'NEW_ENQUIRY').length,
        statusUpdates: allNotifications.filter((n: any) => n.type === 'STATUS_UPDATED').length,
        documentsUploaded: allNotifications.filter((n: any) => n.type === 'DOCUMENT_UPLOADED').length,
        documentsVerified: allNotifications.filter((n: any) => n.type === 'DOCUMENT_VERIFIED').length,
        shortlisted: allNotifications.filter((n: any) => n.type === 'SHORTLISTED').length,
        paymentApplied: allNotifications.filter((n: any) => n.type === 'PAYMENT_APPLIED').length,
        completed: allNotifications.filter((n: any) => n.type === 'ENQUIRY_COMPLETED').length
      },
      byPriority: {
        high: allNotifications.filter((n: any) => n.priority === 'HIGH').length,
        medium: allNotifications.filter((n: any) => n.priority === 'MEDIUM').length,
        low: allNotifications.filter((n: any) => n.priority === 'LOW').length
      }
    };
    
    return {
      message: 'Dashboard notification summary retrieved successfully',
      summary,
      timestamp: new Date().toISOString()
    };
  }

  // System notification endpoints (for creating notifications from other services)
  @Post('system/new-enquiry')
  createNewEnquiryNotification(@Body() data: { enquiryId: number; clientName: string }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'NEW_ENQUIRY',
      title: 'New Enquiry Received',
      message: `New enquiry from ${data.clientName}`,
      data: { enquiryId: data.enquiryId },
      priority: 'HIGH',
    });
  }

  @Post('system/document-uploaded')
  createDocumentUploadedNotification(@Body() data: { documentId: number; clientName: string; documentType: string }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'DOCUMENT_UPLOADED',
      title: 'Document Uploaded',
      message: `${data.documentType} uploaded by ${data.clientName}`,
      data: { documentId: data.documentId },
      priority: 'MEDIUM',
    });
  }

  @Post('system/document-verified')
  createDocumentVerifiedNotification(@Body() data: { documentId: number; clientName: string; documentType: string }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'DOCUMENT_VERIFIED',
      title: 'Document Verified',
      message: `${data.documentType} verified for ${data.clientName}`,
      data: { documentId: data.documentId },
      priority: 'MEDIUM',
    });
  }

  @Post('system/shortlisted')
  createShortlistedNotification(@Body() data: { shortlistId: number; clientName: string }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'SHORTLISTED',
      title: 'Client Shortlisted',
      message: `${data.clientName} has been added to shortlist`,
      data: { shortlistId: data.shortlistId },
      priority: 'HIGH',
    });
  }

  @Post('system/payment-applied')
  createPaymentAppliedNotification(@Body() data: { applicationId: number; clientName: string; amount: number }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'PAYMENT_APPLIED',
      title: 'Payment Gateway Application',
      message: `${data.clientName} applied for ₹${data.amount.toLocaleString()} loan`,
      data: { applicationId: data.applicationId },
      priority: 'HIGH',
    });
  }

  @Post('system/staff-added')
  createStaffAddedNotification(@Body() data: { staffId: number; staffName: string; role: string }): Promise<{ message: string; notifications: Notification[]; count: number }> {
    return this.notificationsService.createSystemNotification({
      type: 'STAFF_ADDED',
      title: 'New Staff Member',
      message: `${data.staffName} added as ${data.role}`,
      data: { staffId: data.staffId },
      priority: 'LOW',
    });
  }
}
