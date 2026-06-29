
import ActionsToolbar from './ActionsToolbar';

interface CargarCamionesToolbarProps {
  onClear: () => void;
  onExport: () => void;
}
const CargarCamionesToolbar = ({ onClear, onExport }: CargarCamionesToolbarProps) => {
  return (
    <ActionsToolbar onClear={onClear} onExport={onExport} />
  );
};
export default CargarCamionesToolbar;
