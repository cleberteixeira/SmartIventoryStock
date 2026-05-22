import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Post()
  @ApiOperation({ summary: 'Criar novo produto' })
  create(@Body() createProductDto: any) {
    return { message: 'Produto criado com sucesso', data: createProductDto };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  findAll(@Query('category') category?: string) {
    return []; // Implementação com Prisma viria aqui
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }
}