
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Download } from "lucide-react";
import { VaultConfig, SecretData } from "@/pages/Index";
import { toast } from "sonner";

interface ProgressStepProps {
  config: VaultConfig;
  secrets: SecretData[];
  onPrev: () => void;
}

interface UploadResult {
  secretName: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export const ProgressStep = ({ config, secrets, onPrev }: ProgressStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Initialize results
    const initialResults = secrets.reduce((acc, secret) => {
      const existing = acc.find(r => r.secretName === secret.SECRET_NAME);
      if (!existing) {
        acc.push({ secretName: secret.SECRET_NAME, status: 'pending' });
      }
      return acc;
    }, [] as UploadResult[]);
    
    setResults(initialResults);
  }, [secrets]);

  const groupSecretsByName = (secrets: SecretData[]) => {
    const grouped: { [key: string]: { [key: string]: string } } = {};
    
    secrets.forEach(secret => {
      if (!grouped[secret.SECRET_NAME]) {
        grouped[secret.SECRET_NAME] = {};
      }
      grouped[secret.SECRET_NAME][secret.SECRET_KEY] = secret.SECRET_VALUE;
    });
    
    return grouped;
  };

  const uploadSecrets = async () => {
    setIsUploading(true);
    setProgress(0);
    setIsComplete(false);

    const groupedSecrets = groupSecretsByName(secrets);
    const secretNames = Object.keys(groupedSecrets);
    let completedCount = 0;

    for (const secretName of secretNames) {
      try {
        const secretData = groupedSecrets[secretName];
        
        // Construct the Vault URL
        const fullUrl = config.namespace 
          ? `${config.url}/v1/${config.namespace}/${config.secretsPath}/${secretName}`
          : `${config.url}/v1/${config.secretsPath}/${secretName}`;

        // Prepare the data payload
        const payload = {
          data: secretData
        };

        // Make the API call
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vault-Token': config.token!,
            ...(config.namespace && { 'X-Vault-Namespace': config.namespace })
          },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        if (response.ok) {
          setResults(prev => prev.map(r => 
            r.secretName === secretName 
              ? { ...r, status: 'success', message: 'Successfully stored' }
              : r
          ));
        } else {
          const errorText = await response.text();
          setResults(prev => prev.map(r => 
            r.secretName === secretName 
              ? { ...r, status: 'error', message: `HTTP ${response.status}: ${errorText}` }
              : r
          ));
        }
      } catch (error: any) {
        setResults(prev => prev.map(r => 
          r.secretName === secretName 
            ? { ...r, status: 'error', message: error.message }
            : r
        ));
      }

      completedCount++;
      setProgress((completedCount / secretNames.length) * 100);
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsUploading(false);
    setIsComplete(true);

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    if (errorCount === 0) {
      toast.success(`All ${successCount} secrets uploaded successfully!`);
    } else {
      toast.error(`${errorCount} secrets failed to upload. ${successCount} succeeded.`);
    }
  };

  const downloadReport = () => {
    const report = results.map(result => ({
      'Secret Name': result.secretName,
      'Status': result.status,
      'Message': result.message || ''
    }));

    const csv = [
      Object.keys(report[0]).join(','),
      ...report.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-upload-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setResults(prev => prev.map(r => ({ ...r, status: 'pending', message: undefined })));
    setProgress(0);
    setIsComplete(false);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const uniqueSecrets = results.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Progress</h2>
        <p className="text-slate-400">Uploading {uniqueSecrets} unique secrets to Vault</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-700/30 border-slate-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{uniqueSecrets}</div>
            <div className="text-sm text-slate-400">Total Secrets</div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-700/30 border-slate-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{successCount}</div>
            <div className="text-sm text-slate-400">Successful</div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-700/30 border-slate-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-sm text-slate-400">Failed</div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Upload Progress</span>
            <span className="text-slate-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {isUploading && (
            <div className="flex items-center text-blue-400">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading secrets to Vault...
            </div>
          )}
        </div>
      </Card>

      {/* Results List */}
      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <h3 className="text-white font-medium mb-4">Upload Results</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center">
                {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400 mr-3" />}
                {result.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 mr-3" />}
                {result.status === 'pending' && <div className="w-5 h-5 mr-3 rounded-full border-2 border-slate-600" />}
                <span className="text-white font-mono">{result.secretName}</span>
              </div>
              <div className="text-right">
                <span className={`text-sm ${
                  result.status === 'success' ? 'text-green-400' :
                  result.status === 'error' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {result.status === 'pending' ? 'Waiting...' :
                   result.status === 'success' ? 'Success' : 'Failed'}
                </span>
                {result.message && (
                  <div className="text-xs text-slate-400 mt-1 max-w-xs truncate">
                    {result.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isUploading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          Back
        </Button>
        
        <div className="space-x-4">
          {isComplete && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={downloadReport}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetUpload}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Upload Again
              </Button>
            </>
          )}
          
          <Button
            type="button"
            onClick={uploadSecrets}
            disabled={isUploading || isComplete}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Start Upload'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
