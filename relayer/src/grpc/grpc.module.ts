import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { GrpcClientService } from './grpc-client.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'COW_EVENT_PACKAGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'cow_event',
            protoPath: join(process.cwd(), 'proto', 'cow_event.proto'),
            url: `${configService.get<string>('GRPC_HOST', 'localhost')}:${configService.get<number>('GRPC_PORT', 50051)}`,
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [GrpcClientService],
  exports: [GrpcClientService],
})
export class GrpcModule {}
