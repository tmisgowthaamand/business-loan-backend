import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from './persistence.service';

@Injectable()
export class IdGeneratorService {
  private readonly logger = new Logger(IdGeneratorService.name);
  
  // Counter storage keys for different modules
  private readonly COUNTER_KEYS = {
    enquiry: 'enquiry_counter',
    document: 'document_counter',
    staff: 'staff_counter',
    shortlist: 'shortlist_counter',
    cashfree: 'cashfree_counter',
    transaction: 'transaction_counter',
    notification: 'notification_counter',
  };

  constructor(private persistenceService: PersistenceService) {
    this.initializeCounters();
  }

  private async initializeCounters() {
    this.logger.log('🔢 Initializing ID counters for all modules...');
    
    // Initialize all counters if they don't exist
    for (const [module, key] of Object.entries(this.COUNTER_KEYS)) {
      const currentCounter = await this.persistenceService.loadData(key, 0);
      if (currentCounter === 0) {
        // Start from 1 for all modules
        await this.persistenceService.saveData(key, 1);
        this.logger.log(`🔢 Initialized ${module} counter to 1`);
      } else {
        this.logger.log(`🔢 ${module} counter already at ${currentCounter}`);
      }
    }
  }

  /**
   * Generate next ID for enquiry module (1-2 digits)
   */
  async generateEnquiryId(): Promise<number> {
    return this.generateNextId('enquiry');
  }

  /**
   * Generate next ID for document module (1-2 digits)
   */
  async generateDocumentId(): Promise<number> {
    return this.generateNextId('document');
  }

  /**
   * Generate next ID for staff module (1-2 digits)
   */
  async generateStaffId(): Promise<number> {
    return this.generateNextId('staff');
  }

  /**
   * Generate next ID for shortlist module (1-2 digits)
   */
  async generateShortlistId(): Promise<number> {
    return this.generateNextId('shortlist');
  }

  /**
   * Generate next ID for cashfree application module (1-2 digits)
   */
  async generateCashfreeId(): Promise<number> {
    return this.generateNextId('cashfree');
  }

  /**
   * Generate next ID for transaction module (1-2 digits)
   */
  async generateTransactionId(): Promise<number> {
    return this.generateNextId('transaction');
  }

  /**
   * Generate next ID for notification module (1-2 digits)
   */
  async generateNotificationId(): Promise<number> {
    return this.generateNextId('notification');
  }

  /**
   * Core method to generate next sequential ID for any module
   */
  private async generateNextId(module: keyof typeof this.COUNTER_KEYS): Promise<number> {
    try {
      const counterKey = this.COUNTER_KEYS[module];
      
      // Get current counter
      let currentCounter = await this.persistenceService.loadData(counterKey, 0);
      
      // Increment counter
      currentCounter++;
      
      // Save updated counter
      await this.persistenceService.saveData(counterKey, currentCounter);
      
      this.logger.log(`🔢 Generated ${module} ID: ${currentCounter}`);
      
      return currentCounter;
    } catch (error) {
      this.logger.error(`❌ Error generating ${module} ID:`, error);
      
      // Fallback to timestamp-based ID (but keep it small)
      const fallbackId = Date.now() % 100; // Keep it within 1-2 digits
      this.logger.warn(`⚠️ Using fallback ID for ${module}: ${fallbackId}`);
      
      return fallbackId;
    }
  }

  /**
   * Reset counter for a specific module (useful for testing)
   */
  async resetCounter(module: keyof typeof this.COUNTER_KEYS, startValue: number = 1): Promise<void> {
    try {
      const counterKey = this.COUNTER_KEYS[module];
      await this.persistenceService.saveData(counterKey, startValue);
      this.logger.log(`🔄 Reset ${module} counter to ${startValue}`);
    } catch (error) {
      this.logger.error(`❌ Error resetting ${module} counter:`, error);
    }
  }

  /**
   * Get current counter value for a module
   */
  async getCurrentCounter(module: keyof typeof this.COUNTER_KEYS): Promise<number> {
    try {
      const counterKey = this.COUNTER_KEYS[module];
      return await this.persistenceService.loadData(counterKey, 0);
    } catch (error) {
      this.logger.error(`❌ Error getting ${module} counter:`, error);
      return 0;
    }
  }

  /**
   * Get all counter values for monitoring
   */
  async getAllCounters(): Promise<Record<string, number>> {
    const counters: Record<string, number> = {};
    
    for (const [module, key] of Object.entries(this.COUNTER_KEYS)) {
      try {
        counters[module] = await this.persistenceService.loadData(key, 0);
      } catch (error) {
        this.logger.error(`❌ Error getting ${module} counter:`, error);
        counters[module] = 0;
      }
    }
    
    return counters;
  }

  /**
   * Initialize counters with specific starting values (for migration)
   */
  async initializeWithValues(initialValues: Partial<Record<keyof typeof this.COUNTER_KEYS, number>>): Promise<void> {
    this.logger.log('🔢 Initializing counters with specific values...');
    
    for (const [module, value] of Object.entries(initialValues)) {
      if (this.COUNTER_KEYS[module as keyof typeof this.COUNTER_KEYS] && typeof value === 'number') {
        await this.resetCounter(module as keyof typeof this.COUNTER_KEYS, value);
      }
    }
  }
}
