
import { SYSTEM as SYSTEM_LANGS, TABLE_LANGS } from '@/settings/langs.settings';
import { /* useInventoryFilterOptions, */ useInventoryPlacements } from '@/hooks/placements';
import { useLanguage } from '@/hooks/contexts';

import { Table } from '@/components/ui';
import CodeCell from './table-elements/Code';
import { Chip } from '@heroui/react';
import { isNil } from 'ramda';
import EmptyContent from '../../alerts/EmptyContent.view';

/* const STATUS_COLORS = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  paused: 'default',
  draft: 'default'
}; */

function InventoryTable() {
  const {
    placements,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    isEmpty,
    hasNoMatches,
    error,
    filters,
    /* activeFilters, */
    activeFiltersCount,
    hasActiveFilters,
    setPage,
    setPageSize,
    refetch,
    updateFilters,
    clearFilters,
  } = useInventoryPlacements({
    searchDebounceMs: 700,
    initialPageSize: 12,
    initialFilters: {
      visibility: ['public', 'private', 'unlisted'],
      status: ['active', 'pending'],
      type: ['UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP']
    }
  });
  /* const all = useInventoryFilterOptions(); */
  const { language } = useLanguage();  

  const TABLE_LANG = TABLE_LANGS[language].INVENTORY;
  const SYSTEM_LANG = SYSTEM_LANGS[language];
  
  const TABLE_COLS = [
    { id: 'id', displayText: TABLE_LANG.ID, isRowHeader: true },
    { id: 'type', displayText: TABLE_LANG.TYPE },
    { id: 'face_count', displayText: TABLE_LANG.FACE_COUNT },
    { id: 'city', displayText: TABLE_LANG.CITY },
    { id: 'country', displayText: TABLE_LANG.COUNTRY },
    { id: 'status', displayText: TABLE_LANG.STATUS },
    { id: 'visibility', displayText: TABLE_LANG.VISIBILITY },
  ];
  const TABLE_ROWS = placements.map(({
    city,
    code,
    country,
    face_count,
    id,
    status, 
    type,
    visibility,
    location: { display_name }
  }) => {
    const STATUS_TK = (status || '').toLocaleUpperCase(); 
    const VISIBILITY_TK = (visibility || '').toLocaleUpperCase();

    return {
      id: { render: <CodeCell code={ code } display_name={ display_name } />, value: id },
      type: { render: TABLE_LANG[type], value: type },
      face_count,
      city,
      country,
      status: { render: <Chip>{ TABLE_LANG[STATUS_TK] }</Chip>, value: status },
      visibility: { render: <Chip>{ TABLE_LANG[VISIBILITY_TK] }</Chip>, value: visibility }
    }
  });
  const TABLE_FILTERS = {
    filters: [
      {
        name: 'type',
        translationKey: 'TYPE',
        defaultExpended: true,
        initialValues: ['UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP'],
        options: [
          { id: 'UNIPOLE_BILLBOARD', translationKey: 'UNIPOLE_BILLBOARD' },
          { id: 'HAND_PAINTED_MURAL', translationKey: 'HAND_PAINTED_MURAL' },
          { id: 'BARRICADE', translationKey: 'BARRICADE' },
          { id: 'BUILDING_WRAP', translationKey: 'BUILDING_WRAP' },
        ]
      },
      {
        name: 'status',
        translationKey: 'STATUS',
        defaultExpended: true,
        initialValues: ['active', 'pending'],
        options: [
          { id: 'active', translationKey: 'ACTIVE' },
          { id: 'pending', translationKey: 'PENDING' }
        ]
      },
      {
        name: 'visibility',
        translationKey: 'VISIBILITY',
        defaultExpended: true,
        initialValues: ['public', 'private', 'unlisted'],
        options: [
          { id: 'public', translationKey: 'PUBLIC' },
          { id: 'private', translationKey: 'PRIVATE' },
          { id: 'unlisted', translationKey: 'UNLISTED' }
        ]
      }
    ],
    activeFiltersCount,
    hasActiveFilters,
    filtersActived: filters,
    isPending: false,
    clearFilters,
    onApplyingFilters: (actualFilters) => {
      if (isNil(actualFilters)) {
        clearFilters()
      } else {
        updateFilters(actualFilters)
      }
    }
  };
  const TABLE_PAGINATION = {
    page,
    totalPages,
    pageSize,
    totalContent: total,
    setPage,
    setPageSize
  };
  const TABLE_STATES = {
    isFechingData: isLoading,
    errorObject: error,
    updateContent: refetch,
    isEmpty,
    hasNoMatches
  };
  const TABLE_SELECTION = {
    type: 'multiple',
    onSelectionChange: (selection) => {
      console.log('onSelectionChange', selection);
    },
    actionsBySelections: (currentSelections) => {
      console.log(currentSelections);

      return [
        {
          displayText: SYSTEM_LANG.BUTTONS.DELETE,
          isDisabled: currentSelections.size === 0,
          variant: 'danger-soft',
          iconName: 'delete',
          onPress: (selection) => {
            console.log(selection);
          }
        }
      ];
    }
  };
  const TABLE_SEARCH = {
    placeholder: TABLE_LANG.SEARCH_BY_ID,
    defaultValue: filters.search,
    onChange: (value) => {
      updateFilters({
        search: value
      });
    }
  };
  const TABLE_EXTRA_ACTIONS = [
    {
      displayText: TABLE_LANG.FIND_ON_MAP,
      iconName: 'map-search',
      variant: 'primary',
      isDisabled: isEmpty,
      onPress: () => {
        console.log('Hi');
      },
    },
  ];
  
  console.log({ TABLE_STATES, TABLE_ROWS });
  return (
    <Table
      name="inventory"
      selection={ TABLE_SELECTION }
      states={ TABLE_STATES }
      cols={ TABLE_COLS }
      rows={ TABLE_ROWS }
      filters={ TABLE_FILTERS }
      pagination= { TABLE_PAGINATION }
      search={ TABLE_SEARCH }
      extraActions={ TABLE_EXTRA_ACTIONS }
    >
      <EmptyContent>
        Sin contenido
      </EmptyContent>
    </Table>
  );
}

export default InventoryTable;
