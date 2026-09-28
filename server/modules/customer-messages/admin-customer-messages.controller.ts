import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { IsString, IsNotEmpty } from 'class-validator';

import { CustomerMessagesService } from './customer-messages.service';
import type { CustomerMessage, CustomerSession } from '@shared/api.interface';

class ReplyDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

@NeedLogin()
@Controller('api/admin/customer-messages')
export class AdminCustomerMessagesController {
  constructor(private readonly customerMessagesService: CustomerMessagesService) {}

  @Get('unread-count')
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return this.customerMessagesService.getUnreadCount();
  }

  @Get()
  async getSessions(): Promise<{ sessions: CustomerSession[] }> {
    return this.customerMessagesService.getSessions();
  }

  @Post(':sessionId/reply')
  async reply(
    @Param('sessionId') sessionId: string,
    @Body() dto: ReplyDto,
  ): Promise<CustomerMessage> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('回复内容不能为空');
    }
    return this.customerMessagesService.adminReply(sessionId, dto.content);
  }

  @Patch(':sessionId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(@Param('sessionId') sessionId: string): Promise<void> {
    await this.customerMessagesService.markSessionRead(sessionId);
  }
}
