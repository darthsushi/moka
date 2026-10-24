import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth } from '@/hooks/contexts';

import { Header, HeaderTitle } from '@/components/ui';
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
      <Header>
        <HeaderTitle
          title={ displayGreeting }
          isLoading={ loading }
        />
        { !loading && hasDashboard &&
          <Button size="sm" variant="tertiary" onPress={ () => setShowCatalog(value => !value) }>
            { t(showCatalog ? 'common:dashboard.back' : 'common:dashboard.catalog') }
          </Button>
        }
      </Header>
      { !loading && (hasDashboard && !showCatalog
        ? <Dashboard roles={ dashboardRoles } />
        : <Catalog />) }
    </section>
  );
}

export default Home;
