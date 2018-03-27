Package.describe({
	name: 'rocketchat:message-attachments',
	version: '0.0.1',
	summary: 'Widget for message attachments',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'templating',
		'ecmascript',
		'rocketchat:lib'
	]);

	api.addFiles('client/messageAttachment.html', 'client');
	api.addFiles('client/messageAttachment.js', 'client');
	api.addFiles('client/renderField.html', 'client');
	api.addFiles('client/renderField.js', 'client');
	api.addFiles('client/fieldTypeThreadReference.html', 'client');
	api.addFiles('client/fieldTypeThreadReference.js', 'client');

	// stylesheets
	api.addFiles('client/stylesheets/messageAttachments.css', 'client');
});
