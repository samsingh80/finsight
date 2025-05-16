sap.ui.define([
    "sap/ui/model/json/JSONModel"
],
    function (JSONModel) {
        "use strict";

        const initialData = {
            userName: '',
            systemStatus: 'Connected',
            simplificationUrl: 'https://me.sap.com/sic',
            showSystemPopup: false,
            selectedSystem: 'Please select a System',
            selectedSystemID:'',
            Systems:[],
            get greetingMessage() {
                const currentHour = new Date().getHours();
                const greetingMessage = currentHour < 12 ? "Good Morning" :
                    currentHour < 18 ? "Good Afternoon" :
                        "Good Evening";
                return greetingMessage;
            },
        };

        return JSONModel.extend("com.sap.shae.flp.plugins.homepage.chatModel", {

            /**
             * Constructor for the Chat Model - initialize the data
             */
            constructor: function () {
                JSONModel.prototype.constructor.apply(this, arguments);

                this.reset();
            },

            /**
             * Resets the model's Chat
             */
            reset: function () {
                this.setProperty("/", Object.create(initialData));
            },

            /**
               * Sets the show system poup visibility.
               *
               * @param {boolean} systemPopupVisible indicating system popup visible
               */
            setSystemPopupVisible: function (systemPopupVisible) {
                this.setProperty("/showSystemPopup", systemPopupVisible);
            },


            /**
               * Get the Simplification Catalog URL
               *
               * @return {string} simplificationUrl Simplification Catalog URL
               */
            getSimplificationUrl: function () {
                return this.getProperty("/simplificationUrl");
            },


            /**
              * Get the Simplification Catalog URL
              *
              * @return {string} simplificationUrl Simplification Catalog URL
              */
            setUserName: function () {
                const sUserName = sap?.ushell?.Container?.getService("UserInfo")?.getFirstName();
                this.setProperty("/userName", sUserName);
            },

            /**
              * Set the Systems 
              *
              * @return {array} aSystems
              */
            setSystems:function(aSystems){
                this.setProperty("/Systems", aSystems)
            },                                                                                                   
            
            /**
              * Set the Systems 
              *
              * @param {object} selectedData Selected System
              */
            setSystemSelection: function (selectedData) {
                let aItems = this.getProperty("/Systems");
                this.setProperty("/selectedSystem", selectedData?.sid);
                this.setProperty("/SelectedSystemID", selectedData?.ID);
                const me = this;
                aItems.forEach(function (oItem) 
                {
                    if (oItem !== selectedData ) {
                        me.setProperty("/Systems/" + aItems.indexOf(oItem) + "/isDefault", false);
                    }
                });
            },

            /**
              * Get the Selected Systems 
              *
              * @return {string}  Selected System
              */
            getSelectedSystemID: function () {
                return this.getProperty("/selectedSystemID");
               
            }            
            
        });
    }
);