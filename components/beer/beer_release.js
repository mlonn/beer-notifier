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
        id: sales_start.split("T")[0],
        beers: [beer],
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
        `${title} släpps ${
          weekday[date.getDay()]
        } ${date.getDate()}/${date.getMonth() + 1}`
      );
      if (release.beers[0] === beer) {
        const link = `https://www.systembolaget.se/sok/?categoryLevel1=%C3%96l&productLaunchFrom=${release.id}&productLaunchTo=${release.id}`;
        attachment.pretext = `<${link}|*${
          weekday[date.getDay()]
        } ${date.getDate()}/${date.getMonth() + 1}*>`;
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
        new Field(`${beer.price} SEK`, true)
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

function getMessages(releases) {
  const messages = [];
  for (const release of releases) {
    const date = new Date(release.id);
    const link = `https://www.systembolaget.se/sok/?categoryLevel1=%C3%96l&productLaunchFrom=${release.id}&productLaunchTo=${release.id}`;

    const message = {
      text: `<${link}|*${
        weekday[date.getDay()]
      } ${date.getDate()}/${date.getMonth() + 1}*>`,
    };

    messages.push(message);
  }

  return messages;
}
function getNewReleases(from, controller, callback) {
  getBeerReleases(from, null, (releases) => {
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

function normalizeModel(systembolaget) {
  const {
    productLaunchDate: sales_start,
    productNameBold: name,
    productNameThin: additional_name,
    productNumber: nr,
    alcoholPercentage: alcohol,
    categoryLevel2: type,
    categoryLevel3: style,
    price,
    producerName: producer
  } = systembolaget;
  const bolagetIO = {
    sales_start,
    name,
    additional_name,
    nr,
    type,
    style,
    alcohol,
    producer,
    price,
    ...systembolaget,
  };
  return bolagetIO;
}

function getBeerReleases(from, to, callback) {
  const url = urlFromDate(from, to);
  console.log({url});
  request(
    url,
    {
      url,
      headers: {
        "ocp-apim-subscription-key": "874f1ddde97d43f79d8a1b161a77ad31",
      },
    },
    (err, res, body) => {
      const unreleased_beers = JSON.parse(body);
      const releases = getReleases(
        unreleased_beers.products
          .filter((p) => p.categoryLevel1 === "Öl")
          .map(normalizeModel)
      );
      callback(releases);
    }
  ).end();
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
    return `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=3000&categoryLevel1=%C3%96l&productLaunch.min=${sales_start_from}&productLaunch.max=${sales_start_to}&isEcoFriendlyPackage=false&isInDepotStockForFastDelivery=false`;
  }
  return `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=3000&categoryLevel1=%C3%96l&productLaunch.min=${sales_start_from}&isEcoFriendlyPackage=false&isInDepotStockForFastDelivery=false`;
}

module.exports = {
  getMessages,
  getBeerReleases,
  getAttachments,
  getNewReleases,
};
