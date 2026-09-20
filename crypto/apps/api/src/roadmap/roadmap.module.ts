import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoadmapStage, RoadmapStageSchema } from './roadmap-stage.schema';
import { RoadmapService } from './roadmap.service';
import { RoadmapController } from './roadmap.controller';
import { RoadmapAdminController } from './roadmap-admin.controller';
import { AdminModule } from '../admin/admin.module';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

@Module({
  // AdminModule re-exports JwtModule, which is what JwtAuthGuard needs here.
  imports: [
    MongooseModule.forFeature([{ name: RoadmapStage.name, schema: RoadmapStageSchema }]),
    AdminModule,
  ],
  controllers: [RoadmapController, RoadmapAdminController],
  providers: [RoadmapService, JwtAuthGuard],
  exports: [RoadmapService],
})
export class RoadmapModule {}
