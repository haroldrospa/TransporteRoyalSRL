
import { Conduce } from '@/types/conduces';
import { ClientBasicInfo } from './client/ClientBasicInfo';
import { AdditionalConducesWarning } from './client/AdditionalConducesWarning';

interface ClientInfoProps {
  conduce: Conduce;
  additionalConduces?: Conduce[];
}

export const ClientInfo = ({ conduce, additionalConduces = [] }: ClientInfoProps) => {
  return (
    <div className="space-y-4">
      <ClientBasicInfo conduce={conduce} />
      <AdditionalConducesWarning currentConduce={conduce} additionalConduces={additionalConduces} />
    </div>
  );
};
