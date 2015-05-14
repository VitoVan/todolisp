Application.addModule('modal', function(context) {
    'use strict';
    var dataService,moduleEl;
    return {
		messages: ['addButtonClick'],
		onmessage: function(){
			$('.modal').modal('show');
		},
		init: function() {
			dataService = context.getService('data');
			moduleEl = context.getElement();
		},
		destroy: function() {
			dataService = null;
		},
		onkeydown: function(event, element, elementType){
			if(event.keyCode === 13 || event.whitch === 13){
				$(moduleEl).find('.button[data-type="confirm"]').click();
			}
		},
		onclick: function(event, element, elementType){
			if(elementType === 'confirm'){
				var people = $.trim(moduleEl.querySelector('input[type="text"][name="people"]').value);
				var content = $.trim(moduleEl.querySelector('input[type="text"][name="content"]').value);
				if(!$.isEmptyObject(people) && !$.isEmptyObject(content)){
					dataService.addItem(context, people, content);
				}
			}
		}
    };
});
