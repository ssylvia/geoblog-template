define(["storymaps/utils/MovableGraphic","dojo/json"],
	function(MovableGraphic,JSON)
	{
		/**
		 * BlogEditor
		 * @class BlogEditor
		 *
		 * Class to create and edit blog posts
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogEditor(selector,map,cumulativeTime,allowDeletes,legendToggleSelector,legendContentSelector,onSave,onDiscard)
		{
			var _this = this,
				_mapLayer = new esri.layers.GraphicsLayer(),
				_activeEditSession = false,
				_hiddenVisible = false,
				_draftVisible = false,
				_currentOID,
				_dataAttribute,
				_timeAttr,
				_blogLayer,
				_geoAttr,
				_mapStateAttr,
				_onAddEditFeature,
				_onRemoveEditFeature;

			this.init = function(blogLayer,dataAttribute,timeAttr,geoAttr,mapStateAttr,onAddEditFeature,onRemoveEditFeature)
			{
				$(selector).append('<div class="add-blog-post" title="Add a new post">+</div>');
				$(".add-blog-post").tooltip({
					placement: "top"
				}).click(function(){
					initNewPost();
					setTimeout(function(){
						_onAddEditFeature();
					},50);
				});
				addLayerSelector();

				_blogLayer = blogLayer;
				_dataAttribute = dataAttribute;
				_timeAttr = timeAttr;
				_geoAttr = geoAttr;
				_mapStateAttr = mapStateAttr;

				if(onAddEditFeature){
					_onAddEditFeature = onAddEditFeature;
				}
				if(onRemoveEditFeature){
					_onRemoveEditFeature = onRemoveEditFeature;
				}
			}

			this.getEditStatus = function()
			{
				return _activeEditSession;
			}

			this.getHiddenVisible = function()
			{
				return _hiddenVisible
			}

			this.getDraftVisible = function()
			{
				return _draftVisible
			}

			this.updateEditor = function()
			{
				updateLayerSelector();
			}

			this.addEditButtons = function(elements)
			{
				elements.each(function(){
					$(this).append('<button class="btn edit-blog-post" title="Edit blog post"><i class="icon-pencil"></i> Edit</button>');
				});
				$(".btn.edit-blog-post").click(function(){
					var parent = $(this).parent();
					if (parent.hasClass("active")){
						initPostEditor(parent);
					}
					else{
						setTimeout(function()
						{
							initPostEditor(parent)
						},50);
					}
				});
			}

			function getTimeStamp(date)
			{
				var day = date.getDate();
				var month = date.getMonth();
				var monthString;
				var year = date.getFullYear() ;
				var hour = date.getHours();
				var displayHour = ""
				var minute = date.getMinutes();
				var hourQualifier = "";
				var minuteQualifier = "";
				var abv = "am";

				switch(month)
				{
					case 0:
						monthString = "January";
						break;
					case 1:
						monthString = "February";
						break;
					case 2:
						monthString = "March";
						break;
					case 3:
						monthString = "April";
						break;
					case 4:
						monthString = "May";
						break;
					case 5:
						monthString = "June";
						break;
					case 6:
						monthString = "July";
						break;
					case 7:
						monthString = "August";
						break;
					case 8:
						monthString = "September";
						break;
					case 9:
						monthString = "October";
						break;
					case 10:
						monthString = "November";
						break;
					case 11:
						monthString = "December";
						break;
				}

				if(hour > 12){
					displayHour = hour - 12;
					abv = "pm";
					if (displayHour < 10){
						timeQualifier = 0;
					}
				}
				else{
					displayHour = hour;
					if (displayHour < 10){
						timeQualifier = 0;
					}					
				}

				if (minute < 10){
					minuteQualifier = 0;
				}

				return day + " " + monthString + " " + year + " " + hourQualifier + displayHour + ":" + minuteQualifier + minute + " " + abv;
			}

			function initNewPost()
			{
				if(!_activeEditSession){
					_activeEditSession = true;

					//Prepare map and blog state
					$(".geoblog-post").removeClass("active");
					$(".multiTip").hide();
					$(".mtArrow").hide();
					map.infoWindow.hide();

					if(cumulativeTime){
						map.setTimeExtent(new esri.TimeExtent(new Date(0),new Date()));
					}
					else{
						map.setTimeExtent(new esri.TimeExtent(new Date(getPostDate()),new Date()));
					}

					updateLayerSelector();

					prepareEditorState();
				}
			}

			function initPostEditor(element)
			{
				if(!_activeEditSession){
					_activeEditSession = true;

					prepareEditorState(element);

					element.children(".blog-item").each(function(){
						if($(this).hasClass("blog-post-title")){
							var title = $(this).html();
							$(".temp.blog-post-title").val(title);
						}
						else if($(this).hasClass("blog-post-text")){
							var text = $(this).html()
							addTextEditor(text);
						}
						else if($(this).hasClass("blog-post-photo")){
							var url = $(this).attr("src");
							var caption = null;
							if($(this).next().hasClass("blog-post-photo-caption")){
								caption = $(this).next().html();
							}
							addPhotoEditor(url,caption);
						}
						else if($(this).hasClass("blog-post-embed-wrapper")){
							var embed = $(this).html()
							addEmbedEditor(embed);
						}
					});

					setTimeout(function(){
						if(_onAddEditFeature){
							_onAddEditFeature("newEdit");
						}
					},50);
				}
			}

			function prepareEditorState(element)
			{
				var newPost = true,
					data,
					time = new Date(),
					deleteBtn = "",
					position;
				if (element){
					newPost = false;
					data = element.data(_dataAttribute);					
					_currentOID = data[_blogLayer.objectIdField];
					time = new Date(data.time);
					if(allowDeletes){
						deleteBtn = '<button class="btn btn-danger editor-ctrl delete-item" type="button">Delete</button>';
					}
					element.hide(),
					position = element.index();
				}

				$(".add-blog-post").hide();

				var htmlString = '<form class="temp-blog-post" action="javascript:void(0);">\
						<input type="text" class="temp blog-post-title post-item" placeholder="Type post title...">\
						<div class="input-append date form_datetime">\
							<input class="temp blog-post-date" size="20" type="text" value="'+ getTimeStamp(time) +'" readonly>\
							<span class="add-on"><i class="icon-calendar"></i></span>\
						</div>\
						<div class="temp-post-controls">\
							<div class="btn-group">\
								<button class="btn editor-ctrl add-text-item" title="Add text"><i class="icon-align-left"></i></button>\
								<button class="btn editor-ctrl add-photo-item" title="Add a photo"><i class="icon-picture"></i></button>\
								<button class="btn editor-ctrl add-embed-item" title="Embed video or other content"><i class="icon-facetime-video"></i></button>\
								<button class="btn editor-ctrl add-location-item" title="Pinpoint location"><i class="icon-map-marker"></i></button>\
							</div>\
							<button class="btn btn-primary editor-ctrl save-item" type="button">Save as Draft</button>\
							<button class="btn btn-success editor-ctrl publish-item" type="button">Save & Publish</button>\
							<button class="btn btn-inverse editor-ctrl toggle-item-visibility" type="button">Hide</button>\
							<button class="btn btn-inverse editor-ctrl discard-editor" type="button">Discard</button>\
							'+ deleteBtn +'\
						</div>\
						<div class="temp-post-messages"></div>\
					</form>';

				if(element){
					element.after(htmlString);
					var geoJSON = $.parseJSON(data[_geoAttr]);
					if(geoJSON){
						var newPt = new esri.geometry.Point(geoJSON);
						addLocationEditor(newPt);
					}
				}
				else{
					$(".add-blog-post").before(htmlString);
				}

				$(".editor-ctrl").click(function(){
					if($(this).hasClass("add-text-item")){
						addTextEditor(null,newPost);
					}
					else if($(this).hasClass("add-photo-item")){
						addPhotoEditor(null,null,newPost);
					}
					else if($(this).hasClass("add-embed-item")){
						addEmbedEditor(null,newPost);
					}
					else if($(this).hasClass("add-location-item")){
						addLocationEditor();
					}
					else if($(this).hasClass("discard-editor")){
						_this.cleanupEditor(true,element);
					}
					else if($(this).hasClass("delete-item")){
						if(confirm("Are you sure you want to discard these edits? This will completely remove all data from the feature service.")){
							savePost("Delete");
						}
					}
					else if($(this).hasClass("toggle-item-visibility")){
						if($(".temp-blog-post").hasClass("hidden-post")){
							$(this).html("Hide");
							$(".temp-blog-post").removeClass("hidden-post");
						}
						else{
							$(this).html("Show");
							$(".temp-blog-post").addClass("hidden-post");
							savePost("Hidden",position);
						}
					}
					else if($(this).hasClass("publish-item")){
						savePost("Published",position);
					}
					else{
						savePost("Draft",position);
					}

					setTimeout(function(){
						if(_onAddEditFeature){
							_onAddEditFeature();
						}
					},50);
				});

				$(".form_datetime").last().datetimepicker({
					format: "dd MM yyyy HH:ii p",
					showMeridian: true,
					autoclose: true,
					todayBtn: true,
					pickerPosition: "bottom-left"
				}).change(function(){
					if(cumulativeTime){
						map.setTimeExtent(new esri.TimeExtent(new Date(0),new Date(getPostDate())));
					}
					else{
						map.setTimeExtent(new esri.TimeExtent(new Date(getPostDate()),new Date(getPostDate())));	
					}
				});
			}

			function addTextEditor(text,newPost)
			{
				var insert = (text === undefined || text === null) ? "" : text;

				$(".temp-post-controls").last().before('<textarea type="textarea" class="temp blog-post-text post-item" placeholder="Type text content...">' + insert + '</textarea>\
					<button class="btn btn-inverse btn-mini remove-text-item remove-item" type="button">Remove text</button>');

				$(".remove-text-item").last().click(function(){
					if(confirm("Are you sure you want to remove this text?")){
						$(this).prev(".wysihtml5-sandbox").prev("input").remove();
						$(this).prevUntil(".wysihtml5-toolbar").remove();
						$(this).prev(".wysihtml5-toolbar").remove();
						$(this).remove();

						setTimeout(function(){
							if(_onRemoveEditFeature){
								_onRemoveEditFeature(newPost);
							}
						},50);
					}
				});

				$(".temp.blog-post-text").last().wysihtml5({
					"stylesheets": ["lib/bootstrap-wysihtml5/lib/css/wysiwyg-color.css"],
					"font-styles": false,
					"image": false,
					"color": true
				});
			}

			function addPhotoEditor(url,caption,newPost)
			{
				var urlInsert = (url === undefined || url === null) ? "" : url;
				var captionInsert = (caption === undefined || caption === null) ? "" : caption;

				$(".temp-post-controls").last().before(
					'<input type="text" class="temp photo-url post-item" placeholder="Paste photo url..." value="' + urlInsert + '">\
					<input type="text" class="temp photo-caption post-item" placeholder="Type photo caption..." value="' + captionInsert + '">\
					<button class="btn btn-inverse btn-mini remove-photo-item remove-item" type="button">Remove photo</button>'
				);
				$(".remove-photo-item").last().click(function(){
					if(confirm("Are you sure you want to remove this photo?")){
						$(this).prev(".temp.photo-caption").remove();
						$(this).prev(".temp.photo-url").remove();
						$(this).remove();

						setTimeout(function(){
							if(_onRemoveEditFeature){
								_onRemoveEditFeature(newPost);
							}
						},50);
					}
				});
			}

			function addEmbedEditor(embed,newPost)
			{
				var insert = (embed === undefined || embed === null) ? "" : embed;

				$(".temp-post-controls").last().before(
					'<textarea type="textarea" class="temp post-embed-code post-item" placeholder="Paste embed code...">' + insert + '</textarea>\
					<button class="btn btn-inverse btn-mini remove-video-item remove-item" type="button">Remove video</button>'
				);

				$(".remove-video-item").last().click(function(){
					if(confirm("Are you sure you want to remove this video?")){
						$(this).prev(".temp.post-embed-code").remove();
						$(this).remove();

						setTimeout(function(){
							if(_onRemoveEditFeature){
								_onRemoveEditFeature(newPost);
							}
						},50);
					}
				});
			}

			function addLocationEditor(pt)
			{
				if(pt){
					dojo.forEach(_blogLayer.graphics,function(g){
						if(g.attributes[_blogLayer.objectIdField] = _currentOID){
							g.hide();
						}
					});
				}

				var pms = new esri.symbol.PictureMarkerSymbol('resources/icons/EditMarker.png', 50, 50).setOffset(0,20);
				if(map){
					if($(".editor-ctrl.add-location-item").last().hasClass("active")){
						$(".editor-ctrl.add-location-item").last().removeClass("active");
						_mapLayer.clear();
						map.removeLayer(_mapLayer);

						if(_onRemoveEditFeature){
							_onRemoveEditFeature();
						}
					}
					else{
						$(".editor-ctrl.add-location-item").last().addClass("active");
						var startPoint = pt || map.extent.getCenter();
						var graphic = new esri.Graphic(startPoint,pms);
						map.addLayer(_mapLayer);
						_mapLayer.clear();
						_mapLayer.add(graphic);
						var mg = new MovableGraphic(map, _mapLayer, _mapLayer.graphics[0]);
						if(_onAddEditFeature){
							if(pt){
								_onAddEditFeature(false,true);
							}
							else{
								_onAddEditFeature(true,true);
							}
						}
					}
				}
			}

			this.cleanupEditor = function(discard,hiddenElement)
			{
				var cleanup = true,
					index = null;

				if(discard){
					cleanup = confirm("Are you sure you want to discard these edits?");
				}

				if(cleanup){
					$(".temp-blog-post").remove();
					if(hiddenElement){
						hiddenElement.show();
						index = hiddenElement.index();
					}
					$(".add-blog-post").show();
					_mapLayer.clear();
					map.removeLayer(_mapLayer);
					_activeEditSession = false;
					if(discard && onDiscard){
						onDiscard(index);
					}
				}
			}

			function savePost(status,position)
			{
				var saveStatus,
					geometry = getPostGeometry(),
					mapState = {
						extent: map.extent.toJson(),
						hiddenLayers: getHiddenLayers(),
						infoWindow: getInfoWindowFeature()
					};

				var blogPost = {
					title: $(".temp.blog-post-title").last().val(),
					content: compileHTMLContent(),
					time: getPostDate(),
					geometry: JSON.stringify(geometry),
					mapState: JSON.stringify(mapState),
					status: status
				}

				if(status === "Delete" && _currentOID){
					blogPost[_blogLayer.objectIdField] = _currentOID;
					saveStatus = "delete";
					_currentOID = null;
				}
				else if(_currentOID){
					blogPost[_blogLayer.objectIdField] = _currentOID;
					saveStatus = "edit";
					_currentOID = null;
				}
				else{
					saveStatus = "add";
				}

				if(onSave){
					onSave(saveStatus,blogPost,geometry,position);
				}
			}

			function compileHTMLContent()
			{
				var HTML = "";

				$(".temp.post-item").each(function(){
					if($(this).hasClass("blog-post-title") && $(this).val() != ""){
						HTML += '<h3 class="blog-post-title blog-item">'+$(this).val()+'</h3>'
					}
					else if($(this).hasClass("blog-post-text") && $(this).val() != ""){
						HTML += '<div class="blog-post-text blog-item">'+$(this).val()+'</div>'
					}
					else if($(this).hasClass("photo-url") && $(this).val() != ""){
						HTML += '<img class="blog-post-photo blog-item img-polaroid" src="'+$(this).val()+'" alt="'+$(this).val()+'">';
					}
					else if($(this).hasClass("photo-caption") && $(this).val() != ""){
						HTML += '<p class="blog-post-photo-caption blog-item">'+$(this).val()+'</p>';
					}
					else if($(this).hasClass("post-embed-code") && $(this).val() != ""){
						HTML += '<div class="blog-post-embed-wrapper blog-item">'+$(this).val()+'</div>';
					}
				});

				return escape(HTML);
			}

			function getPostDate()
			{
				var date = new Date($(".temp.blog-post-date").last().val());
				return date.valueOf();
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
				if(layers.length > 0){
					return layers;
				}
				else{
					return false;
				}
			}

			function getInfoWindowFeature()
			{
				if(map.infoWindow.getSelectedFeature() && map.infoWindow.isShowing){
					// return {
					// 	content: escape(map.infoWindow._contentPane.innerHTML),
					// 	location: map.infoWindow._location
					// }
					return {
						objectIdField: map.infoWindow.getSelectedFeature().getLayer().objectIdField,
						feature: map.infoWindow.getSelectedFeature().attributes[map.infoWindow.getSelectedFeature().getLayer().objectIdField],
						layerId: map.infoWindow.getSelectedFeature().getLayer().id,
						url: map.infoWindow.getSelectedFeature().getLayer().url,
						location: map.infoWindow._location
					}
				}
				else{
					return false;
				}
			}

			function addLayerSelector()
			{
				$(legendToggleSelector).html("CHOOSE VISIBLE LAYERS");

				dojo.forEach(map.layerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(legendContentSelector).last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).val()).show();
						}
						else{
							map.getLayer($(this).val()).hide();
						}
					});
				});

				dojo.forEach(map.graphicsLayerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(legendContentSelector).last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).val()).show();
						}
						else{
							map.getLayer($(this).val()).hide();
						}
					});
				});
			}

			function updateLayerSelector()
			{
				$(".layer-select").each(function(){
					$(this).prop("checked",map.getLayer($(this).val()).visible);
				});
			}

		}

	}
);