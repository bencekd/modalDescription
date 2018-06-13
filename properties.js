define(['./getMasterItems'], function (getMasterItems) {

    var settingsDefinition = {
        uses: 'settings',
        items: {
            defaultVis: {
                label: 'Megjeleníített elem',
                type: 'items',
                items: {                
                    list: {
                        type: "string",
                        component: "dropdown",
                        label: "Master Objektum",
                        ref: "defaultMasterObject",
                        options: function () {
                            return getMasterItems().then(function (items) {
                                return items;
                            });
                        }
                    }
                }

            },
            headerText: {
                                        type: "string",
                                        ref: "headerText",   
                                        label: "Fejléc szövege"                          
                                    },                            
            footerText: {
                                        type: "string",
                                        ref: "footerText",
                                        label: "Lábléc szövege"                          
                                    },    
            }
    };

    return {
        type: "items",
        component: "accordion",
        items: {
            settings: settingsDefinition
        }
    }

});