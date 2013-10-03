define(["storymaps/utils/MovableGraphic","dojo/json","storymaps/utils/Helper"],
	function(MovableGraphic,JSON,Helper)
	{
		/**
		 * BlogEditor
		 * @class BlogEditor
		 *
		 * Class to create and edit blog posts
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogEditor(mapWrapper,selector,map,earliestYear,cumulativeTime,alwaysDisplayPoints,allowDeletes,legendToggleSelector,legendContentSelector,onEditStart,onSave,onDiscard)
		{
			var _this = this,
				_originalMap = map,
				_mapLayer = new esri.layers.GraphicsLayer(),
				_activeEditSession = false,
				_hiddenVisible = false,
				_draftVisible = false,
				_currentOID,
				_dataAttribute,
				_timeAttr,
				_statusAttr,
				_blogLayer,
				_geoAttr,
				_mapStateAttr,
				_blogDataAttr,
				_onAddEditFeature,
				_onRemoveEditFeature,
				_mapStateLinkIndex = 0,
				_homeExtent = false,
				_tempDataAttr;

			dojo.connect(map,"onExtentChange",function(){
				$(".map-state-manager .map-state-save").each(function(){
					$(this).html('Save');
				});
			});

			this.init = function(blogLayer,dataAttribute,statusAttr,timeAttr,geoAttr,mapStateAttr,blogDataAttr,onAddEditFeature,onRemoveEditFeature,onPostVisibilityChange)
			{
				$(selector).append('\
					<div class="blog-visibility-toggles">\
						<label class="checkbox draft-post-toggle">\
							<input class="draft-post-toggle" type="checkbox" value="">\
							Show draft posts\
						</label>\
						<label class="checkbox hidden-post-toggle">\
							<input class="hidden-post-toggle" type="checkbox" value="">\
							Show hidden posts\
						</label>\
					</div>\
					<div class="add-blog-post" title="Add a new post">+</div>');

				$(".add-blog-post").tooltip({
					placement: "top"
				}).click(function(){
					initNewPost();
					setTimeout(function(){
						_onAddEditFeature();
					},50);
				});

				$(".blog-visibility-toggles input").click(function(){
					if($(this).hasClass("draft-post-toggle")){
						_draftVisible = $(this).is(":checked");
					}
					else{
						_hiddenVisible = $(this).is(":checked");
					}
					if(onPostVisibilityChange){
						onPostVisibilityChange();
					}
				});

				addLayerSelector();

				_blogLayer = blogLayer;
				_dataAttribute = dataAttribute;
				_timeAttr = timeAttr;
				_statusAttr = statusAttr;
				_geoAttr = geoAttr;
				_mapStateAttr = mapStateAttr;
				_blogDataAttr = blogDataAttr;

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

			this.refreshEditor = function(newMap)
			{
				map = newMap;
				addLayerSelector();
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

					arrangeMaps($(".map.active").attr("webmap"));

					//Prepare map and blog state
					$(".geoblog-post").removeClass("active");
					$(".multiTip").hide();
					$(".mtArrow").hide();
					map.infoWindow.hide();

					if(cumulativeTime){
						map.setTimeExtent(new esri.TimeExtent(new Date(earliestYear),new Date()));
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

					arrangeMaps($(".map.active").attr("webmap"));

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
						else if($(this).hasClass("blog-post-audio-wrapper")){
							var embed = $(this).html()
							addAudioEditor(embed);
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
				if(onEditStart){
					onEditStart();
				}

				var newPost = true,
					data,
					delayedPost,
					time = new Date(),
					deleteBtn = "",
					hideBtn = '<button class="btn btn-inverse editor-ctrl toggle-item-visibility" type="button">Hide</button>',
					position;
					_homeExtent = false;
					_mapStateLinkIndex = 0;
					_tempDataAttr = {
						textLinks: {
						}
					}
				if (element){
					newPost = false;
					data = element.data(_dataAttribute);					
					_currentOID = data[_blogLayer.objectIdField];
					_homeExtent = $.parseJSON(data[_mapStateAttr]);
					if(data[_statusAttr] === "Hidden"){
						hideBtn = "";
					}
					else if(!isNaN(data[_statusAttr]) && isFinite(data[_statusAttr])){
						delayedPost = true;
					}
					time = new Date(data.time);
					if(allowDeletes && _blogLayer.getEditCapabilities().canDelete){
						deleteBtn = '<button class="btn btn-danger editor-ctrl delete-item" type="button">Delete</button>';
					}
					_tempDataAttr = $.parseJSON(data[_blogDataAttr]);
					if(!_tempDataAttr || !_tempDataAttr.textLinks){
						_tempDataAttr = {
							textLinks: {
							}
						}
					}					
					element.hide(),
					position = element.index();
				}

				$(".add-blog-post, .blog-visibility-toggles").hide();

				var htmlString = '<form class="temp-blog-post" action="javascript:void(0);">\
						<input type="text" class="temp blog-post-title post-item" placeholder="Type post title...">\
						<div class="input-append date form_datetime">\
							<input class="temp blog-post-date" size="20" type="text" value="'+ getTimeStamp(time) +'" readonly>\
							<span class="add-on"><i class="icon-calendar"></i></span>\
						</div>\
						<label class="checkbox delay-post-option">\
							<input class="delay-post-option" type="checkbox" value="">\
							Use as publish date\
						</label>\
						<div class="temp-post-controls">\
							<div class="btn-group">\
								<button class="btn editor-ctrl add-text-item" title="Add text"><i class="icon-align-left"></i></button>\
								<button class="btn editor-ctrl add-photo-item" title="Add a photo"><i class="icon-picture"></i></button>\
								<button class="btn editor-ctrl add-embed-item" title="Embed video"><i class="icon-facetime-video"></i></button>\
								<button class="btn editor-ctrl add-audio-item" title="Embed audio"><i class="icon-music"></i></button>\
								<button class="btn editor-ctrl add-location-item" title="Pinpoint location"><i class="icon-map-marker"></i></button>\
							</div>\
							<button class="btn btn-primary editor-ctrl save-item" type="button">Save as Draft</button>\
							<button class="btn btn-success editor-ctrl publish-item" type="button">Save & Publish</button>\
							' + hideBtn + '\
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

				if(delayedPost){
					$("input.delay-post-option").prop("checked",true);
				}

				$(mapWrapper).append('\
					<div id="map-state-manager" class="temp map-state-manager" style="bottom: 15px;">\
						<h4>Manage Map States</h4>\
						<h5>Tap "Save" to preserve the visible layers, selected popup, and map position to the selected item. All settings will be saved when the blog post is saved.<br><br>To use external webmap, paste ID below.</h5>\
						<div class="input-append">\
							<input id="webmap-id-form" class="span2" id="appendedInputButtons" type="text">\
							<button id="webmap-load" class="btn" type="button">Load</button>\
							<button id="webmap-clear" class="btn" type="button">Clear</button>\
						</div>\
						<div class="home-state map-state-item">\
							Home Position \
							<div class="btn-group  map-state-ctrl">\
								<button class="btn btn-mini map-state-date home-extent" title="Set map state time stamp" type="button"><i class="icon-calendar"></i></button>\
								<button class="btn btn-mini map-state-show home-extent" title="Preview map state" type="button"><i class="icon-eye-open"></i></button>\
								<button class="btn btn-mini map-state-save home-extent" title="Save map state type="button">Save</button>\
							</div>\
						</div>\
					</div>'
				);

				$("#webmap-load").click(function(){
					arrangeMaps($("#webmap-id-form").val());
				});

				$("#webmap-clear").click(function(){
					arrangeMaps();
					$("#webmap-id-form").val("");
				});

				$(".map-state-save.home-extent").click(function(){
					_homeExtent = getMapState(_homeExtent);
					$(this).html('Save <i class="icon-ok"></i>');
				});

				$(".map-state-show.home-extent").click(function(){
					arrangeMaps(_homeExtent.webmap).then(function(){
						showMapState(_homeExtent);
					});
				});

				$(".map-state-date.home-extent").click(function(){
					getMapStateTime(_homeExtent);
				});

				mapManagerMover = new dojo.dnd.move.constrainedMoveable(dojo.byId("map-state-manager"),{
					constraints: mapManagerMoverBB,
					skip: true
				});

				dojo.connect(mapManagerMover,"onFirstMove",function(){
					$("#map-state-manager").css("bottom","auto");
				});

				for(item in _tempDataAttr.textLinks){

					if($(".temp.map-state-manager .map-state-links-wrapper").length > 0){
						$(".temp.map-state-manager .map-state-links-wrapper").append('\
							<div class="link-state map-state-item" data-link="' + item + '">\
								"<p class="text-string">' + _tempDataAttr.textLinks[item].text + '</p>"\
								<div class="btn-group  map-state-ctrl">\
									<button class="btn btn-mini map-state-date link-state" title="Set map state time stamp" data-link="' + item + '" type="button"><i class="icon-calendar"></i></button>\
									<button class="btn btn-mini map-state-show link-state" title="Preview map state" data-link="' + item + '" type="button"><i class="icon-eye-open"></i></button>\
									<button class="btn btn-mini map-state-remove link-state" title="Remove text link" data-link="' + item + '" type="button"><i class="icon-trash"></i></button>\
									<button class="btn btn-mini map-state-save link-state" title="Save map state" data-link="' + item + '" type="button">Save</button>\
								</div>\
							</div>\
						');
					}
					else{
						$(".temp.map-state-manager").append('\
							<div class="map-state-links-wrapper">\
								<h6>Text Links</h6>\
								<div class="link-state map-state-item" data-link="' + item + '">\
									"<p class="text-string">' + _tempDataAttr.textLinks[item].text + '</p>"\
									<div class="btn-group  map-state-ctrl">\
										<button class="btn btn-mini map-state-date link-state" title="Set map state time stamp" data-link="' + item + '" type="button"><i class="icon-calendar"></i></button>\
										<button class="btn btn-mini map-state-show link-state" title="Preview map state" data-link="' + item + '" type="button"><i class="icon-eye-open"></i></button>\
										<button class="btn btn-mini map-state-remove link-state" title="Remove text link" data-link="' + item + '" type="button"><i class="icon-trash"></i></button>\
										<button class="btn btn-mini map-state-save link-state" title="Save map state" data-link="' + item + '" type="button">Save</button>\
									</div>\
								</div>\
							</div>\
						');
					}

					$(".map-state-save.link-state").last().click(function(){
						_tempDataAttr.textLinks[$(this).attr("data-link")].mapState = getMapState(_tempDataAttr.textLinks[$(this).attr("data-link")].mapState);
						$(this).html('Save <i class="icon-ok"></i>');
					});

					$(".map-state-show.link-state").last().click(function(){
						var data = _tempDataAttr.textLinks[$(this).attr("data-link")].mapState;
						arrangeMaps(data.webmap).then(function(){
							showMapState(data);
						});
					});

					$(".map-state-remove.link-state").last().click(function(){
						removeTextLink($(this).attr("data-link"));
					});

					$(".map-state-date.link-state").last().click(function(){
						getMapStateTime(_tempDataAttr.textLinks[$(this).attr("data-link")].mapState);
					});

					if(parseFloat(item) >= _mapStateLinkIndex){
						_mapStateLinkIndex = parseFloat(item) + 1;
					}
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
					else if($(this).hasClass("add-audio-item")){
						addAudioEditor(null,newPost);
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
						savePost("Hidden",position);
					}
					else if($(this).hasClass("publish-item")){
						var date = new Date();
						if($("input.delay-post-option").is(":checked") && getPostDate() >= date.valueOf()){
							savePost(getPostDate(),position);
						}
						else{
							savePost("Published",position);
						}
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
						map.setTimeExtent(new esri.TimeExtent(new Date(earliestYear),new Date(getPostDate())));
					}
					else{
						map.setTimeExtent(new esri.TimeExtent(new Date(getPostDate()),new Date(getPostDate())));	
					}
				});
			}

			function mapManagerMoverBB()
			{
				var bb = {
					t: 15,
					l: 15,
					h: $("#map-wrapper").height() - $("#map-state-manager").outerHeight() - 30,
					w: $("#map-wrapper").width() - 410
				}
				return bb;
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

				var editor = $(".temp.blog-post-text").last();

				editor.wysihtml5({
					"stylesheets": ["lib/bootstrap/css/bootstrap.min.css","app/geoblog/ui/BlogView.css","lib/bootstrap-wysihtml5/lib/css/wysiwyg-color.css"],
					"font-styles": false,
					"image": false,
					"color": true,
					events: {
						change: function(){
							var dataLinks = [];
							$(".temp.blog-post-text").each(function(){
								var splitArray = $(this).val().split("\"");
								for (i in splitArray){
									if(splitArray[i].search("data-map-state-link") >= 0){
										dataLinks.push(splitArray[parseFloat(i) + 1]);
									}
								}
							});
							$(".link-state.map-state-item").each(function(){
								if($.inArray($(this).attr("data-link"),dataLinks) < 0){
									$(this).remove();
									delete _tempDataAttr.textLinks[$(this).attr("data-link")];
								}
							});
						}
					},
					toolbar: {
						code: function(locale,options){
							return '<li><a class="btn add-map-position-link" href="javascript:;" unselectable="on"><i class="icon-globe"></i> Link map position</li>'
						}
					},
					parserRules: {
						"classes": {
							"wysiwyg-color-silver": 1,
							"wysiwyg-color-gray": 1,
							"wysiwyg-color-white": 1,
							"wysiwyg-color-maroon": 1,
							"wysiwyg-color-red": 1,
							"wysiwyg-color-purple": 1,
							"wysiwyg-color-fuchsia": 1,
							"wysiwyg-color-green": 1,
							"wysiwyg-color-lime": 1,
							"wysiwyg-color-olive": 1,
							"wysiwyg-color-yellow": 1,
							"wysiwyg-color-navy": 1,
							"wysiwyg-color-blue": 1,
							"wysiwyg-color-teal": 1,
							"wysiwyg-color-aqua": 1,
							"wysiwyg-color-orange": 1,
							"map-state-link": 1
						},
						"tags": {
							"b": {},
							"i": {},
							"br": {},
							"ol": {},
							"ul": {},
							"li": {},
							"h1": {},
							"h2": {},
							"h3": {},
							"blockquote": {},
							"u": 1,
							"img": {
								"check_attributes": {
									"width": "numbers",
									"alt": "alt",
									"src": "url",
									"height": "numbers"
								}
							},
							"a":  {
								"set_attributes": {
									"target": "_blank",
									"rel":    "nofollow"
								},
								"check_attributes": {
									"href":   "url" // important to avoid XSS
								}
							},
							"span": {
								"check_attributes": {
									"data-map-state-link": "numbers"
								}
							},
							"div": 1,
							"pre": 1,
						}
					}
				});
				$(".add-map-position-link").last().click(function(){
					var wysi = editor.data("wysihtml5").editor;
					if(wysi.composer.selection.getSelectedNode().parentNode.className === "map-state-link"){
						var html = wysi.composer.selection.getSelectedNode().parentElement.innerHTML;
						var index = wysi.composer.selection.getSelectedNode().parentElement.getAttribute("data-map-state-link");
						if($(".link-state.map-state-item").length > 1){
							$(".link-state.map-state-item").each(function(){
								if($(this).attr("data-link") == index){
									$(this).remove();
								}
							});
						}
						else{
							$(".temp.map-state-manager .map-state-links-wrapper").remove();
						}
						delete _tempDataAttr.textLinks[index];
						wysi.composer.selection.getSelectedNode().parentNode.remove();
						wysi.composer.commands.exec("insertHTML", html);
					}
					else{
						var selectedText = wysi.composer.selection.getText();
						wysi.composer.commands.exec("insertHTML", '<span data-map-state-link="'+ _mapStateLinkIndex +'" class="map-state-link">'+ selectedText +'</span>');
						if($(".temp.map-state-manager .map-state-links-wrapper").length > 0){
							$(".temp.map-state-manager .map-state-links-wrapper").append('\
							<div class="link-state map-state-item" data-link="' + _mapStateLinkIndex + '">\
									"<p class="text-string">' + selectedText + '</p>" \
									<div class="btn-group  map-state-ctrl">\
										<button class="btn btn-mini map-state-date link-state" title="Set map state time stamp" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-calendar"></i></button>\
										<button class="btn btn-mini map-state-show link-state" title="Preview map state" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-eye-open"></i></button>\
										<button class="btn btn-mini map-state-remove link-state" title="Remove text link" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-trash"></i></button>\
										<button class="btn btn-mini map-state-save link-state" title="Save map state" data-link="' + _mapStateLinkIndex + '" type="button">Save</button>\
									</div>\
								</div>\
							');
						}
						else{
							$(".temp.map-state-manager").append('\
								<div class="map-state-links-wrapper">\
									<h6>Text Links</h6>\
									<div class="link-state map-state-item" data-link="' + _mapStateLinkIndex + '">\
										"<p class="text-string">' + selectedText + '</p>" \
										<div class="btn-group  map-state-ctrl">\
											<button class="btn btn-mini map-state-date link-state" title="Set map state time stamp" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-calendar"></i></button>\
											<button class="btn btn-mini map-state-show link-state" title="Preview map state" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-eye-open"></i></button>\
											<button class="btn btn-mini map-state-remove link-state" title="Remove text link" data-link="' + _mapStateLinkIndex + '" type="button"><i class="icon-trash"></i></button>\
											<button class="btn btn-mini map-state-save link-state" title="Save map state" data-link="' + _mapStateLinkIndex + '" type="button">Save</button>\
										</div>\
									</div>\
								</div>\
							');
						}
						_tempDataAttr.textLinks[_mapStateLinkIndex] = {
							mapState: getMapState(),
							text: selectedText
						}

						$(".map-state-save.link-state").last().click(function(){
							_tempDataAttr.textLinks[$(this).attr("data-link")].mapState = getMapState();
							$(this).html('Save <i class="icon-ok"></i>');
						});

						$(".map-state-show.link-state").last().click(function(){
							var data = _tempDataAttr.textLinks[$(this).attr("data-link")].mapState;
							arrangeMaps(data.webmap).then(function(){
								showMapState(data);
							});
						});

						$(".map-state-remove.link-state").last().click(function(){
							removeTextLink($(this).attr("data-link"));
						});

						$(".map-state-date.link-state").last().click(function(){
							getMapStateTime(_tempDataAttr.textLinks[$(this).attr("data-link")].mapState);
						});

						++_mapStateLinkIndex;
					}
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

			function addAudioEditor(embed,newPost)
			{
				var insert = (embed === undefined || embed === null) ? "" : embed;

				$(".temp-post-controls").last().before(
					'<textarea type="textarea" class="temp post-audio-code post-item" placeholder="Paste embed code...">' + insert + '</textarea>\
					<button class="btn btn-inverse btn-mini remove-audio-item remove-item" type="button">Remove audio</button>'
				);

				$(".remove-audio-item").last().click(function(){
					if(confirm("Are you sure you want to remove this audio?")){
						$(this).prev(".temp.post-audio-code").remove();
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
					$(".temp.map-state-manager").remove();
					$(".add-blog-post, .blog-visibility-toggles").show();
					//Clear temp data
					_activeEditSession = false;
					_currentOID = null;
					_homeExtent = false;
					_mapLayer.clear();
					map.removeLayer(_mapLayer);
					map = _originalMap;
					if(discard && onDiscard){
						onDiscard(index);
					}
				}
			}

			function savePost(status,position)
			{
				var homeExtent;
				if (_homeExtent){
					homeExtent = _homeExtent;
				}
				else{
					homeExtent = getMapState();
				}
				var saveStatus,
					geometry = getPostGeometry(),
					mapState = homeExtent,
					blogPost = {
						title: $(".temp.blog-post-title").last().val(),
						content: compileHTMLContent(),
						time: getPostDate(),
						geometry: JSON.stringify(geometry),
						mapState: JSON.stringify(mapState),
						data: JSON.stringify(_tempDataAttr),
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
					else if($(this).hasClass("post-audio-code") && $(this).val() != ""){
						HTML += '<div class="blog-post-audio-wrapper blog-item">'+$(this).val()+'</div>';
					}
				});

				return escape(HTML);
			}

			function getMapStateTime(currentState)
			{
				var time;
				if(currentState && currentState.timeStamp){
					time = currentState.timeStamp;
				}
				else{
					time = getPostDate();
				}

				$("body").append('\
					<div id="map-state-blog-picker" class="modal hide">\
						<div class="modal-header">\
							<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
							<h3>Choose time stamp</h3>\
						</div>\
						<div class="modal-body">\
							<p>Choose the time stamp associated with this map state. When this map state is selected the map will use this time to set all time-enabled layers in your webmap.</p>\
							<br>\
							<div class="input-append date form_datetime">\
								<input class="temp map-state-date" size="20" type="text" value="'+ getTimeStamp(new Date(time)) +'" readonly>\
								<span class="add-on"><i class="icon-calendar"></i></span>\
							</div>\
						</div>\
						<div class="modal-footer">\
							<button type="button" class="btn cancel-time-stamp" data-dismiss="modal">Cancel</button>\
							<button type="button" class="btn btn-primary save-time-stamp" data-dismiss="modal">Save time stamp</button>\
						</div>\
					</div>\
				');
				var calendar = $(".form_datetime").last();
				calendar.datetimepicker({
					format: "dd MM yyyy HH:ii p",
					showMeridian: true,
					autoclose: true,
					todayBtn: true,
					pickerPosition: "bottom-left"
				});
				$("#map-state-blog-picker").modal();

				$("#map-state-blog-picker .save-time-stamp").last().click(function(){
					var date = new Date($(".temp.map-state-date").last().val());
					currentState.timeStamp = date.valueOf();
					calendar.datetimepicker("remove");
					$("#map-state-blog-picker").modal("hide").remove();
				});

				$("#map-state-blog-picker .cancel-time-stamp").last().click(function(){
					calendar.datetimepicker("remove");
					$("#map-state-blog-picker").modal("hide").remove();
				});
			}

			function getPostDate()
			{
				var date = new Date($(".temp.blog-post-date").last().val());
				return date.valueOf();
			}

			function getMapState(currentState)
			{
				var time;
				var mapState;

				if(currentState && currentState.timeStamp){
					var time = currentState.timeStamp;
				}
				else{
					var time = getPostDate();
				}

				if($(".map.active").attr("webmap") === map.id){
					mapState = {
						extent: map.extent.toJson(),
						visibleLayers: getVisibleLayers(),
						infoWindow: getInfoWindowFeature(),
						timeStamp: time
					};
				}
				else{
					mapState = {
						webmap: $(".map.active").attr("webmap"),
						extent: map.extent.toJson(),
						visibleLayers: getVisibleLayers(),
						infoWindow: getInfoWindowFeature(),
						timeStamp: time
					};
				}

				return mapState;
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

			function getVisibleLayers()
			{
				var layers = [];
				$(".layer-select").each(function(){
					if($(this).is(":checked")){
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

				$(legendContentSelector).empty();

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

			function showMapState(mapState)
			{
				//TODO: is there a way to query graphic for popup
				map.infoWindow.clearFeatures();
				map.infoWindow.hide();
				if(mapState.infoWindow){
					if(mapState.infoWindow.content !== undefined){
						map.infoWindow.setContent(unescape(mapState.infoWindow.content));
						map.infoWindow.setTitle("");
						map.infoWindow.show(mapState.infoWindow.location);
					}
					else{
						if(mapState.infoWindow.url != undefined){
							var queryTask = new esri.tasks.QueryTask(mapState.infoWindow.url);
							var query = new esri.tasks.Query();
								query.objectIds = [mapState.infoWindow.feature];
								query.returnGeometry = true;
								query.outFields = ["*"];

							queryTask.execute(query,function(result){
								ftr = result.features[0];
								if(ftr.infoTemplate === undefined){
									ftr.setInfoTemplate(map.getLayer(mapState.infoWindow.layerId).infoTemplate);
								}
								map.infoWindow.setFeatures([ftr]);
								map.infoWindow.show(mapState.infoWindow.location);
							});

						}
						else{
							var graphic;
							dojo.forEach(map.getLayer(mapState.infoWindow.layerId).graphics,function(g){
								if(g.attributes[mapState.infoWindow.objectIdField] === mapState.infoWindow.feature){
									graphic = g;
								}
							});

							if(graphic != undefined){
								if(graphic.infoTemplate === undefined){
									graphic.setInfoTemplate(map.getLayer(mapState.infoWindow.layerId).infoTemplate);
								}
								map.infoWindow.setFeatures([graphic]);
								map.infoWindow.show(mapState.infoWindow.location);
							}
						}
					}
				}

				toggleVisibleLayers(mapState.visibleLayers);

				var timeStamp = getPostDate();
				if(mapState.timeStamp){
					timeStamp = mapState.timeStamp;
				}

				//Set TimeExtent
				if(cumulativeTime){
					map.setTimeExtent(new esri.TimeExtent(new Date(earliestYear),new Date(timeStamp)));
				}
				else{
					map.setTimeExtent(new esri.TimeExtent(new Date(timeStamp),new Date(timeStamp)));
				}

				if(alwaysDisplayPoints){
					_blogLayer.show();
				}

				//Set map state
				var extent = new esri.geometry.Extent({
					"xmin":mapState.extent.xmin,
					"ymin":mapState.extent.ymin,
					"xmax":mapState.extent.xmax,
					"ymax":mapState.extent.ymax, 
					"spatialReference":{
						"wkid":mapState.extent.spatialReference.wkid}
					});
				map.setExtent(extent);
			}

			function removeTextLink(index)
			{
				var dataStr = ('<span data-map-state-link="' + index + '" class="map-state-link">');
				$(".temp.blog-post-text").each(function(){
					var valText = $(this).data("wysihtml5").editor.composer.getValue();
					if(valText.search(dataStr) >= 0){
						var splitStr = valText.split(dataStr);
						var newStr = splitStr[0] + splitStr[1].replace('</span>','');
						$(this).data("wysihtml5").editor.composer.setValue(newStr);
					}
				});
				delete _tempDataAttr.textLinks[index];
				if($(".link-state.map-state-item").length > 1){
					$(".link-state.map-state-item").each(function(){
						if($(this).attr("data-link") == index){
							$(this).remove();
						}
					});
				}
				else{
					$(".temp.map-state-manager .map-state-links-wrapper").remove();
				}
			}

			function toggleVisibleLayers(visibleLayers)
			{
				//TODO: fade layers
				if (visibleLayers){

					dojo.forEach(map.layerIds,function(id){
						if ($.inArray(id,visibleLayers) >= 0){
							map.getLayer(id).show();
						}
						else{
							map.getLayer(id).hide();
						}
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						if ($.inArray(id,visibleLayers) >= 0){
							map.getLayer(id).show();
						}
						else{
							map.getLayer(id).hide();
						}
					});

				}
				else{
					dojo.forEach(map.layerIds,function(id){
						map.getLayer(id).hide();
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						map.getLayer(id).hide();
					});
				}
			}

			function arrangeMaps(mapId)
			{
				var deferred = new dojo.Deferred();

				if(mapId && $("#map").attr("webmap") != mapId){
					if($("#map-" + mapId).length > 0){
						$(".map").removeClass("active");
						$("#map-" + mapId).addClass("active");
						map = $("#map-" + mapId).data("map");
						addLayerSelector();
						$(".map-state-manager .map-state-save").each(function(){
							$(this).html('Save');
						});
						deferred.resolve();
					}
					else{
						loadNewMap(mapId).then(function(){
							$(".map").removeClass("active");
							$("#map-" + mapId).addClass("active");
							map = $("#map-" + mapId).data("map");
							addLayerSelector();
							$(".map-state-manager .map-state-save").each(function(){
								$(this).html('Save');
							});
							deferred.resolve();
						});
					}
				}
				else{
					$(".map").removeClass("active");
					$("#map").addClass("active");
					map = _originalMap;
					addLayerSelector();
					$(".map-state-manager .map-state-save").each(function(){
						$(this).html('Save');
					});
					deferred.resolve();
				}

				return deferred;
			}

			function loadNewMap(mapId)
			{
				var deferred = new dojo.Deferred();

				$(".loader").fadeIn();

				$(mapWrapper).append('<div id="map-' + mapId + '" class="map region-center" webmap="' + mapId + '"></div>');

				Helper.resetLayout();

				var mapDeferred = esri.arcgis.utils.createMap(mapId,"map-" + mapId,{
					mapOptions: {
						sliderPosition: "top-right"
					}
				});

				mapDeferred.addCallback(function(response){
					var map = response.map;

					map.addLayer(_blogLayer);

					dojo.connect(map,"onUpdateEnd",function(){
						if($(".loader").is(":visible")){
							$(".loader").fadeOut();
						}
					});

					$("#map-" + mapId).data("map",map);

					if (map.loaded){
						deferred.resolve();
						$(".esriSimpleSliderIncrementButton").each(function(){
							if(!$(this).hasClass("zoomButtonIn") && !$(this).hasClass("initExtentButton")){
								$(this).addClass("zoomButtonIn");
								$(".zoomButtonIn").last().after("<div class='esriSimpleSliderIncrementButton initExtentButton'><img style='margin-top:5px' src='resources/images/app/home.png'></div>");
								$(".initExtentButton").click(function(){
									app.blog.goToHomeState();
								});
							}
						});
					}
					else {
						dojo.connect(map, "onLoad", function() {
							deferred.resolve();
							$(".esriSimpleSliderIncrementButton").each(function(){
								if(!$(this).hasClass("zoomButtonIn") && !$(this).hasClass("initExtentButton")){
									$(this).addClass("zoomButtonIn");
									$(".zoomButtonIn").last().after("<div class='esriSimpleSliderIncrementButton initExtentButton'><img style='margin-top:5px' src='resources/images/app/home.png'></div>");
									$(".initExtentButton").click(function(){
										app.blog.goToHomeState();
									});
								}
							});
						});
					}
				});

				return deferred;
			}

		}

	}
);