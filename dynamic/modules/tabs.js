Application.addModule('tabs', function(context) {
    'use strict';
    return {
		onclick: function(event, element, elementType){
			if(elementType === 'running'){
				$('.ui.page.dimmer').dimmer('show');
				context.broadcast('refreshRunning', null);
			}else if(elementType === 'history'){
				$('.ui.page.dimmer').dimmer('show');
				context.broadcast('refreshHistory', null);
			}else if(elementType === 'add'){
				context.broadcast('addButtonClick', null);
			}
		}
    };
});
