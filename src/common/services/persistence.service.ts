import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly isRender = process.env.RENDER === 'true';
  private readonly isVercel = process.env.VERCEL === '1';
  
  // In-memory cache for production environments where file system might be read-only
  private memoryCache = new Map<string, any>();
  
  constructor() {
    this.logger.log(`🗄️ Persistence service initialized`);
    this.logger.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    this.logger.log(`🚀 Platform: ${this.isRender ? 'Render' : this.isVercel ? 'Vercel' : 'Local'}`);
    
    // Ensure data directory exists
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    try {
      const dataDir = this.getDataDirectory();
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        this.logger.log(`📁 Created data directory: ${dataDir}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Could not create data directory, using memory cache only:`, error.message);
    }
  }

  private getDataDirectory(): string {
    // Use /tmp for Render, current directory for others
    if (this.isRender) {
      return path.join('/tmp', 'loan-app-data');
    }
    return path.join(process.cwd(), 'data');
  }

  private getFilePath(filename: string): string {
    return path.join(this.getDataDirectory(), `${filename}.json`);
  }

  /**
   * Save data with dual storage (file + memory cache)
   */
  async saveData<T>(key: string, data: T): Promise<void> {
    try {
      // Always save to memory cache first
      this.memoryCache.set(key, JSON.parse(JSON.stringify(data)));
      
      // Try to save to file system
      if (!this.isVercel) { // Vercel has read-only file system
        const filePath = this.getFilePath(key);
        const jsonData = JSON.stringify(data, null, 2);
        
        await fs.promises.writeFile(filePath, jsonData, 'utf8');
        this.logger.debug(`💾 Saved ${key} to file: ${filePath}`);
      }
      
      this.logger.debug(`💾 Saved ${key} to memory cache`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to save ${key} to file, using memory only:`, error.message);
      // Data is still in memory cache, so operation succeeds
    }
  }

  /**
   * Load data with fallback from memory cache to file
   */
  async loadData<T>(key: string, defaultValue: T = null): Promise<T> {
    try {
      // First try memory cache
      if (this.memoryCache.has(key)) {
        const data = this.memoryCache.get(key);
        this.logger.debug(`📖 Loaded ${key} from memory cache`);
        return JSON.parse(JSON.stringify(data)); // Deep clone
      }

      // Then try file system (if not Vercel)
      if (!this.isVercel) {
        const filePath = this.getFilePath(key);
        
        if (fs.existsSync(filePath)) {
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          
          // Cache in memory for faster access
          this.memoryCache.set(key, JSON.parse(JSON.stringify(data)));
          
          this.logger.debug(`📖 Loaded ${key} from file: ${filePath}`);
          return data;
        }
      }

      // Return default value if nothing found
      if (defaultValue !== null) {
        await this.saveData(key, defaultValue);
        return defaultValue;
      }

      return null;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load ${key}:`, error.message);
      
      // Return default value on error
      if (defaultValue !== null) {
        await this.saveData(key, defaultValue);
        return defaultValue;
      }
      
      return null;
    }
  }

  /**
   * Delete data from both memory and file
   */
  async deleteData(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      // Remove from file system (if not Vercel)
      if (!this.isVercel) {
        const filePath = this.getFilePath(key);
        
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          this.logger.debug(`🗑️ Deleted ${key} from file: ${filePath}`);
        }
      }
      
      this.logger.debug(`🗑️ Deleted ${key} from memory cache`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to delete ${key}:`, error.message);
    }
  }

  /**
   * Check if data exists
   */
  async exists(key: string): Promise<boolean> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return true;
    }

    // Check file system (if not Vercel)
    if (!this.isVercel) {
      const filePath = this.getFilePath(key);
      return fs.existsSync(filePath);
    }

    return false;
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    const keys = new Set<string>();
    
    // Add memory cache keys
    for (const key of this.memoryCache.keys()) {
      keys.add(key);
    }

    // Add file system keys (if not Vercel)
    if (!this.isVercel) {
      try {
        const dataDir = this.getDataDirectory();
        if (fs.existsSync(dataDir)) {
          const files = await fs.promises.readdir(dataDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              keys.add(file.replace('.json', ''));
            }
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Failed to read data directory:`, error.message);
      }
    }

    return Array.from(keys);
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear file system (if not Vercel)
      if (!this.isVercel) {
        const dataDir = this.getDataDirectory();
        if (fs.existsSync(dataDir)) {
          const files = await fs.promises.readdir(dataDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              await fs.promises.unlink(path.join(dataDir, file));
            }
          }
        }
      }
      
      this.logger.log(`🗑️ Cleared all data`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to clear all data:`, error.message);
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    platform: string;
    memoryKeys: number;
    fileSystemAvailable: boolean;
    dataDirectory: string;
  } {
    return {
      platform: this.isRender ? 'Render' : this.isVercel ? 'Vercel' : 'Local',
      memoryKeys: this.memoryCache.size,
      fileSystemAvailable: !this.isVercel,
      dataDirectory: this.getDataDirectory(),
    };
  }
}
