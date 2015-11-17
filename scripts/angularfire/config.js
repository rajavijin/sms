angular.module('firebase.config', [])
  .constant('FBURL', 'https://inditesms.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['password'])

  .constant('loginRedirectPath', '/login')
  .constant('loggedInPath', '/compose');
