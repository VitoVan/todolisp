Application.addModule('items', function(context) {
    'use strict';
    var dataService,moduleEl,currentItems;
    return {
		messages: ['dataReceived','moreDataReceived','itemDataChanged','refreshHistory','itemAdded'],
		behaviors: ['list'],
		onmessage: function(name, data) {
			if (name === 'dataReceived') {
				currentItems = data;
				this.renderList(data);
			}else if(name === 'moreDataReceived'){
				if(data !== null){
					currentItems= currentItems.concat(data);
					this.appendList(data);
				}
			}else if(name === 'refreshHistory' || name === 'itemAdded'){
				$('div[data-tab="history"]').addClass('loading');
				dataService.getPage1Items(context);
			}
		},
		init: function() {
			currentItems= [];
			dataService = context.getService('data');
			moduleEl = context.getElement();
			dataService.getPage1Items(context);
		},
		destroy: function() {
			dataService = null;
		},
		onclick: function(event, element, elementType){
			if(elementType === 'state'){
				var state = element.querySelector('input[type="checkbox"][name="state"]').checked;
				var id = $(element).closest('tr').children('td[name="id"]')[0].innerHTML;
				console.log(id);
				if(state){
					dataService.openItem(context,id);
				}else{
					dataService.closeItem(context,id);
				}
				
			}
		},
		clearList: function() {
			var childsToRemove = [];
			for(var i=0;i<moduleEl.childNodes.length;i++){
				var childItem = moduleEl.childNodes[i];
				if(!$(childItem).hasClass('item-template')){
					childsToRemove.push(childItem);
				}
			}
			for(var i=0;i<childsToRemove.length;i++){
				moduleEl.removeChild(childsToRemove[i]);
			}
		},
		createItem: function(item){
			var itemTemplateEl = moduleEl.querySelector('.item-template'),
			newItemEl = itemTemplateEl.cloneNode(true);
			newItemEl.style.display = 'table-row';
			//Set Data
			newItemEl.querySelector('[name="id"]').innerHTML = item.id;
			newItemEl.querySelector('[name="content"]').innerHTML = item.content;
			newItemEl.querySelector('[name="atime"]').innerHTML = new Date(item.atime*1000).format('yyyy-MM-dd hh:mm:ss');
			newItemEl.querySelector('[name="people"]').innerHTML = item.people;
			newItemEl.querySelector('[name="state"]').checked = item.state;
			$(newItemEl).removeClass('item-template');
			moduleEl.appendChild(newItemEl);
		},
		appendList: function(items){
			var me= this;
			$.each(items,function(index,value){
				me.createItem(value);
			});
			$('.ui.checkbox').checkbox();
		},
		renderList: function(items){
			this.clearList();
			this.appendList(items);
		}
    };
});
