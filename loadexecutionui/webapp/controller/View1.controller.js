sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.loadexecutionui.controller.View1", {

        onInit() {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
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
                var payload = {
                    "Event_Timestamp": null,
                    "Event_Type": "LOADING_STARTED",
                    "ID": "",
                    "Level": "H",
                    "PickTask_ID": "",
                    "User_ID": null,
                    "Value": null
                }
                this.reportingService(payload);
                this.getOwnerComponent().getRouter().navTo("loadTypes");
            }
        },

        reportingService: function (payload) {
            //BusyIndicator.show(500);
            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/CloudWM/LoadingEvents",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    //console.log("Successfully reported loading started");
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //BusyIndicator.hide();
                    console.error("Error reporting");
                }
            }, this);

        }

    });
});