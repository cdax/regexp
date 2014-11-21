angular.module('regexPlaygroundApp', ['ui.bootstrap.modal'])
.controller('RegexPlaygroundCtrl', function($scope, $modal) {
	$scope.regexSyntaxError = false;
	$scope.regex = '[A-Za-z]+';
	$scope.flag_i = false;
	$scope.flag_g = true;
	$scope.flag_m = false;
	$scope.match_count = 0;
	$scope.$watch('regex', function(regex_str) {
		try {
			var re = new RegExp(regex_str);
			$scope.regexSyntaxError = false;
		} catch(e) {
			$scope.regexSyntaxError = true;
		}
	});
	$scope.toast = function(title, message, timeout) {
		var modalInstance = $modal.open({
    		templateUrl: 'toast.html',
    		controller: 'ToastInstanceCtrl',
    		windowTemplateUrl: '<div tabindex="-1" role="dialog" class="modal fade" ng-class="{in: animate}" ng-style="{\'z-index\': 1050 + index*10, display: \'block\'}" ng-click="close($event)">\n    <div class="modal-dialog" ng-class="{\'modal-sm\': size == \'sm\', \'modal-lg\': size == \'lg\'}"><div class="modal-content" modal-transclude></div></div>\n</div>',
    		backdrop: false,
    		size: 'sm',
    		resolve: {
    			title: function() {return title;},
    			message: function() {return message;},
    			timeout: function() {return timeout;}
    		}
    	});
	};
})
.controller('ToastInstanceCtrl', function ($scope, $modalInstance, $timeout, title, message, timeout) {
	$scope.title = title;
	$scope.message = message;
	$scope.timeout = timeout || 3000;
	$timeout(function() {
		$modalInstance.dismiss('timed out');
	}, $scope.timeout);
})
.directive('rpText', function($window, $document) {
	var el_pre = '<div class="textarea" contenteditable spellcheck="false">', el_suf = '<br /></div>';
	var el_default = '<p>Welcome to RegEx Playground!</p><br /><p>This is a simple JavaScript regular expression tester. Start typing an expression above and see matches as you type. Since this is an early test release, there might be a few annoying bugs (https://github.com/c-das/regexp/issues), but I hope you enjoy using this tool anyway.</p><p>--Chitharanjan Das</p>';
	var match_pre = '<span class="match">', match_suf = '</span>';
	function empty_template() {
		return el_pre + el_suf;
	}
	function default_template() {
		return el_pre + el_default + el_suf;
	}
	function link(scope, element, attrs) {
		function clear_matches(element) {	
			var el_text = rangy.innerText($(element).get(0));
			element.html(el_pre + repl_newlines(el_text) + el_suf);
		}
		function repl_newlines(text) {
			return text.replace(/\n/g, '<br />');
		}
		function update_matches(element, regex_str, i, g, m) {var regex;
			var el_text = rangy.innerText($(element).get(0));
			var flags = (i ? 'i' : '') + (g ? 'g' : '') + (m ? 'm' : '');
			scope.match_count = 0;
			if(regex_str != '') {
				try {
					regex = new RegExp(regex_str, flags);
				} catch(e) {
					clear_matches(element);
					scope.match_count = 0;
					return;
				}
			} else {
				clear_matches(element);
				scope.match_count = 0;
				return;
			}
			var ctr = 0;
			var matches = regex.exec(el_text);
			if(matches == null || matches[0] == '' || regex_str == '' || el_text == '') {
				clear_matches(element);
				scope.match_count = 0;
				return;
			}
			if(g == true && regex_str != '' && el_text != '') {
				while(matches != null && matches[0] != "") {
					el_text = el_text.substring(0, matches.index)
			 				+ match_pre + matches[0] + match_suf
			 				+ el_text.substring(matches.index + matches[0].length, match_pre.length + el_text.length + match_suf.length);
					regex.lastIndex += (match_pre.length + match_suf.length);
					matches = regex.exec(el_text);
					++ctr;
				}
				element.html(el_pre + repl_newlines(el_text) + el_suf);
				scope.match_count = ctr;
			} else if(g == false && regex_str != '' && el_text != '' && matches != null && matches[0] != "") {
				el_text = el_text.substring(0, matches.index)
			 			+ match_pre + matches[0] + match_suf
			 			+ el_text.substring(matches.index + matches[0].length, match_pre.length + el_text.length + match_suf.length);
				element.html(el_pre + repl_newlines(el_text) + el_suf);
				scope.match_count = 1;
			}
		}
		scope.$watch(attrs.rpExp, function(regex) {
			update_matches(element, regex, scope.flag_i, scope.flag_g, scope.flag_m);
		});
		scope.$watch(attrs.rpFlagI, function(flag_i) {
			update_matches(element, scope.regex, flag_i, scope.flag_g, scope.flag_m);
		});
		scope.$watch(attrs.rpFlagG, function(flag_g) {
			update_matches(element, scope.regex, scope.flag_i, flag_g, scope.flag_m);
		});
		scope.$watch(attrs.rpFlagM, function(flag_m) {
			update_matches(element, scope.regex, scope.flag_i, scope.flag_g, flag_m);
		});
		scope.$watch(attrs.rpClearText, function(value) {
			if(value === true) {
				element.html(empty_template());
				scope.clear_text = false;
				scope.match_count = 0;
				$(element).children('div').get(0).focus();
			}
		});
		element.bind('blur keyup change', function(event) {
			if(event.type === 'keyup' && event.keyCode === 9) {
				return;
			}
			if(event.type === 'keyup' && event.ctrlKey && event.keyCode === 65) {
				rangy.getSelection().selectCharacters($(element).get(0), 0, rangy.innerText($(element).get(0)));
				return;
			}
			var selection = rangy.getSelection().saveCharacterRanges($(element).get(0));
			scope.$apply(function() {
				update_matches(element, scope.regex, scope.flag_i, scope.flag_g, scope.flag_m);
			});
			if(event.type === 'keyup' && (event.keyCode === 46 || event.keyCode === 8) && selection[0].characterRange.start === 0) {
				$(element).children('div').get(0).focus();
				return;
			}
			$(element).children('div').get(0).focus();
			rangy.getSelection().restoreCharacterRanges($(element).get(0), selection);
		});
	}
	return {
		restrict: 'E',
		template: default_template(),
		link: link,
		scope: {
			regex: '=rpExp',
			flag_i: '=rpFlagI',
			flag_g: '=rpFlagG',
			flag_m: '=rpFlagM',
			match_count: '=rpMatchCount',
			clear_text: '=rpClearText'
		}
	};
})
.directive('rpTooltip', function() {	
	function link(scope, elem) {
		$(elem).tooltip();
	}
	return {
		restrict: 'A',
		link: link
	};
});