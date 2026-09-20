import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoadmapStage } from './roadmap-stage.schema';
import {
  CreateRoadmapStageDto,
  ReorderRoadmapDto,
  UpdateRoadmapStageDto,
} from './dto/roadmap-stage.dto';

@Injectable()
export class RoadmapService {
  constructor(
    @InjectModel(RoadmapStage.name) private readonly stageModel: Model<RoadmapStage>,
  ) {}

  // No seeding: an empty collection is a valid state. The landing section
  // simply does not render until the owner adds stages in the admin panel.

  findAllActive() {
    return this.stageModel.find({ active: true }).sort({ order: 1 }).exec();
  }

  findAll() {
    return this.stageModel.find().sort({ order: 1 }).exec();
  }

  async create(dto: CreateRoadmapStageDto) {
    const last = await this.stageModel.findOne().sort({ order: -1 }).exec();
    const order = dto.order ?? (last ? last.order + 1 : 1);
    const created = await this.stageModel.create({ ...dto, order });
    await this.resequence();
    return this.stageModel.findById(created._id).exec();
  }

  async update(id: string, dto: UpdateRoadmapStageDto) {
    const updated = await this.stageModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Stage not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.stageModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Stage not found');
    await this.resequence();
    return { ok: true };
  }

  async reorder(dto: ReorderRoadmapDto) {
    if (dto.items.length) {
      await this.stageModel.bulkWrite(
        dto.items.map(({ id, order }) => ({
          updateOne: { filter: { _id: id }, update: { $set: { order } } },
        })),
      );
    }
    await this.resequence();
    return this.findAll();
  }

  // Collapses gaps and duplicate positions back into a clean 1..N sequence.
  // Called after every mutation so the admin list and the landing page always
  // agree on what "stage 3" means.
  private async resequence() {
    const stages = await this.stageModel.find().sort({ order: 1, createdAt: 1 }).exec();
    const writes = stages
      .map((stage, index) => ({ stage, next: index + 1 }))
      .filter(({ stage, next }) => stage.order !== next)
      .map(({ stage, next }) => ({
        updateOne: { filter: { _id: stage._id }, update: { $set: { order: next } } },
      }));

    if (writes.length) await this.stageModel.bulkWrite(writes);
  }
}
