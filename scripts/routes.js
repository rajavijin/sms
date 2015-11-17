'use strict';
var ldata = localStorage.getItem("settings");
if(ldata) {
  var settings = JSON.parse(CryptoJS.AES.decrypt(ldata, "*(%!%&@!@%").toString(CryptoJS.enc.Utf8));
} else {
  var settings = {};
}
var templates = '';
var contacts = '';
/**
 * @ngdoc overview
 * @name inditesmsApp:routes
 * @description
 * # routes.js
 *
 * Configure routes for use with Angular, and apply authentication security
 * Add new routes using `yo angularfire:route` with the optional --auth-required flag.
 *
 * Any controller can be secured so that it will only load if user is logged in by
 * using `whenAuthenticated()` in place of `when()`. This requires the user to
 * be logged in to view this route, and adds the current user into the dependencies
 * which can be injected into the controller. If user is not logged in, the promise is
 * rejected, which is handled below by $routeChangeError
 *
 * Any controller can be forced to wait for authentication to resolve, without necessarily
 * requiring the user to be logged in, by adding a `resolve` block similar to the one below.
 * It would then inject `user` as a dependency. This could also be done in the controller,
 * but abstracting it makes things cleaner (controllers don't need to worry about auth state
 * or timing of displaying its UI components; it can assume it is taken care of when it runs)
 *
 *   resolve: {
 *     user: ['Auth', function(Auth) {
 *       return Auth.$getAuth();
 *     }]
 *   }
 *
 */
angular.module('inditesmsApp')

/**
 * Adds a special `whenAuthenticated` method onto $routeProvider. This special method,
 * when called, invokes Auth.$requireAuth() service (see Auth.js).
 *
 * The promise either resolves to the authenticated user object and makes it available to
 * dependency injection (see AccountCtrl), or rejects the promise if user is not logged in,
 * forcing a redirect to the /login page
 */
  .config(['$routeProvider', 'SECURED_ROUTES', function($routeProvider, SECURED_ROUTES) {
    // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
    // unfortunately, a decorator cannot be use here because they are not applied until after
    // the .config calls resolve, so they can't be used during route configuration, so we have
    // to hack it directly onto the $routeProvider object
    $routeProvider.whenAuthenticated = function(path, route) {
      route.resolve = route.resolve || {};
      route.resolve.user = ['Auth', function(Auth) {
        return Auth.$requireAuth();
      }];
      $routeProvider.when(path, route);
      SECURED_ROUTES[path] = true;
      return $routeProvider;
    };
  }])

  // configure views; whenAuthenticated adds a resolve method to ensure users authenticate
  // before trying to access that route
  .config(['$routeProvider','$httpProvider' function($routeProvider, $httpProvider) {
    $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })

      .when('/chat', {
        templateUrl: 'views/chat.html',
        controller: 'ChatCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .whenAuthenticated('/account', {
        templateUrl: 'views/account.html',
        controller: 'AccountCtrl'
      })
      .when('/compose', {
        templateUrl: 'views/compose.html',
        controller: 'ComposeCtrl'
      })
      .when('/contacts', {
        templateUrl: 'views/contacts.html',
        controller: 'ContactsCtrl'
      })
      .when('/templates', {
        templateUrl: 'views/templates.html',
        controller: 'TemplatesCtrl',
        title: "Templates"
      })
      .otherwise({redirectTo: '/'});
  }])

 /**
   * Apply some route security. Any route's resolve method can reject the promise with
   * "AUTH_REQUIRED" to force a redirect. This method enforces that and also watches
   * for changes in auth status which might require us to navigate away from a path
   * that we can no longer view.
   */
  .run(['$rootScope', '$route', '$location', 'Auth', 'Data', 'SECURED_ROUTES', 'Ref', '$firebaseObject', 'loginRedirectPath', 'loggedInPath',
    function($rootScope, $route, $location, Auth, Data, SECURED_ROUTES, Ref, $firebaseObject, loginRedirectPath, loggedInPath) {
      // watch for login status changes and redirect if appropriate
      Auth.$onAuth(check);
      // some of our routes may reject resolve promises with the special {authRequired: true} error
      // this redirects to the login page whenever that is encountered
      $rootScope.$on('$routeChangeError', function(e, next, prev, err) {
        if( err === 'AUTH_REQUIRED' ) {
          $location.path(loginRedirectPath);
        }
      });

      $rootScope.$on('$routeChangeSuccess', function() {
        $rootScope.title = $route.current.title;
        console.log("rootscope user", $rootScope.user);
        if($rootScope.user) {
          $rootScope.user.$loaded().then(function() {
            if(!$rootScope.user.$id) {
              Auth.$unauth();
              $location.reload();
            }
          });
        }
      });

      function check(userdata) {
        if( !userdata && authRequired($location.path()) ) {
          $location.path(loginRedirectPath);
        } else if (userdata && ($location.path() == '/')) {
          $location.path(loggedInPath);
        }
        console.log("userdata", userdata);
        if(userdata && !$rootScope.user) {
          var i = 0;
          if((i = userdata.password.email.indexOf("-")) > 0) {
            var email = userdata.password.email.split("@");
            console.log("email", email);
            console.log("i", i);
            settings.role = "admin";
            settings.id = email[0];
            settings.uid = userdata.uid;
            settings.type = "school";
            localStorage.setItem("settings", CryptoJS.AES.encrypt(JSON.stringify(settings), "*(%!%&@!@%"));
          }
          $rootScope.user = $firebaseObject(Ref.child('users/'+userdata.uid));
          Data.initTemplates();
          Data.initContacts();
          $rootScope.menus = Data.getMenus(settings.type);

        }
      }

      function authRequired(path) {
        return SECURED_ROUTES.hasOwnProperty(path);
      }
    }
  ])

  // used by route security
  .constant('SECURED_ROUTES', {});
