
import { useNavigate } from 'react-router-dom';
import { RegionCard } from './RegionCard';

interface RegionCardsProps {
  norteBultos: number;
  surBultos: number;
  setRegionActual: (region: 'Norte' | 'Sur') => void;
}

export const RegionCards = ({ norteBultos, surBultos, setRegionActual }: RegionCardsProps) => {
  const navigate = useNavigate();

  const selectRegion = (region: 'Norte' | 'Sur') => {
    setRegionActual(region);
    navigate('/lam');
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
      <RegionCard 
        region="Norte"
        bultos={norteBultos}
        color="blue"
        onClick={() => selectRegion('Norte')}
      />
      <RegionCard 
        region="Sur"
        bultos={surBultos}
        color="yellow"
        onClick={() => selectRegion('Sur')}
      />
    </div>
  );
};
