/**
 * HealthShield Portal Configuration
 * Centralized routing, authentication mode, and gateway settings.
 */

export interface RolePortalConfig {
  role: 'patient' | 'hospital' | 'insurer';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: 'user' | 'hospital' | 'shield';
  accentColor: string;
  routes: {
    login: string;
    register: string;
    dashboard: string;
  };
  demoCredentials: {
    email: string;
    password: string;
    hospitalId?: string;
  };
}

export interface PortalConfig {
  apiBaseUrl: string;
  authMode: 'jwt';
  enableLoaderOnReturnVisit: boolean;
  spaAuthModal: boolean;
  portals: Record<'patient' | 'hospital' | 'insurer', RolePortalConfig>;
  endpoints: {
    health: string;
    login: string;
    register: string;
    me: string;
    refresh: string;
    logout: string;
    sse: string;
    claims: string;
  };
}

export const portalConfig: PortalConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  authMode: 'jwt',
  enableLoaderOnReturnVisit: false,
  spaAuthModal: true,
  endpoints: {
    health: '/health',
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    sse: '/sse',
    claims: '/claims',
  },
  portals: {
    patient: {
      role: 'patient',
      title: 'Patient Portal',
      subtitle: 'Sovereign EMR & Groth16 zk-SNARK Claims',
      description: 'Manage encrypted medical records, control data access permissions, and generate client-side Groth16 zero-knowledge proofs to claim insurance without disclosing diagnoses.',
      badge: 'Protected Identity',
      iconName: 'user',
      accentColor: '#326bc4',
      routes: {
        login: '/auth/patient',
        register: '/auth/patient/register',
        dashboard: '/patient/dashboard',
      },
      demoCredentials: {
        email: 'alice@patient.healthshield.internal',
        password: 'Password123!',
      },
    },
    hospital: {
      role: 'hospital',
      title: 'Hospital Portal',
      subtitle: 'Clinical Encounters & BabyJubjub EdDSA Signatures',
      description: 'Manage patient diagnoses, issue cryptographically signed treatments using Poseidon + BabyJubjub EdDSA, and establish multi-recipient envelope encryption.',
      badge: 'Verified Care Provider',
      iconName: 'hospital',
      accentColor: '#07856f',
      routes: {
        login: '/auth/hospital',
        register: '/auth/hospital/register',
        dashboard: '/hospital/dashboard',
      },
      demoCredentials: {
        email: 'admin@metro.healthshield.internal',
        password: 'Password123!',
        hospitalId: 'HOSP-METRO-001',
      },
    },
    insurer: {
      role: 'insurer',
      title: 'Insurance Portal',
      subtitle: 'Zero-Knowledge Proof Adjudication & Settlement',
      description: 'Review claims and verify 12 public signals and EVM Groth16 proofs on Ethereum Sepolia. Zero clinical leakage: exact diagnosis codes remain cryptographically hidden.',
      badge: 'Zero-Knowledge Audited',
      iconName: 'shield',
      accentColor: '#8054bd',
      routes: {
        login: '/auth/insurer',
        register: '/auth/insurer/register',
        dashboard: '/insurer/dashboard',
      },
      demoCredentials: {
        email: 'adjudicator@aegis.healthshield.internal',
        password: 'Password123!',
      },
    },
  },
};
