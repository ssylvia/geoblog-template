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
				_blogPostGraphics = blogPosts;

				$("geoblog-post").remove();

				var editEl = $(selector).children().first();

				dojo.forEach(blogPosts,function(post){
					createBlogPost(editEl,post.attributes[contentAttr]);
				});

				loadCallback();
			}

			this.selectPost = function(index,graphics,elements)
			{
				elements.removeClass("active");
				elements.eq(index).addClass("active").fadeTo(200,1);
				elements.not(".active").fadeTo(200,.5);
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