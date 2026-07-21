import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Public()
  @Get('categories') categories() {
    return this.catalog.categories();
  }
  @Public()
  @Get('products') products(@Query() query: CatalogQueryDto) {
    return this.catalog.products(query);
  }
  @Public()
  @Get('products/:id') product(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.product(id);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Post('admin/categories')
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Patch('admin/categories/:id')
  updateCategory(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpsertCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Delete('admin/categories/:id')
  deleteCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.deleteCategory(id);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Post('admin/products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Patch('admin/products/:id')
  updateProduct(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpsertProductDto) {
    return this.catalog.updateProduct(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.CATALOG_MANAGER)
  @Delete('admin/products/:id')
  deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.archiveProduct(id);
  }
}
