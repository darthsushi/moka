import { useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Pagination,
  Table as HeroTable,
} from '@heroui/react';

import { isEmpty, isNil, isNotEmpty, isNotNil, not, type } from '@/helpers/ramda.helpers';
import { getValueOrDefault } from '@/helpers/utilities.helpers';
import { isFunction } from '@/helpers/validators.helper';
import { useLanguage, useEscapeKey } from '@/hooks/contexts';
import { SYSTEM } from '@/settings/langs.settings';

import Icon from '../icons/Icon.ui';
import TableSkeleton from './elements/TableSkeleton';
import FiltersList from '../filters/FiltersList.ui';
import SearchInput from '../filters/SearchInput.ui';
import NavBar from '../navbar/NavBar.ui';
import { Separator } from '@heroui/react';
import { Animations } from '@/components/animations';
import { EmptyContent } from '@/components/views';

const normalizeRowsAndColumns = (rows, columns) => {
  if (isEmpty(columns)) return {
    rows: [],
    columns: []
  };

  const columnIDs = columns.map(({ id }) => id);

  const normalizedRows = rows.map((row, index) => {

    return columnIDs.reduce((newRowObject, columnId) => {
      newRowObject[columnId] = row[columnId] !== undefined ? row[columnId] : '-';

      return newRowObject;
    }, { id: index + 1 }); /* Use a default value in case the 'id' column does not exist */
  });

  const hasColumnId = columns.some(item => item.id === 'id');

  return {
    rows: normalizedRows,
    columns: not(hasColumnId) ? [ { id: 'id', isRowHeader: true }, ...columns ] : columns
  }
};

const normalizeStateObject = ({ isFechingData, errorObject, updateContent, isEmpty, hasNoMatches }) => ({
  hasNoMatches: isNotNil(hasNoMatches) ? hasNoMatches : false,
  isEmpty: isNotNil(isEmpty) ? isEmpty : false,
  isFechingData: isNotNil(isFechingData) ? isFechingData : false,
  errorObject: isNotNil(errorObject) && isNotEmpty(errorObject) ? errorObject : null,
  updateContent: isFunction(updateContent) ? updateContent : null,
});

const normalizeFiltersSettings = ({
  filters = [],
  onApplyingFilters,
  clearFilters,
  hasActiveFilters,
  activeFiltersCount,
  filtersActived,
  isPending = false,
} = {}) => {
  const validSettings = isNotEmpty(filters) && isFunction(onApplyingFilters)
    && isFunction(clearFilters) && isNotNil(hasActiveFilters);

  if (not(validSettings)) return { enableFilters: false };

  return {
    enableFilters: true,
    filters,
    onApplyingFilters,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
    filtersActived,
    isPending
  };
};

const normalizePagination = ({
  page = 1,
  totalPages = 1,
  totalContent,
  pageSize = 10,
  setPage,
  setPageSize,
}) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalContent);
  
  return {
    page,
    totalPages,
    start,
    end,
    pageSize,
    totalContent,
    setPage: isFunction(setPage) ? setPage : null,
    setPageSize: isFunction(setPageSize) ? setPageSize : null,
  }
};

const normalizeActionButtons = (extraActions = []) => {
  return extraActions.map((action = {}) => {
    return {
      ...action,
      variant: getValueOrDefault(action.variant, ['primary', 'danger-soft', 'tertiary'], 'tertiary')
    };
  }).filter(({ displayText, isIconOnly, iconName, onPress }) => {
    if (isIconOnly && (isNil(iconName) || isEmpty(iconName))) return false;

    const hasValidAction = isFunction(onPress);
    const hasValidLabel = isIconOnly || (isNotNil(displayText) && not(isEmpty(displayText)));

    return hasValidAction && hasValidLabel;
  }).splice(0, 3);
};

const SELECTION_TYPES = [
  'none',
  'multiple'
];

// TODO: Allow optionals cols
// TODO: Allow ShortBy

