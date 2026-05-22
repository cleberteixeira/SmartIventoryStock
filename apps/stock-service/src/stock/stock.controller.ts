import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  @Post('move')
  @ApiOperation({ summary: 'Registrar movimentação (Entrada/Saída)' })
  registerMovement(@Body() movementDto: any) {
    return { status: 'success', timestamp: new Date() };
  }

  @Get('balance/:productId')
  @ApiOperation({ summary: 'Consultar saldo por produto' })
  getBalance(@Param('productId') productId: string) {
    return { productId, quantity: 100 };
  }
}