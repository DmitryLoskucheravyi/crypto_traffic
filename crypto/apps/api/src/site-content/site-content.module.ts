import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteContent, SiteContentSchema } from './site-content.schema';
import { SiteContentService } from './site-content.service';
import { SiteContentAdminController, SiteContentController } from './site-content.controller';
import { AdminModule } from '../admin/admin.module';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SiteContent.name, schema: SiteContentSchema }]),
    AdminModule,
  ],
  controllers: [SiteContentController, SiteContentAdminController],
  providers: [SiteContentService, JwtAuthGuard],
  exports: [SiteContentService],
})
export class SiteContentModule {}
