import { Global, Module, type DynamicModule } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from './app-config';

/** Раздаёт уже собранный конфиг всем модулям. Собирает его main.ts. */
@Global()
@Module({})
export class ConfigModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    };
  }
}
