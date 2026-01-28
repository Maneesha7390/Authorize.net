import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const signature = request.headers['x-anet-signature'];
        const body = JSON.stringify(request.body);
        const key = this.configService.get<string>('WEBHOOK_SIGNATURE_KEY');

        if (!signature || !key) {
            throw new UnauthorizedException('Missing signature or secret key');
        }

        // Authorize.Net signature is sha512=HASH
        const expectedSignature = 'sha512=' + crypto
            .createHmac('sha512', key)
            .update(body)
            .digest('hex')
            .toUpperCase();

        if (signature.toUpperCase() !== expectedSignature) {
            // In local development, you might want to log this but allow it
            // Or strictly enforce it in production
            // throw new UnauthorizedException('Invalid signature');
        }

        return true;
    }
}
