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
            var deldate = this.getOwnerComponent().getModel("configModel").getData().DeliveryDate;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;
            var that = this;

            $.ajax({
                url: this.appModulePath + "/cloudWMService/Loading/getPalletsOfRoute(checkRouteField='" + loadType + "',DeliveryDate='" + deldate + "',Plant='" + plant + "',Route='" + routeID + "',Execution=true)",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    var getPallets = that.getView().byId("palletsLst");
                    var frozenCount = 0;
                    var freshCount = 0;
                    if (oData.value.length > 0) {
                        that.getView().byId("inPalletID").setEnabled(true);
                        //that.getView().byId("palletsLst").setVisible(true);
                        for (var i = 0; i < oData.value.length; i++) {
                            if (oData.value[i].Temperature === "Frozen") {
                                frozenCount = frozenCount + 1;
                                oData.value[i].FrozenIcon = "sap-icon://heating-cooling";
                                oData.value[i].FrozenState = "Information";
                                oData.value[i].Visible = true;
                                oData.value[i].State = "None";
                            } else if (oData.value[i].Temperature === "Fresh") {
                                freshCount = freshCount + 1;
                                oData.value[i].FrozenIcon = "sap-icon://e-care";
                                oData.value[i].FrozenState = "Success";
                                oData.value[i].Visible = true;
                                oData.value[i].State = "None";
                            }
                        }
                        var allPalletsDumData = oData;
                        var allPalletsMod = new JSONModel(allPalletsDumData);
                        getPallets.setModel(allPalletsMod);
                    } else {
                        that.getView().byId("inPalletID").setEnabled(false);
                        var allPalletsDumData = oData;
                        var allPalletsMod = new JSONModel(allPalletsDumData);
                        getPallets.setModel(allPalletsMod);
                        //that.getView().byId("palletsLst").setVisible(false);
                    }
                    that.getView().byId("total").setText(oData.value.length);
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
                /*if (i > 1) {
                    break;
                } else {
                    if (items[i].State === "Success") {
                        
                    }
                }*/
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
                    that.getPalletsList();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("serviceCallErrorMessage"));
                }
            }, this);
        }
    });
});