/* eslint-disable no-param-reassign */

const { dialogflow } = require('actions-on-google')

const { call } = require('./twilio')
const {
  denyGuest, convertE164, unconvertE164, dateToJapanese,
} = require('./utils')
const {
  initDB, getPhoneNumbersRef, deleteUser, getUserID, getLastLog,
} = require('./db')
const {
  searchLostLocation,
} = require('./dialogflow_lostsearch')

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
    await getPhoneNumbersRef(getUserID(conv)).doc(name).set({ phoneNumber })
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

const lastLog = async (conv) => {
  if (denyGuest(conv)) return

  const last = await getLastLog(getUserID(conv))
  if (!last) {
    conv.ask('通話記録が見つかりませんでした。')
    return
  }

  conv.add(`前回の発信リクエストは${unconvertE164(last.to)}宛で、${dateToJapanese(last.requestTimestamp.toDate())}に行われました。`)

  // https://jp.twilio.com/docs/voice/twiml#request-parameters-call-status
  switch (last.callStatus) {
    case 'queued':
      conv.add('このリクエストはまだ発信されていません。')
      break
    case 'ringing':
      conv.add('現在呼び出し中です。')
      break
    case 'in-progress':
    case 'completed':
      conv.add('発信は何者かによって応答されました。')
      break
    case 'busy':
      conv.add('発信は電話機によって切断されました。キャンセルボタンなどが押された可能性があります。')
      break
    case 'failed':
      conv.add('発信に失敗しました。電話番号を間違えていませんか？')
      break
    case 'no-answer':
      conv.add('発信に成功しましたが、応答がありませんでした。')
      break
    case 'canceled':
      conv.add('システムによって発信がキャンセルされました。もう一度お試し下さい。')
      break
    default:
      conv.add('不明なエラーが発生しました。')
      break
  }
}

const app = dialogflow({
  debug: true,
})

app.intent('person_request', personRequest)
app.intent('phone-number_request', phoneNumberRequest)
app.intent('phone-call_accept', phoneCallAccept)
app.intent('delete_user-storage', deleteUserStorage)
app.intent('last_log', lastLog)
app.intent('search_lost-location', searchLostLocation)

exports.dialogFlowApp = app
