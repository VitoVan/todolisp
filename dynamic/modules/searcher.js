Application.addModule('searcher', function(context) {
    'use strict';
    var dataService,moduleEl;
    return {
	init: function() {
	    dataService = context.getService('data');
	    moduleEl = context.getElement();
	},
	destroy: function() {
	    dataService = null;
	},
	onkeyup: function(event, element, elementType){
	    if(elementType === 'searchInput'){
		var filterText = element.querySelector('input[type="text"][name="search"]').value;
		context.broadcast('searchFilterChange', filterText);
	    }
	}
    };
});
