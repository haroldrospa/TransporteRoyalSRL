
import React, { useState, useMemo } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { calculateTransitTime } from '@/utils/time/transitTime';
import ConducesTableHeader from './table/ConducesTableHeader';
import ClienteGroupRow from './table/ClienteGroupRow';
import ConduceRow from './table/ConduceRow';
import { groupConducesByClient, getRowColorClass, getGroupRowColorClass, ClienteGroup } from './table/utils/groupUtils';

interface ConducesTableProps {
  conduces: Conduce[];
  selectedConduces: string[];
  toggleSelection: (conduceId: string) => void;
  setSelectedConduces: (ids: string[]) => void;
  clientes?: Cliente[];
  onAssignComplete?: () => void;
}

const ConducesTable = ({ conduces, selectedConduces, toggleSelection, setSelectedConduces, clientes, onAssignComplete }: ConducesTableProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Create a map of numeroCliente -> rnc for efficient lookup
  const clientesRncMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes?.forEach(cliente => {
      if (cliente.rnc && cliente.numeroCliente) {
        map.set(String(cliente.numeroCliente).trim(), String(cliente.rnc).trim());
      }
    });
    return map;
  }, [clientes]);

  // Create a map of numeroCliente -> grupo_cliente for unified grouping
  const clienteGrupoMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes?.forEach(cliente => {
      if (cliente.grupo_cliente && cliente.numeroCliente) {
        map.set(String(cliente.numeroCliente).trim(), String(cliente.grupo_cliente).trim());
      }
    });
    return map;
  }, [clientes]);

  // Create a map of numeroCliente and razonSocial -> encomendado para el predeterminado
  const clienteEncomendadoMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes?.forEach(cliente => {
      if (cliente.encomendado && cliente.encomendado.trim()) {
        const enc = cliente.encomendado.trim();
        if (cliente.numeroCliente) {
          map.set(String(cliente.numeroCliente).trim(), enc);
        }
        if (cliente.razonSocial) {
          map.set(`name:${cliente.razonSocial.trim().toLowerCase()}`, enc);
        }
      }
    });
    return map;
  }, [clientes]);

  // Create a map of numeroCliente -> razonSocial
  const clienteRazonSocialMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes?.forEach(cliente => {
      if (cliente.razonSocial && cliente.numeroCliente) {
        map.set(String(cliente.numeroCliente).trim(), cliente.razonSocial.trim());
      }
    });
    return map;
  }, [clientes]);

  // Group conduces by client and sort by worst transit time
  const clienteGroups = useMemo(() => {
    return groupConducesByClient(conduces, clientesRncMap, clienteGrupoMap, clienteEncomendadoMap, clienteRazonSocialMap);
  }, [conduces, clientesRncMap, clienteGrupoMap, clienteEncomendadoMap, clienteRazonSocialMap]);

  const toggleGroup = (numeroCliente: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(numeroCliente)) {
      newExpanded.delete(numeroCliente);
    } else {
      newExpanded.add(numeroCliente);
    }
    setExpandedGroups(newExpanded);
  };

  const isGroupSelected = (group: ClienteGroup) => {
    return group.conduces.every(conduce => selectedConduces.includes(conduce.id));
  };

  const isGroupPartiallySelected = (group: ClienteGroup) => {
    return group.conduces.some(conduce => selectedConduces.includes(conduce.id)) && 
           !group.conduces.every(conduce => selectedConduces.includes(conduce.id));
  };

  const toggleGroupSelection = (group: ClienteGroup) => {
    const allSelected = isGroupSelected(group);
    const groupIds = group.conduces.map(c => c.id);
    
    if (allSelected) {
      // Deselect all in group
      setSelectedConduces(selectedConduces.filter(id => !groupIds.includes(id)));
    } else {
      // Select all in group
      const newSelection = [...selectedConduces];
      groupIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      setSelectedConduces(newSelection);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible conduces
      const allIds = conduces.map(c => c.id);
      setSelectedConduces(allIds);
    } else {
      // Deselect all
      setSelectedConduces([]);
    }
  };

  if (conduces.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay conduces en tránsito
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto w-full">
      <Table className="min-w-full">
        <ConducesTableHeader 
          selectedConduces={selectedConduces}
          totalConduces={conduces.length}
          onSelectAll={handleSelectAll}
        />
        <TableBody>
          {clienteGroups.map((group) => (
            <React.Fragment key={group.numeroCliente}>
              <ClienteGroupRow
                group={group}
                isExpanded={expandedGroups.has(group.numeroCliente)}
                onToggleGroup={() => toggleGroup(group.numeroCliente)}
                isGroupSelected={isGroupSelected}
                isGroupPartiallySelected={isGroupPartiallySelected}
                onToggleGroupSelection={toggleGroupSelection}
                getGroupRowColorClass={getGroupRowColorClass}
                onAssignComplete={onAssignComplete}
              />
              
              {expandedGroups.has(group.numeroCliente) && group.conduces
                .sort((a, b) => {
                  // Sort conduces within group by transit time (longest first)
                  const transitTimeA = calculateTransitTime(a.fechaEntrega);
                  const transitTimeB = calculateTransitTime(b.fechaEntrega);
                  return transitTimeB.totalHours - transitTimeA.totalHours;
                })
                .map((conduce) => (
                  <ConduceRow
                    key={conduce.id}
                    conduce={conduce}
                    isSelected={selectedConduces.includes(conduce.id)}
                    onToggleSelection={() => toggleSelection(conduce.id)}
                    getRowColorClass={getRowColorClass}
                    onAssignComplete={onAssignComplete}
                  />
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConducesTable;
