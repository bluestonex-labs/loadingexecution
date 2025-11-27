sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.loadexecutionui.controller.View1", {

        onInit() {
            this.loadingParams = {
                "Plant": "",
                "DeliveryDate": ""
            };
            var configModel = new JSONModel()
            this.getOwnerComponent().setModel(configModel, "configModel");
        },

        onLoadVehicle: function () {
            var selectedDate = this.getView().byId("picker0").getDateValue();
            if (selectedDate === "" || selectedDate === undefined || selectedDate === null) {
                MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("selectDate"));
            } else {
                var year = selectedDate.getFullYear();
                var month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                var day = selectedDate.getDate().toString().padStart(2, '0');
                var delDate = `${year}-${month}-${day}`;
                this.loadingParams.DeliveryDate = delDate;
                this.getOwnerComponent().getModel("configModel").setData(this.loadingParams);
                this.getOwnerComponent().getRouter().navTo("loadTypes");
            }
        }

    });
});