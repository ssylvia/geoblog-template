define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Class to compile blog attributes into DOM Display
		 */

		return function BlogView(selector,fieldName)
		{
			this.init = function(featureArray) 
			{
				dojo.forEach(featureArray,function(ftr){
					createBlogPost(ftr.attributes[fieldName]);
				});
			}

			function createBlogPost(blogString)
			{
				var blogArray = $.parseJSON(blogString);

				$(selector).append('<div class="geoBlogPost"></div>');

				dojo.forEach(blogArray,function(item){

					var el;

					switch (item.type){
						case "title":
							el = '<h3 class="blogPostTitle">'+item.string+'</h3>';
							break;
						case "img":
							el = '<img class="blogPostImg" src="'+item.src+'" alt="">';
							if (item.string){
								el = el + '<p class="blogPostCaption">'+item.string+'</p>';
							}
							break;
						case "text":
							el = '<p class="blogPostText">'+item.string+'</p>';
							break;
					}

					$(".geoBlogPost").last().append(el);

				});
			}
		}

	}
);