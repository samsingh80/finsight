sap.ui.define([
    "sap/ui/core/UIComponent",
    "finsight/model/models",
    "finsight/reuselib/module/chatModel",
    "finsight/model/launchModel"
], (UIComponent, models,chatModel, launchModel) => {
    "use strict";

    return UIComponent.extend("finsight.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            // //Set Chat model
            this.setModel(new chatModel(), "chatModel");

            // //Set Launch model
             this.setModel(new launchModel(), "launchModel");

            // //RootPath
            let oRootPath = jQuery.sap.getModulePath("finsight"); // your resource root
            let oImageModel = new sap.ui.model.json.JSONModel({
                path: oRootPath,
            });

             this.setModel(oImageModel, "imageModel");
        }
    });
});