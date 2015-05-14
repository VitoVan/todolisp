Application.addModule('loader', function(context) {
    'use strict';
    var dataService,moduleEl,page;
    return {
	messages: ['dataReceived','moreDataReceived'],
	onmessage: function(name, data) {
	    var moreBtn = moduleEl.querySelector('div.button');
	    $(moreBtn).removeClass('loading');
	    if(name === 'moreDataReceived'){
		if(data === null){
		    $(moreBtn).addClass('disabled');
		}
	    }else if(name === 'dataReceived'){
		page= 1;
		$(moreBtn).removeClass('disabled');
	    }
	},
	init: function() {
	    page= 1;
	    dataService= context.getService('data');
	    moduleEl= context.getElement();
	},
	destroy: function() {
	    dataService = null;
	    moduleEl = null;
	},
	onclick: function(event, element, elementType){
	    if(elementType === 'more'){
		page++;
		$(element).addClass('loading');
		dataService.getMoreItems(context,page);
	    }
	}
    };
});