function TableContent({
  name,
  rows,
  columns,
  states,
  pagination,
  tableLanguage,
  children = null,
  isSelectionModeActive,
  isSelectionBusy,
  selectedRows,
  handleSelectionChange
}) {

  if (states.isFechingData) return (
    <TableSkeleton
      columns={ columns }
      repetitions={ pagination.pageSize }
    />
  );

  if (states.hasNoMatches) return <EmptyContent />

  if (states.isEmpty) return isNil(children) ? <EmptyContent /> : children;

  // TODO: Add empty view

  return (
    <HeroTable
      data-generic-table
      aria-label={ `${name} table` }
      className="w-full rounded-4xl h-full"
    >
      <HeroTable.ScrollContainer>
        <HeroTable.Content
          aria-label={ `${name} content table` }
          selectionMode={ isSelectionModeActive ? 'multiple' : 'none' }
          selectedKeys={ selectedRows }
          onSelectionChange={ handleSelectionChange }
        >
          { not(states.isEmpty) &&
            <HeroTable.Header
              aria-label={ `${name} header table` }
              className="sticky top-0 z-50"
            >
              { isSelectionModeActive &&
                <HeroTable.Column className="pr-0">
                  <Checkbox
                    aria-label="Select all rows"
                    slot="selection"
                    isDisabled={ isSelectionBusy }
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </HeroTable.Column>
              }

              {
                columns.map(({ id: colId, displayText, isRowHeader = false }) => {
                  return (
                    <HeroTable.Column
                      key={ colId }
                      id={ colId }
                      isRowHeader={ isRowHeader }
                    >
                      { displayText }
                    </HeroTable.Column>
                  );
                })
              }
            </HeroTable.Header>
          }

          <HeroTable.Body items={ rows } >
            {
              (currentRow) => {
                const rowId = isNil(currentRow.id.render) ? currentRow.id : currentRow.id.value

                return (
                  <HeroTable.Row id={ rowId }>
                    { isSelectionModeActive &&
                      <HeroTable.Cell className="pr-0">
                        <Checkbox
                          aria-label={ `Select row` }
                          slot="selection"
                          variant="secondary"
                          isDisabled={ isSelectionBusy }
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </HeroTable.Cell>
                    }

                    {
                      Object.keys(currentRow).map((cellId) => {
                        const $rowContent = isNil(currentRow[cellId].render) ? currentRow[cellId] : currentRow[cellId].render;
                        
                        return (
                          <HeroTable.Cell key={ cellId }>
                            { $rowContent }
                          </HeroTable.Cell>
                        )
                      })
                    }
                  </HeroTable.Row>
                )
              }
            }
          </HeroTable.Body>
        </HeroTable.Content>
      </HeroTable.ScrollContainer>
      { (not(states.isEmpty) && not(states.hasNoMatches)) &&
        <HeroTable.Footer className="bottom-0 flex items-center justify-between">
          <Pagination size="sm">
            <Pagination.Summary>
              { tableLanguage.WORDS.SHOWING } { pagination.start } { tableLanguage.WORDS.TO } { pagination.end } { tableLanguage.WORDS.OF } { pagination.totalContent } { tableLanguage.WORDS.RESULTS }
            </Pagination.Summary>
            <Pagination.Summary>
              { tableLanguage.WORDS.PAGE } { pagination.page } { tableLanguage.WORDS.OF } { pagination.totalPages }
            </Pagination.Summary>
            { isNotNil(pagination.setPage) &&
              <Pagination.Content className="flex gap-3">
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={ pagination.page === 1 || states.isFechingData || isSelectionModeActive }
                    onPress={ () => pagination.setPage(pagination.page - 1) }
                  >
                    <Pagination.PreviousIcon />
                    { tableLanguage.BUTTONS.PREVIOUS }
                  </Pagination.Previous>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={ pagination.page === pagination.totalPages || states.isFechingData || isSelectionModeActive }
                    onPress={ () => pagination.setPage(pagination.page + 1) }
                  >
                    { tableLanguage.BUTTONS.NEXT }
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            }
          </Pagination>
        </HeroTable.Footer>
      }
    </HeroTable>
  )
};

