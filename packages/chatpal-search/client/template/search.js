Template.ChatpalSearch.onCreated(function() {

	this.pattern = new RegExp('^((create-channel)|(account)|(admin.*)|(mailer)|(emoji-custom)|(custom-sounds))$');

	this.enabled = new ReactiveVar(true);
	this.result = new ReactiveVar;
	this.loading = new ReactiveVar(false);
	this.showResults = new ReactiveVar(false);

	this.autorun(() => {
		const routeName = FlowRouter.getRouteName();
		if (this.pattern.test(routeName)) {
			$('#chatpal-external-search').hide();
		} else {
			$('#chatpal-external-search').show();
		}
	});
});

Template.ChatpalSearch.onRendered(function() {

	this.pageSize = RocketChat.settings.get('CHATPAL_PAGESIZE');

	this.page = 1;

	this.text = undefined;

	this.search = () => {

		this.result.set(null);
		this.loading.set(true);

		this.showResults.set(true);

		Meteor.call('chatpal.search', this.text, this.page, this.pageSize, [], (err, res) => {
			$('.flex-tab__content').scrollTop(0);
			this.loading.set(false);
			if (err) {
				console.log('ping failed');
				this.enabled.set(false);
			} else {
				this.enabled.set(true);
				this.result.set(res);
			}
		});
	};

	this.ping = () => {
		Meteor.call('chatpal.ping', (err) => {
			if (err) {
				console.log('ping failed');
				this.enabled.set(false);
			} else {
				console.log('ping successful');
				this.enabled.set(true);
			}
		});
	};
});

Template.ChatpalSearch.events = {
	'keydown .chatpal-external-search-input-in'(evt, t) {
		if (evt.which === 13) {
			t.page = 1;
			t.text = evt.currentTarget.value;
			t.search();
		}
	},
	'click .chatpal-search-container-close'(evt, t) {
		t.showResults.set(false);
	},
	'click .chatpal-paging-prev'(env, t) {
		t.page -= 1;
		t.search();
	},
	'click .chatpal-paging-next'(env, t) {
		t.page += 1;
		t.search();
	}
};

Template.ChatpalSearch.helpers({
	resultDocs() {
		const result = Template.instance().result.get();
		if (result) {
			return result.docs;
		}
	},

	resultNumFound() {
		const result = Template.instance().result.get();
		if (result) {
			switch (result.numFound) {
				case 0: return TAPi18n.__('CHATPAL_SEARCH_NO_RESULTS');
				case 1: return TAPi18n.__('CHATPAL_SEARCH_ONE_RESULTS');
				default: return TAPi18n.__('CHATPAL_SEARCH_RESULTS', result.numFound);
			}
		}
	},

	resultPaging() {
		const result = Template.instance().result.get();
		if (result) {
			return {
				currentPage: 1 + result.start/Template.instance().pageSize,
				numOfPages: Math.ceil(result.numFound/Template.instance().pageSize)
			};
		}
	},

	loading() {
		return Template.instance().loading.get();
	},

	enabled() {
		return Template.instance().enabled.get();
	},

	showResults() {
		return Template.instance().showResults.get();
	}
});
