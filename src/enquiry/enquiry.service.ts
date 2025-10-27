import { Injectable } from '@nestjs/common';

@Injectable()
export class EnquiryService {
  private enquiries = [
    {
      id: 1,
      name: 'John Doe',
      mobile: '9876543210',
      businessType: 'Trading',
      businessName: 'ABC Trading',
      loanAmount: 500000,
      interestStatus: 'INTERESTED',
      createdAt: new Date().toISOString(),
    },
  ];

  findAll(query?: any) {
    return this.enquiries;
  }

  create(createEnquiryDto: any) {
    const newEnquiry = {
      id: Date.now(),
      ...createEnquiryDto,
      createdAt: new Date().toISOString(),
    };
    this.enquiries.push(newEnquiry);
    return newEnquiry;
  }

  findOne(id: number) {
    return this.enquiries.find(enquiry => enquiry.id === id);
  }

  update(id: number, updateEnquiryDto: any) {
    const index = this.enquiries.findIndex(enquiry => enquiry.id === id);
    if (index !== -1) {
      this.enquiries[index] = { ...this.enquiries[index], ...updateEnquiryDto };
      return this.enquiries[index];
    }
    return null;
  }

  remove(id: number) {
    const index = this.enquiries.findIndex(enquiry => enquiry.id === id);
    if (index !== -1) {
      const removed = this.enquiries.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
