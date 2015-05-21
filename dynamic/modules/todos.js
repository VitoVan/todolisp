Application.addModule('todos', function(context) {
    'use strict';
    var dataService,moduleEl,currentItems,hideClosed,filterText;
    return {
		messages: ['todoReceived','searchFilterChange','refreshRunning','itemAdded','itemDataChanged'],
		behaviors: ['list'],
		onmessage: function(name, data) {
			if (name === 'todoReceived') {
				currentItems = data;
				this.renderList(data);
				this.filterList(filterText);
			}else if(name === 'searchFilterChange'){
				filterText = data;
				this.filterList(filterText);
			}else if(name === 'refreshRunning' || name === 'itemAdded'){
				$('div[data-tab="running"]').addClass('loading');
				dataService.getTodos(context);
			}
		},
		init: function() {
			filterText= '';
			dataService = context.getService('data');
			moduleEl = context.getElement();
			dataService.getTodos(context);
			setInterval(function(){
				dataService.getTodos(context);
			},60000);
		},
		destroy: function() {
			moduleEl = null;
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
			var daysPassed = (Math.round(new Date().getTime()/1000) - item.atime)/86400;
			if(daysPassed > item.days){
				$(newItemEl).addClass('error');
			}else if(item.days - daysPassed < 1){
				$(newItemEl).addClass('warning');
			}
			$(newItemEl).data('atime',item.atime);
			//Set Data
			newItemEl.querySelector('[name="id"]').innerHTML = item.id;
			newItemEl.querySelector('[name="content"]').innerHTML = item.content;
			newItemEl.querySelector('[name="atime"]').innerHTML = new Date(item.atime*1000).format('yyyy-MM-dd hh:mm:ss');
			newItemEl.querySelector('[name="days-left"]').innerHTML = (item.days - daysPassed).toFixed(2);
			newItemEl.querySelector('[name="days"]').innerHTML = item.days;
			newItemEl.querySelector('[name="people"]').innerHTML = item.people;
			newItemEl.querySelector('[name="state"]').checked = item.state;
			$(newItemEl).removeClass('item-template');
			moduleEl.appendChild(newItemEl);
		},
		filterList: function(filterText){
			var filterItems = [];
			for(var i=0;i<currentItems.length;i++){
				var people = currentItems[i].people;
				var content = currentItems[i].content;
				if(people.indexOf(filterText) !== -1 || content.indexOf(filterText) !== -1){
					filterItems.push(currentItems[i]);
				}
			}
			this.renderList(filterItems);
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
