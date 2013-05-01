define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Class to compile blog attributes into DOM Display
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogView(selector,contentAttr,loadCallback)
		{
			this.update = function(blogPosts) 
			{
				$("geoblog-post").remove();

				var editEl = $(selector).children().first();

				dojo.forEach(blogPosts,function(post){
					createBlogPost(editEl,post.attributes[contentAttr]);
				});

				loadCallback();
			}

			function createBlogPost(editEl,blogContent)
			{
				var content = unescape(blogContent);

				if(editEl.length > 0){
					editEl.before('<div class="geoblog-post">'+content+'</div>');
				}
				else{
					$(selector).append('<div class="geoblog-post">'+content+'</div>');
				}
			}
		}

	}
);