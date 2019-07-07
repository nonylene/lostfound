# lostfound-twilio

The **experimental** conversational application backend using ...

- Firebase
    - Cloud functions
        -  Dialogflow / Twilio Callbacks
    - Cloud database
- Twilio

## Setup

```sh
$ npm install -g firebase-tools
$ firebase login
$ (cd functions; npm install)
$ firebase functions:config:set lostfound.caller=<caller>
$ firebase functions:config:set lostfound.twilio.flow_sid=<flow_sid>
$ firebase functions:config:set lostfound.twilio.sid=<sid>
$ firebase functions:config:set lostfound.twilio.token=<token>
$ firebase functions:config:set lostfound.twilio_callback.token=<token>
$ firebase functions:config:set lostfound.google_map.token=<token>
$ firebase functions:config:set lostfound.google_map.locationbias=<locationbias>
```

### Prepare data

```sh
$ (cd colorcode; python3 convert.py ../functions/data/colors.json)
$ (cd dummydata; python3 dummydata.py ../functions/data/phones.json)
```

## Deploy

```sh
$ (cd functions; npm run deploy)
or
$ firebase deploy --only functions/
```
