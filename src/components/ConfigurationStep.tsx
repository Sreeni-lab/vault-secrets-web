
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Server, Key, Database } from "lucide-react";
import { VaultConfig } from "@/pages/Index";

interface ConfigurationStepProps {
  config: VaultConfig;
  setConfig: (config: VaultConfig) => void;
  onNext: () => void;
}

export const ConfigurationStep = ({ config, setConfig, onNext }: ConfigurationStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.url && config.secretsPath) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4">
          <Server className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configure Vault Connection</h2>
        <p className="text-slate-400">Enter your HashiCorp Vault server details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-slate-700/30 border-slate-600">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vault-url" className="text-white flex items-center mb-2">
                <Server className="w-4 h-4 mr-2" />
                Vault URL
              </Label>
              <Input
                id="vault-url"
                type="url"
                placeholder="https://vault.example.com"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                required
              />
            </div>

            <div>
              <Label htmlFor="namespace" className="text-white flex items-center mb-2">
                <Database className="w-4 h-4 mr-2" />
                Namespace (Optional)
              </Label>
              <Input
                id="namespace"
                placeholder="Leave blank for OSS Vault"
                value={config.namespace}
                onChange={(e) => setConfig({ ...config, namespace: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <Label htmlFor="secrets-path" className="text-white flex items-center mb-2">
                <Key className="w-4 h-4 mr-2" />
                Secrets Path
              </Label>
              <Input
                id="secrets-path"
                placeholder="kv/data/path/to/secrets"
                value={config.secretsPath}
                onChange={(e) => setConfig({ ...config, secretsPath: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                required
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-700/30 border-slate-600">
          <Label className="text-white flex items-center mb-4">
            <Key className="w-4 h-4 mr-2" />
            Authentication Method
          </Label>
          <RadioGroup
            value={config.authMode}
            onValueChange={(value: 'token' | 'approle') => 
              setConfig({ ...config, authMode: value })
            }
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
              <RadioGroupItem value="token" id="token" />
              <Label htmlFor="token" className="text-white cursor-pointer flex-1">
                <div>
                  <div className="font-medium">Token Authentication</div>
                  <div className="text-sm text-slate-400">Use a Vault token for authentication</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
              <RadioGroupItem value="approle" id="approle" />
              <Label htmlFor="approle" className="text-white cursor-pointer flex-1">
                <div>
                  <div className="font-medium">AppRole Authentication</div>
                  <div className="text-sm text-slate-400">Use Role ID and Secret ID for authentication</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
          >
            Continue to Authentication
          </Button>
        </div>
      </form>
    </div>
  );
};
