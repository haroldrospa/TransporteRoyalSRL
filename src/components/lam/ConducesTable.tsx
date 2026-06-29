
import { Table, TableBody } from '@/components/ui/table';
import { memo, useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { useAuth } from '@/contexts/AuthContext';
import ConducesTableHeader from './table/ConducesTableHeader';
import ConducesTableRow from './table/ConducesTableRow';
import ConducesTableEmpty from './table/ConducesTableEmpty';

interface ConducesTableProps {
  conduces: Conduce[];
  onConduceClick: (conduce: Conduce) => void;
  parseDeliveryTime: (timeStr: string) => number;
}

const ConducesTable = memo(({
  conduces,
  onConduceClick,
  parseDeliveryTime
}: ConducesTableProps) => {
  const { user } = useAuth();
  const isLamUser = user?.puesto === 'Laboratorio' || user?.puesto === 'LAM';

  // Memoize table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    if (!Array.isArray(conduces) || conduces.length === 0) {
      return <ConducesTableEmpty isLamUser={isLamUser} />;
    }

    // Show all conduces
    return conduces.map((conduce, index) => (
      <ConducesTableRow
        key={conduce.id}
        conduce={conduce}
        index={index}
        isLamUser={isLamUser}
        onConduceClick={onConduceClick}
      />
    ));
  }, [conduces, isLamUser, onConduceClick]);

  return (
    <div className="border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden w-full">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed min-w-full">
          <ConducesTableHeader isLamUser={isLamUser} />
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ConducesTable.displayName = 'ConducesTable';

export default ConducesTable;
