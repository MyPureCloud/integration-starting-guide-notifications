"use strict";
exports.__esModule = true;
exports.setAccessToken = exports.getAccessToken = exports.authvalidation = void 0;
var tslog_1 = require("tslog");
var AsyncLocalStorage = require("async_hooks").AsyncLocalStorage;
var log = new tslog_1.Logger({ name: "authorization", minLevel: process.env.DEBUG_LEVEL });
var accessTokenMap = new Map();
var asyncLocalStorage = new AsyncLocalStorage();
/*
   The authValidation code is a piece of express middleware that inspects the incoming request and checks to see if the user has a authenticated session id present on the cookies.  If no session id is present,
   the code will follow the OAUTH2 code authorization flow and direct the user to authenticate themselves with Genesys Cloud.  If the session is present in the cookie, we set the session id in the asyncLocalStorage.
   Later on when we want to retrieve the oauth token we use the session id to look up the oauth token for the user from he accessTokenMap.
*/
function authvalidation(request, response, next) {
    log.debug("Request method: " + request.method + ", URL: " + request.url);
    //if we don't have a session then redirect them to the login page
    var NO_SESSION_PRESENT = (request.cookies && !(request.cookies.session && accessTokenMap.get(request.cookies.session)) && request.url.indexOf("oauth") == -1);
    if (NO_SESSION_PRESENT) {
        //redirect the user to authorize with Genesys Cloud
        var redirectUri = "https://login.mypurecloud.com/oauth/authorize?response_type=code&client_id=" + process.env.GENESYS_CLIENT_ID + "&http://localhost:3010/oauth2/callback";
        response.redirect(redirectUri);
        return;
    }
    //if we do have a session, just pass along to the next http handler
    log.debug("Session has been retrieved and is being stored in local storage");
    asyncLocalStorage.run(new Map(), function () {
        asyncLocalStorage.getStore().set("requestSessionId", request.cookies.session);
        next();
    });
}
exports.authvalidation = authvalidation;
/*
   Retrieves the oauth token by first retrieving the user's session id from async local storage.
   It then uses that session id to retrieve the access token from via the passed in session id.
*/
function getAccessToken() {
    var sessionId = asyncLocalStorage.getStore().get("requestSessionId");
    return accessTokenMap.get(sessionId);
}
exports.getAccessToken = getAccessToken;
/*
  Set the access based on the session id passed in.
*/
function setAccessToken(sessionId, sessionValue) {
    return accessTokenMap.set(sessionId, sessionValue);
}
exports.setAccessToken = setAccessToken;
