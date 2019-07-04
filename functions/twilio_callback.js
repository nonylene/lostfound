/* eslint-disable no-param-reassign */

const functions = require('firebase-functions')
const { setLast } = require('./db')

exports.twilioCallbackApp = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(400).end()
    return
  }
  const {
    token, userID, timestamp, ...last
  } = req.body
  if (token !== functions.config().lostfound.twilio_callback.token) {
    res.status(403).end()
    return
  }
  await setLast(userID, { timestamp: new Date(timestamp), ...last })
  res.status(200).end()
}
