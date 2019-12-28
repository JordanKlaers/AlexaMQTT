'use strict';
var mqtt = require('mqtt');

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    const cardTitle = 'Welcome';
    const speechOutput = "What lights do you want to change?"
    const repromptText = "whats good foo?";
    const shouldEndSession = false;

    callback({},
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Alexa Skills Kit sample. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createLightBulbAttributes(lightBulb) {
    return {
        lightBulb: lightBulb
    };
}

/**
 * Control Light Bulb in the session and prepares the speech to reply to the user.
 */
function controlLightBulbInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const colorRequest = intent.slots.color.value;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';

    if (colorRequest) {
		console.log("hey there was a color -> ", colorRequest);
        
		//Update 
		var mqttpromise = new Promise( function(resolve,reject){
            console.log("attempting to connect");
            
			var client = mqtt.connect('mqtt://10.0.0.131:1883');
			
			client.on('connect', function() { // When connected
                // publish a message to any mqtt topic
                let color = '';
                colorRequest == 'red' ? color = '0,1024,1024,1' :
                colorRequest == 'green' ? color = '1024,0,1024,1' :
                colorRequest == 'blue' ? color = '1024,1024,0,1' :
                    color = '1024,1024,1024,1';

				client.publish("colorPattern/start", "0");
             
                client.publish("colorPattern", color);
                client.publish("colorPattern/end", "0");
				client.end()
				resolve('Done Sending');
			});
			
		});
		mqttpromise.then(
			function(data) {
				console.log('Function called succesfully:', data);
				speechOutput = "Ok, turning the light " + colorRequest;
				repromptText = "Ok, turning the light " + colorRequest;
				callback({},buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
			},
			function(err) {
				console.log('An error occurred: when connection/sending', err);
			}
		);
		 
	} else {
		speechOutput = "Please try again";
		repromptText = "Please try again";
		callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	}
}

// --------------- Events -----------------------

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(requestId, sessionId, callback) {
    console.log(`onLaunch requestId=${requestId}, sessionId=${sessionId}`);
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'changeLEDColor') {
        controlLightBulbInSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error(`Invalid intent: ${intentName}`);
    }
}

// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context) => {
    try {
       let requestId = event.request && event.request.requestId || '--';
       let sessionId = event.session && event.session.sessionId || '--'
        if (event.session.new) {
            console.log("session started");
        }

        if (event.request.type === 'LaunchRequest') {
            //basically this covers saying hello
            onLaunch(requestId,
                sessionId,
                function callback(sessionAttributes, speechletResponse) {
					context.succeed(buildResponse(sessionAttributes, speechletResponse));
				});
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
					context.succeed(buildResponse(sessionAttributes, speechletResponse));
				});
        } else if (event.request.type === 'SessionEndedRequest') {
            console.log("session ended");
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};