import { useState } from 'react';
import { Button } from '@heroui/react';

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

  const selectScope = (nextScope) => {
    clearError();
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
          { canChangeAvailability && owner_status !== 'withdrawn' && <>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={ busy }
              onPress={ () => changeOwnerStatus(id, owner_status === 'active' ? 'paused' : 'active') }
            >
              { owner_status === 'active' ? TABLE_LANG.PAUSE : TABLE_LANG.RESUME }
            </Button>
            <Button size="sm" variant="danger-soft" isDisabled={ busy } onPress={ () => handleWithdraw(id) }>
              { TABLE_LANG.WITHDRAW }
            </Button>
          </> }
          { isAdmin && owner_status === 'withdrawn' && <Button
            size="sm"
            variant="tertiary"
            isDisabled={ busy }
            onPress={ () => restorePlacement(id) }
          >
            { TABLE_LANG.RESTORE }
          </Button> }
          { isTeam && <select
            aria-label={ TABLE_LANG.REVIEW_STATUS }
            value={ review_status }
            disabled={ busy }
            onChange={ (event) => changeReviewStatus(id, event.target.value) }
          >
            { REVIEW_STATUSES.map(status => (
              <option key={ status } value={ status }>{ TABLE_LANG[status.toUpperCase()] }</option>
            )) }
          </select> }
          { canRequestReview && <Button
            size="sm"
            variant="tertiary"
            isDisabled={ busy }
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
        <Button size="sm" variant={ scope === 'mine' ? 'primary' : 'tertiary' } onPress={ () => selectScope('mine') }>
          { TABLE_LANG.MY_PLACEMENTS }
        </Button>
        <Button size="sm" variant={ scope === 'review' ? 'primary' : 'tertiary' } onPress={ () => selectScope('review') }>
          { TABLE_LANG.REVIEW_PLACEMENTS }
        </Button>
      </div> }
      { actionError && <p role="alert" className="p-2 text-danger">{ actionError }</p> }
      <Table
      name="inventory"
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
