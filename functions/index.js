'use strict'

const functions = require('firebase-functions')
const {dialogflow} = require('actions-on-google')

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

const denyGuest = (conv) => {
  console.log(conv.user.verification)
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

  const name = params.name.name
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

const phoneCallAccept = (conv) => {
  if (denyGuest(conv)) return

  conv.ask(`${conv.data.phoneNumber}を呼び出します。`)
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
