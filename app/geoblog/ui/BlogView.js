define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Class to compile blog attributes into DOM Display
		 */

		return function BlogView(selector,titleAttr,contentAttr,loadCallback)
		{
			this.init = function(blogPosts) 
			{
				dojo.forEach(blogPosts,function(post){
					createBlogPost(post[titleAttr],post[contentAttr]);

				alert("TEST");
				});

				loadCallback();
			}

			function createBlogPost(titleString,blogString)
			{
				$(selector).append('<div class="geoBlogPost"></div>');
				$(".geoBlogPost").last().append("<h2>"+ titleString +"</h2>").append(blogString);
			}
		}

	}
);