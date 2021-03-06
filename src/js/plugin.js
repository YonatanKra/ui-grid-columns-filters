(function () {
  'use strict';
  // angular merge fallback
  if (angular.isUndefined(angular.merge)){
    angular.merge = function deepmerge(target, src) {
      var array = Array.isArray(src);
      var dst = array && [] || {};

      if (array) {
        target = target || [];
        dst = dst.concat(target);
        src.forEach(function(e, i) {
          if (typeof dst[i] === 'undefined') {
            dst[i] = e;
          } else if (typeof e === 'object') {
            dst[i] = deepmerge(target[i], e);
          } else {
            if (target.indexOf(e) === -1) {
              dst.push(e);
            }
          }
        });
      } else {
        if (target && typeof target === 'object') {
          Object.keys(target).forEach(function (key) {
            dst[key] = target[key];
          });
        }
        Object.keys(src).forEach(function (key) {
          if (typeof src[key] !== 'object' || !src[key]) {
            dst[key] = src[key];
          }
          else {
            if (!target[key]) {
              dst[key] = src[key];
            } else {
              dst[key] = deepmerge(target[key], src[key]);
            }
          }
        });
      }

      return dst;
    };
  }

  /**
   * @ngdoc module
   * @name ui.grid.columnsFilters
   * @description
   * #ui.grid.columnsFilters
   *
   * <div class="alert alert-warning" role="alert"><strong>Beta</strong> This feature is ready for testing, but it either hasn't seen a lot of use or has some known bugs.</div>
   *
   * This module provides column filter in popup from the filter header cells.
   */
  var module = angular.module('ui.grid.columnsFilters', ['ui.grid']);

  /**
   *  @ngdoc object
   *  @name ui.grid.columnsFilters.constant:uiGridColumnsFiltersConstants
   *
   *  @description constants available in columnsFilters module.
   *
   *  @property {string} featureName               - The name of the feature.
   *  @property {object} filterType                - {
      STRING: 'string',
      NUMBER: 'number',
      DATE: 'date',
      SELECT: 'select'
    }
   * @property {object} dateType                - {
      DATE: 'date',
      TIME: 'time',
      DATETIME: 'datetime-local',
      DATETIMELOCALE: 'datetime-locale'
    }
   *  @property {object} numberOperators                - {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Less than',
      256: 'Less than or equal',
      32: 'More than',
      64: 'More than or equal'
    }
   * @property {object} dateOperators                - {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Before',
      256: 'Before or equal',
      32: 'Later',
      64: 'Later or equal'
    }
   * @property {object} stringOperators                - {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    }
   * @property {object} selectOperators                - {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    }
   * @property {object} logics                - {
      "OR": 'Or',
      "AND": 'And'
    }
   *
   */

  module.constant('uiGridColumnsFiltersConstants', {
    featureName: "columnsFilters",
    filterType: {
      STRING: 'string',
      NUMBER: 'number',
      DATE: 'date',
      SELECT: 'select'
    },
    dateTypes: {
      DATE: 'date',
      TIME: 'time',
      DATETIME: 'datetime-locale',
      DATETIMELOCALE: 'datetime-locale'
    },
    numberOperators: {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Less than',
      256: 'Less than or equal',
      32: 'More than',
      64: 'More than or equal'
    },
    dateOperators: {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Before',
      256: 'Before or equal',
      32: 'Later',
      64: 'Later or equal'
    },
    stringOperators: {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    },
    selectOperators: {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    },
    logics: {
      "OR": 'Or',
      "AND": 'And'
    }
  });

  /**
   *  @ngdoc service
   *  @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService
   *
   *  @description Services for columnsFilters feature
   */
  /**
   *  @ngdoc object
   *  @name ui.grid.columnsFilters.api:ColumnDef
   *
   *  @description ColumnDef for column filter feature, these are available to be
   *  set using the ui-grid columnDef
   *
   * @property {object} columnFilter - Specific column columnsFilters definitions
   * @property {string} columnFilter.type  - can be: 'date', 'select', 'string', 'number'
   * @property {string} columnFilter.type  - can be: 'date', 'select', 'string', 'number'
   * @property {boolean} columnFilter.multiple   - Boolean stating is a select filter would show as multiple or singular choice
   * @property {object} columnFilter.selectOptions   - states the values of a select option (if needed)
   * @property {object} columnFilter.terms   - holds the search terms for every filter form
   * @property {object} columnFilter.logics  - holds the logics (and/or) for every filter form
   * @property {object} columnFilter.operators   - holds the operators (bigger than, smaller than etc.) for every filter form
   */

  module.service('uiGridColumnsFiltersService', ['$q', 'uiGridColumnsFiltersConstants', 'rowSearcher', 'GridRow', 'gridClassFactory', 'i18nService', 'uiGridConstants', 'rowSorter', '$templateCache',
    function ($q, uiGridColumnsFiltersConstants, rowSearcher, GridRow, gridClassFactory, i18nService, uiGridConstants, rowSorter, $templateCache) {

      var runColumnFilter = rowSearcher.runColumnFilter;

      function columnFilter(searchTerm, cellValue, row, column) {
        var conditions = column.colDef.columnFilter.operators;
        var logics = column.colDef.columnFilter.logics;
        var filterPass = true;

        for (var i = 0; i < searchTerm.length; i++) {
          var term = searchTerm[i];
          var newFilter = rowSearcher.setupFilters([{
            term: term,
            condition: (!angular.isFunction(conditions[0]) && Number(conditions[i]) ? Number(conditions[i]) : conditions[0]),
            flags: {
              caseSensitive: false
            }
          }])[0];
          // if we are on the second run check for "OR"
          if (i) {
            // logics might be undefined for some reason, so default would be 'AND'
            var logic = angular.isDefined(logics) ? (logics[i - 1] ? logics[i - 1] : logics[0]) : undefined;
            if (logic === uiGridColumnsFiltersConstants.logics['OR']) {

              // if we passed once, then OR should pass all the time
              if (filterPass){
                return filterPass;
              }
              // if needed, check the next term
              filterPass = runColumnFilter(row.grid, row, column, newFilter);
            }
            else {
              // if one term has failed, they all fail... (AND logic)
              if (!filterPass){
                return filterPass;
              }
              // if all passed so far, check the next term
              filterPass = runColumnFilter(row.grid, row, column, newFilter);
            }
          }
          // TODO::check for the "select" condition in order to make sure we check for mulitple select
          filterPass = rowSearcher.runColumnFilter(row.grid, row, column, newFilter);
        }

        return filterPass;
      }

      var service = {
        initializeGrid: function (grid, $scope) {
          //add feature namespace and any properties to grid for needed
          /**
           *  @ngdoc object
           *  @name ui.grid.columnsFilters.api:Grid
           *
           *  @description Grid properties and functions added for columnsFilters
           *
           *  @property {object} columnsFilters - object that holds global definitions
           */
          grid.columnsFilters = {
            currentColumn: undefined
          };

          angular.forEach(grid.options.columnDefs, function (colDef) {
            if (colDef.enableFiltering !== false) {
              var columnFilter = {
                terms: [],
                operators: [],
                logics: []
              };

              if (angular.isUndefined(colDef.columnFilter)) {
                colDef.columnFilter = columnFilter;
              }
              else {
                colDef.columnFilter = angular.merge({}, columnFilter, colDef.columnFilter);
              }
              colDef.filterHeaderTemplate = $templateCache.get('ui.grid.columns.filtersfilterButton.html');
            }
            else {
              colDef.filterHeaderTemplate = '<span ng-if="::false"></span>';
            }
          });
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#filterPopupStyle
         * @description Calculates the column filter's popup absolute position
         * @param {event} $event the event from the click event
         * @returns {object} an object with top and left styling expressions
         */
        filterPopupStyle: function ($event, grid) {
          var rect = $event.target.parentElement.getClientRects()[0];
          setTimeout(function(){
            console.log(grid.element);
          }, 250);
          return {
            top: document.body.scrollTop + (rect.height + rect.top) + 'px',
            left: rect.left + 'px'
          };
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#filter
         * @description Sets the filter parameters of the column
         * @param {column} col - the column that is now being filtered
         */
        filter: function (col) {
          var terms = col.colDef.columnFilter.terms;

          var logics = col.colDef.columnFilter.logics;

          // add the data into the filter object of the column
          // the terms array is the "term"
          col.filters[0].term = terms;

          // set condition as our filter function
          col.filters[0].condition = columnFilter;

          // logic is new, so we will add it, and handle it in our override function
          col.filters[0].logic = logics;
          col.grid.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#clear
         * @description Clears the filter parameters of the column
         * @param {column} col -  the column that is now being filtered
         */
        clear: function (col) {
          if (angular.isUndefined(col.filters[0].term)) {
            return;
          }

          if (!angular.isArray(col.filters[0].term)){
            col.filters[0].term = [];
          }
          else {
            col.filters[0].term.length = 0;
          }

          col.filters[0].condition = undefined;
          col.grid.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        }
      };

      return service;
    }]);

  module.directive('uiGridColumnsFilters', ['$compile', 'gridUtil', 'uiGridColumnsFiltersService', 'uiGridColumnsFiltersConstants', '$templateCache', '$document',
    function ($compile, gridUtil, uiGridColumnsFiltersService, uiGridColumnsFiltersConstants, $templateCache, $document) {
      return {
        require: 'uiGrid',
        scope: false,
        link: function ($scope, $elm, $attrs, uiGridCtrl) {
          uiGridColumnsFiltersService.initializeGrid(uiGridCtrl.grid, $scope);
        }
      };

      /**
       *  @ngdoc directive
       *  @name ui.grid.columnsFilters.directive:uiGridColumnFilters
       *
       *  @description directive for columnsFilters button in column header
       */

    }]);


  /**
   *  @ngdoc directive
   *  @name ui.grid.columnsFilters.directive.api:uiGridFilter
   *
   *  @description Extanding the uiGridFilter directive to prepare the column filter
   */
  module.directive('uiGridFilter', ['uiGridColumnsFiltersService', 'uiGridColumnsFiltersConstants', '$templateCache', '$compile', 'uiGridConstants',
    function (uiGridColumnsFiltersService, uiGridColumnsFiltersConstants, $templateCache, $compile, uiGridConstants) {
      return {
        priority: 500,
        scope: false,
        link: function ($scope) {

          /**
           * @description watch for the data change (rows length) and then recreate the select options
           */
          function dataChangeCallback(){
            // now wait for the rows to be updated with the new data
            var watchForRows = $scope.$watch('col.grid.rows.length', function (newRowsLength) {
              // make sure we have updated...
              if (newRowsLength !== $scope.col.grid.options.data.length) {
                return;
              }
              // set the options
              $scope.selectOptions = $scope.setSelectOptions($scope.selectOptions, currentColumn);
              // remove the listener
              watchForRows();
            });
          }

          //TODO::need to decide if we work with the filter API when it is sufficient and only expand it...
          var currentColumn = $scope.col; // cache current column

          // if we're not supposed to filter this column, no need to activate filter for it...
          if (angular.isDefined(currentColumn.colDef.enableFiltering) && !currentColumn.colDef.enableFiltering) {
            return;
          }

          // get the filter type (default is string)
          var filterType = 'string';
          if (angular.isDefined(currentColumn.colDef.columnFilter) && angular.isDefined(currentColumn.colDef.columnFilter.type)) {
            filterType = currentColumn.colDef.columnFilter.type;
          }
          else if (angular.isDefined(currentColumn.colDef.filter) && angular.isDefined(currentColumn.colDef.filter.type)) {
            filterType = currentColumn.colDef.filter.type;
          }

          // get the filter popup template
          var thisFilterTemplate = 'ui.grid.columns.filtersfilters/%%^^ColumnFilter'.replace('%%^^', filterType); // get the filter type template name
          var formElementsTemplate = $templateCache.get(thisFilterTemplate);
          var popupTemplate = $templateCache.get('ui.grid.columns.filtersfilterPopup.html').replace('<!-- content -->', formElementsTemplate); // get the full popup template

          // get the selection options if needed
          if (filterType === 'select') {
            currentColumn.colDef.columnFilter.logics = ["OR"];
            if (angular.isDefined(currentColumn.colDef.columnFilter) && angular.isDefined(currentColumn.colDef.columnFilter.selectOptions)) {
              $scope.selectOptions = currentColumn.colDef.columnFilter.selectOptions;
            }
            else if (angular.isDefined(currentColumn.colDef.filter) && angular.isDefined(currentColumn.colDef.filter.selectOptions)) {
              $scope.selectOptions = currentColumn.colDef.filter.selectOptions;
            }

            // remove multiple selection if needed - can be defined only in th e columnFilter right now
            if (angular.isDefined(currentColumn.colDef.columnFilter) && !currentColumn.colDef.columnFilter.multiple) {
              popupTemplate = popupTemplate.replace('multiple', '');
              popupTemplate = popupTemplate.replace('.terms', '.terms[0]');
            }

            if (angular.isUndefined($scope.selectOptions)) {
              // if we have select options, it means we have definitions set and we use the static def
              $scope.setSelectOptions = function (items, col) {
                // if we have static definitions, do nothing
                if (angular.isDefined(col.colDef.filter) && angular.isDefined(col.colDef.filter.selectOptions) ||
                  angular.isDefined(col.colDef.columnFilter) && angular.isDefined(col.colDef.columnFilter.selectOptions)) {
                  return items;
                }

                // if we don't create a dynamic selectOptions array
                var filteredItems = [];
                var tmpIDs = [];
                var tmpItem = {};
                var rows = col.grid.rows;

                // for every row in the grid
                for (var i = 0; i < rows.length; i++) {
                  // get the label and the value
                  tmpItem.label = col.grid.getCellDisplayValue(rows[i], col);
                  tmpItem.value = col.grid.getCellValue(rows[i], col);

                  // make sure we take only unique values
                  if (tmpIDs.indexOf(tmpItem.value) === -1) {
                    tmpIDs.push(tmpItem.value);
                    filteredItems.push(angular.copy(tmpItem));
                  }

                }

                // insert the items into the selectOptions array
                items = filteredItems;
                return items;
              };

              $scope.selectOptions = $scope.setSelectOptions($scope.selectOptions, currentColumn);

              currentColumn.grid.registerDataChangeCallback(dataChangeCallback, [uiGridConstants.dataChange.ALL]);

            }
          }

          $scope.filter = uiGridColumnsFiltersService.filter; // set the filtering function in the scope
          $scope.clear = uiGridColumnsFiltersService.clear; // set the clear filter function in the scope
          $scope.operators = uiGridColumnsFiltersConstants[filterType + 'Operators']; // set the operators in the scope
          $scope.logics = uiGridColumnsFiltersConstants.logics; // set the logics in the scope

          // toggle filter popup
          $scope.toggleFilter = function () {
            event.stopPropagation();
            event.preventDefault();

            if (currentColumn.grid.columnsFilters.currentColumn) {
              // if we have an open filter
              angular.element(document.getElementById('uiGridFilterPopup')).remove(); //remove it
              if (angular.equals(currentColumn.grid.columnsFilters.currentColumn, currentColumn)) {
                // if the same column that its filter shown is clicked, close it
                currentColumn.grid.columnsFilters.currentColumn = undefined; //clear the current open column popup
                return;
              }
            }

            // open a popup
            currentColumn.grid.columnsFilters.currentColumn = currentColumn; // set the current opened columnFilter
            $scope.filterPopupStyle = uiGridColumnsFiltersService.filterPopupStyle(event, currentColumn.grid); //set the style in the scope
            var popupElement = $compile(popupTemplate)($scope); // compile it
            angular.element(document.body).append(popupElement); // append to body

            angular.element(document.body).on('click', $scope.toggleFilter); // make sure the popup closes when clicking outside

            // make sure popup is not closing when clicking inside
            popupElement.on('click', function () {
              event.preventDefault();
              event.stopPropagation();
            });

            // remove the click events on destroy
            popupElement.on('$destroy', function () {
              popupElement.off('click');
              angular.element(document.body).off('click', $scope.toggleFilter);
            });
          };
        }
      };
    }]);

  module.filter('filterSelectValues', function () {
    return function (items, col) {


    };
  });


})();
