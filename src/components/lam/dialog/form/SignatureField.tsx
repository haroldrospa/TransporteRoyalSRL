
import SignatureCanvas from '@/components/SignatureCanvas';

interface SignatureFieldProps {
  signatureData: string;
  setSignatureData: (data: string) => void;
  initialSignature?: string;
}

export const SignatureField = ({ 
  signatureData, 
  setSignatureData,
  initialSignature
}: SignatureFieldProps) => {
  return (
    <div className="w-full">
      <SignatureCanvas 
        onSignatureCapture={setSignatureData}
        initialSignature={initialSignature || signatureData}
        className="mt-1"
      />
    </div>
  );
};
