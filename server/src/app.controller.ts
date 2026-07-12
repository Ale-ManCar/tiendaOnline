import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'nova-store-api',
      timestamp: new Date().toISOString(),
    };
  }
}
