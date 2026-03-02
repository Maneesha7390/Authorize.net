import { APIContracts, APIControllers, Constants } from 'authorizenet';

export class AuthorizeNetService {
    private readonly merchantAuthentication: any;
    private readonly environment: string;

    constructor() {
        this.merchantAuthentication = new APIContracts.MerchantAuthenticationType();
        this.merchantAuthentication.setName(process.env.AUTHORIZE_NET_LOGIN_ID);
        this.merchantAuthentication.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);
        this.environment = process.env.AUTHORIZE_NET_ENVIRONMENT || "sandbox";
    }

    getMerchantAuthentication() {
        return this.merchantAuthentication;
    }

    getEndpoint() {
        return this.environment === "production"
            ? Constants.endpoint.production
            : Constants.endpoint.sandbox;
    }

    protected async execute(controller: any): Promise<any> {
        return new Promise((resolve, reject) => {
            controller.execute(() => {
                const apiResponse = controller.getResponse();
                if (!apiResponse) {
                    console.error("Authorize.Net Error: No response");
                    return reject(new Error("No response from Authorize.Net"));
                }

                if (apiResponse.messages.resultCode === APIContracts.MessageTypeEnum.OK) {
                    resolve(apiResponse);
                } else {
                    const error = apiResponse.messages.message[0];
                    console.error(`Authorize.Net Error: ${error.code} - ${error.text}`);
                    const customError = new Error(error.text) as any;
                    customError.code = error.code;
                    reject(customError);
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

    // CIM: Get Customer Profile ID by Email
    async getCustomerProfileIdByEmail(email: string): Promise<string | null> {
        try {
            const getRequest = new APIContracts.GetCustomerProfileRequest();
            getRequest.setMerchantAuthentication(this.merchantAuthentication);
            getRequest.setEmail(email);

            const ctrl = new APIControllers.GetCustomerProfileController(getRequest.getJSON());
            const response = await this.execute(ctrl);
            return response.profile.customerProfileId;
        } catch (error: any) {
            console.warn(`Could not find customer profile by email ${email}: ${error.message}`);
            return null;
        }
    }

    // CIM: Create Payment Profile
    async createPaymentProfile(
        customerProfileId: string,
        cardData: { cardNumber: string; expirationDate: string; cardCode: string },
        billTo?: { firstName: string; lastName: string }
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

        if (billTo) {
            const billToAddress = new APIContracts.CustomerAddressType();
            billToAddress.setFirstName(billTo.firstName);
            billToAddress.setLastName(billTo.lastName);
            customerPaymentProfile.setBillTo(billToAddress);
        }

        const createRequest = new APIContracts.CreateCustomerPaymentProfileRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setCustomerProfileId(customerProfileId);
        createRequest.setPaymentProfile(customerPaymentProfile);
        createRequest.setValidationMode(APIContracts.ValidationModeEnum.TESTMODE);

        const ctrl = new APIControllers.CreateCustomerPaymentProfileController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.customerPaymentProfileId;
    }

    // CIM: Get Payment Profiles
    async getCustomerPaymentProfiles(customerProfileId: string): Promise<any[]> {
        const getRequest = new APIContracts.GetCustomerProfileRequest();
        getRequest.setMerchantAuthentication(this.merchantAuthentication);
        getRequest.setCustomerProfileId(customerProfileId);

        const ctrl = new APIControllers.GetCustomerProfileController(getRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.profile.paymentProfiles || [];
    }

    // Payments: Charge Customer Profile
    async chargeCustomerProfile(
        customerProfileId: string,
        paymentProfileId: string,
        amount: number,
        immediateCapture: boolean = true
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

    // Payments: Charge Raw Card
    async chargeRawCard(
        cardData: { cardNumber: string; expirationDate: string; cardCode: string },
        amount: number,
        immediateCapture: boolean = true
    ): Promise<any> {
        const creditCard = new APIContracts.CreditCardType();
        creditCard.setCardNumber(cardData.cardNumber);
        creditCard.setExpirationDate(cardData.expirationDate);
        creditCard.setCardCode(cardData.cardCode);

        const paymentType = new APIContracts.PaymentType();
        paymentType.setCreditCard(creditCard);

        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(
            immediateCapture
                ? APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
                : APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
        );
        transactionRequestType.setAmount(amount);
        transactionRequestType.setPayment(paymentType);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Payments: Charge Opaque Token (Accept.js)
    async chargeOpaqueToken(
        opaqueData: { dataDescriptor: string; dataValue: string },
        amount: number,
        immediateCapture: boolean = true
    ): Promise<any> {
        const opaqueType = new APIContracts.OpaqueDataType();
        opaqueType.setDataDescriptor(opaqueData.dataDescriptor);
        opaqueType.setDataValue(opaqueData.dataValue);

        const paymentType = new APIContracts.PaymentType();
        paymentType.setOpaqueData(opaqueType);

        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(
            immediateCapture
                ? APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
                : APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
        );
        transactionRequestType.setAmount(amount);
        transactionRequestType.setPayment(paymentType);

        const createRequest = new APIContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(this.merchantAuthentication);
        createRequest.setTransactionRequest(transactionRequestType);

        const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.transactionResponse;
    }

    // Payments: Capture Transaction
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

    // Payments: Refund Transaction
    async refundTransaction(
        transactionId: string,
        amount: number,
        cardInfo: { last4: string; expirationDate: string }
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

    // Payments: Create Hosted Payment Page Token
    async createHostedPaymentPage(
        amount: number,
        returnUrl: string,
        cancelUrl: string,
        transactionType: string,
        refId: string
    ): Promise<string> {
        const transactionRequestType = new APIContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(transactionType as any);
        transactionRequestType.setAmount(amount);
        transactionRequestType.setRefId(refId);

        const setting1 = new APIContracts.SettingType();
        setting1.setSettingName("hostedPaymentButtonOptions");
        setting1.setSettingValue('{"text": "Pay Now"}');

        const setting2 = new APIContracts.SettingType();
        setting2.setSettingName("hostedPaymentOrderOptions");
        setting2.setSettingValue('{"show": false}');

        const setting3 = new APIContracts.SettingType();
        setting3.setSettingName("hostedPaymentReturnOptions");
        setting3.setSettingValue(
            `{"showReceipt": true, "url": "${returnUrl}", "urlText": "Return to Dashboard", "cancelUrl": "${cancelUrl}", "cancelUrlText": "Go Back"}`
        );

        const settingList = [setting1, setting2, setting3];
        const hostedPaymentSettings = new APIContracts.ArrayOfSettingType();
        hostedPaymentSettings.setSetting(settingList);

        const getRequest = new APIContracts.GetHostedPaymentPageRequest();
        getRequest.setMerchantAuthentication(this.merchantAuthentication);
        getRequest.setTransactionRequest(transactionRequestType);
        getRequest.setHostedPaymentSettings(hostedPaymentSettings);

        const ctrl = new APIControllers.GetHostedPaymentPageController(getRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.token;
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
        let unit = APIContracts.ARBSubscriptionUnitEnum.DAYS;
        let length = subscriptionData.intervalLength;

        if (subscriptionData.intervalUnit === "months") {
            unit = APIContracts.ARBSubscriptionUnitEnum.MONTHS;
        } else if (subscriptionData.intervalUnit === "years") {
            unit = APIContracts.ARBSubscriptionUnitEnum.MONTHS;
            length = subscriptionData.intervalLength * 12;
        } else if (subscriptionData.intervalUnit === "weeks") {
            unit = APIContracts.ARBSubscriptionUnitEnum.DAYS;
            length = subscriptionData.intervalLength * 7;
        }

        interval.setLength(length);
        interval.setUnit(unit);

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

    // Subscriptions (ARB): Get Full Details
    async getSubscription(subscriptionId: string): Promise<any> {
        const getRequest = new APIContracts.ARBGetSubscriptionRequest();
        getRequest.setMerchantAuthentication(this.merchantAuthentication);
        getRequest.setSubscriptionId(subscriptionId);
        getRequest.setIncludeTransactions(false);

        const ctrl = new APIControllers.ARBGetSubscriptionController(getRequest.getJSON());
        const response = await this.execute(ctrl);
        return response.subscription;
    }

    // Subscriptions (ARB): Update Subscription
    async updateSubscription(
        subscriptionId: string,
        updateData: {
            name?: string;
            amount?: number;
            paymentProfileId?: string;
            customerProfileId?: string;
            intervalLength?: number;
            intervalUnit?: string;
            totalOccurrences?: number;
            status?: string;
        }
    ): Promise<any> {
        const subscriptionType = new APIContracts.ARBSubscriptionType();
        if (updateData.name) subscriptionType.setName(updateData.name);
        if (updateData.amount) subscriptionType.setAmount(updateData.amount);
        if (updateData.totalOccurrences !== undefined) {
            const paymentSchedule = new APIContracts.PaymentScheduleType();
            paymentSchedule.setTotalOccurrences(updateData.totalOccurrences);
            subscriptionType.setPaymentSchedule(paymentSchedule);
        }

        if (updateData.intervalLength && updateData.intervalUnit) {
            const interval = new APIContracts.PaymentScheduleType.Interval();
            let unit = APIContracts.ARBSubscriptionUnitEnum.DAYS;
            let length = updateData.intervalLength;

            if (updateData.intervalUnit === "months") {
                unit = APIContracts.ARBSubscriptionUnitEnum.MONTHS;
            } else if (updateData.intervalUnit === "years") {
                unit = APIContracts.ARBSubscriptionUnitEnum.MONTHS;
                length = updateData.intervalLength * 12;
            } else if (updateData.intervalUnit === "weeks") {
                unit = APIContracts.ARBSubscriptionUnitEnum.DAYS;
                length = updateData.intervalLength * 7;
            }

            interval.setLength(length);
            interval.setUnit(unit);

            const paymentSchedule = new APIContracts.PaymentScheduleType();
            paymentSchedule.setInterval(interval);
            subscriptionType.setPaymentSchedule(paymentSchedule);
        }

        if (updateData.customerProfileId && updateData.paymentProfileId) {
            const customerProfile = new APIContracts.CustomerProfileIdType();
            customerProfile.setCustomerProfileId(updateData.customerProfileId);
            customerProfile.setCustomerPaymentProfileId(updateData.paymentProfileId);
            subscriptionType.setProfile(customerProfile);
        }

        const updateRequest = new APIContracts.ARBUpdateSubscriptionRequest();
        updateRequest.setMerchantAuthentication(this.merchantAuthentication);
        updateRequest.setSubscriptionId(subscriptionId);
        updateRequest.setSubscription(subscriptionType);

        const ctrl = new APIControllers.ARBUpdateSubscriptionController(updateRequest.getJSON());
        return this.execute(ctrl);
    }
}

export const authNetService = new AuthorizeNetService();
