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
				var days = element.querySelector('td[name="days"]').innerHTML;
				var data = {id: id, people: people, content: content, days: days};
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
						currentChild.querySelector('td[name="days"]').innerHTML = data.days;
						//如果是Todos页面,则变更颜色
						if($(currentChild).data('atime')){
							var daysPassed = (Math.round(new Date().getTime()/1000) - $(currentChild).data('atime'))/86400;
							if(daysPassed > data.days){
								$(currentChild).addClass('error');
							}else if(data.days - daysPassed < 1){
								$(currentChild).addClass('warning');
							}else{
								$(currentChild).removeClass('warning').removeClass('error');;
							}
							currentChild.querySelector('[name="days-left"]').innerHTML = (data.days - daysPassed).toFixed(2);
						}
						break;
					}
				}
			}
		}
	};
});
