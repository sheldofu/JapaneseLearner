'use strict';

/**
 * @ngdoc overview
 * @name japaneseLearnerApp
 * @description
 * # japaneseLearnerApp
 *
 * Main module of the application.
 */
var kanaMod = angular
  .module('japaneseLearnerApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main',
        tab: 'mains'
      })
      .when('/hirakana', {
        templateUrl: 'views/hirakana.html',
        controller: 'HirakanaController',
        tab: 'hirakana'
      })
      .when('/knittykitty', {
        templateUrl: 'views/knittykitty.html',
        controller: 'KnittyController',
        tab: 'knittykitty'
      })
      .otherwise({
        redirectTo: '/'
      });

      $locationProvider.html5Mode(true);
  });
