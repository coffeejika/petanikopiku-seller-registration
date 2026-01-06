
export interface SellerProfile {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  regency: string;
}

export interface StoreDetails {
  storeName: string;
  storeAddress: string;
  annualSales: string;
}

export interface SecurityVerification {
  ktpNumber: string;
  ktpPhoto: File | null;
  ktpPhotoPreview: string | null;
}

export interface RegistrationData {
  profile: SellerProfile;
  store: StoreDetails;
  verification: SecurityVerification;
}

export type Step = 'profile' | 'store' | 'verification' | 'summary';
