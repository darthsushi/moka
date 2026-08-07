import {
  Button,
  Checkbox,
  Chip,
  Spinner,
  Table
} from '@heroui/react';
import { useState } from 'react';

import { useInventoryPlacements } from '@/hooks/placements';

const STATUS_COLORS = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  paused: 'default',
  draft: 'default'
};

export const InventoryTable = () => {
  const {
    placements,
    page,
    totalPages,
    isLoading,
    error,
    setPage
  } = useInventoryPlacements({
    initialPageSize: 10
  });

  const [selectedKeys, setSelectedKeys] = useState(
    new Set()
  );

  const renderCell = (placement, columnKey) => {
    switch (columnKey) {
      case 'code':
        return (
          <div>
            <p className="font-semibold">
              {placement.code}
            </p>

            <p className="text-xs text-default-500">
              {placement.type}
            </p>
          </div>
        );

      case 'face_count':
        return (
          <span>
            {placement.face_count}{' '}
            {placement.face_count === 1
              ? 'cara'
              : 'caras'}
          </span>
        );

      case 'status':
        return (
          <Chip
            color={
              STATUS_COLORS[placement.status] ??
              'default'
            }
            size="sm"
            variant="soft"
          >
            {placement.status}
          </Chip>
        );

      case 'visibility':
        return placement.visibility;

      default:
        return '—';
    }
  };

  const handleSelectionChange = (keys) => {
    setSelectedKeys(keys);

    const selectedIds = keys === 'all'
      ? placements.map(placement => placement.id)
      : Array.from(keys);

    console.log(
      'Placements seleccionados:',
      selectedIds
    );
  };

  if (error) {
    return (
      <p className="text-danger">
        {error}
      </p>
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Inventario de espacios"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
        >
          <Table.Header>
            <Table.Column className="pr-0">
              <Checkbox
                aria-label="Seleccionar todos"
                slot="selection"
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
            </Table.Column>

            <Table.Column
              id="code"
              isRowHeader
            >
              Código
            </Table.Column>

            <Table.Column id="face_count">
              Caras
            </Table.Column>

            <Table.Column id="status">
              Estado
            </Table.Column>

            <Table.Column id="visibility">
              Visibilidad
            </Table.Column>
          </Table.Header>

          <Table.Body
            items={placements}
            renderEmptyState={() => (
              isLoading
                ? <Spinner />
                : 'No hay placements'
            )}
          >
            {(placement) => (
              <Table.Row id={placement.id}>
                <Table.Cell className="pr-0">
                  <Checkbox
                    aria-label={
                      `Seleccionar ${placement.code}`
                    }
                    slot="selection"
                    variant="secondary"
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Cell>

                <Table.Cell>
                  {renderCell(placement, 'code')}
                </Table.Cell>

                <Table.Cell>
                  {renderCell(
                    placement,
                    'face_count'
                  )}
                </Table.Cell>

                <Table.Cell>
                  {renderCell(
                    placement,
                    'status'
                  )}
                </Table.Cell>

                <Table.Cell>
                  {renderCell(
                    placement,
                    'visibility'
                  )}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      <Table.Footer className="flex items-center justify-between">
        <Button
          isDisabled={page <= 1 || isLoading}
          onPress={() => setPage(page - 1)}
        >
          Anterior
        </Button>

        <span>
          Página {page} de {totalPages}
        </span>

        <Button
          isDisabled={
            page >= totalPages || isLoading
          }
          onPress={() => setPage(page + 1)}
        >
          Siguiente
        </Button>
      </Table.Footer>
    </Table>
  );
};