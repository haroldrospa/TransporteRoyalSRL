
import { Card, CardContent } from '@/components/ui/card';
import NoDataDisplay from '@/components/lam/NoDataDisplay';

const LAMNoDataCard = () => {
  return (
    <Card>
      <CardContent className="p-0">
        <NoDataDisplay />
      </CardContent>
    </Card>
  );
};

export default LAMNoDataCard;
