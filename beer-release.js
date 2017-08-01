'use strict';
const request = require('request-promise-native')
const json = require('json')
const ReleaseModel = require('./beerReleaseModel')
const weekday = new Array(7);
weekday[0] =  "Söndag";
weekday[1] = "Måndag";
weekday[2] = "Tisdag";
weekday[3] = "Onsdag";
weekday[4] = "Torsdag";
weekday[5] = "Fredag";
weekday[6] = "Lördag";



const Field = function(value, short) {
  this.value = value
  this.short = short
}

const Attachment = function(fallback) {
  this.fallback = fallback
  this.color = "#36a64f"
  this.fields = []
  this.mrkdwn_in = ["text","fields","pretext"]
}

const Release = function(release) {
  this.release = release
  this.beers = []
}

function getReleases(unreleased_beers) {
  var releases = []
  var sales_start = ""
  var release
  for (var beer in unreleased_beers) {
      unreleased_beers[beer].beer_type = unreleased_beers[beer].type
      unreleased_beers[beer].type
      if (sales_start !== unreleased_beers[beer].sales_start) {
        sales_start = unreleased_beers[beer].sales_start
        release = new Release(sales_start)
        releases.push(release)

        release.beers = [unreleased_beers[beer]]
      } else {
        release.beers.push(unreleased_beers[beer])
      }
  }
  return releases
}

function getAttachments(releases) {
  var attachments = []
  for (var release in releases) {
    for (var beer in releases[release].beers) {
      var date = new Date(releases[release].release)
      var title = ""
      if (releases[release].beers[beer].additional_name) {
        title = releases[release].beers[beer].name + " " + releases[release].beers[beer].additional_name + '\n'
      } else {
        title = releases[release].beers[beer].name + '\n'
      }
      var attachment = new Attachment(title + 'släpps' + weekday[date.getDay()] + ' ' + date.getDate()+'/'+(date.getMonth()+1))

      if (releases[release].beers[0] == releases[release].beers[beer]) {
        var link = 'https://www.systembolaget.se/sok-dryck/?sellstartdatefrom='+releases[release].release+'&sellstartdateto='+releases[release].release+'&subcategory=%C3%96l&fullassortment=1'
        attachment.pretext = '<'+link+'|*' + weekday[date.getDay()] + ' ' + date.getDate()+'/'+(date.getMonth()+1) + '*>'
      }
      attachment.title = title
      attachment.title_link = "https://systembolaget.se/"+releases[release].beers[beer].nr
      attachment.fields.push(new Field('*Typ*: ', true))
      attachment.fields.push(new Field(releases[release].beers[beer].type + '\n',true))
      attachment.fields.push(new Field('*Stil*: ',true))
      if (releases[release].beers[beer].style) {
        attachment.fields.push(new Field(releases[release].beers[beer].style + '\n',true))
      } else {
        attachment.fields.push(new Field('-',true))
      }
      attachment.fields.push(new Field('*Pris*: ',true))
      attachment.fields.push(new Field(releases[release].beers[beer].price.amount + " " + releases[release].beers[beer].price.currency + '\n',true))
      attachment.fields.push(new Field('*Alkohol*:',true))
      attachment.fields.push(new Field(releases[release].beers[beer].alcohol + '\n',true))
      attachment.fields.push(new Field('*Bryggeri*: ',true))
      attachment.fields.push(new Field(releases[release].beers[beer].producer + '\n',true))
      attachments.push(attachment)
    }
  }
  return attachments
}

function checkNewReleases(from, callback) {
  getBeerReleases(from,null,function(releases) {

      var datestring = getDateString(from)
      var newReleases = []
      for (var release in releases) {
        newReleases.push(releases[release].release);
        console.log(releases[release].release)
      }
      //release:releases[release].release
      ReleaseModel.find({release: {$in: newReleases}}, function(err, response) {
        console.log(response)
        console.log(releases.length)
        for (var res in response) {
          for(var rel in releases) {
            if (releases[rel].release == response[res].release) {
              releases.splice(rel,1);
            }
          }
        }

        for (var rel in releases) {
          var newRelease = new ReleaseModel({release: releases[rel].release})
          newRelease.save()
        }

        console.log(releases.length)
        if(releases.length > 0){
          callback(releases)
        }
      });
  })

}

function getBeerReleases(from,to, callback) {
      var url = urlFromDate(from,to)
      request(url, function(err, res, body) {
        var unreleased_beers = JSON.parse(body);
        var releases = getReleases(unreleased_beers)
        callback(releases)
    }).end();

}

function getDateString(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  day = day < 10 ? '0' + day : day
  month = month < 10 ? '0' + month : month
  return year + '-' + month + '-' + day
}

function urlFromDate(from,to){
  var sales_start_from = getDateString(from)
  if (to !== null) {
    var sales_start_to = getDateString(to)
    return "https://bolaget.io/products?product_group=Öl&sort=sales_start:asc&sales_start_from=" + sales_start_from + "&sales_start_to=" + sales_start_to +"&limit=100"
  } else {
    return "https://bolaget.io/products?product_group=Öl&sort=sales_start:asc&sales_start_from=" + sales_start_from + "&limit=100"
  }

}

module.exports = {getBeerReleases, getAttachments, checkNewReleases}
