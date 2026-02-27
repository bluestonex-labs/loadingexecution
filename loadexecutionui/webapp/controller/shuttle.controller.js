sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, BusyIndicator, Filter, FilterOperator, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.loadexecutionui.controller.shuttle", {

        onInit() {
            var shuttleModel = new JSONModel();
            this.getView().setModel(shuttleModel, "shuttleModel");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("shuttle").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);

            this.routeID = oEvent.getParameter("arguments").routeID;
            this.loadType = oEvent.getParameter("arguments").load;

            this.getView().byId("productInput").setValue();

            if (this.loadType === "Shuttle") {
                this.getView().byId("shuttleid").setText(this.getView().getModel("i18n").getResourceBundle().getText("shuttle"));
            } else if (this.loadType === "Radial") {
                this.getView().byId("shuttleid").setText(this.getView().getModel("i18n").getResourceBundle().getText("radial"));
            }

            this.getView().byId("routeid").setText(this.getView().getModel("i18n").getResourceBundle().getText("route") + this.routeID);
            this.getVehicle();
        },

        getVehicle: function () {
            BusyIndicator.show(500);
            var routeID = this.routeID;
            var plant = this.getOwnerComponent().getModel("configModel").getData().Plant;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;
            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getVehiclesForRoute(ConsolidatedRoute='" + routeID + "',Plant='" + plant + "')",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    var getVehicleId = that.getView().byId("productInput");
                    var allVehIdData = oData.value;
                    var allVedId = new JSONModel(allVehIdData);
                    getVehicleId.setModel(allVedId, "vehIdMod");
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);
        },

        onSuggest: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = [];
            if (sTerm) {
                aFilters.push(new Filter("VEHICLEID", FilterOperator.Contains, sTerm));
            }

            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },

        onSuggestionItemSelected: function (oEvent) {
            // Get selected item
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sVehicleId = oSelectedItem.getText();

            // Optionally store selected ID in a model for next screen
            var oSelectedModel = new sap.ui.model.json.JSONModel({ selectedVehicleId: sVehicleId });
            sap.ui.getCore().setModel(oSelectedModel, "SelectedVehicle");

            // Navigate to next view (using router)
            //var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            //oRouter.navTo("pallets", { vehicleId: sVehicleId });
        },

        onVehicleConfirm: function () {
            var sVehicleId = this.getView().byId("productInput").getValue();
            var plant = this.getOwnerComponent().getModel("configModel").getData().Plant;
            var routeID = this.routeID;
            //MessageBox.show("Please Implement Vehicle update againt RouteID");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var payload = {
                "Event_Timestamp": null,
                "Event_Type": "VEHICLEID_ENTERED",
                "ID": "",
                "Level": "H",
                "PickTask_ID": "",
                "User_ID": null,
                "Value": sVehicleId
            }
            this.reportingService(payload);
            oRouter.navTo("pallets", { checkRouteField: this.loadType, Plant: plant, Route: routeID, vehicle: sVehicleId });
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
                    console.log("Successfully reported loading started")
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //BusyIndicator.hide();
                    console.error("Error reporting load vehicle started");
                }
            }, this);

        }

    });
});