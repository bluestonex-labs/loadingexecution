sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, BusyIndicator, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.loadexecutionui.controller.loadTypes", {

        onInit() {

            var loadTypesModel = new JSONModel();
            this.getView().setModel(loadTypesModel, "loadTypesModel");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("loadTypes").attachMatched(this._onRouteMatched, this);

        },

        _onRouteMatched: function () {

            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            this.fnLoadDefaultPlant();

        },

        fnLoadDefaultPlant: function () {

            this.configArray = [];
            BusyIndicator.show(500);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;
            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/CloudWM/getPlantListForUser()",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    const assignedPlants = oData.value;
                    assignedPlants.forEach(function (assignedPlant, index) {
                        if (assignedPlant.DefaultPlant)
                            that.plant = assignedPlant.Plant;
                    });

                    that.getOwnerComponent().getModel("configModel").getData().Plant = that.plant;
                    that.onAllLoads();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);

        },

        onAllLoads: function () {

            BusyIndicator.show(500);
            var routeField = "All";
            var plant = this.getOwnerComponent().getModel("configModel").getData().Plant;
            var delDate = this.getOwnerComponent().getModel("configModel").getData().DeliveryDate;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;

            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getConsolidatedRoutes(checkRouteField='" + routeField + "',startDate='" + delDate + "',endDate='" + delDate + "',Plant='" + plant + "')",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    if (oData.value.length > 0) {
                        that.getView().byId("scRoutes").setVisible(true);
                        that.getView().byId("imNoData").setVisible(false);
                    } else {
                        that.getView().byId("scRoutes").setVisible(false);
                        that.getView().byId("imNoData").setVisible(true);
                    }
                    that.getView().getModel("loadTypesModel").setData(oData);
                    that.getView().byId("allLoadLst").setModel(that.getView().getModel("loadTypesModel"));
                    that.getView().byId("allLoads").setEnabled(false);
                    that.getView().byId("shuttle").setEnabled(true);
                    that.getView().byId("radial").setEnabled(true);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);

        },

        onShuttle: function () {

            BusyIndicator.show(500);
            var routeField = "Shuttle";
            var plant = this.getOwnerComponent().getModel("configModel").getData().Plant;
            var delDate = this.getOwnerComponent().getModel("configModel").getData().DeliveryDate;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;

            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getConsolidatedRoutes(checkRouteField='" + routeField + "',startDate='" + delDate + "',endDate='" + delDate + "',Plant='" + plant + "')",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    if (oData.value.length > 0) {
                        that.getView().byId("scRoutes").setVisible(true);
                        that.getView().byId("imNoData").setVisible(false);
                    } else {
                        that.getView().byId("scRoutes").setVisible(false);
                        that.getView().byId("imNoData").setVisible(true);
                    }
                    that.getView().getModel("loadTypesModel").setData(oData);
                    that.getView().byId("allLoadLst").setModel(that.getView().getModel("loadTypesModel"));
                    that.getView().byId("allLoads").setEnabled(true);
                    that.getView().byId("shuttle").setEnabled(false);
                    that.getView().byId("radial").setEnabled(true);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    that.getView().byId("scRoutes").setVisible(false);
                    that.getView().byId("imNoData").setVisible(true);
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);

        },

        onRadial: function () {

            BusyIndicator.show(500);
            var routeField = "Radial";
            var plant = this.getOwnerComponent().getModel("configModel").getData().Plant;
            var delDate = this.getOwnerComponent().getModel("configModel").getData().DeliveryDate;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;

            var that = this;
            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getConsolidatedRoutes(checkRouteField='" + routeField + "',startDate='" + delDate + "',endDate='" + delDate + "',Plant='" + plant + "')",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    if (oData.value.length > 0) {
                        that.getView().byId("scRoutes").setVisible(true);
                        that.getView().byId("imNoData").setVisible(false);
                    } else {
                        that.getView().byId("scRoutes").setVisible(false);
                        that.getView().byId("imNoData").setVisible(true);
                    }
                    that.getView().getModel("loadTypesModel").setData(oData);
                    that.getView().byId("allLoadLst").setModel(that.getView().getModel("loadTypesModel"));
                    that.getView().byId("allLoads").setEnabled(true);
                    that.getView().byId("shuttle").setEnabled(true);
                    that.getView().byId("radial").setEnabled(false);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);

        },

        onListItemPress: function (oEvent) {

            var oRouter = this.getOwnerComponent().getRouter();

            // Get the selected item's context
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var oData = oContext.getObject();
            if (oData.newStatus === "OPEN") {
                var selectedrouteID = oData.Route
                var loadType = "";
                if (oData.Shuttle === 1) {
                    loadType = "Shuttle";
                } else if (oData.Shuttle === 0) {
                    loadType = "Radial";
                }

                var payload = {
                    "Event_Timestamp": null,
                    "Event_Type": "ROUTE_OPENED",
                    "ID": "",
                    "Level": "H",
                    "PickTask_ID": "",
                    "User_ID": null,
                    "Value": oData.Route
                }
                this.reportingService(payload);

                oRouter.navTo("shuttle", {
                    routeID: selectedrouteID,
                    load: loadType
                });
            } else if (oData.newStatus === "CLOSED") {
                MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("routeClosed"));
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