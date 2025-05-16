'use strict';
sap.ui.define( [], function() {
    const APIEVENT = {
        GET: "GET",
        POST: "POST",
    };

    const actor = {
        user:'user',
        bot:'bot'
    };

    return{
    APIEVENT,
    actor
    };
});