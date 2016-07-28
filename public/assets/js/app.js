(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _comment_box = require('./comment_box');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_reactDom2.default.render(_react2.default.createElement(_comment_box.CommentBox, null), document.getElementById('content'));

},{"./comment_box":3,"react":"react","react-dom":"react-dom"}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// import Remarkable from 'remarkable';

var Comment = function (_React$Component) {
    _inherits(Comment, _React$Component);

    function Comment() {
        _classCallCheck(this, Comment);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Comment).call(this));

        // this.md = new Remarkable();
    }

    _createClass(Comment, [{
        key: "render",
        value: function render() {

            return _react2.default.createElement(
                "div",
                { className: "comment" },
                _react2.default.createElement(
                    "h2",
                    { className: "commentAuthor" },
                    this.props.author
                ),
                this.props.children
            );
        }
    }]);

    return Comment;
}(_react2.default.Component);

exports.default = Comment;
;

},{"react":"react"}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CommentBox = exports.CommentForm = exports.CommentList = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _comment = require('./comment');

var _comment2 = _interopRequireDefault(_comment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CommentList = _react2.default.createClass({
  displayName: 'CommentList',

  render: function render() {
    return _react2.default.createElement(
      'div',
      { className: 'commentList' },
      _react2.default.createElement(
        _comment2.default,
        { author: 'Pete Hunt' },
        'This is one comment'
      ),
      _react2.default.createElement(
        _comment2.default,
        { author: 'Jordan Walke' },
        'This is *another* comment'
      )
    );
  }
});

var CommentForm = _react2.default.createClass({
  displayName: 'CommentForm',

  render: function render() {
    return _react2.default.createElement(
      'div',
      { className: 'commentForm' },
      'Hello, world! I am a CommentForm.'
    );
  }
});

var CommentBox = _react2.default.createClass({
  displayName: 'CommentBox',

  render: function render() {
    return _react2.default.createElement(
      'div',
      { className: 'commentBox' },
      _react2.default.createElement(
        'h1',
        null,
        'Comments'
      ),
      _react2.default.createElement(CommentList, null),
      _react2.default.createElement(CommentForm, null)
    );
  }
});

exports.CommentList = CommentList;
exports.CommentForm = CommentForm;
exports.CommentBox = CommentBox;

},{"./comment":2,"react":"react"}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2Zyb250L2FwcC5qcyIsInNjcmlwdHMvZnJvbnQvY29tbWVudC5qcyIsInNjcmlwdHMvZnJvbnQvY29tbWVudF9ib3guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLG1CQUFTLE1BQVQsQ0FDRSw0REFERixFQUVFLFNBQVMsY0FBVCxDQUF3QixTQUF4QixDQUZGOzs7Ozs7Ozs7OztBQ0pBOzs7Ozs7Ozs7Ozs7QUFDQTs7SUFFcUIsTzs7O0FBQ2pCLHVCQUFjO0FBQUE7O0FBQUE7O0FBR1Y7QUFDSDs7OztpQ0FFUTs7QUFFTCxtQkFDRTtBQUFBO0FBQUEsa0JBQUssV0FBVSxTQUFmO0FBQ0U7QUFBQTtBQUFBLHNCQUFJLFdBQVUsZUFBZDtBQUNHLHlCQUFLLEtBQUwsQ0FBVztBQURkLGlCQURGO0FBSUcscUJBQUssS0FBTCxDQUFXO0FBSmQsYUFERjtBQVFIOzs7O0VBakJnQyxnQkFBTSxTOztrQkFBdEIsTztBQWtCcEI7Ozs7Ozs7Ozs7QUNyQkQ7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBSSxjQUFjLGdCQUFNLFdBQU4sQ0FBa0I7QUFBQTs7QUFDbEMsVUFBUSxrQkFBVztBQUNqQixXQUNFO0FBQUE7QUFBQSxRQUFLLFdBQVUsYUFBZjtBQUNFO0FBQUE7QUFBQSxVQUFTLFFBQU8sV0FBaEI7QUFBQTtBQUFBLE9BREY7QUFFRTtBQUFBO0FBQUEsVUFBUyxRQUFPLGNBQWhCO0FBQUE7QUFBQTtBQUZGLEtBREY7QUFNRDtBQVJpQyxDQUFsQixDQUFsQjs7QUFXQSxJQUFJLGNBQWMsZ0JBQU0sV0FBTixDQUFrQjtBQUFBOztBQUNsQyxVQUFRLGtCQUFXO0FBQ2pCLFdBQ0U7QUFBQTtBQUFBLFFBQUssV0FBVSxhQUFmO0FBQUE7QUFBQSxLQURGO0FBS0Q7QUFQaUMsQ0FBbEIsQ0FBbEI7O0FBVUEsSUFBSSxhQUFhLGdCQUFNLFdBQU4sQ0FBa0I7QUFBQTs7QUFDakMsVUFBUSxrQkFBVztBQUNqQixXQUNFO0FBQUE7QUFBQSxRQUFLLFdBQVUsWUFBZjtBQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUEsT0FERjtBQUVFLG9DQUFDLFdBQUQsT0FGRjtBQUdFLG9DQUFDLFdBQUQ7QUFIRixLQURGO0FBT0Q7QUFUZ0MsQ0FBbEIsQ0FBakI7O1FBWVEsVyxHQUFBLFc7UUFBYSxXLEdBQUEsVztRQUFhLFUsR0FBQSxVIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7Q29tbWVudEJveCwgQ29tbWVudExpc3R9IGZyb20gJy4vY29tbWVudF9ib3gnXG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPENvbW1lbnRCb3ggLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50Jylcbik7IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0Jztcbi8vIGltcG9ydCBSZW1hcmthYmxlIGZyb20gJ3JlbWFya2FibGUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21tZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvLyB0aGlzLm1kID0gbmV3IFJlbWFya2FibGUoKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb21tZW50XCI+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwiY29tbWVudEF1dGhvclwiPlxuICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5hdXRob3J9XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAge3RoaXMucHJvcHMuY2hpbGRyZW59XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufTsiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IENvbW1lbnQgZnJvbSAnLi9jb21tZW50J1xuXG52YXIgQ29tbWVudExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29tbWVudExpc3RcIj5cbiAgICAgICAgPENvbW1lbnQgYXV0aG9yPVwiUGV0ZSBIdW50XCI+VGhpcyBpcyBvbmUgY29tbWVudDwvQ29tbWVudD5cbiAgICAgICAgPENvbW1lbnQgYXV0aG9yPVwiSm9yZGFuIFdhbGtlXCI+VGhpcyBpcyAqYW5vdGhlciogY29tbWVudDwvQ29tbWVudD5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn0pO1xuXG52YXIgQ29tbWVudEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29tbWVudEZvcm1cIj5cbiAgICAgICAgSGVsbG8sIHdvcmxkISBJIGFtIGEgQ29tbWVudEZvcm0uXG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59KTtcblxudmFyIENvbW1lbnRCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29tbWVudEJveFwiPlxuICAgICAgICA8aDE+Q29tbWVudHM8L2gxPlxuICAgICAgICA8Q29tbWVudExpc3QgLz5cbiAgICAgICAgPENvbW1lbnRGb3JtIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59KTtcblxuZXhwb3J0IHtDb21tZW50TGlzdCwgQ29tbWVudEZvcm0sIENvbW1lbnRCb3h9Il19
