import { Module } from '@nestjs/common';
import { CustomerMessagesService } from './customer-messages.service';
import { PublicCustomerMessagesController } from './public-customer-messages.controller';
import { AdminCustomerMessagesController } from './admin-customer-messages.controller';

@Module({
  controllers: [PublicCustomerMessagesController, AdminCustomerMessagesController],
  providers: [CustomerMessagesService],
  exports: [CustomerMessagesService],
})
export class CustomerMessagesModule {}
