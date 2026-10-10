import { useEffect, useState } from 'react';
import { Button, SearchField } from '@heroui/react';
import { Table } from '@/components/ui';
import { useReviewHub } from '@/hooks/review-hub/useReviewHub';
import ReviewStatus from './ReviewStatus';
import ReviewSelect from './ReviewSelect';
import ReviewAssignmentDialog from './ReviewAssignmentDialog';
import ReviewPlacementDialog from './ReviewPlacementDialog';
import { reviewError } from '../langs';

export default function ReviewQueue({ tab, refresh, text, language, isAdmin, onCounts }) {
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
    { id: 'id', displayText: text.placement, isRowHeader: true },
    { id: 'owner', displayText: text.owner },
    { id: 'location', displayText: text.location },
    { id: 'status', displayText: text.status },
    ...(tab === 'reassign' ? [{ id: 'reviewer', displayText: text.reviewer }] : []),
    { id: 'actions', displayText: text.actions }
  ];
  const rows = query.rows.map(placement => ({
    id: { value: placement.id, render: <div><p className="whitespace-nowrap font-semibold">{ placement.code }</p><p className="text-xs text-muted">{ placement.face_count } { text.faces.toLowerCase() }</p></div> },
    owner: { render: <p className="max-w-40 truncate">{ placement.owner_name || text.unavailable }</p> },
    location: { render: <div className="max-w-72"><p className="line-clamp-2">{ placement.display_name }</p><p className="text-xs text-muted">{ [placement.city, placement.state, placement.country].filter(Boolean).join(', ') }</p></div> },
    status: { render: <ReviewStatus status={ placement.review_status } text={ text } /> },
    reviewer: { render: <div><p>{ placement.reviewer_name || text.unassignedLabel }</p>{ placement.needs_reassignment && <p className="text-xs text-warning">{ text.reassignmentNeeded }</p> }</div> },
    actions: { render: <div className="flex gap-2">
      { tab === 'unassigned'
        ? <Button size="sm" onPress={ () => setAssignment({ placement, action: 'claim' }) }>{ text.claim }</Button>
        : <Button size="sm" variant="secondary" onPress={ () => setReviewId(placement.id) }>{ tab === 'mine' ? text.review : text.details }</Button> }
      { isAdmin && tab === 'reassign' && <Button size="sm" variant="tertiary" onPress={ () => setAssignment({ placement, action: 'reassign' }) }>{ text.transfer }</Button> }
    </div> }
  }));

  return <>
    <div className="flex flex-wrap items-end gap-4 px-4 py-3">
      <SearchField aria-label={ text.search } value={ search } onChange={ value => { setSearch(value); setPage(1); } } className="w-full sm:max-w-md">
        <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={ text.search } /><SearchField.ClearButton /></SearchField.Group>
      </SearchField>
      { tab !== 'unassigned' &&
      <ReviewSelect label={ text.status } value={ status || 'all' } onChange={ value => { setStatus(value === 'all' ? '' : value); setPage(1); } }
        options={ [{ id: 'all', label: text.allStatuses }, ...['pending', 'in_review', 'approved', 'rejected', 'suspended'].map(id => ({ id, label: text.states[id] }))] } /> }
      { tab === 'reassign' && <div className="max-w-xl text-sm">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={ onlyOrphaned } onChange={ event => { setOnlyOrphaned(event.target.checked); setPage(1); } } />{ text.onlyOrphaned }</label>
        <p className="mt-1 text-xs text-muted">{ text.adminHint }</p>
      </div> }
    </div>
    { query.error ? <div role="alert" className="p-6"><p>{ reviewError(query.error, text) }</p><Button className="mt-3" onPress={ refetch }>{ text.retry }</Button></div> :
      <div className="flex min-h-0 flex-1 flex-col [&>[data-table-actions]]:hidden">
      <Table name="review-hub" cols={ cols } rows={ rows }
        states={ { isFechingData: query.isLoading, isEmpty: query.total === 0 } }
        pagination={ { page, pageSize: query.pageSize, totalPages, totalContent: query.total, setPage } }
      >
        <div role="status" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p>{ search || status ? text.emptySearch : text.empty }</p><p className="text-sm text-muted">{ text.emptyHint }</p>
          { (search || status || page > 1) && <Button variant="secondary" onPress={ () => { setSearch(''); setStatus(''); setPage(1); } }>{ text.clearFilters }</Button> }
          <Button variant="tertiary" onPress={ refetch }>{ text.refresh }</Button>
        </div>
      </Table>
      </div>
    }
    { assignment && <ReviewAssignmentDialog key={ `${assignment.placement.id}-${assignment.action}` } { ...assignment } text={ text } onClose={ () => setAssignment(null) }
      onSuccess={ () => { const assigned = assignment; setAssignment(null); refetch(); if (assigned.action === 'claim') setReviewId(assigned.placement.id); } } /> }
    { reviewId && <ReviewPlacementDialog placementId={ reviewId } text={ text } language={ language } onClose={ () => setReviewId(null) } onSuccess={ refetch } /> }
  </>;
}
