'use strict';
sap.ui.define( [], function() {
    const CVI = {
        statusQues: "cvi sync status",
        statusTopic: "S4HANA Conversion",
        taxUpdateQues:"Update tax category with above values",
        taxtUpadteTopic:""
    };

    const SI = {
        statusQues: "Simplification Item Status",
        statusTopic: "S4HANA Conversion"
    };    
    const s4Topic = "S4HANA Conversion";
    const APIEVENT = {
        GET: "GET",
        POST: "POST",
    };

    const actor = {
        user:'user',
        bot:'bot'
    };

    const chatError = "Oops! It seems like something went wrong on our end.Please try again later."

    return{
    CVI,
    APIEVENT,
    SI,
    s4Topic,
    actor,
    chatError
    };
});