var request = require('request');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
require('dotenv').config();

function executeRequest(options){
	return new Promise((resolve, reject) => {
		try{
			request(options, function (error, data) {
				if(error || !data.headers.status.includes("200")) {
					resolve(undefined);
				}
				else resolve(data);
			});
		}
		catch(e) {
			reject();
		}
	});
}

function compare(prop) {    
	return function(a, b) {    
   	if (a[prop] < b[prop]) {    
         return 1;    
   	} else if (a[prop] > b[prop]) {    
         return -1;    
   	}    
   	return 0;    
	}
}

async function getCommitees(organization, name, m) {
	var options = {
		'method': 'GET',
		'url': `https://api.github.com/repos/${organization}/${name}/contributors`,
		'headers': {
		 'Accept': 'application/vnd.github.v3+json',
		 'user-agent' : 'node.js'
		}
	};

	var data = await executeRequest(options);
	var all_commitee_list = JSON.parse(data.body);
	all_commitee_list.sort(compare("contributions"));
	var commitee_list = [];
	for(var i = 0; i < Math.min(m, all_commitee_list.length); i++) {
		var commitee = all_commitee_list[i];
		var committeeData = {
			'name' : commitee.login,
			'contributions' : commitee.contributions
		};
		commitee_list.push(committeeData);
	}
	return commitee_list;			
}

app.get('/healthCheck', function(req, res) {
	res.json({status : true});
});

app.post('/', jsonParser, async function(req, res) {
	try {
		var organization = req.body.organization;
		var n = req.body.n;
		var m = req.body.m;
		var options = {
			'method': 'GET',
			'url': 'https://api.github.com/orgs/' + organization + '/repos',
			'headers': {
			 'Accept': 'application/vnd.github.v3+json',
			 'user-agent' : 'node.js'
			}
		};

		var data = await executeRequest(options); 
		if(data === undefined) {
			res.json({status : 'fail',  message : 'Organization not found'});
			return; 
		}
		var all_repo_list = JSON.parse(data.body);
		all_repo_list.sort(compare("forks"));
		var repoList = [];

		for(var i = 0; i < Math.min(n, all_repo_list.length); i++) {
			var repo = all_repo_list[i];
			var cur = await getCommitees(organization, repo.name, m);
			var repoData = {
				'name' : repo.name,
				'forks' : repo.forks,
				'committees' : cur
			};
			repoList.push(repoData);
		}
		res.json({status : 'success', data : repoList});
	}
	catch(e){
		res.json({status : 'fail',  message : 'Something wrong happen'});
	}
});

var server = app.listen(process.env.PORT || 8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
});


