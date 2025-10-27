import { Module } from '@nestjs/common';
import { CashfreeController } from './cashfree.controller';
import { CashfreeService } from './cashfree.service';
import { ShortlistModule } from '../shortlist/shortlist.module';

@Module({
  imports: [ShortlistModule],
  controllers: [CashfreeController],
  providers: [CashfreeService],
  exports: [CashfreeService],
})
export class CashfreeModule {}
