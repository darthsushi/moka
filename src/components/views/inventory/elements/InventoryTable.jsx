import { useState } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';

import { isNil } from '@/helpers/ramda.helpers';
import { useAuth, useLanguage } from '@/hooks/contexts';
import { TABLE_LANGS } from '@/settings/langs.settings';
import { useInventoryPlacements, usePlacementStatus } from '@/hooks/placements';

import { Table } from '@/components/ui';
import IDCell from './table-elements/IDCell';
import EmptyContent from '../../alerts/EmptyContent.view';
import DetailsCell from './table-elements/DetailsCell';
import LocationCell from './table-elements/LocationCell';
import StatusCell from './table-elements/StatusCell';
import VisibilityCell from './table-elements/VisibilityCell';

const OWNER_STATUSES = ['active', 'paused', 'withdrawn'];
const REVIEW_STATUSES = ['draft', 'pending', 'in_review', 'approved', 'suspended', 'rejected'];
const PLACEMENT_TYPES = ['UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP'];

const INITIAL_FILTERS = {
  visibility: ['public', 'private', 'unlisted'],
  owner_status: OWNER_STATUSES,
  review_status: REVIEW_STATUSES,
  type: PLACEMENT_TYPES
};

function InventoryTable() {
  const { user, roles } = useAuth();
  const [scope, setScope] = useState('mine');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionReset, setSelectionReset] = useState(0);
  const isTeam = roles.some(role => role === 'admin' || role === 'moderator');
  const isAdmin = roles.includes('admin');

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
    scope,
    searchDebounceMs: 700,
    initialPageSize: 12,
    initialFilters: INITIAL_FILTERS
  });
  const {
    updatingId,
    error: actionError,
    clearError,
    changeOwnerStatus,
    changeOwnerStatuses,
    changeReviewStatus,
    restorePlacement
  } = usePlacementStatus(refetch);
  const { language } = useLanguage();

  const TABLE_LANG = TABLE_LANGS[language].INVENTORY;

  const handleWithdraw = (placementId) => {
    if (window.confirm(TABLE_LANG.WITHDRAW_CONFIRM)) {
      changeOwnerStatus(placementId, 'withdrawn');
    }
  };

  const handleBulkAction = async (selectedPlacements, status) => {
    if (status === 'withdrawn' && !window.confirm(
      TABLE_LANG.WITHDRAW_MULTIPLE_CONFIRM.replace('{count}', selectedPlacements.length)
    )) return;

    await changeOwnerStatuses(selectedPlacements.map(({ id }) => id), status);
    setIsSelectionModeActive(false);
    setSelectionReset(current => current + 1);
  };

  const selectScope = (nextScope) => {
    clearError();
    setIsSelectionModeActive(false);
    setScope(nextScope);
    setPage(1);
  };
  
  const TABLE_COLS = [
    { id: 'id', displayText: TABLE_LANG.ID, isRowHeader: true },
    { id: 'details', displayText: TABLE_LANG.DETAILS },
    { id: 'location', displayText: TABLE_LANG.LOCATION },
    { id: 'owner_status', displayText: TABLE_LANG.OWNER_STATUS },
    { id: 'review_status', displayText: TABLE_LANG.REVIEW_STATUS },
    { id: 'visibility', displayText: TABLE_LANG.VISIBILITY },
    { id: 'actions', displayText: TABLE_LANG.ACTIONS },
  ];
  const TABLE_ROWS = placements.map(({
    code,
    face_count,
    id,
    owner_status,
    review_status,
    user_id,
    type,
    visibility,
    city,
    country,
    state,
    structure_height,
    display_name
  }) => {
    const VISIBILITY_TK = (visibility || '').toLocaleUpperCase();
    const canChangeAvailability = user_id === user?.id || isAdmin;
    const canRequestReview = !isTeam && user_id === user?.id
      && (review_status === 'draft' || review_status === 'rejected');
    const busy = Boolean(updatingId);
    const availabilityActionLabel = owner_status === 'withdrawn'
      ? TABLE_LANG.RESTORE
      : owner_status === 'active' ? TABLE_LANG.PAUSE : TABLE_LANG.RESUME;

    return {
      id: { render: <IDCell code={ code } />, value: id },
      details: { render: <DetailsCell type={ TABLE_LANG[type] } faces_count={ face_count } structure_height={ structure_height } />, value: type },
      location: { render: <LocationCell display_name={ display_name } city={ city } state={ state } country={ country } />, value: display_name },
      owner_status: {
        render: <StatusCell status={ owner_status } displayStatus={ TABLE_LANG[owner_status.toUpperCase()] } />,
        value: owner_status
      },
      review_status: {
        render: <StatusCell status={ review_status } displayStatus={ TABLE_LANG[review_status.toUpperCase()] } />,
        value: review_status
      },
      visibility: { render: <VisibilityCell visibility={ visibility } visibilityDisplay={ TABLE_LANG[VISIBILITY_TK] } />, value: visibility },
      actions: {
        value: id,
        render: <div className="flex items-center gap-2">
          <Dropdown>
            <Button size="sm" variant="tertiary" isDisabled={ busy || isSelectionModeActive }>
              { TABLE_LANG.ACTIONS }
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item id="edit" textValue={ TABLE_LANG.EDIT }>
                  <Label>{ TABLE_LANG.EDIT }</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="toggle-availability"
                  textValue={ availabilityActionLabel }
                  isDisabled={ !canChangeAvailability || (owner_status === 'withdrawn' && !isAdmin) }
                  onPress={ () => owner_status === 'withdrawn'
                    ? restorePlacement(id)
                    : changeOwnerStatus(id, owner_status === 'active' ? 'paused' : 'active') }
                >
                  <Label>{ availabilityActionLabel }</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="withdraw"
                  textValue={ TABLE_LANG.WITHDRAW }
                  isDisabled={ !canChangeAvailability || owner_status === 'withdrawn' }
                  variant="danger"
                  onPress={ () => handleWithdraw(id) }
                >
                  <Label>{ TABLE_LANG.WITHDRAW }</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          { isTeam && <select
            aria-label={ TABLE_LANG.REVIEW_STATUS }
            value={ review_status }
            disabled={ busy || isSelectionModeActive }
            onChange={ (event) => changeReviewStatus(id, event.target.value) }
          >
            { REVIEW_STATUSES.map(status => (
              <option key={ status } value={ status }>{ TABLE_LANG[status.toUpperCase()] }</option>
            )) }
          </select> }
          { canRequestReview && <Button
            size="sm"
            variant="tertiary"
            isDisabled={ busy || isSelectionModeActive }
            onPress={ () => changeReviewStatus(id, 'pending') }
          >
            { TABLE_LANG.SEND_FOR_REVIEW }
          </Button> }
        </div>
      }
    }
  });
  const TABLE_FILTERS = {
    filters: [
      {
        name: 'type',
        translationKey: 'TYPE',
        defaultExpended: true,
        initialValues: PLACEMENT_TYPES,
        options: [
          { id: 'UNIPOLE_BILLBOARD', translationKey: 'UNIPOLE_BILLBOARD' },
          { id: 'HAND_PAINTED_MURAL', translationKey: 'HAND_PAINTED_MURAL' },
          { id: 'BARRICADE', translationKey: 'BARRICADE' },
          { id: 'BUILDING_WRAP', translationKey: 'BUILDING_WRAP' },
        ]
      },
      {
        name: 'owner_status',
        translationKey: 'OWNER_STATUS',
        defaultExpended: true,
        initialValues: OWNER_STATUSES,
        options: [
          { id: 'active', translationKey: 'ACTIVE' },
          { id: 'paused', translationKey: 'PAUSED' },
          { id: 'withdrawn', translationKey: 'WITHDRAWN' }
        ]
      },
      {
        name: 'review_status',
        translationKey: 'REVIEW_STATUS',
        defaultExpended: true,
        initialValues: REVIEW_STATUSES,
        options: [
          { id: 'draft', translationKey: 'DRAFT' },
          { id: 'pending', translationKey: 'PENDING' },
          { id: 'in_review', translationKey: 'IN_REVIEW' },
          { id: 'approved', translationKey: 'APPROVED' },
          { id: 'suspended', translationKey: 'SUSPENDED' },
          { id: 'rejected', translationKey: 'REJECTED' }
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
    isBusy: Boolean(updatingId) || isLoading,
    onModeChange: setIsSelectionModeActive,
    actionsBySelections: (selectedIds) => {
      const selectedPlacements = placements.filter(({ id }) => selectedIds.has(id));
      const canUpdateAll = selectedPlacements.length > 0
        && selectedPlacements.length === selectedIds.size
        && selectedPlacements.every(({ user_id, owner_status }) =>
          (user_id === user?.id || isAdmin) && owner_status !== 'withdrawn'
        );

      return [
        {
          displayText: TABLE_LANG.PAUSE,
          isDisabled: !canUpdateAll || !selectedPlacements.some(({ owner_status }) => owner_status === 'active'),
          onPress: () => handleBulkAction(selectedPlacements.filter(({ owner_status }) => owner_status === 'active'), 'paused')
        },
        {
          displayText: TABLE_LANG.WITHDRAW,
          variant: 'danger-soft',
          isDisabled: !canUpdateAll,
          onPress: () => handleBulkAction(selectedPlacements, 'withdrawn')
        },
        {
          displayText: TABLE_LANG.RESUME,
          isDisabled: !canUpdateAll || !selectedPlacements.some(({ owner_status }) => owner_status === 'paused'),
          onPress: () => handleBulkAction(selectedPlacements.filter(({ owner_status }) => owner_status === 'paused'), 'active')
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
  
  return (
    <>
      { isTeam && <div className="flex gap-2 p-2">
        <Button size="sm" variant={ scope === 'mine' ? 'primary' : 'tertiary' } isDisabled={ Boolean(updatingId) } onPress={ () => selectScope('mine') }>
          { TABLE_LANG.MY_PLACEMENTS }
        </Button>
        <Button size="sm" variant={ scope === 'review' ? 'primary' : 'tertiary' } isDisabled={ Boolean(updatingId) } onPress={ () => selectScope('review') }>
          { TABLE_LANG.REVIEW_PLACEMENTS }
        </Button>
      </div> }
      { actionError && <p role="alert" className="p-2 text-danger">{ actionError }</p> }
      <Table
      key={ `${scope}:${page}:${pageSize}:${selectionReset}` }
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
    </>
  );
}

export default InventoryTable;
