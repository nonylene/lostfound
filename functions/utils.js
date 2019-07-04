exports.convertE164 = localNumber => `+81${localNumber.substr(1)}`
exports.unconvertE164 = globalNumber => `0${globalNumber.substr(3)}`

exports.denyGuest = (conv) => {
  if (conv.user.verification !== 'VERIFIED') {
    // XXX
    conv.close('ゲストには対応していません。')
    return true
  }
  return false
}
