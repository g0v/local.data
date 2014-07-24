# Open Data Census

[![Build Status](https://travis-ci.org/okfn/opendatacensus.png?branch=master)](https://travis-ci.org/okfn/opendatacensus)

Webapp for doing [Open Data Censuses][] including submission workflow,
presentation of results and some visualization.

[Open Data Censuses]: http://census.okfn.org/

This also includes various ancillary information providing an overview of what
is happening with release of open government data around the world (and
initiatives related to it).

## Demo Site

If you want to check out what an Open Data Census site looks like we have a
demo site running at:

<http://demo.census.okfn.org/>

## Overview

See: <http://meta.census.okfn.org/doc/>

### Developer Stuff

The app is a simple Express NodeJS app designed to be deployed on Heroku.

Config boot sequence:

* App boots and looks up local config (set by census deployer)
* Looks up environment variable `CONFIG_URL` (plus sensitive config like DB
  login)
* Loads CSV file at `CONFIG_URL` - this file has pointers to all other config
  information (see below for a template)
* Loads all other config CSV files (Places, Datasets, Questions)

### Auth

For user Auth we use Google and their OAuth 2.0.

you will need to create an App on Facebook developers section
and set various config. See config section below for detail.

------

## Developing the Code

### Install Locally

To install do the following:

1. Get the code

        git clone https://github.com/okfn/opendatacensus

2. Install node dependencies

        cd opendatacensus
        npm install .

3. Run the app

        node run.js

4. Should now be running at <http://localhost:5000>


### Configuration

Core configuration is listed in lib/config.js which loads from environment
variables and then via `lib/util.js` `load` method to pull in config from CSV
files.


#### Over-riding for development

For convenience when doing local development, you can selectively override your
own local config using a `settings.json` as follows:

* Create `settings.json`
* Copy the config object from lib/config.js and override relevant parts. Note
  you don't need the whole object only the bits you want to change. For example:

        {
          "google": {
            "user": "xxx",
            "password": "yyy"
          }
        }

Note this will **not** work for Heroku - instead you need to do everything via
environment variables: https://devcenter.heroku.com/articles/config-vars

### i18n For Templates

When templates change, the translations have to be changed. Extract the files by running this command:

    ./node_modules/.bin/extract-pot --output=../messages.pot --locale locale -t jinja -f html templates

You will need the GNU gettext commands. See [here](https://github.com/mozilla/i18n-abide/blob/master/docs/GETTEXT.md) for more information.

To update the existing .po files, run:

    ./node_modules/.bin/merge-po locale

To add a new language, copy the `locale/en` directory to `locale/[language-code]`.

### i18n For Config

Any column can be internationalised by adding another column with `@locale` after it. For example, the `description` column can be translated to German by adding a column of `description@de`. Only languages which have template translations created for them are valid. The `locales` setting in the config document can be used to restrict the number of locales available. The first locale in the list is the default locale.

### Running Tests

* Install dev dependencies and mocha - `npm install -d`
* Get the opendatacensustest google user login and add to `settings.json`

Then run the tests:

    mocha tests/

------

## Heroku Deployment

We have multiple apps on Heroku including:

* Production: `opendatacensus` - push there from production branch
* Staging: `opendatacensus-staging` - push from master

To work with a given remote:

    heroku --remote production ...

To work with these do:

    heroku git:remote -r production -a opendatacensus
    heroku git:remote -r staging -a opendatacensus-staging
    # this way git push heroku master will push to staging
    heroku git:remote -a opendatacensus-staging

To avoid error suggest making the staging app the default:

    git config heroku.remote staging

## Appendix - Why Google Spreadsheets for the DB

Pros

* being easy to hand-edit and view (esp for non-techies)
* multiple formats
* versioned (so all changes are recorded)

Cons

* Google Spreadsheets has limited storage (400k cells etc). However, our data
  requirements are usually quite limited for each census.

