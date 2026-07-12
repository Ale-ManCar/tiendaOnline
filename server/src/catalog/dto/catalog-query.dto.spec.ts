import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CatalogQueryDto } from './catalog-query.dto';
describe('CatalogQueryDto', () => {
  it('transforms pagination and availability filters', async () => {
    const dto = plainToInstance(CatalogQueryDto, {
      page: '2',
      limit: '12',
      inStock: 'true',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, limit: 12, inStock: true });
  });
  it('rejects invalid prices and oversized pages', async () => {
    const dto = plainToInstance(CatalogQueryDto, {
      minPrice: '-1',
      limit: '500',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
