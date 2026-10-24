import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Chip, Tabs } from '@heroui/react';

import { Header, HeaderTitle, Icon } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';

import ReviewQueue from './elements/ReviewQueue';

function ReviewHubView() {
  const { t } = useTranslation();
  const { hasRole, user, loading: isAuthLoading } = useAuth();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [refresh, setRefresh] = useState(0);

  const isAdmin = hasRole('admin');
  const tabs = ['unassigned', 'mine', ...(isAdmin ? ['reassign'] : [])];
  const hashTab = hash.slice(1);
  const selectedTab = tabs.includes(hashTab) ? hashTab : 'unassigned';

  useEffect(() => {
    if (!isAuthLoading && hashTab !== selectedTab) {
      navigate({ hash: `#${selectedTab}` }, { replace: true });
    }
  }, [hashTab, isAuthLoading, navigate, selectedTab]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <HeaderTitle
          title={ t('common:pages.reviewHub') }
          subtitle={ t('reviewHub:subtitle') }
        />
      </Header>

      <Tabs
        selectedKey={ selectedTab }
        onSelectionChange={ key => navigate({ hash: `#${key}` }) }
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex">
          <Tabs.ListContainer className="mx-3 w-fit">
            <Tabs.List aria-label={ t('common:pages.reviewHub') }>
              {
                tabs.map(key =>
                  <Tabs.Tab
                    key={ key }
                    id={ key }
                    className="whitespace-nowrap gap-1"
                  >
                    { t(`reviewHub:${key}`) }
                    <Chip size="sm">
                      { counts[key] ?? '-' }
                    </Chip>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                )
              }
            </Tabs.List>
          </Tabs.ListContainer>
           <Button
              variant="tertiary"
              onPress={ () => setRefresh(value => value + 1) }
            >
              <Icon name="refresh" />{ t('common:actions.refresh') }
          </Button>
        </div>
        {
          tabs.map((key) => 
            <Tabs.Panel
              key={ key }
              id={ key }
              className="flex min-h-0 flex-1 flex-col"
            >
              { selectedTab === key &&
                <ReviewQueue
                  key={ `${key}-${user?.id}` }
                  tab={ key }
                  refresh={ refresh }
                  isAdmin={ isAdmin }
                  onCounts={ setCounts }
                />
              }
            </Tabs.Panel>
          )
        }
      </Tabs>
    </div>
  );
}

export default ReviewHubView;
