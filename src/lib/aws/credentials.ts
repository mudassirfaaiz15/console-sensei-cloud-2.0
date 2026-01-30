// AWS Credentials Management
// Stores credentials in localStorage for browser-based access

export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

const CREDENTIALS_KEY = 'consolesensei_aws_credentials';

/**
 * Save AWS credentials to localStorage
 */
export function saveCredentials(credentials: AWSCredentials): void {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

/**
 * Get AWS credentials from localStorage
 */
export function getCredentials(): AWSCredentials | null {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as AWSCredentials;
    } catch {
        return null;
    }
}

/**
 * Clear AWS credentials from localStorage
 */
export function clearCredentials(): void {
    localStorage.removeItem(CREDENTIALS_KEY);
}

/**
 * Check if AWS credentials are configured
 */
export function hasCredentials(): boolean {
    return getCredentials() !== null;
}

/**
 * Get default region or from credentials
 */
export function getRegion(): string {
    const creds = getCredentials();
    return creds?.region || 'us-east-1';
}
