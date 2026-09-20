import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { CoursesService } from '../courses/courses.service';
import { UpsertCourseDto } from '../courses/dto/upsert-course.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly coursesService: CoursesService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.adminService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('courses')
  findAllCourses() {
    return this.coursesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put('courses')
  upsertCourse(@Body() dto: UpsertCourseDto) {
    return this.coursesService.upsert(dto);
  }
}
