define([],
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
					'<form class="temp-blog-post">\
						<input type="text" class="temp blog-post-title" placeholder="Type post title...">\
						<textarea type="textarea" id="temp-editor"></textarea>\
					</form>');

				$("#temp-editor").wysihtml5({
					"font-styles": false,
					"image": false,
				});
			}

		}

	}
);