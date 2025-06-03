import crypto from 'crypto';

interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  env: 'sandbox' | 'production';
}

interface PaymentRequest {
  amount: number;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  requestType?: 'captureWallet' | 'payWithATM';
}

export class MomoPayment {
  private config: MomoConfig;

  constructor(config: MomoConfig) {
    this.config = config;
  }

  private get baseUrl() {
    return this.config.env === 'production' 
      ? 'https://payment.momo.vn/v2/gateway/api/create'
      : 'https://test-payment.momo.vn/v2/gateway/api/create';
  }

  async createPayment(request: PaymentRequest) {
    const {
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData = '',
      requestType = 'captureWallet'
    } = request;

    const requestId = this.config.partnerCode + Date.now();
    const rawSignature = [
      `accessKey=${this.config.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${this.config.partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`
    ].join('&');

    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'en'
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Failed to create MoMo payment');
    }

    return response.json();
  }
}

export const momoClient = new MomoPayment({
  partnerCode: process.env.MOMO_PARTNER_CODE!,
  accessKey: process.env.MOMO_ACCESS_KEY!,
  secretKey: process.env.MOMO_SECRET_KEY!,
  env: process.env.MOMO_ENV as 'sandbox' | 'production'
});