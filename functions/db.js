/* eslint-disable no-param-reassign */

const functions = require('firebase-functions')
const admin = require('firebase-admin')

const STORAGE_ID_KEY = 'id'

const DB_USERS = 'users'
const DB_PHONE_NUMBERS = 'phoneNumbers'

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

const getUserRef = conv => db.collection(DB_USERS).doc(conv.user.storage[STORAGE_ID_KEY])

const getPhoneNumbersRef = conv => getUserRef(conv).collection(DB_PHONE_NUMBERS)

exports.deleteUser = async (conv) => {
  if (STORAGE_ID_KEY in conv.user.storage) {
    // get all phoneNumbers
    const phoneNumbers = await getPhoneNumbersRef(conv).get()
    const batch = db.batch()
    phoneNumbers.forEach(doc => batch.delete(doc.ref))
    batch.delete(getUserRef(conv))
    await batch.commit()

    conv.user.storage = {}
    return true
  }
  return false
}

exports.initDB = async (conv) => {
  // Initialize
  if (!(STORAGE_ID_KEY in conv.user.storage)) {
    // Add a new document with a generated id.
    const newUserRef = await db.collection(DB_USERS).add({ last: null })
    conv.user.storage[STORAGE_ID_KEY] = newUserRef.id
  }
}

exports.getPhoneNumbersRef = getPhoneNumbersRef
