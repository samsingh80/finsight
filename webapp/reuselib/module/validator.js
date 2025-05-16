sap.ui.define([
    "sap/ui/core/ValueState",
    "sap/m/Input"
], function (
    ValueState,
    Input
) {
    "use strict";

    function validateUI(oControl, sValue) {
        let isValid = true;
        isValid = validateMandatory(oControl, sValue);
        if (isValid && oControl instanceof Input) {
            isValid =  validateData(oControl, sValue);
            if(isValid){
                isValid = validateLength(oControl, sValue);
            }
        }
        return isValid;
    }

    function validateMandatory(oControl, sValue) {
        let isValid = true;
        if (oControl?.mProperties['required']) { //To be Fixed: Redundant validateUiwith line 5
            const getReq = oControl.getProperty('required');
            if (getReq) {
                if (!sValue || sValue === "") {
                    setValueState(
                        oControl,
                        ValueState.Error,
                        "Please fill this mandatory field!");
                    isValid = false;
                }
                else {
                    clearValueState(oControl);
                }
            }
        }
        return isValid;
    }

    function validateData(oControl, sValue) {
        let isValid = true;
        const dataType = oControl?.data('datatype');
        // Regular expression for numeric values
        const numericPattern = /^\d+$/;
        if (dataType == 'INTEGER' && !sValue.match(numericPattern)) {
            setValueState(
                oControl,
                ValueState.Error,
                "Input value should be numeric");
            isValid = false;
        } else {
            clearValueState(oControl);
        }
        return isValid;
    }

    function validateLength(oControl, sValue) {
        let isValid = true;
        const iMaxLength = oControl?.data('length');
        // Regular expression for numeric values
        const numericPattern = /^\d+$/;
        if (iMaxLength && sValue.length > iMaxLength) {
            setValueState(
                oControl,
                ValueState.Error,
                `Input value should be a maximum length of ${iMaxLength}.`);
            isValid = false;
        } else {
            clearValueState(oControl);
        }
        return isValid;
    }    

    function setValueState(oControl, eValueState, sText) {
        oControl.setValueState(eValueState);
        oControl.setValueStateText(sText);
    }

    function clearValueState(oControl) {
        oControl.setValueState(ValueState.None);
    };

    return {
        validateUI,
        validateMandatory,
        validateData,
        validateLength,
        setValueState
    }
});