import { formatDate } from '@/i18n/formatters';
import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { Button, Label, TextArea, TextField } from '@heroui/react';
import { Dialog, Icon } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import { reviewHubService } from '@/services/review-hub.service';
import { formatCurrency } from '@/i18n/formatters';
import ReviewSelect from './ReviewSelect';
import ReviewStatus from './ReviewStatus';

const formatDayRange = range => {
  const match = typeof range === 'string' ? range.match(/^\[(\d+),(\d+)\)$/) : null;
  return match ? `${match[1]}–${Number(match[2]) - 1}` : String(range ?? '—');
};

function DecisionForm({ placement, assignedToMe, onSave, busy }) {
  const { t } = useTranslation();
  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');
  if (placement.owner_status === 'withdrawn') return <p>{ t('reviewHub:withdrawn') }</p>;
  if (!assignedToMe) return <p className="text-sm text-muted">{ t('reviewHub:readonly') }</p>;
  const options = {
    pending: [{ id: 'in_review', label: t('reviewHub:start') }],
    in_review: [{ id: 'approved', label: t('reviewHub:approve') }, { id: 'rejected', label: t('reviewHub:reject') }],
    approved: [{ id: 'suspended', label: t('reviewHub:suspend') }],
    suspended: [{ id: 'in_review', label: t('reviewHub:reopen') }],
    rejected: []
  }[placement.review_status] ?? [];
  if (!options.length) return <p className="text-sm text-muted">{ t('reviewHub:rejectedHint') }</p>;
  const needsReason = action === 'rejected' || action === 'suspended';
  return <form className="flex flex-col gap-3" onSubmit={ event => { event.preventDefault(); if (action && (!needsReason || message.trim())) onSave(action, message); } }>
    <ReviewSelect label={ t('reviewHub:decision') } placeholder={ t('reviewHub:chooseDecision') } value={ action } options={ options } onChange={ setAction } isDisabled={ busy } />
    { needsReason && <TextField isRequired value={ message } onChange={ setMessage } isDisabled={ busy } className="flex flex-col gap-2">
      <Label>{ t('reviewHub:reason') }</Label><TextArea rows={ 5 } maxLength={ 2000 } placeholder={ t('reviewHub:reasonHint') } />
      <p className="text-xs text-muted">{ message.length } / 2000</p>
    </TextField> }
    <p className="text-xs text-muted">{ t('reviewHub:decisionHint') }</p>
    <Button type="submit" isPending={ busy } isDisabled={ busy || !action || (needsReason && !message.trim()) }>{ t('common:actions.save') }</Button>
  </form>;
}

