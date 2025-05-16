sap.ui.define([
    "sap/m/FlexBox",
    "sap/m/FormattedText",
    "sap/m/Title",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/CheckBox",
    "sap/m/Select",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/Table",
    "sap/m/Text",
    "sap/m/Link",
    "sap/m/List",
    "sap/m/MessageStrip",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/core/CustomData",
    "sap/ui/core/Item",
    "./validator",
    "./util",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/controls/VizFrame",
    "sap/m/Panel",
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet'
], function (
    FlexBox,
    FormattedText,
    Title,
    Label,
    Input,
    CheckBox,
    Select,
    TextArea,
    Button,
    Table,
    Text,
    Link,
    List,
    MessageStrip,
    SimpleForm,
    CustomData,
    Item,
    validator,
    Util,
    JSONModel,
    VizFrame,
    Panel,
    exportLibrary,
    Spreadsheet
) {
    "use strict";
    var EdmType = exportLibrary.EdmType;

    /**
     * Render the dynamic Input UI based on the action
     * @param {object} action - Data describing the action
     * @param {object} controller - Reference to the controller
     * @returns {sap.m.FlexBox} - FlexBox containing the dynamic input UI
     */
    async function renderDynamicInputUI(action, controller, qpId) {
        const oFlexBox = new FlexBox({
            alignItems: "Center",
            justifyContent: "Start"
        }).addStyleClass("InputFlexBox");

        let oDynamicUI = null;
        if (action?.inputMetadata?.items?.length > 0) {
            switch (action?.uiTypeInput) {
                case 'FORM':
                    oDynamicUI = await renderForm(action, controller, qpId);
                    break;
            }
        }
        if (oDynamicUI) {
            oFlexBox.addItem(oDynamicUI);
        }
        return oFlexBox;
    }

    /**
     * Render the dynamic Output UI based on the action
     * @param {Array} items - Array of items describing the output UI
     * @param {Array} results - Results data for each item
     * @param {object} controller - Reference to the controller
     * @returns {sap.m.FlexBox} - FlexBox containing the dynamic output UI
     */
    function renderDynamicOutputUI(outputMetadata, items, results, controller) {
        const oFlexBox = new FlexBox({
            justifyContent: "Start",
            direction: "Column"
        }).addStyleClass("InputFlexBox");

        items.forEach((item, index) => {
            const metadata = item?.metadata ? JSON.parse(item.metadata) : {};
            let data = results[index]?.data ? typeof results[index]?.data === 'string' ? JSON.parse(results[index]?.data) : results[index]?.data : {};
            let oDynamicUI = null;
            switch (item?.uiType) {
                case 'TITLE':
                    oDynamicUI = renderTitle(metadata, data);
                    break;
                case 'TABLE':
                    if (data.length > 0) {
                        oDynamicUI = renderTable(metadata, data, controller);
                    }
                    break;
                case 'LIST':
                    if (data.length > 0) {
                        oDynamicUI = renderList(outputMetadata, metadata, data, controller);
                    }
                    break;
                case 'CHART':
                    if (data.length > 0) {
                        oDynamicUI = renderChart(outputMetadata, metadata, data);
                    }
                    break;
                case 'ILLUSTRATED':
                    oDynamicUI = renderIllustratedMessage(metadata, data);
                    break;
                case 'MESSAGESTRIP':
                    if (data) {
                        oDynamicUI = renderMessageStrip(data);
                    }
                    break;
                case 'SUGGESTION':
                    if (data.length > 0) {
                        oDynamicUI = renderSuggestion(data, controller);
                    }
                    break;
                case 'CARD':
                    if (data) {
                        oDynamicUI = renderCard(data, controller);
                    }
                    break;
            }
            if (oDynamicUI) {
                oDynamicUI.addStyleClass("sapUiSmallMarginTop");
                oFlexBox.addItem(oDynamicUI);
            }
        });
        return oFlexBox;
    }

    /**
     * Render a Bot chat message
     * @param {string} message - Message to render
     * @returns {sap.m.FlexBox} - FlexBox containing the Bot chat message
     */
    function renderBotChat(message, controller, chatResponseID, userMessage, reference = null) {
        const oFlexBox = new FlexBox({
            direction: "Column",
            justifyContent: "Start"
        }).addStyleClass("agentBox");

        const oFormattedText = new FormattedText({
            htmlText: message
        }).addStyleClass("agentMessage");

        oFlexBox.addItem(oFormattedText);
        oFlexBox.addItem(renderEmotionIcon());
        oFlexBox.addItem(renderMessageEmotions(controller, chatResponseID, userMessage));
        oFlexBox.addItem(renderFeedback(controller, chatResponseID, userMessage));
        if (Array.isArray(reference) && reference?.length > 0) {
            let data = {
                reference: reference
            };
            const oCard = renderCard(data, controller);
            oFlexBox.addItem(oCard);
        }
        return oFlexBox;
    }

    /**
     * @returns  {sap.m.FlexBox} - FlexBox containing the emotion Icon
     */
    function renderEmotionIcon() {
        const oFlexBox = new FlexBox({
            visible: true
        }).addStyleClass("agreeDisagreeBox");
        oFlexBox.addItem(new sap.ui.core.Icon({
            src: "sap-icon://thumb-up",
            visible: false
        }).addStyleClass("agreeDisagreeIcon"));
        return oFlexBox;
    }

    /**
     * 
     * @param {object} controller 
     * @param {UUID} chatResponseID
     * @param {String} userMessage
     * @returns  {sap.m.FlexBox} - FlexBox containing the agent emotions
     */

    function renderMessageEmotions(controller, chatResponseID, userMessage) {
        const oFlexBox = new FlexBox({
            visible: true
        }).addStyleClass("messageEmotions");
        //Add Copy Button
        oFlexBox.addItem(new Button({
            icon: "sap-icon://copy",
            type: "Transparent",
            press: function (oEvent) {
                controller.onChatAction(oEvent)
            },
            tooltip: "Copy"
        }).addCustomData(new CustomData({ key: "target", value: "onCopy" }))
            .addCustomData(new CustomData({ key: "ID", value: chatResponseID })));
        //Add Regenrate Button
        oFlexBox.addItem(new Button({
            icon: "sap-icon://synchronize",
            type: "Transparent",
            press: function (oEvent) {
                controller.onChatAction(oEvent)
            },
            tooltip: "Regenerate"
        }).addCustomData(new CustomData({ key: "target", value: "onRegenerate" }))
            .addCustomData(new CustomData({ key: "ID", value: chatResponseID }))
            .addCustomData(new CustomData({ key: "userMessage", value: userMessage })));
        let oHBox = new FlexBox();
        //Add Agree Button
        oHBox.addItem(new Button({
            icon: "sap-icon://thumb-up",
            type: "Transparent",
            press: function (oEvent) {
                controller.onChatAction(oEvent)
            },
            tooltip: "Agree"
        }).addCustomData(new CustomData({ key: "target", value: "onAgree" }))
            .addCustomData(new CustomData({ key: "ID", value: chatResponseID })));
        //Add Disagree Button
        oHBox.addItem(new Button({
            icon: "sap-icon://thumb-down",
            type: "Transparent",
            press: function (oEvent) {
                controller.onChatAction(oEvent)
            },
            tooltip: "Disagree"
        }).addCustomData(new CustomData({ key: "target", value: "onDisagree" }))
            .addCustomData(new CustomData({ key: "ID", value: chatResponseID })));
        oFlexBox.addItem(oHBox);
        return oFlexBox;
    }

    /**
     * 
     * @param {object} controller 
     * @param {UUID} chatResponseID
     * @param {String} userMessage
     * @returns  {sap.m.FlexBox} - FlexBox containing the agent emotions
     */

    function renderFeedback(controller, chatResponseID, userMessage) {
        const oFlexBox = new FlexBox({
            direction: "Column",
            justifyContent: "Start",
        }).addStyleClass("feedbackBox")
            .addCustomData(new CustomData({ key: "ID", value: chatResponseID }))
            .addCustomData(new CustomData({ key: "target", value: "" }));
        //Add TextArea
        oFlexBox.addItem(new TextArea({
            placeholder: "Please provide further details for us to improve",
        }));
        //Add Regenrate Button
        oFlexBox.addItem(new Button({
            text: "Submit",
            press: function (oEvent) {
                controller.onChatAction(oEvent)
            },
            tooltip: "Submit"
        }).addCustomData(new CustomData({ key: "target", value: "onFeedbackSubmit" }))
            .addStyleClass("submitFeedbackBtn"));
        return oFlexBox;
    }

    /**
     * Add a Bot chat message
     * @param {string} message 
     * @returns {object} FlexBox UI
     */
    function renderUserChat(message) {
        // Create a new FlexBox container for the message
        let oFlexBox = new FlexBox({
            alignItems: "Center",
            justifyContent: "End"
        }).addStyleClass("userBox");

        // Create a new FormattedText element for the message content
        let oFormattedText = new FormattedText({
            htmlText: message
        }).addStyleClass("userMessage");

        // Add the FormattedText to the FlexBox container
        oFlexBox.addItem(oFormattedText);

        return oFlexBox;
    }

    /**
     * Render Dynamic Form which can support
     * Input checkbox and text area
     * @param {string} action 
     * @param {object} controller reference
     * @returns {object} Form UI
     */
    async function renderForm(action, controller, qpId) {
        //Form UI
        const elements = action?.inputMetadata?.items;

        // Create a SimpleForm
        let oForm = new SimpleForm({
            title: action?.inputMetadata?.headerTitle,
            editable: true,
            layout: "ResponsiveGridLayout",
            labelSpanXL: 3,
            labelSpanL: 3,
            labelSpanM: 3,
            labelSpanS: 12,
            adjustLabelSpan: false,
            emptySpanXL: 4,
            emptySpanL: 4,
            emptySpanM: 4,
            emptySpanS: 0,
            columnsXL: 1,
            columnsL: 1,
            columnsM: 1,
            singleContainerFullSize: true
        }).addStyleClass("form");

        // Create an object to store the form fields and their dependencies
        let fieldMap = {};

        for (const element of elements) {
            switch (element?.uiType) {
                case 'INPUT':
                    oForm.addContent(renderLabel(element));
                    oForm.addContent(renderInput(element));
                    break;
                case 'CHECKBOX':
                    oForm.addContent(renderLabel(element));
                    oForm.addContent(renderCheckBox(element));
                    break;
                case 'SELECT':
                    oForm.addContent(renderLabel(element));
                    let oSelect = await renderSelect(element, controller);
                    // Initially disable dependent fields
                    if (element?.dependants?.length > 0 && !(element?.value)) {
                        oSelect.setEnabled(false);  // Disable fields like taskName and userName
                    }
                    // Store the form element in the field map
                    fieldMap[element.fieldName] = oSelect;

                    // Attach change event to handle filtering of dependent fields
                    oSelect.attachChange(function (oEvent) {

                        const selectedValue = oEvent.getSource().getSelectedKey();
                        const fieldName = element.fieldName;

                        // Enable and update all dependent fields based on the selected projectName
                        updateDependentFields(fieldName, selectedValue, elements, fieldMap);
                    });

                    oForm.addContent(oSelect);

                    break;
            }
        }

        // After rendering all fields, initialize dependent fields if any parent fields have a value
        await initializeDependentFields(elements, fieldMap);
        oForm.addContent(renderFormButton(controller, action, qpId));
        // create a CustomData template for response field name
        const oDataTemplate = new CustomData({ key: "actionID", value: action?.ID });
        // add the CustomData template 
        oForm.addCustomData(oDataTemplate);
        return oForm;
    }

    // Function to handle initialization of dependent fields after all fields are rendered
    async function initializeDependentFields(elements, fieldMap) {
        for (const element of elements) {
            // If the field has a value, handle its dependents (e.g., projectName -> taskName, userName)
            if (element?.value && element?.uiType == 'SELECT') {
                const parentField = fieldMap[element.fieldName];
                const selectedItem = parentField.getItems().find(item => item.getText() === element.value);

                if (selectedItem) {
                    const selectedKey = selectedItem.getKey();

                    // Now only update dependent fields based on the value of the parent field
                    for (const childElement of elements) {
                        if (!childElement.value) {

                            const dependant = childElement.dependants?.find(dep => dep.parameter === element.fieldName);

                            if (dependant) {
                                const dependentField = fieldMap[childElement.fieldName];
                                dependentField.setEnabled(false); // Disable until loading completes

                                // Fetch and update the dependent field's items
                                const filteredItems = await fetchFilteredItems(selectedKey, dependant.filterKey, childElement);
                                updateSelectItems(dependentField, filteredItems, childElement.itemKey, childElement.itemText);

                                dependentField.setEnabled(true); // Re-enable after items are loaded
                            }
                        }
                    }
                }
            }
        }
    }
    async function updateDependentFields(fieldName, selectedValue, elements, fieldMap) {
        // Show the busy indicator when updating dependent fields
        //     const oBusyIndicator = new sap.m.BusyIndicator({ size: "1rem" });
        const oForm = fieldMap[fieldName].getParent();  // Assuming the field is in the form
        // oForm.addContent(oBusyIndicator);

        // Iterate over each element to check for dependencies
        for (const element of elements) {
            const dependant = element.dependants.find(dependant => dependant.parameter === fieldName);

            if (dependant) {

                const dependentField = fieldMap[element.fieldName];
                dependentField.setEnabled(false);

                // Fetch the filtered items based on the selected value
                const filteredItems = await fetchFilteredItems(selectedValue, dependant.filterKey, element);

                // Update the select dropdown with new items
                updateSelectItems(dependentField, filteredItems, element.itemKey, element.itemText);
                // Enable dependent fields once the dependant is selected  like projectName
                dependentField.setEnabled(true);
            }
        }
        // Hide the busy indicator once the update is complete
        // oForm.removeContent(oBusyIndicator);
    }

    async function fetchFilteredItems(selectedValue, filterKey, element) {
        try {
            // Checkmarx: This API is secured with HTTPS and HSTS on the server side.
            // Check if the valueHelpURL already contains a $filter
            const hasFilter = element.valueHelpURL.includes('$filter');

            // Append the filter with the correct delimiter
            const urlWithFilter = hasFilter
                ? `${element.valueHelpURL} and ${filterKey} eq ${selectedValue}` // Use & if $filter exists
                : `${element.valueHelpURL}?$filter=${filterKey} eq ${selectedValue}`; // Use ? if $filter does not exist

            // Make the fetch call
            const response = await fetch(urlWithFilter, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // Checkmarx: This is to enforce HTTPS on the API response.
            if (!response.url.startsWith('https://')) {
                throw new Error('Insecure API response detected');
            }
            if (!response.ok) {
                throw new Error(`Failed to fetch data for ${element.fieldName}`);
            }
            const data = await response.json();
            return data?.value || [];
        } catch (error) {
            console.error(`Error fetching data for ${element.fieldName}:`, error);
            return [];
        }
    }

    function getUniquValues(array, property) {
        const uniqueArray = array.filter((item, index, self) =>
            index === self.findIndex((t) => t[property] === item[property])
        );
        return uniqueArray;
    }

    function updateSelectItems(selectElement, itemsData, keyField, textField) {
        selectElement.removeAllItems();  // Clear existing items
        itemsData = itemsData.length > 0 ? getUniquValues(itemsData, keyField) : itemsData;
        itemsData.forEach(item => {
            const oItem = new Item({
                key: item[keyField],
                text: item[textField]
            });
            selectElement.addItem(oItem);
        });
        selectElement.setVisible(itemsData.length > 0);  // Set visibility based on items length
    }

    async function renderSelect(element, controller) {
        let aItems = [];
        let aItemsData;

        // Function to fetch data from the API
        async function fetchSelectItems(element) {
            try {
                const response = await fetch(`${element?.valueHelpURL}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch task data');
                }
                const data = await response.json();
                return data?.value;  // Return the array of task items
            } catch (error) {
                console.error('Error fetching task data:', error);
                return [];
            }
        }

        // Main logic for rendering the select element
        try {
            // Fetch task data using the access token
            if (element.dependants?.length == 0 || element.value) {
                aItemsData = await fetchSelectItems(element);
            } else {
                aItemsData = [];
            }
            aItemsData = aItemsData.length > 0 ? getUniquValues(aItemsData, element?.itemKey) : aItemsData;
            // Populate the select items
            if (Array.isArray(aItemsData)) {
                aItemsData.forEach(function (item) {
                    const oItem = new Item({
                        key: item[element?.itemKey],
                        text: item[element?.itemText]
                    });
                    aItems.push(oItem);
                });
            }

            // Find the key corresponding to the value (text)
            const selectedItem = aItems.find(item => item.getText() === element.value);

            // Create the Select element
            let oSelect = new Select({
                selectedKey: selectedItem ? selectedItem.getKey() : "", // Set the key matching the text
                visible: true,
                items: aItems ? aItems : [],
                enabled: element.dependants.length === 0 || !!element.value // Disable dependent fields initially
            });
            // create a CustomData template for response field name
            oSelect.data("fieldName", element?.fieldName);
            return oSelect;
        } catch (error) {
            console.error('Error in renderSelect:', error);
            return null;
        }
    }

    /**
     * Render Dynamic Title
     * @param {object} element properties 
     * @returns {object} Title UI
     */
    function renderTitle(element, data) {
        let text = "";
        if (element?.property && data[element?.property]) {
            text = data[element.property];
        } else if (element?.default) {
            text = element.default;
        }

        // Create the title element
        let oTitle = new Title({
            text: text
        }).addStyleClass("title");

        return oTitle;
    }

    /**
     * Render Dynamic Table
     * @param {object} element - Properties of the table
     * @param {object} data - Data for the table
     * @param {object} controller - Reference to the controller
     * @returns {sap.m.Table} - Table UI
     */
    function renderTable(element, data, controller) {
        // Set up the model
        const oModel = new JSONModel(data);

        // Create the table control
        const oTable = new Table({
            alternateRowColors: true,
            fixedLayout: false,
            growing: true, // Enable growing feature
            growingThreshold: 10, // Number of rows to display initially and incrementally    
            items: {
                path: "/",
                template: new sap.m.ColumnListItem({
                    cells: element.columns.map(column => {
                        let cellTemplate;
                        switch (column.uiType) {
                            case "BUTTON":
                                cellTemplate = new Button({
                                    text: column.label,
                                    type: 'Emphasized',
                                    visible: `{${column.enableProperty}}`,
                                    press: function (oEvent) {
                                        triggerTableAction(oEvent, controller);
                                    }
                                });
                                break;
                            case "LINK":
                                cellTemplate = new Link({
                                    text: column.label,
                                    target: "_blank",
                                    href: `{${column.uiProperty}}`
                                });
                                break;
                            case "INFO":
                                cellTemplate = new sap.ui.core.Icon({
                                    src: "sap-icon://information",
                                    color: "#0070F2",
                                    press: function (oEvent) {
                                        triggerTableInfo(oEvent, controller, 'INFO');
                                    }
                                });
                                break;
                            default:
                                cellTemplate = new Text({ text: `{${column.uiProperty}}` });
                        }
                        cellTemplate.data("prompt", column.utterance);
                        return cellTemplate;
                    })
                })
            }
        }).addStyleClass("table");

        // Set the model to the table
        oTable.setModel(oModel);

        // Create columns
        element.columns.forEach(column => {
            let columnWidth = 'auto';
            let columnHeader = '';
            switch (column.uiType) {
                case "BUTTON":
                case "LINK":
                    columnWidth = '5rem';
                    break;
                case "INFO":
                    columnWidth = '2rem';
                    break;
                default:
                    columnHeader = column.label;
                    break;
            }
            oTable.addColumn(new sap.m.Column({
                header: new Text({ text: columnHeader }).addStyleClass('tableColumnHeader'),
                width: columnWidth
            }));
        });

        // Add header table actions
        const headerToolbar = new sap.m.OverflowToolbar();
        headerToolbar.addContent(new sap.m.Title({ text: element?.title }));
        headerToolbar.addContent(new sap.m.ToolbarSpacer());
        if (element?.actions && element?.actions?.length > 0) {
            element.actions.forEach(action => {
                const actionButton = new Button({
                    text: action.label,
                    type: 'Emphasized',
                    press: function () {
                        controller.handleActionUtterance({ sPrompt: action.utterance });
                    }
                });
                headerToolbar.addContent(actionButton);
            });
        }
        //Add download button
        if (data && data?.length > 0) {
            const downloadButton = new Button({
                text: 'Download',
                type: 'Emphasized',
                press: function (oEvent) {
                    handleTableDownload(oEvent, controller, oTable, element?.columns, data);
                }
            });
            headerToolbar.addContent(downloadButton);
        }

        oTable.setHeaderToolbar(headerToolbar);
        return oTable;
    }

    /**
     * 
     * @param {object} oEvent 
     * @param {object} controller
     */
    async function handleTableDownload(oEvent, controller, oTable, columns, data) {
        let aCols = [];
        columns.forEach(col => {
            if (col?.uiType == "TEXT") {
                aCols.push({
                    label: col?.label,
                    property: col?.uiProperty,
                    type: EdmType.String
                });
            }
        });
        const oRowBinding = oTable.getBinding('items');
        const oSettings = {
            workbook: {
                columns: aCols
            },
            dataSource: oRowBinding,
            fileName: 'Table export.xlsx'
        };

        let oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
            oSheet.destroy();
        });
    }

    /**
     * 
     * @param {object} oEvent 
     * @param {object} controller
     */
    function triggerTableAction(oEvent, controller) {
        const oSource = oEvent.getSource();
        const selectedItem = oSource.getParent().getBindingContext().getObject();
        const sPrompt = oSource.data('prompt');
        const sInput = `${sPrompt} "${selectedItem?.resultMessage}"`;
        controller.handleActionUtterance({ sPrompt: sInput, actionId: selectedItem?.action_ID, resultMessage: selectedItem?.resultMessage });
    }

    /**
     * 
     * @param {object} oEvent 
     * @param {object} controller
     * @param {string} outputType
     */
    function triggerTableInfo(oEvent, controller, outputType = null) {
        const oSource = oEvent.getSource();
        const selectedItem = oSource.getParent().getBindingContext().getObject();
        const sPrompt = oSource.data('prompt');
        const sInput = `${sPrompt} "${selectedItem.resultMessage}"`;
        controller.handleActionUtterance({ sPrompt: sInput, outputType: outputType });
    }


    /**
     * Render Dynamic List
     * @param {string} headerTitle - List Title
     * @param {object} element - Properties of the list
     * @param {object} data - Data for the list
     * @param {object} controller - Reference to the controller
     * @returns {sap.m.List} - List UI
     */
    function renderList(outputMetadata, element, data, controller) {

        // Set up the model
        const oModel = new JSONModel(data);

        // Create CustomListItem template dynamically based on metadata
        const oVBox1 = new FlexBox({
            direction: "Column",
            items: [
                element.title ? new Text({ text: "{" + element.title + "}" }).addStyleClass("listTitle") : null,
                element.subtitle ? new Text({ text: "{" + element.subtitle + "}" }).addStyleClass("font07") : null,
                element.description ? new Text({ text: "{" + element.description + "}" }).addStyleClass("listDesc") : null
            ]
        }).addStyleClass('listItemVBox1');


        const oObjStatus = new sap.m.ObjectStatus({
            text: "{info/text}",
            state: "{info/status}"
        });

        // Create FlexBox for actions dynamically
        const oVBox2 = new FlexBox({
            direction: "Column",
            justifyContent: "SpaceBetween",
            alignItems: "End",
            items: [
                oObjStatus,
            ]
        }).addStyleClass('listStatus');

        if (element?.action) {
            // Create the template for each action button
            const actionButtonTemplate = new Button({
                text: "{label}",
                press: function (oEvent) {
                    onListAction(oEvent, element, controller);
                }
            });

            const oActionBox = new sap.m.FlexBox({
                direction: "Column",
                justifyContent: "Center",
                alignItems: "Center",
                visible: "{= %{action}.length === 1 }",
                items: {
                    path: "action",
                    template: actionButtonTemplate
                }
            });

            //    Create the template for the action menu button
            const actionMenuButtonTemplate = new sap.m.MenuButton({
                icon: "sap-icon://overflow",
                visible: "{= %{action}.length > 1 }",
                menu: new sap.m.Menu({
                    items: {
                        path: "action",
                        template: new sap.m.MenuItem({
                            text: "{label}",
                            press: function (oEvent) {
                                onListAction(oEvent, element, controller);
                            }
                        })
                    }
                })
            });

            oVBox2.addItem(oActionBox);
            oVBox2.addItem(actionMenuButtonTemplate);
        }
        // Create CustomListItem template dynamically based on metadata
        const oItemsTemplate = new sap.m.CustomListItem({
            content: [
                new FlexBox({
                    items: [
                        oVBox1,
                        oVBox2
                    ]
                }).addStyleClass('listItem')
            ],
            type: "{= %{isDetail} ? 'Active' : 'Inactive'}",
            press: function (oEvent) {
                const oObject = oEvent?.getSource()?.getBindingContext()?.getObject();
                controller.handleActionUtterance({
                    sPrompt: oObject?.utterance, actionId: oObject?.actionID, isAdditionalInfo: oObject?.isAdditionalInfo,
                    detailInfo: oObject?.detailInfo, reference: oObject?.reference, tags : oObject?.tags
                });

            }
        });


        // Create the List control
        const oList = new List({
            items: {
                path: "/",
                template: oItemsTemplate
            }
        });

        // Create a new FlexBox for Header
        let oHeaderBox = new FlexBox({
            direction: "Column",
            wrap: "Wrap",
            width: "100%"
        }).addStyleClass("listHeaderBox");


        // Add the FormattedText to the FlexBox container
        if (outputMetadata?.headerTitle) {
            oHeaderBox.addItem(new Title({
                text: outputMetadata?.headerTitle,
                wrapping: true
            }).addStyleClass("listMTitleWrap"));
        }

        if (outputMetadata?.subTitle) {
            oHeaderBox.addItem(new Text({
                text: outputMetadata?.subTitle,
                wrapping: true,
                width: "100%"
            }).addStyleClass("listMTextWrap"));
        }

        if (outputMetadata?.desc) {
            oHeaderBox.addItem(new Text({
                text: outputMetadata?.desc,
                wrapping: true,
                width: "100%"
            }).addStyleClass("listMTextWrap"));
        }

        const headerToolbar = new sap.m.OverflowToolbar();
        headerToolbar.addContent(oHeaderBox);
        oList.setHeaderToolbar(headerToolbar);

        // Set the model for the list
        oList.setModel(oModel);
        oList.addStyleClass("list");

        const oToolbar = new sap.m.Toolbar();

        oToolbar.addContent(new sap.m.ObjectStatus({
            text: "{info/text}",
            state: "{info/status}"
        }));

        oToolbar.addContent(new Button({
            icon: "sap-icon://decline",
            press: function (oEvent) {
                closeListDetail(oEvent);
            }
        }));

        // Create a Contents
        const oContents = new FlexBox({
            direction: "Column",
            items: {
                path: "content", // Bind the items aggregation to the 'contents' array
                template: new FlexBox({
                    direction: "Column",
                    items: [
                        new Text({
                            text: "{title}"
                        }).addStyleClass("listObjContentContentTitle"),
                        new FormattedText({
                            htmlText: "{text}"
                        })
                    ]
                })
            }
        });

        // Create Links
        const oLinks = new FlexBox({
            direction: "Column",
            items: {
                path: "link",
                template: new FlexBox({
                    direction: "Column",
                    items: [
                        new Link({
                            text: "{text}",
                            press: (oEvent) => {
                                const surl = oEvent?.getSource().getBindingContext().getObject()?.url;
                                const newWindow = window.open();
                                newWindow.opener = null;
                                newWindow.location = surl;
                            }
                        }).addStyleClass("sapUiTinyMarginTop")
                    ]
                })
            }
        });

        const oLinkBox = new FlexBox({
            direction: 'Column',
            items: [
                new Text({
                    text: "Reference Links",
                    visible: {
                        parts: [{ path: "link" }],
                        formatter: function (aLinks) {
                            return aLinks ? true : false;
                        }
                    }
                }).addStyleClass("listObjContentContentTitle"),
                oLinks
            ]
        });

        // Create Actions
        const oActions = new FlexBox({
            direction: "Column",
            items: {
                path: "action",
                template: new FlexBox({
                    direction: "Column",
                    items: [
                        new Button({
                            text: "{label}",
                            type: "Transparent",
                            press: (oEvent) => {
                                onListDetailAction(oEvent, controller);
                            }
                        }).addStyleClass("sapUiTinyMarginTop")
                    ]
                })
            }
        }).addStyleClass("listObjContentActionBox");

        //Footer with action
        const oFooterBox = new FlexBox();

        if (outputMetadata?.footerAction) {
            oFooterBox.addItem(
                new Button({
                    text: outputMetadata?.footerAction?.label,
                    type: "Transparent",
                    press: () => {
                        onListFooterAction(outputMetadata?.footerAction, controller);
                    }
                }).addStyleClass("sapUiTinyMarginTop")
            )
        }


        const oCard = new sap.f.Card({
            header: new sap.f.cards.Header({
                title: "{" + element?.title + "}",
                toolbar: oToolbar
            }),
            visible: false,
            content: new FlexBox({
                direction: 'Column',
                items: [oContents, oLinkBox, oActions]
            }).addStyleClass("listObjContentBox")
        });

        oCard.setModel(oModel);

        const oListBox = new FlexBox({
            direction: 'Column',
            items: [oList, oFooterBox]
        }).addStyleClass("listBox");


        const oListObjBox = new FlexBox({
            items: [oListBox, oCard]
        }).addStyleClass("listObjBox");
        return oListObjBox;

    }

    /**
     * Show Detail card for list
     */
    function showListDetail(oEvent) {
        const oSource = oEvent?.getSource();
        const oList = oSource.getParent()?.getParent();
        oList.setVisible(false);
        const oListBox = oList?.getParent();
        const oContext = oSource?.getBindingContext();
        const oCard = oListBox?.getItems()?.[1];
        oCard.setBindingContext(oContext);
        oCard.addStyleClass("card");
        oCard.setVisible(true);
    }

    /**
     * Close Detail card for list
     */
    function closeListDetail(oEvent) {
        const oSource = oEvent?.getSource();
        const oCard = oSource.getParent()?.getParent()?.getParent();
        oCard.removeStyleClass("card");
        oCard.setVisible(false);
        const oListBox = oCard?.getParent();
        const oList = oListBox?.getItems()?.[0];
        oList.setVisible(true);
    }

    /**
    * Exectue List Footer Action
    */
    function onListFooterAction(footer, controller) {
        controller.handleActionUtterance(footer?.utterance, footer?.actionID, footer?.isAdditionalInfo);
    }

    /**
     * Exectue List Action
     */
    function onListAction(oEvent, element, controller) {
        const selectedItem = oEvent?.getSource()?.getBindingContext()?.getObject();
        const oParent = oEvent?.getSource()?.getParent()?.getBindingContext()?.getObject();
        const sQuery = `${selectedItem["utterance"]} "${oParent[element?.title]}"`;
        controller.handleActionUtterance({
            sPrompt: sQuery, actionId: selectedItem?.actionID, isAdditionalInfo: selectedItem?.isAdditionalInfo,
            qpUtterance: oParent?.utterance, inputData: selectedItem?.inputData, isTrigger: selectedItem?.isTrigger
        });
    }


    /**
     * Exectue List Detail Action
     */
    function onListDetailAction(oEvent, controller) {
        const selectedItem = oEvent?.getSource()?.getBindingContext()?.getObject();
        const oParent = oEvent?.getSource()?.getParent()?.getParent()?.getBindingContext()?.getObject();
        const sQuery = `${selectedItem["utterance"]} "${oParent?.title}"`;
        controller.handleActionUtterance({ sPrompt: sQuery, actionId: selectedItem?.actionID, isAdditionalInfo: selectedItem?.isAdditionalInfo });
    }


    /**
     * Render Dynamic Chart
     * @param {string} headerTitle - Chart Title
     * @param {object} element - Chart Properties
     * @param {object[]} data - Data for the Chart
     * @returns {sap.viz.ui5.controls.VizFrame} - Chart UI
     */
    function renderChart(outputMetadata, element, data) {
        // Set up the model
        const oModel = new sap.ui.model.json.JSONModel(data);

        // Define a color palette for legends
        const colorPalette = ['#0070F2', '#e76500', '#256F3A', '#FFC300', '#9C27B0', '#FF5722', '#607D8B', '#F44336'];

        // Preprocess data to extract unique status values
        const uniqueStatusValues = [...new Set(data.map(item => item.status))];

        // Assign colors to each status dynamically
        const statusColorMap = {};
        uniqueStatusValues.forEach((status, index) => {
            // Use color from the color palette or generate a distinct color
            statusColorMap[status] = colorPalette[index % colorPalette.length];
        });

        // Update vizProperties dynamically based on mapped colors
        const vizProperties = {
            legend: {
                visible: true, // Show legend
                title: {
                    visible: false
                },
                label: {
                    visible: true
                }
            },
            plotArea: {
                colorPalette: Object.values(statusColorMap), // Use colors from statusColorMap for consistency
                gridline: {
                    visible: false
                },
                dataLabel: {
                    visible: true,
                    style: {
                        fontWeight: 'bold'
                    }
                },
                dataPointStyleMode: "update",
                dataPointStyle: {
                    rules: uniqueStatusValues.map(status => ({
                        dataContext: { [element.dimensions?.label]: status },
                        properties: {
                            color: statusColorMap[status]
                        }
                    }))
                }
            },
            valueAxis: {
                title: {
                    visible: false
                },
                visible: false,
                axisLine: {
                    visible: false
                }
            },
            title: { text: outputMetadata?.headerTitle, visible: true },
            dataLabel: { visible: true, showTotal: false }
        };

        const chartType = element?.chartType;

        // Create VizFrame control
        const oVizFrame = new VizFrame({
            vizType: chartType,
            vizProperties: vizProperties,
            legendVisible: false,
            uiConfig: "{applicationSet:'fiori'}"
        });

        // Create FlattenedDataset and bind data
        const oDataset = new sap.viz.ui5.data.FlattenedDataset({
            dimensions: [{
                name: element.dimensions?.label,
                value: `{${element.dimensions?.property}}`
            }],
            measures: [{
                name: element.measures?.label,
                value: `{${element.measures?.property}}`
            }],
            data: {
                path: "/"
            }
        });
        oDataset.setModel(oModel);

        // Set dataset for VizFrame
        oVizFrame.setDataset(oDataset);

        // Create feeds for dimensions and measures
        const oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: chartType == 'donut' ? 'size' : 'valueAxis',
            type: 'Measure',
            values: [element.measures?.label]
        });
        const oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
            uid: chartType == 'donut' ? 'color' : 'categoryAxis',
            type: 'Dimension',
            values: [element.dimensions?.label]
        });
        oVizFrame.addFeed(oFeedValueAxis);
        oVizFrame.addFeed(oFeedCategoryAxis);
        oVizFrame.addStyleClass("chart");

        return oVizFrame;

    }

    /**
     * Render Dynamic Illustrated Message
     * @param {object} element - Properties of the Illustrated Message
     * @param {object} data - Data for the Illustrated Message
     * @returns {sap.f.Card} - Illustrated Message UI
     */
    function renderIllustratedMessage(element, data) {
        // Determine properties for the Illustrated Message based on metadata and data
        const type = data?.type || 'SimpleTask';
        const title = data?.title || '';
        const description = data?.description || '';
        const url = data?.url || '';

        // Create the Illustrated Message control
        const oIllustratedMessage = new sap.f.IllustratedMessage({
            illustrationType: `sapIllus-${type}`,
            title: title,
            description: description
        });

        // Create and add the action button to the Illustrated Message if buttonText is provided
        if (data?.buttonText) {
            const oActionButton = new sap.m.Button({
                text: data.buttonText,
                press: function () {
                    // Handle action button press event to open the URL
                    if (url) {
                        const newWindow = window.open();
                        newWindow.opener = null;
                        newWindow.location = url;
                    }
                }
            });
            oIllustratedMessage.addAggregation("additionalContent", oActionButton);
        }

        // Create a Card control and add the Illustrated Message to its content aggregation
        const oCard = new sap.f.Card({
            content: oIllustratedMessage
        }).addStyleClass("illustrated");

        return oCard;
    }

    /**
     * Render Dynamic Message Strip
     * @param {object} data - Data for the Message Strip
     * @returns {sap.m.MessageStrip} - Message Strip UI
     */
    function renderMessageStrip(data) {
        // Create Message Stripthe  control
        if (data?.text) {
            const oMessageStrip = new MessageStrip({
                type: data?.type || 'None',
                text: data?.text,
                showIcon: true
            });
            return oMessageStrip;
        }

    }

    /**
     * Render Suggestion bubbles
     * @param {object} data - Data for the Suggestions
     * @param {object} controller - Reference to the controller
     * @returns {sap.m.FlexBox} - Flex Box with bubble buttons
     */
    function renderSuggestion(data, controller) {
        //Flex box to hold suggestions
        const oFlexBox = new FlexBox({
            alignItems: "Center",
            justifyContent: "Start"
        }).addStyleClass("SuggestionFlexBox");

        //Add the buttons
        data.forEach(action => {
            const actionButton = new Button({
                text: action.text,
                press: function () {
                    controller.handleActionUtterance({ sPrompt: action.utterance });
                }
            }).addStyleClass("SuggestionButton");
            oFlexBox.addItem(actionButton);
        });
        return oFlexBox;
    }

    /**
     * Render Dynamic Card
     * @param {object} element - Properties of the Illustrated Message
     * @param {object} data - Data for the Illustrated Message
     * @returns {sap.f.Card} - Illustrated Message UI
     */
    function renderCard(data, controller) {
        //Contents of the card
        let contents = {};
        if (data?.contents && data?.contents?.length > 0) {
            contents = data.contents.map(content => {
                return new Panel({
                    headerText: content.title,
                    expandable: true,
                    content: [
                        new sap.m.Text({ text: content.text })
                    ]
                }).addStyleClass("panel");
            });
        }

        //Add reference links
        let reference = {};
        if (data?.reference && data?.reference?.length > 0) {
            reference = data.reference.map(ref => {
                return new Link({
                    text: ref.title,
                    target: "_blank",
                    href: ref.url
                }).addStyleClass("sapUiTinyMarginTop")
            });
        }

        //Add the footer actions
        let actions = {};
        if (data?.actions && data?.actions?.length > 0) {
            actions = data?.actions.map(action => {
                if (action.type === "BUTTON") {
                    return new Button({
                        text: action.label,
                        press: () => {
                            controller.handleActionUtterance({ sPrompt: action?.utterance });
                        }
                    }).addStyleClass("sapUiTinyMarginTop");
                } else if (action.type === "LINK") {
                    return new Link({
                        text: action.label,
                        press: () => {
                            const newWindow = window.open();
                            newWindow.opener = null;
                            newWindow.location = action.value;
                        }
                    }).addStyleClass("sapUiTinyMarginTop");
                }
            });
        }

        const contentBox = new FlexBox({
            direction: 'Column',
            items: contents
        });
        const referenceBox = new Panel({
            headerText: 'Reference Document',
            expandable: true,
            expanded: true,
            content: [
                new FlexBox({
                    direction: 'Column',
                    items: reference
                })
            ]
        }).addStyleClass("panel");

        const actionBox = new FlexBox({
            direction: 'Column', alignItems: "Center",
            justifyContent: "Start",
            items: actions
        }).addStyleClass("sapUiTinyMarginTopBottom");

        const oCard = new sap.f.Card({
            header: new sap.f.cards.Header({
                title: data.title,
                subtitle: data.subtitle
            }),
            content: new FlexBox({
                width: "100%",
                direction: 'Column',
                items: [contentBox, referenceBox, actionBox]
            }).addStyleClass("cardContentBox")
        }).addStyleClass("card");

        return oCard;
    }

    /**
     * Render Dynamic Input
     * @param {object} element - Properties of the input field
     * @returns {sap.m.Input} - Input UI
     */
    function renderInput(element) {
        const oInput = new Input({
            value: element?.value,
            required: element?.required
        });

        // create a CustomData template for response field name
        oInput.data("fieldName", element?.fieldName);
        oInput.data("datatype", element?.datatype_code);
        oInput.data("length", element?.length);

        return oInput;
    }

    /**
     * Render Dynamic Label
     * @param {object} element - Properties of the label
     * @returns {sap.m.Label} - Label UI
     */
    function renderLabel(element) {
        // Create the Label control with provided properties
        const oLabel = new Label({
            text: element?.label,
            required: element?.required
        });

        return oLabel;
    }


    /**
     * Render Dynamic Checkbox
     * @param {object} element properties 
     * @returns {object} Checkox UI
     */
    function renderCheckBox(element) {
        let oCheckBox = new CheckBox({
            selected: element?.value // Default checked state
        });

        // create a CustomData template for response field name
        oCheckBox.data("fieldName", element?.fieldName);
        return oCheckBox;
    }

    /**
     * Render Dynamic Form Actions
     * @param {object} controller reference
     * @param {object} action
     * @returns {object} Flexbox with Form action
     */
    function renderFormButton(controller, action, qpId) {
        const actionId = action?.ID;
        let oFlexBox = new FlexBox({
            alignItems: "Center",
            justifyContent: "SpaceAround"
        }).addStyleClass('sapUiSmallMarginTop');

        oFlexBox.addItem(new Button({
            text: "Submit",
            type: "Emphasized",
            press: function (oEvent) {
                triggerFormAction(oEvent, controller, actionId, qpId, 'SUBMIT');
            }
        }));

        oFlexBox.addItem(new Button({
            text: "Cancel",
            press: function (oEvent) {
                triggerFormAction(oEvent, controller, actionId, qpId, 'CANCEL');
            }
        }));
        return oFlexBox;
    }

    /**
     * Trigger Form Actions
     * Submit and Cancel
     * @param {object} oEvent
     * @param {object} controller reference
     * @param {String} action Id
     * @param {string} action 
     */
    function triggerFormAction(oEvent, controller, actionId, qpId, action) {
        const oForm = oEvent.getSource().getParent().getParent().getParent().getParent().getParent();
        switch (action) {
            case 'SUBMIT':
                triggerFormSubmit(oEvent, controller, actionId, qpId, oForm);
                break;
            case 'CANCEL':
                triggerFormCancel(oForm);
                break;
        }
    }

    function triggerFormCancel(oForm) {
        let oFormBox = oForm.getParent();
        oFormBox.getParent().removeItem(oFormBox);
    }

    function triggerFormSubmit(oEvent, controller, actionId, qpId, oForm) {
        let isValid = true;
        const aFormContents = oForm.getContent();

        //validate the ui elements
        aFormContents.forEach(content => {
            const oInput = checkInput(content);
            if (oInput.isInput) {
                const sValid = validator.validateUI(content, oInput.data);
                if (isValid) {
                    isValid = sValid;
                }
            }

        });
        if (isValid) {
            let aButtons = oEvent.getSource().getParent().getItems();
            triggerSubmitAction(controller, aButtons, aFormContents, actionId, qpId);
        }
    }

    function triggerSubmitAction(controller, aButtons, aFormContents, actionId, qpId) {
        let isTrigger = true
        let data = {};
        aFormContents.forEach(content => {
            const oInput = checkInput(content);
            if (oInput.isInput) {
                content.setEnabled(false);
                const oCustomData = content?.getCustomData();
                if (Array.isArray(oCustomData) &&
                    oCustomData.length > 0) {
                    let objKey = oCustomData[0]?.getValue();
                    data[objKey] = oInput.data;
                }
                //Check if the value is passed without selected data for selected values
                if (content instanceof Select) {
                    const aItems = content.getItems();
                    if (content.getItems()?.length <= 0) {
                        isTrigger = false;
                    }
                }
            }

        });
        //Disable the actions button
        aButtons.forEach(button => {
            button.setEnabled(false);
        });
        controller.triggerFormSubmit(JSON.stringify(data), actionId, qpId, isTrigger);
        console.log(JSON.stringify(data));
    }

    function checkInput(element) {
        let oInput = {
            isInput: false,
            data: ''
        }
        const aInputElement = [
            {
                element: Input,
                property: 'value'
            },
            {
                element: CheckBox,
                property: 'selected'
            },
            {
                element: TextArea,
                property: 'text'
            },
            {
                element: Select,
                property: 'selectedItem'
            }];
        aInputElement.forEach(ui => {
            if (element instanceof ui.element) {
                oInput.isInput = true;
                if (ui.element === Select) {
                    oInput.data = element.getSelectedItem().getText();
                } else {
                    oInput.data = element.getProperty(ui.property);
                }
                return;
            }
        })
        return oInput;

    }

    return {
        renderDynamicInputUI,
        renderDynamicOutputUI,
        renderBotChat,
        renderEmotionIcon,
        renderMessageEmotions,
        renderFeedback,
        renderUserChat,
        renderForm,
        initializeDependentFields,
        updateDependentFields,
        fetchFilteredItems,
        getUniquValues,
        updateSelectItems,
        renderSelect,
        renderTitle,
        renderTable,
        handleTableDownload,
        triggerTableAction,
        triggerTableInfo,
        renderList,
        showListDetail,
        closeListDetail,
        onListFooterAction,
        onListAction,
        onListDetailAction,
        renderChart,
        renderIllustratedMessage,
        renderMessageStrip,
        renderSuggestion,
        renderCard,
        renderInput,
        renderLabel,
        renderCheckBox,
        renderFormButton,
        triggerFormAction,
        triggerFormCancel,
        triggerFormSubmit,
        triggerSubmitAction,
        checkInput

    }
});