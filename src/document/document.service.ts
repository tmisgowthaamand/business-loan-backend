import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentService {
  private documents = [
    {
      id: 1,
      type: 'GST_CERTIFICATE',
      fileName: 'gst-certificate.pdf',
      verified: false,
      enquiryId: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  findAll() {
    return this.documents;
  }

  create(createDocumentDto: any) {
    const newDocument = {
      id: Date.now(),
      ...createDocumentDto,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(newDocument);
    return newDocument;
  }

  findOne(id: number) {
    return this.documents.find(doc => doc.id === id);
  }

  verify(id: number) {
    const document = this.documents.find(doc => doc.id === id);
    if (document) {
      document.verified = true;
      return document;
    }
    return null;
  }

  remove(id: number) {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      const removed = this.documents.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
