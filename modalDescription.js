define(['js/qlik', './properties', 'text!./css/styles.css', 'text!./css/bootstrap.min.css', './js/bootstrap'], function (qlik, properties, cssCon, bCss) {
	$("<style>").html(bCss).appendTo("head");
	$("<style>").html(cssCon).appendTo("head");
    // '<div class="qv-object-tooltip boostrap-inside"><div class="modal fade qv-confirm-dialog ng-scope lui-dialog" tabindex="-1" id="descModal" role="dialog" aria-labelledby="descModalLabel">' + 
    //     '<div class="modal-dialog lui-dialog__body ng-scope"><div class="modal-content animated fadeInDown"><div class="modal-header"></div>' + 
    //     '<div class="modal-body"><div id="modalChart"></div></div><div class="modal-footer"></div></div></div></div></div>'
	//  var htmlStructure = '' + 
	// 		'<div class="qv-object-tooltip boostrap-inside"><div class="modal fade in" tabindex="-1" id="descModal" role="dialog" aria-labelledby="descModalLabel">' + 
	// 	'<div class="modal-dialog"><div class="modal-content animated fadeInDown"><div class="modal-header"></div>' + 
	// 	'<div class="modal-body" id="modalToAppend"><div id="modalChart"></div></div><div class="modal-footer"></div></div></div></div></div>';
	// $("body").append(htmlStructure); 
    var ID;
    return {
        initialProperties: {conditionalVis: [], defaultMasterObject: ''},
        support: {snapshot: true},
        definition: properties,
        template: '<button id="showModal" type="button" class="btn btn-default btn-sm lui-button myButton" data-toggle="modal" data-target="#descModal">Leírás</button>' + 
            '<div class="qv-object-tooltip boostrap-inside" id="modalToMove" class="modalToMove"><div class="modal fade in descModal" tabindex="-1" id="descModal" role="dialog" aria-labelledby="descModalLabel">' + 
        '<div class="modal-dialog"><div class="modal-content animated fadeInDown"><div class="modal-header"></div>' + 
        '<div class="modal-body" id="modalToAppend"><div id="modalChart" class="modalChart"></div></div><div class="modal-footer"></div></div></div></div></div>',
        controller: function ($scope, $element) {
            console.log("CONTROLLER");
            ID = btoa(Math.random()).substring(0,12);   
            console.log("1:" + ID);
            $("#modalChart").attr("id", "modalChart_" + ID);
            $("#modalToMove").attr("id", "modalToMove_" + ID);
            $("#descModal").attr("id", "descModal_" + ID);
            $("#showModal").attr("id", "showModal_" + ID);
            $("#showModal_" + ID).attr("data-target", "#descModal_" + ID);

            // Make sure the selections bar can overlay the extension's boundaries
            $(".qv-object .qv-inner-object").css('overflow','visible');

            // On initial load, get the active visualization ID we should display and initialize the current chart object
            $scope.app = qlik.currApp();
            $scope.currentChart = getActiveVisID($scope.component.model.layout.conditionalVis);
            $scope.currentChartModel = null;

            // If we do have a chart ID, render the object.
            if($scope.currentChart) {
                renderChart();
            };

            // When data has been updated on the server
            $scope.component.model.Validated.bind(function() {
                // Make sure the selections bar can overlay the extension's boundaries
                $(".qv-object .qv-inner-object").css('overflow','visible');

                // Get the active visualization ID after the data is updated
                var chart = getActiveVisID($scope.component.model.layout.conditionalVis);

                // If we do have a chart ID and it's a different one than the currentChart, update the currentChart and then render the new object
                if(chart && chart !== $scope.currentChart) {
                    $scope.currentChart = chart;
                    renderChart();
                }
                /* Else if we do not have a chart ID, check if this is the first time we don't have a chart ID. If it is, destroy the current chart object first. If it's not the first time, we can safely assume there aren't any leftover unused objects.*/
                else if(!chart && chart !== $scope.currentChart){
                    if ($scope.currentChartModel){
                        $scope.currentChart = null;
                        destroyObject();
                    }
                }
                else if(!chart && chart === $scope.currentChart){
                    $scope.currentChartModel = null;
                }
            });


            /* If only one condition results in 1, return its visualization ID. Else if default exists, return the default 
            visualization ID, otherwise return null*/
            function getActiveVisID(conditionalVisList) {
                var conditionResults = conditionalVisList.map(function(visObject) {
                    return +visObject.condition
                });

                var sumOfResults = conditionResults.reduce(function(a, b) {return a + b;}, 0);
                var activeChart = null;
                if(sumOfResults==1){
                    if(conditionalVisList[conditionResults.indexOf(1)].conditionalMasterObject){
                        activeChart = conditionalVisList[conditionResults.indexOf(1)].conditionalMasterObject.split('|')[1]
                    }
                    else{activeChart = null}
                }
                else if($scope.component.model.layout.defaultMasterObject){activeChart = $scope.component.model.layout.defaultMasterObject.split('|')[1]}
                else{activeChart = null}

                console.log('Condition Results:',conditionResults);
                console.log('Active Chart is: ', activeChart);

                return activeChart;
            };

            /* If there is no current chart object (on initialization or a null chart ID), do the getObject and assign it to our template div.
               Else if there is a current chart object, destroy it first, then do the getObject and assign it to our template div. */
            function renderChart() {
                console.log("2:" + ID);
                if($scope.currentChartModel==null) {
                    $scope.app.getObject($element.find('#modalChart_' + ID), $scope.currentChart).then(function(model) {
                        $scope.currentChartModel = model;
                    });
                }
                else {
                    $scope.currentChartModel.enigmaModel.endSelections(true)
                        .then(destroyObject)
                        .then(
                        function() {
                            $scope.app.getObject($element.find('#modalChart_' + ID), $scope.currentChart)
                                .then(function(model) {
                                $scope.currentChartModel = model;
                            });
                        });
                }
            };

            //Destroy any leftover models to avoid memory leaks of unused objects
            function destroyObject() {
                return $scope.app.destroySessionObject($scope.currentChartModel.layout.qInfo.qId)
                    .then(function() {$scope.currentChartModel = null;});
            };
        },
        paint: function ($element, $layout) {
            console.log("PAINT");
            console.log($element);
            console.log($layout);
            console.log("3:" + ID);
            $("body > .modalToMove").remove();
            $("#modalToMove_" + ID + " .modal-footer").html($layout.footerText);
            $("#modalToMove_" + ID + " .modal-header").html("<span class='header-title'>" + $layout.headerText + "</span>" + "<div style='float: right'><a href='#' data-dismiss='modal'>X</a></div>");
            $("#modalToMove_" + ID + "").appendTo("body");
		},
        resize: function () {
            return false; // We do not need to handle resizes in this extension as the charts will resize themselves.
        }
    }
});