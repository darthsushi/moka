import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Header } from '@heroui/react';

import { useAuth, useUI } from '@/hooks/contexts';
import { useNotifications } from '@/hooks/useNotifications';

function Notifications({ compact = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isSidebarOpen } = useUI();
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();

  if (!isAuthenticated) return null;

  const onAction = async key => {
    const notification = items.find(item => item.id === String(key));
    if (!notification) return;
    try {
      if (!notification.read_at) await markRead(notification.id);
    } catch {
      void refresh();
    }
    if (!notification.placement_id) return;
    navigate(['review_assigned', 'review_reassigned', 'review_requested'].includes(notification.kind)
      ? '/review-hub#mine' : `/p/${notification.placement_code}`);
  };

  const renderItem = item => {
    const status = item.review_status ? t(`placements:reviewStatuses.${item.review_status}`) : '';
    const label = t(`common:notifications.kinds.${item.kind}`, {
      code: item.placement_code || t('common:notifications.space'), status
    });
    return (
      <Dropdown.Item key={ item.id } id={ item.id } textValue={ label }>
        <div className="flex w-full items-start gap-2 py-1">
          <span aria-hidden="true" className={ `mt-2 h-2 w-2 shrink-0 rounded-full ${item.read_at ? 'bg-transparent' : 'bg-accent'}` } />
          <div className="min-w-0 flex-1">
            <p className={ `text-sm leading-snug ${item.read_at ? 'text-muted' : 'font-semibold'}` }>{ label }</p>
            <p className="mt-1 text-xs text-muted">
              { new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at)) }
            </p>
          </div>
        </div>
      </Dropdown.Item>
    );
  };

  const pending = items.filter(item => !item.read_at);
  const previous = items.filter(item => item.read_at);

  return (
    <div className={ compact ? 'w-auto' : 'w-full px-3 pb-3' }>
      <Dropdown>
        <Button fullWidth={ !compact } variant="outline" size="lg"
          aria-label={ t('common:notifications.title') }
          className={ `flex items-center ${isSidebarOpen && !compact ? 'justify-between' : 'justify-center'}` }>
          <span className="flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
            </svg>
            { isSidebarOpen && !compact && t('common:notifications.title') }
          </span>
          { unreadCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white" aria-label={ t('common:notifications.unread', { count: unreadCount }) }>
            { unreadCount > 99 ? '99+' : unreadCount }
          </span> }
        </Button>
        <Dropdown.Popover className="w-[min(360px,calc(100vw-24px))] max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1">
            <strong>{ t('common:notifications.title') }</strong>
            { unreadCount > 0 && <Button size="sm" variant="ghost" onPress={ () => { void markAllRead().catch(() => refresh()); } }>
              { t('common:notifications.markAllRead') }
            </Button> }
          </div>
          { error && <div className="px-3 py-2 text-sm text-danger">
            { t('common:notifications.error') }
            <Button size="sm" variant="ghost" onPress={ () => { void refresh(); } }>{ t('common:actions.retry') }</Button>
          </div> }
          { !error && !items.length && <p className="px-3 py-5 text-sm text-muted">
            { loading ? t('common:loading.loading') : t('common:notifications.empty') }
          </p> }
          { items.length > 0 && <Dropdown.Menu aria-label={ t('common:notifications.title') } onAction={ onAction }>
            { pending.length > 0 && <Dropdown.Section>
              <Header>{ t('common:notifications.unreadHeading') }</Header>
              { pending.map(renderItem) }
            </Dropdown.Section> }
            { previous.length > 0 && <Dropdown.Section>
              <Header>{ t('common:notifications.previousHeading') }</Header>
              { previous.map(renderItem) }
            </Dropdown.Section> }
          </Dropdown.Menu> }
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

export default Notifications;
