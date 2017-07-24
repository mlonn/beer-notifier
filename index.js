'use strict';
const http = require("http");
const schedule = require('node-schedule')
const beer = require('./beer-release')
const express = require('express');
var app = express();
var Router = express.Router


app.set('port', (process.env.PORT || 5000));
app.set('url', (process.env.APP_URL) || 'localhost:'+app.get('port'))
app.get('/', function (req, res) {
  res.send('Beer')
})
app.get('/release', function (req, res) {
  res.send('release')
})
var server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

const rule = new schedule.RecurrenceRule()
rule.dayOfWeek = 0
rule.hour = 12
rule.minute = 0
rule.second = 0
const j = schedule.scheduleJob(rule, function(err) {
  if (err) {
    console.log(err)
  }
  const from = new Date()
  const to = new Date()
  to.setDate(from.getDate()+8)
  beer.getBeerReleases(from, to)
})
function refresh() {
  var url = 'http://' + app.get('url')
    http.get(url, (res) => {
        const { statusCode } = res;
        console.log('GET: ' + statusCode + ' -> ' + url )
    });
}
refresh()
setInterval(refresh, 300000); // every 5 minutes (300000)
