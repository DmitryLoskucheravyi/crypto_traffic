import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { SiteContentService } from './site-content.service';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get()
  findPublic() {
    return this.service.findPublic();
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/site-content')
export class SiteContentAdminController {
  constructor(private readonly service: SiteContentService) {}

  @Get()
  findForAdmin() {
    return this.service.findForAdmin();
  }

  @Put()
  update(@Body() dto: UpdateSiteContentDto) {
    return this.service.update(dto);
  }
}
