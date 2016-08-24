(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _reactDom = (typeof window !== "undefined" ? window['ReactDOM'] : typeof global !== "undefined" ? global['ReactDOM'] : null);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _app = require('./components/app.react');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_reactDom2.default.render(_react2.default.createElement(_app2.default, null), document.getElementById('app'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./components/app.react":2}],2:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _menu = require('./menu.react');

var _menu2 = _interopRequireDefault(_menu);

var _content = require('./content.react');

var _content2 = _interopRequireDefault(_content);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var App = function (_React$Component) {
    _inherits(App, _React$Component);

    function App() {
        _classCallCheck(this, App);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(App).call(this));

        _this.state = {
            page: 'search'
        };

        _this.changePage = _this.changePage.bind(_this);
        return _this;
    }

    // getInitialState() {
    //     return {
    //         page: 'main'
    //     }
    // }

    _createClass(App, [{
        key: 'changePage',
        value: function changePage(page) {
            console.log(page);
            this.setState({
                page: page
            });
        }
    }, {
        key: 'render',
        value: function render() {

            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(_menu2.default, { page: this.state.page, onChangePage: this.changePage }),
                _react2.default.createElement(_content2.default, { page: this.state.page })
            );
        }
    }]);

    return App;
}(_react2.default.Component);

exports.default = App;
;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./content.react":3,"./menu.react":4}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Content = function (_React$Component) {
	_inherits(Content, _React$Component);

	function Content() {
		_classCallCheck(this, Content);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(Content).call(this));
	}

	_createClass(Content, [{
		key: 'render',
		value: function render() {

			return _react2.default.createElement(
				'div',
				null,
				this.props.page
			);
		}
	}]);

	return Content;
}(_react2.default.Component);

exports.default = Content;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Menu = function (_React$Component) {
	_inherits(Menu, _React$Component);

	function Menu() {
		_classCallCheck(this, Menu);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Menu).call(this));

		_this.pages = ['main', 'search', 'add new', 'most_popular'];
		return _this;
	}

	_createClass(Menu, [{
		key: 'render',
		value: function render() {
			var _this2 = this;

			return _react2.default.DOM.ul({ className: 'nav nav-tabs' }, this.pages.map(function (p) {
				return _react2.default.DOM.li({ className: 'presentation' + (_this2.props.page == p ? ' active' : ''),
					key: p }, _react2.default.createElement(
					'a',
					{ onClick: function onClick() {
							return _this2.props.onChangePage(p);
						} },
					p
				));
			}));
		}
	}]);

	return Menu;
}(_react2.default.Component);

