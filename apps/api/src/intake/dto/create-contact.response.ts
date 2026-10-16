import { ApiProperty } from '@nestjs/swagger';

export class CreateContactResponse {
  @ApiProperty({ format: 'uuid' })
  leadId!: string;
}
