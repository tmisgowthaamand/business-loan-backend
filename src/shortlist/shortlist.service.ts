import { Injectable } from '@nestjs/common';

@Injectable()
export class ShortlistService {
  private shortlists = [];

  findAll() {
    return this.shortlists;
  }

  create(createShortlistDto: any) {
    const newShortlist = {
      id: Date.now(),
      ...createShortlistDto,
      createdAt: new Date().toISOString(),
    };
    this.shortlists.push(newShortlist);
    return newShortlist;
  }

  findOne(id: number) {
    return this.shortlists.find(item => item.id === id);
  }

  update(id: number, updateShortlistDto: any) {
    const index = this.shortlists.findIndex(item => item.id === id);
    if (index !== -1) {
      this.shortlists[index] = { ...this.shortlists[index], ...updateShortlistDto };
      return this.shortlists[index];
    }
    return null;
  }

  remove(id: number) {
    const index = this.shortlists.findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = this.shortlists.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
