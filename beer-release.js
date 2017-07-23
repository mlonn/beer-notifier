'use strict';
const dotenv = require('dotenv').config()
const request = require('request')
const Botkit = require('botkit')
const json = require('json')
const controller = Botkit.slackbot({})
const weekday = new Array(7);
weekday[0] =  "Söndag";
weekday[1] = "Måndag";
weekday[2] = "Tisdag";
weekday[3] = "Onsdag";
weekday[4] = "Torsdag";
weekday[5] = "Fredag";
weekday[6] = "Lördag";
const bot = controller.spawn({
    incoming_webhook: {
        url: process.env.SLACK_WEBHOOK
    }
})
function getReleases(unreleased_beers) {
  var attatchments = []
  var releases = {}
  var sales_start = ""
  var text = ""
  for (var beer in unreleased_beers) {
        if (sales_start !== unreleased_beers[beer].sales_start) {
          sales_start = unreleased_beers[beer].sales_start
          releases[sales_start] = [unreleased_beers[beer]]
        } else {
          releases[sales_start].push(unreleased_beers[beer])
        }
  }
  for (var release in releases) {
    var attatchment = {
            fallback: "Beer releases",
            color: "#36a64f",
            footer: "systemet-notifier",
            mrkdwn_in: ["text","fields"],
        }
    var date = new Date(release)
    attatchment.title = weekday[date.getDay()] + ' ' + date.getDate()+'/'+(date.getMonth()+1) + ' \n'
    var fields = []
    attatchment.fields = fields
    for (var beer in releases[release]) {
      var beerfield={}
      if (releases[release][beer].additional_name) {
        beerfield.title = releases[release][beer].name + " " + releases[release][beer].name + '\n'
      } else {
        beerfield.title = releases[release][beer].name + '\n'
      }
      var value = ""
       value += '*Typ*: ' + releases[release][beer].type + '\n'
      if (releases[release][beer].style) {
        value += '*Stil*: ' + releases[release][beer].style + '\n'
      }
      value += '*Pris*: ' + releases[release][beer].price.amount + " " + releases[release][beer].price.currency + '\n'
      value += '*Alkohol*: ' + releases[release][beer].alcohol + '\n'
      value += '*Bryggeri*: ' + releases[release][beer].producer + '\n'
      value += 'https://systembolaget.se/'+releases[release][beer].nr + '\n'
      value += "" + '\n'
      beerfield.value = value
      fields.push(beerfield)
    }
    attatchment.fields = fields
    attatchments.push(attatchment)
  }
  return attatchments
}
function weeklyBeer() {
    const date = new Date()
    var nextDate = new Date()
    nextDate.setDate(date.getDate()+8)
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var nextYear = nextDate.getFullYear()
    var nextMonth = nextDate.getMonth() + 1
    var nextDay = nextDate.getDate()

    day = day < 10 ? '0' + day : day
    month = month < 10 ? '0' + month : month
    nextDay = nextDay < 10 ? '0'+nextDay : nextDay
    nextMonth = nextMonth < 10 ? '0'+nextMonth : nextMonth

    var sales_start_from = year + '-' + month + '-' + day
    var sales_start_to = nextYear + '-' + nextMonth + '-' + nextDay
    var url = "https://bolaget.io/products?product_group=Öl&sort=sales_start:desc&sales_start_from=" + sales_start_from + "&sales_start_to=" + sales_start_to + "&limit=100"

    request(url, function(err, res, body) {
      var unreleased_beers = JSON.parse(body);
      if (unreleased_beers.length > 0) {
        var text = '*Det kommer ny öl den här veckan!*\n\n'
        var releases = getReleases(unreleased_beers)
      } else {
        var text = "Ingen öl denna vecka :cry:"
      }

      

        bot.sendWebhook({
          text: text,
          attachments: releases,
          ts: new Date()
        }, function(err) {
            if (err) {
                console.log(err)
            } else console.log('message sent!');
        });
    })


}

module.exports = {weeklyBeer}
