"use strict";

var mqtt = require('MQTT/mqtt');

var mqttpromise = new Promise( function(resolve,reject){
  console.log("attempting to connect");
  
  var client = mqtt.connect('mqtt://10.0.0.131:1883');

  client.on('connect', function() { // When connected
    // publish a message to any mqtt topic
    let color = '1024,0,1024,1';
    // let color = '1024,1024,0,1';

    client.publish("colorPattern/start", "0");
    client.publish("colorPattern", color);
    client.publish("colorPattern/end", "0");
    client.end()
    resolve('Done Sending');
  });
});

mqttpromise.then(
  function(data) {
    console.log('Function called succesfully:', data);
  },
  function(err) {
    console.log('An error occurred: when connection/sending', err);
  }
);

