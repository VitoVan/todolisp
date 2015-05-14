Application.addModule('tabs', function(context) {
    'use strict';
    return {
	onclick: function(event, element, elementType){
	    if(elementType === 'running'){
		context.broadcast('refreshRunning', null);
	    }else if(elementType === 'history'){
		context.broadcast('refreshHistory', null);
	    }else if(elementType === 'add'){
		context.broadcast('refreshHistory', null);
	    }
	}
    };
});
