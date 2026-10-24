import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth } from '@/hooks/contexts';

import { Header, HeaderTitle, Icon } from '@/components/ui';
import Catalog from './catalog';
import Dashboard from './dashboard';

function Home() {
  const { t } = useTranslation();
  const { loading, profile, roles } = useAuth();
  const [showCatalog, setShowCatalog] = useState(false);

  const dashboardRoles = ['admin', 'moderator', 'owner'].filter(role => roles.includes(role));
  const hasDashboard = dashboardRoles.length > 0;
  const translationKeyGreeting = getGreeting();
  const [firstName] = isNotNil(profile) ? profile.name?.split(' ') ?? [null] : [null];
  const displayGreeting = isNotNil(firstName) && t(`common:greetings.${translationKeyGreeting}`, { name: firstName });

  return (
    <section className="w-full h-dvh flex flex-wrap overflow-y-auto">
      <Header actions={ !loading && hasDashboard &&
        <Button
          size="sm"
          variant="tertiary"
          className="shrink-0 whitespace-nowrap"
          aria-label={ t(showCatalog ? 'common:dashboard.back' : 'common:dashboard.catalog') }
          onPress={ () => setShowCatalog(value => !value) }
        >
          <Icon name={ showCatalog ? 'bar-chart' : 'public' } />
          <span className="hidden sm:inline">
            { t(showCatalog ? 'common:dashboard.back' : 'common:dashboard.catalog') }
          </span>
        </Button>
      }>
        <HeaderTitle
          title={ displayGreeting }
          isLoading={ loading }
        />
      </Header>
      { !loading && (hasDashboard && !showCatalog
        ? <Dashboard roles={ dashboardRoles } />
        : <Catalog />) }
    </section>
  );
}

export default Home;
