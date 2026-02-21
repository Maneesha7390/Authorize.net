import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { User } from '../../schemas/user.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreatePaymentProfileDto } from './dto/create-payment-profile.dto';
import { AddCardDto, AddCardResponseDto } from './dto/add-card.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        @InjectModel(User.name) private userModel: Model<User>,
        private authNetService: AuthorizeNetService,
    ) { }

    async addCardAndSyncCustomer(dto: AddCardDto, userId: string): Promise<AddCardResponseDto> {
        try {
            // 1. Fetch user details from DB (email, firstName, lastName not needed from frontend)
            const user = await this.userModel.findById(userId);
            if (!user) throw new NotFoundException('Logged-in user not found');

            console.log('>>> ADD CARD: User found:', user.email, 'userId:', userId);

            // Extract name parts from email if not stored separately
            const emailParts = user.email.split('@')[0].split('.');
            const firstName = (user as any).firstName || emailParts[0] || 'User';
            const lastName = (user as any).lastName || emailParts[1] || 'User';

            console.log('>>> ADD CARD: Name:', firstName, lastName);

            // 2. Find or Create Customer in Authorize.Net + MongoDB
            let customer = await this.customerModel.findOne({ userId });

            if (!customer) {
                console.log('>>> ADD CARD: No customer found, creating new one...');
                const authNetId = await this.authNetService.createCustomerProfile(
                    user.email,
                    firstName,
                    lastName,
                );
                console.log('>>> ADD CARD: Authorize.net customer ID:', authNetId);

                customer = new this.customerModel({
                    email: user.email,
                    firstName,
                    lastName,
                    authorizeNetCustomerId: authNetId,
                    userId,
                });
                await customer.save();
                console.log('>>> ADD CARD: Customer saved in MongoDB');
            } else {
                console.log('>>> ADD CARD: Existing customer found:', customer.authorizeNetCustomerId);
            }

            // 3. Add Payment Profile
            // Authorize.net expects YYYY-MM format. Convert from MM/YY (e.g. "12/30" → "2030-12")
            const [mm, yy] = dto.expirationDate.split('/');
            const cleanedExp = `20${yy}-${mm}`;
            console.log('>>> ADD CARD: Expiration converted:', dto.expirationDate, '→', cleanedExp);

            const authNetPaymentId = await this.authNetService.createPaymentProfile(
                customer.authorizeNetCustomerId,
                {
                    cardNumber: dto.cardNumber,
                    expirationDate: cleanedExp,
                    cardCode: dto.cardCode,
                },
                {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                }
            );
            console.log('>>> ADD CARD: Payment profile created:', authNetPaymentId);

            const paymentProfile = new this.paymentProfileModel({
                customerId: customer._id,
                authorizeNetPaymentProfileId: authNetPaymentId,
                cardType: dto.cardType,
                last4: dto.cardNumber.slice(-4),
                expirationDate: dto.expirationDate,
            });
            await paymentProfile.save();

            // 4. Return all IDs needed for subscription
            return {
                customerId: (customer._id as any).toString(),
                authorizeNetCustomerId: customer.authorizeNetCustomerId,
                paymentProfileId: (paymentProfile._id as any).toString(),
                authorizeNetPaymentProfileId: paymentProfile.authorizeNetPaymentProfileId,
                last4: paymentProfile.last4,
                cardType: paymentProfile.cardType,
                expirationDate: paymentProfile.expirationDate,
                message: 'Customer and card ready for subscription',
            };
        } catch (error: any) {
            console.error('>>> ADD CARD ERROR:', error.message || error);
            throw error;
        }
    }

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

    async findPaymentProfiles(customerId: string): Promise<PaymentProfile[]> {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            throw new NotFoundException('Customer not found');
        }
        return this.paymentProfileModel.find({ customerId: customer.id }).exec();
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
