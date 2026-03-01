"use client";

import React from "react";

interface SuccessPageProps {
  transactionData: {
    customerId: string;
    authorizeNetTransactionId: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    responseCode: string;
    responseText: string;
    rawResponse: {
      responseCode: string;
      authCode: string;
      avsResultCode: string;
      cvvResultCode: string;
      transId: string;
      accountNumber: string;
      accountType: string;
      messages: Array<{
        code: string;
        description: string;
      }>;
    };
    createdAt: string;
  };
  onClose: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  transactionData,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 ">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600">
            Your transaction has been processed successfully.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  ${transactionData.amount} {transactionData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">
                  {transactionData.authorizeNetTransactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">
                  {transactionData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Card:</span>
                <span className="font-medium">
                  {transactionData.rawResponse.accountType}{" "}
                  {transactionData.rawResponse.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auth Code:</span>
                <span className="font-medium">
                  {transactionData.rawResponse.authCode}
                </span>
              </div>
            </div>
          </div>

          {transactionData.rawResponse.messages &&
            transactionData.rawResponse.messages.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Message</h4>
                <p className="text-sm text-green-700">
                  {transactionData.rawResponse.messages[0].description}
                </p>
              </div>
            )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
