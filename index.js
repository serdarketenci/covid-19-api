var express = require('express');
var app = express();
var axios = require("axios");
var cheerio = require("cheerio");
var cors = require('cors');
const config = require('./config.json');
const Redis = require('ioredis');
const scraper = require('./scraper');

app.use(cors());

// create redis instance :O
// const redis = new Redis(config.redis.host, {
//   password: config.redis.password,
//   port: config.redis.port
// })

var redis = new Redis(process.env.REDIS_URI || config.redis.uri);


const keys = config.keys;

const execAll = () => {
    scraper.getCountries(keys, redis);
    scraper.getAll(keys, redis);
    scraper.getStates(keys, redis);
    scraper.jhuLocations(keys, redis);
    scraper.historical(keys, redis);
    scraper.timeline(keys, redis);
};
execAll()
setInterval(execAll, config.interval);

app.get("/", async function (request, response) {
  response.redirect('https://github.com/serdarketenci/spfx-react-covid-19');
});
var listener = app.listen(process.env.PORT || 5000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
app.get("/all/", async function (req, res) {
  let all = JSON.parse(await redis.get(keys.all))
  res.send(all);
});
app.get("/countries/", async function (req, res) {
  let countries = JSON.parse(await redis.get(keys.countries))
  res.send(countries);
});
app.get("/states/", async function (req, res) {
  let states = JSON.parse(await redis.get(keys.states))
  res.send(states);
});

app.get("/jhucsse/", async function (req, res) {
  let data = JSON.parse(await redis.get(keys.jhu))
  res.send(data);
});

app.get("/historical/", async function (req, res) {
  let data = JSON.parse(await redis.get(keys.historical))
  res.send(data);
});

app.get("/timeline/", async function (req, res) {
  let data = JSON.parse(await redis.get(keys.timeline))
  res.send(data);
});

app.get("/countries/:country", async function (req, res) {
  let countries = JSON.parse(await redis.get(keys.countries))
  let country = countries.find(
    e => e.country.toLowerCase().includes(req.params.country.toLowerCase())
  );
  if (!country) {
    res.send("Country not found");
    return;
  }
  res.send(country);
});
