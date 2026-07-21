import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { UserRole } from '../generated/prisma/enums';
import { SettingsService } from './settings.service';
import { StoreSettingsDto } from './dto/store-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get()
  find() {
    return this.settings.find();
  }

  @Roles(UserRole.ADMIN)
  @Put()
  save(@Body() dto: StoreSettingsDto) {
    return this.settings.save(dto);
  }
}
