import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('categories') categories() {
    return this.catalog.categories();
  }
  @Get('products') products(@Query() query: CatalogQueryDto) {
    return this.catalog.products(query);
  }
  @Get('products/:id') product(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.product(id);
  }
}
