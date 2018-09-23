Package.describe({
	name: 'assistify:deepl-translation',
	version: '0.0.1',
	// Brief, one-line summary of the package.
	summary: 'Empowers RocketChat by integrating DEEPL text translation engine',
	// URL to the Git repository containing the source code for this package.
	git: 'https://github.com/assistify',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.6.0.1');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:autotranslate');
	api.addFiles('server/deeplTranslate.js', 'server');
});

