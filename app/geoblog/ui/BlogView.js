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

		return function BlogView(selector,titleAttr,contentAttr,loadCallback)
		{
			this.init = function(blogPosts) 
			{
				$(selector).append('<div id="blog-bottom-controls" class="blogElement"></div>')

				dojo.forEach(blogPosts,function(post){
					createBlogPost(post[titleAttr],post[contentAttr]);
				});

				loadCallback();
			}

			function createBlogPost(titleString,blogString)
			{
				$('#blog-bottom-controls').before('<div class="geoBlogPost blogElement"></div>');
				$('.geoBlogPost').last().append("<h2>"+ titleString +"</h2>").append(blogString);
			}
		}

	}
);