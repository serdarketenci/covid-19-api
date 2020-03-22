var axios = require("axios");
var cheerio = require("cheerio");
const csv = require('csvtojson')

var base = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/"

var historical = async (keys, redis) => {
  let casesResponse, deathsResponse, recResponse;
  const date = new Date();
  try {
    casesResponse = await axios.get(`${base}time_series_19-covid-Confirmed.csv`);
    deathsResponse = await axios.get(`${base}time_series_19-covid-Deaths.csv`);
    recResponse = await axios.get(`${base}time_series_19-covid-Recovered.csv`);
  } catch (err) {
    console.log(err)
    return null;
  }

  const parsedCases = await csv({
    noheader: true,
    output: "csv"
  }).fromString(casesResponse.data);

  const parsedDeaths = await csv({
    noheader: true,
    output: "csv"
  }).fromString(deathsResponse.data);

  const recParsed = await csv({
    noheader: true,
    output: "csv"
  }).fromString(recResponse.data);

  // to store parsed data
  const result = [];
  const timelineKey = parsedCases[0].splice(4);
  parsedCases.pop()
  parsedDeaths.pop()
  recParsed.pop()

  console.log(timelineKey);

  for (let index = 0; index < timelineKey.length; index++) {
    const countries = [];


    for (let b = 1; b < parsedDeaths.length;) {
      var countryIndex = countries.findIndex(function (c) {
        return c.country == parsedCases[b][1]
      });
      if (countryIndex == -1) {
        countries.push({
          country: parsedCases[b][1],
          cases: parseInt(parsedCases[b][4 + index]),
          deaths: parseInt(parsedDeaths[b][4 + index]),
          recovered: parseInt(recParsed[b][4 + index])
        });
      }
      else {
        countries[countryIndex].cases += parseInt(parsedCases[b][4 + index]);
        countries[countryIndex].deaths += parseInt(parsedDeaths[b][4 + index]);
        countries[countryIndex].recovered += parseInt(recParsed[b][4 + index]);
      }
      b++;
    }

    // countries.sort(function (a, b) {
    //   if (a.cases > b.cases) return -1;
    //   if (b.cases > a.cases) return 1;

    //   return 0;
    // });

    result.push({
      date: timelineKey[index],
      countries: countries //.slice(0, 15)
    });
  }


  const string = JSON.stringify(result);
  redis.set(keys.timeline, string);
  console.log(`Updated JHU CSSE Historical: ${result.length} locations`);
}

module.exports = historical;