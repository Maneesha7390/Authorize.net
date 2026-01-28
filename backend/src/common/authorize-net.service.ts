import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIContracts, APIControllers, Constants } from 'authorizenet';

@Injectable()
export class AuthorizeNetService {
    private readonly logger = new Logger(AuthorizeNetService.name);
    private readonly merchantAuthentication: any;
    private readonly environment: string;

    constructor(private configService: ConfigService) {
        this.merchantAuthentication = new APIContracts.MerchantAuthenticationType();
        this.merchantAuthentication.setName(this.configService.get<string>('AUTHORIZE_NET_LOGIN_ID'));
        this.merchantAuthentication.setTransactionKey(this.configService.get<string>('AUTHORIZE_NET_TRANSACTION_KEY'));

        this.environment = this.configService.get<string>('AUTHORIZE_NET_ENVIRONMENT', 'sandbox');
    }

    getMerchantAuthentication() {
        return this.merchantAuthentication;
    }

    getEndpoint() {
        return this.environment === 'production'
            ? Constants.endpoint.production
            : Constants.endpoint.sandbox;
    }

    protected async execute(controller: any): Promise<any> {
        return new Promise((resolve, reject) => {
            controller.execute(() => {
                const apiResponse = controller.getResponse();
                if (!apiResponse) {
                    this.logger.error('Authorize.Net Error: No response');
                    return reject(new Error('No response from Authorize.Net'));
                }

                if (apiResponse.messages.resultCode === APIContracts.MessageTypeEnum.OK) {
                    resolve(apiResponse);
                } else {
                    const error = apiResponse.messages.message[0];
                    this.logger.error(`Authorize.Net Error: ${error.code} - ${error.text}`);
                    reject(new Error(error.text));
                }
            });
        });
    }

    // CIM: Create Customer Profile
    async createCustomerProfile(email: string, firstName: string, lastName: string): Promise<string> {
        const customerProfile = new APIContracts.CustomerProfileType();
        customerProfile.setMerchantCustomerId(`CUST_${Date.now()}`);
        customerProfile.setDescription(`${firstName} ${lastName}`);
        customerProfile.setEmail(email);

        const createRequest = new APIContracts.CreateCustomerProfileRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setProfile(customerProfile);

        const ctrl = new APIControllers.CreateCustomerProfileController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.customerProfileId;
    }

    // CIM: Create Payment Profile
    async createPaymentProfile(
        customerProfileId: string,
        cardData: { cardNumber: string; expirationDate: string; cardCode: string }
    ): Promise<string> {
        const creditCard = new APIContracts.CreditCardType();
        creditCard.setCardNumber(cardData.cardNumber);
        creditCard.setExpirationDate(cardData.expirationDate);
        creditCard.setCardCode(cardData.cardCode);

        const paymentType = new APIContracts.PaymentType();
        paymentType.setCreditCard(creditCard);

        const customerPaymentProfile = new APIContracts.CustomerPaymentProfileType();
        customerPaymentProfile.setCustomerType(APIContracts.CustomerTypeEnum.INDIVIDUAL);
        customerPaymentProfile.setPayment(paymentType);

        const createRequest = new APIContracts.CreateCustomerPaymentProfileRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setCustomerProfileId(customerProfileId);
        createRequest.setPaymentProfile(customerPaymentProfile);
        createRequest.setValidationMode(APIContracts.ValidationModeEnum.TESTMODE);

        const ctrl = new APIControllers.CreateCustomerPaymentProfileController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.customerPaymentProfileId;
    }

