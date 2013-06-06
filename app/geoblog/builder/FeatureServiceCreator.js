define(["dojo/_base/lang"],
	function(lang)
	{
		/**
		 * FeatureServiceCreator
		 * @class FeatureServiceCreator
		 *
		 * Create New Feature Service for GeoBlog
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function FeatureServiceCreator(portal)
		{
			var geoblogFSJson = {
				"service": {
					"currentVersion" : 10.11,
					"serviceDescription" : "",
					"hasVersionedData" : false,
					"supportsDisconnectedEditing" : false,
					"hasStaticData" : false,
					"maxRecordCount" : 2000,
					"supportedQueryFormats" : "JSON",
					"capabilities" : "Create,Query,Update,Editing",
					"description" : "",
					"copyrightText" : "",
					"spatialReference" : {
						"wkid" : 102100,
						"latestWkid" : 3857
					},
					"initialExtent" : {
						"xmin" : 0,
						"ymin" : -7.08115455161362E-10,
						"xmax" : 0,
						"ymax" : -7.08115455161362E-10,
						"spatialReference" : {
							"wkid" : 102100,
							"latestWkid" : 3857
						}
					},
					"fullExtent" : {
						"xmin" : -322878.008565971,
						"ymin" : -1.00070811545516E-06,
						"xmax" : 1E-06,
						"ymax" : 5007920.82026747,
						"spatialReference" : {
							"wkid" : 102100,
							"latestWkid" : 3857
						},
						"allowGeometryUpdates" : true,
						"units" : "esriMeters",
						"syncEnabled" : true,
						"editorTrackingInfo" : {
							"enableEditorTracking" : false,
							"enableOwnershipAccessControl" : false,
							"allowOthersToUpdate" : true,
							"allowOthersToDelete" : true
						},
						"xssPreventionInfo" : {
							"xssPreventionEnabled" : true,
							"xssPreventionRule" : "InputOnly",
							"xssInputRule" : "rejectInvalid"
						},
						"tables" : []
					},
					"layers": [{
						"currentVersion" : 10.11,
						"id" : 0,
						"name" : "GEOBLOG_DATA",
						"type" : "Feature Layer",
						"displayField" : "",
						"description" : "",
						"copyrightText" : "",
						"defaultVisibility" : true,
						"relationships" : [],
						"isDataVersioned" : false,
						"supportsRollbackOnFailureParameter" : true,
						"supportsStatistics" : true,
						"supportsAdvancedQueries" : true,
						"geometryType" : "esriGeometryPoint",
						"minScale" : 0,
						"maxScale" : 0,
						"extent" : {
							"xmin" : -322878.008565971,
							"ymin" : -1.00070811545516E-06,
							"xmax" : 1E-06,
							"ymax" : 5007920.82026747,
							"spatialReference" : {
								"wkid" : 102100,
								"latestWkid" : 3857
							}
						},
						"drawingInfo" : {
							"renderer" :
							{
								"type" : "simple",
								"symbol" :
								{
									"type" : "esriPMS",
									"url" : "R82897ac2-835b-488e-9af7-f391c622e333",
									"imageData" : "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTMwODcyNzZEMjdDMTFFMEFFOTVFRTBGMDE2NDc1MDUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTMwODcyNzdEMjdDMTFFMEFFOTVFRTBGMDE2NDc1MDUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1MzA4NzI3NEQyN0MxMUUwQUU5NUVFMEYwMTY0NzUwNSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1MzA4NzI3NUQyN0MxMUUwQUU5NUVFMEYwMTY0NzUwNSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpZmvGAAAApoSURBVHja7FsNcFRX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",
									"contentType" : "image/png",
									"width" : 32,
									"height" : 32,
									"angle" : 0,
									"xoffset" : 0,
									"yoffset" : 12
								},
								"label" : "",
								"description" : ""
							},
							"labelingInfo" : null
						},
						"timeInfo" : {
							"startTimeField" : "time",
							"endTimeField" : "",
							"trackIdField" : "",
							"timeExtent" : [],
							"timeReference" : {
								"timeZone" : "UTC",
								"respectDaylightSaving" : false
							},
							"timeInterval" : 0,
							"timeIntervalUnits" : "",
							"exportOptions" : {
								"useTime" : false,
								"timeDataCumulative" : false,
								"TimeOffset" : 0,
								"timeOffsetUnits" : "esriTimeUnitsCenturies"
							},
							"hasLiveData" : false
						},
						"allowGeometryUpdates" : true,
						"hasAttachments" : false,
						"htmlPopupType" : "esriServerHTMLPopupTypeNone",
						"hasM" : false,
						"hasZ" : false,
						"objectIdField" : "FID",
						"globalIdField" : "",
						"typeIdField" : "",
						"fields" : [{
							"name" : "title",
							"type" : "esriFieldTypeString",
							"alias" : "title",
							"sqlType" : "sqlTypeNVarchar",
							"length" : 349,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "content",
							"type" : "esriFieldTypeString",
							"alias" : "content", 
							"sqlType" : "sqlTypeNVarchar",
							"length" : 1368,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "time",
							"type" : "esriFieldTypeDate",
							"alias" : "time",
							"sqlType" : "sqlTypeTimestamp2",
							"length" : 8,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "geometry",
							"type" : "esriFieldTypeString",
							"alias" : "geometry",
							"sqlType" : "sqlTypeNVarchar",
							"length" : 1368,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "mapState",
							"type" : "esriFieldTypeString",
							"alias" : "mapState",
							"sqlType" : "sqlTypeNVarchar",
							"length" : 1368,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "data",
							"type" : "esriFieldTypeString",
							"alias" : "data",
							"sqlType" : "sqlTypeNVarchar",
							"length" : 1368,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "status",
							"type" : "esriFieldTypeString",
							"alias" : "status",
							"sqlType" : "sqlTypeNVarchar",
							"length" : 349,
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "x",
							"type" : "esriFieldTypeDouble",
							"alias" : "x",
							"sqlType" : "sqlTypeFloat",
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "y",
							"type" : "esriFieldTypeDouble",
							"alias" : "y",
							"sqlType" : "sqlTypeFloat",
							"nullable" : true,
							"editable" : true,
							"domain" : null,
							"defaultValue" : null
						},
						{
							"name" : "FID",
							"type" : "esriFieldTypeInteger",
							"alias" : "FID",
							"sqlType" : "sqlTypeInteger",
							"nullable" : false,
							"editable" : false,
							"domain" : null,
							"defaultValue" : null
						}],
						"types" : [],
						"templates" : [
						{
							"name" : "New Feature",
							"description" : "",
							"drawingTool" : "esriFeatureEditToolPoint",
							"prototype" : {
								"attributes" : {
									"title" : null,
									"content" : null,
									"time" : null,
									"geometry" : null,
									"mapState" : null,
									"data" : null,
									"status" : null,
									"x" : null,
									"y" : null
								}
							}
						}],
						"supportedQueryFormats" : "JSON",
						"hasStaticData" : false,
						"maxRecordCount" : 2000,
						"capabilities" : "Create,Query,Update,Editing"
					}]
				}
			};

			this.userIsOrgaPublisher = function()
			{
				var user = portal ? portal.getPortalUser() : null;
				return user && user.orgId && (user.role == 'org_admin' || user.role == 'org_publisher');
			}

			this.createFS = function(name,folderId)
			{
				isNameAvailable(name).then(function(){
					createService(geoblogFSJson, name, folderId, portal.getPortalUser()).then(function(){
						alert("Complete");
					});
				},function(){
					alert("Name Not Available");
				})
			}

			function isNameAvailable(name)
			{
				var resultDeferred = new dojo.Deferred();
				
				var rqUrl = getSharingURL() + "portals/" + portal.id + "/isServiceNameAvailable";
				var rqData = {
					f: "json",
					type: "Feature Service",
					name: name
				};
				
				request(rqUrl, rqData, true).then(
					function(result){
						if(result && result.available)
							resultDeferred.resolve();
						else
							resultDeferred.reject("NAME_NOT_AVAILABLE");
					},
					function(){
						resultDeferred.reject();
					}
				);
				
				return resultDeferred;
			}

			function createService(_serviceJSON, name, folder, user)
			{
				var serviceJSON = lang.clone(_serviceJSON);
				var resultDeferred = new dojo.Deferred();
				
				// Add the service name
				dojo.mixin(serviceJSON.service, {'name': name});

				// Service creation request
				var serviceRqUrl = getSharingURL() + "content/users/" + user.credential.userId + "/" + (folder ? folder + '/' : '') + "createService";
				
				var serviceRqData = {
					createParameters: dojo.toJson(serviceJSON.service),
					targetType: "featureService"
				};
				
				request(serviceRqUrl, serviceRqData, true).then(
					function(serviceRqResponse) {
						var layersRqUrl = getAdminUrl(serviceRqResponse.serviceurl) + "/AddToDefinition";
						var layersRqData = { addToDefinition: dojo.toJson({layers: serviceJSON.layers}) };
						// Force reuse of the portal token as
						// ArcGIS For Orga hosted FS are on on a different domain than the portal api
						console.log(layersRqUrl);
						console.log(layersRqData);
						var token = user.credential.token;
						request(layersRqUrl, layersRqData, true, token).then(
							function(layersRqResponse) {
								resultDeferred.resolve(serviceRqResponse);
							},
							function(){
								resultDeferred.reject();
							}
						);
					},
					function(){
						resultDeferred.reject();
					}
				);
					
				return resultDeferred;
			}

			function request(url, content, post, token)
			{
				var usePost = post || false;
				var content = content || {};
				var token = token || '';
				
				var requestDeferred = esri.request(
					{
						url: url,
						content: dojo.mixin(content, {f: 'json', token: token}),
						callbackParamName: 'callback',
						handleAs: 'json'
					},
					{
						usePost: usePost
					}
				);
				return requestDeferred;
			}

			function getSharingURL()
			{
				var sharingUrl = portal.portalUrl;
				
				if( portal.portalUrl.match('/sharing/rest/$') )
					sharingUrl = portal.portalUrl.split('/').slice(0,-2).join('/') + '/';
				else if ( portal.portalUrl.match('/sharing/rest$') )
					sharingUrl = portal.portalUrl.split('/').slice(0,-1).join('/') + '/';
				else if ( portal.portalUrl.match('/sharing$') )
					sharingUrl = portal.portalUrl + '/';
				
				return sharingUrl;
			}

			function getAdminUrl(url)
			{
				return url.replace("rest/services","admin/services").replace("/FeatureServer",".FeatureServer");
			}


		}
	}
);