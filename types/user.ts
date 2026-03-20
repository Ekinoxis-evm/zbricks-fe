export interface UserProfile {
  walletAddress: string;
  privyUserId: string;
  name: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  expectedInvestment: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export const INVESTMENT_RANGES = [
  "< $10,000",
  "$10,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000 – $500,000",
  "> $500,000",
] as const;

export type InvestmentRange = (typeof INVESTMENT_RANGES)[number];

export const COUNTRY_CODES = [
  { code: "+1",   country: "US/CA",      flag: "🇺🇸" },
  { code: "+52",  country: "México",     flag: "🇲🇽" },
  { code: "+54",  country: "Argentina",  flag: "🇦🇷" },
  { code: "+55",  country: "Brasil",     flag: "🇧🇷" },
  { code: "+56",  country: "Chile",      flag: "🇨🇱" },
  { code: "+57",  country: "Colombia",   flag: "🇨🇴" },
  { code: "+51",  country: "Perú",       flag: "🇵🇪" },
  { code: "+58",  country: "Venezuela",  flag: "🇻🇪" },
  { code: "+593", country: "Ecuador",    flag: "🇪🇨" },
  { code: "+591", country: "Bolivia",    flag: "🇧🇴" },
  { code: "+595", country: "Paraguay",   flag: "🇵🇾" },
  { code: "+598", country: "Uruguay",    flag: "🇺🇾" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá",     flag: "🇵🇦" },
  { code: "+503", country: "El Salvador",flag: "🇸🇻" },
  { code: "+502", country: "Guatemala",  flag: "🇬🇹" },
  { code: "+504", country: "Honduras",   flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua",  flag: "🇳🇮" },
  { code: "+34",  country: "España",     flag: "🇪🇸" },
  { code: "+44",  country: "UK",         flag: "🇬🇧" },
  { code: "+49",  country: "Alemania",   flag: "🇩🇪" },
  { code: "+33",  country: "Francia",    flag: "🇫🇷" },
  { code: "+39",  country: "Italia",     flag: "🇮🇹" },
  { code: "+971", country: "UAE",        flag: "🇦🇪" },
] as const;
