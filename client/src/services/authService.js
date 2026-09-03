import { delay } from './apiClient';

const STORAGE_KEY = 'gigfinance_user';
const OTP_DEMO_CODE = '123456';

export const authService = {
  /**
   * Request OTP for login
   * @param {string} mobileNumber
   */
  async sendOtp(mobileNumber) {
    await delay(500);

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    // Persist pending login session
    sessionStorage.setItem('gigfinance_pending_mobile', cleanNumber);

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanNumber}`,
      demoOtp: OTP_DEMO_CODE,
    };
  },

  /**
   * Register a new gig worker
   * @param {{ name: string, mobileNumber: string }} data
   */
  async signup({ name, mobileNumber }) {
    await delay(600);

    if (!name || name.trim().length < 2) {
      throw new Error('Please enter your full name');
    }

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    sessionStorage.setItem('gigfinance_pending_mobile', cleanNumber);
    sessionStorage.setItem('gigfinance_pending_name', name.trim());

    return {
      success: true,
      message: 'Account initiated. Please verify with OTP.',
      demoOtp: OTP_DEMO_CODE,
    };
  },

  /**
   * Verify 6-digit OTP
   * @param {{ mobileNumber?: string, otp: string }} params
   */
  async verifyOtp({ mobileNumber, otp }) {
    await delay(600);

    if (otp !== OTP_DEMO_CODE) {
      throw new Error('Invalid OTP. For testing, please use 123456');
    }

    const pendingMobile = mobileNumber || sessionStorage.getItem('gigfinance_pending_mobile') || '9876543210';
    const pendingName = sessionStorage.getItem('gigfinance_pending_name') || 'Ravi Kumar';

    const user = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: pendingName,
      mobileNumber: pendingMobile,
      isVerified: true,
      token: 'jwt_mock_token_' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('gigfinance_token', user.token);

    return {
      success: true,
      user,
      message: 'Mobile number verified successfully',
    };
  },

  /**
   * Complete worker onboarding profile
   * @param {{ name: string, age: string|number, workerType: string, platform: string }} profile
   */
  async saveOnboardingProfile(profile) {
    await delay(500);

    const currentUser = this.getCurrentUser() || {};
    const updatedUser = {
      ...currentUser,
      ...profile,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    return {
      success: true,
      user: updatedUser,
      message: 'Profile saved successfully',
    };
  },

  /**
   * Retrieve currently signed in worker
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Log out current user
   */
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('gigfinance_token');
    sessionStorage.clear();
  },
};
