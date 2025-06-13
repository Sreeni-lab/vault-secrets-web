
// Mock Vault authentication utility to bypass CORS issues
// In a real implementation, this would be replaced with a backend proxy

export interface VaultAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export class VaultProxy {
  static async authenticateToken(url: string, token: string, namespace?: string): Promise<VaultAuthResponse> {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in reality this would go through your backend
    if (token && token.startsWith('hvs.') && token.length > 10) {
      console.log('Mock token authentication successful');
      return { success: true, token };
    } else {
      return { success: false, error: 'Invalid token format' };
    }
  }

  static async authenticateAppRole(
    url: string, 
    roleId: string, 
    secretId: string, 
    namespace?: string
  ): Promise<VaultAuthResponse> {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in reality this would go through your backend
    if (roleId && secretId && roleId.length > 5 && secretId.length > 10) {
      console.log('Mock AppRole authentication successful');
      const mockToken = `hvs.mock-token-${Date.now()}`;
      return { success: true, token: mockToken };
    } else {
      return { success: false, error: 'Invalid Role ID or Secret ID' };
    }
  }

  static async testConnection(url: string): Promise<boolean> {
    // Mock connection test - always returns true for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock connection test successful');
    return true;
  }
}
