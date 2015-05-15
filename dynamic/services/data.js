Application.addService('data', function(application) {
    'use strict';
    return {
		getTodos: function(context){
			var url = '/todos';
			$.get(url,function(data){
				context.broadcast('todoReceived', data);
				$('div.tab').removeClass('loading');
			});
		},
		getPage1Items: function(context) {
			var url = '/items';
			$.get(url,function(data){
				context.broadcast('dataReceived', data);
				$('div.tab').removeClass('loading');
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
				context.broadcast('itemStateChanged', 'open');
			});
		},
		closeItem: function(context,id) {
			$.post('/item/close',{id:id},function(data){
				context.broadcast('itemStateChanged', 'close');
			});
		},
		addItem: function(context,people,content){
			$.post('/items/add',{people: people, content: content},function(data){
				$('.modal').modal('hide');
				context.broadcast('itemAdded', data);
			});
		},
		updateItem: function(context, people, content, id){
			id = parseInt(id);
			$.post('/item/update',{people: people, content: content, id: id},function(data){
				$('.modal').modal('hide');
				context.broadcast('itemDataChanged', {id: id, people: people, content: content});
			});
		}
    };
});
