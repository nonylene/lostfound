exports.convertE164 = localNumber => `+81${localNumber.substr(1)}`

exports.denyGuest = (conv) => {
  if (conv.user.verification !== 'VERIFIED') {
    // XXX
    conv.close('ゲストには対応していません。')
    return true
  }
  return false
}
