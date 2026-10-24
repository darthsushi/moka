import { useTranslation } from 'react-i18next';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth } from '@/hooks/contexts';

import { Header, HeaderTitle } from '@/components/ui';
import Catalog from './catalog';

function Home() {
  const { t } = useTranslation();
  const { loading, profile } = useAuth();

  const translationKeyGreeting = getGreeting();
  const [firstName] = isNotNil(profile) ? profile.name.split(' ') : [null];
  const displayGreeting = isNotNil(firstName) && t(`common:greetings.${translationKeyGreeting}`, { name: firstName });

  return (
    <section className="w-full h-dvh flex flex-wrap overflow-y-auto">
      <Header>
        <HeaderTitle
          title={ displayGreeting }
          isLoading={ loading }
        />
      </Header>
      <Catalog />
    </section>
  );
}

export default Home;
