var _ = require('underscore');

var OpenDataCensus = {};

OpenDataCensus.questions =  [
  'timestamp',
  'country',
  'dataset',
  'exists',
  'digital',
  'machinereadable',
  'bulk',
  'public',
  'openlicense',
  'uptodate',
  'url',
  'dateavailable',
  'details',
  'submitter',
  'submitter-url',
  'reviewed'
];

var openQuestions = OpenDataCensus.questions.slice(3,9);

OpenDataCensus.dataCatalogsUrl = "https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE#gid=1";

OpenDataCensus.censusDatasets = [
  'Election Results (national)',
  'Company Register',
  'National Map (Low resolution: 1:250,000 or better)',
  'Government Budget (National, high level, not detailed)',
  'Government Spending (National, transactional level data)',
  'Legislation (laws and statutes) - National',
  'National Statistical Data (economic and demographic information)',
  'National Postcode/ZIP database',
  'Public Transport Timetables',
  'Environmental Data on major sources of pollutants (e.g. location, emissions)'
];

exports.OpenDataCensus = OpenDataCensus;

OpenDataCensus.data = {
  country: {
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv',
    // authoratative set
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE&single=true&gid=6&output=csv',
// dataset info looks like
// 
//  { ID: 'energy',
//    Dataset: 'Energy Consumption ',
//    Category: 'Energy',
//    Description: 'Real time usage of energy in city and trends over time.',
//  }
    datasets: [],
    // array of hashes each hash having question keys
    results: []
  },
  city: {
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv',
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc&single=true&gid=0&output=csv',
    datasets: [],
    results: []
  }
}

var request = require('request');
var csv = require('csv');

function getCsvData(url, cb) {
  var data = [];
  csv()
    .from.stream(request(url),
        {columns: true})
    .on('record', function(record, idx) {
      // lower case all keys
      for (key in record) {
        record[key.toLowerCase()] = record[key];
        if (key.toLowerCase() != key) {
          delete record[key];
        }
      }
      // weird issues with google docs and newlines resulted in some records getting "wrapped"
      if (record.dataset.indexOf('http') != -1) {
        console.error('bad');
        console.error(record);
      }
      data.push(record);
    })
    .on('end', function() {
      cb(data);
    })
    ;
}

OpenDataCensus.load = function(cb) {
  var count = 4;
  function done() {
    count -= 1;
    if (count == 0) {
      cb();
    }
  }
  getCsvData(OpenDataCensus.data.country.datasetsUrl, function(data) {
    OpenDataCensus.data.country.datasets = data.slice(0,10);
    done();
  });
  getCsvData(OpenDataCensus.data.country.resultsUrl, function(data) {
    var results = cleanUpCountry(data);
    OpenDataCensus.data.country.results = results;
    OpenDataCensus.data.country.countries = _.uniq(_.map(results, function(r) {
      return r['country'];
    }));
    var bydataset = byDataset(results);
    OpenDataCensus.data.country.bydataset = bydataset;
    var summary = getSummaryData(results);
    summary.countries = OpenDataCensus.data.country.countries.length;
    OpenDataCensus.data.country.summary = summary;
    done();
  });
  getCsvData(OpenDataCensus.data.city.datasetsUrl, function(data) {
    OpenDataCensus.data.city.datasets = data.slice(0,15) 
    done();
  });
  getCsvData(OpenDataCensus.data.city.datasetsUrl, function(data) {
    OpenDataCensus.data.city.results = [];
    done();
  });
};

// TODO: dedupe etc
function cleanUpCountry(rawdata) {
  var correcter = {
    'Yes': 'Y',
    'No': 'N',
    'No ': 'N',
    'Unsure': '?'
  };
  var ynquestions = OpenDataCensus.questions.slice(3, 10);
  return rawdata.map(function(record) {
    ynquestions.forEach(function(question) {
      record[question] = correcter[record[question]]
      if (record[question] == undefined) {
        console.error(record);
      }
    });
    record.ycount = scoreOpenness(record);
    // Data is exists, is open, and publicly available, machine readable etc
    record.isopen = 
      (record['exists'] == 'Y') &&
      (record['openlicense'] == 'Y') && 
      (record.public == 'Y') &&
      (record['machinereadable'] == 'Y')
      ;
    return record;
  });
}

// data keyed by dataset then country
function byDataset(data) {
  var datasets = {};
  var countryNames = _.uniq(_.map(data, function(r) {
    return r['country'];
  }));
  function makeCountryDict () {
    var _out = {};
    _.each(countryNames, function(ds) {
      _out[ds] = null;
    });
    return _out;
  }
  _.each(data, function(row) {
      datasets[row['dataset']] = makeCountryDict();
  });
  _.each(data, function(row) {
    var c = row['country'];
    var d = row['dataset'];
    datasets[d][c] = row;
  });

  return datasets;
}

getSummaryData = function(results) {
  var open = 0;
  var nokpercent = 0;
  _.each(results, function (r) {
    if (r.isopen) {
      open++;
    }
  });
  nokpercent = Math.round(100 * open / results.length);
  return {
    entries: results.length,
    open: open,
    open_percent: nokpercent
  };
};

function scoreOpenness(response) {
  var score=0;
  _.each(openQuestions, function(key) {
    if (response[key]=='Y') {
      score++;
    }
  });
  return score;
}

// OpenDataCensus.load(function() {});
