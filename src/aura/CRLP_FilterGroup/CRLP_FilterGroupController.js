({
    /* @description: setup for the filter group component which sets the active filter group and datatable
    */
    doInit: function (cmp, event, helper) {
        //query for the active filter group
        var activeFilterGroupId = cmp.get("v.activeFilterGroupId");
        var objectList = cmp.get("v.detailObjects");
        var objectNames = objectList.map(function (obj, index, array) {
            return obj.name;
        });

        if (activeFilterGroupId === null) {
            activeFilterGroupId = '';
        }

        var action = cmp.get("c.setupFilterGroupDetail");
        action.setParams({id: activeFilterGroupId, objectNames: objectNames});

        action.setCallback(this, function (response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var model = helper.restructureResponse(response.getReturnValue());
                if(activeFilterGroupId){
                    //note: the parsing is important to avoid a shared reference
                    cmp.set("v.activeFilterGroup", helper.restructureResponse(model.filterGroup));
                    cmp.set("v.cachedFilterGroup", helper.restructureResponse(model.filterGroup));
                }

                cmp.set("v.operatorMap", model.operators);

                var labels = cmp.get("v.labels");

                var actions = [{label: labels.edit, name: 'edit'}
                    , {label: labels.delete, name: 'delete'}
                ];

                var filterRuleColumns = [{label: labels.object, fieldName: 'objectLabel', type: 'string'}
                    , {label: labels.field, fieldName: 'fieldLabel', type: 'string'}
                    , {label: labels.operator, fieldName: 'operatorLabel', type: 'string'}
                    , {label: labels.constant, fieldName: 'constantName', type: 'string'}
                ];

                var filterRuleActionColumns = [{label: labels.object, fieldName: 'objectLabel', type: 'string'}
                    , {label: labels.field, fieldName: 'fieldLabel', type: 'string'}
                    , {label: labels.operator, fieldName: 'operatorLabel', type: 'string'}
                    , {label: labels.constant, fieldName: 'constantName', type: 'string'}
                    , {type: 'action', typeAttributes: {rowActions: actions}}
                ];

                cmp.set("v.filterRuleList", helper.restructureResponse(model.filterRuleList));
                cmp.set("v.cachedFilterRuleList", helper.restructureResponse(model.filterRuleList));
                cmp.set("v.filterRuleColumns", filterRuleColumns);
                cmp.set("v.filterRuleActionColumns", filterRuleActionColumns);
                cmp.set("v.objectDetails", model.filterFieldsByDataType);
                helper.filterRollupList(cmp, model.filterGroup.MasterLabel, labels);
                helper.changeMode(cmp);

            }
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " +
                            errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });

        $A.enqueueAction(action);

    },

    /* @description: creates a new filter rule
    */
    addFilterRule: function(cmp, event, helper){
        cmp.set("v.filterRuleMode", 'create');
        helper.toggleFilterRuleModal(cmp);
    },

    /* @description: cancels the pop up for filter rule and clears the active filter rule
    */
    cancelFilterRule: function(cmp, event, helper){
        helper.toggleFilterRuleModal(cmp);
        helper.resetActiveFilterRule(cmp);
        cmp.set("v.filterRuleMode", '');
    },

    /* @description: handles individual row events for the filter rule table
    */
    handleRowAction: function(cmp, event, helper){
        var action = event.getParam('action');
        var row = event.getParam('row');
        cmp.set("v.activeFilterRule", row);

        if(action.name !== 'delete'){
            //handle modal popup
            cmp.set("v.filterRuleMode", 'edit');
            helper.toggleFilterRuleModal(cmp);
            helper.resetFilterRuleFields(cmp, row.objectName);
            helper.resetFilterRuleOperators(cmp, row.fieldName);
            helper.rerenderValue(cmp, row.operatorName);


        } else {
            //cautions user about deleting filter rule
            cmp.set("v.filterRuleMode", 'delete');
            helper.toggleFilterRuleModal(cmp);
        }
    },

    /* @description: handles the cancel action during the edit of a filter group
    */
    onCancel: function(cmp, event, helper){
        if((cmp.get("v.mode") === 'clone' || cmp.get("v.mode") === 'create') && cmp.get("v.activeFilterGroupId") === null){
            //set off cancel event for container
            var cancelEvent = $A.get("e.c:CRLP_CancelEvent");
            cancelEvent.setParams({grid: 'filterGroup'});
            cancelEvent.fire();
        } else {
            cmp.set("v.mode", "view");
            var cachedFilterGroup = cmp.get("v.cachedFilterGroup");
            //json shenanigans to avoid shared reference
            cmp.set("v.activeFilterGroup", helper.restructureResponse(cachedFilterGroup));
            cmp.set("v.filterRuleList", cmp.get("v.cachedFilterRuleList"));
        }

    },

    /* @description: fires when mode is changed and handles the readonly
    */
    onChangeMode: function(cmp, event, helper){
        helper.changeMode(cmp);
    },

    /* @description: filters the filter fields when filter rule objects is changed
    */
    onChangeFilterRuleObject: function(cmp, event, helper){
        var object = event.getSource().get("v.value");
        helper.resetFilterRuleFields(cmp, object);
    },

    /* @description: checks for type on filter rule field to update eligible values
    */
    onChangeFilterRuleField: function(cmp, event, helper){
        var field = event.getSource().get("v.value");
        helper.resetFilterRuleOperators(cmp, field);
        cmp.set("v.activeFilterRule.operatorName", "");
    },

    /* @description: renders constant value based on selected operator
    */
    onChangeFilterRuleOperator: function(cmp, event, helper){
        var operator = event.getSource().get("v.value");
        helper.rerenderValue(cmp, operator);
    },

    /* @description: adds constant field to selected list
    */
    onChangeFilterRuleConstantPicklist: function(cmp, event, helper){
        var constant = event.getSource().get("v.value");
        var fieldCmp = cmp.find("filterRuleUIField");
        var value = fieldCmp.get("v.value");
        var constantPicklist = cmp.get("v.filterRuleConstantPicklist");
        console.log(JSON.stringify(constantPicklist));
    },

    /* @description: saves a new filter group and associated filter rules
    */
    onSave: function(cmp, event, helper){
        //placeholder for on cancel function in !view mode
        //add check for description, name and a filter rule
        var activeFilterGroup = cmp.get("v.activeFilterGroup");
        var canSave = helper.validateFilterGroupFields(cmp, activeFilterGroup);
        if(canSave){
            cmp.set("v.mode", 'view');

            //sends the message to the parent cmp RollupsContainer
            var sendMessage = $A.get('e.ltng:sendMessage');
            sendMessage.setParams({
                'message': activeFilterGroup.MasterLabel,
                'channel': 'nameChange'
            });
            sendMessage.fire();
        }
    },

    /* @description: saves filter rule into the list of filter rules on the filter group
    */
    saveFilterRule: function(cmp, event, helper){
        //todo: add exception handling + duplicate checking
        //todo: save to DB first
        //set field labels first
        var filterRule = cmp.get("v.activeFilterRule");
        filterRule.objectLabel = helper.retrieveFieldLabel(filterRule.objectName, cmp.get("v.detailObjects"));
        filterRule.fieldLabel = helper.retrieveFieldLabel(filterRule.fieldName, cmp.get("v.filteredFields"));
        filterRule.operatorLabel = helper.retrieveFieldLabel(filterRule.operatorName, cmp.get("v.filteredOperators"));

        var filterRuleList = cmp.get("v.filterRuleList");
        var mode = cmp.get("v.filterRuleMode");
        var canSave = true;

        if (mode !== 'delete') {
            console.log(JSON.stringify(filterRule.constantName));
            canSave = helper.validateFilterRuleFields(cmp, filterRule, filterRuleList);
        }

        if(canSave) {
            //if mode is create, just add to list, otherwise update the item in the existing list
            if (mode === 'create') {
                filterRuleList.push(filterRule);
            } else {
                var i;
                for (i = 0; i < filterRuleList.length; i++) {
                    if (filterRuleList[i].id === filterRule.id) {
                        break;
                    }
                }
                if (mode === 'edit') {
                    filterRuleList[i] = filterRule;
                } else {
                    filterRuleList.splice(i, 1);
                }
            }
            cmp.set("v.filterRuleList", filterRuleList);

            helper.toggleFilterRuleModal(cmp);
            helper.resetActiveFilterRule(cmp);

        }
    },

    /* @description: navigates the user to the selected rollup from the filter group detail page
    */
    selectRollup: function(cmp, event, helper){
        //select rollup for navigation
        var rollupId = event.getParam('name');
        var filterGroupId = cmp.get("v.activeFilterGroupId");
        if(rollupId !== 'title'){
            var navEvent = $A.get("e.c:CRLP_NavigateEvent");
            navEvent.setParams({id: rollupId, target: 'rollup', lastId: filterGroupId});
            navEvent.fire();
        }
    }
})