import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';

function Inventory() {
  const { language } = useLanguage();
  // const PAGES_LANG = SYSTEM_LANG[language].PAGES;

  return (
    <section className="w-full max-w-275 m-auto p-4">
      Estos son inventarios
    </section>
  );
}

export default Inventory;
