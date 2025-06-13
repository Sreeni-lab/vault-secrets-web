
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";
import { SecretData } from "@/pages/Index";
import { toast } from "sonner";

interface FileUploadStepProps {
  secrets: SecretData[];
  setSecrets: (secrets: SecretData[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const FileUploadStep = ({ secrets, setSecrets, onNext, onPrev }: FileUploadStepProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const errors: string[] = [];
    const parsedSecrets: SecretData[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [SECRET_NAME, SECRET_KEY, SECRET_VALUE] = line.split(',').map(item => 
        item.trim().replace(/^["']|["']$/g, '')
      );

      if (!SECRET_NAME || !SECRET_KEY || !SECRET_VALUE) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      parsedSecrets.push({
        SECRET_NAME: SECRET_NAME.replace(/\r\n/g, ''),
        SECRET_KEY: SECRET_KEY.replace(/\r\n/g, ''),
        SECRET_VALUE: SECRET_VALUE.replace(/\r\n/g, '')
      });
    }

    setValidationErrors(errors);
    setSecrets(parsedSecrets);

    if (errors.length === 0) {
      toast.success(`Successfully parsed ${parsedSecrets.length} secrets`);
    } else {
      toast.error(`Found ${errors.length} validation errors`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSecrets([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSample = () => {
    const sampleCSV = `SECRET_NAME,SECRET_KEY,SECRET_VALUE
api-service,database_url,postgresql://user:pass@localhost:5432/db
api-service,api_key,sk-1234567890abcdef
web-app,redis_url,redis://localhost:6379
web-app,session_secret,your-session-secret-here`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-secrets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4">
          <Upload className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Secrets File</h2>
        <p className="text-slate-400">Upload a CSV file containing your secrets</p>
      </div>

      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white">CSV File Format</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSample}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Download Sample
            </Button>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg font-mono text-sm text-slate-300">
            <div className="text-slate-400 mb-2">Expected format:</div>
            <div>SECRET_NAME,SECRET_KEY,SECRET_VALUE</div>
            <div>api-service,database_url,postgresql://...</div>
            <div>api-service,api_key,sk-1234567890abcdef</div>
          </div>
        </div>
      </Card>

      <Card
        className={`p-8 border-2 border-dashed transition-all duration-200 ${
          isDragOver 
            ? 'border-blue-400 bg-blue-500/10' 
            : secrets.length > 0 
              ? 'border-green-400 bg-green-500/10'
              : 'border-slate-600 bg-slate-700/30'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {secrets.length === 0 ? (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                isDragOver ? 'text-blue-400' : 'text-slate-400'
              }`} />
              <h3 className="text-lg font-medium text-white mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-slate-400 mb-4">
                or click to browse your files
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Browse Files
              </Button>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-medium text-white mb-2">
                File Uploaded Successfully
              </h3>
              <p className="text-slate-400 mb-4">
                {secrets.length} secrets parsed from your CSV file
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Replace File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFile}
                  className="border-red-600 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </Card>

      {validationErrors.length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium mb-2">Validation Errors</h4>
              <ul className="text-sm text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {secrets.length > 0 && validationErrors.length === 0 && (
        <Card className="p-4 bg-slate-700/30 border-slate-600">
          <h4 className="text-white font-medium mb-3">Preview ({secrets.length} secrets)</h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {secrets.slice(0, 10).map((secret, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="text-blue-400 w-32 truncate">{secret.SECRET_NAME}</span>
                  <span className="text-slate-400 mx-2">→</span>
                  <span className="text-green-400 w-32 truncate">{secret.SECRET_KEY}</span>
                  <span className="text-slate-400 mx-2">:</span>
                  <span className="text-slate-300 truncate">
                    {secret.SECRET_VALUE.length > 20 
                      ? `${secret.SECRET_VALUE.substring(0, 20)}...` 
                      : secret.SECRET_VALUE
                    }
                  </span>
                </div>
              ))}
              {secrets.length > 10 && (
                <div className="text-slate-400 text-sm">
                  ... and {secrets.length - 10} more secrets
                </div>
              )}
            </div>
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
          type="button"
          onClick={onNext}
          disabled={secrets.length === 0 || validationErrors.length > 0}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8"
        >
          Upload to Vault
        </Button>
      </div>
    </div>
  );
};
