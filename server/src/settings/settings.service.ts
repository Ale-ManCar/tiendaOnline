import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StoreSettingsDto } from './dto/store-settings.dto';

const SETTINGS_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async find() {
    const row = await this.prisma.storeSetting.findUnique({ where: { id: SETTINGS_ID } });
    return row?.data ?? null;
  }

  async save(dto: StoreSettingsDto) {
    const data = { ...dto } as Prisma.InputJsonObject;
    const row = await this.prisma.storeSetting.upsert({
      where: { id: SETTINGS_ID },
      update: { data },
      create: { id: SETTINGS_ID, data },
    });
    return row.data;
  }
}
