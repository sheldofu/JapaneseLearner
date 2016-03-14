/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
'use strict';

kanaMod.factory('KanaList', ['$http', function ($http) {
    //refactor to only call file once then store data
    var KanaList = {};
    var kanaset = {};
    
    var hiraganaSet = $http.get('res/kanalist.json')
                    .then(function(response) {
                      if (typeof response.data === 'object') {
                            return response.data;
                        }            
                    });

    var katakanaSet = $http.get('res/katakana.json')
                    .then(function(response) {
                      if (typeof response.data === 'object') {
                            return response.data;
                        }            
                    });

    KanaList.getKana = function(set) {
        if (set === 1) {
            kanaset = hiraganaSet;
        } else {
            kanaset = katakanaSet;
        }
        return kanaset;
    };

    // Kanalist.incrementScore = function() 
 
    return KanaList;

}]);

kanaMod.factory('AudioService', [function() {
  var audioElement = document.createElement('audio'); // <-- Magic trick here
  return {
    audioElement: audioElement,

    play: function(filename) {
        audioElement.src = filename;
        audioElement.play();     //  <-- Thats all you need
    }
    // Exersise for the reader - extend this service to include other functions
    // like pausing, etc, etc.

  };
}]);

kanaMod.controller('ToBeMainController', function(ScoreKeeper, AudioService, KanaList, $scope){
    $scope.score = 0;
    $scope.options = [];
    $scope.kana = {};
    $scope.correctKana = '';
    $scope.correct = false;
    $scope.kanaSet = 0;
    $scope.sound = 'res/audio/';
    $scope.kanaTotal = 0;

    $scope.gameInProgress = function() {
        if ($scope.kanaset && $scope.score!=2) {
            return true
        } else {
            return false;
        }
    };

    $scope.isCorrect = function(selectedOption) {
        $scope.correct = ScoreKeeper.isCorrect(selectedOption, $scope.correctKana);
        if ($scope.correct === true) {
            $scope.$broadcast('questionCorrect',{
                correctId: $scope.correctKana.id
            });
            $scope.score = $scope.score +1;
            $scope.correct = false;
            $scope.kanaOptions();

        }
    };

    $scope.setKanaSet = function(set){
        $scope.$broadcast('gameStarted',{
                game: 'start'
            });
        $scope.kanaSet = set;
        KanaList.getKana($scope.kanaSet)
        .then(function (data){
            $scope.kana = data;
            for (var x = 0; x < $scope.kana.length; x++) {
                $scope.kana[x].used = false;
            }
            $scope.kanaTotal = data.length;
            $scope.kanaOptions();
        });
    };

    $scope.kanaOptions = function() {
        var returnedKana = ScoreKeeper.newKana($scope.kana);
        $scope.options = returnedKana[0]; 
        $scope.correctKana = returnedKana[1];
        // $scope.options = ScoreKeeper.newKana($scope.kana);
        // $scope.correctKana = ScoreKeeper.correctKana($scope.options);
        AudioService.play($scope.sound + $scope.correctKana.romaji + ".m4a");
        for (var x = 0; x < $scope.kana.length; x++) {
            if ($scope.kana[x].id === $scope.correctKana.id) {
                $scope.kana[x].used = true;
            }
        }
    };

    // $scope.setCorrectKana = function() {
    //     $scope.correctKana = ScoreKeeper.correctKana($scope.options);
    //     AudioService.play($scope.sound);
    //     for (var x = 0; x < $scope.kana.length; x++) {
    //         if ($scope.kana[x].id === $scope.correctKana.id) {
    //             $scope.kana[x].used = true;
    //         }
    //     }
    // };

});

kanaMod.service('ScoreKeeper', [function() {

    this.isCorrect = function(chosen, correct){
        if (chosen === correct) {
            return true;
        } else {
            return false;
        }
    };

    this.newKana = function(kana) {
        var remainingKana = [];
        for (var x = 0; x < kana.length; x++) {
            if (kana[x].used === false) {
                remainingKana.push(kana[x]);
            }
        }

        var options = [];

        options[0] = kana[Math.floor((Math.random()*kana.length))];
        options[1] = kana[Math.floor((Math.random()*kana.length))];
        options[2] = kana[Math.floor((Math.random()*kana.length))];

        for (var x=1; x < options.length; x++) {
            if (options[x].romaji == options[x-1].romaji){
                options[x] = kana[Math.floor((Math.random()*kana.length))]; 
            }             
        }

        var correctOption = options[Math.floor((Math.random()*3))];

        return [options, correctOption];
    };

    // this.correctKana = function(options) {
    //     var correctOption = Math.floor((Math.random()*3));
    //     return options[correctOption];
    // };

}]);

kanaMod.directive('answerButton', function() {
    return {
        restrict:'E',
        scope: {
            option: '=options',
            checkAnswer: '&'
        },
        replace: true,
        template: '<button class="btn-japanese" ng-click="checkAnswer()">{{option.character}}</button>'
    };
});

kanaMod.directive('scGrid', function(){
    return {
        restrict: 'E',
        scope: {
            set: '='
        },
        template: '<div id="hira-{{$index}}" class="hira-ind fader" ng-class="{fadein: kanascore[$index].vis}" ng-repeat="n in kanascore">{{n.character}}</div>',
        link: function(scope, element, attrs) {
        },
        controller: function(ScoreKeeper,KanaList,$scope,$interval,$timeout){
         console.log($scope.set);
           $scope.kanascore = 0;

            KanaList.getKana($scope.set).then(function (data){
                    for (var count=0;count<data.length;count++) {
                        data[count].vis = false; 
                    }
                    $scope.kanascore = data;
                });

            $scope.$on('questionCorrect', function (event, data){
                for (var x=0; x < $scope.kanascore.length; x++){
                    if ($scope.kanascore[x].id === data.correctId){
                        $scope.kanascore[x].vis = true; 
                    }
                }
            });

            $scope.$on('gameStarted', function (){
                $interval.cancel($scope.showKana);
                $interval.cancel($scope.hideKana);
                for (var x=0; x < $scope.kanascore.length; x++) {
                    $scope.kanascore[x].vis = false;
                }
            });

            var timeCount = 0;
            var cancelTimeCount = 0;
            
            $scope.showKana = $interval(function(){  
                 $scope.kanascore[timeCount].vis = true;
                 timeCount++;
                 //console.log(timeCount);
                 if (timeCount===46) {
                    // $interval.cancel(showKana);
                    timeCount = 0;
                 }
            },200);

            $timeout(function() {
                $scope.hideKana = $interval(function(){
                    $scope.kanascore[cancelTimeCount].vis = false;
                    cancelTimeCount++;
                    //console.log(cancelTimeCount);
                    if (cancelTimeCount===46) {
                        // $interval.cancel(hideKana);
                        cancelTimeCount = 0;
                    }
                }, 200);
            }, 1200);
                }
    }
});