exports.default = Menu;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2Zyb250L2FwcC5qcyIsInNjcmlwdHMvZnJvbnQvY29tcG9uZW50cy9hcHAucmVhY3QiLCJzY3JpcHRzL2Zyb250L2NvbXBvbmVudHMvY29udGVudC5yZWFjdCIsInNjcmlwdHMvZnJvbnQvY29tcG9uZW50cy9tZW51LnJlYWN0Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxtQkFBUyxNQUFULENBQ0Usa0RBREYsRUFFRSxTQUFTLGNBQVQsQ0FBd0IsS0FBeEIsQ0FGRjs7Ozs7Ozs7Ozs7Ozs7QUNKQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQUVxQixHOzs7QUFDakIsbUJBQWM7QUFBQTs7QUFBQTs7QUFHVixjQUFLLEtBQUwsR0FBYTtBQUNULGtCQUFNO0FBREcsU0FBYjs7QUFJQSxjQUFLLFVBQUwsR0FBa0IsTUFBSyxVQUFMLENBQWdCLElBQWhCLE9BQWxCO0FBUFU7QUFRYjs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O21DQUVXLEksRUFBTTtBQUNiLG9CQUFRLEdBQVIsQ0FBWSxJQUFaO0FBQ0EsaUJBQUssUUFBTCxDQUFjO0FBQ1Ysc0JBQU07QUFESSxhQUFkO0FBR0g7OztpQ0FFUTs7QUFFTCxtQkFDSTtBQUFBO0FBQUE7QUFDSSxnRUFBTSxNQUFNLEtBQUssS0FBTCxDQUFXLElBQXZCLEVBQTZCLGNBQWMsS0FBSyxVQUFoRCxHQURKO0FBRUksbUVBQVMsTUFBTSxLQUFLLEtBQUwsQ0FBVyxJQUExQjtBQUZKLGFBREo7QUFNSDs7OztFQWhDNEIsZ0JBQU0sUzs7a0JBQWxCLEc7QUFpQ3BCOzs7Ozs7Ozs7Ozs7OztBQ3JDRDs7Ozs7Ozs7Ozs7O0lBRXFCLE87OztBQUNwQixvQkFBYztBQUFBOztBQUFBO0FBRWI7Ozs7MkJBRVE7O0FBRVIsVUFBUTtBQUFBO0FBQUE7QUFBTSxTQUFLLEtBQUwsQ0FBVztBQUFqQixJQUFSO0FBQ0E7Ozs7RUFSbUMsZ0JBQU0sUzs7a0JBQXRCLE87Ozs7Ozs7Ozs7Ozs7O0FDRnJCOzs7Ozs7Ozs7Ozs7SUFFcUIsSTs7O0FBQ3BCLGlCQUFjO0FBQUE7O0FBQUE7O0FBR2IsUUFBSyxLQUFMLEdBQWEsQ0FBQyxNQUFELEVBQVMsUUFBVCxFQUFtQixTQUFuQixFQUE4QixjQUE5QixDQUFiO0FBSGE7QUFJYjs7OzsyQkFFUTtBQUFBOztBQUNSLFVBQU8sZ0JBQU0sR0FBTixDQUFVLEVBQVYsQ0FBYSxFQUFDLFdBQVcsY0FBWixFQUFiLEVBQTBDLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxVQUFDLENBQUQsRUFBTztBQUN0RSxXQUFPLGdCQUFNLEdBQU4sQ0FBVSxFQUFWLENBQWEsRUFBQyxXQUFXLGtCQUFrQixPQUFLLEtBQUwsQ0FBVyxJQUFYLElBQW1CLENBQW5CLEdBQXVCLFNBQXZCLEdBQW1DLEVBQXJELENBQVo7QUFDcEIsVUFBSyxDQURlLEVBQWIsRUFDRTtBQUFBO0FBQUEsT0FBRyxTQUFTO0FBQUEsY0FBTSxPQUFLLEtBQUwsQ0FBVyxZQUFYLENBQXdCLENBQXhCLENBQU47QUFBQSxPQUFaO0FBQStDO0FBQS9DLEtBREYsQ0FBUDtBQUVBLElBSGdELENBQTFDLENBQVA7QUFLQTs7OztFQWJnQyxnQkFBTSxTOztrQkFBbkIsSSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgQXBwIGZyb20gJy4vY29tcG9uZW50cy9hcHAucmVhY3QnXG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPEFwcCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpXG4pOyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgTWVudSBmcm9tICcuL21lbnUucmVhY3QnO1xuaW1wb3J0IENvbnRlbnQgZnJvbSAnLi9jb250ZW50LnJlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgcGFnZTogJ3NlYXJjaCdcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hhbmdlUGFnZSA9IHRoaXMuY2hhbmdlUGFnZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAvLyAgICAgICAgIHBhZ2U6ICdtYWluJ1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgY2hhbmdlUGFnZShwYWdlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHBhZ2UpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBhZ2U6IHBhZ2VcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgIFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8TWVudSBwYWdlPXt0aGlzLnN0YXRlLnBhZ2V9IG9uQ2hhbmdlUGFnZT17dGhpcy5jaGFuZ2VQYWdlfSAvPlxuICAgICAgICAgICAgICAgIDxDb250ZW50IHBhZ2U9e3RoaXMuc3RhdGUucGFnZX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn07IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29udGVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cdH1cblxuXHRyZW5kZXIoKSB7XG5cblx0XHRyZXR1cm4gKDxkaXY+e3RoaXMucHJvcHMucGFnZX08L2Rpdj4pO1xuXHR9XG59IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLnBhZ2VzID0gWydtYWluJywgJ3NlYXJjaCcsICdhZGQgbmV3JywgJ21vc3RfcG9wdWxhciddO1xuXHR9XG5cblx0cmVuZGVyKCkge1xuXHRcdHJldHVybiBSZWFjdC5ET00udWwoe2NsYXNzTmFtZTogJ25hdiBuYXYtdGFicyd9LCB0aGlzLnBhZ2VzLm1hcCgocCkgPT4ge1xuXHRcdFx0cmV0dXJuIFJlYWN0LkRPTS5saSh7Y2xhc3NOYW1lOiAncHJlc2VudGF0aW9uJyArICh0aGlzLnByb3BzLnBhZ2UgPT0gcCA/ICcgYWN0aXZlJyA6ICcnKSAsXG5cdFx0XHRrZXk6IHB9LCA8YSBvbkNsaWNrPXsoKSA9PiB0aGlzLnByb3BzLm9uQ2hhbmdlUGFnZShwKX0+e3B9PC9hPik7XG5cdFx0fSkpO1xuXHRcdFxuXHR9XG59Il19
