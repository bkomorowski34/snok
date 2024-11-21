sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel"
], function (UIComponent, JSONModel, ResourceModel) {
    "use strict";

    return UIComponent.extend("myapp.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // Wczytaj dane z pliku data.json
            const oDataModel = new JSONModel("model/data.json");
            oDataModel.attachRequestCompleted(function () {
                const aData = oDataModel.getProperty("/butterflies");
                if (Array.isArray(aData)) {
                    aData.forEach(row => (row.editable = false));
                    oDataModel.refresh();
                } else {
                    console.error("Niepoprawne dane w modelu.");
                }
            });
            this.setModel(oDataModel, "data");

            // Inicjalizacja modelu tłumaczeń
            const i18nModel = new ResourceModel({
                bundleName: "myapp.i18n.i18n"
            });
            this.setModel(i18nModel, "i18n");
        }
    });
});
