/* eslint-disable no-param-reassign */

const functions = require('firebase-functions')
const admin = require('firebase-admin')

const STORAGE_ID_KEY = 'id'

const DB_USERS = 'users'
const DB_PHONE_NUMBERS = 'phoneNumbers'

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

const getUserID = conv => conv.user.storage[STORAGE_ID_KEY]

const getUserRef = userID => db.collection(DB_USERS).doc(userID)

const getPhoneNumbersRef = userID => getUserRef(userID).collection(DB_PHONE_NUMBERS)

exports.deleteUser = async (conv) => {
  if (STORAGE_ID_KEY in conv.user.storage) {
    const userID = getUserID(conv)
    // get all phoneNumbers
    const phoneNumbers = await getPhoneNumbersRef(userID).get()
    const batch = db.batch()
    phoneNumbers.forEach(doc => batch.delete(doc.ref))
    batch.delete(getUserRef(userID))
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

exports.setLast = async (userID, last) => getUserRef(userID).set({ last })

exports.getPhoneNumbersRef = getPhoneNumbersRef
exports.getUserID = getUserID
