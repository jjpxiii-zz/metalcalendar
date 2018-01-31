var request = require('request-json');

var client = request.createClient('http://sueurdemetal.com')
var data = { region: 12 }
client.post('/func/funcGetEventRegion.php', data, function (err, res, body) {
    return console.log(body);
});
