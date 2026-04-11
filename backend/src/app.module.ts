import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { DispatchModule } from './dispatch/dispatch.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), SupabaseModule, AuthModule, UsersModule, StoresModule, ProductsModule, OrdersModule, DispatchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
