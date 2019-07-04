const functions = require('firebase-functions')

const { dialogFlowApp } = require('./dialogflow')
const { twilioCallbackApp } = require('./twilio_callback')

exports.dialogflowLostFound = functions.https.onRequest(dialogFlowApp)
exports.twilioCallback = functions.https.onRequest(twilioCallbackApp)
