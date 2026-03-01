import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookGuard } from './webhook.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) { }

    @Post('listener')
    @UseGuards(WebhookGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authorize.Net Webhook Listener' })
    async handleWebhook(@Body() payload: any) {
        console.log('Webhook Controller Hit!');
        // Process asynchronously to avoid timeout from Authorize.Net
        this.webhooksService.handleEvent(payload);
        return { status: 'received' };
    }
}
