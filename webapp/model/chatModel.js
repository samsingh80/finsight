sap.ui.define([
    "sap/ui/model/json/JSONModel"
],
    function (JSONModel, Util) {
        "use strict";

        const initialData = {
            busyIndicator: false,
            recentResponse: "",
            isFullScreen:false,
            chatItems: [

            ]
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
               * Sets the busy indicator in model whether chat busy indicator
               * is hidden or not.
               *
               * @param {boolean} busyIndicatorVisible indicating busy indicator visible
               */
            setBusyIndicator: function (busyIndicatorVisible) {
                this.setProperty("/busyIndicator", busyIndicatorVisible);
            },

            /**
             * Adds a new chat item to the chatItems array
             * @param {object} newChatItem The new chat item to be added
             * @param {Boolean} isUser Indicates whether the chat is from User
             */
            addChatItem: function (newChatItem,isUser) {
                let aChatItems = this.getProperty("/chatItems");
                aChatItems.push(newChatItem);
                this.setProperty("/chatItems", aChatItems);
                this.setProperty("/isUser", isUser);
            },

            /**
             * Returns the recent response by agent.
             *
             * @returns {string} recentResponse
             */
            getRecentMessage: function () {
                const recentResponse = this.getProperty("/recentResponse");
                return recentResponse;
            },

            /**
             * Sets the recent response by agent.
             *
             * @params {string} recentResponse
             */
            setRecentMessage: function (recentResponse) {
                this.setProperty("/recentResponse",recentResponse);
            },

            /**
             * Sets the Full Screen.
             *
             * @params {string} isFullScreen
             */
            setFullScreen: function (isFullScreen) {
                this.setProperty("/isFullScreen",isFullScreen);
            },


        });
    }
);