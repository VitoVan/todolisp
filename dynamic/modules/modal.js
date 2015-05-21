Application.addModule('modal', function(context) {
    'use strict';
    var dataService,moduleEl,isUpdate;
    return {
		messages: ['addButtonClick','updateButtonClick'],
		onmessage: function(name, data){
			if(name === 'addButtonClick'){
				isUpdate = false;
				this.clearData();
				$('.modal').modal('show');
			}else if(name === 'updateButtonClick'){
				isUpdate = true;
				this.setData(data);
				$('.modal').modal('show');
			}
		},
		init: function() {
			isUpdate = false;
			dataService = context.getService('data');
			moduleEl = context.getElement();
		},
		destroy: function() {
			dataService = null;
		},
		clearData: function(){
			moduleEl.querySelector('input[type="hidden"][name="id"]').value = '';
			moduleEl.querySelector('input[type="text"][name="people"]').value = '';
			moduleEl.querySelector('input[type="text"][name="content"]').value = '';
			moduleEl.querySelector('input[type="text"][name="days"]').value = '';
		},
		setData: function(data){
			moduleEl.querySelector('input[type="hidden"][name="id"]').value = data.id;
			moduleEl.querySelector('input[type="text"][name="people"]').value = data.people;
			moduleEl.querySelector('input[type="text"][name="content"]').value = data.content;
			moduleEl.querySelector('input[type="text"][name="days"]').value = data.days;
		},
		onkeydown: function(event, element, elementType){
			if(event.keyCode === 13 || event.whitch === 13){
				$(moduleEl).find('.button[data-type="confirm"]').click();
			}
		},
		onclick: function(event, element, elementType){
			if(elementType === 'confirm'){
				var id = $.trim(moduleEl.querySelector('input[type="hidden"][name="id"]').value);
				var people = $.trim(moduleEl.querySelector('input[type="text"][name="people"]').value);
				var content = $.trim(moduleEl.querySelector('input[type="text"][name="content"]').value);
				var days = $.trim(moduleEl.querySelector('input[type="text"][name="days"]').value);
				if(!$.isEmptyObject(people) && !$.isEmptyObject(content)){
					if(isUpdate){
						dataService.updateItem(context, people, content, id, days);
					}else{
						dataService.addItem(context, people, content, days);
					}
				}
			}
		}
    };
});
