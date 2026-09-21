import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { PaymentsService } from './payments.service';
import { TronService } from './tron.service';
import { TronWatcherService } from './tron-watcher.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  providers: [PaymentsService, TronService, TronWatcherService],
  exports: [PaymentsService, TronService],
})
export class PaymentsModule {}
