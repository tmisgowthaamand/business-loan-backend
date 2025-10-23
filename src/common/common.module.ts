import { Module, Global } from '@nestjs/common';
import { PersistenceService } from './services/persistence.service';
import { IdGeneratorService } from './services/id-generator.service';

@Global()
@Module({
  providers: [PersistenceService, IdGeneratorService],
  exports: [PersistenceService, IdGeneratorService],
})
export class CommonModule {}
