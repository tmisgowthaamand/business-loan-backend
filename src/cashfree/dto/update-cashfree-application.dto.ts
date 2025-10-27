import { PartialType } from '@nestjs/mapped-types';
import { CreateCashfreeApplicationDto } from './create-cashfree-application.dto';

export class UpdateCashfreeApplicationDto extends PartialType(CreateCashfreeApplicationDto) {}
