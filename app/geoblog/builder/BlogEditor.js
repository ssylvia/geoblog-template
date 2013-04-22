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
					'<form class="temp-blog-post" action="javascript:void(0);">\
						<input type="text" class="temp blog-post-title" placeholder="Type post title...">\
						<div class="temp-post-controls">\
							<div class="btn-group">\
								<button class="btn editor-ctrl add-text" title="Text"><i class="icon-align-left" onclick=""></i></button>\
								<button class="btn editor-ctrl add-photo" title="Photo"><i class="icon-picture"></i></button>\
								<button class="btn editor-ctrl add-date disabled" title="Date & Time"><i class="icon-calendar"></i></button>\
								<button class="btn editor-ctrl add-location disabled" title="Location"><i class="icon-map-marker"></i></button>\
							</div>\
							<button class="btn btn-primary editor-ctrl" type="button">Save</button>\
							<button class="btn btn-danger editor-ctrl discard-editor" type="button">Discard</button>\
						</div>\
					</form>');

				$(".editor-ctrl").click(function(){
					if($(this).hasClass("add-text")){
						addTextEditor();
					}
					else if($(this).hasClass("add-photo")){
						addPhotoEditor();
					}
					else if($(this).hasClass("add-date")){
						addDateEditor();
					}
					else if($(this).hasClass("add-location")){
						addLocationEditor();
					}
					else if($(this).hasClass("discard-editor")){
						discardEditor();
					}
					else{
						savePost();
					}
				});
			}

			function addTextEditor()
			{
				$(".temp-post-controls").last().before('<textarea type="textarea" class="temp blog-post-text post-item" placeholder="Type text content..."></textarea>');

				$(".temp.blog-post-text").last().wysihtml5({
					"stylesheets": ["lib/bootstrap-wysihtml5/lib/css/wysiwyg-color.css"],
					"font-styles": false,
					"image": false,
					"color": true
				});
			}

			function addPhotoEditor()
			{
				$(".temp-post-controls").last().before(
					'<img class="temp blog-post-photo img-polaroid" src="" alt="preview">\
					<input type="text" class="temp photo-url post-item" placeholder="Paste photo url...">\
					<input type="text" class="temp photo-caption post-item" placeholder="Type photo caption...">'
				);

				$(".temp.photo-url").last().change(function(){
					$(".temp.blog-post-photo").last().attr("src",$(this).val());
				});

				$(".temp.blog-post-photo").last().load(function(){
					$(this).fadeIn();
				});
			}

			function addDateEditor()
			{

			}

			function addLocationEditor()
			{

			}

			function discardEditor()
			{
				//TODO: Add confirm popup
				$(".temp-blog-post").remove();
				$(".add-blog-post").show();
			}

			function savePost()
			{
				var postTitle = $(".temp.blog-post-title").last().val();
				var postHTML = compileHTMLContent();

				console.log(postHTML);
			}

			function compileHTMLContent()
			{
				var HTML = "";

				$(".temp.post-item").each(function(){
					if($(this).hasClass("blog-post-text")){
						HTML += '<div class="blog-post-text">'+$(this).val()+'</div>'
					}
					else if($(this).hasClass("photo-url")){
						HTML += '<img class="blog-post-photo img-polaroid" src="'+$(this).val()+'" alt="'+$(this).val()+'">';
					}
					else if($(this).hasClass("photo-caption")){
						HTML += '<p class="blog-post-photo-caption">'+$(this).val()+'</p>';
					}
				});

				return HTML;
			}

		}

	}
);