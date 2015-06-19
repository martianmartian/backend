
io = require('socket.io').listen(4000);

var unpairedSocketA=null;
var unpairedSocketB=null;


io.on("connection",function(socket){
  console.log('a user connected');
  if(unpairedSocketA==null){unpairedSocketA=socket}
  else if(unpairedSocketB==null){unpairedSocketB=socket}
  if(unpairedSocketA!=null&&unpairedSocketB!=null){
    pair(unpairedSocketA,unpairedSocketB);
    unpairedSocketA=null;
    unpairedSocketB=null;
  }


})


function pair(socketA, socketB){
  console.log("paring");
  try {
    socketA.emit("event",{type: 'init'});
  } catch (e) {
    console.log('Could not send init');
  }

  socketA.on('event', function(message) {
    // console.log("from A: ")
    // console.log(message)
    switch (message.type) {
      case 'offer':
        try {
          // console.log(message)
          socketB.emit("event",message);
        } catch (e) {
          console.log('Could not send SDP_Stage_2');
        }
        break;
      case 'ice':
        //relay all ice messages
        try {
          socketB.emit("event",{});
        } catch (e) {
          console.log('Could not send ice to B');
        }
        break;
    }
  });
  socketB.on('event', function(message) {
    // console.log("from B: ")
    // console.log(message)
    switch (message.type) {
      case 'answer':
        // console.log(message);
        try {
          socketA.emit("event",message);
        } catch (e) {
          console.log('Could not send SDP_Stage_3');
        }
      break;

      case 'icecandidate':
        console.log("from B ICE: ")
        console.log(message)
        try {
          socketA.emit("event",message);
        } catch (e) {
          console.log('Could not send ice to A');
        }
      break;
    }
  });

}



