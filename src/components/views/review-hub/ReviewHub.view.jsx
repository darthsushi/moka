import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button, Tabs, Typography } from '@heroui/react';
import { Header, Icon } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import ReviewQueue from './elements/ReviewQueue';

function ReviewHubView() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [tab, setTab] = useState('unassigned');
  const [counts, setCounts] = useState({});
  const [refresh, setRefresh] = useState(0);

  const isAdmin = hasRole('admin');
  const selectedTab = tab === 'reassign' && !isAdmin ? 'unassigned' : tab;
  const tabs = ['unassigned', 'mine', ...(isAdmin ? ['reassign'] : [])];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <div className="flex w-full items-center justify-between gap-3">
          <Typography type="h4"><p>{ t('common:pages.reviewHub') }</p></Typography>
          <Button variant="tertiary" onPress={ () => setRefresh(value => value + 1) }><Icon name="refresh" />{ t('common:actions.refresh') }</Button>
        </div>
      </Header>
      <p className="px-4 py-3 text-sm text-muted">{ t('reviewHub:subtitle') }</p>
      <Tabs selectedKey={ selectedTab } onSelectionChange={ setTab } className="flex min-h-0 flex-1 flex-col">
        <Tabs.ListContainer className="mx-3 overflow-x-auto">
          <Tabs.List aria-label={ t('common:pages.reviewHub') }>
            { tabs.map(key => <Tabs.Tab key={ key } id={ key } className="whitespace-nowrap">
              { t(`reviewHub:${key}`) }<span className="ml-2 rounded-full bg-default px-2 text-xs">{ counts[key] ?? '—' }</span><Tabs.Indicator />
            </Tabs.Tab>) }
          </Tabs.List>
        </Tabs.ListContainer>
        { tabs.map(key => <Tabs.Panel key={ key } id={ key } className="flex min-h-0 flex-1 flex-col">
          { selectedTab === key && <ReviewQueue key={ `${key}-${user?.id}` } tab={ key } refresh={ refresh } isAdmin={ isAdmin } onCounts={ setCounts } /> }
        </Tabs.Panel>) }
      </Tabs>
    </div>
  );
}
export default ReviewHubView;
