const functions = require('firebase-functions')

const { dialogFlowApp } = require('./dialogflow')
const { twilioCallbackApp } = require('./twilio_callback')

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

exports.dialogflowLostFound = functions.https.onRequest(dialogFlowApp)
exports.twilioCallback = functions.https.onRequest(twilioCallbackApp)
