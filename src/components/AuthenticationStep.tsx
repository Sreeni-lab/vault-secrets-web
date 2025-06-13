
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { VaultConfig } from "@/pages/Index";
import { toast } from "sonner";

interface AuthenticationStepProps {
  config: VaultConfig;
  setConfig: (config: VaultConfig) => void;
  onNext: () => void;
  onPrev: () => void;
  setIsAuthenticated: (auth: boolean) => void;
}

export const AuthenticationStep = ({ 
  config, 
  setConfig, 
  onNext, 
  onPrev, 
  setIsAuthenticated 
}: AuthenticationStepProps) => {
  const [showToken, setShowToken] = useState(false);
  const [showSecretId, setShowSecretId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateVaultConnection = async () => {
    setIsLoading(true);
    setAuthStatus('idle');

    try {
      // First check if Vault URL is reachable
      const healthCheck = await fetch(`${config.url}/v1/sys/health`, {
        method: 'GET',
        mode: 'cors'
      });

      if (!healthCheck.ok && healthCheck.status !== 429) {
        throw new Error('Vault server is not reachable');
      }

      // Authenticate based on the selected method
      if (config.authMode === 'token') {
        await authenticateWithToken();
      } else {
        await authenticateWithAppRole();
      }

      setAuthStatus('success');
      setIsAuthenticated(true);
      toast.success("Authentication successful!");
      
      setTimeout(() => {
        onNext();
      }, 1000);

    } catch (error: any) {
      setAuthStatus('error');
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithToken = async () => {
    if (!config.token) {
      throw new Error('Token is required');
    }

    const response = await fetch(`${config.url}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': config.token,
        ...(config.namespace && { 'X-Vault-Namespace': config.namespace })
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Invalid Vault token');
    }
  };

  const authenticateWithAppRole = async () => {
    if (!config.roleId || !config.secretId) {
      throw new Error('Role ID and Secret ID are required');
    }

    const authUrl = config.namespace 
      ? `${config.url}/v1/${config.namespace}/auth/approle/login`
      : `${config.url}/v1/auth/approle/login`;

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.namespace && { 'X-Vault-Namespace': config.namespace })
      },
      body: JSON.stringify({
        role_id: config.roleId,
        secret_id: config.secretId
      }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('AppRole authentication failed');
    }

    const data = await response.json();
    const token = data.auth?.client_token;
    
    if (!token) {
      throw new Error('No token received from AppRole authentication');
    }

    setConfig({ ...config, token });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateVaultConnection();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full mb-4">
          <Shield className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Authenticate to Vault</h2>
        <p className="text-slate-400">
          {config.authMode === 'token' 
            ? 'Enter your Vault token to authenticate'
            : 'Enter your AppRole credentials to authenticate'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-slate-700/30 border-slate-600">
          {config.authMode === 'token' ? (
            <div>
              <Label htmlFor="token" className="text-white flex items-center mb-2">
                <Shield className="w-4 h-4 mr-2" />
                Vault Token
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  placeholder="hvs.xxxxxxxxxxxxxx"
                  value={config.token || ''}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-id" className="text-white flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Role ID
                </Label>
                <Input
                  id="role-id"
                  placeholder="Enter your AppRole Role ID"
                  value={config.roleId || ''}
                  onChange={(e) => setConfig({ ...config, roleId: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="secret-id" className="text-white flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Secret ID
                </Label>
                <div className="relative">
                  <Input
                    id="secret-id"
                    type={showSecretId ? "text" : "password"}
                    placeholder="Enter your AppRole Secret ID"
                    value={config.secretId || ''}
                    onChange={(e) => setConfig({ ...config, secretId: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowSecretId(!showSecretId)}
                  >
                    {showSecretId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {authStatus !== 'idle' && (
          <Card className={`p-4 border ${
            authStatus === 'success' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center">
              {authStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              )}
              <span className={authStatus === 'success' ? 'text-green-400' : 'text-red-400'}>
                {authStatus === 'success' 
                  ? 'Authentication successful! Proceeding to next step...'
                  : 'Authentication failed. Please check your credentials.'
                }
              </span>
            </div>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Back
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || authStatus === 'success'}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Authenticate'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