    // Payments: Charge Customer Profile
    async chargeCustomerProfile(
        customerProfileId: string,
        paymentProfileId: string,
        amount: number,
        immediateCapture: boolean = true,
    ): Promise<any> {
        const profileToCharge = new APIContracts.CustomerProfilePaymentType();
        profileToCharge.setCustomerProfileId(customerProfileId);

        const paymentProfile = new APIContracts.PaymentProfile();
        paymentProfile.setPaymentProfileId(paymentProfileId);

        profileToCharge.setPaymentProfile(paymentProfile);

        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(
            immediateCapture
                ? APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
                : APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
        );
        transactionRequestType.setAmount(amount);
        transactionRequestType.setProfile(profileToCharge);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Payments: Capture Previously Authorized Transaction
    async captureTransaction(transactionId: string, amount: number): Promise<any> {
        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION);
        transactionRequestType.setAmount(amount);
        transactionRequestType.setRefTransId(transactionId);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Payments: Void Transaction
    async voidTransaction(transactionId: string): Promise<any> {
        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.VOIDTRANSACTION);
        transactionRequestType.setRefTransId(transactionId);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Payments: Refund (Requires last 4 digits and expiration date)
    async refundTransaction(
        transactionId: string,
        amount: number,
        cardInfo: { cardType: string; last4: string; expirationDate: string }
    ): Promise<any> {
        const creditCard = new APIContracts.CreditCardType();
        creditCard.setCardNumber(cardInfo.last4);
        creditCard.setExpirationDate(cardInfo.expirationDate);

        const paymentType = new APIContracts.PaymentType();
        paymentType.setCreditCard(creditCard);

        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.REFUNDTRANSACTION);
        transactionRequestType.setAmount(amount);
        transactionRequestType.setPayment(paymentType);
        transactionRequestType.setRefTransId(transactionId);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Subscriptions (ARB): Create Subscription
    async createSubscription(
        customerProfileId: string,
        paymentProfileId: string,
        subscriptionData: {
            name: string;
            amount: number;
            intervalLength: number;
            intervalUnit: string;
            startDate: string;
            totalOccurrences: number;
            trialAmount?: number;
            trialOccurrences?: number;
        }
    ): Promise<string> {
        const interval = new APIContracts.PaymentScheduleType.Interval();
        interval.setLength(subscriptionData.intervalLength);
        interval.setUnit(subscriptionData.intervalUnit === 'months'
            ? APIContracts.ARBSubscriptionUnitEnum.MONTHS
            : APIContracts.ARBSubscriptionUnitEnum.DAYS);

        const paymentSchedule = new APIContracts.PaymentScheduleType();
        paymentSchedule.setInterval(interval);
        paymentSchedule.setStartDate(subscriptionData.startDate);
        paymentSchedule.setTotalOccurrences(subscriptionData.totalOccurrences);
        if (subscriptionData.trialOccurrences) {
            paymentSchedule.setTrialOccurrences(subscriptionData.trialOccurrences);
            paymentSchedule.setTrialAmount(subscriptionData.trialAmount || 0);
        }

        const customerProfile = new APIContracts.CustomerProfileIdType();
        customerProfile.setCustomerProfileId(customerProfileId);
        customerProfile.setCustomerPaymentProfileId(paymentProfileId);

        const subscriptionType = new APIContracts.ARBSubscriptionType();
        subscriptionType.setName(subscriptionData.name);
        subscriptionType.setPaymentSchedule(paymentSchedule);
        subscriptionType.setAmount(subscriptionData.amount);
        subscriptionType.setProfile(customerProfile);

        const createRequest = new APIContracts.ARBCreateSubscriptionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setSubscription(subscriptionType);

        const ctrl = new APIControllers.ARBCreateSubscriptionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.subscriptionId;
    }

    // Subscriptions (ARB): Cancel Subscription
    async cancelSubscription(subscriptionId: string): Promise<any> {
        const cancelRequest = new APIContracts.ARBCancelSubscriptionRequest();
        cancelRequest.setMerchantAuthentication(this.merchantAuthentication);
        cancelRequest.setSubscriptionId(subscriptionId);

        const ctrl = new APIControllers.ARBCancelSubscriptionController(cancelRequest.getJSON());
        return this.execute(ctrl);
    }

    // Subscriptions (ARB): Get Status
    async getSubscriptionStatus(subscriptionId: string): Promise<string> {
        const getRequest = new APIContracts.ARBGetSubscriptionStatusRequest();
        getRequest.setMerchantAuthentication(this.merchantAuthentication);
        getRequest.setSubscriptionId(subscriptionId);

        const ctrl = new APIControllers.ARBGetSubscriptionStatusController(getRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.status;
    }
}


