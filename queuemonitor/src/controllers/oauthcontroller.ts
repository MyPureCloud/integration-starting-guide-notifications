import { Request, Response } from 'express';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import { setAccessToken } from '../middleware/authorization';

const axios = require('axios').default;

const log = new Logger({ name: "oauthcontroller", minLevel: process.env.DEBUG_LEVEL as any });


/* 
   The callback function is called by Genesys Cloud after it has authenticated the user and passes back to this function an auth code for the user.  Once this controller gets called,
   it will call back to Genesys Cloud to validate the auth code and if the auth code is valid, the Genesys Cloud will return an OAuth token.  A session id is generated for the user and the access token
   is stored in asyncLocalStorage and a session id is stored on the user's cookie.

   The last part of this code will redirect the user to a static page indicating they are authenticated.
*/
export async function callback(request: Request, response: Response) {
  //the authorization page has called this callback and now we need to get the bearer token
  log.debug("Entering the OAuth callback")
  const authCode = request.query.code as string;
  const tokenUri = `https://login.mypurecloud.com/oauth/token?grant_type=authorization_code&code=${encodeURIComponent(authCode)}&redirect_uri=${encodeURIComponent("http://localhost:3010/oauth2/callback")}`;

  //post back to /oauth/token with the client id and secret as well as the auth code that was sent to us.
  try {
    const result = await axios.post(tokenUri, {}, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' }, auth: { username: process.env.GENESYS_CLIENT_ID, password: process.env.GENESYS_CLIENT_SECRET } });
    const accessToken = result.data.access_token;

    const sessionId = uuidv4();
    setAccessToken(sessionId, accessToken);

    //send the session id back as a cookie
    response.cookie('session', sessionId);

    //TODO NEED TO EVENTUALLY POST THIS BACK TO THE CALLING APP
    response.redirect("/static/my_info.html");
  }
  catch (e) {
    log.error(`Unable to authenticate token.`, e);
  }
};