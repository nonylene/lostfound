/* eslint-disable no-param-reassign */

const functions = require('firebase-functions')
const { dialogflow } = require('actions-on-google')

const twilio = require('twilio')(functions.config().lostfound.twilio.sid, functions.config().lostfound.twilio.token)

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

const convertE164 = localNumber => `+81${localNumber.substr(1)}`

const call = async (localNumber) => {
  const config = functions.config().lostfound
  const from = config.caller
  const to = convertE164(localNumber)

  const result = await twilio.studio.flows(config.twilio.flow_sid).executions.create({ from, to })
  console.log(result.toJSON())
}

const denyGuest = (conv) => {
  if (conv.user.verification !== 'VERIFIED') {
    // XXX
    conv.close('ゲストには対応していません。')
    return true
  }
  return false
}

const personRequest = (conv, params) => {
  if (denyGuest(conv)) return

  // Initialize
  if (!('phoneNumbers' in conv.user.storage)) {
    conv.user.storage.phoneNumbers = {}
  }

  const { name } = params.name
  conv.data.name = name

  const phoneNumber = conv.user.storage.phoneNumbers[name]
  if (!phoneNumber) {
    conv.ask(`番号が見つかりませんでした。${name}さんの番号は何ですか？`)
  } else {
    conv.data.phoneNumber = phoneNumber
    conv.contexts.set('phone-call', 1)
    conv.ask(`${name}さんの${phoneNumber}を呼び出します。よろしいですか？`)
  }
}

const phoneNumberRequest = (conv, params) => {
  if (denyGuest(conv)) return

  const phoneNumber = params['phone-number']
  conv.data.phoneNumber = phoneNumber
  if (conv.data.name) {
    conv.user.storage.phoneNumbers[conv.data.name] = phoneNumber
    conv.add(`${conv.data.name}さんの番号を${phoneNumber}と登録しました。`)
  }

  conv.contexts.set('phone-call', 1)
  conv.ask(`${phoneNumber}を呼び出します。よろしいですか？`)
}

const phoneCallAccept = async (conv) => {
  if (denyGuest(conv)) return

  conv.add(`${conv.data.phoneNumber}を呼び出します。`)
  await call(conv.data.phoneNumber)
}

const deleteUserStorage = (conv) => {
  if (denyGuest(conv)) return

  conv.user.storage = {}
  conv.ask('データを削除しました。')
}

const app = dialogflow({
  debug: true,
})

app.intent('person_request', personRequest)
app.intent('phone-number_request', phoneNumberRequest)
app.intent('phone-call_accept', phoneCallAccept)
app.intent('delete_user-storage', deleteUserStorage)

exports.dialogflowLostFound = functions.https.onRequest(app)
