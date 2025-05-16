sap.ui.define([
  "./util",
  "./service",
  "./constant",
  "./dynamicUI",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/MessageToast"
],
  function (Util, Service, Constant,
    dynamicUI,
    Filter,
    FilterOperator,
    Sorter,MessageToast) {
    "use strict";

    /**
     * @param {object} controller this
     * @param {String} topicName 
     */
    function setTopic(controller, topicName) {
      // Set the topic in Chat Model
      let chatModel = getChatModel(controller);
      chatModel.setTopic(topicName);
      //Set the topic to history 
      let aFilters = [];
      if (topicName && topicName.length > 0) {
        let filter = new Filter("topicName", FilterOperator.EQ, topicName);
        aFilters.push(filter);
        // update list binding
        const chatHistoryList = Util.getCoreId(controller, 'chatHistoryList');
        let oBinding = chatHistoryList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      }


    }

    /**
     * Attach Enter Event for chatFeedInput
     * @param {object} controller this
     */
    function attachEventchatFeedInput(controller) {
      let chatFeedInput = controller.getView().byId('chatFeedInput');
      let chatFeedSubmit = controller.getView().byId('chatFeedSubmit');
      chatFeedInput.attachBrowserEvent("keypress", function (event) {
        let busyStatus = chatFeedInput.getModel("chatModel").getProperty("/busyIndicator");
        if ((event.keyCode === 13 && chatFeedInput.getValue().trim() !== "") && !busyStatus) {
          chatFeedSubmit.firePress();
          chatFeedInput.setValue(null);
          event.preventDefault();
        }
      });
    }

    /**
     * Format and add  chat
     * @param {object} controller this
     * @param {string} sInput User Input
     * @param {object} chatModel chat Model
     */
    async function addChat(controller, sInput, chatModel, actor, chatResponseID = null, userMessage = null,reference=null) {
      //Format the text with links
      const sFormattedText = Util.addAnchorTags(sInput);
      //render chat ui control
      let botChat;
      if (actor === Constant.actor.user) {
        botChat = dynamicUI.renderUserChat(sFormattedText);
      }
      else {
        botChat = dynamicUI.renderBotChat(sFormattedText, controller, chatResponseID, userMessage, reference);
      }
      addDynamicUI(controller, botChat);
      //update model
      chatModel.addChatItem(sInput, actor);
    }

    async function triggerChat(controller, sInput, actionId = null, isAdditionalInfo = null, resultMessage = "", detailInfo = null, qpUtterence = null, inputData = null, isTrigger = false, reference=null, outputType=null, tags = null) {
      // Get the Chat Model
      let chatModel = getChatModel(controller);
      //Set TimeStamp
      chatModel.setTimeStamp();

      setUserChat(controller, sInput, chatModel);
      if (detailInfo) {
        await setInfoBotChat(controller, sInput, detailInfo, chatModel,reference, tags);
      }
      else {
        //Set the Agent Chat
        await setBotChat(controller, sInput, chatModel, actionId, isAdditionalInfo, resultMessage, qpUtterence,inputData,null,isTrigger, reference, outputType);
      }
    }
    /**
     * Add User chat
     * @param {object} controller this
     * @param {string} sInput User Input
     * @param {object} chatModel chat Model
     */
    async function setUserChat(controller, sInput, chatModel) {
      addChat(controller, sInput, chatModel, Constant.actor.user);

      const chatBox = getChatBox(controller);

      const aFlexBoxes = chatBox?.findAggregatedObjects(true, function(oControl) {
        return oControl?.isA("sap.m.FlexBox");
      });
      
      aFlexBoxes.forEach(function(oFlexBox) {
        if (oFlexBox.hasStyleClass("showEmotions")) {
            oFlexBox.removeStyleClass("showEmotions");
        }
      });

      // Set Busy indicator
      setBusyIndicator(controller, chatModel);
    }

    /**
     * Add User chat
     * @param {object} controller this
     * @param {string} sInput User Input
     * @param {string} detailInfo Info Input
     * @param {object} chatModel chat Model
     */
    async function setInfoBotChat(controller, sInput, detailInfo, chatModel, reference=null, tags = null) {
      const { currentChatID } = chatModel.getProperty("/");
      const oChatResponseID = await Service.addConversation(controller, currentChatID, sInput, detailInfo, tags);
      addChat(controller, detailInfo, chatModel, Constant.actor.bot, oChatResponseID, sInput, reference);
      //update model
      chatModel.addChatItem(sInput, Constant.actor.user);
      // Set Busy indicator
      chatModel.setBusyIndicator(false);
    }

    /**
     * Call the prompt and add the response to list
     * @param {object} controller this
     * @param {string} sInput User Input
     * @param {object} chatModel chat Model
     */
    async function setBotChat(controller, sInput, chatModel, actionId = null, isAdditionalInfo = null, resultMessage = "", qpUtterence= null, inputData = null, sqpId = null, isTrigger = false, isFollowUp = false, outputType = null) {
      // Asynchronously wait for the prompt message
      try {
        setBusyIndicator(controller, chatModel);
        const response = await Service.getPromptMessage(controller, sInput, chatModel, actionId, inputData, sqpId, isTrigger, isFollowUp, resultMessage, isAdditionalInfo,qpUtterence, outputType);
        const { chatResponse, actionResponse, chatId, qpId, chatResponseID, userMessage, reference } = response;
        const oActionResponse = actionResponse?JSON.parse(actionResponse):actionResponse;
        // const oActionResponse = actionResponse;
        const action = oActionResponse?.action;
        let results = oActionResponse?.results;
        if (typeof results === 'string') {
          results = JSON.parse(oActionResponse?.results);
        }
        let oReference = reference;
        if (typeof reference === 'string') {
          oReference = JSON.parse(reference);
        }
        chatModel.setRecentResponse(oActionResponse, sInput);
        chatModel.setCurrentChatID(chatId);
        if (chatResponse && chatResponse != '') {
          //Add bot Chat
          addChat(controller, chatResponse, chatModel, Constant.actor.bot, chatResponseID, userMessage, oReference);
          //update model
          chatModel.addChatItem(sInput, Constant.actor.user);
        }
        // Result has action information
        if (action) {
          if (action?.uiTypeOutput && results) {
            setDynamicOutput(controller, action, results, chatModel);
            //Check for follow up action
            await checkFollowUpAction(controller, action, chatModel);
          }
          else if (action?.uiTypeInput) {
            await setDynamicInput(controller, action, qpId);
          }
        }
        chatModel.setBusyIndicator(false);

      } catch (error) {
        chatModel.setBusyIndicator(false);
        console.log(`Error from Service: ${error}`);
        addChat(controller, Constant.chatError, chatModel, Constant.actor.bot);
      }
    }

    async function checkFollowUpAction(controller, action, chatModel) {
      if (action?.followUpAction) {
        if (action?.isFollowUpConfirm) {

        }
        await setBotChat(controller, null, chatModel, action?.followUpAction, null, '', null, null, null, true, true)
      }
    }

    /**
     * Add the Dynamic UI to the chat box
     */
    async function addDynamicUI(controller, UIElement) {
      const chatBox = getChatBox(controller);
      // Add the dynamic UI to the dynamicChatBox container
      chatBox.addItem(UIElement);
      await Util.stepDelay(100);
      scrollToBottom(controller);

    }

    async function setBusyIndicator(controller, chatModel) {
      // Set Busy indicator
      chatModel.setBusyIndicator(true);
      await Util.stepDelay(100);
      scrollToBottom(controller);
    }

    /**
     * 
     * @param {*} controller 
     * @param {*} action 
     * @param {*} qpId 
     */
    async function setDynamicInput(controller, action, qpId) {
      const dynamicInputUI = await dynamicUI.renderDynamicInputUI(action, controller, qpId);
      addDynamicUI(controller, dynamicInputUI);
    }

    async function setDynamicOutput(controller, action, results, chatModel) {
      const uiType = action?.uiTypeOutput;
      if (uiType == 'VIEW') {
        clearChat(controller);
        //Set the topic
        if (action?.subTopic) {
          chatModel.setSubTopic(action?.subTopic);
        }
        var oRouter = controller.getOwnerComponent().getRouter();
        oRouter.navTo("content", { timestamp: new Date().getTime() }, true);
      } else {
        const items = action?.outputMetadata?.items;
        const dynamicUIElement = dynamicUI.renderDynamicOutputUI(action?.outputMetadata, items, results, controller);
        dynamicUIElement.addStyleClass("chatDynamicUI");
        addDynamicUI(controller, dynamicUIElement);
      }
    }


    /**
     * Scroll to the end of the FlexBox container
     * @param {object} chatBox ui
     */
    function scrollToBottom(controller) {
      let scrollContainer = Util.getCoreId(controller, 'scrollChatBox');
      scrollContainer.scrollTo(0, 9999999999999);
    }

    /**
     * Clear the chat box
     * @param {object} oEvent object 
     */
    function clearChat(controller) {
      // Get the Chat Box
      const chatBox = getChatBox(controller);
      chatBox.removeAllItems();
      // Get the Chat Model
      const chatModel = getChatModel(controller);
      //ClearModel
      chatModel.clearChat();
      //Clear the history.
      const historyItems = getHistoryItem(controller);
      historyItems.setBindingContext(null, "shaeQueryModel");
    }

    /**
     * 
     * @param {object} controller 
     * @returns Chatbox ui
     */
    function getChatBox(controller) {
      const chatBox = Util.getCoreId(controller, 'chatItems');
      return chatBox;
    }

    /**
   * 
   * @param {object} controller 
   * @returns historyItems ui
   */
    function getHistoryItem(controller) {
      const historyItems = Util.getCoreId(controller, 'historyItems');
      return historyItems;
    }
    /**
     * Get the chat model
     * @param {object} controller 
     * @returns {model} Chat Model
     */
    function getChatModel(controller) {
      return Util.getModel(controller.getOwnerComponent(), 'chatModel');
    }

    /**
     * 
     * @param {object} controller 
     * @returns Chatbox ui
     */
    function getChatBot(controller) {
      const chatBot = Util.getCoreId(controller, 'ChatBot');
      return chatBot;
    }

    /**
     * 
     * @param {object} controller 
     * @returns Chatbox ui
     */
    function onChatAction(controller, oEvent) {
      const oTarget = oEvent.getSource().data("target");
      // Get the Chat Model
      const chatModel = getChatModel(controller);
      switch (oTarget) {
        case 'userChat':
          onUserChat(oEvent, controller, chatModel);
          break;
        case 'showHistory':
          onShowHistory(chatModel, controller);
          break;
        case 'refresh':
          clearChat(controller);
          break;
        case 'close':
          onClose(chatModel, controller);
          break;
        case 'max':
          onMax(chatModel, controller);
          break;
        case 'min':
          onMin(chatModel, controller);
          break;
        case 'fullScreen':
          onFullScreen(chatModel, controller);
          break;
        case 'exitFullScreen':
          onExitFullScreen(chatModel, controller);
          break;
        case 'deleteHistory':
          onDeleteHistory(oEvent);
          break;
        case 'editHistory':
          onEditHistory(oEvent, controller);
          break;
        case 'saveHistory':
          onSaveHistory(oEvent, controller);
          break;
        case 'historyactionResponse':
          onHistoryActionResponse(oEvent, controller, chatModel);
          break;
        case 'searchHistory':
          onSearchHistory(oEvent, controller);
          break;
        case 'onHistorySort':
          onHistorySort(oEvent, controller);
          break;
        case 'onCopy':
          onCopy(oEvent);
          break;
        case 'onRegenerate':
          onRegenerate(oEvent, controller);
          break;
        case 'onAgree':
        case 'onDisagree':
          addSentiment(oEvent, controller, oTarget);
          break;
        case 'onFeedbackSubmit':
          submitFeedback(oEvent, controller, oTarget);
          break;
        default:
          break;
      }
    }

      /**
       * Event handler for the chat entered by user
       * Calls the ai and return aresponse
       * @param {object} oEvent object
       */

      async function onUserChat (oEvent, controller, chatModel) {
        //disable submit button
        chatModel.setSubmit(false);
        // Get the user input
        const sInput = Util.getCoreId(controller, 'chatFeedInput').getValue();;
        triggerChat(controller, sInput);

        let Feedinp = Util.getCoreId(controller, 'chatFeedInput');
        Feedinp.setValue(null);
      }

    /**
     * Triggered when action response is available
     * from chat history
     * @param {object} oEvent 
     * @param {*} controller 
     */
    async function onHistoryActionResponse(oEvent, controller, chatModel) {
      const oSource = oEvent.getSource();
      // const sActionResponse = oSource?.getBindingContext('shaeQueryModel')?.getObject()?.actionResponse;
      const sActionResponse = await oSource?.getBindingContext('shaeQueryModel').requestObject('actionResponse');
      if (sActionResponse && sActionResponse != '' && oSource.getItems()?.length === 0) {
        const oActionResponse = JSON.parse(sActionResponse);
        const action = oActionResponse?.action;
        const results = oActionResponse?.results;
        if (action?.uiTypeOutput && results) {
          const items = action?.outputMetadata?.items;
          const dynamicUIElement = dynamicUI.renderDynamicOutputUI(action?.outputMetadata?.headerTitle, items, results, controller);
          dynamicUIElement.addStyleClass("chatDynamicUI");
          oSource.addItem(dynamicUIElement);
        }
      }
    }

    /**
     * Edit the Chat Name
     * @param {object} oEvent
     */
    async function onEditHistory(oEvent, controller) {
      const oContext = oEvent.getSource().getBindingContext('shaeQueryModel');
      const { ID } = oContext.getObject();
      // Get the Chat Model
      const chatModel = getChatModel(controller);
      chatModel.setEditedItemID(ID);
    }


    /**
     * Save the Chat Name
     * @param {object} oEvent
     * @param {object} controller
     */
    async function onSaveHistory(oEvent, controller) {
      const chatModel = getChatModel(controller);
      chatModel.setEditedItemID(null);
    }

    /**
     * Delete the Chat Histroy
     * @param {object} oEvent
     */
    function onDeleteHistory(oEvent) {
      oEvent.getSource().getBindingContext('shaeQueryModel').delete();
    }

    /**
     * Search the Chat Name
     * @param {object} oEvent
     * @param {object} controller
     */
    async function onSearchHistory(oEvent, controller) {
      let aFilters = [];
      let sQuery = oEvent.getParameter("query");
      if (sQuery && sQuery.length > 0) {
        let filter = new Filter("chatName", FilterOperator.Contains, sQuery);
        aFilters.push(filter);
      }

      // update list binding
      const chatHistoryList = Util.getCoreId(controller, 'chatHistoryList');
      let oBinding = chatHistoryList.getBinding("items");
      oBinding.filter(aFilters, "Application");
    }


    /**
     * Sort the Chat Name
     * @param {object} oEvent
     * @param {object} controller
     */
    async function onHistorySort(oEvent, controller) {

      const oItem = oEvent.getParameter("item");
      const sKey = oItem.getKey();
      const sortText = oItem.getText();
      const chatModel = getChatModel(controller);
      chatModel.setHistorySortBy(sortText);

      const bDescending = (sKey === "desc");

      const chatHistoryList = Util.getCoreId(controller, 'chatHistoryList');
      let oBinding = chatHistoryList.getBinding("items");
      if (sKey === "recent") {
        const oSorter = new Sorter("modifiedAt", true);
        oBinding.sort(oSorter);
      } else {
        const oSorter = new Sorter("chatName", bDescending);
        oBinding.sort(oSorter);
      }


    }

    /**
     * Event to show chatbot history
     * @param {object} chatModel 
     */
    function onShowHistory(chatModel, controller) {
      chatModel.setShowHistory();
      chatModel.setEditedItemID(null);
      //Refresh the history
      const chatHistoryList = Util.getCoreId(controller, 'chatHistoryList');
      if (chatHistoryList) {
        const oBinding = chatHistoryList.getBinding("items");
        oBinding.requestRefresh();
      }
    }

    /**
     * Copy the Agent Chat
     * @param {object} oEvent
     */
    function onCopy(oEvent) {
      const oSource = oEvent?.getSource();
      const aItems = oSource?.getParent().getParent().getItems();
      if (aItems?.length > 0 && Array.isArray(aItems)) {
        const message = aItems[0]?.getDomRef()?.innerText;
        if (navigator?.clipboard && message) {
          navigator?.clipboard.writeText(message).then(function () {
          }).catch(function (err) {
            console.log("Failed to copy text.");
          });
        }
      }
    }

    /**
     * Regenerate the Agent Chat
     * @param {object} oEvent
     * @param {object} controller
     */
    function onRegenerate(oEvent, controller) {
      const oSource = oEvent?.getSource();
      const userMessage = oSource?.data("userMessage");
      if (userMessage) {
        triggerChat(controller, userMessage);
      }
    }

    /**
     * 
     * @param {object} oEvent
     * @param {object} controller
     */
    async function addSentiment(oEvent, controller, oTarget) {
      const oSource = oEvent?.getSource();
      const ID = oSource?.data("ID");
      const type = oSource?.getType();
      const sentiment = oTarget === "onAgree" ? 'AGREE' : 'DISAGREE';

      if (!ID || !type) {
        console.error("ID or type is not defined");
        return;
      }

      const proposedType = 'Emphasized';
      oSource.setType(proposedType);

      // Get the agreeDisagreeBox
      const aAgreeDisAgreeBox = oSource.getParent().getItems();
      if (Array.isArray(aAgreeDisAgreeBox) && aAgreeDisAgreeBox.length > 1 && sentiment) {
        // If Agree button is Clicked, we will make Disagree button Transparent and vice versa
        const oElement = sentiment === 'AGREE' ? aAgreeDisAgreeBox[1] : aAgreeDisAgreeBox[0];
        oElement.setType('Transparent');
      }

      // Get the sentiment flexbox
      const oAgentBox = oSource?.getParent()?.getParent()?.getParent();
      const aItems = oAgentBox?.getItems();
      if (Array.isArray(aItems) && aItems.length > 1) {
        const agreeDisagreeBox = aItems[1];
        const oMessageEmotions = aItems[2];
        const oFeedbackBox = aItems[3];
        const oFeedbackTextArea = oFeedbackBox?.getItems()?.[0];
        oFeedbackTextArea?.setCols(100);
        oFeedbackTextArea?.setRows(3);

        const oFeedbackBoxTargetCustomData = oFeedbackBox?.getCustomData()?.find(function(CustomData) {
          return CustomData.getKey() === "target";
        });

        // Setting the Custom Data target to sentiment value
        if (oFeedbackBoxTargetCustomData) {
          oFeedbackBoxTargetCustomData.setValue(sentiment);
        }

        const agreeDisagreeIcon = agreeDisagreeBox.getItems()?.[0];
        if (agreeDisagreeIcon) {
          agreeDisagreeIcon.setVisible(true);
          const src = proposedType !== 'Emphasized' ? null : sentiment === 'AGREE' ? 'sap-icon://thumb-up' : 'sap-icon://thumb-down';
          agreeDisagreeIcon.setSrc(src);

          // Add the Style class which will make the Emotion box as fixed
          if (!oMessageEmotions.hasStyleClass("showEmotions")) {
            oMessageEmotions.addStyleClass("showEmotions");
            oFeedbackBox.addStyleClass("showEmotions");
          }

          // Check if the Bot message box is the last message then scroll the page to bottom
          let oChatItems = null, oCurrentChatItemBox = null;
          const oModel = oSource.getBindingContext('shaeQueryModel');
          if (oModel) {
            // Chat Item is part of History conversation
            oCurrentChatItemBox = oAgentBox.getParent().getParent();
            oChatItems = oCurrentChatItemBox.getParent();
          } else {
            // Chat Item is part of New conversation
            oCurrentChatItemBox = oAgentBox;
            oChatItems = oCurrentChatItemBox.getParent();
          }
          
          const oTotalChatItems = oChatItems.getItems()?.length;
          const oChatItemIdx = oChatItems.indexOfItem(oCurrentChatItemBox);
          if (oTotalChatItems === (oChatItemIdx + 1)) {
            scrollToBottom(controller);
          }
        }
      }
    }

    /**
     * Submit Feedback to update the user feedback for a chat response
     * @param {object} oEvent
     * @param {object} controller
     */
    async function submitFeedback(oEvent, controller, oTarget) {
      try {
        // Remove the fixed Style class from the Emotion Box and Feedback Box so they becomes invisible
        const oFeedbackBox = oEvent.oSource?.getParent();
        const oMessageEmotions = oEvent.oSource?.getParent()?.getParent()?.getItems()[2];
        oFeedbackBox.removeStyleClass("showEmotions");
        oMessageEmotions.removeStyleClass("showEmotions");

        const ID = oFeedbackBox?.data("ID");
        const sentiment = oFeedbackBox?.data("target");
        const comment = oFeedbackBox.getItems()[0].getValue();

        // Call the Service API to update the Sentiment and Feedback comment
        await Service.setSentiment(controller, ID, sentiment, comment);
        MessageToast.show("Thank you for your feedback");
      } catch (error) {
        console.log("Failed to Submit feedback")
        MessageToast.show("Failed to Submit feedback. Please try again!");
      }
    }

    /**
     * Event handler to close the assitance
     * chat box
     * @param {object} chatModel  
     */
    function onClose(chatModel, controller) {
      chatModel.setChatBoxVisibility(false);
      Util.maxAppView(controller);
    }

    /**
     * Max the chat window
     * @param {object} chatModel 
     * @param {object} controller 
     */
    function onMax(chatModel, controller) {
      chatModel.setMinimise(false);
      const chatBot = getChatBot(controller);
      chatBot.removeStyleClass('ChatBoxMin');
      chatBot.addStyleClass("ChatBoxMax");
      Util.minAppView(controller);
    }
    /**
     * Minimise the chat window
     * @param {object} chatModel 
     * @param {object} controller 
     */
    function onMin(chatModel, controller) {
      chatModel.setMinimise(true);
      const chatBot = getChatBot(controller);
      chatBot.addStyleClass("ChatBoxMin");
      Util.maxAppView(controller);
    }

    /**
     * Expands chatBot
     * @param {object} chatModel 
     * @param {object} controller 
     */
    function onFullScreen(chatModel, controller) {
      chatModel.setFullScreen(true);
      chatModel.setMinimise(false);
      const chatBot = getChatBot(controller);
      chatBot.removeStyleClass('ChatBox');
      chatBot.removeStyleClass('ChatBoxMin');
      chatBot.addStyleClass("ChatBoxMax");
      Util.maxAppView(controller);
    }
    /**
     * Exit Full Screen to Normal size
     * @param {object} chatModel 
     * @param {object} controller 
     */
    function onExitFullScreen(chatModel, controller) {
      chatModel.setFullScreen(false);
      chatModel.setMinimise(false);
      const chatBot = getChatBot(controller);
      chatBot.removeStyleClass('ChatBoxMax');
      chatBot.removeStyleClass('ChatBoxMin');
      chatBot.addStyleClass("ChatBox");
      Util.minAppView(controller);
    }

    function addHistorytoChat(controller, oEvent) {
      //Clear exsisting chat
      clearChat(controller);
      const oContext = oEvent.getParameters().listItem.getBindingContext("shaeQueryModel");
      const historyItems = getHistoryItem(controller);
      historyItems.setBindingContext(oContext, "shaeQueryModel");
      historyItems.getBindingContext("shaeQueryModel").refresh();
      // Get the Chat Model
      const chatModel = getChatModel(controller);
      const { ID } = oContext.getObject();
      chatModel.setCurrentChatID(ID);
      const { modifiedAt } = oContext.getObject();
      chatModel.setTimeStamp(modifiedAt);
      onShowHistory(chatModel);
    }


    function UserLiveChat(controller, oEvent) {
      const userinp = oEvent.getParameter("value");
      const chatModel = getChatModel(controller);
      if (!userinp || userinp == "/n") {
        chatModel.setSubmit(false);
      } else {
        chatModel.setSubmit(true);
      }
    }

    return {
      attachEventchatFeedInput,
      triggerChat,
      clearChat,
      addChat,
      setBotChat,
      onChatAction,
      submitFeedback,
      addHistorytoChat,
      setTopic,
      onMax,
      onFullScreen,
      UserLiveChat,
      setUserChat,
      getChatBox,
      checkFollowUpAction,
      addDynamicUI,
      setBusyIndicator,
      setDynamicInput,
      setDynamicOutput,
      scrollToBottom,
      getHistoryItem,
      getChatBot,
      onHistoryActionResponse,
      onEditHistory,
      onSaveHistory,
      onDeleteHistory,
      onSearchHistory,
      onHistorySort,
      onShowHistory,
      onClose,
      onMin,
      onExitFullScreen,
      addHistorytoChat,
      addSentiment,
      onUserChat,
      onCopy
    }
  }
);