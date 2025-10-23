import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { IdGeneratorService } from '../common/services/id-generator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/index';
import { User } from '@prisma/client';
import { UnifiedSupabaseSyncService } from '../common/services/unified-supabase-sync.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TransactionService {
  // File-based storage for demo mode
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly transactionsFile = path.join(this.dataDir, 'transactions.json');
  private demoTransactions: any[] = [];

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService: SupabaseService,
    private idGeneratorService: IdGeneratorService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private unifiedSupabaseSync: UnifiedSupabaseSyncService,
  ) {
    this.loadTransactions();
  }

  private loadTransactions() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.transactionsFile)) {
        const data = fs.readFileSync(this.transactionsFile, 'utf8');
        this.demoTransactions = JSON.parse(data);
        console.log('💰 Loaded', this.demoTransactions.length, 'transactions from file');
      } else {
        this.demoTransactions = [];
        this.createSampleTransactions();
        console.log('💰 No existing transactions file, created sample transactions');
      }
    } catch (error) {
      console.log('💰 Error loading transactions file, starting with sample transactions:', error);
      this.demoTransactions = [];
      this.createSampleTransactions();
    }
  }

  private saveTransactions() {
    try {
      fs.writeFileSync(this.transactionsFile, JSON.stringify(this.demoTransactions, null, 2));
      console.log('💰 Saved', this.demoTransactions.length, 'transactions to file');
    } catch (error) {
      console.error('💰 Error saving transactions file:', error);
    }
  }

  private createSampleTransactions() {
    const sampleTransactions = [
      {
        id: 1001,
        name: 'BALAMURUGAN Payment',
        date: new Date('2024-10-15'),
        transactionId: 'TXN202410001',
        amount: 500000,
        status: 'COMPLETED',
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15'),
      },
      {
        id: 1002,
        name: 'RAJESH KUMAR Payment',
        date: new Date('2024-10-14'),
        transactionId: 'TXN202410002',
        amount: 750000,
        status: 'PENDING',
        createdAt: new Date('2024-10-14'),
        updatedAt: new Date('2024-10-14'),
      },
      {
        id: 1003,
        name: 'PRIYA SHARMA Payment',
        date: new Date('2024-10-13'),
        transactionId: 'TXN202410003',
        amount: 300000,
        status: 'FAILED',
        createdAt: new Date('2024-10-13'),
        updatedAt: new Date('2024-10-13'),
      },
    ];

    this.demoTransactions.push(...sampleTransactions);
    this.saveTransactions();
    console.log('💰 Created', sampleTransactions.length, 'sample transactions');
  }

  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    try {
      // Force demo mode - skip Prisma entirely
      console.log('💰 Using demo mode - creating transaction in memory');
      
      // Validate required fields
      if (!createTransactionDto.name || !createTransactionDto.transactionId || !createTransactionDto.amount) {
        throw new BadRequestException('Name, transaction ID, and amount are required fields');
      }

      // Check for duplicate transaction ID
      const existingTransaction = this.demoTransactions.find(t => t.transactionId === createTransactionDto.transactionId);
      if (existingTransaction) {
        throw new BadRequestException('Transaction ID already exists');
      }

      // Generate 1-2 digit ID using ID generator service
      const transactionId = await this.idGeneratorService.generateTransactionId();
      
      const mockTransaction = {
        id: transactionId,
        ...createTransactionDto,
        amount: parseFloat(createTransactionDto.amount.toString()),
        date: new Date(createTransactionDto.date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.demoTransactions.push(mockTransaction);
      this.saveTransactions();

      // Auto-sync to Supabase using unified sync service (non-blocking)
      this.unifiedSupabaseSync.syncTransaction(mockTransaction).catch(error => {
        console.error('❌ [DEPLOYMENT] Failed to sync transaction to Supabase:', error);
      });

      // Create enhanced notification with client details and timestamp
      try {
        await this.notificationsService.createSystemNotification({
          type: 'TRANSACTION_CREATED',
          title: 'New Transaction Processed',
          message: `Transaction by ${mockTransaction.name} for ₹${mockTransaction.amount.toLocaleString()} (ID: ${mockTransaction.transactionId}) - Status: ${mockTransaction.status}`,
          priority: mockTransaction.amount >= 100000 ? 'HIGH' : 'MEDIUM',
          data: { 
            transactionId: mockTransaction.id, 
            clientName: mockTransaction.name,
            amount: mockTransaction.amount,
            transactionRef: mockTransaction.transactionId,
            status: mockTransaction.status,
            timestamp: mockTransaction.createdAt.toISOString()
          }
        });
        console.log('🔔 Enhanced notification created for transaction:', mockTransaction.name, 'Amount:', mockTransaction.amount);
      } catch (notificationError) {
        console.error('❌ Failed to create notification:', notificationError);
      }

      console.log('✅ Transaction created successfully in demo mode:', mockTransaction.name);
      return {
        message: 'Transaction created successfully',
        transaction: mockTransaction,
      };
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw error;
    }
  }

  async findAll(user: User) {
    try {
      // Force demo mode - skip Prisma entirely
      console.log('💰 Using demo mode - returning in-memory transactions');
      
      // Sort by creation date (newest first)
      return this.demoTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.log('💰 Error in findAll, returning empty transactions');
      return [];
    }
  }

  async findOne(id: number) {
    try {
      // Force demo mode - search in-memory storage
      console.log('💰 Using demo mode - searching for transaction ID:', id);
      console.log('💰 Available transactions in memory:', this.demoTransactions.map(t => ({ id: t.id, name: t.name })));
      
      const transaction = this.demoTransactions.find(transaction => transaction.id === id);
      
      if (!transaction) {
        console.log('⚠️ Transaction not found in memory, ID:', id);
        console.log('💰 Available transactions:', this.demoTransactions.map(t => ({ id: t.id, name: t.name })));
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      console.error('❌ Error finding transaction:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Transaction not found');
    }
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto, userId: number) {
    try {
      // Force demo mode - update in-memory storage
      console.log('💰 Using demo mode - updating transaction in memory');
      
      const transactionIndex = this.demoTransactions.findIndex(transaction => transaction.id === id);
      
      if (transactionIndex === -1) {
        console.log('⚠️ Transaction not found for update, ID:', id);
        console.log('💰 Available transactions:', this.demoTransactions.map(t => ({ id: t.id, name: t.name })));
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      // Update the transaction in memory
      this.demoTransactions[transactionIndex] = {
        ...this.demoTransactions[transactionIndex],
        ...updateTransactionDto,
        amount: updateTransactionDto.amount ? parseFloat(updateTransactionDto.amount.toString()) : this.demoTransactions[transactionIndex].amount,
        date: updateTransactionDto.date ? new Date(updateTransactionDto.date) : this.demoTransactions[transactionIndex].date,
        updatedAt: new Date(),
      };

      const updatedTransaction = this.demoTransactions[transactionIndex];
      this.saveTransactions();

      // Sync to Supabase in background (non-blocking)
      this.syncTransactionToSupabase(updatedTransaction).catch(error => {
        console.error('❌ Failed to sync updated transaction to Supabase:', error);
      });

      // Create enhanced notification for transaction update
      try {
        const currentTime = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
        
        await this.notificationsService.createSystemNotification({
          type: 'TRANSACTION_UPDATED',
          title: 'Transaction Updated',
          message: `Transaction by ${updatedTransaction.name} for ₹${updatedTransaction.amount.toLocaleString()} updated to ${updatedTransaction.status} at ${currentTime}`,
          priority: updatedTransaction.status === 'COMPLETED' ? 'HIGH' : 'MEDIUM',
          data: {
            transactionId: updatedTransaction.id,
            clientName: updatedTransaction.name,
            amount: updatedTransaction.amount,
            transactionRef: updatedTransaction.transactionId,
            oldStatus: this.demoTransactions[transactionIndex]?.status,
            newStatus: updatedTransaction.status,
            updatedAt: new Date().toISOString(),
            updatedBy: userId
          }
        });
        console.log('🔔 Enhanced update notification created for transaction:', updatedTransaction.name, 'Status:', updatedTransaction.status);
      } catch (notificationError) {
        console.error('❌ Failed to create update notification:', notificationError);
      }

      console.log('✅ Transaction updated successfully in demo mode:', updatedTransaction.name);
      return {
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      };
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Transaction not found');
    }
  }

  async remove(id: number, userId: number) {
    try {
      // Force demo mode - remove from in-memory storage
      console.log('💰 Using demo mode - removing transaction from memory');
      
      const transactionIndex = this.demoTransactions.findIndex(transaction => transaction.id === id);
      
      if (transactionIndex === -1) {
        console.log('⚠️ Transaction not found for removal, ID:', id);
        console.log('💰 Available transactions:', this.demoTransactions.map(t => ({ id: t.id, name: t.name })));
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      // Remove from memory
      const removedTransaction = this.demoTransactions.splice(transactionIndex, 1)[0];
      this.saveTransactions();

      console.log('✅ Transaction removed successfully from demo mode:', removedTransaction.name);
      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      console.error('❌ Error removing transaction:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return { message: 'Transaction deleted successfully' };
    }
  }

  private async syncTransactionToSupabase(transaction: any) {
    if (!this.supabaseService) {
      console.log('💰 Supabase service not available, skipping sync');
      return;
    }

    try {
      console.log('💰 Syncing transaction to Supabase:', transaction.name);
      
      const supabaseData = {
        id: transaction.id,
        name: transaction.name,
        date: transaction.date,
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      };

      // Use Supabase client directly for upsert
      const { error } = await this.supabaseService.client
        .from('transactions')
        .upsert(supabaseData);

      if (error) {
        console.error('❌ Supabase sync error:', error);
      } else {
        console.log('✅ Transaction synced to Supabase successfully');
      }
    } catch (error) {
      console.error('❌ Failed to sync transaction to Supabase:', error);
    }
  }
}
