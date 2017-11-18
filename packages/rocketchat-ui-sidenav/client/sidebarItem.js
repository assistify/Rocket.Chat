/* globals menu popover */
Template.sidebarItem.helpers({
	or(...args) {
		args.pop();
		return args.some(arg => arg);
	},
	isRoom() {
		return this.rid || this._id;
	}
});

let popupInstance = null;

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'(e) {
		if (this.additionalData) {
			e.preventDefault();
			const parent = document.querySelector('.main-content');
			const currentListItem = $(e.currentTarget).closest('li');
			const listOffset = currentListItem.parent().position().top;
			const listItemOffset = currentListItem.position().top;
			let totalOffset = listOffset + listItemOffset;
			const hoverHeight = 300;
			if (totalOffset + hoverHeight > $(window).height()) {
				totalOffset -= hoverHeight - currentListItem.height();
			}
			const top = `${ totalOffset }px`;
			if (popupInstance) {
				Blaze.remove(popupInstance);
			}
			popupInstance = Blaze.renderWithData(Template.sidebarItemPopup, {
				top,
				content: this.additionalData,
				height: `${ hoverHeight }px`,
				refItem: this._id,
				sidebarCtrl: menu,
				open: this.open //pass the reactive var to the hover box
			}, parent);
			return false;

		} else {
			return menu.close();
		}
	},
	// 'click [data-id].has-additional-data'(e) {
	// 	if (this.additionalData) {
	// 		const parent = document.querySelector('.main-content');
	// 		const currentListItem = $(e.currentTarget).parents('li');
	// 		const listOffset = currentListItem.parent().position().top;
	// 		const listItemOffset = currentListItem.position().top;
	// 		let totalOffset = listOffset + listItemOffset;
	// 		const hoverHeight = 300;
	// 		if (totalOffset + hoverHeight > $(window).height()) {
	// 			totalOffset -= hoverHeight - currentListItem.height();
	// 		}
	// 		const top = `${ totalOffset }px`;
	// 		this.sidebarItemPopup = Blaze.renderWithData(Template.sidebarItemPopup, {
	// 			top,
	// 			content: this.additionalData,
	// 			height: `${ hoverHeight }px`,
	// 			refItem: this._id
	// 		}, parent);
	// 	}
	// },
	// 'mouseout [data-id]'() {
	// 	if (this.additionalData && this.sidebarItemPopup) {
	// 		Blaze.remove(this.sidebarItemPopup);
	// 	}
	// },
	'click .sidebar-item__menu'(e) {
		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || (['d', 'l'].includes(roomData.t)));
		};
		e.preventDefault();
		const items = [{
			icon: 'eye-off',
			name: t('Hide_room'),
			type: 'sidebar-item',
			id: 'hide'
		}];
		if (canLeave()) {
			items.push({
				icon: 'sign-out',
				name: t('Leave_room'),
				type: 'sidebar-item',
				id: 'leave',
				modifier: 'error'
			});
		}
		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items
						}
					]
				}
			],
			mousePosition: {
				x: e.clientX,
				y: e.clientY
			},
			data: {
				template: this.t,
				rid: this.rid,
				name: this.name
			}
		};

		popover.open(config);
	}
});
