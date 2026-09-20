import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseTier } from './course.schema';
import { UpsertCourseDto } from './dto/upsert-course.dto';

const DEFAULT_COURSES: Record<CourseTier, Omit<UpsertCourseDto, 'tier'>> = {
  basic: {
    title: 'Базовий курс',
    description: 'Вступ у криптовалюти: основи, гаманці, перші кроки.',
    price: 199,
    currency: 'USD',
    active: true,
  },
  medium: {
    title: 'Середній курс',
    description: 'Аналіз ринку, торгові стратегії, управління ризиками.',
    price: 499,
    currency: 'USD',
    active: true,
  },
  advanced: {
    title: 'Просунутий курс',
    description: 'Поглиблена торгівля, DeFi, портфельні стратегії.',
    price: 999,
    currency: 'USD',
    active: true,
  },
};

@Injectable()
export class CoursesService implements OnModuleInit {
  constructor(@InjectModel(Course.name) private readonly courseModel: Model<Course>) {}

  async onModuleInit() {
    const count = await this.courseModel.countDocuments();
    if (count === 0) {
      const docs = Object.entries(DEFAULT_COURSES).map(([tier, data]) => ({
        tier: tier as CourseTier,
        ...data,
      }));
      await this.courseModel.insertMany(docs);
    }
  }

  findAllActive() {
    return this.courseModel.find({ active: true }).sort({ tier: 1 }).exec();
  }

  findAll() {
    return this.courseModel.find().sort({ tier: 1 }).exec();
  }

  findByTier(tier: CourseTier) {
    return this.courseModel.findOne({ tier }).exec();
  }

  async upsert(dto: UpsertCourseDto) {
    return this.courseModel
      .findOneAndUpdate(
        { tier: dto.tier },
        { $set: dto },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
