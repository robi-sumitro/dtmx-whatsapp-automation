import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { WaService } from './wa.service';

@Controller('wa')
export class WaController {
  constructor(private readonly wa: WaService) {}

  @Post('connect')
  connect(@Body() body: any) {
    return this.wa.connectBusiness({
      businessName: body.businessName,
      phoneNumberId: body.phoneNumberId,
      wabaId: body.wabaId,
      accessToken: body.accessToken,
    });
  }

  @Get('businesses')
  listBusiness() {
    return this.wa.listBusiness();
  }

  @Get('conversations')
  conversations(
    @Query('businessId') businessId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wa.getConversations(
      businessId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('conversations/:id/messages')
  messages(@Param('id') id: string) {
    return this.wa.getConversationMessages(id);
  }
}