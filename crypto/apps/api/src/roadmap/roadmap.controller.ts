import { Controller, Get } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  findAllActive() {
    return this.roadmapService.findAllActive();
  }
}
