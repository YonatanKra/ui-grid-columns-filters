describe('ui.grid.columnsFilters', function () {
  var gridScope, gridElm, viewportElm, $scope, $compile, recompile, uiGridConstants, $templateCache, uiGridColumnsFiltersService;

  var data = [
    {"name": "Ethel Price", "gender": "female", "company": "Enersol"},
    {"name": "Claudine Neal", "gender": "female", "company": "Sealoud"},
    {"name": "Beryl Rice", "gender": "female", "company": "Velity"},
    {"name": "Wilder Gonzales", "gender": "male", "company": "Geekko"}
  ];

  beforeEach(module('ui.grid'));
  beforeEach(module('ui.grid.columnsFilters'));

  beforeEach(inject(function (_$compile_, _$rootScope_, _$templateCache_, _uiGridConstants_, _uiGridColumnsFiltersService_) {
    $scope = _$rootScope_;
    $compile = _$compile_;
    $templateCache = _$templateCache_;
    uiGridConstants = _uiGridConstants_;
    uiGridColumnsFiltersService = _uiGridColumnsFiltersService_;

    $scope.gridOpts = {
      data: data,
      onRegisterApi: function (gridApi) {
        $scope.gridApi = gridApi;
      },
      columnDefs: [
        {
          field: 'name',
          columnFilter: {
            terms: [],
            operators: [],
            logics: []
          },
          enableFiltering: true
        },
        {
          field: 'gender',
          columnFilter: {
            terms: [],
            operators: [],
            logics: []
          },
          enableFiltering: true
        },
        {
          field: 'company',
          columnFilter: {
            terms: [],
            operators: [],
            logics: []
          },
          enableFiltering: true
        }
      ]
    };

    recompile = function () {
      gridElm = angular.element('<div style="width: 500px; height: 300px" ui-grid="gridOpts" ui-grid-columns-filters></div>');
      document.body.appendChild(gridElm[0]);
      $compile(gridElm)($scope);
      $scope.$digest();
      gridScope = gridElm.isolateScope();
      viewportElm = $(gridElm).find('.ui-grid-viewport');
    };

    recompile();
  }));

  afterEach(function () {
    angular.element(gridElm).remove();
    gridElm = null;
  });

  describe('on load initialization', function () {

    it('columnFilters property should be available in the grid', inject(function ($timeout) {
      expect(gridScope.grid.columnsFilters).toBeDefined();
    }));

    it('every column should have columnFilter definitions', function () {
      var ammountInitiated = 0;
      var colDef;

      for (var i = 0; i < gridScope.grid.options.columnDefs.length; i++) {
        colDef = gridScope.grid.options.columnDefs[i];
        if (colDef.enableFiltering) {
          if (colDef.columnFilter && colDef.columnFilter.terms && colDef.columnFilter.operators && colDef.columnFilter.logics) {
            ammountInitiated++;
          }
        }
      }
      expect(ammountInitiated).toEqual(i);
    });

    it('every column should have the filter button as a filterHeaderTemplate', function () {
      var ammountInitiated = 0;
      var colDef;
      for (var i = 0; i < gridScope.grid.options.columnDefs.length; i++) {
        colDef = gridScope.grid.options.columnDefs[i];
        if (colDef.enableFiltering) {
          if (colDef.filterHeaderTemplate === $templateCache.get('ui-grid/filterButton')) {
            ammountInitiated++;
          }
        }
      }
      expect(ammountInitiated).toEqual(i);
    });

  });

  describe('test service.filter', function () {
    beforeEach(inject(function () {
      gridScope.grid.options.columnDefs[0].columnFilter = {
        terms: ["Price"],
        operators: [16],
        logics: undefined
      };

    }));

    it('test filter should setup the filter parameter correctly', function () {
      uiGridColumnsFiltersService.filter(gridScope.grid.columns[0]);
      expect(gridScope.grid.columns[0].filters[0].term).toEqual(["Price"]);
      expect(typeof gridScope.grid.columns[0].filters[0].condition).toBe('function');
      expect(gridScope.grid.columns[0].filters[0].logics).toBeUndefined();
    });

    it('test filter should call notifyDataChange', function () {

      spyOn(gridScope.grid.api.core, 'notifyDataChange');

      uiGridColumnsFiltersService.filter(gridScope.grid.columns[0]);

      expect(gridScope.grid.api.core.notifyDataChange).toHaveBeenCalledWith(uiGridConstants.dataChange.COLUMN);

    });
  });

  describe('test service.clear', function () {
    beforeEach(inject(function () {
      gridScope.grid.options.columnDefs[0].columnFilter = {
        terms: ["Price"],
        operators: [16],
        logics: undefined
      };
      uiGridColumnsFiltersService.filter(gridScope.grid.columns[0]);
    }));

    it('should reset the filter parameters', function () {
      uiGridColumnsFiltersService.clear(gridScope.grid.columns[0]);
      expect(gridScope.grid.columns[0].filters[0].term).toEqual([]);
      expect(gridScope.grid.columns[0].filters[0].condition).toBeUndefined();
      expect(gridScope.grid.columns[0].filters[0].logics).toBeUndefined();
    });

    it('should call notifyDataChange', function () {

      spyOn(gridScope.grid.api.core, 'notifyDataChange');

      uiGridColumnsFiltersService.clear(gridScope.grid.columns[0]);

      expect(gridScope.grid.api.core.notifyDataChange).toHaveBeenCalledWith(uiGridConstants.dataChange.COLUMN);

    });
  });

});
