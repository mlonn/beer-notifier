'use strict';
const http = require("http");
const schedule = require('node-schedule')
const newBeer = require('./newBeer')
const express = require('express');
var app = express();



app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
  console.log(fullUrl)
  res.send('Beer')
})

var server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

const rule = new schedule.RecurrenceRule()
rule.day = 0
rule.hour = 12
rule.minute = 0
rule.second = 0
const j = schedule.scheduleJob(rule, function(err) {
  if (err) {
    console.log(err)
  }
  newBeer()
  console.log("works")
})
function refresh() {
  console.log(server.address().address)
    http.get("http://systemet-notifier.herokuapp.com", (res) => {
        const { statusCode } = res;
        console.log(statusCode);
    });
}
newBeer()
refresh()
setInterval(refresh, 300000); // every 5 minutes (300000)
