sap.ui.define([
    "./util"
],
    function (Util) {
        "use strict";

        /**
           * Get the Data from the entity
           *
           * @param {object} oComponent Component
           * @param {string} sModel Model Name
           * @param {string} sEntity Entity Name
           */

        async function getEntityData(oComponent, sModel, sEntity, aFilter = []) {
            const oModel = oComponent.getView().getModel(sModel);
            const oBinding = oModel.bindList(sEntity, null, [], aFilter, { $$getKeepAliveContext: true });
            const oContext = await oBinding.requestContexts();
            const oData = oContext.map(oContext => oContext.getObject());
            return oData;
        }


        /**
         * Receives the prompt message by sending the 
         * user input as a question
         * 
         * @param {string} sInput Prompt Input
         * @returns {string} promptResponse.
         */
        async function getPromptMessage(oComponent, sInput, chatModel, actionId, inputData, qpId, isTrigger, isFollowUp, resultMessage, isAdditionalInfo, qpUtterence = null, outputType = null) {
            try {
                // Set Busy indicator
                chatModel.setBusyIndicator(true);
                const { currentChatID, selectedSystemID, topic, subTopic } = chatModel.getProperty("/");
                const oModel = oComponent.getView().getModel('shaeQueryModel');
                const parameters = {
                    "systemId": selectedSystemID,
                    "chatId": currentChatID,
                    "topic": topic,
                    "subTopic": subTopic,
                    "query": qpUtterence ? qpUtterence : sInput,
                    "actionId": actionId,
                    "inputData": inputData,
                    "qpId": qpId,
                    "isTrigger": isTrigger ? isTrigger : false,
                    "followupAction": isFollowUp,
                    "resultMessage": resultMessage,
                    "isAdditionalInfo":isAdditionalInfo,
                    "outputType" : outputType
                }
                return Util.executeUnBoundAction(oModel, '/runQuery(...)', parameters);
            } catch (error) {
                // Re-throw the error
                throw error;
            }
        }

        /**
         * Receives the prompt message by sending the 
         * user input as a question
         * 
         * @param {object} oController this
         * @returns {string} promptResponse.
         */
        async function addConversation(oController,chatId,query,botMessage,tags) {
            try {
                const oModel = oController.getView().getModel('shaeQueryModel');
                const parameters = {
                    "chatId": chatId,
                    "query": query,
                    "botMessage": botMessage,
                    "tags" : tags
                }
               const response = await Util.executeUnBoundAction(oModel, '/addConversation(...)', parameters);
               return response?.value;
            } catch (error) {
                // Re-throw the error
                throw error;
            }
        }       


        /**
         * Receives the prompt message by sending the 
         * user input as a question
         * 
         * @param {object} oController this
         * @returns {string} promptResponse.
         */
        async function setSentiment(oController, ID, sentiment, comment = null) {
            try {
                const oModel = oController.getView().getModel('shaeQueryModel');
                const parameters = {
                    "ID": ID,
                    "sentiment": sentiment,
                    ...(comment != null
                        ? {
                            "comment": comment
                        }
                        : {}),
                }
                await Util.executeUnBoundAction(oModel, '/addSentiment(...)', parameters);
            } catch (error) {
                // Re-throw the error
                throw error;
            }
        }
        return {
            getPromptMessage,
            getEntityData,
            setSentiment,
            addConversation
        }
    }
);