'use strict';
require('dotenv').config()
const http = require("http");
const schedule = require('node-schedule')
const beer = require('./beer-release')
const Botkit = require('botkit')


const mongoose = require('mongoose')

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI)

const controller = Botkit.slackbot({})

controller.startTicking()
const bot = controller.spawn({
    incoming_webhook: {
        url: process.env.SLACK_WEBHOOK
    }
})

const express = require('express')
var app = express();


app.set('port', (process.env.PORT || 5000));
app.set('url', (process.env.APP_URL) || 'localhost:'+app.get('port'))
app.get('/', function (req, res) {
  res.send('Beer')
})

app.get('/release', function (req, res) {
})


var server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

const weeklyrule = new schedule.RecurrenceRule()
weeklyrule.dayOfWeek = 0
weeklyrule.hour = 12
weeklyrule.minute = 0
weeklyrule.second = 0
const weeklyReminder = schedule.scheduleJob(weeklyrule, function(err) {
  if (err) {
    console.log(err)
  }
  const from = new Date()
  const to = new Date()
  to.setDate(from.getDate()+8)
  beer.getBeerReleases(from, to)
})
const dailyrule = new schedule.RecurrenceRule()
dailyrule.hour = 12
dailyrule.minute = 0
dailyrule.second = 0
const dailyUpdate = schedule.scheduleJob(dailyrule, function(err) {
  if (err) {
    console.log(err)
  }
  beer.checkNewReleases(new Date(), sendMessage);
})

function refresh() {
  var url = 'http://' + app.get('url')
    http.get(url, (res) => {
        const { statusCode } = res;
        console.log('GET: ' + statusCode + ' -> ' + url )
    });
}
function sendMessage(releases) {
  var attachments = beer.getAttachments(releases)
  if (attachments.length > 0) {
    var timestamp = (new Date).getTime()/1000;
    bot.sendWebhook({
      attachments: attachments,
      ts: timestamp
    }, function(err, res) {
      console.log(res)
        if (err) {
          console.log(err)
        } else {
          console.log('message sent!');
        }
    });
  }
}
refresh()
setInterval(refresh, 300000); // every 5 minutes (300000)
