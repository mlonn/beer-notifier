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
const field = function(value, short) {
  this.value = value
  this.short = short
}

const attachment = function(fallback) {
  this.fallback = fallback
  this.color = "#36a64f"
  this.fields = []
  this.mrkdwn_in = ["text","fields","pretext"]
}
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
    for (var beer in releases[release]) {
      var date = new Date(release)
      var title = ""
      if (releases[release][beer].additional_name) {
        title = releases[release][beer].name + " " + releases[release][beer].name + '\n'
      } else {
        title = releases[release][beer].name + '\n'
      }
      var attatchment = new attachment(title + 'släpps' + weekday[date.getDay()] + ' ' + date.getDate()+'/'+(date.getMonth()+1))
      if (releases[release][0] == releases[release][beer]) {
        var link = 'https://www.systembolaget.se/sok-dryck/?sellstartdatefrom='+release+'&sellstartdateto='+release+'&subcategory=%C3%96l&fullassortment=1'

        attatchment.pretext = '<'+link+'|*' + weekday[date.getDay()] + ' ' + date.getDate()+'/'+(date.getMonth()+1) + '*>'
      }
      attatchment.title = title
      attatchment.title_link = "https://systembolaget.se/"+releases[release][beer].nr
      attatchment.fields.push(new field('*Typ*: ', true))
      attatchment.fields.push(new field(releases[release][beer].type + '\n',true))
      attatchment.fields.push(new field('*Stil*: ',true))
      if (releases[release][beer].style) {
        attatchment.fields.push(new field(releases[release][beer].style + '\n',true))
      } else {
        attatchment.fields.push(new field('-',true))
      }
      attatchment.fields.push(new field('*Pris*: ',true))
      attatchment.fields.push(new field(releases[release][beer].price.amount + " " + releases[release][beer].price.currency + '\n',true))
      attatchment.fields.push(new field('*Alkohol*:',true))
      attatchment.fields.push(new field(releases[release][beer].alcohol + '\n',true))
      attatchment.fields.push(new field('*Bryggeri*: ',true))
      attatchment.fields.push(new field(releases[release][beer].producer + '\n',true))
      attatchments.push(attatchment)
    }
  }
  return attatchments
}
function getBeerReleases(from,to) {
    var year = from.getFullYear()
    var month = from.getMonth() + 1
    var day = from.getDate()
    var nextYear = to.getFullYear()
    var nextMonth = to.getMonth() + 1
    var nextDay = to.getDate()

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
        var text = '*Det kommer ny öl den här veckan! :beer:*\n\n'
        var releases = getReleases(unreleased_beers)
      } else {
        var text = "Ingen öl denna vecka :cry:"
      }
      bot.sendWebhook({
        text: text,
        attachments: releases
      }, function(err) {
          if (err) {
              console.log(err)
          } else console.log('message sent!');
      });
    });
}

module.exports = {getBeerReleases}
