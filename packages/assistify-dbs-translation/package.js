Package.describe({
	name: 'assistify:dbs-translation',
	version: '0.0.1',
	summary: 'integrates DBS Translation service provider',
	git: 'https://github.com/assistify/',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.6.1.1');
	api.use('ecmascript');
	api.mainModule('dbs-translation.js');
	api.addFiles('server/dbsTranslate.js', 'server');
	api.addFiles('server/methods/translate.js', 'server');
});

/**
 * Package-level dependencies
 * cld - Text language detector
 */
Npm.depends({
	cld: '2.4.8'
});

