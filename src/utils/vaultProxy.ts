import axios from 'axios';

export interface VaultAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export class VaultProxy {
  static async authenticateToken(url: string, token: string, namespace?: string): Promise<VaultAuthResponse> {
    try {
      const headers: Record<string, string> = {
        'X-Vault-Token': token,
      };

      if (namespace) {
        headers['X-Vault-Namespace'] = namespace;
      }

      const response = await axios.get(`${url}/v1/auth/token/lookup-self`, { headers });

      if (response.status === 200) {
        return { success: true, token };
      } else {
        return { success: false, error: 'Unexpected response from Vault' };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0] || error.message || 'Unknown error',
      };
    }
  }

  static async authenticateAppRole(
    url: string,
    roleId: string,
    secretId: string,
    namespace?: string
  ): Promise<VaultAuthResponse> {
    try {
      const headers: Record<string, string> = {};
      if (namespace) {
        headers['X-Vault-Namespace'] = namespace;
      }

      const response = await axios.post(
        `${url}/v1/auth/approle/login`,
        {
          role_id: roleId,
          secret_id: secretId,
        },
        { headers }
      );

      const token = response.data?.auth?.client_token;
      if (token) {
        return { success: true, token };
      } else {
        return { success: false, error: 'Authentication failed, token not received' };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.errors?.[0] || error.message || 'Unknown error',
      };
    }
  }

  static async testConnection(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/v1/sys/health`);
      // Consider any 2xx or 4xx (as Vault returns 429, 472, etc. in some healthy states) as "up"
      return response.status >= 200 && response.status < 500;
    } catch (error) {
      console.error('Vault connection failed:', error.message || error);
      return false;
    }
  }
}
