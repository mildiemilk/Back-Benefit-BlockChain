// // SPDX-License-Identifier: Apache-2.0

// 'use strict';

// var app = angular.module('application', []);

// // Angular Controller
// app.controller('appController', function($scope, appFactory){

// 	$("#success_holder").hide();
// 	$("#success_create").hide();
// 	$("#error_create").hide();
// 	$("#error_holder").hide();
// 	$("#error_query").hide();
	
// 	$scope.queryAllTuna = function(){

// 		appFactory.queryAllTuna(function(data){
// 			var array = [];
// 			for (var i = 0; i < data.length; i++){
// 				parseInt(data[i].Key);
// 				data[i].Record.Key = parseInt(data[i].Key);
// 				array.push(data[i].Record);
// 			}
// 			array.sort(function(a, b) {
// 			    return parseFloat(a.Key) - parseFloat(b.Key);
// 			});
// 			$scope.all_tuna = array;
// 		});
// 	}

// 	$scope.queryTuna = function(){

// 		var name = $scope.tuna_name;

// 		appFactory.queryTuna(name, function(data){
// 			$scope.query_tuna = data;

// 			if ($scope.query_tuna == "Could not locate tuna"){
// 				console.log()
// 				$("#error_query").show();
// 			} else{
// 				$("#error_query").hide();
// 			}
// 		});
// 	}

// 	$scope.recordTuna = function(){
// 		console.log('tunaScope==>');
// 		appFactory.recordTuna($scope.tuna, function(data){
// 			$scope.create_tuna = data;
// 			if ($scope.create_tuna == "Error: holder duplicate"){
// 				$("#error_create").show();
// 				$("#success_create").hide();
// 			} else{
// 				$("#success_create").show();
// 				$("#error_create").hide();
// 			}
// 		});
// 	}

// 	$scope.changeHolder = function(){

// 		appFactory.changeHolder($scope.holder, function(data){
// 			$scope.change_holder = data;
// 			if ($scope.change_holder == "Error: Duplicate"){
// 				$("#error_holder").show();
// 				$("#success_holder").hide();
// 			} else{
// 				$("#success_holder").show();
// 				$("#error_holder").hide();
// 			}
// 		});
// 	}

// });

// // Angular Factory
// app.factory('appFactory', function($http){
	
// 	var factory = {};

//     factory.queryAllTuna = function(callback){

//     	$http.get('/get_all_tuna/').success(function(output){
// 			callback(output)
// 		});
// 	}

// 	factory.queryTuna = function(name, callback){
//     	$http.get('/get_tuna/'+name).success(function(output){
// 			callback(output)
// 		});
// 	}

// 	factory.recordTuna = function(data, callback){

// 		// data.location = data.longitude + ", "+ data.latitude;
// 		console.log('recordTuna'+ data);
// 		var tuna = data.id+"-"+data.name + "-" + data.hospital + "-" + data.icd10 + "-" + data.dateclaim + "-" + data.price + "-" + data.time;
// 		console.log('Tuna'+ tuna);
//     	$http.get('/add_tuna/'+tuna).success(function(output){
// 			callback(output)
// 		});
// 	}

// 	factory.changeHolder = function(data, callback){

// 		var holder = data.id + "-" + data.status;

//     	$http.get('/change_holder/'+holder).success(function(output){
// 			callback(output)
// 		});
// 	}

// 	return factory;
// });


