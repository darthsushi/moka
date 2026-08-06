import { useState } from 'react';
import { Button, Skeleton, Typography } from '@heroui/react';

import { isNotNil, not } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth, useLanguage, useEscapeKey } from '@/hooks/contexts';
import { SYSTEM } from '@/settings/langs.settings';

import { Header, Icon } from '@/components/ui';
import Map from './elements/Map';
import PlacementsList from './elements/PlacementList';

function Home() {
  const { isAuthenticated, loading, profile } = useAuth();
  const { language } = useLanguage();

  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const greetingByHour = getGreeting();
  const [authName] = isNotNil(profile) ? profile.name.split(' ') : [null];
  const greating = isNotNil(authName) ? `${SYSTEM[language].TEXTS[greetingByHour]}, ${authName}` : '';

  useEscapeKey(() => setIsSearchActive(false), isSearchActive);

  return (
    <section className="w-full h-dvh flex flex-wrap overflow-y-auto"> 
      <Header>
        <div className="w-full h-full flex items-center gap-2">
          { 
            loading ?
              <Skeleton className="w-[90%] h-[70%] rounded-3xl" />
            : 
              (isAuthenticated && not(isSearchActive)) ?
                <>
                  <Button
                    variant="tertiary"
                    size="lg"
                    className="text-xl"
                    onPress={ () => setIsSearchActive(true) }
                  >
                    <Icon name="search" />
                  </Button>
                  <Typography type="h6" className="truncate">
                    <p className="truncate">
                      { greating }
                    </p>
                  </Typography>
                </>
              :
                <>b</>
          }
          {/* { 
            isSearchActive ?
              <>Search</>
            :
              <>
                <Button
                  variant="tertiary"
                  size="lg"
                  className="text-xl"
                  onPress={ () => setIsSearchActive(true) }
                >
                  <Icon name="search" />
                </Button>
                <Typography type="h6" className="truncate">
                  <p className="truncate">
                    { greating }
                  </p>
                </Typography>
              </>
          } */}
        </div>
      </Header>
      <PlacementsList />
      <Map />
    </section>
  );
}

export default Home;
