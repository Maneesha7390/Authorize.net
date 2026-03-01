import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      //window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  authorizeNetCustomerId: string;
}

export interface PaymentProfile {
  _id: string;
  customerId: string;
  authorizeNetPaymentProfileId: string;
  cardType: string;
  last4: string;
  expirationDate: string;
  isDefault: boolean;
}

export interface CreatePaymentProfileData {
  cardNumber: string;
  expirationDate: string;
  cardCode: string;
  cardType: string;
}

export interface ChargeData {
  opaqueData: {
    dataDescriptor: string;
    dataValue: string;
  };
  amount: number;
  immediateCapture?: boolean;
}

export interface UserData {
  user: {
    _id: string;
    email: string;
    role: string;
  };
  customer: {
    _id: string;
    authorizeNetCustomerId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  transactionCount: number;
  transactions: Array<{
    _id: string;
    userId: string;
    authorizeNetTransactionId: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    responseCode: string;
    responseText: string;
    createdAt: string;
  }>;
  subscriptions: any[];
}

export interface RegisterData {
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  role: string;
}
export interface RefundData {
  transactionId: string;
  amount: number;
  last4: string;
  expirationDate: string;
  cardType: string;
  reason?: string;
}

export interface CreateSubscriptionData {
  customerId: string;
  paymentProfileId: string;
  planId: string;
}

export interface Plan {
  _id: string;
  name: string;
  description: string;
  amount: number;
  intervalLength: number;
  intervalUnit: string;
  totalOccurrences: number;
  trialAmount: number;
  trialOccurrences: number;
  isActive: boolean;
}

export const apiService = {
  register: (data: RegisterData) =>
    api.post("/auth/register", data).then((res) => res.data),

  login: (data: LoginData) =>
    api.post<LoginResponse>("/auth/login", data).then((res) => res.data),

  createCustomer: (data: {
    email: string;
    firstName: string;
    lastName: string;
  }) => api.post<Customer>("/customers", data).then((res) => res.data),

  addPaymentProfile: (data: CreatePaymentProfileData) =>
    api
      .post<PaymentProfile>(`/customers/add-card`, data)
      .then((res) => res.data),

  getCustomers: () => api.get<Customer[]>("/customers").then((res) => res.data),

  getCustomerDetails: (customerId: string) =>
    api.get<Customer>(`/customers/${customerId}`).then((res) => res.data),

  getPaymentProfiles: (customerId: string) =>
    api
      .get<PaymentProfile[]>(`/customers/${customerId}/payment-profiles`)
      .then((res) => res.data),

  getCards: () =>
    api.get<PaymentProfile[]>("/customers/cards").then((res) => res.data),

  chargeProfile: (data: ChargeData) =>
    api.post("/payments/charge/opaque", data).then((res) => res.data),

  captureTransaction: (transactionId: string) =>
    api.post(`/payments/${transactionId}/capture`).then((res) => res.data),

  refundTransaction: (data: RefundData) =>
    api.post("/payments/refund", data).then((res) => res.data),

  voidTransaction: (transactionId: string) =>
    api.put(`/payments/${transactionId}/void`).then((res) => res.data),

  getPlans: () => api.get<Plan[]>("/plans?all=all").then((res) => res.data),

  createSubscription: (data: CreateSubscriptionData) =>
    api.post("/subscriptions", data).then((res) => res.data),

  createPlan: (data: {
    name: string;
    description: string;
    amount: number;
    intervalLength: number;
    intervalUnit: string;
    totalOccurrences: number;
    trialAmount: number;
    trialOccurrences: number;
  }) => api.post("/plans", data).then((res) => res.data),

  updatePlan: (
    planId: string,
    data: {
      name: string;
      description: string;
      amount: number;
      isActive: boolean;
    }
  ) => api.put(`/plans/${planId}`, data).then((res) => res.data),

  deletePlan: (planId: string) =>
    api.delete(`/plans/${planId}`).then((res) => res.data),

  getAllUsers: () =>
    api.get<UserData[]>("/admin/users").then((res) => res.data),

  getSubscriptionStatus: (customerId: string) =>
    api.get(`/subscriptions/customer/${customerId}`).then((res) => res.data),

  upgradeSubscription: (subscriptionId: string, newPlanId: string) =>
    api
      .put(`/subscriptions/${subscriptionId}/upgrade`, { newPlanId })
      .then((res) => res.data),

  cancelSubscription: (subscriptionId: string) =>
    api.put(`/subscriptions/${subscriptionId}/cancel`).then((res) => res.data),

  createHostedPayment: (data: {
    amount: number;
    immediateCapture: boolean;
    returnUrl: string;
    cancelUrl: string;
  }) => api.post("/payments/hosted-payment", data).then((res) => res.data),
};
