/* global menu, toolbarSearch */

const remove = function() {
	console.log('remove...');
	Blaze.remove(Template.instance().view);
};

Template.sidebarItemPopup.helpers({

});

Template.sidebarItemPopup.events({
	'click #sidebar-item-popup'() {
		if (this.open) {
			this.open.set(false);
		}

		toolbarSearch.clear();
		menu.close();
		remove();
	}
});
