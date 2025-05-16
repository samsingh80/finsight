sap.ui.define([
    "../reuselib/module/util"
], function(
    Util
) {
	"use strict";

	return  {
        formatRowIcon: function (oValue) {
            switch (oValue) {
                case "Error":
                    return "sap-icon://error";
                case "S":
                    return "sap-icon://sys-enter-2";
                case "I":
                    return "sap-icon://information";
                case "Warning":
                    return "sap-icon://alert";
                default:
                    return ""; // Return an empty string for unknown values
            }
        },

        /**
         * format Action Status
         * @param{string} oValue Action Status
         * @returns{int} Color Scheme
         */
        formatActionStatus: function(oValue){
            const colorScheme = (oValue == 'ACTIVE') ? 8 :3;
            return colorScheme;
        },

        /**
         * Set the Visibility of Welcome
         * text in Chat Box
         * @param{boolean} showWelcomeText
         * @param{boolean}isMinimize
         * @returns{boolean} showWelcomeText
         */
        showWelcomeText: function(showWelcomeText,isMinimize){
            if(isMinimize){
                return false;
            }
            if(showWelcomeText){
                return true;
            }
            return false;
        },

        formatChat : function (text){
           return Util.addAnchorTags(text);
        }

	}
});