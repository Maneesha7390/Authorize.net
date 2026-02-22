import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
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
                console.log('>>> ADD CARD: No customer found in DB, creating/syncing with Authorize.net...');
                let authNetId: string;
                try {
                    authNetId = await this.authNetService.createCustomerProfile(
                        user.email,
                        firstName,
                        lastName,
                    );
                    console.log('>>> ADD CARD: Created new Authorize.net customer ID:', authNetId);
                } catch (error: any) {
                    if (error.code === 'E00039') {
                        console.log('>>> ADD CARD: Customer already exists in Authorize.net, fetching ID...');
                        authNetId = await this.authNetService.getCustomerProfileIdByEmail(user.email);
                        if (!authNetId) {
                            throw new BadRequestException('Customer profile exists in Authorize.net but could not be retrieved.');
                        }
                        console.log('>>> ADD CARD: Synced existing Authorize.net customer ID:', authNetId);
                    } else {
                        throw error;
                    }
                }

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
                console.log('>>> ADD CARD: Existing customer found in DB:', customer.authorizeNetCustomerId);
            }

            // 3. Add Payment Profile
            // Authorize.net expects YYYY-MM format. Convert from MM/YY (e.g. "12/30" → "2030-12")
            if (!dto.expirationDate || !dto.expirationDate.includes('/')) {
                throw new BadRequestException('Invalid expiration date format. Expected MM/YY');
            }
            const [mm, yy] = dto.expirationDate.split('/');
            const cleanedExp = `20${yy}-${mm}`;
            console.log('>>> ADD CARD: Expiration converted:', dto.expirationDate, '→', cleanedExp);

            let authNetPaymentId: string;
            try {
                authNetPaymentId = await this.authNetService.createPaymentProfile(
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
            } catch (error: any) {
                if (error.code === 'E00039') {
                    console.log('>>> ADD CARD: Payment profile already exists in Authorize.net');
                    // Check if we already have this card in our MongoDB
                    const existingCard = await this.paymentProfileModel.findOne({
                        customerId: (customer._id as any).toString(),
                        last4: dto.cardNumber.slice(-4),
                    });

                    if (existingCard) {
                        console.log('>>> ADD CARD: Card already exists in MongoDB, returning existing data.');
                        return {
                            customerId: (customer._id as any).toString(),
                            authorizeNetCustomerId: customer.authorizeNetCustomerId,
                            paymentProfileId: (existingCard._id as any).toString(),
                            authorizeNetPaymentProfileId: existingCard.authorizeNetPaymentProfileId,
                            last4: existingCard.last4,
                            cardType: existingCard.cardType,
                            expirationDate: existingCard.expirationDate,
                            message: 'Card already exists and is ready for use',
                        };
                    } else {
                        // Card exists in Authorize.net but not in our DB. 
                        // Note: Authorize.net doesn't return the ID for a duplicate error.
                        // We would need to fetch all payment profiles and match, but for now, 
                        // we'll inform the user.
                        throw new ConflictException('This card is already registered in Authorize.net for this customer. Please use a different card or contact support to sync your profile.');
                    }
                }
                throw error;
            }

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
            // Re-throw NestJS exceptions, wrap others in 500 but keep message
            if (error.status) throw error;
            throw new BadRequestException(error.message || 'Error processing card addition');
        }
    }

    async create(createCustomerDto: CreateCustomerDto, userId: string): Promise<Customer> {
        const existing = await this.customerModel.findOne({ email: createCustomerDto.email });
        if (existing) {
            throw new ConflictException('Customer with this email already exists in our database');
        }

        // 1. Create Profile in Authorize.Net
        let authorizeNetCustomerId: string;
        try {
            authorizeNetCustomerId = await this.authNetService.createCustomerProfile(
                createCustomerDto.email,
                createCustomerDto.firstName,
                createCustomerDto.lastName,
            );
        } catch (error: any) {
            if (error.code === 'E00039') {
                throw new ConflictException('This email is already registered in Authorize.net. Please use the sync option or contact support.');
            }
            throw new BadRequestException(`Failed to create Authorize.net profile: ${error.message}`);
        }

        // 2. Save in MongoDB
        const customer = new this.customerModel({
            ...createCustomerDto,
            authorizeNetCustomerId,
            userId,
        });
        return customer.save();
    }

    async addPaymentProfile(customerId: string, dto: CreatePaymentProfileDto): Promise<PaymentProfile> {
        if (!customerId || customerId.length !== 24) {
            throw new BadRequestException('Invalid customerId format');
        }
        const customer = await this.customerModel.findById(customerId);
        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // 1. Create Payment Profile in Authorize.Net
        let authNetPaymentProfileId: string;
        try {
            authNetPaymentProfileId = await this.authNetService.createPaymentProfile(
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
        } catch (error: any) {
            if (error.code === 'E00039') {
                throw new ConflictException('This payment card already exists for this customer in Authorize.net');
            }
            throw new BadRequestException(`Failed to create payment profile in Authorize.net: ${error.message}`);
        }

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
        if (!customerId || customerId.length !== 24) {
            return []; // Return empty if invalid ID format instead of crashing
        }
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
        if (!id || id.length !== 24) {
            throw new NotFoundException('Customer not found (Invalid ID format)');
        }
        const customer = await this.customerModel.findById(id).exec();
        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }

    async getCardsByUserId(userId: string): Promise<PaymentProfile[]> {
        const customer = await this.customerModel.findOne({ userId });
        if (!customer) {
            return []; // No customer profile means no saved cards
        }
        return this.paymentProfileModel.find({ customerId: (customer._id as any).toString() } as any).exec();
    }
}
