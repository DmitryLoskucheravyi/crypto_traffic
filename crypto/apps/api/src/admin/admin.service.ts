import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from './admin-user.schema';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectModel(AdminUser.name) private readonly adminModel: Model<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;

    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminModel
      .findOneAndUpdate(
        { email },
        { $set: { email, passwordHash } },
        { upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async login(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email: email.toLowerCase() }).exec();
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({ sub: admin.id, email: admin.email });
    return { accessToken: token };
  }
}