function Table({
  name = 'undefined',
  cols = [],
  rows = [],
  filters = {},
  selection = {},
  states = {},
  pagination = {},
  search = {},
  children = null,
  extraActions = [],
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isSelectionModeActive, setIsSelectionMode] = useState(false);

  const { language } = useLanguage();

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedRows(new Set());
    if (isFunction(selection.onModeChange)) selection.onModeChange(false);
  };

  useEscapeKey(exitSelectionMode, isSelectionModeActive && !selection.isBusy);

  const { rows: normalizedRows, columns: normalizedColumns } = normalizeRowsAndColumns(rows, cols);
  const normalizedFilterSettings = normalizeFiltersSettings(filters);
  const normalizedStates = normalizeStateObject(states);
  const normalizedPagination = normalizePagination(pagination);
  const normalizedExtraActions = normalizeActionButtons(extraActions);
  const visibleRowKeys = normalizedRows.map(({ id }) => type(id) === 'Object' ? id.value : id);
  const visibleSelectedRows = new Set([...selectedRows].filter(key => visibleRowKeys.includes(key)));

  const selectionType = getValueOrDefault(selection.type, SELECTION_TYPES, 'none');
  const selectionActions = isFunction(selection.actionsBySelections) ? selection.actionsBySelections(visibleSelectedRows) : [];
  const normalizedSelectionActions = normalizeActionButtons(selectionActions);

  const enableSearch = isFunction(search.onChange);

  const SYSTEM_LANG = SYSTEM[language];

  const handleSelectionChange = (keys) => {
    if (selection.isBusy) return;

    let currentKeys = keys;

    if (keys === 'all') {
      currentKeys = new Set(visibleRowKeys);
    }

    currentKeys = new Set([...currentKeys].filter(key => visibleRowKeys.includes(key)));
    setSelectedRows(currentKeys);

    const hasListener = isNotNil(selection) && isFunction(selection.onSelectionChange);

    if (not(hasListener)) return;

    selection.onSelectionChange(currentKeys);
  };

  const toggleSelectionMode = () => {
    const nextValue = !isSelectionModeActive;
    setIsSelectionMode(nextValue);
    setSelectedRows(new Set());
    if (isFunction(selection.onModeChange)) selection.onModeChange(nextValue);
  };

  return (
    <>
      <NavBar className="grid grid-cols-2 gap-1">
        <div data-table-left-actions className="w-full h-full">
          <Animations.DoubleCard
            animationId={ isSelectionModeActive ? 'selection-mode' : 'table-options' }
            className="col-span-1 h-full flex items-center gap-2"
          >
            { 
              isSelectionModeActive ?
                <>
                  <Chip
                    color="accent"
                    size="lg"
                    variant="soft"
                    className="rounded-3xl py-1.5"
                  >
                    { `${visibleSelectedRows.size} ${ visibleSelectedRows.size === 1 ? SYSTEM_LANG.WORDS.SELECTED_SINGULAR : SYSTEM_LANG.WORDS.SELECTED_PLURAL }` }
                  </Chip>
                  { normalizedSelectionActions.length > 0 && <Separator variant="secondary" orientation="vertical" /> }
                  {
                    normalizedSelectionActions.map(({
                      displayText,
                      iconFilled,
                      iconName,
                      isDisabled,
                      isIconOnly,
                      variant,
                      onPress
                    }, index) => {
                      return (
                        <Button
                          key={ index }
                          onPress={ onPress }
                          isIconOnly={ isIconOnly }
                          isDisabled={ isDisabled || selection.isBusy }
                          variant={ variant }
                          size="sm"
                        >
                          { isNotNil(iconName) && <Icon filled={ iconFilled } name={ iconName } /> }
                          { not(isIconOnly) && displayText }
                        </Button>
                      )
                    })
                  }
                </>
              :
                <>
                  { enableSearch &&
                    <SearchInput
                      name={ name }
                      onChange={ search.onChange }
                      autoFocus={ true }
                      isDisabled={ normalizedStates.isFechingData || isSelectionModeActive || normalizedStates.isEmpty }
                      defaultValue={ search.defaultValue }
                      placeholder={ search.placeholder }
                    />
                  }
                  <div data-table-options className="h-full flex items-center gap-1">
                    { normalizedFilterSettings.enableFilters &&
                      <FiltersList
                        tableName={ name }
                        filters={ normalizedFilterSettings.filters }
                        hasActiveFilters={ normalizedFilterSettings.hasActiveFilters }

                        isPending={ normalizedFilterSettings.isPending || normalizedStates.isFechingData }
                        activeFiltersCount={ normalizedFilterSettings.activeFiltersCount }
                        filtersActived={ normalizedFilterSettings.filtersActived }
                        isDisabled={ isSelectionModeActive || normalizedStates.isEmpty }

                        clearFilters={ normalizedFilterSettings.clearFilters }
                        onApplyingFilters={ normalizedFilterSettings.onApplyingFilters }
                      />
                    }
                    { isNotNil(normalizedStates.updateContent) &&
                      <Button
                        variant="tertiary"
                        className="text-lg"
                        onPress={ normalizedStates.updateContent }
                        isDisabled={ normalizedStates.isFechingData || normalizedStates.isEmpty || isSelectionModeActive }
                      >
                        <Icon name="refresh" />
                      </Button>
                    }
                  </div>
                </>
            }
          </Animations.DoubleCard>
        </div>
        <div data-table-right-actions className="col-span-1 h-full flex items-center justify-end gap-1">
          { not(isSelectionModeActive) &&
            normalizedExtraActions.map(({
              displayText,
              iconFilled,
              iconName,
              isIconOnly,
              onPress,
              variant,
              isDisabled
            }, index) => {
              return (
                <Button
                  key={ index }
                  onPress={ onPress }
                  isIconOnly={ isIconOnly }
                  variant={ variant }
                  isDisabled={ normalizedStates.isFechingData || isSelectionModeActive || isDisabled }
                >
                  { isNotNil(iconName) && <Icon filled={ iconFilled } name={ iconName } /> }
                  { not(isIconOnly) && displayText }
                </Button>
              )
            })
          }
          { selectionType !== 'none' && !normalizedStates.isFechingData && (isSelectionModeActive || normalizedRows.length >= 2) &&
            <Button
              variant={ isSelectionModeActive ? 'danger' : 'ghost' }
              onPress={ toggleSelectionMode }
              isDisabled={ selection.isBusy }
            >
              <Icon name={ isSelectionModeActive ? 'close' : 'checklist' } />
              { isSelectionModeActive ? SYSTEM_LANG.BUTTONS.CANCEL : SYSTEM_LANG.BUTTONS.SELECT }
            </Button>
          }
        </div>
      </NavBar>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <TableContent
          name={ name }
          rows={ normalizedRows }
          columns={ normalizedColumns }
          states={ normalizedStates }
          pagination={ normalizedPagination }
          tableLanguage={ SYSTEM_LANG }
          isSelectionModeActive={ isSelectionModeActive }
          isSelectionBusy={ selection.isBusy }
          selectedRows={ visibleSelectedRows }
          handleSelectionChange={ handleSelectionChange }
        >
          { children }
        </TableContent>
      </div>
    </>
  );
};

export default Table;
