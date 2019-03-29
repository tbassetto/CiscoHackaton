# CiscoHackaton
Getting started code for integration with Evoko Home room booking server

See the bookAllRooms.js file for a working Nodejs example.

Use username: defaultDevIntegrationUser
And password: wjHjBa4SS7-qX0fTWaad8vPsSa9QJdQcKVE3q6LsG2v
URL: wss://192.168.0.98:3002/websocket   (Update with IP from Cisco)

# Evoko Home API documentation

- [Introduction](#introduction)
- [Connecting to Evoko Home over DDP](#login)
- [Register a new client group - `registerClientGroup2x`](#registerClientGroup2x)
- [Register an integration user - `registerIntegrationUser`](#registerIntegrationUser)
- [Create a meeting - `createBooking`](#createBooking)
- [Update a meeting - `updateEvent`](#updateEvent)
- [Delete a meeting - `deleteEvent`](#deleteEvent)
- [Check-in a meeting - `confirmMeeting`](#confirmMeeting)
- [Search for available rooms - `getAvailableRoomsAdvancedNew`](#getAvailableRoomsAdvancedNew)
- [Edit room equipment status - `editRoomEquipmentReport`](#editRoomEquipmentReport)
- [Node.js code example](#node.js-code-example)

---

## Introduction <a name="introduction"></a>


<!-- This API is the same API that is used by the Evoko Liso units, Evoko Get A Room Appconnector and Evoko Overview Screen server.

EH/Meteor uses DDP to make requests.... the examples provided are written for node.js and uses a small ddp client that can be found using npm.... just examples, use w/e ddp client/library that suits you... yada yada.

Applies to Evoko Home `v2.x`. 

### errors

In case there was an error during execution of the method, the method will throw a Meteor
exception. Meteor exception object has two attributes: `error` and `reason`.
The `error` attribute contains error code and `reason` attribute contains error message. -->

---

## Connecting to Evoko Home over DDP <a name="login"></a>

As mentioned in the introduction Evoko Home is built on full stack JavaScript framework [Meteor](https://www.meteor.com/) which uses the DDP protocol to communicate. To connect and send request you will need to use a DDP client, which one? you may ask - that's up to you to decide however in our examples we will use a [ddp client library available on npm](https://www.npmjs.com/package/ddp).

To connect, you may use an unecrypted websocket (`ws`) on your unecrypted application port (default `3000`) or use an encrypted websocket (`wss`) on your encrypted application port (default `3002`) over TLS v1.2. For example:

- **Unencrypted:** `ws://localhost:3000/websocket` 
- **Encrypted:** `wss://server.domain.tld:3002/websocket`

To authenticate, you can use the username/password of any Global admin user that exists in Evoko Home. Another option is to use the pre-generated API user (`defaultDevIntegrationUser`) whos password (or `groupToken`) can easily be found and copied under "Global Settings" in the Evoko Home web interface.

As a third option you may register your own [client group](#registerClientGroup2x) and [integration user](#registerIntegrationUser) to use for authentication which we cover in the next section.

### Request example

```javascript
const DDPClient = require('ddp');
const sha256 = require('sha256');

const USERNAME = 'defaultDevIntegrationUser';
const PASSWORD = 'very-secret-token';
const URL = 'wss://server.domain.tld:3002/websocket';

const PASSWORDHASH = sha256(PASSWORD);

const ddpclient = new DDPClient({
  autoReconnect: true,
  autoReconnectTimer : 500,
  maintainCollections : true,
  ddpVersion : 1,
  url: URL
});

ddpclient.connect(function(error, wasReconnect) {
  if (error) {
    console.log('DDP connection error!');
    return;
  }

  if (wasReconnect) {
    console.log('Reestablishment of a connection.');
  } else {
    console.log('Connected!');
  }

  ddpclient.call('login',
    [{
      user: {username: USERNAME},
      password: {digest: PASSWORDHASH, algorithm: 'sha-256'}
    }],
    function (err, result) {
      if (result) {
        console.log(result);
      } else {
        console.log(err);
      }
    }
});
```

### Response example

The token is valid for 90 days. `id` represents your user (in our case `defaultDevIntegrationUser`).

```javascript
{ id: 'dM7mDamj24k3QnjvF',
  token: '042BVXEZdgFYJ2If8iFWkPfnyGzUsvVbqzEHbBq9PVM',
  tokenExpires: 2019-06-17T17:25:21.757Z,
  type: 'password' }
```

### Error response examples

```javascript
{ isClientSafe: true,
  error: 403,
  reason: 'User not found',
  message: 'User not found [403]',
  errorType: 'Meteor.Error' }

{ isClientSafe: true,
  error: 403,
  reason: 'Incorrect password',
  message: 'Incorrect password [403]',
  errorType: 'Meteor.Error' }

{ isClientSafe: true,
  error: 401,
  reason: 'User is not authorized!',
  message: 'User is not authorized! [401]',
  errorType: 'Meteor.Error' }
```

---

## Register a new client group - `registerClientGroup2x` <a name="registerClientGroup2x"></a>

This method (`registerClientGroup2x`) is used to register a new client group and only have a single parameter which is the name of the group (e.g. `myNewGroup`).

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Request example

```javascript
ddpclient.call('registerClientGroup2x',
  ['myNewGroup'],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

```javascript
{ groupName: 'myNewGroup',
  groupToken: 'zEd_vOJrwo4W3AbFsPPhpgRzacLwY7cfrQIIrxLDC7k' }
```

### Error response example 

```javascript
{ isClientSafe: true,
  error: 'Unable to register client group with that name!',
  message: '[Unable to register client group with that name!]',
  errorType: 'Meteor.Error' }
```

---

## Register an integration user - `registerIntegrationUser` <a name="registerIntegrationUser"></a>

This method (`registerIntegrationUser`) is used to register a new integration user and only have a single parameter which is `groupToken` for the group the user should be registed to.

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Request example

```javascript
ddpclient.call('registerIntegrationUser',
  ['zEd_vOJrwo4W3AbFsPPhpgRzacLwY7cfrQIIrxLDC7k'],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

```javascript
{ _id: 'QegBzfAgpjMh55Bun',
  createdAt: 2019-01-01T12:00:16.518Z,
  services:
   { password:
      { bcrypt: '$2a$10$0vYLzWlFA2cl//Hn6vO6QeW3yGpMxNNoQuKqbSQY./UzMA24j8jeC' } },
  username: 'deviceBReyXScTsy2yBhcvZ',
  profile:
   { name: 'deviceBReyXScTsy2yBhcvZ',
     pin: '',
     rfid: '',
     type: 'APIIntegration',
     originalToken: null,
     clientGroup: 'myNewGroup',
     groupToken: 'zEd_vOJrwo4W3AbFsPPhpgRzacLwY7cfrQIIrxLDC7k' } }
```

### Error response example

```javascript
{ isClientSafe: true,
  error: 401,
  reason: 'Error while registering dev integration user!',
  message: 'Error while registering dev integration user! [401]',
  errorType: 'Meteor.Error' }
```


---

## Create a meeting - `createBooking` <a name="createBooking"></a> 

This method (`createBooking`) is used to create a new meeting.

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|
| `roomId` | String | Yes | The document id of the room (same as the `_id` string). |
| `startDate` | String | Yes | Meeting start date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) |
| `endDate` | String | Yes | Meeting end date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`). The **minutes** in this property **must** be set in even quarters (i.e. either `00`, `15`, `30` or `45`). |
| `subject` | String | No | The meetings subject. If left empty or excluded the subject will use the Liso default (`Booked on screen`). |
| `confirmed` | Boolean | No  | `true` considers a meeting as checked-in and `false` the opposite. If excluded from the request, then it will default to `false` for future meetings and `true` for instant meetings (i.e normal Liso behavior). |
| `pin` | Number | No* | PIN number associated with the user in Evoko Home. Required if authentication for instant meetings (`bookMeetingSettings.auth`) and/or future meetings (`bookFutureMeetingSettings.auth`) is enabled (`true`). If authencation is disabled (`false`), then this value can be set to `null` or the parameter be excluded. |
| `rfid` | String | No* | RFID associated with the user in Evoko Home. Can be used instead of `pin` if RFID authentication is enabled, otherwise the value can be set to `null` or the parameter be excluded. |
| `metadata` | Object | No | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request example

```javascript
ddpclient.call('createBooking',
  [{
    roomId: 'MBPMGDaomwnHawrt6',
    startDate: '2019-01-01T15:00:00:00+00:00',
    endDate: '2019-01-01T15:30:00+00:00',
    subject: 'Fika meeting!',
    confirmed: false,
    pin: 9999,
    rfid: null
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

The `id` is the newly created meetings document identityfier (i.e `_id` / `bookingId`).  

```javascript
{ type: 'success',
  message: 'MeetingSuccessCreated',
  body: { id: 'FoyY5889YsSFL3rj4' } }
```

### Error response example

```javascript
// A meeting already exists 
{ isClientSafe: true,
  error: 400,
  reason: 'MeetingSuccessExists',
  message: 'MeetingSuccessExists [400]',
  errorType: 'Meteor.Error' }
```

---

## Update a meeting - `updateEvent` <a name="updateEvent"></a>

This method (`updateEvent`) is used to update existing meetings.

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|
| `bookingId` | String | Yes | The document id of the meeting (same as the `_id` string). |
| `id` | String | Yes | The id of the meeting in the integrated booking system (e.g. Office 365). |
| `startDate` | String | Yes | Meeting start date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) |
| `endDate` | String | Yes | Meeting end date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`). The **minutes** in this property **must** be set in even quarters (i.e. either `00`, `15`, `30` or `45`). |
| `pin` | Number | No* | PIN number associated with the user in Evoko Home. Required if authentication for extending ongoing meetings (`extendOngoingMeetingSettings.auth`) and/or extending future meetings (`extendFutureMeetingSettings.auth`) is enabled (`true`). If authencation is disabled (`false`), then this value can be set to `null` or the parameter be excluded. |
| `rfid` | String | No* | RFID associated with the user in Evoko Home. Can be used instead of `pin` if RFID authentication is enabled, otherwise the value can be set to `null` or the parameter be excluded. |
| `ongoing` | Boolean | No ??? | `true` if the meeting is in progress, otherwise `false`. ??? |
| `metadata` | Object | No | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request example

```javascript
ddpclient.call('updateEvent',
  [{
    bookingId: 'FoyY5889YsSFL3rj4',
    id: 'AAMkADNjMjQ3MTBiLWU2YjYtNDExNi1hMmQzLWFiNDhkY2RjZjg1NwBGAAAAAACk04VXQlknRLAVB3vQZOksBwAy7N4vuvaDT4Acs1TT1y6sAAAAAAENAAAy7N4vuvaDT4Acs1TT1y6sAADktGXSAAA=',
    startDate: '2019-01-01T15:00:00+00:00',
    endDate: '2019-01-01T15:45:00+00:00',
    pin: null,
    rfid: null,
    ongoing: false
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

```javascript
{ type: 'success',
  message: 'MeetingSuccessUpdate',
  body: null }
```

### Error response example

```javascript
// Unable to extend meeting e.g due conflict with another existing meeting
{ isClientSafe: true,
  error: 400,
  reason: 'MeetingInvalidExtend',
  message: 'MeetingInvalidExtend [400]',
  errorType: 'Meteor.Error' }
```

---

## Delete a meeting - `deleteEvent` <a name="deleteEvent"></a>

This method (`deleteEvent`) is used to delete existing meetings.

If the request is successful **no** response object will be receieved, if it fails it will throw an error.

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|
| `bookingId` | String | Yes | The document id of the meeting (same as the `_id` string). |
| `pin` | Number | No* | PIN number associated with the user in Evoko Home. Required if authentication for extending ongoing meetings (`endOngoingMeetingSettings.auth`) and/or extending future meetings (`endFutureMeetingSettings.auth`) is enabled (`true`). If authencation is disabled (`false`), then this value can be set to `null` or the parameter be excluded. |
| `rfid` | String | No* | RFID associated with the user in Evoko Home. Can be used instead of `pin` if RFID authentication is enabled, otherwise the value can be set to `null` or the parameter be excluded. |
| `ongoing` | Boolean | ???  | Set to `true` if the meeting is in progress, otherwise `false`. ??? |
| `metadata` | Object | No | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request example

```javascript
ddpclient.call('deleteEvent',
  [{
    bookingId: 'FoyY5889YsSFL3rj4',
    pin: 9999,
    rfid: null,
    ongoing: true
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response exmaple

```javascript
// no success ("result") currently exists (tested with Evoko Home v2.1.0)
undefined
```

### Error response example

!!!

```javascript
<error example>
```

---

## Check-in a meeting - `confirmMeeting` <a name="confirmMeeting"></a>

This method (`confirmMeeting`) is used to check-in an existing meeting.

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|-|
| `bookingId` | String | Yes | The document id of the meeting (same as the `_id` string). |
| `pin` | Number | No* | PIN number associated with the user in Evoko Home. Required if authentication for check-in (`confirmMeetingSettings.auth`) is enabled (`true`). If authencation is disabled, then this value can be set to `null` or the parameter be excluded. |
| `rfid` | String | No* | RFID associated with the user in Evoko Home. Can be used instead of `pin` if RFID authentication is enabled, otherwise the value can be set to `null` or the parameter be excluded. |
| `metadata` | Object | No | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request exmaple

```javascript
ddpclient.call('confirmMeeting',
  [{
    bookingId: 'QGnHDQDdZ3FhAXpv3',
    pin: null,
    rfid: null
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

```javascript
{ type: 'success',
  message: 'Booking is successfully confirmed!',
  body: null }
```

### Error response example

!!!

```javascript
// No PIN provided
{ isClientSafe: true,
  error: 400,
  reason: 'PinIsRequired',
  message: 'PinIsRequired [400]',
  errorType: 'Meteor.Error' }

// Invalid PIN
{ isClientSafe: true,
  error: 400,
  reason: 'PinWrongNumber',
  message: 'PinWrongNumber [400]',
  errorType: 'Meteor.Error' }

// Invalid RFID
{ isClientSafe: true,
  error: 400,
  reason: 'RFIDWrongNumber',
  message: 'RFIDWrongNumber [400]',
  errorType: 'Meteor.Error' }
```

---

## Search for available rooms - `getAvailableRoomsAdvancedNew` <a name="getAvailableRoomsAdvancedNew"></a>

This method (`getAvailableRoomsAdvancedNew`) is used to get available rooms based on a time interval and room properties such as location, capacity and equipment.

If the request is successful a response object will be receieved which contains two arrays (`fullMatchArray` and `partialMatchArray`), if it fails it will throw an error.

The first array (`fullMatchArray`) contain rooms that fully match the conditions, the second array (`partialMatchArray`) contain rooms that partially match the conditions. Rooms that fail atleast 1 condition but does not fail more than 3 will be returned as a partial match (with the exception of localtion and time interval which will filter results regardless).

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|
| `room` | Object | Yes | This parameter is mainly used for the Liso to identify which device the search is executed from. We recommend you set the value to `{_id: 'not-a-liso'}`. |
| `startDate` | String | Yes | Start date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`). |
| `endDate` | String | Yes | End date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`). |
| `currentDate` ??? | String | No ??? | Current date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) entered in the device/clients time zone ??? |
| `location` | Object | Yes | Object with the following parameters `country`, `city`, `building` and `floor`. The value can be set to each respective `structureId` or `false` to filter results. |
| `seats` | String | Yes | Avilable values are `1-5`, `5-10`, `10-20`, `20-50`, `50+` to filter rooms based on their seat capacity. |
| `equipment` | Object | Yes | Object with the following parameters `lights`, `projector`, `computer`, `teleConference`, `wifi`, `whiteboard`, `videoConference`, `display`, `minto`, `ac` and `information`. The value for these parameters are boolean, set to `true` to return rooms with this equipment and set to `false` (or remove the paramenter) to not include in the search filter. |
| `customEquipment` | Array | Yes | The array can be left empty (e.g. `[]`) which will ignore any custom equipment when filtering. To filter based on some custom equipment item, include the object (e.g. `[{_id: '8X8r9q2KSQAh8M9Lw', name: 'Fika', isChecked: true}]`) and set `isChecked` to `true`. |
| `isFiltered` | Boolean | No ??? | ??? |
| `metadata` | Object | Yes | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request example

```javascript
ddpclient.call('getAvailableRoomsAdvancedNew',
  [{
    room: {_id: 'not-a-liso'},
    startDate: '2019-01-01T12:00:00+00:00',
    endTDate: '2019-01-01T12:30:00+00:00',
    location: {country: false, city: false, building: false, floor: false},
    seats: '1-5',
    equipment: {  
      wifi: false,
      whiteboard: false,
      videoConference: false,
      computer: false,
      projector: false,
      teleConference: false,
      information: false,
      minto: false,
      display: false,
      lights: false,
      ac: false
    },
    customEquipment: [],
    isFiltered: true,
    metadata: {demoMode: false}
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response example

```javascript
{ fullMatchArray:
   [ { _id: 'MBPMGDaomwnHawrt6',
       name: 'Fika room',
       alias: 'Fika room',
       mail: 'fika-room@domain.tld',
       address: 'fika-room@domain.tld',
       id: 'Fika room',
       isActive: true,
       isDeleted: false,
       numberOfSeats: 4,
       equipment: [Object],
       customEquipment: [Array],
       structureId: 'xSEQpnFEZ2KFWroBo',
       userIds: [],
       assigned: true } ],
  partialMatchArray: 
   [ { _id: '7Ag8arosM5DW5KtCs',
       name: 'Another fika room',
       alias: 'Another fika room',
       mail: 'another-fika-room@domain.tld',
       address: 'another-fika-room@domain.tld',
       id: 'Another fika room',
       isActive: true,
       isDeleted: false,
       numberOfSeats: 8,
       equipment: [Object],
       customEquipment: [Array],
       structureId: 'vj69HgSWyN5GhRZ5H',
       userIds: [],
       assigned: true } ] }
```

### Error response example

!!!

```
<error response>
```

---

## Edit room equipment status - `editRoomEquipmentReport` <a name="editRoomEquipmentReport"></a>

This method (`editRoomEquipmentReport`) can be used to edit the status of a rooms equipment as working/fixed (`true`), broken (`false`) or disabled (`null`).

If the request is successful a response object will be receieved, if it fails it will throw an error.

### Parameters

| Name | Type | Mandatory | Comment |
|-|-|-|-|
| `roomObject` | Object | Yes | `_id` `equipment` `customEquipment` !!! |
| `adminReportFlag` | Boolean | No | Determines wheter admin authentication is required (`true`) or not (`false`) when reporting equipment. |
| `pin` | Number | No* | PIN number associated with the user in Evoko Home. Required if authentication for reporting equipment (`reportSettings.auth`) is enabled (`true`). If authencation is disabled, then this value can be set to `null` or the parameter be excluded. |
| `rfid` | String | No* | RFID associated with the user in Evoko Home. Can be used instead of `pin` if RFID authentication is enabled, otherwise the value can be set to `null` or the parameter be excluded. |
| `metadata` | Object | Yes | Contains one boolean paramter `demoMode` which should be set to `false`. |

### Request example

```javascript
ddpclient.call('editRoomEquipmentReport',
  [{
    roomObject: {
      _id: 'MBPMGDaomwnHawrt6',
      equipment: {
        wifi: true,
        whiteboard: true,
        videoConference: true,
        computer: false,
        projector: null,
        teleConference: true,
        information: null,
        minto: true,
        display: null,
        lights: true,
        ac: null
        },
      customEquipment: [{
        _id: '8X8r9q2KSQAh8M9Lw',
        name: 'Fika',
        isChecked: true
        },
        {
        _id: 'uStt5CX9CDpKapaCX',
        name: 'More fika',
        isChecked: null
      }],
    },
    adminReportFlag: false,
    pin: null,
    rfid: null,
    metadata: {demoMode: false}
  }],
  function (err, result) {
    if (result) {
      console.log(result);
    } else {
      console.log(err);
    }
  }
);
```

### Response examples

```javascript
// When reported as fixed
{ type: 'success',
  message: 'RoomSuccessEquipUpdateRepaired',
  body: null }

// When reported as broken
{ type: 'success',
  message: 'RoomSuccessEquipUpdateBroken',
  body: null }
```

### Error response example

!!!

```javascript
// Non-admin attepts to report stuff as fixed when adminReportFlag = true
{ isClientSafe: true,
  error: 403,
  reason: 'NoAuthorizedResourceAccess',
  message: 'NoAuthorizedResourceAccess [403]',
  errorType: 'Meteor.Error' }

// When generic shit hits the fan
{ isClientSafe: true,
  error: 400,
  reason: 'GenericError5',
  message: 'GenericError5 [400]',
  errorType: 'Meteor.Error' }

// 
{ isClientSafe: true,
  error: 404,
  reason: 'RoomNotActiveNotFound',
  message: 'RoomNotActiveNotFound [404]',
  errorType: 'Meteor.Error' }

//
{ isClientSafe: true,
  error: 400,
  reason: 'Parameter roomId not specified!',
  message: 'Parameter roomId not specified! [400]',
  errorType: 'Meteor.Error' }
```

---

## Node.js code example <a name=node.js-code-example></a>

Below is a very basic example of a small node.js app that connects/authenicates to a Evoko Home server and then creates a meeting with the subject "Fika time!".

### Create a node.js project and install dependencies

```bash
## create a directory
mkdir fika-time-example

## change directory
cd fika-time-example

## create a project
npm init

## install dependencies
npm install ddp sha256
```

Now the project should have two files (`package.json` and `index.js`) stored in directory called `fika-time-example`.

### `~/fika-time-example/package.json`

```json
{
  "name": "fika-time-example",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "dependencies": {
    "ddp": "^0.12.1",
    "sha256": "^0.2.0"
  },
  "author": "",
  "license": "ISC"
}
```

### `~/fika-time-example/index.js`

Copy and paste the below code into `index.js` and replace the values that needs replacing.

```javascript
const DDPClient = require('ddp');
const sha256 = require('sha256');

const USERNAME = 'defaultDevIntegrationUser';
const PASSWORD = 'very-secret-token'; // replace with your API token
const URL = 'wss://server.domain.tld:3002/websocket'; // replace with your Evoko Home server

const PASSWORDHASH = sha256(PASSWORD);

const ddpclient = new DDPClient({
  autoReconnect: true,
  autoReconnectTimer : 500,
  maintainCollections : true,
  ddpVersion : 1,
  url: URL
});

ddpclient.connect(function(error, wasReconnect) {
  if (error) {
    console.log('DDP connection error!');
    return;
  }

  if (wasReconnect) {
    console.log('Reestablishment of a connection.');
  } else {
    console.log('Connected!');
  }

  ddpclient.call('login',
    [{
      user: {username: USERNAME},
      password: {digest: PASSWORDHASH, algorithm: 'sha-256'}
    }],

    (err, result) => {
      ddpclient.call('createBooking',
        [{
          roomId: 'MBPMGDaomwnHawrt6', // replace with the id of your room
          startDate: '2019-01-01T15:00:00:00+00:00', // change start time
          endDate: '2019-01-01T15:30:00+00:00', // change end time
          subject: 'Fika time!',
          confirmed: false,
          pin: null, // replace with user pin if necessary
          rfid: null
        }],
        function (err, result) {
          if (result) {
            console.log(result);
          } else {
            console.log(err);
          }
        }
      );
    }
  )
});
```
### Run the node.js app

```bash
node index.js
```

If the meeting was successfully created you should receive a similar response as below 🎉.

```javascript
{ type: 'success',
  message: 'MeetingSuccessCreated',
  body: { id: 'FoyY5889YsSFL3rj4' } }
```
