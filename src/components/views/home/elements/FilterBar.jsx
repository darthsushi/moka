import { Button, Form, SearchField } from '@heroui/react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useUI } from '../../../../hooks/useUI.hook';
import { SYSTEM as SYSTEM_LANGS } from '../../../../settings/langs.settings';
import { not } from '../../../../helpers/ramda.helpers';
import Icon from '../../../icons';

function FilterBar() {
  const { language } = useLanguage();
  const { isMapOpen, setIsMapOpen } = useUI();
  
  const SYSTEM_TEXTS = SYSTEM_LANGS[language].TEXTS;

  return (
    <div
      aria-label="filter bar"
      className="sticky w-full h-20 grid grid-cols-8 gap-1 p-2 top-0 bg-background-tertiary z-30"
    >
      <div className={ `${ isMapOpen ? 'col-span-4' : 'col-span-2' } h-full` }>
        <Form className="w-full h-full flex items-center p-1">
          <SearchField
            aria-label="search filter"
            fullWidth
            variant="secondary"
            name="search"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={ SYSTEM_TEXTS.FIND_BY_PLACEMENT } />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Form>
      </div>
      <div className="h-full flex justify-center items-center pl-1 col-span-1">
        <Button
          fullWidth
          variant="tertiary"
        >
          <Icon name="filter" filled />
        </Button>
      </div>
      <div className="col-span-3 h-full flex  items-center">
        <div className="w-full max-w-40 h-9 overflow-hidden rounded-3xl flex">
          <Button
            variant={ not(isMapOpen) ? 'primary' : 'tertiary' }
            fullWidth
            className="h-full rounded-none"
            onPress={ () => setIsMapOpen(false) }
          >
            Lista
          </Button>
          <Button
            variant={ isMapOpen ? 'primary' : 'tertiary' }
            fullWidth
            className="h-full rounded-none"
            onPress={ () => setIsMapOpen(true) }
          >
            Mapa
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
