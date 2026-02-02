import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreatePaymentProfileDto } from './dto/create-payment-profile.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        private authNetService: AuthorizeNetService,
    ) { }

    async create(createCustomerDto: CreateCustomerDto, userId: string): Promise<Customer> {
        const existing = await this.customerModel.findOne({ email: createCustomerDto.email });
        if (existing) {
            throw new ConflictException('Customer with this email already exists');
        }

        // 1. Create Profile in Authorize.Net
        const authorizeNetCustomerId = await this.authNetService.createCustomerProfile(
            createCustomerDto.email,
            createCustomerDto.firstName,
            createCustomerDto.lastName,
        );

        // 2. Save in MongoDB
        const customer = new this.customerModel({
            ...createCustomerDto,
            authorizeNetCustomerId,
            userId,
        });
        return customer.save();
    }

    async addPaymentProfile(customerId: string, dto: CreatePaymentProfileDto): Promise<PaymentProfile> {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // 1. Create Payment Profile in Authorize.Net
        const authNetPaymentProfileId = await this.authNetService.createPaymentProfile(
            customer.authorizeNetCustomerId,
            {
                cardNumber: dto.cardNumber,
                expirationDate: dto.expirationDate,
                cardCode: dto.cardCode,
            },
            {
                firstName: customer.firstName,
                lastName: customer.lastName,
            }
        );

        // 2. Save in MongoDB
        const paymentProfile = new this.paymentProfileModel({
            customerId: customer._id,
            authorizeNetPaymentProfileId: authNetPaymentProfileId,
            cardType: dto.cardType,
            last4: dto.cardNumber.slice(-4),
            expirationDate: dto.expirationDate,
        });

        return paymentProfile.save();
    }

    async findAll(): Promise<Customer[]> {
        return this.customerModel.find().exec();
    }

    async findOne(id: string): Promise<Customer> {
        const customer = await this.customerModel.findById(id).exec();
        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }
}
