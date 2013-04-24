define(["storymaps/utils/MovableGraphic"],
	function(MovableGraphic)
	{
		/**
		 * BlogEditor
		 * @class BlogEditor
		 *
		 * Class to create and edit blog posts
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogEditor(selector,map,onSave)
		{
			var _this = this;
			var _mapLayer = new esri.layers.GraphicsLayer();

			this.init = function()
			{
				$(selector).append('<div class="add-blog-post">+</div>');
				$(".add-blog-post").click(function(){
					initNewPost();
				});
				addLayerSelector();
			}

			function initNewPost()
			{
				$(".add-blog-post").hide();
				$(".add-blog-post").before(
					'<form class="temp-blog-post" action="javascript:void(0);">\
						<input type="text" class="temp blog-post-title post-item" placeholder="Type post title...">\
						<div class="input-append date form_datetime">\
							<input class="temp blog-post-date" size="20" type="text" value="" readonly>\
							<span class="add-on"><i class="icon-calendar"></i></span>\
						</div>\
						<div class="temp-post-controls">\
							<div class="btn-group">\
								<button class="btn editor-ctrl add-text" title="Add text"><i class="icon-align-left" onclick=""></i></button>\
								<button class="btn editor-ctrl add-photo" title="Add a photo"><i class="icon-picture"></i></button>\
								<button class="btn editor-ctrl add-embed" title="Embed video or other content"><i class="icon-facetime-video"></i></button>\
								<button class="btn editor-ctrl add-location" title="Pinpoint location"><i class="icon-map-marker"></i></button>\
							</div>\
							<button class="btn btn-primary editor-ctrl" type="button">Save</button>\
							<button class="btn btn-danger editor-ctrl discard-editor" type="button">Discard</button>\
						</div>\
						<div class="temp-post-messages"></div>\
					</form>');

				$(".editor-ctrl").click(function(){
					if($(this).hasClass("add-text")){
						addTextEditor();
					}
					else if($(this).hasClass("add-photo")){
						addPhotoEditor();
					}
					else if($(this).hasClass("add-embed")){
						addEmbedEditor();
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

				$(".form_datetime").last().datetimepicker({
					format: "dd MM yyyy - HH:ii p",
					showMeridian: true,
					autoclose: true,
					todayBtn: true,
					pickerPosition: "bottom-left"
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

			function addEmbedEditor()
			{
				$(".temp-post-controls").last().before(
					'<div class="temp blog-post-embed-wrapper"></div>\
					<textarea type="textarea" class="temp post-embed-code post-item" placeholder="Paste embed code..."></textarea>'
				);

				$(".temp.post-embed-code ").last().change(function(){
					$(".temp.blog-post-embed-wrapper").last().html($(this).val());
				});

				$(".temp.blog-post-photo").last().load(function(){
					$(this).fadeIn();
				});
			}

			function addLocationEditor()
			{
				var pms = new esri.symbol.PictureMarkerSymbol('resources/icons/EditMarker.png', 50, 50).setOffset(0,20);
				if(map){
					if($(".editor-ctrl.add-location").last().hasClass("active")){
						$(".editor-ctrl.add-location").last().removeClass("active");
						_mapLayer.clear();
						map.removeLayer(_mapLayer);
					}
					else{
						$(".editor-ctrl.add-location").last().addClass("active");
						var graphic = new esri.Graphic(map.extent.getCenter(),pms);
						map.addLayer(_mapLayer);
						_mapLayer.clear();
						_mapLayer.add(graphic);
						var mg = new MovableGraphic(map, _mapLayer, _mapLayer.graphics[0]);
					}
				}
			}

			function discardEditor()
			{
				//TODO: Add confirm popup
				$(".temp-blog-post").remove();
				$(".add-blog-post").show();
				_mapLayer.clear();
				map.removeLayer(_mapLayer);
			}

			function savePost()
			{
				var blogPost = {
					title: $(".temp.blog-post-title").last().val(),
					content: compileHTMLContent(),
					date: getPostDate(),
					geometry: getPostGeometry(),
					mapState: {
						extent: map.extent.toJson(),
						hiddenLayers: getHiddenLayers(),
						infoWindow: getInfoWindowFeature()
					}
				}

				onSave(blogPost);

				//Reset Editor and Add Button
				discardEditor();
			}

			function compileHTMLContent()
			{
				var HTML = "";

				$(".temp.post-item").each(function(){
					if($(this).hasClass("blog-post-title")){
						HTML += '<h3 class="blog-post-title">'+$(this).val()+'</h3>'
					}
					else if($(this).hasClass("blog-post-text")){
						HTML += '<div class="blog-post-text">'+$(this).val()+'</div>'
					}
					else if($(this).hasClass("photo-url")){
						HTML += '<img class="blog-post-photo img-polaroid" src="'+$(this).val()+'" alt="'+$(this).val()+'">';
					}
					else if($(this).hasClass("photo-caption")){
						HTML += '<p class="blog-post-photo-caption">'+$(this).val()+'</p>';
					}
					else if($(this).hasClass("post-embed-code")){
						HTML += '<div class="blog-post-embed-wrapper">'+$(this).val()+'</div>';
					}
				});

				return HTML;
			}

			function getPostDate()
			{
				if($(".temp.blog-post-date").last().val()){
					return new Date().valueOf();
				}
				else{
					return new Date($(".temp.blog-post-date").last().val()).valueOf();
				}
			}

			function getPostGeometry()
			{
				if(_mapLayer.graphics.length > 0){
					return _mapLayer.graphics[0].geometry;
				}
				else{
					return false;
				}
			}

			function getHiddenLayers()
			{
				var layers = [];
				$(".layer-select").each(function(){
					if(!$(this).is(":checked")){
						layers.push($(this).val());
					}
				});
				return layers;
			}

			function getInfoWindowFeature()
			{
				if(map.infoWindow.getSelectedFeature() && map.infoWindow.isShowing){
					return {
						graphic: map.infoWindow.getSelectedFeature().toJson(),
						layerId: map.infoWindow.getSelectedFeature().getLayer().id
					}
				}
				else{
					return false;
				}
			}

			function addLayerSelector()
			{
				var mapSelector = '#'+app.map.container.id;

				$(mapSelector).append(
					'<div class="layer-selector-wrapper">\
						<div class="layer-selector-toggle">Choose visible layers</div>\
						<div class="layer-selector-content"></div>\
					</div>');

				dojo.forEach(map.layerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(".layer-selector-content").last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).attr("name")).show();
						}
						else{
							map.getLayer($(this).attr("name")).hide();
						}
					});
				});

				dojo.forEach(map.graphicsLayerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(".layer-selector-content").last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).attr("name")).show();
						}
						else{
							map.getLayer($(this).attr("name")).hide();
						}
					});
				});

				$(".layer-selector-toggle").click(function(){
					$(this).next().stop(true,true).slideToggle();
				});
			}

		}

	}
);