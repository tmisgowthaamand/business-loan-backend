import { Injectable } from '@nestjs/common';

@Injectable()
export class StaffService {
  private staff = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@gmail.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      hasAccess: true,
      createdAt: new Date().toISOString(),
    },
  ];

  findAll() {
    return { staff: this.staff };
  }

  create(createStaffDto: any) {
    const newStaff = {
      id: Date.now(),
      ...createStaffDto,
      status: 'ACTIVE',
      hasAccess: true,
      createdAt: new Date().toISOString(),
    };
    this.staff.push(newStaff);
    return newStaff;
  }

  findOne(id: number) {
    return this.staff.find(member => member.id === id);
  }

  update(id: number, updateStaffDto: any) {
    const index = this.staff.findIndex(member => member.id === id);
    if (index !== -1) {
      this.staff[index] = { ...this.staff[index], ...updateStaffDto };
      return this.staff[index];
    }
    return null;
  }

  remove(id: number) {
    const index = this.staff.findIndex(member => member.id === id);
    if (index !== -1) {
      const removed = this.staff.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
