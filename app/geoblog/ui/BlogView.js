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
				$(selector).empty();

				dojo.forEach(blogPosts,function(post){
					createBlogPost(post.attributes[contentAttr]);
				});
			}

			function createBlogPost(blogContent)
			{
				$(selector).append('<div class="geoblog-post">'+unescape(blogContent)+'</div>');
			}
		}

	}
);