var request = require('request-json');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var fs = require('fs')
var sha1 = require('sha1')

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), insertEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth.GoogleAuth();
    var oauth2Client = new googleAuth.OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertEvents(auth) {
    var client = request.createClient('http://sueurdemetal.com')
    var data = { region: 12 }
    var calendar = google.calendar('v3');
    client.post('/func/funcGetEventRegion.php', data, async function (err, res, body) {
        res = body.results.collection1

        for (let i = 0; i < res.length; i++) {
            var details = res[i].groupes.map(g => g.NomGroupe).join(' + ')
            await sleep(200);
            calendar.events.get({
                auth: auth,
                calendarId: 'mbc5o4dl4p8uvt8rgl6v9u3ld0@group.calendar.google.com',
                eventId: sha1(res[i].groupes.map(g => g.NomGroupe).join(' + ') + res[i].ville + ' ' + res[i].datetimestamp).toLowerCase(),
            }, function (err, response) {
                if (err) {
                    sleep(200);
                    var event = {
                        'summary': res[i].groupes.map(g => g.NomGroupe).join(' + '),
                        'location': res[i].ville,
                        'description': res[i].groupes.map(g => g.NomGroupe).join(' + '),
                        'start': {
                            'dateTime': new Date(res[i].datetimestamp * 1000),
                            'timeZone': 'Europe/Paris',
                        },
                        'end': {
                            'dateTime': new Date(res[i].datetimestamp * 1000).addHours(3),
                            'timeZone': 'Europe/Paris',
                        },
                        'recurrence': [
                        ],
                        'attendees': [
                        ],
                        'reminders': {
                            'useDefault': false,
                            'overrides': [
                            ],
                        },
                        'id': sha1(res[i].groupes.map(g => g.NomGroupe).join(' + ') + res[i].ville + ' ' + res[i].datetimestamp).toLowerCase(),
                    };

                    calendar.events.insert({
                        auth: auth,
                        calendarId: 'mbc5o4dl4p8uvt8rgl6v9u3ld0@group.calendar.google.com',
                        resource: event,
                    }, function (err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        console.log('Event created: %s', response.data.summary);
                    });
                }
            });
        }
    });
}