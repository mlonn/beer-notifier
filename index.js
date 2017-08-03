require("dotenv").config();
const Botkit = require("botkit");
const mongoose = require("mongoose");
const schedule = require("node-schedule");
const beer = require("./components/beer/beer_release");

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

const botOptions = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  //debug: true,
  scopes: [
    "bot",
    "incoming-webhook",
    "channels:history",
    "groups:history",
    "im:history",
    "mpim:history"
  ]
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGODB_URI) {
  const mongoStorage = require("botkit-storage-mongo")({
    mongoUri: process.env.MONGODB_URI
  });
  botOptions.storage = mongoStorage;
} else {
  botOptions.json_file_store = `${__dirname}/.data/db/`; // store user data in a simple JSON format
}

const controller = Botkit.slackbot(botOptions);

controller.startTicking();

const webserver = require(`${__dirname}/components/express_webserver.js`)(
  controller
);

require(`${__dirname}/components/keep_alive.js`)(webserver);
// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require(`${__dirname}/components/user_registration.js`)(controller);

// Send an onboarding message when a new team joins
require(`${__dirname}/components/onboarding.js`)(controller);

require(`${__dirname}/components/join.js`)(controller);

const normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(file => {
  require(`./skills/${file}`)(controller);
});

require(`${__dirname}/components/beer/beer_reminders`)(controller);
