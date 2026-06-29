import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { exportClientesToExcel, importClientesFromExcel } from '@/utils/excel/clienteExcel';

interface ImportExportButtonsProps {
  onImportComplete: () => void;
}

const ImportExportButtons = ({ onImportComplete }: ImportExportButtonsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await exportClientesToExcel();
    setIsExporting(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await importClientesFromExcel(file, onImportComplete);
    setIsImporting(false);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-1"
      >
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Exportar
      </Button>

      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-1"
      >
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importar
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default ImportExportButtons;
