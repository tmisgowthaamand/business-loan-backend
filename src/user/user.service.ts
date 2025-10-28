import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: User) {
    // Only admins can view all users
    if (user.role === 'EMPLOYEE') {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enquiries: true,
            documents: true,
            shortlists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enquiries: true,
            documents: true,
            shortlists: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enquiries: true,
            documents: true,
            shortlists: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserId: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    // Only admin can update roles, or users can update their own profile
    if (updateUserDto.role && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can update roles');
    }

    if (id !== currentUserId && currentUser.role === 'EMPLOYEE') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE_USER',
        targetTable: 'User',
        targetId: id,
      },
    });

    return updated;
  }

  async remove(id: number, currentUserId: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    // Only admin can delete users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete users');
    }

    // Cannot delete yourself
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    await this.prisma.user.delete({ where: { id } });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE_USER',
        targetTable: 'User',
        targetId: id,
      },
    });

    return { message: 'User deleted successfully' };
  }
}
