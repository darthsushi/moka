import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isNil } from '@/helpers/ramda.helpers';
import { getUnlistedPlacementUrl } from '@/helpers/utilities.helpers';
import { useAuth } from '@/hooks/contexts';
import { useInventoryFilterOptions, useInventoryPlacements, usePlacementStatus } from '@/hooks/placements';

import { Icon, Table } from '@/components/ui';
import IDCell from './table-elements/IDCell';
import EmptyContent from '../../alerts/EmptyContent.view';
import DetailsCell from './table-elements/DetailsCell';
import LocationCell from './table-elements/LocationCell';
import StatusCell from './table-elements/StatusCell';
import InventoryMapDialog from './InventoryMapDialog';

const OWNER_STATUSES = ['active', 'paused'];
const PLACEMENT_TYPES = ['UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP'];

const INITIAL_FILTERS = {
  country: null,
  state: null,
  city: null,
  visibility: ['public', 'private', 'unlisted'],
  owner_status: OWNER_STATUSES,
  type: PLACEMENT_TYPES
};

function InventoryTable({ reviewStatuses }) {
  const { t } = useTranslation();
  const initialFilters = useMemo(() => ({ ...INITIAL_FILTERS, review_status: reviewStatuses }), [reviewStatuses]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectionReset, setSelectionReset] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const {
    countries,
    states,
    cities,
    isLoading: areFilterOptionsLoading,
    error: filterOptionsError,
    refetch: refetchFilterOptions
  } = useInventoryFilterOptions();

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
    initialFilters
  });
  const refreshInventory = () => Promise.all([refetch(), refetchFilterOptions()]);
  const {
    updatingId,
    error: actionError,
    changeOwnerStatus,
    changeOwnerStatuses,
    changeReviewStatus
  } = usePlacementStatus(refreshInventory);

  // Owners can inspect pending, paused and private placements through RLS.
  // The token URL is intentionally restricted to published unlisted placements.
  const viewDetails = (placement) => navigate(`/p/${encodeURIComponent(placement.code)}`, {
    state: { backgroundLocation: location }
  });
  const copyUnlistedLink = async (placement) => {
    try {
      await navigator.clipboard.writeText(getUnlistedPlacementUrl(placement));
      setCopyFeedback('inventory:linkCopied');
    } catch {
      setCopyFeedback('inventory:copyLinkError');
    }
  };

  const handleWithdraw = (placementId) => {
    if (window.confirm(t('inventory:withdrawConfirm'))) {
      changeOwnerStatus(placementId, 'withdrawn');
    }
  };

  const handleBulkAction = async (selectedPlacements, status) => {
    if (status === 'withdrawn' && !window.confirm(
      t('inventory:withdrawMultipleConfirm', { count: selectedPlacements.length })
    )) return;

    await changeOwnerStatuses(selectedPlacements.map(({ id }) => id), status);
    setIsSelectionModeActive(false);
    setSelectionReset(current => current + 1);
  };

  const TABLE_COLS = [
    { id: 'id', displayText: t('inventory:id'), isRowHeader: true },
    { id: 'details', displayText: t('inventory:details') },
    { id: 'location', displayText: t('placements:fields.location') },
    { id: 'owner_status', displayText: t('placements:fields.ownerStatus') },
    { id: 'review_status', displayText: t('placements:fields.reviewStatus') },
    { id: 'actions', displayText: t('inventory:actions') },
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
    display_name,
    share_token
  }) => {
    const detailPlacement = { id, code, visibility, share_token };
    const canChangeAvailability = user_id === user?.id;
    const canRequestReview = user_id === user?.id && owner_status !== 'withdrawn'
      && review_status === 'rejected';
    const busy = Boolean(updatingId);
    const availabilityActionLabel = owner_status === 'active' ? t('inventory:pause') : t('inventory:resume');

    return {
      id: { render: <IDCell code={ code } isDisabled={ isSelectionModeActive } onPress={ () => viewDetails(detailPlacement) } />, value: id },
      details: {
        render: (
          <DetailsCell
            type={ t(`placements:types.${type}`) }
            faceCount={ face_count }
            structureHeight={ structure_height }
            visibility={ visibility }
            visibilityDisplay={ t(`placements:visibility.${visibility}`) }
          />
        ),
        value: type
      },
      location: { render: <LocationCell display_name={ display_name } city={ city } state={ state } country={ country } />, value: display_name },
      owner_status: {
        render: <StatusCell status={ owner_status } displayStatus={ t(`placements:ownerStatuses.${owner_status}`) } />,
        value: owner_status
      },
      review_status: {
        render: <StatusCell status={ review_status } displayStatus={ t(`placements:reviewStatuses.${review_status}`) } />,
        value: review_status
      },
      actions: {
        value: id,
        render: <div className="flex items-center gap-2">
          <Dropdown>
            <Button
              size="lg"
              variant="ghost"
              className="text-xl"
              isDisabled={ busy || isSelectionModeActive }
            >
              <Icon name="more-horiz" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item id="view-details" textValue={ t('inventory:viewDetails') } onPress={ () => viewDetails(detailPlacement) }>
                  <Label>{ t('inventory:viewDetails') }</Label>
                </Dropdown.Item>
                { visibility === 'unlisted' && share_token && <Dropdown.Item
                  id="copy-unlisted-link"
                  textValue={ t('inventory:copyUnlistedLink') }
                  isDisabled={ owner_status !== 'active' || review_status !== 'approved' }
                  onPress={ () => copyUnlistedLink(detailPlacement) }
                >
                  <Label>{ t('inventory:copyUnlistedLink') }</Label>
                </Dropdown.Item> }
                <Dropdown.Item id="edit" textValue={ t('inventory:edit') }>
                  <Label>{ t('inventory:edit') }</Label>
                </Dropdown.Item>
                { owner_status !== 'withdrawn' && <Dropdown.Item
                  id="toggle-availability"
                  textValue={ availabilityActionLabel }
                  isDisabled={ !canChangeAvailability }
                  onPress={ () => changeOwnerStatus(id, owner_status === 'active' ? 'paused' : 'active') }
                >
                  <Label>{ availabilityActionLabel }</Label>
                </Dropdown.Item> }
                { canRequestReview &&
                  <Dropdown.Item
                    id="send-for-review"
                    textValue={ t('inventory:sendForReview') }
                    isDisabled={ !canRequestReview }
                    onPress={ () => changeReviewStatus(id, 'pending') }
                  >
                    <Label>{ t('inventory:sendForReview') }</Label>
                  </Dropdown.Item>
                }
                <Dropdown.Item
                  id="withdraw"
                  textValue={ t('inventory:withdraw') }
                  isDisabled={ !canChangeAvailability || owner_status === 'withdrawn' }
                  variant="danger"
                  onPress={ () => handleWithdraw(id) }
                >
                  <Label>{ t('inventory:withdraw') }</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      }
    }
  });
  const TABLE_FILTERS = {
    filters: [
      ...[
        {
          name: 'country',
          translationKey: 'placements:fields.country',
          defaultExpended: true,
          initialValues: countries.map(({ value }) => value),
          options: countries.map(({ value, label }) => ({ id: value, label }))
        },
        {
          name: 'state',
          translationKey: 'placements:fields.state',
          initialValues: states.map(({ value }) => value),
          options: states.map(({ value, label, country }) => ({
            id: value, label: [label, country].filter(Boolean).join(', ')
          }))
        },
        {
          name: 'city',
          translationKey: 'placements:fields.city',
          initialValues: cities.map(({ value }) => value),
          options: cities.map(({ value, label, state, country }) => ({
            id: value, label: [label, state, country].filter(Boolean).join(', ')
          }))
        }
      ].filter(({ options }) => options.length > 0),
      {
        name: 'type',
        translationKey: 'placements:fields.type',
        defaultExpended: true,
        initialValues: PLACEMENT_TYPES,
        options: [
          { id: 'UNIPOLE_BILLBOARD', translationKey: 'placements:types.UNIPOLE_BILLBOARD' },
          { id: 'HAND_PAINTED_MURAL', translationKey: 'placements:types.HAND_PAINTED_MURAL' },
          { id: 'BARRICADE', translationKey: 'placements:types.BARRICADE' },
          { id: 'BUILDING_WRAP', translationKey: 'placements:types.BUILDING_WRAP' },
        ]
      },
      {
        name: 'owner_status',
        translationKey: 'placements:fields.ownerStatus',
        defaultExpended: true,
        initialValues: OWNER_STATUSES,
        options: [
          { id: 'active', translationKey: 'placements:ownerStatuses.active' },
          { id: 'paused', translationKey: 'placements:ownerStatuses.paused' }
        ]
      },
      {
        name: 'visibility',
        translationKey: 'placements:fields.visibility',
        defaultExpended: true,
        initialValues: ['public', 'private', 'unlisted'],
        options: [
          { id: 'public', translationKey: 'placements:visibility.public' },
          { id: 'private', translationKey: 'placements:visibility.private' },
          { id: 'unlisted', translationKey: 'placements:visibility.unlisted' }
        ]
      }
    ],
    activeFiltersCount,
    hasActiveFilters,
    filtersActived: filters,
    isPending: areFilterOptionsLoading,
    clearFilters,
    onApplyingFilters: (actualFilters) => {
      if (isNil(actualFilters)) {
        clearFilters()
      } else {
        const selection = (name, options) => {
          const selected = actualFilters[name] ?? [];
          return selected.length === options.length ? null : selected;
        };

        updateFilters({
          ...actualFilters,
          country: selection('country', countries),
          state: selection('state', states),
          city: selection('city', cities)
        })
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
    updateContent: refreshInventory,
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
          user_id === user?.id && owner_status !== 'withdrawn'
        );

      return [
        {
          displayText: t('inventory:pause'),
          isDisabled: !canUpdateAll || !selectedPlacements.some(({ owner_status }) => owner_status === 'active'),
          onPress: () => handleBulkAction(selectedPlacements.filter(({ owner_status }) => owner_status === 'active'), 'paused')
        },
        {
          displayText: t('inventory:withdraw'),
          variant: 'danger-soft',
          isDisabled: !canUpdateAll,
          onPress: () => handleBulkAction(selectedPlacements, 'withdrawn')
        },
        {
          displayText: t('inventory:resume'),
          isDisabled: !canUpdateAll || !selectedPlacements.some(({ owner_status }) => owner_status === 'paused'),
          onPress: () => handleBulkAction(selectedPlacements.filter(({ owner_status }) => owner_status === 'paused'), 'active')
        }
      ];
    }
  };
  const TABLE_SEARCH = {
    placeholder: t('inventory:searchById'),
    defaultValue: filters.search,
    onChange: (value) => {
      updateFilters({
        search: value
      });
    }
  };
  const TABLE_EXTRA_ACTIONS = [
    {
      displayText: t('inventory:findOnMap'),
      iconName: 'map-search',
      variant: 'primary',
      isDisabled: isEmpty || isLoading,
      onPress: () => setIsMapDialogOpen(true),
    },
  ];

  return (
    <>
      { filterOptionsError && <p role="alert" className="p-2 text-danger">{ translateError(t, filterOptionsError, 'inventory:errors.filters') }</p> }
      { actionError && <p role="alert" className="p-2 text-danger">{ translateError(t, actionError, 'inventory:errors.update') }</p> }
      { copyFeedback && <p role="status" className="p-2 text-sm">{ t(copyFeedback) }</p> }
      <Table
        key={ `${page}:${pageSize}:${selectionReset}` }
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
          { t('inventory:empty') }
        </EmptyContent>
      </Table>
      { isMapDialogOpen && <InventoryMapDialog
        userId={ user?.id }
        filters={ filters }
        initialPlacement={ placements.find(item => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)) && item.latitude != null && item.longitude != null) }
        onClose={ () => setIsMapDialogOpen(false) }
        onViewDetails={ (placement) => {
          setIsMapDialogOpen(false);
          viewDetails(placement);
        } }
      /> }
    </>
  );
}

export default InventoryTable;
