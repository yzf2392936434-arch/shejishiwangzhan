import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

import { CustomerMessagesService } from './customer-messages.service';
import type { CustomerMessage } from '@shared/api.interface';

class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorName?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

@Controller('api/public/customer-messages')
export class PublicCustomerMessagesController {
  constructor(private readonly customerMessagesService: CustomerMessagesService) {}

  @Post()
  async create(@Body() dto: CreateMessageDto): Promise<CustomerMessage> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('消息内容不能为空');
    }
    return this.customerMessagesService.createVisitorMessage(
      dto.sessionId,
      dto.visitorName,
      dto.content,
    );
  }

  @Get()
  async getMessages(@Query('sessionId') sessionId: string): Promise<CustomerMessage[]> {
    if (!sessionId) {
      throw new BadRequestException('sessionId 不能为空');
    }
    return this.customerMessagesService.getSessionMessages(sessionId);
  }
}
