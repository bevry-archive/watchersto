#!/usr/bin/env node

(function(){
	// watchesto balupton/history.js history.js-watchers.csv

	// Require
	var
		request = require('request'),
		sys = require('sys'),
		fs = require('fs'),
		deps = require(__dirname+'/../lib/dep.js');

	// Vars
	var
		repoName = (process.argv[2]||'').replace(/.+github.com\/([^\/]+\/[^\/]+).*/,'$1'),
		outFile = process.argv[3]||(repoName.replace(/[^a-zA-Z0-9\.\-\_]/g,'-')+'-watchers.json'),
		outExtension = outFile.replace(/.+\.(.+)$/,'$1');

	// Handlers
	var
		toVcf = function(watchers){
			var vcf = '', item, location;
			watchers.each(function(){
				if ( this.name ) {
					item = 0;
					location = this.location||'';
					vcf += 'BEGIN:VCARD\nVERSION:3.0\n';
					if ( this.name ) {
						vcf += 'FN:'+this.name+'\n';
					}
					if ( this.company ) {
						vcf += 'ORG:'+this.company+'\n';
					}
					if ( location ) {
						location = this.location.replace(/\n/gm,';').replace(/,/gm,';');
						vcf += 'ADR;HOME:'+location+'\n';
					}
					if ( this.email ) {
						vcf += 'EMAIL;type=INTERNET,WORK,PREF:'+this.email+'\n';
					}
					if ( this.website ) {
						++item;
						vcf += 'item'+item+'.URL;type=PREF:'+this.blog+'\n';
						vcf += 'item'+item+'.X-ABLabel:_$!<HomePage>!$_\n';
					}
					if ( location ) {
						++item;
						vcf += 'item'+item+'.ADR;type=HOME,PREF:'+location+'\n';
					}
					vcf += 'END:VCARD\n';
				}
			});
			return vcf;
		},
		toCsv = function(watchers){
			var csv = '';
			watchers.each(function(){
				if ( this.email ) {
					if ( this.name ) {
						csv += this.name+', '+this.email+'\n';
					}
					else {
						csv += this.email+'\n';
					}
				}
			});
			return csv;
		},
		toJson = function(watchers) {
			var json = JSON.stringify({
				watchers: watchers
			});
			return json;
		},
		successHandler = function(data){
			var result;
			switch ( outExtension ) {
				case 'csv':
					result = toCsv(data.watchers||[]);
					break;
				case 'vcf':
					result = toVcf(data.watchers||[]);
					break;
				default:
					result = toJson(data.watchers||[]);
					break;
			}
			fs.writeFile(outFile,result,function(){
				console.log('Your file is now written');
			});
		},
		errorHandler = function(error){
			console.log('An error occured: '+error);
			process.exit(1);
		},
		performRequest = function(){
			request({uri:'http://github.com/api/v2/json/repos/show/'+repoName+'/watchers?full=1'}, function (error, response, data) {
				if (!error && response.statusCode == 200) {
					try {
						data = JSON.parse(data);
						successHandler(data);
					}
					catch ( exception ) {
						errorHandler(exception);
					}
				}
				else {
					errorHandler(exception);
				}
			});
		};

	// Check
	if ( !repoName ) {
		errorHandler('usage: watchesto balupton/history.js history.js-watchers.csv\nalso supports json and vcf formats');
	}

	// Handle
	performRequest();

})();
