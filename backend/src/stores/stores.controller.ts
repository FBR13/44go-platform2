import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FastDeliveryQueryDto } from './dto/fast-delivery.dto';

@Controller('api/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) { }

  @Post()
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get('fast-delivery')
  async getFastDeliveryStores(@Query() query: FastDeliveryQueryDto) {
    // Convertendo para número caso venha como string na URL
    return this.storesService.findFastDeliveryStores(Number(query.lat), Number(query.lng));
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}