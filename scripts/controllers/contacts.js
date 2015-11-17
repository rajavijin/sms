'use strict';

/**
 * @ngdoc function
 * @name inditesmsApp.controller:ContactsCtrl
 * @description
 * # ContactsCtrl
 * Controller of the inditesmsApp
 */
angular.module('inditesmsApp')
  .controller('ContactsCtrl', function ($scope, $rootScope, $window, $route, $location, $q, $timeout, Auth, Ref, Data) {
  console.log("Teacher Settings", settings);
  if(contacts) {
    $scope.contacts = contacts;
  } else {
    $scope.contacts = Data.initContacts();
  }
  $scope.list = false;
  $scope.groups = {};
  $scope.contacts.$loaded().then(function(ccsnap) {
  	//$scope.list = true;
  	$scope.displayedCollection = [].concat($scope.contacts);
  	angular.forEach(ccsnap, function(cval) {
  		$scope.groups[cval.type] = cval.type;
  	})
  });
  console.log("contacts", $scope.contacts);
  var reset = function() {
    $scope.import = false;
    $rootScope.title = "Contacts";
    $scope.msg = '';
    $scope.step = 1;
    $scope.newgroup = true;
    $scope.teacher = {};
    $scope.required = false;
  }
  $scope.contacttype = function(type) {
    if(type == 'new') {
      $scope.newgroup = true;
    } else {
      $scope.newgroup = false;
    }
  }
  reset();
  $scope.next = function(step) {
    console.log("Next Step", step);
    if(step == 2) {
      $scope.msg = "Creating Teacher...";
      console.log("finally", $scope.teacher);
      $scope.teacher.created = new Date().getTime();
      $scope.groups[$scope.teacher.type] = $scope.teacher.type;
      Ref.child(settings.id+"/contacts").orderByChild("phone").equalTo($scope.teacher.phone).once('value', function(tsnap) {
        console.log("snap val", tsnap.val());
        var cval = tsnap.val();
        if(cval === null) {
          $scope.contacts.$add($scope.teacher);
          console.log("New added", $scope.contacts);
          $scope.msg = "Contact has been created";
        } else {
          if(cval.type == $scope.teacher.type) {
            $scope.msg = "Contact already exists";
          } else {
            $scope.contacts.$add($scope.teacher);
            $scope.msg = "Contact has been created";            
          }
        }
      })
    } else {
      $scope.step = step + 1;
    }
  }
  //add to the real data holder
  $scope.addRandomItem = function addRandomItem() {
      $scope.rowCollection.push({name: "sahayas",phone: "8951562152",type: "10-a"});
  };

  //remove to the real data holder
  $scope.removeItem = function removeItem(row) {
      $scope.contacts.$remove(row);
  }

  $scope.selectGroup = function(groupType) {
  	$scope.teacher.type = groupType;
  	$scope.step++;
  }

  function showError() {
    alert("error");
  }

  function createProfile(userData, userDetails) {
    var ref = Ref.child(settings.sid+'/users/teacher/'+userData.uid), def = $q.defer();
    ref.set(userDetails, function(err) {
      $timeout(function() {
        if( err ) {
          def.reject(err);
        }
        else {
          def.resolve(ref);
        }
      });
    });
    return def.promise;
  }

  $scope.previous = function(step) {
  	console.log("Step", step);
  	$scope.step = step - 1;
  }
  $scope.createSubject = function() {
    $scope.teacher.subjects.push({subject:'',class:''});
	}
	$scope.removeSubject = function(index) {
		console.log("index", index);
  	$scope.teacher.subjects.splice(index, 1);
	}
  $scope.reset = function() {
    $scope.msg = "";
    reset();
  }
  // $scope.importing = true;
  // $scope.import = true;
  // $scope.importMsg = 'Import completed successfully.';
  $scope.importTeachers = function() {
    $rootScope.title = "Import Teachers";
    $scope.import = true;
    $scope.importing = false;
  }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      $scope.importing = true;
      $scope.importMsg = "Importing... ";
      var allusers = [];
      var newdata = csvdata;
      $scope.importTotal = newdata.length;
      console.log("csvdata", csvdata);
      for (var i = 0; i < $scope.importTotal; i++) {
        var userdata = {};
        for(var dkey in newdata[i]) {
          console.log("head", dkey);
          console.log("newdata i", newdata[i][dkey]);
          var head = dkey.toLowerCase().replace(/"/g, "").split(/[,]/);
            var row = newdata[i][dkey].split(/[,]/);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                if(head[ri]) userdata[head[ri]] = row[ri].replace(/"/g, "");
              };
            console.log("userdata", userdata);
            allusers.push(userdata);
            } 
        }
      }
    }

    console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
      $timeout(function() {$scope.importStatus = iteration + 1; $scope.importStatusP = parseInt(((iteration + 1)*100)/$scope.importTotal)+"%";},0);
      var userdata = {};
      userdata.pepper = Math.random().toString(36).slice(-8);
      userdata.subjects = [];
      var allsubjects = allusers[iteration].subjects.split(";");        
      for (var si = 0; si < allsubjects.length; si++) {
        var cdata = allsubjects[si].split(":");
        if(cdata[1].indexOf("-") == -1) cdata[1] = cdata[1] + "-all";
        userdata.subjects.push({subject: cdata[0], class:cdata[1]});
      };
      userdata.name = allusers[iteration].teacher;
      userdata.email = allusers[iteration].teacherphone + "t"+settings.sid+"@ge.com";
      userdata.phone = allusers[iteration].teacherphone;
      userdata.class = allusers[iteration].class;
      userdata.role = "teacher";
      console.log("iteration", userdata);
      Ref.child(settings.sid+"/users/teacher").orderByChild("email").equalTo(userdata.email).once('value', function(tsnap) {
        var key = tsnap.key();
        var val = tsnap.val();
        console.log("snap val", val);
        console.log("snap key", key);
        if(val === null) {
          Auth.$createUser({email: userdata.email, password: userdata.pepper})
          .then(function (usercreated) {
            console.log("user created", usercreated);
            return createProfile(usercreated, userdata);
          })
          .then(function() { 
            if(iteration != (allusers.length -1)) {
              iteration++;
              alluserSubmit(iteration);
            } else {
              $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
              $location.path('/addteacher');
            }
          }, showError);
        } else {
          for(var kval in val) {
            console.log("keyval", kval);
            console.log("val", val[kval]);
            var vval = val[kval];
            vval.phone = userdata.phone;
            vval.subjects = userdata.subjects;
            Ref.child(settings.sid+"/users/teacher/"+kval).set(vval);
            if(iteration != (allusers.length -1)) {
              iteration++;
              alluserSubmit(iteration);
            } else {
              console.log("Final");
              $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
              $location.path('/addteacher');
            }
          }
        }
      });
    }
    alluserSubmit(0);
  }
});