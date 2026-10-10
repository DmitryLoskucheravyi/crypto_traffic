import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoOrderRepository } from './mongo/mongo-order.repository';
import { ORDER_MODEL, OrderSchema } from './mongo/order.schema';
import { OrderEvents } from './order-events';
import { OrderRepository } from './order.repository';
import { PaymentsService } from './payments.service';
import { TronGridClient } from './tron/trongrid.client';
import { TronWatcherService } from './tron-watcher.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ORDER_MODEL, schema: OrderSchema }])],
  providers: [
    // Порт → адаптер: остальной код знает только OrderRepository.
    { provide: OrderRepository, useClass: MongoOrderRepository },
    OrderEvents,
    PaymentsService,
    TronGridClient,
    TronWatcherService,
  ],
  exports: [PaymentsService, OrderEvents],
})
export class PaymentsModule {}
