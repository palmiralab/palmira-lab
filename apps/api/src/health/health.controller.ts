import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';

class HealthResponse {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponse })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
