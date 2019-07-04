/* eslint-disable no-param-reassign */

const { dialogflow } = require('actions-on-google')

const { call } = require('./twilio')
const { denyGuest, convertE164, unconvertE164 } = require('./utils')
const {
  initDB, getPhoneNumbersRef, deleteUser, getUserID,
} = require('./db')

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

const personRequest = async (conv, params) => {
  if (denyGuest(conv)) return

  // Initialize
  await initDB(conv)

  const { name } = params.name
  conv.data.name = name

  const userID = getUserID(conv)

  const phoneNumberDoc = await getPhoneNumbersRef(userID).doc(name).get()
  if (!phoneNumberDoc.exists) {
    conv.ask(`番号が見つかりませんでした。${name}さんの番号は何ですか？`)
  } else {
    const { phoneNumber } = phoneNumberDoc.data()
    conv.data.phoneNumber = phoneNumber
    conv.contexts.set('phone-call', 1)
    conv.ask(`${name}さんの${unconvertE164(phoneNumber)}を呼び出します。よろしいですか？`)
  }
}

const phoneNumberRequest = async (conv, params) => {
  if (denyGuest(conv)) return

  await initDB(conv)

  const phoneNumber = convertE164(params['phone-number'])
  conv.data.phoneNumber = phoneNumber
  if (conv.data.name) {
    const { name } = conv.data
    await getPhoneNumbersRef(conv).doc(name).set({ phoneNumber })
    conv.add(`${conv.data.name}さんの番号を${unconvertE164(phoneNumber)}と登録しました。`)
  }

  conv.contexts.set('phone-call', 1)
  conv.ask(`${unconvertE164(phoneNumber)}を呼び出します。よろしいですか？`)
}

const phoneCallAccept = async (conv) => {
  if (denyGuest(conv)) return

  conv.add(`${unconvertE164(conv.data.phoneNumber)}を呼び出します。`)
  await call(getUserID(conv), conv.data.phoneNumber)
}

const deleteUserStorage = async (conv) => {
  if (denyGuest(conv)) return

  if (await deleteUser(conv)) {
    conv.ask('データを削除しました。')
  } else {
    conv.ask('データはありませんでした。')
  }
}

const app = dialogflow({
  debug: true,
})

app.intent('person_request', personRequest)
app.intent('phone-number_request', phoneNumberRequest)
app.intent('phone-call_accept', phoneCallAccept)
app.intent('delete_user-storage', deleteUserStorage)

exports.dialogFlowApp = app
