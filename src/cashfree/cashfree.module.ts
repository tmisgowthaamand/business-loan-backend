import { Module, forwardRef } from '@nestjs/common';
import { CashfreeController } from './cashfree.controller';
import { CashfreeService } from './cashfree.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ShortlistModule } from '../shortlist/shortlist.module';

@Module({
  imports: [
    forwardRef(() => SupabaseModule),
    forwardRef(() => ShortlistModule)
  ],
  controllers: [CashfreeController],
  providers: [CashfreeService, PrismaService],
  exports: [CashfreeService], // Export CashfreeService so it can be used in other modules
})
export class CashfreeModule {
  constructor() {
    console.log('🔄 CashfreeModule loaded successfully');
  }
}
