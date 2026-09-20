import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdminUser, AdminUserSchema } from './admin-user.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
    CoursesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAuthGuard],
  exports: [JwtModule],
})
export class AdminModule {}
