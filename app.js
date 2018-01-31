var request = require('request-json');

var client = request.createClient('http://sueurdemetal.com')
var data = { region: 12 }
client.post('/func/funcGetEventRegion.php', data, function (err, res, body) {
    console.log(body);
    res = body.results.collection1

    for (let i = 0; i < res.length; i++) {
        console.log(new Date(res[i].datetimestamp * 1000))
        console.log(res[i].ville)
        res[i].groupes.map(g => console.log(g.NomGroupe))
    }

});