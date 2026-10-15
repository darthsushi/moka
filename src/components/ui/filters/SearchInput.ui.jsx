import { useTranslation } from 'react-i18next';
import { SearchField } from '@heroui/react';

import { noop } from '@/helpers/ramda.helpers';

function SearchInput({
  name = 'page',
  onChange = noop,
  autoFocus = false,
  isDisabled = false,
  defaultValue = '',
  placeholder = null,
}) {
  const { t } = useTranslation();

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
            placeholder={ placeholder || t('common:defaults.find') }
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </div>
  );
}

export default SearchInput;
