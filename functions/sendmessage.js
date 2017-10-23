/**
 * Copyright 2017 Ryoya Kawai
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

const SendMessage = function() {
    this.fuctions = null;
    this.admin = null;
    this.payload = null;
};

SendMessage.prototype = {
    init: function() {
        this.functions = require('firebase-functions');
        this.admin = require('firebase-admin');
        this.admin.initializeApp(this.functions.config().firebase);
    },
    setPayload:function(title, body, icon, click_action){
        if(icon == null) {
            icon = './google_assistant_logo.png';
        }        
        if(click_action == null) {
            click_action = 'https://localhost:5000/index.html';
        }
        
        this.payload = {
            notification: {
                title: title,
                body: body,
                icon: icon,
                click_action: click_action
            }
        };
    },
    sendNotifications: function() {
        console.log(this.payload);
        this.admin.database().ref('fcmTokens').once('value').then( allTokens => {
            if(allTokens.val()) {
                // Listening all tokens.
                const tokens = Object.keys(allTokens.val());
                console.log('[tokens]', tokens);

                // Send notifications to all tokens.
                return this.admin.messaging().sendToDevice(tokens, this.payload).then( response => {
                    // For each message check if there was an error.
                    const tokensToRemove = [];
                    response.results.forEach((result, index) => {
                        const error = result.error;
                        if(error) {
                            console.error('Failure sending notification to', tokens[index], error);
                            // Cleanup the tokens who are not registered anymore.
                            if (error.code === 'messaging/invalid-registration-token' ||
                                error.code === 'messaging/registration-token-not-registered') {
                                tokensToRemove.push(allTokens.ref.child(tokens[index]).remove());
                            }
                        }
                    });
                    return Promise.all(tokensToRemove);
                });
            }
        });
    }
};

module.exports = new SendMessage();
