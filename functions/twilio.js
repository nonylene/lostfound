const functions = require('firebase-functions')

const twilio = require('twilio')(functions.config().lostfound.twilio.sid, functions.config().lostfound.twilio.token)

exports.call = async (userID, globalNumber) => {
  const config = functions.config().lostfound
  const from = config.caller
  const to = globalNumber
  const requestTimestamp = new Date()

  const result = await twilio.studio.flows(config.twilio.flow_sid).executions.create({
    from,
    to,
    parameters: { userID, requestTimestamp },
  })
  console.log(result.toJSON())
}
