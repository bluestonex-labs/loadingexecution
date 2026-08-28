sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "../model/formatter"
], (Controller, JSONModel, MessageToast, BusyIndicator, MessageBox, Dialog, Button, mobileLibrary, formatter) => {
    "use strict";

    // shortcut for sap.m.ButtonType
    var ButtonType = mobileLibrary.ButtonType;

    // shortcut for sap.m.DialogType
    var DialogType = mobileLibrary.DialogType;

    return Controller.extend("com.sysco.wm.loadexecutionui.controller.pallets", {

        formatter: formatter,

        onInit() {
            var palletModel = new JSONModel();
            this.getView().setModel(palletModel, "palletModel");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("pallets").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            this.LoadType = oEvent.getParameter("arguments").checkRouteField;
            this.Plant = oEvent.getParameter("arguments").Plant;
            this.routeID = oEvent.getParameter("arguments").Route;
            this.vehicleId = oEvent.getParameter("arguments").vehicle;

            //this.getView().byId("scanAdd").setEnabled(true);
            this.getView().byId("confirmLoad").setEnabled(false);
            //this.getView().byId("scanAdd").setText(this.getView().getModel("i18n").getResourceBundle().getText("scanAPallet"));

            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);

            this.getPalletsList();
        },

        getPalletsList: function () {

            BusyIndicator.show(500);
            var loadType = this.LoadType;
            var routeID = this.routeID;
            var plant = this.Plant;
            var startDate = this.getOwnerComponent().getModel("configModel").getData().startDate;
            var endDate = this.getOwnerComponent().getModel("configModel").getData().endDate;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;
            var that = this;

            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getPalletsOfRoute(checkRouteField='" + loadType + "',startDate='" + startDate + "',endDate='" + endDate + "',Plant='" + plant + "',Route='" + routeID + "',Execution=true)",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

                    // Sort the data array in-place
                    oData.value.sort((a, b) => collator.compare(a.actualRoute, b.actualRoute));
                    var openPallet = {};
                    openPallet.value = oData.value.filter(function (item) { return item.Status_ID === 'READYFORLOADING'; });
                    var loadedPallets = {};
                    loadedPallets.value = oData.value.filter(function (item) { return item.Status_ID === 'LOADED'; });
                    var confirmedModel = new JSONModel(loadedPallets);
                    that.getView().setModel(confirmedModel, "confirmedModel");
                    var getPallets = that.getView().byId("palletsLst");
                    var frozenCount = 0;
                    var freshCount = 0;
                    var allPalletsMod = new JSONModel();
                    getPallets.setModel(allPalletsMod);
                    if (openPallet.value.length > 0) {
                        that.getView().byId("inPalletID").setEnabled(true);
                        for (var i = 0; i < openPallet.value.length; i++) {
                            if (openPallet.value[i].Status_ID === 'READYFORLOADING') {
                                if (openPallet.value[i].Temperature === "Frozen") {
                                    frozenCount = frozenCount + 1;
                                    openPallet.value[i].FrozenIcon = "sap-icon://heating-cooling";
                                    openPallet.value[i].FrozenState = "Information";
                                    openPallet.value[i].Visible = true;
                                    openPallet.value[i].State = "None";
                                } else if (openPallet.value[i].Temperature === "Fresh") {
                                    freshCount = freshCount + 1;
                                    openPallet.value[i].FrozenIcon = "sap-icon://e-care";
                                    openPallet.value[i].FrozenState = "Success";
                                    openPallet.value[i].Visible = true;
                                    openPallet.value[i].State = "None";
                                }
                            }
                        }
                        var allPalletsDumData = openPallet;
                        allPalletsMod.setData(allPalletsDumData);
                        getPallets.setModel(allPalletsMod);
                    } else {
                        that.getView().byId("inPalletID").setEnabled(false);
                    }
                    that.getView().byId("total").setText(openPallet.value.length);
                    that.getView().byId("frozen").setText(frozenCount);
                    that.getView().byId("fresh").setText(freshCount);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);

        },

        onRouteClose: function () {
            var remPallets = this.getView().byId("total").getText();
            this._getDialog().open();
            sap.ui.getCore().byId("mainDialog").setTitle(remPallets + " " + this.getView().getModel("i18n").getResourceBundle().getText("remPallet"));
        },

        _getDialog: function () {
            // create dialog lazily
            if (!this._oDialog) {
                // create dialog via fragment factory
                this._oDialog = sap.ui.xmlfragment("com.sysco.wm.loadexecutionui.fragments.closureDialog", this);
                // connect dialog to view (models, lifecycle)
                this.getView().addDependent(this._oDialog);
            }
            return this._oDialog;
        },

        onReturn: function () {
            this._getDialog().close();
        },

        onClose: function () {
            BusyIndicator.show(500);
            var items = this.getView().byId("palletsLst").getModel("confirmedModel").getData().value;
            var idList = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].Status_ID === "LOADED") {
                    idList.push(items[i].ID);
                }
            }
            var payload = {
                "Items": {
                    "ID": idList
                }
            };
            var that = this;
            var reportingPayload;

            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/confirmLoadClosed",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    MessageToast.show(idList.length + " " + that.getView().getModel("i18n").getResourceBundle().getText("palletClosed"));
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].State === "Success") {
                            reportingPayload = {
                                "Event_Timestamp": null,
                                "Event_Type": "VEHICLE_CLOSED",
                                "ID": "",
                                "Level": "I",
                                "PickTask_ID": items[i].TASK_ID,
                                "User_ID": null,
                                "Value": that.vehicleId
                            };
                            that.reportingService(reportingPayload);
                        }
                    } 
                    that.getOwnerComponent().getRouter().navTo("loadTypes");
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);
        },

        onClose1: function () {
            var payload = {
                "Event_Timestamp": null,
                "Event_Type": "VEHICLE_CLOSED",
                "ID": "",
                "Level": "H",
                "PickTask_ID": "",
                "User_ID": null,
                "Value": this.vehicleId
            }
            this.reportingService(payload);
            this.getOwnerComponent().getRouter().navTo("loadTypes");
        },

        onRouteExit: function () {
            this.getOwnerComponent().getRouter().navTo("loadTypes");
            /*this.getOwnerComponent().getRouter().navTo("shuttle", {
                routeID: this.routeID,
                load: this.LoadType
            });*/
        },

        onScanPallet: function (oEvent) {
            var list = this.getView().byId("palletsLst");
            var items = list.getModel().getData().value;
            var input = this.getView().byId("inPalletID").getValue();
            if (input === "" || input === undefined || input === null) {
                MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("palletIDBeforeScan"));
            } else {
                var targetValue = 'Success';
                var propertyToCount = 'State';

                var count = items.reduce((accumulator, currentObject) => {
                    if (currentObject[propertyToCount] === targetValue) {
                        return accumulator + 1;
                    }
                    return accumulator;
                }, 0);
                var matchFlag = false;
                if (count <= 2) {
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].PALLETID === input) {
                            if (items[i].State === "None") {
                                matchFlag = true;
                                items[i].State = "Success";
                                list.getModel().refresh();
                                //this.getView().byId("scanAdd").setText(this.getView().getModel("i18n").getResourceBundle().getText("scanAdd"));
                                this.getView().byId("confirmLoad").setEnabled(true);
                                this.getView().byId("inPalletID").setValue();
                                var payload = {
                                    "Event_Timestamp": null,
                                    "Event_Type": "PALLET_SCANNED",
                                    "ID": "",
                                    "Level": "H",
                                    "PickTask_ID": items[i].TASK_ID,
                                    "User_ID": null,
                                    "Value": null
                                }
                                this.reportingService(payload);
                            }
                        }
                    }
                }

                if (!matchFlag) {
                    MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("palletUnavailable"));
                    this.getView().byId("inPalletID").setValue();
                } else {
                    count = count + 1;
                }

                if (count >= 2) {
                    this.getView().byId("inPalletID").setEnabled(false);
                    //this.getView().byId("scanAdd").setEnabled(false);
                }
            }

        },

        onConfirmLoaded: function () {
            BusyIndicator.show(500);
            var items = this.getView().byId("palletsLst").getModel().getData().value;
            var idList = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].State === "Success") {
                    idList.push(items[i].ID);
                }
            }
            var payload = {
                "Items": {
                    "ID": idList,
                    "VehicleID": this.vehicleId,
                    "Status_ID": "LOADED"
                }
            };
            var that = this;
            var reportingPayload;

            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/confirmLoaded",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    MessageToast.show(idList.length + " " + that.getView().getModel("i18n").getResourceBundle().getText("palletLoaded"));
                    //that.reportingService(payload);
                    that.getPalletsList();
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].State === "Success") {
                            reportingPayload = {
                                "Event_Timestamp": null,
                                "Event_Type": "PALLET_LOADED",
                                "ID": "",
                                "Level": "I",
                                "PickTask_ID": items[i].TASK_ID,
                                "User_ID": null,
                                "Value": that.vehicleId
                            };
                            that.reportingService(reportingPayload);
                        }
                    } 
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);
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
                    //console.log("Successfully reported to service")
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    //BusyIndicator.hide();
                    console.error("Error reporting to service");
                }
            }, this);

        }
    });
});