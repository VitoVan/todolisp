Application.addBehavior('list', function(context) {
    'use strict';
	var moduleEl;
	return {
		messages: ['itemDataChanged'],
		init: function(){
			moduleEl= context.getElement();
		},
		ondblclick: function(event, element, elementType){
			if(elementType === 'item'){
				var id = parseInt(element.querySelector('td[name="id"]').innerHTML);
				var people = element.querySelector('td[name="people"]').innerHTML;
				var content = element.querySelector('td[name="content"]').innerHTML;
				var data = {id: id, people: people, content: content};
				context.broadcast('updateButtonClick', data);
			}
			document.getSelection().removeAllRanges();
		},
		onmessage: function(name, data) {
			if(name === 'itemDataChanged'){
				for(var i=0;i<moduleEl.children.length;i++){
					var currentChild = moduleEl.children[i];
					if(parseInt(currentChild.querySelector('td[name="id"]').innerHTML) === data.id){
						currentChild.querySelector('td[name="people"]').innerHTML = data.people;
						currentChild.querySelector('td[name="content"]').innerHTML = data.content;
						break;
					}
				}
			}
		}
	};
});
