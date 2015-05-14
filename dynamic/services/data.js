Application.addService('data', function(application) {
    'use strict';
    return {
	getTodos: function(context){
	    $('.ui.page.dimmer').dimmer('show');
	    var url = '/todos';
	    $.get(url,function(data){
		context.broadcast('todoReceived', data);
		$('.ui.page.dimmer').dimmer('hide');
	    });
	},
	getPage1Items: function(context) {
	    $('.ui.page.dimmer').dimmer('show');
	    var url = '/items';
	    $.get(url,function(data){
		context.broadcast('dataReceived', data);
		$('.ui.page.dimmer').dimmer('hide');
	    });
	},
	getMoreItems: function(context,page) {
	    var url = '/items?page='+ page;
	    $.get(url,function(data){
		context.broadcast('moreDataReceived', data);
	    });
	},
	openItem: function(context,id) {
	    $.post('/item/open',{id:id},function(data){
		context.broadcast('itemChanged', data);
	    });
	},
	closeItem: function(context,id) {
	    $.post('/item/close',{id:id},function(data){
		context.broadcast('itemChanged', data);
	    });
	},
    };
});
