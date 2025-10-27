import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    console.log('🔔 Fetching all notifications');
    return this.notificationsService.findAll(userId ? { id: parseInt(userId) } : undefined);
  }

  @Get('count')
  async getUnreadCount(@Query('userId') userId?: string) {
    console.log('🔔 Fetching unread notification count');
    return this.notificationsService.getUnreadCount(userId ? { id: parseInt(userId) } : undefined);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    console.log('🔔 Marking notification as read:', id);
    return this.notificationsService.markAsRead(+id);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Query('userId') userId?: string) {
    console.log('🔔 Marking all notifications as read');
    return this.notificationsService.markAllAsRead(userId ? { id: parseInt(userId) } : undefined);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log('🔔 Deleting notification:', id);
    return this.notificationsService.remove(+id);
  }

  @Post('system')
  async createSystemNotification(@Body() notificationData: any) {
    console.log('🔔 Creating system notification:', notificationData);
    return this.notificationsService.createSystemNotification(notificationData);
  }
}
