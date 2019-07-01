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

kanaMod.factory('KanaList', ['$http', '$q', function ($http, $q) {

    let KanaList = {};
    let kanaset = {};
    
    return {
        getKana: function (set) {
            if (set == 1) {
                return $http.get('res/kanalist.json')
                .then(function(response) {
                    console.log(response);
                    if (typeof response.data === 'object') {
                            return response.data;
                        }            
                })
                .catch(function(response){
                    return $q.reject(response);
                })
            } else {
                return $http.get('res/katakana.json')
                .then(function(response) {
                if (typeof response.data === 'object') {
                        return response.data;
                    }            
                })
                .catch(function(response){
                    return $q.reject(response);
                });
            }
        }
    }

}]);

kanaMod.factory('AudioService', [function() {
  let audioElement = document.createElement('audio'); 
  return {
    audioElement: audioElement,

    play: function(filename) {
        audioElement.src = filename;
        audioElement.play();
    }
  };
}]);

kanaMod.controller('HirakanaController', function(ScoreKeeper, AudioService, KanaList, $scope){
    $scope.score = 0;
    $scope.options = [];
    $scope.kana = {};
    $scope.correctKana = '';
    $scope.correct = false;
    $scope.kanaSet = 0;
    $scope.sound = 'res/audio/';
    $scope.kanaTotal = 0;

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
        $scope.$broadcast('gameStarted');
        $scope.kanaSet = set;
        KanaList.getKana($scope.kanaSet)
        .then(function (data){
            $scope.kana = data.map((kana) => {
                kana.used = false;
                return kana
            });
            $scope.kanaTotal = $scope.kana.length;
            $scope.kanaOptions();
        })
        .catch(function(error){
            console.log(error);
        });
        
    };

    $scope.kanaOptions = function() {
        let returnedKana = ScoreKeeper.newKana($scope.kana);
        $scope.options = returnedKana[0]; 
        $scope.correctKana = returnedKana[1];
        AudioService.play($scope.sound + $scope.correctKana.romaji + ".m4a");
        $scope.kana = $scope.kana.map((kana) => {
            if (kana.id === $scope.correctKana.id) {
                kana.used = true;
            }
            return kana
        });

    };
});

kanaMod.service('ScoreKeeper', [function() {

    this.isCorrect = (chosen, correct) => chosen === correct ? true : false;

    this.newKana = function(kana) {
        
        let remainingKana = [];
        let options = [];

        remainingKana = kana.filter(val => val.used === false);

        options[0] = kana[Math.floor((Math.random()*kana.length))];
        options[1] = kana[Math.floor((Math.random()*kana.length))];
        options[2] = kana[Math.floor((Math.random()*kana.length))];

        for (let i=0; i < options.length; i++) {
            for (let x=0; x < options.length; x++) {
                if ((options[i].romaji == options[x].romaji) && (i != x)){
                    options[i] = kana[Math.floor((Math.random()*kana.length))]; 
                }             
            }
        }

        let randomCorrectOption = Math.floor((Math.random()*3));
        let correctOption = options[randomCorrectOption];

        return [options, correctOption];
    };

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
        template: '<div id="hira-{{$index}}" class="hira-ind fader" ng-class="{fadein: kanascore[$index].vis}" ng-repeat="n in kanascore track by n.id">{{n.character}}</div>',
        link: function(scope, element, attrs) {
        },
        controller: function(ScoreKeeper,KanaList,$scope,$interval,$timeout){
            console.log($scope.set);
            $scope.kanascore = 0;
            $scope.gameRunning = false;

            KanaList.getKana($scope.set)
                .then(function (data){
                    $scope.kanascore = data.map((kana) => {
                        kana.vis = false;
                        return kana;
                    })
                })
                .catch(function(error){
                        console.log(error);
                        throw new Error("Couldn't retrieve katakana file: " + error.data);
                    }
                )

            $scope.$on('questionCorrect', function (event, data){
                for (let x=0; x < $scope.kanascore.length; x++){
                    if ($scope.kanascore[x].id === data.correctId){
                        $scope.kanascore[x].vis = true; 
                    }
                }
            });

            $scope.$on('gameStarted', function (){
                $scope.gameRunning = true;
                $interval.cancel($scope.showKana);
                $interval.cancel($scope.hideKana);
                $scope.kanascore.map(kana => kana.vis = false);
            });

            let timeCount = 0;
            let cancelTimeCount = 0;
            
            $scope.showKana = $interval(function(){  
                 $scope.kanascore[timeCount].vis = true;
                 timeCount++;
                 if (timeCount===46) {
                    timeCount = 0;
                 }
            },200);

            $timeout(function() {
                if ($scope.gameRunning == false) { //stops interval being set later on if game started before interval initialised
                    $scope.hideKana = $interval(function(){
                        $scope.kanascore[cancelTimeCount].vis = false;
                        cancelTimeCount++;
                        if (cancelTimeCount===46) {
                            cancelTimeCount = 0;
                        }
                    }, 200);
                }
            }, 1200);
        }
    }
});