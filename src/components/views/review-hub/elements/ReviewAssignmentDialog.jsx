import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { Button, Label, TextArea, TextField } from '@heroui/react';
import { Dialog } from '@/components/ui';
import { reviewHubService } from '@/services/review-hub.service';
import ReviewSelect from './ReviewSelect';

export default function ReviewAssignmentDialog({ placement, action, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [reviewers, setReviewers] = useState(null);
  const [reviewerId, setReviewerId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  const transfer = action === 'reassign';
  useEffect(() => {
    if (!transfer) return;
    let active = true;
    reviewHubService.reviewers()
      .then(data => { if (active) { setReviewers(data.filter(item => item.id !== placement.user_id && item.id !== placement.reviewer_id)); setError(null); } })
      .catch(err => { if (active) setError(err); });
    return () => { active = false; };
  }, [transfer, placement.user_id, placement.reviewer_id, retry]);
  const submit = async event => {
    event.preventDefault();
    if (inFlight.current || (transfer && (!message.trim() || !reviewerId))) return;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      await reviewHubService.act({ placement, action, reviewerId: transfer ? reviewerId : null, message });
      onSuccess();
    } catch (err) { setError(err); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Dialog isModalOpen setIsModalOpen={ open => { if (!open && !busy) onClose(); } } isLoading={ busy }
    title={ transfer ? t('reviewHub:transferTitle') : t('reviewHub:claimTitle') } placement="center" size="lg"
    dismissOptions={ { enabled: true, showCloseButton: true } }>
    <form onSubmit={ submit } className="flex flex-col gap-4 p-5">
      <p className="font-semibold">{ placement.code }</p>
      <p className="text-sm text-muted">{ transfer ? t('reviewHub:transferHint') : t('reviewHub:claimHint') }</p>
      { transfer && <>
        { reviewers === null ? <p role="status">{ t('common:loading') }</p> : reviewers.length === 0 ? <p>{ t('reviewHub:noReviewers') }</p> :
          <ReviewSelect label={ t('reviewHub:reviewer') } placeholder={ t('reviewHub:selectReviewer') } value={ reviewerId } onChange={ setReviewerId } isDisabled={ busy }
            options={ reviewers.map(item => ({ id: item.id, label: `${item.name || t('reviewHub:unavailable')} · ${item.id.slice(0, 8)}` })) } /> }
        <TextField isRequired value={ message } onChange={ setMessage } isDisabled={ busy } className="flex flex-col gap-2">
          <Label>{ t('reviewHub:reason') }</Label><TextArea rows={ 4 } maxLength={ 2000 } placeholder={ t('reviewHub:transferReason') } />
        </TextField>
        <p className="text-xs text-muted">{ message.length } / 2000</p>
      </> }
      { error && <div role="alert" className="text-sm text-danger"><p>{ translateError(t, error) }</p>{ transfer && reviewers === null && <Button variant="tertiary" onPress={ () => setRetry(value => value + 1) }>{ t('common:actions.retry') }</Button> }</div> }
      <div className="flex justify-end gap-2">
        <Button variant="tertiary" isDisabled={ busy } onPress={ onClose }>{ t('common:actions.cancel') }</Button>
        <Button type="submit" isPending={ busy } isDisabled={ busy || (transfer && (!reviewerId || !message.trim())) }>{ transfer ? t('reviewHub:transfer') : t('reviewHub:confirm') }</Button>
      </div>
    </form>
  </Dialog>;
}
