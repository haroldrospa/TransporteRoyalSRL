
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, TrashIcon, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { canDeleteRecords } from '@/utils/userPermissions';

interface ActionsToolbarProps {
  onClear: () => void;
  onExport: () => void;
}

const ActionsToolbar = ({ onClear, onExport }: ActionsToolbarProps) => {
  const { user } = useAuth();
  const userCanDelete = canDeleteRecords(user);

  return (
    <Card>
      <CardContent className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          {userCanDelete ? (
            <Button
              variant="destructive"
              onClick={onClear}
              className="gap-2"
            >
              <TrashIcon size={18} />
              Eliminar todas
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield size={16} />
              <span>Función disponible solo para administradores</span>
            </div>
          )}
        </div>
        
        <Button
          onClick={onExport}
          variant="outline"
          className="gap-2"
        >
          <FileSpreadsheet size={18} />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActionsToolbar;
