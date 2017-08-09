const request = require("request-promise-native");
const json = require("json");

const weekday = new Array(7);
weekday[0] = "Söndag";
weekday[1] = "Måndag";
weekday[2] = "Tisdag";
weekday[3] = "Onsdag";
weekday[4] = "Torsdag";
weekday[5] = "Fredag";
weekday[6] = "Lördag";

const Field = function(value, short) {
  this.value = value;
  this.short = short;
};

const Attachment = function(fallback) {
  this.fallback = fallback;
  this.color = "#36a64f";
  this.fields = [];
  this.mrkdwn_in = ["text", "fields", "pretext"];
};

function getReleases(beers) {
  const releases = [];
  let sales_start = "";
  let release;
  for (const beer of beers) {
    beer.beer_type = beer.type;
    beer.type;
    if (sales_start !== beer.sales_start) {
      sales_start = beer.sales_start;
      release = {
        id: sales_start,
        beers: [beer]
      };
      releases.push(release);
    } else {
      release.beers.push(beer);
    }
  }
  return releases;
}

function getAttachments(releases) {
  const attachments = [];
  for (const release of releases) {
    for (const beer of release.beers) {
      const date = new Date(release.id);
      let title = "";
      if (beer.additional_name) {
        title = `${beer.name} ${beer.additional_name}`;
      } else {
        title = `${beer.name}`;
      }
      const attachment = new Attachment(
        `${title} släpps ${weekday[
          date.getDay()
        ]} ${date.getDate()}/${date.getMonth() + 1}`
      );
      if (release.beers[0] === beer) {
        const link = `https://www.systembolaget.se/sok-dryck/?sellstartdatefrom=${release.id}&sellstartdateto=${release.id}&subcategory=%C3%96l&fullassortment=1`;
        attachment.pretext = `<${link}|*${weekday[
          date.getDay()
        ]} ${date.getDate()}/${date.getMonth() + 1}*>`;
      }
      attachment.title = title;
      attachment.title_link = `https://systembolaget.se/${beer.nr}`;
      attachment.id = `${beer.nr}`;
      attachment.fields.push(new Field("*Typ*: ", true));
      attachment.fields.push(new Field(`${beer.type}`, true));
      attachment.fields.push(new Field("*Stil*: ", true));
      if (beer.style) {
        attachment.fields.push(new Field(`${beer.style}`, true));
      } else {
        attachment.fields.push(new Field("-", true));
      }
      attachment.fields.push(new Field("*Pris*: ", true));
      attachment.fields.push(
        new Field(`${beer.price.amount} ${beer.price.currency}`, true)
      );
      attachment.fields.push(new Field("*Alkohol*:", true));
      attachment.fields.push(new Field(`${beer.alcohol}`, true));
      attachment.fields.push(new Field("*Bryggeri*: ", true));
      attachment.fields.push(new Field(`${beer.producer}`, true));
      attachments.push(attachment);
    }
  }

  return attachments;
}

function getNewReleases(from, callback, controller) {
  getBeerReleases(from, null, releases => {
    let releaseDates = [];
    if (releases.length > 0) {
      for (const release of releases) {
        releaseDates.push(release.id);
      }

      controller.storage.releases.find(
        { id: { $in: releaseDates } },
        (err, storedReleases) => {
          if (storedReleases) {
            for (const storedRelease of storedReleases) {
              for (const release of releases) {
                if (release.id === storedRelease.id) {
                  releases.splice(releases.indexOf(release), 1);
                }
              }
            }
          }

          for (const release of releases) {
            controller.storage.releases.save(release);
          }
          callback(releases);
        }
      );
    }
  });
}

function getBeerReleases(from, to, callback) {
  const url = urlFromDate(from, to);
  request(url, (err, res, body) => {
    const unreleased_beers = JSON.parse(body);
    const releases = getReleases(unreleased_beers);
    callback(releases);
  }).end();
}

function getDateString(date) {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  day = day < 10 ? `0${day}` : day;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}-${day}`;
}

function urlFromDate(from, to) {
  const sales_start_from = getDateString(from);
  if (to !== null) {
    const sales_start_to = getDateString(to);
    return `https://bolaget.io/products?product_group=Öl&sort=sales_start:asc&sales_start_from=${sales_start_from}&sales_start_to=${sales_start_to}&limit=100`;
  }
  return `https://bolaget.io/products?product_group=Öl&sort=sales_start:asc&sales_start_from=${sales_start_from}&limit=100`;
}

module.exports = { getBeerReleases, getAttachments, getNewReleases };
