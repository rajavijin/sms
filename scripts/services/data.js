'use strict';

/**
 * @ngdoc service
 * @name inditesmsApp.data
 * @description
 * # data
 * Service in the inditesmsApp.
 */
angular.module('inditesmsApp')
  .service('Data', function (FBURL, $window,  $q, $http, Ref, $firebaseArray, $firebaseObject, $rootScope) {
    // AngularJS will instantiate a singleton by calling "new" on this function 
    var Data = {
    	initTemplates: function() {
    		return $firebaseArray(Ref.child(settings.id+"/templates"));
    	},
    	initContacts: function() {
    		return $firebaseArray(Ref.child(settings.id+"/contacts"));
    	},
    	createTemplate: function(template) {
    		return Ref.child(settings.id+"/templates").push(template);
    	},
    	createTemplate: function(template) {
    		return Ref.child(settings.id+"/templates").push(template);
    	},
    	sendSMS: function(msgData) {
    		console.log("data", msgData);
			var defer = $q.defer();
			var response = function(resp) {
				console.log("resp", resp);
			}

			$http.jsonp("http://bhashsms.com/api/sendmsg.php?callback=JSON_CALLBACK", {params: msgData}).success(function(data) {
				console.log("data", data);
				defer.resolve(data);
			}).error(function(err, status, header, config) {
				console.log("error", err);
				console.log("resp", status);
				console.log("header", header);
				console.log("config", config);
				defer.reject(status);
			});
			// Delete the Requested With Header
			// delete $http.defaults.headers.common['X-Requested-With'];
			// $http({
			// url: "http://bhashsms.com/api/sendmsg.php?user=success&pass=654321&sender=BSHSMS&text=This is a  test message&priority=ndns&stype=normal", 
			// headers: {
			//    'Content-Type': 'application/jsonp'
			// },
			// method: "POST"
			// })
			// .success(function(data, status) {
			// console.log("data", data);
			// console.log("status", status);
			// 	defer.resolve(data);
			// },function(err) {
			// 	console.log("err", err);
			// 	defer.reject(error);
			// });

			// var req = {
			// 	method: 'POST',
			// 	url: 'http://bhashsms.com/api/sendmsg.php',
			// 	headers: {
			// 	  'Content-Type': 'application/json'
			// 	},
			// 	data: msgData
			// };

			// Make the API call
			//$http.post('http://bhashsms.com/api/sendmsg.php', msgData, {withCredentials:true}).success(function(resp){
			//}).error(function(error){
			//});
			return defer.promise;
    	},
    	getMenus: function(type) {
    		console.log("type", type);
    		if(type == "school") {
		        return [{
				  'title': 'Compose',
				  'href': '/compose',
				  'class': 'mdi-content-send',
				},{
		          'title': 'Contacts',
		          'href': '/contacts',
		          'class': 'mdi-communication-quick-contacts-dialer',
		        },{
		          'title': 'Templates',
		          'href': '/templates',
		          'class': 'mdi-communication-textsms	'
		        }];
			} else if(type == "office") {
				return [{
				  'title': 'Dashboard',
				  'href': '/dashboard',
				  'class': 'mdi-action-dashboard',
				},{
		          'title': 'Wall',
		          'href': '/wall',
		          'class': 'mdi-action-dashboard',
		        },
				{
				  'title': 'Add Teacher',
				  'href': '/addteacher',
				  'class': 'fa fa-user-md'
				},
				{
				  'title': 'Add Student',
				  'href': '/addstudent',
				  'class': 'fa fa-user'
				},
				 {
				  'title': 'Teachers',
				  'href': '/teachers',
				  'class': 'fa fa-user-md'
				},
				{
				  'title': 'Student',
				  'href': '/student',
				  'class': 'fa fa-user'
				},
				{
				  'title': 'Marks',
				  'href': '/addmarks',
				  'class': 'fa fa-user'
				}];
			} else {
				return [];
			}
    	}
    };
    return Data;
  });
