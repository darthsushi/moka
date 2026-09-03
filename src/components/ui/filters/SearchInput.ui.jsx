import { SearchField } from '@heroui/react';

import { noop } from '@/helpers/ramda.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';


function SearchInput({
  name = 'page',
  onChange = noop,
  autoFocus = false,
  isDisabled = false,
  defaultValue = '',
  placeholder = null,
}) {
  const { language } = useLanguage();
  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <div data-table-search className="w-full max-w-65 h-full flex items-center">
      <SearchField
        fullWidth
        autoFocus={ autoFocus }
        name="search"
        aria-label={ `Search Field ${name}` }
        onChange={ onChange }
        isDisabled={ isDisabled }
        defaultValue={ defaultValue }
      >
        <SearchField.Group aria-label={ `Search Field ${name} group` }>
          <SearchField.SearchIcon />
          <SearchField.Input
            aria-label={ `Search Input ${name}` }
            placeholder={ placeholder || SYSTEM_LANG.DEFAULTS.FIND }
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </div>
  );
}

export default SearchInput;
