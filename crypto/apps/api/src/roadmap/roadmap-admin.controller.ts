import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { RoadmapService } from './roadmap.service';
import {
  CreateRoadmapStageDto,
  ReorderRoadmapDto,
  UpdateRoadmapStageDto,
} from './dto/roadmap-stage.dto';

@UseGuards(JwtAuthGuard)
@Controller('admin/roadmap')
export class RoadmapAdminController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  findAll() {
    return this.roadmapService.findAll();
  }

  @Post()
  create(@Body() dto: CreateRoadmapStageDto) {
    return this.roadmapService.create(dto);
  }

  // Declared before ':id' would otherwise swallow 'reorder' as an id.
  @Patch('reorder')
  reorder(@Body() dto: ReorderRoadmapDto) {
    return this.roadmapService.reorder(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoadmapStageDto) {
    return this.roadmapService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roadmapService.remove(id);
  }
}
