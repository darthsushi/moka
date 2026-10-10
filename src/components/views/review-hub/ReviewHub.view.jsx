import { useState } from 'react';
import { Button, Tabs, Typography } from '@heroui/react';
import { Header, Icon } from '@/components/ui';
import { useAuth, useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';
import ReviewQueue from './elements/ReviewQueue';
import { REVIEW_HUB_LANGS } from './langs';

function ReviewHubView() {
  const { language } = useLanguage();
  const { hasRole, user } = useAuth();
  const [tab, setTab] = useState('unassigned');
  const [counts, setCounts] = useState({});
  const [refresh, setRefresh] = useState(0);
  const text = REVIEW_HUB_LANGS[language] ?? REVIEW_HUB_LANGS.es;
  const isAdmin = hasRole('admin');
  const selectedTab = tab === 'reassign' && !isAdmin ? 'unassigned' : tab;
  const tabs = ['unassigned', 'mine', ...(isAdmin ? ['reassign'] : [])];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <div className="flex w-full items-center justify-between gap-3">
          <Typography type="h4"><p>{ SYSTEM_LANGS[language].PAGES.REVIEW_HUB }</p></Typography>
          <Button variant="tertiary" onPress={ () => setRefresh(value => value + 1) }><Icon name="refresh" />{ text.refresh }</Button>
        </div>
      </Header>
      <p className="px-4 py-3 text-sm text-muted">{ text.subtitle }</p>
      <Tabs selectedKey={ selectedTab } onSelectionChange={ setTab } className="flex min-h-0 flex-1 flex-col">
        <Tabs.ListContainer className="mx-3 overflow-x-auto">
          <Tabs.List aria-label={ SYSTEM_LANGS[language].PAGES.REVIEW_HUB }>
            { tabs.map(key => <Tabs.Tab key={ key } id={ key } className="whitespace-nowrap">
              { text[key] }<span className="ml-2 rounded-full bg-default px-2 text-xs">{ counts[key] ?? '—' }</span><Tabs.Indicator />
            </Tabs.Tab>) }
          </Tabs.List>
        </Tabs.ListContainer>
        { tabs.map(key => <Tabs.Panel key={ key } id={ key } className="flex min-h-0 flex-1 flex-col">
          { selectedTab === key && <ReviewQueue key={ `${key}-${user?.id}` } tab={ key } refresh={ refresh } text={ text } language={ language } isAdmin={ isAdmin } onCounts={ setCounts } /> }
        </Tabs.Panel>) }
      </Tabs>
    </div>
  );
}
export default ReviewHubView;
