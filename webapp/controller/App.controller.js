sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "../reuselib/module/util",
  "../reuselib/module/chatPlugin",
  "../reuselib/module/service",
      "../module/formatter"
], (BaseController,Fragment,Util,ChatPlugin,Service,formatter) => {
  "use strict";

  return BaseController.extend("finsight.controller.App",{
    formatter: formatter,
      onInit() {

      },
            /**
       * Triggered when side navigation pressed
       * 
       * @param {object} oEvent instance 
       */
      onSideNavButtonPress: function () {
        const oSideNavigation = this.getView().byId("sideNavigation");
        const bExpanded = oSideNavigation.getExpanded();
        oSideNavigation.setExpanded(!bExpanded);
      },
      onOpenDialog: function () {
        const oModel = this.getView().getModel("chatModel");
        const current = oModel.getProperty("/chatBoxVisible");
        oModel.setProperty("/chatBoxVisible", !current);
        // Check if the dialog is already loaded
        // const oView = this.getView();

        // Fragment.load({
        //     id: oView.getId(), // important to keep IDs unique
        //     name: "finsight.reuselib.fragment.chatBox",
        //     controller: this
        // }).then(oFragment => {
        //     oView.byId("chatBox").addItem(oFragment);
        // });
    },
    onChatAction: function (oEvent) {
      ChatPlugin.onChatAction(this, oEvent);
    }
  });
});