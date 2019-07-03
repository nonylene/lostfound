const functions = require('firebase-functions')

const twilio = require('twilio')(functions.config().lostfound.twilio.sid, functions.config().lostfound.twilio.token)

const { convertE164 } = require('./utils')

exports.call = async (localNumber) => {
  const config = functions.config().lostfound
  const from = config.caller
  const to = convertE164(localNumber)

  const result = await twilio.studio.flows(config.twilio.flow_sid).executions.create({ from, to })
  console.log(result.toJSON())
}
