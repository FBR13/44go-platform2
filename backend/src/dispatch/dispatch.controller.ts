import { Controller, Post, Body } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Controller('api/dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('respond')
  async respondToOffer(@Body() respondOfferDto: RespondOfferDto) {
    return this.dispatchService.handleCourierResponse(
      respondOfferDto.attemptId,
      respondOfferDto.courierId,
      respondOfferDto.action,
    );
  }
}