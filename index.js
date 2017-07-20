'use strict';
const http = require("http");
const schedule = require('node-schedule')
const newBeer = require('./newBeer')
const express = require('express');
var app = express();



app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
  res.send('Beer')
})

app.listen(app.get('port'), function() {
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

newBeer()
setInterval(function() {
    http.get("http://systemet-notifier.herokuapp.com", (res) => {
        const { statusCode } = res;
        console.log(statusCode);
    });
}, 300000); // every 5 minutes (300000)

console.log('Messages scheduled for Mondays at 8am!')
