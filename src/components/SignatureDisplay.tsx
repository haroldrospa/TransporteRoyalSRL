
interface SignatureDisplayProps {
  signatureData: string;
  width?: number | string;
  height?: number | string;
}

const SignatureDisplay = ({ 
  signatureData, 
  width = "100%", 
  height = "100%"
}: SignatureDisplayProps) => {
  if (!signatureData || signatureData === 'AUTO_DELIVERY') {
    return (
      <div 
        style={{ width, height, minHeight: '60px' }} 
        className="flex items-center justify-center bg-muted/30 text-muted-foreground/70 text-sm font-medium italic rounded-md w-full h-full"
      >
        Sin firma
      </div>
    );
  }

  return (
    <img 
      src={signatureData} 
      alt="Firma" 
      style={{ width, height, objectFit: 'contain' }} 
      className="rounded-md w-full h-full"
    />
  );
};

export default SignatureDisplay;
