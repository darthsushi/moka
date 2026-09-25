import { useState } from 'react';
import {
  Accordion,
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Chip,
  ToggleButton
} from '@heroui/react';

import { isEmpty, noop, not } from '@/helpers/ramda.helpers';
import { equalsIgnoreOrderNative } from '@/helpers/utilities.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS, TABLE_LANGS } from '@/settings/langs.settings';

import Dialog from '../dialog/Dialog.ui';
import Icon from '../icons/Icon.ui';

const getDefaultExpandedNames = (filters = []) =>
  filters
    .filter(({ defaultExpended }) => defaultExpended === true)
    .map(({ name }) => name);

const countAppliedFilters = (actualFilters, initialFilters) =>
  Object.values(actualFilters).filter(({ name, values }) => not(equalsIgnoreOrderNative(values, initialFilters[name].values))).length;

const getFilterToApply = (actualFilters) => {
  const filtersToApply = {};

  Object.keys(actualFilters).forEach((filterName) => {
    filtersToApply[filterName] = isEmpty((actualFilters[filterName].values || [])) ? [] : (actualFilters[filterName].values || []);
  });

  return filtersToApply;
};

const normalizeFilter = (filters = []) => {
  const actualFilters = {};
  
  filters.forEach(({ initialValues, name, iconName, translationKey, options }) => {
    actualFilters[name] = {
      name,
      options,
      iconName,
      translationKey,
      values: initialValues,
    };
  });

  return actualFilters;
};

function FilterOption({
  tableName,
  setValues,
  filter: { translationKey, name, iconName, values, options },
}) {
  const { language } = useLanguage();

  const FILTER_OPTIONS_LANG = TABLE_LANGS[language][tableName.toLocaleUpperCase()] ?? {};

  const handleSelectedChange = (values = []) => {
    if (values.length === 0) return;

    setValues(name, values);
  };

  return (
    <Accordion.Item id={ name } className="p-0 m-0">
      <Accordion.Heading  className="sticky top-0 z-20 bg-surface-secondary">
        <Accordion.Trigger>
          { 
            iconName ?
              <span className="me-3 size-4 shrink-0 text-muted">
                <Icon name={ iconName } />
              </span>
            :
              null
          }
          { FILTER_OPTIONS_LANG[translationKey] ?? translationKey }
           <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body className="w-full px-2 pb-3">
          <div className="ms-3 flex flex-col gap-1">
            <CheckboxGroup aria-label={ `${name} options` } value={ values } onChange={ handleSelectedChange }>
              {
                options.map(({ id, translationKey, label }) => (
                  <Checkbox key={ id } value={ id }>
                    <Checkbox.Content className="w-full flex flex-row items-center gap-1">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      { label ?? FILTER_OPTIONS_LANG[translationKey] ?? id }
                    </Checkbox.Content>
                  </Checkbox>
                ))
              }
            </CheckboxGroup>
          </div>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

function FiltersList({
    tableName = '',
    filters = [],
    isPending = false,
    isDisabled = false,
    hasActiveFilters,
    activeFiltersCount,
    onApplyingFilters = noop
  }) {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM_LANGS[language];

  const INITIAL_FILTERS = normalizeFilter(filters);
  const DEFAULT_EXPANDED = getDefaultExpandedNames(filters);

  const [actualFilters, setActualFilters] = useState(INITIAL_FILTERS);
  const [filtersBeforeOpen, setFiltersBeforeOpen] = useState(INITIAL_FILTERS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const setFilterValues = (name, values) => {
    setActualFilters({
      ...actualFilters,
      [name]: {
        ...actualFilters[name],
        values
      }
    });
  };

  const resetFilters = () => {
    setActualFilters(() => INITIAL_FILTERS);
    setFiltersBeforeOpen(() => INITIAL_FILTERS);
    onApplyingFilters(null);
  };

  const handleOpenFilter = () => {
    setFiltersBeforeOpen(() => actualFilters);
    setIsFilterPanelOpen(true);
  }

  const handleApplyFilters = () => {
    const actualAppliedFiltersCount = countAppliedFilters(actualFilters, INITIAL_FILTERS);

    const isDefaultValues = actualAppliedFiltersCount < 1;
    onApplyingFilters(isDefaultValues ? null : getFilterToApply({ ...actualFilters }, { ...INITIAL_FILTERS }));

    setIsFilterPanelOpen(false);
  };

  const handleFilterDismiss = () => {
    setActualFilters(() => filtersBeforeOpen);
    setIsFilterPanelOpen(false);
  };

  if (isEmpty(filters)) return;

  return (
    <>
      <ButtonGroup variant={ hasActiveFilters ? 'ghost' : 'tertiary' }>
        <ToggleButton
          aria-label={ `${tableName} filter` }
          isDisabled={ isDisabled || isPending }
          onPress={ handleOpenFilter }
          isSelected={ hasActiveFilters }
          className={ hasActiveFilters ? 'rounded-r-none' : '' }
        >
          { SYSTEM_LANG.WORDS.FILTERS }
          { hasActiveFilters && <Chip variant="soft">{ activeFiltersCount }</Chip> }
        </ToggleButton>
        { hasActiveFilters &&
          <Button
            isIconOnly
            variant="danger-soft"
            isDisabled={ isDisabled || isPending }
            aria-label={ `${tableName} reset filter` }
            onPress={ resetFilters }
          >
            <Icon name="close" />
          </Button>
        }
      </ButtonGroup>

      <Dialog
        size="sm"
        variant="opaque"
        isModalOpen={ isFilterPanelOpen }
        setIsModalOpen={ handleFilterDismiss }
        title={ SYSTEM_LANG.WORDS.FILTERS }
      >
        <div className="flex flex-col gap-2">
          <Accordion
            allowsMultipleExpanded
            className="w-full bg-surface-secondary max-h-80 overflow-y-auto"
            variant="surface"
            defaultExpandedKeys={ DEFAULT_EXPANDED }
          >
            {
              Object.keys(actualFilters).map((filterName, index) =>
                <FilterOption
                  key={ index }
                  tableName={ tableName }
                  filter={ actualFilters[filterName] }
                  setValues={ setFilterValues }
                />
              )
            }
          </Accordion>
          <div className="w-full">
            <Button fullWidth size="lg" onPress={ handleApplyFilters }>
              { SYSTEM_LANG.BUTTONS.APPLY_FILTERS }
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default FiltersList;