export default function ReviewPlacementDialog({ placementId, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [request, setRequest] = useState({ key: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  const key = `${placementId}-${user?.id}-${refresh}`;
  useEffect(() => {
    let active = true;
    reviewHubService.detail(placementId)
      .then(data => { if (active) setRequest({ key, data }); })
      .catch(err => { if (active) setRequest({ key, error: err }); });
    return () => { active = false; };
  }, [placementId, key]);
  const save = async (action, message) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null); setSaved(false);
    try {
      await reviewHubService.act({ placement: request.data.placement, action, message: ['rejected', 'suspended'].includes(action) ? message : null });
      setSaved(true); setRefresh(value => value + 1); onSuccess();
    } catch (err) { setError(err); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const data = request.key === key ? request.data : null;
  const p = data?.placement;
  // Status-change events paired with a decision/assignment are redundant in the UI.
  // The complete append-only audit log remains available in the database.
  const events = (data?.events ?? []).filter(event => event.event_type !== 'status_changed' || !data.events.some(other =>
    other.event_type !== 'status_changed' && other.created_at === event.created_at && other.new_status === event.new_status
  ));
  return <Dialog isModalOpen setIsModalOpen={ open => { if (!open && !busy) onClose(); } } isLoading={ busy }
    title={ p?.code ?? t('reviewHub:review') } size="cover" placement="center" dismissOptions={ { enabled: true, showCloseButton: true } }>
    <div className="p-4 sm:p-6">
      { request.key !== key && <p role="status">{ t('common:loading') }</p> }
      { request.key === key && request.error && <div role="alert"><p>{ translateError(t, request.error) }</p><Button onPress={ () => setRefresh(value => value + 1) }>{ t('common:actions.retry') }</Button></div> }
      { p && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><ReviewStatus status={ p.review_status } /><span className="text-sm text-muted">{ t(`placements:types.${p.type}`, { defaultValue: p.type }) }</span></div>
            <h2 className="text-xl font-semibold">{ p.display_name }</h2>
            <p className="text-sm text-muted">{ [p.city, p.state, p.country].filter(Boolean).join(', ') }</p>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-secondary p-4 text-sm">
              { [[t('reviewHub:owner'), data.owner_name || t('reviewHub:unavailable')], [t('reviewHub:reviewer'), data.reviewer_name || t('reviewHub:unassignedLabel')], [t('reviewHub:availability'), t(`placements:ownerStatuses.${p.owner_status}`)], [t('reviewHub:visibility'), t(`placements:visibility.${p.visibility}`)], [t('reviewHub:height'), `${p.structure_height} m`], [t('reviewHub:assignedAt'), formatDate(data.assignment?.assigned_at, i18n.resolvedLanguage)]].map(([label, value]) => <div key={ label }><dt className="text-muted">{ label }</dt><dd className="break-words font-medium">{ value }</dd></div>) }
            </dl>
            <p className="text-sm">{ t('reviewHub:coordinates') }: { p.latitude }, { p.longitude } · <a className="text-accent underline" href={ `https://www.google.com/maps?q=${encodeURIComponent(`${p.latitude},${p.longitude}`)}` } target="_blank" rel="noreferrer">{ t('reviewHub:viewMap') }</a></p>
          </section>
          <section><h3 className="mb-2 font-semibold">{ t('reviewHub:description') }</h3><p className="whitespace-pre-wrap text-sm leading-6">{ p.description || t('reviewHub:noDescription') }</p></section>
          <section className="space-y-4"><h3 className="font-semibold">{ t('reviewHub:faces') } ({ data.faces.length })</h3>
            { !data.faces.length && <p className="text-sm text-muted">{ t('reviewHub:noFaces') }</p> }
            { data.faces.map((face, index) => <article key={ face.id } className="space-y-3 rounded-xl border border-default p-4">
              <h4 className="font-semibold">{ t('reviewHub:face') } { index + 1 }</h4>
              <div className="flex flex-wrap gap-4 text-sm"><p>{ t('reviewHub:dimensions') }: { face.display_width } × { face.display_height } m</p><p>{ t('reviewHub:price') }: { formatCurrency(face.period_price, 'MXN', i18n.resolvedLanguage) }</p><p>{ t('reviewHub:days') }: { formatDayRange(face.day_range) }</p></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                { (face.images ?? []).map((url, imageIndex) => <a key={ `${url}-${imageIndex}` } href={ /^https?:\/\//i.test(url) ? url : undefined } target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg bg-surface-secondary">
                  <img src={ /^https?:\/\//i.test(url) ? url : undefined } alt={ `${t('reviewHub:face')} ${index + 1} · ${imageIndex + 1}` } loading="lazy" className="h-52 w-full object-contain" />
                </a>) }
                { !face.images?.length && <p className="text-sm text-muted">{ t('reviewHub:noImages') }</p> }
              </div>
            </article>) }
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-xl bg-surface-secondary p-4">
            <DecisionForm key={ p.review_revision } placement={ p } assignedToMe={ data.assignment?.reviewer_id === user?.id } onSave={ save } busy={ busy } />
            { error && <div role="alert" className="mt-3 text-sm text-danger"><p>{ translateError(t, error) }</p><Button variant="tertiary" isDisabled={ busy } onPress={ () => { setError(null); setRefresh(value => value + 1); } }>{ t('common:actions.refresh') }</Button></div> }
            { saved && <p role="status" className="mt-3 text-sm text-success">{ t('reviewHub:saved') }</p> }
          </section>
          <section><h3 className="mb-3 flex items-center gap-2 font-semibold"><Icon name="schedule" />{ t('reviewHub:history') }</h3>
            { !events.length && <p className="text-sm text-muted">{ t('reviewHub:noHistory') } { t('reviewHub:oldHistory') }</p> }
            <ol className="space-y-4">{ events.map(event => <li key={ event.id } className="border-l-2 border-default pl-3 text-sm">
              <p className="font-semibold">{ t(`reviewHub:events.${event.event_type}`) }</p>
              <p>{ event.actor_name || (event.actor_id ? event.actor_id.slice(0, 8) : t('reviewHub:system')) }</p>
              <p className="text-xs text-muted">{ formatDate(event.created_at, i18n.resolvedLanguage) }</p>
              { event.previous_status !== event.new_status && <p className="mt-1">{ t(`placements:reviewStatuses.${event.previous_status}`) } → { t(`placements:reviewStatuses.${event.new_status}`) }</p> }
              { event.reviewer_id && <p className="mt-1 text-xs">{ event.previous_reviewer_name && `${event.previous_reviewer_name} → ` }{ event.reviewer_name || event.reviewer_id.slice(0, 8) }</p> }
              { event.message && <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-surface-secondary p-2">{ event.message }</p> }
            </li>) }</ol>
          </section>
        </aside>
      </div> }
      <div className="mt-5 flex justify-end"><Button variant="secondary" isDisabled={ busy } onPress={ onClose }>{ t('common:actions.close') }</Button></div>
    </div>
  </Dialog>;
}
