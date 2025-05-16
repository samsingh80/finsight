sap.ui.define([
    "../module/service",
    "../module/chatPlugin",
    "../module/util",
    "sap/base/Log"
],
    function (Service, ChatPlugin, Util, Log) {
        "use strict";

        /**
         * Expands Dialog
         * 
         * @param {object} oEvent object
         */
        function onFullScreen(oEvent) {
            const dialog = oEvent?.getSource()?.getParent()?.getParent();
            // Get the Chat Model
            const chatModel = dialog.getModel("chatModel");
            chatModel.setFullScreen(true);
            dialog.removeStyleClass('chatDialogMin');
            dialog.addStyleClass("chatDialogMax");
        }

        /**
         * Exit Full Screen to Normal size
         * 
         * @param {object} oEvent object
         */
        function onExitFullScreen(oEvent) {
            const dialog = oEvent?.getSource()?.getParent()?.getParent();
            // Get the Chat Model
            const chatModel = dialog.getModel("chatModel");
            chatModel.setFullScreen(false);
            dialog.removeStyleClass('chatDialogMax');
            dialog.addStyleClass("chatDialogMin");
        }
        
        /**
         * Closes dialog
         * 
         * @param {object} dialog object
         * @returns {any} dialog object close return value
         */
        function closeDialog(dialog) {
            return dialog?.close() || false;
        }        

        /**
         * Event handler for press event on dialog close button
         * 
         * @param {object} oEvent object
         * @returns {any} return value
         */
        function onClose(oEvent) {
            const dialog = oEvent?.getSource()?.getParent()?.getParent();
            return closeDialog(dialog);
        }

        /**
         * Event handler for the chat entered by user
         * Calls the ai and return aresponse
         * @param {object} oEvent object
         */

        async function onUserChat(oEvent) {
            // Get the Chat Model
            const chatModel = oEvent?.getSource().getModel("chatModel");
            // Get the user input
            const sInput = oEvent.getSource().getValue();
            //Format the text with links
            const sFormattedText = Util.addAnchorTags(sInput);
            // Add user chat item to the list
            let chatListItem = ChatPlugin.constructChatListItem(sFormattedText, false);
            chatModel.addChatItem(chatListItem, true);
            // Set Busy indicator
            chatModel.setBusyIndicator(true);
            // Scroll to the end of the list
            ChatPlugin.scrollListEnd();
            //Set the Agent Chat
            setAgentChat(sInput, chatModel);
        }

        /**
         * Call the prompt and add the response to list
         * @param {string} sInput User Input
         * @param {object} chatModel chat Model
         */
        async function setAgentChat(sInput, chatModel) {
            // Asynchronously wait for the prompt message
            try {
                //Get the last recent response 
                const recentResponse = chatModel.getRecentMessage();
                const baseUrl = '';
                const sUrl = `${baseUrl}?question=${sInput}&history=${recentResponse}`;
               Service.getPromptMessage(sUrl,this, chatModel);

            } catch (error) {
                Log.error(error);
            }

        }

        return {
            onClose,
            onUserChat,
            onFullScreen,
            onExitFullScreen
        };
    }
);