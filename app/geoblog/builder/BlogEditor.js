define(["dijit/Editor"],
	function(Editor)
	{
		/**
		 * BlogEditor
		 * @class BlogEditor
		 *
		 * Class to create and edit blog posts
		 */

		return function BlogEditor(selector)
		{
			var _this = this;

			this.init = function()
			{
				$(selector).append('<div class="add-blog-post">+</div>');
				$(".add-blog-post").click(function(){
					initNewPost();
				});
			}

			function initNewPost()
			{
				$(".add-blog-post").hide();
				$(".add-blog-post").before(
					'<div class="temp-blog-post"><input class="temp-post-title"></div>');
			}

		}

	}
);