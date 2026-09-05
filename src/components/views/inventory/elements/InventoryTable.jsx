import { isNil } from '@/helpers/ramda.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS, TABLE_LANGS } from '@/settings/langs.settings';
import { /* useInventoryFilterOptions, */ useInventoryPlacements } from '@/hooks/placements';

import { Table } from '@/components/ui';
import IDCell from './table-elements/IDCell';
import EmptyContent from '../../alerts/EmptyContent.view';
import DetailsCell from './table-elements/DetailsCell';
import LocationCell from './table-elements/LocationCell';
import StatusCell from './table-elements/StatusCell';
import VisibilityCell from './table-elements/VisibilityCell';

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
    { id: 'details', displayText: TABLE_LANG.DETAILS },
    { id: 'location', displayText: TABLE_LANG.LOCATION },
    { id: 'status', displayText: TABLE_LANG.STATUS },
    { id: 'visibility', displayText: TABLE_LANG.VISIBILITY },
  ];
  const TABLE_ROWS = placements.map(({
    code,
    face_count,
    id,
    status, 
    type,
    visibility,
    city,
    country,
    state,
    structure_height,
    display_name
  }) => {
    const STATUS_TK = (status || '').toLocaleUpperCase(); 
    const VISIBILITY_TK = (visibility || '').toLocaleUpperCase();
    console.log(placements);

    return {
      id: { render: <IDCell code={ code } />, value: id },
      details: { render: <DetailsCell type={ TABLE_LANG[type] } faces_count={ face_count } structure_height={ structure_height } />, value: type },
      location: { render: <LocationCell display_name={ display_name } city={ city } state={ state } country={ country } />, value: display_name },
      status: { render: <StatusCell status={ status } displayStatus={ TABLE_LANG[STATUS_TK] } />, value: status },
      visibility: { render: <VisibilityCell visibility={ visibility } visibilityDisplay={ TABLE_LANG[VISIBILITY_TK] } />, value: visibility }
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
