
import ImageUploader from '@/components/ImageUploader';

interface ImageFieldProps {
  imageData: string;
  setImageData: (data: string) => void;
  initialImage?: string;
}

export const ImageField = ({ 
  imageData, 
  setImageData,
  initialImage
}: ImageFieldProps) => {
  return (
    <div className="w-full">
      <ImageUploader 
        onImageCapture={setImageData}
        initialImage={initialImage || imageData}
        className="mt-1"
      />
    </div>
  );
};
