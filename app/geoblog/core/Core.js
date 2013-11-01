define(["esri/map",
		"esri/arcgis/Portal",
		"esri/arcgis/utils",
		"esri/layout",
		"esri/widgets",
		"storymaps/utils/Helper",
		"storymaps/geoblog/core/BlogData",
		"storymaps/geoblog/ui/BlogView",
		"dojo/has",
		"esri/dijit/Popup",
		"dojo/dom-construct"],
	function(
		Map,
		Portal,
		Utils,
		Layout,
		Widgets,
		Helper,
		BlogData,
		BlogView,
		Has,
		Popup,
		domConstruct)
	{
		/**
		 * Core
		 * @class Core
		 *
		 * Geoblog viewer Main class
		 */

		//
		// Initialization
		//

		var _isBuilder = false,
			_isPreview = false,
			_isEmbed = false,
			_layout = "wide",
			_blogSelector = "#blog",
			_selectByIndex = {
				active: false,
				index: 0
			},
			_startPosition = null,
			_selectReady = false;

		var opts = {
			lines: 13, // The number of lines to draw
			length: 20, // The length of each line
			width: 10, // The line thickness
			radius: 30, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#fff', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};
		var target = document.getElementById('loader-container');
		var spinner = new Spinner(opts).spin(target);

		$(window).resize(function(){
			Helper.resetLayout();
			resizeBlogElements();
		});

		$(document).ready(function(){
			$("#loader-container").fadeIn();
		});

		function init()
		{
			// if (!configOptions.sharingurl) {
			// 	if(location.host.match("localhost") || location.host.match("storymaps.esri.com") || location.host.match("c9.io"))
			// 		configOptions.sharingurl = "http://www.arcgis.com/sharing/rest/content/items";
			// 	else
			// 		configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
			// }
			configOptions.sharingurl = "http://www.arcgis.com/sharing/rest/content/items";

			if (configOptions.geometryserviceurl && location.protocol === "https:")
				configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');

			esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
			esri.config.defaults.io.proxyUrl = configOptions.proxyurl;
			esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);

			var urlObject = esri.urlToObject(document.location.href);
			urlObject.query = urlObject.query || {};

			if (urlObject.query.edit || urlObject.query.edit === "") {
				_isBuilder = true;
				$("body").addClass("builder");
			}
			if (urlObject.query.preview || urlObject.query.preview === "") {
				_isPreview = true;
			}
			if (urlObject.query.embed || urlObject.query.embed === "") {
				_isEmbed = true;
			}
			if (urlObject.query.layout) {
				_layout = urlObject.query.layout;
			}
			if (urlObject.query.post) {
				configOptions.post = urlObject.query.post;
			}

			//is an appid specified - if so read json from there
			if(configOptions.appid || (urlObject.query && urlObject.query.appid)){
				var appid = configOptions.appid || urlObject.query.appid;
				var requestHandle = esri.request({
					url: configOptions.sharingurl + "/" + appid + "/data",
					content: {f:"json"},
					callbackParamName:"callback",
					load: function(response){
						if(response.values.title !== undefined){configOptions.title = response.values.title;}
						if(response.values.subtitle !== undefined){configOptions.subtitle = response.values.subtitle;}
						if(response.values.socialURL !== undefined){configOptions.socialURL = response.values.socialURL;}
						if(response.values.webmap !== undefined) {configOptions.webmap = response.values.webmap;}
						if(response.values.editors !== undefined) {configOptions.authorizedEditors = unescape(response.values.editors).split(",");}
						if(response.values.featureService !== undefined){configOptions.featureService = response.values.featureService;}
						if(response.values.iconHeight !== undefined){configOptions.iconHeight = response.values.iconHeight;}
						if(response.values.sortBy !== undefined) {configOptions.sortBy = response.values.sortBy;}
						if(response.values.order !== undefined){configOptions.order = response.values.order;}
						if(response.values.postsPerPage !== undefined){configOptions.postsPerPage = response.values.postsPerPage;}
						if(response.values.allowDeletes !== undefined) {configOptions.allowDeletes = response.values.allowDeletes;}
						if(response.values.cumulativeTime !== undefined) {configOptions.cumulativeTime = response.values.cumulativeTime;}
						if(response.values.alwaysDisplayPoints !== undefined){configOptions.alwaysDisplayPoints = response.values.alwaysDisplayPoints;}
						if(response.values.earliestYear !== undefined){configOptions.earliestYear = response.values.earliestYear;}
						createAppVariables();
					},
					error: function(response){
						var e = response.message;
						alert("Error: " +  response.message);
					}
				});
			}
			else{
				createAppVariables();
			}
		}

		function createAppVariables()
		{
			if(_isEmbed || $("#application-window").width() <= 768){
				if(_isEmbed){
					$("#banner").hide();
				}
				if(_layout === "narrow" || $("#application-window").width() <= 768){
					$(".narrow-hide").hide();
					$(".mobile-hide").hide();
					$()
					$("#blog-wrapper").css({
						"height": "70%",
						"width": "100%"
					}).removeClass("region-left").addClass("region-bottom");
					configOptions.postsPerPage = 5;
				}
			}
			Helper.resetLayout();
			
			var orderByFields = configOptions.sortBy + " " + configOptions.order;

			var searchStr = "?post=";
			if(location.search !== ""){
				searchStr = location.search + "&post=";
			}

			app = {
				//Esri map variable
				map: null,
				//Portal
				portal: null,
				//Feature services layer holding blog posts
				blogLayer: new esri.layers.FeatureLayer(configOptions.featureService,{
					outFields: ["*"]
				}),
				blogData: new BlogData(configOptions.authorizedEditors,_isBuilder,_isPreview,getDraftVisible,getHiddenVisible,orderByFields,configOptions.postsPerPage,configOptions.post),
				blog: null,
				shareSettings: {
					url: configOptions.socialURL || location.origin + location.pathname + searchStr,
					title: "",
					summary: ""
				}
			}

			checkCredentials();
		}

		function checkCredentials()
		{
			if(_isBuilder && configOptions.authorizedEditors.length > 0){
				portalLogin().then(function(){
					var load = false;
					dojo.forEach(esri.id.credentials,function(user){
						if($.inArray(user.userId,configOptions.authorizedEditors) >= 0){
							load = true;
						}
					});
					if(load){
						//initFeatureServiceCreator();
						esri.id.getCredential(app.blogLayer.url);
						loadMap();
					}
					else{
						if(confirm("You do not have permissions to edit the blog. Would you like to return to blog preview?")){
							_isBuilder = false;
							loadMap();
						}
					}
				});
			}
			else{
				loadMap();
			}
		}

		function portalLogin()
		{
			var resultDeferred = new dojo.Deferred();
			var portalUrl = configOptions.sharingurl.split('/sharing/')[0];
			app.portal = new esri.arcgis.Portal(portalUrl);

			dojo.connect(esri.id, "onDialogCreate", styleIdentityManagerForLoad);
			app.portal.signIn().then(
				function() {
					resultDeferred.resolve();
				},
				function(error) {
					resultDeferred.reject();
				}
			);

			return resultDeferred;
		}

		function initFeatureServiceCreator()
		{
			require(["storymaps/geoblog/builder/FeatureServiceCreator"], function(FeatureServiceCreator){
				app.FSCreator = new FeatureServiceCreator(app.portal);
			});

			if(app.FSCreator.userIsOrgaPublisher()){

				app.portal.getPortalUser().getFolders().then(function(results){
					dojo.forEach(results,function(folder){
						$("#portal-folder-selector").append('<option data-id="' + folder.id + '">' + folder.title +'</option>')
					});
				});

				$("#dataPopup").modal({
					backdrop: false,
					keyboard: false
				});
				
				$("#create-feature-service").click(function(){
					app.FSCreator.createFS($("#feature-service-name").val(),$("#portal-folder-selector option:selected").data("id"));
				});
			}
		}

		function styleIdentityManagerForLoad()
		{
			// Hide default message
			$(".esriSignInDialog").find("#dijitDialogPaneContentAreaLoginText").css("display", "none");

			// Setup a more friendly text
			$(".esriSignInDialog").find(".dijitDialogPaneContentArea:first-child").find(":first-child").first().after("<div id='dijitDialogPaneContentAreaAtlasLoginText'>Please sign in with an account on <a href='http://" + esri.id._arcgisUrl + "' title='" + esri.id._arcgisUrl + "' target='_blank'>" + esri.id._arcgisUrl + "</a> to configure this application.</div>");
		}

		function setupBanner(title,subtitle)
		{
			document.title = title;
			$("#title").html(title);
			$("#subtitle").html(subtitle);
		}

		function loadMap()
		{
			var temp = new Popup({
				highlight: false
			}, domConstruct.create("div"));
			var popup = $("#application-window").width() > 768 ? temp : new esri.dijit.PopupMobile({highlight:false},dojo.create("div"));

			var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap,"map",{
				mapOptions: {
					sliderPosition: "top-right",
					infoWindow: popup
				}
			});

			$("#map").attr("webmap",configOptions.webmap);

			mapDeferred.addCallback(function(response){
				app.map = response.map;

				if($("#application-window").width() <= 768){
					dojo.place(popup.domNode, response.map.root);
				}

				app.map.blogLayer = app.blogLayer;
				//app.map.addLayer(app.map.blogLayer);

				app.map.legendLayers = esri.arcgis.utils.getLegendLayers(response);

				// dojo.connect(app.map.blogLayer,"onUpdateEnd",function(){
				// 	dojo.forEach(app.map.blogLayer.graphics,function(g){
				// 		if(g.attributes.geometry === "false"){
				// 			g.hide();
				// 		}
				// 	});
				// });

				//DISABLED UNTIL WORKING ON ADDITONAL WEBMAPS
				// dojo.connect(app.map.blogLayer,"onClick",function(event){
				// 	app.blogData.goToPageByItem(event.graphic.attributes[event.graphic.getLayer().objectIdField],function(index){
				// 		_selectByIndex = {
				// 			active: true,
				// 			index: index
				// 		}
				// 		$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
				// 	});
				// });

				if (app.map.loaded){
					initializeApp(response);
				}
				else {
					dojo.connect(app.map, "onLoad", function() {
						initializeApp(response);
					});
				}

			});
		}

		function initializeApp(response)
		{	
			var title = configOptions.title || response.itemInfo.item.title;
			var subtitle = configOptions.subtitle || response.itemInfo.item.subtitle;
			
			setupBanner(title,subtitle);

			app.shareSettings.title = title;
			app.shareSettings.sunmary = subtitle;
			
			loadBlog();

			$(".esriSimpleSliderIncrementButton").addClass("zoomButtonIn");
			$(".zoomButtonIn").last().after("<div class='esriSimpleSliderIncrementButton initExtentButton'><img style='margin-top:5px' src='resources/images/app/home.png'></div>");
			$(".initExtentButton").click(function(){
				app.blog.goToHomeState();
			});

			//Initialize blog resizer
			app.blogSizer = new dojo.dnd.move.constrainedMoveable(dojo.byId("blog-sizer"),{
				constraints: blogSizerBoundingBox
			});

			dojo.connect(app.blogSizer,"onMove",function(mover,pos){
				$("#blog-wrapper").css("width",pos.l);
				Helper.resetLayout();
				resizeBlogElements();
			});

			dojo.connect(app.blogSizer,"onMoveStop",function(mover,pos){
				app.map.resize();
				$(".map").not("#map").each(function(){
					$(this).data("map").resize();
				});
			});

			$(".blog-toggle").click(function(){
				if($("#blog-wrapper").outerHeight() > $("#application-window").height()/2){
					$("#blog-wrapper").css({
						"height": "25%",
						"width": "100%"
					});
					$(".blog-toggle").html('<i class="icon-arrow-up"></i>');
					$(".legend-wrapper").show();
				}
				else{
					$("#blog-wrapper").css({
						"height": "70%",
						"width": "100%"
					});
					$(".blog-toggle").html('<i class="icon-arrow-down"></i>');
					$(".legend-wrapper").hide();
				}
				Helper.resetLayout();
				resizeBlogElements();
				app.map.resize();
				$(".map").not("#map").each(function(){
					$(this).data("map").resize();
				});
			});
		}

		function blogSizerBoundingBox()
		{
			var bb = {
				t: ($("#content").height() / 2),
				l: $("#blog-navigation").width() + 400,
				h: 0,
				w: $("#content").width() - $("#blog-navigation").width() - 800
			}
			return bb;
		}

		function getScrollInertia(width)
		{
			if(width > 768){
				return 0;
			}
			else{
				return 950;
			}
		}

		function loadBlog()
		{
			app.blog = new BlogView("#map-wrapper",_blogSelector,app.map,app.map.blogLayer,configOptions.earliestYear,configOptions.cumulativeTime,"status","title","content","time","mapState","data",configOptions.iconHeight,function(){
				app.blogData.setBlogElements($(".geoblog-post"));

				if(_isBuilder){
					app.editor.addEditButtons(app.blogData.getBlogElements());
				}

				if($(_blogSelector).data("mCustomScrollbarIndex")){
					$(_blogSelector).mCustomScrollbar("destroy");
				}
				$(_blogSelector).mCustomScrollbar({
					theme: "dark-2",
					scrollInertia: getScrollInertia($("#application-window").width()),
					callbacks: {
						onScroll: function(){
							selectPostByScrollPosition();
						},
						whileScrolling: function(){
							if($("#application-window").width() <= 768){
								selectPostByScrollPosition();
							}
						}
					}
				});

				if(app.blogData.getBlogElements().length > 0){
					_selectByIndex = {
						active: true,
						index: _startPosition
					}

					setTimeout(function(){
						$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + _startPosition + ")");
						_selectReady = true;
					},100);

					selectPostByIndex();
				}

				//Hide Loading animation
				$("#loader-container").fadeOut();
				if($("#application-window").width() > 768){
					$(".legend-wrapper").show();
				}

				$(".blog-post-photo").load(function(){
					$(_blogSelector).mCustomScrollbar("update");
					$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + _startPosition + ")");
				});

				$(".geoblog-post").click(function(){
					if(!getEditStatus() && !$(this).hasClass("active")){
						_selectByIndex = {
							active: true,
							index: $(this).index()
						}
						$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + $(this).index() + ")");
						if($(_blogSelector).height() >= $(".mCSB_container").height()){
							selectPostByIndex();
						}
					}
				});

				resizeBlogElements();
			});

			app.blogData.init(app.blogLayer,function(graphics,startPosition){
				_selectReady = false;
				_startPosition = startPosition;
				addIndexDots(graphics,true);
				app.blog.update(graphics);
			});

			//Add post editor
			if(_isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor("#map-wrapper",_blogSelector,app.map,configOptions.earliestYear,configOptions.cumulativeTime,configOptions.alwaysDisplayPoints,configOptions.allowDeletes,".legend-toggle","#legend",function(){
						if(_layout !== "narrow" && $("#blog-sizer").is(":visible")){
							$("#blog-sizer").hide();
						}
					},function(status,blog,geo,position){
						var graphic,
							pt,
							adds,
							edits,
							deletes;
						
						if (geo){
							pt = geo;
						}
						else{
							pt = new esri.geometry.Point(0, 0);
						}

						graphic = new esri.Graphic(pt,null,blog);

						app.editor.cleanupEditor();
						$("#loader-container").fadeIn();

						if(status === "add"){
							adds = [graphic];
						}
						else if(status === "edit"){
							edits = [graphic];
						}
						else if(status === "delete"){
							deletes = [graphic];
						}
						app.blogData.editBlogPosts(adds,edits,deletes,position,function(){
							$(_blogSelector).mCustomScrollbar("scrollTo","bottom");
							$("#loader-container").fadeOut();
						});
						if(_layout !== "narrow" && !$("#blog-sizer").is(":visible") && $("#application-window").width() > 768){
							$("#blog-sizer").show();
						}
					},function(index){
						_selectByIndex = {
							active: true,
							index: index || $(".geoblog-post").length - 1
						}
						if(!index){
							$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + ($(".geoblog-post").length - 1) + ")");
						}
						selectPostByIndex();
						if(_layout !== "narrow" && !$("#blog-sizer").is(":visible") && $("#application-window").width() > 768){
							$("#blog-sizer").show();
						}
					});
				});

				app.editor.init(app.blogLayer,"graphicAttributes","status","time","geometry","mapState","data",function(newPost,location){
					if(!location){
						$(_blogSelector).mCustomScrollbar("update");
						if(newPost === true){
							$(_blogSelector).mCustomScrollbar("scrollTo","bottom");
						}
						else if(newPost === "newEdit"){
							if($(".temp-blog-post").position()){
								$(_blogSelector).mCustomScrollbar("scrollTo",$(".temp-blog-post").position().top);
							}
						}
						else{
							if($(".temp-blog-post").position()){
								if($(".temp-blog-post").outerHeight() > $(_blogSelector).height()){
									$(_blogSelector).mCustomScrollbar("scrollTo",$(".temp-blog-post").position().top + $(".temp-blog-post").outerHeight() - $("#blog").height());
								}
								else{
									$(_blogSelector).mCustomScrollbar("scrollTo",$(".temp-blog-post").position().top);	
								}
							}
						}
					}
					else{
						if(app.blog.getMultiTips()){
							app.blog.getMultiTips().clean();
						}
					}
				},function(newPost){
					$(_blogSelector).mCustomScrollbar("update");
					if(newPost === true){
						$(_blogSelector).mCustomScrollbar("scrollTo","bottom");
					}
					else{
						if($(".temp-blog-post").position()){
							if($(".temp-blog-post").outerHeight() > $(_blogSelector).height()){
								$(_blogSelector).mCustomScrollbar("scrollTo",$(".temp-blog-post").position().top + $(".temp-blog-post").outerHeight() - $("#blog").height());
							}
							else{
								$(_blogSelector).mCustomScrollbar("scrollTo",$(".temp-blog-post").position().top);	
							}
						}
					}
				},queryOnPostVisibilityChange);
			}
			else{
				if (app.map.legendLayers.length > 0) {
					var legend = new esri.dijit.Legend({
						map:app.map,
						layerInfos: app.map.legendLayers
					},"legend");
					legend.startup();
				}
				else{
					$("#legend").html("No legend");
				}
			}

			$(".nav-button").click(function(){
				if($(this).hasClass("prev-post")){					
					var index;

					if(app.blogData.getSelectedIndex() === 0){
						//TODO: Get previous page
						//index = $(".geoblog-post").length - 1;
						app.blogData.goToPrevPage();
					}
					else{
						index = app.blogData.getSelectedIndex() - 1;
						_selectByIndex = {
							active: true,
							index: index
						}
						$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
						if($(_blogSelector).height() >= $(".mCSB_container").height()){
							selectPostByIndex();
						}
					}
				}
				else{
					var index;
					
					if(app.blogData.getSelectedIndex() === $(".geoblog-post").length - 1){
						//TODO: Get next page
						//index = 0;
						app.blogData.goToNextPage();
					}
					else{
						index = app.blogData.getSelectedIndex() + 1;
						_selectByIndex = {
							active: true,
							index: index
						}
						$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
						if($(_blogSelector).height() >= $(".mCSB_container").height()){
							selectPostByIndex();
						}
					}
				}
			});

			$(".legend-toggle").click(function(){
				$(this).next().stop(true,true).slideToggle(400,function(){
					if(!_isBuilder){
						if($(this).is(":visible")){
							$(this).prev().html("LEGEND &#9650;");
						}
						else{
							$(this).prev().html("LEGEND &#9660;");
						}
					}
				});
			});
		}

		function selectPostByScrollPosition()
		{
			if(_selectReady){
				if (!_selectByIndex.active){
					var container = $("#blog .mCSB_container"),
						scrollTop = container.position().top,
						buffer = $(_blogSelector).height() / 4,
						selectPosition = {
							top: null,
							bottom: null,
							atTop: null,
							fullyShown: null,
							topQuarter: null,
							bottomQuarter: null
						};

					//Display pager tabs
					if(scrollTop >= -50 && !$("#page-up-tab").hasClass("disabled")){
						$("#page-up-tab").slideDown("fast");
					}
					else{
						$("#page-up-tab").slideUp("fast");
					}
					if(container.height() + scrollTop - (buffer*4) < 50 && !$("#page-down-tab").hasClass("disabled")){
						$("#page-down-tab").slideDown("fast");
					}
					else{
						$("#page-down-tab").slideUp("fast");
					}

					if(scrollTop === 0){
						selectPosition.top = 0;	
					}
					else if(container.height() + scrollTop - (buffer*4) < 50){
						selectPosition.bottom = $(".geoblog-post").length - 1;
					}
					else{
						$(".geoblog-post").each(function(){					
							if(scrollTop + $(this).position().top === 0){
								selectPosition.atTop = $(this).index();
							}
							if($(this).position().top + $(this).outerHeight() + scrollTop < $(_blogSelector).height() && scrollTop + $(this).position().top >= 0){
								selectPosition.fullyShown = $(this).index();
							}
							if(scrollTop + $(this).position().top <= buffer && scrollTop + $(this).position().top >= 0){
								selectPosition.topQuarter = $(this).index();
							}
							if($(this).position().top + $(this).outerHeight() + scrollTop >= $(_blogSelector).height() - buffer && $(this).position().top + $(this).outerHeight() + scrollTop < $(_blogSelector).height()){
								selectPosition.bottomQuarter = $(this).index();
							}
						});
					}

					var postIndex = null;

					if(selectPosition.top !== null){
						postIndex = selectPosition.top;
					}
					else if(selectPosition.bottom !== null){
						postIndex = selectPosition.bottom;
					}
					else if(selectPosition.atTop !== null){
						postIndex = selectPosition.atTop;
					}
					else if(selectPosition.fullyShown !== null){
						postIndex = selectPosition.fullyShown;
					}
					else if(selectPosition.topQuarter !== null){
						postIndex = selectPosition.topQuarter;
					}
					else if(selectPosition.bottomQuarter !== null){
						postIndex = selectPosition.bottomQuarter;
					}

					if (postIndex !== null){
						var current = app.blogData.getSelectedIndex();

						if(postIndex != current){
							if(postIndex > current){
								postIndex = current + 1;
							}
							else{
								postIndex = current - 1;
							}

							app.blogData.setPostByIndex(postIndex,getEditStatus(),selectPostCallback);
						}
					}
				}
				else{
					selectPostByIndex();
				}
			}
		}

		function selectPostByIndex()
		{
			if (_selectByIndex.active && _selectByIndex.index !== null){
				var container = $("#blog .mCSB_container"),
					scrollTop = container.position().top,
					buffer = $(_blogSelector).height() / 4,
					selectPosition = {
						top: null,
						bottom: null,
						atTop: null,
						fullyShown: null,
						topQuarter: null,
						bottomQuarter: null
					};

				//Display pager tabs
				if(scrollTop >= -50 && !$("#page-up-tab").hasClass("disabled")){
					$("#page-up-tab").slideDown("fast");
				}
				else{
					$("#page-up-tab").slideUp("fast");
				}
				if(container.height() + scrollTop - (buffer*4) < 50 && !$("#page-down-tab").hasClass("disabled")){
					$("#page-down-tab").slideDown("fast");
				}
				else{
					$("#page-down-tab").slideUp("fast");
				}
				
				_selectByIndex.active = false;
				app.blogData.setPostByIndex(_selectByIndex.index,getEditStatus(),selectPostCallback);
			}
		}

		function selectPostCallback(selctedIndex,blogPostGraphics,blogPostElements,editing)
		{
			app.blog.selectPost(selctedIndex,blogPostGraphics,blogPostElements,configOptions.alwaysDisplayPoints,editing);
			if(_isBuilder){
				app.editor.updateEditor();
			}
		}

		function getEditStatus()
		{
			if(app.editor === undefined){
				return false;
			}
			else{
				return app.editor.getEditStatus();
			}
		}

		function getDraftVisible()
		{
			if(app.editor === undefined){
				return false;
			}
			else{
				return app.editor.getDraftVisible();
			}
		}

		function getHiddenVisible()
		{
			if(app.editor === undefined){
				return false;
			}
			else{
				return app.editor.getHiddenVisible();
			}
		}

		function queryOnPostVisibilityChange()
		{
			$("#loader-container").fadeIn();
			app.blogData.updateQuery();
		}

		function addIndexDots(graphics,updateAll)
		{

			if(updateAll){
				$("#nav-index").empty();
			}
			
			dojo.forEach(graphics,function(g){
				$("#nav-index").append('<p class="post-index-bullet" title="' + g.attributes.title + '">&#9679;</p>');
			});

			var bullets = $(".post-index-bullet");
			$("#nav-index-wrapper").css("margin-top",($("#nav-index-wrapper").height() - ($(".page-button").height()*2) - (bullets.outerHeight() * bullets.length)) / 2);

			if(updateAll){
				$(".post-index-bullet").tooltip({
					placement: "right"
				}).click(function(){
					if(!$(this).hasClass("active")){
						_selectByIndex = {
							active: true,
							index: $(this).index()
						}
						$(_blogSelector).mCustomScrollbar("scrollTo",".geoblog-post:eq(" + $(this).index() + ")");
						if($(_blogSelector).height() >= $(".mCSB_container").height()){
							selectPostByIndex();
						}
					}
				});
			}
		}

		function resizeBlogElements()
		{
			//set position of blog resizer and display
			$("#blog-sizer").css({
				"left": $("#map-wrapper").position().left,
				"top": "50%"
			});			
			if(_layout !== "narrow" && !$("#blog-sizer").is(":visible") && $("#application-window").width() > 768){
				$("#blog-sizer").show();
			}
			if(app.blogSizer){
				app.blogSizer.constraints();
			}

			//Set embedable content to fill width of blog with a 16:9 ratio
			$(".blog-post-embed-wrapper iframe").height($(".blog-post-embed-wrapper iframe").width() * 0.563);

			//$(".blog-post-photo").width($(".blog-post-embed-wrapper iframe").width() - 10);

			var bullets = $(".post-index-bullet");
			$("#nav-index-wrapper").css("margin-top",($("#nav-index-wrapper").height() - ($(".page-button").height()*2) - (bullets.outerHeight() * bullets.length)) / 2);

			$(_blogSelector).mCustomScrollbar("update");
		}

		return {
			init: init
		}
	}
);