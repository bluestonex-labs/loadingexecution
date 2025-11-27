sap.ui.define([], function () {
    "use strict";

    return {

        iconFormatter: function (temperature) {
            switch (temperature) {
                case "Frozen":
                    return "sap-icon://heating-cooling";
                case "Fresh":
                    return "sap-icon://e-care";
                default:
                    return "sap-icon://along-stacked-chart";
            }
        },

        stateFormat: function (temperature) {
            switch (temperature) {
                case "Frozen":
                    return "Success";
                case "Fresh":
                    return "Information";
                default:
                    return "None";
            }
        }

    };

});