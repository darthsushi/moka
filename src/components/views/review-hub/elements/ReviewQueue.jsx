import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button, SearchField } from '@heroui/react';
import { Table } from '@/components/ui';
import { useReviewHub } from '@/hooks/review-hub/useReviewHub';
import ReviewStatus from './ReviewStatus';
import ReviewSelect from './ReviewSelect';
import ReviewAssignmentDialog from './ReviewAssignmentDialog';
import ReviewPlacementDialog from './ReviewPlacementDialog';

export default function ReviewQueue({ tab, refresh, isAdmin, onCounts }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [onlyOrphaned, setOnlyOrphaned] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const query = useReviewHub({ tab, search, status, page, onlyOrphaned, refreshKey: refresh });
  const { refetch, counts } = query;
  useEffect(() => { onCounts(counts); }, [counts, onCounts]);
  const totalPages = Math.max(1, Math.ceil(query.total / query.pageSize));
  const cols = [
    { id: 'id', displayText: t('reviewHub:placement'), isRowHeader: true },
    { id: 'owner', displayText: t('reviewHub:owner') },
    { id: 'location', displayText: t('reviewHub:location') },
    { id: 'status', displayText: t('reviewHub:status') },
    ...(tab === 'reassign' ? [{ id: 'reviewer', displayText: t('reviewHub:reviewer') }] : []),
    { id: 'actions', displayText: t('reviewHub:actions') }
  ];
  const rows = query.rows.map(placement => ({
    id: { value: placement.id, render: <div><p className="whitespace-nowrap font-semibold">{ placement.code }</p><p className="text-xs text-muted">{ t('placements:faceCount', { count: placement.face_count }) }</p></div> },
    owner: { render: <p className="max-w-40 truncate">{ placement.owner_name || t('reviewHub:unavailable') }</p> },
    location: { render: <div className="max-w-72"><p className="line-clamp-2">{ placement.display_name }</p><p className="text-xs text-muted">{ [placement.city, placement.state, placement.country].filter(Boolean).join(', ') }</p></div> },
    status: { render: <ReviewStatus status={ placement.review_status } /> },
    reviewer: { render: <div><p>{ placement.reviewer_name || t('reviewHub:unassignedLabel') }</p>{ placement.needs_reassignment && <p className="text-xs text-warning">{ t('reviewHub:reassignmentNeeded') }</p> }</div> },
    actions: { render: <div className="flex gap-2">
      { tab === 'unassigned'
        ? <Button size="sm" onPress={ () => setAssignment({ placement, action: 'claim' }) }>{ t('reviewHub:claim') }</Button>
        : <Button size="sm" variant="secondary" onPress={ () => setReviewId(placement.id) }>{ tab === 'mine' ? t('reviewHub:review') : t('reviewHub:details') }</Button> }
      { isAdmin && tab === 'reassign' && <Button size="sm" variant="tertiary" onPress={ () => setAssignment({ placement, action: 'reassign' }) }>{ t('reviewHub:transfer') }</Button> }
    </div> }
  }));

  return <>
    <div className="flex flex-wrap items-end gap-4 px-4 py-3">
      <SearchField aria-label={ t('reviewHub:search') } value={ search } onChange={ value => { setSearch(value); setPage(1); } } className="w-full sm:max-w-md">
        <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={ t('reviewHub:search') } /><SearchField.ClearButton /></SearchField.Group>
      </SearchField>
      { tab !== 'unassigned' &&
      <ReviewSelect label={ t('reviewHub:status') } value={ status || 'all' } onChange={ value => { setStatus(value === 'all' ? '' : value); setPage(1); } }
        options={ [{ id: 'all', label: t('reviewHub:allStatuses') }, ...['pending', 'in_review', 'approved', 'rejected', 'suspended'].map(id => ({ id, label: t(`placements:reviewStatuses.${id}`) }))] } /> }
      { tab === 'reassign' && <div className="max-w-xl text-sm">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={ onlyOrphaned } onChange={ event => { setOnlyOrphaned(event.target.checked); setPage(1); } } />{ t('reviewHub:onlyOrphaned') }</label>
        <p className="mt-1 text-xs text-muted">{ t('reviewHub:adminHint') }</p>
      </div> }
    </div>
    { query.error ? <div role="alert" className="p-6"><p>{ translateError(t, query.error) }</p><Button className="mt-3" onPress={ refetch }>{ t('common:actions.retry') }</Button></div> :
      <div className="flex min-h-0 flex-1 flex-col [&>[data-table-actions]]:hidden">
      <Table name="review-hub" cols={ cols } rows={ rows }
        states={ { isFechingData: query.isLoading, isEmpty: query.total === 0 } }
        pagination={ { page, pageSize: query.pageSize, totalPages, totalContent: query.total, setPage } }
      >
        <div role="status" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p>{ search || status ? t('reviewHub:emptySearch') : t('reviewHub:empty') }</p><p className="text-sm text-muted">{ t('reviewHub:emptyHint') }</p>
          { (search || status || page > 1) && <Button variant="secondary" onPress={ () => { setSearch(''); setStatus(''); setPage(1); } }>{ t('reviewHub:clearFilters') }</Button> }
          <Button variant="tertiary" onPress={ refetch }>{ t('common:actions.refresh') }</Button>
        </div>
      </Table>
      </div>
    }
    { assignment && <ReviewAssignmentDialog key={ `${assignment.placement.id}-${assignment.action}` } { ...assignment } onClose={ () => setAssignment(null) }
      onSuccess={ () => { const assigned = assignment; setAssignment(null); refetch(); if (assigned.action === 'claim') setReviewId(assigned.placement.id); } } /> }
    { reviewId && <ReviewPlacementDialog placementId={ reviewId } onClose={ () => setReviewId(null) } onSuccess={ refetch } /> }
  </>;
}
