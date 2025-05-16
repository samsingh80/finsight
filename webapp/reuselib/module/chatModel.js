sap.ui.define([
    "sap/ui/model/json/JSONModel"
],
    function (JSONModel, Util) {
        "use strict";

        const initialData = {
            userName: '',
            chatBoxVisible: false,
            alwaysFullScreen: false,
            showHistory: false,
            busyIndicator: false,
            enableSubmit: false,
            recentQuery: null,
            recentResponse: null,
            recentAction: null,
            isFullScreen: false,
            isMinimize: false,
            currentChatID: null,
            topic: "",
            subTopic: "",
            busyDialogMsg: "",
            selectedSystemID: '',
            editedItemID: null,
            historySortBy: "Recent",
            enableFeedbackBox: false,
            feedbackComment: "",
            sentiment: "",
            messageID: null,
            chatItems: [
            ],
            get showWelcomeText() {
                return this.chatItems?.length ? false : true
            }
        };

        return JSONModel.extend("finsight.model.chatModel", {

         

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
               * Sets the topic id on application load
               *
               * @param {string} topic name
               */
            setTopic: function (topic) {
                this.setProperty("/topic", topic);
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
               * Sets the sub topic id based on content
               *
               * @param {string} subtopic name
               */
            setSubTopic: function (subTopic) {
                this.setProperty("/subTopic", subTopic);
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
            addChatItem: function (message, actor) {
                let aChatItems = this.getProperty("/chatItems");
                const newChatItem = {
                    message: message,
                    actor: actor
                }
                aChatItems.push(newChatItem);
                this.setProperty("/chatItems", aChatItems);
            },

            /**
             * Returns the recent response by agent.
             *
             * @returns {string} recentResponse
             */
            getRecentResponse: function () {
                const recentResponse = this.getProperty("/recentResponse");
                return recentResponse;
            },

            /**
             * Set the recent response by agent.
             *
             * @params {object} recentResponse Response frm QP
             */
            setRecentResponse: function (response, sInput) {
                response = response ? response : {};
                response.query = sInput;
                this.setProperty("/recentResponse", response);
            },

            /**
             * Returns the recent response by agent.
             *
             * @returns {object} recentResponse Action
             */
            getRecentAction: function () {
                const recentAction = this.getProperty("/recentAction");
                return recentAction;
            },

            /**
             * Set the recent response by agent.
             *
             * @params {object} recentResponse Action
             */
            setRecentAction: function (action) {
                this.setProperty("/recentAction", action);
            },

            /**
             * Get the chat ID.
             *
             * @params {string} chatId
             */
            getCurrentChatID: function () {
                return this.getProperty("/currentChatID");
            },

            /**
             * Sets the chat ID.
             *
             * @params {string} chatId
             */
            setCurrentChatID: function (chatId) {
                this.setProperty("/currentChatID", chatId);
            },

            /**
 
            /**
             * Sets the Full Screen.
             *
             * @params {string} isFullScreen
             */
            setFullScreen: function (isFullScreen) {
                this.setProperty("/isFullScreen", isFullScreen);
            },

            /**
             * Sets the Full Screen.
             *
             * @params {string} isFullScreen
             */
            setMinimise: function (isMinimize) {
                this.setProperty("/isMinimize", isMinimize);
            },

            /**
             * Sets the Chat Box visibility.
             *
             * @params {boolean} chatBoxVisible
             */
            setChatBoxVisibility: function (chatBoxVisible) {
                this.setProperty("/chatBoxVisible", chatBoxVisible);
            },

            /**
             * Sets the Chat Box visibility.
             *
             * @return {boolean} chatBoxVisible
             */
            getChatBoxVisibility: function () {
                return this.getProperty("/chatBoxVisible");
            },

            /**
             * Sets the Message for Busy Dialog
             *
             * @params {string} busyDialogMsg
             */
            setBusyDialogMsg: function (busyDialogMsg) {
                this.setProperty("/busyDialogMsg", busyDialogMsg);
            },
            /**
             * Sets the Message for Busy Dialog
             *
             * @params {string} busyDialogMsg
             */
            clearChat: function () {
                this.setProperty("/chatItems", []);
                this.setProperty("/currentChatID", null)
                this.setProperty("/timestamp", null);
            },

            /**
             * Set Boolean to show the detail Config 
             *
             * @return {Boolean} bShowDetailTaxConfig
             */
            setShowDetailTaxConfig: function (bShowDetailTaxConfig) {
                this.setProperty("/cvi/showDetailTaxConfig", bShowDetailTaxConfig);
            },

            /**
              * Set Boolean to show the detail Config Display
              *
              * @return {Boolean} bShowDetailTaxConfigDisplay
              */
            setShowDetailTaxConfigDisplay: function (bShowDetailTaxConfigDisplay) {
                this.setProperty("/cvi/showDetailTaxConfigDisplay", bShowDetailTaxConfigDisplay);
            },

            /**
              * Get the Selected Systems 
              *
              * @return {string}  Selected System
              */
            getSelectedSystemID: function () {
                return this.getProperty("/selectedSystemID");

            },

            /**
             * Set the TimeStamp 
             *
             * @param {string}  value
             */
            setTimeStamp: function (timestampcal) {
                let date = new Date();
                let timestamp;

                if (timestampcal != undefined) {

                    let histdate = new Date(timestampcal).toLocaleDateString();
                    let histtime = new Date(timestampcal).toLocaleTimeString();
                    if (histdate == date) {
                        timestamp = "Today" + " " + date.toLocaleTimeString();
                    } else {
                        timestamp = histdate + " " + histtime;
                    }
                } else {
                    timestamp = "Today" + " " + date.toLocaleTimeString();
                }

                this.setProperty("/timestamp", timestamp);

            },


            /**
              * Set the Selected Systems 
              *
              * @param {string}  Selected System
              */
            setSelectedSystemID: function (systemId) {
                this.setProperty("/selectedSystemID", systemId);

            },

            /**
              * Set the Show History Flag 
              *
              * @param {boolean}  flag to determine whther to show history
              */
            setShowHistory: function () {
                let showHistory = this.getProperty("/showHistory");
                this.setProperty("/showHistory", !showHistory);

            },

            /**
              * Set the ID for History Edit
              *
              * @param {String}  ID
              */
            setEditedItemID: function (ID) {
                this.setProperty("/editedItemID", ID);

            },

            /**
              * Set the sort value for History
              *
              * @param {String}  value
              */
            setHistorySortBy: function (value) {
                this.setProperty("/historySortBy", value);

            },

            /**
              * Set whether the chat should show on full screen
              *
              * @param {Boolean}  value
              */
            setAlwaysFullScreen: function (alwaysFullScreen) {
                this.setProperty("/alwaysFullScreen", alwaysFullScreen);
            },

            /**
             * Set whether the chat should show on full screen
             *
             * @param {Boolean}  value
             */
            setFullScreen: function (isFullScreen) {
                this.setProperty("/isFullScreen", isFullScreen);
            },
          
            /**
            * Set Enable Submit button
            *
            * @param {Boolean}  value
            */
            setSubmit: function (enableSubmit) {
                this.setProperty("/enableSubmit", enableSubmit);
            }
        });
    }
);