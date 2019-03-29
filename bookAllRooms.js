const DDPClient = require("ddp");
const sha256 = require('sha256');
const moment = require("moment-timezone");

const USERNAME = 'defaultDevIntegrationUser';

const PASSWORD = 'wjHjBa4SS7-qX0fTWaad8vPsSa9QJdQcKVE3q6LsG2v'; // secret token Hackaton machine
const URL = 'wss://192.168.0.98:3002/websocket'; // To be updated with IP

const PASSWORDHASH = sha256(PASSWORD);

const ddpclient = new DDPClient({
  autoReconnect: true,
  autoReconnectTimer : 500,
  maintainCollections : true,
  ddpVersion : 1,
  url: URL
});
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Accept self signed certificate (not for production!)


console.log("Connecting...");

/*
 * Connect to the Meteor Server
 */
ddpclient.connect(function(error, wasReconnect) {
    // If autoReconnect is true, this callback will be invoked each time
    // a server connection is re-established
    if (error) {
      console.log('DDP connection error!');
      console.log(error);
      return;
    }

    if (wasReconnect) {
      console.log('Reestablishment of a connection.');
    } else {
        console.log('connected!');
    }

    ddpclient.call('login',
    [{
      user: {username: USERNAME},
      password: {digest: PASSWORDHASH, algorithm: 'sha-256'}
    }],
    function (err, result) {
      if (result) {
        console.log(result);

        // Basically query for all roms available
        ddpclient.call('getAvailableRoomsAdvancedNew',
        [{
          room: {_id: ''},
          startDate: '2019-03-27T14:00:00+00:00',
          endTDate: '2019-03-27T14:10:00+00:00',
          location: {country: false, city: false, building: false, floor: false},
          seats: '1-100',
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
            // Loop all found rooms and book them
            result.fullMatchArray.forEach(room => {
                console.log(`Booking: ${room.alias} (${room._id})`);

                ddpclient.call('createBooking',
                    [{
                        roomId: room._id,
                        startDate: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
                        endDate: moment().add(2, 'minutes').format("YYYY-MM-DDTHH:mm:ssZ"),
                        subject: 'Fika meeting!',
                        confirmed: false,
                        pin: null,
                        //rfid: null,
                    }],
                    function (err, result) {
                        if (result) {
                            console.log(result);
                        } else {
                            console.log(err);
                        }
                    });
            }); // foreach room
            setTimeout(() => {
                console.log("My job here is done!");
                /*
                * Close the ddp connection. This will close the socket, removing it
                * from the event-loop, allowing your application to terminate gracefully
                */
                ddpclient.close();
                console.log("Dramatic exit")
            },2000);
          } else {
            console.log(err);
          }
        }
      );

      } else {
        console.log(err);
      }
    });
});


