(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (root['Autolinker'] = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Autolinker'] = factory();
  }
}(this, function () {

/*!
 * Autolinker.js
 * 0.15.3
 *
 * Copyright(c) 2015 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 *
 * https://github.com/gregjacobs/Autolinker.js
 */
/**
 * @class Autolinker
 * @extends Object
 * 
 * Utility class used to process a given string of text, and wrap the URLs, email addresses, and Twitter handles in 
 * the appropriate anchor (&lt;a&gt;) tags to turn them into links.
 * 
 * Any of the configuration options may be provided in an Object (map) provided to the Autolinker constructor, which
 * will configure how the {@link #link link()} method will process the links.
 * 
 * For example:
 * 
 *     var autolinker = new Autolinker( {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *     
 *     var html = autolinker.link( "Joe went to www.yahoo.com" );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 * 
 * 
 * The {@link #static-link static link()} method may also be used to inline options into a single call, which may
 * be more convenient for one-off uses. For example:
 * 
 *     var html = Autolinker.link( "Joe went to www.yahoo.com", {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 * 
 * 
 * ## Custom Replacements of Links
 * 
 * If the configuration options do not provide enough flexibility, a {@link #replaceFn} may be provided to fully customize
 * the output of Autolinker. This function is called once for each URL/Email/Twitter handle match that is encountered.
 * 
 * For example:
 * 
 *     var input = "...";  // string with URLs, Email Addresses, and Twitter Handles
 *     
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *         
 *             switch( match.getType() ) {
 *                 case 'url' : 
 *                     console.log( "url: ", match.getUrl() );
 *                     
 *                     if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
 *                         var tag = autolinker.getTagBuilder().build( match );  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
 *                         tag.setAttr( 'rel', 'nofollow' );
 *                         tag.addClass( 'external-link' );
 *                         
 *                         return tag;
 *                         
 *                     } else {
 *                         return true;  // let Autolinker perform its normal anchor tag replacement
 *                     }
 *                     
 *                 case 'email' :
 *                     var email = match.getEmail();
 *                     console.log( "email: ", email );
 *                     
 *                     if( email === "my@own.address" ) {
 *                         return false;  // don't auto-link this particular email address; leave as-is
 *                     } else {
 *                         return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
 *                     }
 *                 
 *                 case 'twitter' :
 *                     var twitterHandle = match.getTwitterHandle();
 *                     console.log( twitterHandle );
 *                     
 *                     return '<a href="http://newplace.to.link.twitter.handles.to/">' + twitterHandle + '</a>';
 *             }
 *         }
 *     } );
 * 
 * 
 * The function may return the following values:
 * 
 * - `true` (Boolean): Allow Autolinker to replace the match as it normally would.
 * - `false` (Boolean): Do not replace the current match at all - leave as-is.
 * - Any String: If a string is returned from the function, the string will be used directly as the replacement HTML for
 *   the match.
 * - An {@link Autolinker.HtmlTag} instance, which can be used to build/modify an HTML tag before writing out its HTML text.
 * 
 * @constructor
 * @param {Object} [config] The configuration options for the Autolinker instance, specified in an Object (map).
 */
var Autolinker = function( cfg ) {
	Autolinker.Util.assign( this, cfg );  // assign the properties of `cfg` onto the Autolinker instance. Prototype properties will be used for missing configs.
};


Autolinker.prototype = {
	constructor : Autolinker,  // fix constructor property
	
	/**
	 * @cfg {Boolean} urls
	 * 
	 * `true` if miscellaneous URLs should be automatically linked, `false` if they should not be.
	 */
	urls : true,
	
	/**
	 * @cfg {Boolean} email
	 * 
	 * `true` if email addresses should be automatically linked, `false` if they should not be.
	 */
	email : true,
	
	/**
	 * @cfg {Boolean} twitter
	 * 
	 * `true` if Twitter handles ("@example") should be automatically linked, `false` if they should not be.
	 */
	twitter : true,
	
	/**
	 * @cfg {Boolean} newWindow
	 * 
	 * `true` if the links should open in a new window, `false` otherwise.
	 */
	newWindow : true,
	
	/**
	 * @cfg {Boolean} stripPrefix
	 * 
	 * `true` if 'http://' or 'https://' and/or the 'www.' should be stripped from the beginning of URL links' text, 
	 * `false` otherwise.
	 */
	stripPrefix : true,
	
	/**
	 * @cfg {Number} truncate
	 * 
	 * A number for how many characters long URLs/emails/twitter handles should be truncated to inside the text of 
	 * a link. If the URL/email/twitter is over this number of characters, it will be truncated to this length by 
	 * adding a two period ellipsis ('..') to the end of the string.
	 * 
	 * For example: A url like 'http://www.yahoo.com/some/long/path/to/a/file' truncated to 25 characters might look
	 * something like this: 'yahoo.com/some/long/pat..'
	 */
	truncate : undefined,
	
	/**
	 * @cfg {String} className
	 * 
	 * A CSS class name to add to the generated links. This class will be added to all links, as well as this class
	 * plus url/email/twitter suffixes for styling url/email/twitter links differently.
	 * 
	 * For example, if this config is provided as "myLink", then:
	 * 
	 * - URL links will have the CSS classes: "myLink myLink-url"
	 * - Email links will have the CSS classes: "myLink myLink-email", and
	 * - Twitter links will have the CSS classes: "myLink myLink-twitter"
	 */
	className : "",
	
	/**
	 * @cfg {Function} replaceFn
	 * 
	 * A function to individually process each URL/Email/Twitter match found in the input string.
	 * 
	 * See the class's description for usage.
	 * 
	 * This function is called with the following parameters:
	 * 
	 * @cfg {Autolinker} replaceFn.autolinker The Autolinker instance, which may be used to retrieve child objects from (such
	 *   as the instance's {@link #getTagBuilder tag builder}).
	 * @cfg {Autolinker.match.Match} replaceFn.match The Match instance which can be used to retrieve information about the
	 *   {@link Autolinker.match.Url URL}/{@link Autolinker.match.Email email}/{@link Autolinker.match.Twitter Twitter}
	 *   match that the `replaceFn` is currently processing.
	 */
	
	
	/**
	 * @private
	 * @property {Autolinker.htmlParser.HtmlParser} htmlParser
	 * 
	 * The HtmlParser instance used to skip over HTML tags, while finding text nodes to process. This is lazily instantiated
	 * in the {@link #getHtmlParser} method.
	 */
	htmlParser : undefined,
	
	/**
	 * @private
	 * @property {Autolinker.matchParser.MatchParser} matchParser
	 * 
	 * The MatchParser instance used to find URL/email/Twitter matches in the text nodes of an input string passed to
	 * {@link #link}. This is lazily instantiated in the {@link #getMatchParser} method.
	 */
	matchParser : undefined,
	
	/**
	 * @private
	 * @property {Autolinker.AnchorTagBuilder} tagBuilder
	 * 
	 * The AnchorTagBuilder instance used to build the URL/email/Twitter replacement anchor tags. This is lazily instantiated
	 * in the {@link #getTagBuilder} method.
	 */
	tagBuilder : undefined,
	
	
	/**
	 * Automatically links URLs, email addresses, and Twitter handles found in the given chunk of HTML. 
	 * Does not link URLs found within HTML tags.
	 * 
	 * For instance, if given the text: `You should go to http://www.yahoo.com`, then the result
	 * will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
	 * 
	 * This method finds the text around any HTML elements in the input `textOrHtml`, which will be the text that is processed.
	 * Any original HTML elements will be left as-is, as well as the text that is already wrapped in anchor (&lt;a&gt;) tags.
	 * 
	 * @param {String} textOrHtml The HTML or text to link URLs, email addresses, and Twitter handles within (depending on if
	 *   the {@link #urls}, {@link #email}, and {@link #twitter} options are enabled).
	 * @return {String} The HTML, with URLs/emails/Twitter handles automatically linked.
	 */
	link : function( textOrHtml ) {
		var htmlParser = this.getHtmlParser(),
		    htmlNodes = htmlParser.parse( textOrHtml ),
		    anchorTagStackCount = 0,  // used to only process text around anchor tags, and any inner text/html they may have
		    resultHtml = [];
		
		for( var i = 0, len = htmlNodes.length; i < len; i++ ) {
			var node = htmlNodes[ i ],
			    nodeType = node.getType(),
			    nodeText = node.getText();
			
			if( nodeType === 'element' ) {
				// Process HTML nodes in the input `textOrHtml`
				if( node.getTagName() === 'a' ) {
					if( !node.isClosing() ) {  // it's the start <a> tag
						anchorTagStackCount++;
					} else {   // it's the end </a> tag
						anchorTagStackCount = Math.max( anchorTagStackCount - 1, 0 );  // attempt to handle extraneous </a> tags by making sure the stack count never goes below 0
					}
				}
				resultHtml.push( nodeText );  // now add the text of the tag itself verbatim
				
			} else if( nodeType === 'entity' ) {
				resultHtml.push( nodeText );  // append HTML entity nodes (such as '&nbsp;') verbatim
				
			} else {
				// Process text nodes in the input `textOrHtml`
				if( anchorTagStackCount === 0 ) {
					// If we're not within an <a> tag, process the text node to linkify
					var linkifiedStr = this.linkifyStr( nodeText );
					resultHtml.push( linkifiedStr );
					
				} else {
					// `text` is within an <a> tag, simply append the text - we do not want to autolink anything 
					// already within an <a>...</a> tag
					resultHtml.push( nodeText );
				}
			}
		}
		
		return resultHtml.join( "" );
	},
	
	
	/**
	 * Process the text that lies in between HTML tags, performing the anchor tag replacements for matched 
	 * URLs/emails/Twitter handles, and returns the string with the replacements made. 
	 * 
	 * This method does the actual wrapping of URLs/emails/Twitter handles with anchor tags.
	 * 
	 * @private
	 * @param {String} str The string of text to auto-link.
	 * @return {String} The text with anchor tags auto-filled.
	 */
	linkifyStr : function( str ) {
		return this.getMatchParser().replace( str, this.createMatchReturnVal, this );
	},
	
	
	/**
	 * Creates the return string value for a given match in the input string, for the {@link #processTextNode} method.
	 * 
	 * This method handles the {@link #replaceFn}, if one was provided.
	 * 
	 * @private
	 * @param {Autolinker.match.Match} match The Match object that represents the match.
	 * @return {String} The string that the `match` should be replaced with. This is usually the anchor tag string, but
	 *   may be the `matchStr` itself if the match is not to be replaced.
	 */
	createMatchReturnVal : function( match ) {
		// Handle a custom `replaceFn` being provided
		var replaceFnResult;
		if( this.replaceFn ) {
			replaceFnResult = this.replaceFn.call( this, this, match );  // Autolinker instance is the context, and the first arg
		}
		
		if( typeof replaceFnResult === 'string' ) {
			return replaceFnResult;  // `replaceFn` returned a string, use that
			
		} else if( replaceFnResult === false ) {
			return match.getMatchedText();  // no replacement for the match
			
		} else if( replaceFnResult instanceof Autolinker.HtmlTag ) {
			return replaceFnResult.toString();
		
		} else {  // replaceFnResult === true, or no/unknown return value from function
			// Perform Autolinker's default anchor tag generation
			var tagBuilder = this.getTagBuilder(),
			    anchorTag = tagBuilder.build( match );  // returns an Autolinker.HtmlTag instance
			
			return anchorTag.toString();
		}
	},
	
	
	/**
	 * Lazily instantiates and returns the {@link #htmlParser} instance for this Autolinker instance.
	 * 
	 * @protected
	 * @return {Autolinker.htmlParser.HtmlParser}
	 */
	getHtmlParser : function() {
		var htmlParser = this.htmlParser;
		
		if( !htmlParser ) {
			htmlParser = this.htmlParser = new Autolinker.htmlParser.HtmlParser();
		}
		
		return htmlParser;
	},
	
	
	/**
	 * Lazily instantiates and returns the {@link #matchParser} instance for this Autolinker instance.
	 * 
	 * @protected
	 * @return {Autolinker.matchParser.MatchParser}
	 */
	getMatchParser : function() {
		var matchParser = this.matchParser;
		
		if( !matchParser ) {
			matchParser = this.matchParser = new Autolinker.matchParser.MatchParser( {
				urls : this.urls,
				email : this.email,
				twitter : this.twitter,
				stripPrefix : this.stripPrefix
			} );
		}
		
		return matchParser;
	},
	
	
	/**
	 * Returns the {@link #tagBuilder} instance for this Autolinker instance, lazily instantiating it
	 * if it does not yet exist.
	 * 
	 * This method may be used in a {@link #replaceFn} to generate the {@link Autolinker.HtmlTag HtmlTag} instance that 
	 * Autolinker would normally generate, and then allow for modifications before returning it. For example:
	 * 
	 *     var html = Autolinker.link( "Test google.com", {
	 *         replaceFn : function( autolinker, match ) {
	 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
	 *             tag.setAttr( 'rel', 'nofollow' );
	 *             
	 *             return tag;
	 *         }
	 *     } );
	 *     
	 *     // generated html:
	 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
	 * 
	 * @return {Autolinker.AnchorTagBuilder}
	 */
	getTagBuilder : function() {
		var tagBuilder = this.tagBuilder;
		
		if( !tagBuilder ) {
			tagBuilder = this.tagBuilder = new Autolinker.AnchorTagBuilder( {
				newWindow   : this.newWindow,
				truncate    : this.truncate,
				className   : this.className
			} );
		}
		
		return tagBuilder;
	}

};


/**
 * Automatically links URLs, email addresses, and Twitter handles found in the given chunk of HTML. 
 * Does not link URLs found within HTML tags.
 * 
 * For instance, if given the text: `You should go to http://www.yahoo.com`, then the result
 * will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
 * 
 * Example:
 * 
 *     var linkedText = Autolinker.link( "Go to google.com", { newWindow: false } );
 *     // Produces: "Go to <a href="http://google.com">google.com</a>"
 * 
 * @static
 * @param {String} textOrHtml The HTML or text to find URLs, email addresses, and Twitter handles within (depending on if
 *   the {@link #urls}, {@link #email}, and {@link #twitter} options are enabled).
 * @param {Object} [options] Any of the configuration options for the Autolinker class, specified in an Object (map).
 *   See the class description for an example call.
 * @return {String} The HTML text, with URLs automatically linked
 */
Autolinker.link = function( textOrHtml, options ) {
	var autolinker = new Autolinker( options );
	return autolinker.link( textOrHtml );
};


// Autolinker Namespaces
Autolinker.match = {};
Autolinker.htmlParser = {};
Autolinker.matchParser = {};
/*global Autolinker */
/*jshint eqnull:true, boss:true */
/**
 * @class Autolinker.Util
 * @singleton
 * 
 * A few utility methods for Autolinker.
 */
Autolinker.Util = {
	
	/**
	 * @property {Function} abstractMethod
	 * 
	 * A function object which represents an abstract method.
	 */
	abstractMethod : function() { throw "abstract"; },
	
	
	/**
	 * Assigns (shallow copies) the properties of `src` onto `dest`.
	 * 
	 * @param {Object} dest The destination object.
	 * @param {Object} src The source object.
	 * @return {Object} The destination object (`dest`)
	 */
	assign : function( dest, src ) {
		for( var prop in src ) {
			if( src.hasOwnProperty( prop ) ) {
				dest[ prop ] = src[ prop ];
			}
		}
		
		return dest;
	},
	
	
	/**
	 * Extends `superclass` to create a new subclass, adding the `protoProps` to the new subclass's prototype.
	 * 
	 * @param {Function} superclass The constructor function for the superclass.
	 * @param {Object} protoProps The methods/properties to add to the subclass's prototype. This may contain the
	 *   special property `constructor`, which will be used as the new subclass's constructor function.
	 * @return {Function} The new subclass function.
	 */
	extend : function( superclass, protoProps ) {
		var superclassProto = superclass.prototype;
		
		var F = function() {};
		F.prototype = superclassProto;
		
		var subclass;
		if( protoProps.hasOwnProperty( 'constructor' ) ) {
			subclass = protoProps.constructor;
		} else {
			subclass = function() { superclassProto.constructor.apply( this, arguments ); };
		}
		
		var subclassProto = subclass.prototype = new F();  // set up prototype chain
		subclassProto.constructor = subclass;  // fix constructor property
		subclassProto.superclass = superclassProto;
		
		delete protoProps.constructor;  // don't re-assign constructor property to the prototype, since a new function may have been created (`subclass`), which is now already there
		Autolinker.Util.assign( subclassProto, protoProps );
		
		return subclass;
	},
	
	
	/**
	 * Truncates the `str` at `len - ellipsisChars.length`, and adds the `ellipsisChars` to the
	 * end of the string (by default, two periods: '..'). If the `str` length does not exceed 
	 * `len`, the string will be returned unchanged.
	 * 
	 * @param {String} str The string to truncate and add an ellipsis to.
	 * @param {Number} truncateLen The length to truncate the string at.
	 * @param {String} [ellipsisChars=..] The ellipsis character(s) to add to the end of `str`
	 *   when truncated. Defaults to '..'
	 */
	ellipsis : function( str, truncateLen, ellipsisChars ) {
		if( str.length > truncateLen ) {
			ellipsisChars = ( ellipsisChars == null ) ? '..' : ellipsisChars;
			str = str.substring( 0, truncateLen - ellipsisChars.length ) + ellipsisChars;
		}
		return str;
	},
	
	
	/**
	 * Supports `Array.prototype.indexOf()` functionality for old IE (IE8 and below).
	 * 
	 * @param {Array} arr The array to find an element of.
	 * @param {*} element The element to find in the array, and return the index of.
	 * @return {Number} The index of the `element`, or -1 if it was not found.
	 */
	indexOf : function( arr, element ) {
		if( Array.prototype.indexOf ) {
			return arr.indexOf( element );
			
		} else {
			for( var i = 0, len = arr.length; i < len; i++ ) {
				if( arr[ i ] === element ) return i;
			}
			return -1;
		}
	},
	
	
	
	/**
	 * Performs the functionality of what modern browsers do when `String.prototype.split()` is called
	 * with a regular expression that contains capturing parenthesis.
	 * 
	 * For example:
	 * 
	 *     // Modern browsers: 
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', ',', 'b', ',', 'c' ]
	 *     
	 *     // Old IE (including IE8):
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', 'b', 'c' ]
	 *     
	 * This method emulates the functionality of modern browsers for the old IE case.
	 * 
	 * @param {String} str The string to split.
	 * @param {RegExp} splitRegex The regular expression to split the input `str` on. The splitting
	 *   character(s) will be spliced into the array, as in the "modern browsers" example in the 
	 *   description of this method. 
	 *   Note #1: the supplied regular expression **must** have the 'g' flag specified.
	 *   Note #2: for simplicity's sake, the regular expression does not need 
	 *   to contain capturing parenthesis - it will be assumed that any match has them.
	 * @return {String[]} The split array of strings, with the splitting character(s) included.
	 */
	splitAndCapture : function( str, splitRegex ) {
		if( !splitRegex.global ) throw new Error( "`splitRegex` must have the 'g' flag set" );
		
		var result = [],
		    lastIdx = 0,
		    match;
		
		while( match = splitRegex.exec( str ) ) {
			result.push( str.substring( lastIdx, match.index ) );
			result.push( match[ 0 ] );  // push the splitting char(s)
			
			lastIdx = match.index + match[ 0 ].length;
		}
		result.push( str.substring( lastIdx ) );
		
		return result;
	}
	
};
/*global Autolinker */
/*jshint boss:true */
/**
 * @class Autolinker.HtmlTag
 * @extends Object
 * 
 * Represents an HTML tag, which can be used to easily build/modify HTML tags programmatically.
 * 
 * Autolinker uses this abstraction to create HTML tags, and then write them out as strings. You may also use
 * this class in your code, especially within a {@link Autolinker#replaceFn replaceFn}.
 * 
 * ## Examples
 * 
 * Example instantiation:
 * 
 *     var tag = new Autolinker.HtmlTag( {
 *         tagName : 'a',
 *         attrs   : { 'href': 'http://google.com', 'class': 'external-link' },
 *         innerHtml : 'Google'
 *     } );
 *     
 *     tag.toString();  // <a href="http://google.com" class="external-link">Google</a>
 *     
 *     // Individual accessor methods
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 * 
 * 
 * Using mutator methods (which may be used in combination with instantiation config properties):
 * 
 *     var tag = new Autolinker.HtmlTag();
 *     tag.setTagName( 'a' );
 *     tag.setAttr( 'href', 'http://google.com' );
 *     tag.addClass( 'external-link' );
 *     tag.setInnerHtml( 'Google' );
 *     
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *     
 *     tag.toString();  // <a href="http://google.com" class="external-link">Google</a>
 *     
 * 
 * ## Example use within a {@link Autolinker#replaceFn replaceFn}
 * 
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance, configured with the Match's href and anchor text
 *             tag.setAttr( 'rel', 'nofollow' );
 *             
 *             return tag;
 *         }
 *     } );
 *     
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 *     
 *     
 * ## Example use with a new tag for the replacement
 * 
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = new Autolinker.HtmlTag( {
 *                 tagName : 'button',
 *                 attrs   : { 'title': 'Load URL: ' + match.getAnchorHref() },
 *                 innerHtml : 'Load URL: ' + match.getAnchorText()
 *             } );
 *             
 *             return tag;
 *         }
 *     } );
 *     
 *     // generated html:
 *     //   Test <button title="Load URL: http://google.com">Load URL: google.com</button>
 */
Autolinker.HtmlTag = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {String} tagName
	 * 
	 * The tag name. Ex: 'a', 'button', etc.
	 * 
	 * Not required at instantiation time, but should be set using {@link #setTagName} before {@link #toString}
	 * is executed.
	 */
	
	/**
	 * @cfg {Object.<String, String>} attrs
	 * 
	 * An key/value Object (map) of attributes to create the tag with. The keys are the attribute names, and the
	 * values are the attribute values.
	 */
	
	/**
	 * @cfg {String} innerHtml
	 * 
	 * The inner HTML for the tag. 
	 * 
	 * Note the camel case name on `innerHtml`. Acronyms are camelCased in this utility (such as not to run into the acronym 
	 * naming inconsistency that the DOM developers created with `XMLHttpRequest`). You may alternatively use {@link #innerHTML}
	 * if you prefer, but this one is recommended.
	 */
	
	/**
	 * @cfg {String} innerHTML
	 * 
	 * Alias of {@link #innerHtml}, accepted for consistency with the browser DOM api, but prefer the camelCased version
	 * for acronym names.
	 */
	
	
	/**
	 * @protected
	 * @property {RegExp} whitespaceRegex
	 * 
	 * Regular expression used to match whitespace in a string of CSS classes.
	 */
	whitespaceRegex : /\s+/,
	
	
	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration properties for this class, in an Object (map)
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
		
		this.innerHtml = this.innerHtml || this.innerHTML;  // accept either the camelCased form or the fully capitalized acronym
	},
	
	
	/**
	 * Sets the tag name that will be used to generate the tag with.
	 * 
	 * @param {String} tagName
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setTagName : function( tagName ) {
		this.tagName = tagName;
		return this;
	},
	
	
	/**
	 * Retrieves the tag name.
	 * 
	 * @return {String}
	 */
	getTagName : function() {
		return this.tagName || "";
	},
	
	
	/**
	 * Sets an attribute on the HtmlTag.
	 * 
	 * @param {String} attrName The attribute name to set.
	 * @param {String} attrValue The attribute value to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setAttr : function( attrName, attrValue ) {
		var tagAttrs = this.getAttrs();
		tagAttrs[ attrName ] = attrValue;
		
		return this;
	},
	
	
	/**
	 * Retrieves an attribute from the HtmlTag. If the attribute does not exist, returns `undefined`.
	 * 
	 * @param {String} name The attribute name to retrieve.
	 * @return {String} The attribute's value, or `undefined` if it does not exist on the HtmlTag.
	 */
	getAttr : function( attrName ) {
		return this.getAttrs()[ attrName ];
	},
	
	
	/**
	 * Sets one or more attributes on the HtmlTag.
	 * 
	 * @param {Object.<String, String>} attrs A key/value Object (map) of the attributes to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setAttrs : function( attrs ) {
		var tagAttrs = this.getAttrs();
		Autolinker.Util.assign( tagAttrs, attrs );
		
		return this;
	},
	
	
	/**
	 * Retrieves the attributes Object (map) for the HtmlTag.
	 * 
	 * @return {Object.<String, String>} A key/value object of the attributes for the HtmlTag.
	 */
	getAttrs : function() {
		return this.attrs || ( this.attrs = {} );
	},
	
	
	/**
	 * Sets the provided `cssClass`, overwriting any current CSS classes on the HtmlTag.
	 * 
	 * @param {String} cssClass One or more space-separated CSS classes to set (overwrite).
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setClass : function( cssClass ) {
		return this.setAttr( 'class', cssClass );
	},
	
	
	/**
	 * Convenience method to add one or more CSS classes to the HtmlTag. Will not add duplicate CSS classes.
	 * 
	 * @param {String} cssClass One or more space-separated CSS classes to add.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	addClass : function( cssClass ) {
		var classAttr = this.getClass(),
		    whitespaceRegex = this.whitespaceRegex,
		    indexOf = Autolinker.Util.indexOf,  // to support IE8 and below
		    classes = ( !classAttr ) ? [] : classAttr.split( whitespaceRegex ),
		    newClasses = cssClass.split( whitespaceRegex ),
		    newClass;
		
		while( newClass = newClasses.shift() ) {
			if( indexOf( classes, newClass ) === -1 ) {
				classes.push( newClass );
			}
		}
		
		this.getAttrs()[ 'class' ] = classes.join( " " );
		return this;
	},
	
	
	/**
	 * Convenience method to remove one or more CSS classes from the HtmlTag.
	 * 
	 * @param {String} cssClass One or more space-separated CSS classes to remove.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	removeClass : function( cssClass ) {
		var classAttr = this.getClass(),
		    whitespaceRegex = this.whitespaceRegex,
		    indexOf = Autolinker.Util.indexOf,  // to support IE8 and below
		    classes = ( !classAttr ) ? [] : classAttr.split( whitespaceRegex ),
		    removeClasses = cssClass.split( whitespaceRegex ),
		    removeClass;
		
		while( classes.length && ( removeClass = removeClasses.shift() ) ) {
			var idx = indexOf( classes, removeClass );
			if( idx !== -1 ) {
				classes.splice( idx, 1 );
			}
		}
		
		this.getAttrs()[ 'class' ] = classes.join( " " );
		return this;
	},
	
	
	/**
	 * Convenience method to retrieve the CSS class(es) for the HtmlTag, which will each be separated by spaces when
	 * there are multiple.
	 * 
	 * @return {String}
	 */
	getClass : function() {
		return this.getAttrs()[ 'class' ] || "";
	},
	
	
	/**
	 * Convenience method to check if the tag has a CSS class or not.
	 * 
	 * @param {String} cssClass The CSS class to check for.
	 * @return {Boolean} `true` if the HtmlTag has the CSS class, `false` otherwise.
	 */
	hasClass : function( cssClass ) {
		return ( ' ' + this.getClass() + ' ' ).indexOf( ' ' + cssClass + ' ' ) !== -1;
	},
	
	
	/**
	 * Sets the inner HTML for the tag.
	 * 
	 * @param {String} html The inner HTML to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setInnerHtml : function( html ) {
		this.innerHtml = html;
		
		return this;
	},
	
	
	/**
	 * Retrieves the inner HTML for the tag.
	 * 
	 * @return {String}
	 */
	getInnerHtml : function() {
		return this.innerHtml || "";
	},
	
	
	/**
	 * Override of superclass method used to generate the HTML string for the tag.
	 * 
	 * @return {String}
	 */
	toString : function() {
		var tagName = this.getTagName(),
		    attrsStr = this.buildAttrsStr();
		
		attrsStr = ( attrsStr ) ? ' ' + attrsStr : '';  // prepend a space if there are actually attributes
		
		return [ '<', tagName, attrsStr, '>', this.getInnerHtml(), '</', tagName, '>' ].join( "" );
	},
	
	
	/**
	 * Support method for {@link #toString}, returns the string space-separated key="value" pairs, used to populate 
	 * the stringified HtmlTag.
	 * 
	 * @protected
	 * @return {String} Example return: `attr1="value1" attr2="value2"`
	 */
	buildAttrsStr : function() {
		if( !this.attrs ) return "";  // no `attrs` Object (map) has been set, return empty string
		
		var attrs = this.getAttrs(),
		    attrsArr = [];
		
		for( var prop in attrs ) {
			if( attrs.hasOwnProperty( prop ) ) {
				attrsArr.push( prop + '="' + attrs[ prop ] + '"' );
			}
		}
		return attrsArr.join( " " );
	}
	
} );
/*global Autolinker */
/*jshint sub:true */
/**
 * @protected
 * @class Autolinker.AnchorTagBuilder
 * @extends Object
 * 
 * Builds anchor (&lt;a&gt;) tags for the Autolinker utility when a match is found.
 * 
 * Normally this class is instantiated, configured, and used internally by an {@link Autolinker} instance, but may 
 * actually be retrieved in a {@link Autolinker#replaceFn replaceFn} to create {@link Autolinker.HtmlTag HtmlTag} instances
 * which may be modified before returning from the {@link Autolinker#replaceFn replaceFn}. For example:
 * 
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
 *             tag.setAttr( 'rel', 'nofollow' );
 *             
 *             return tag;
 *         }
 *     } );
 *     
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 */
Autolinker.AnchorTagBuilder = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {Boolean} newWindow
	 * @inheritdoc Autolinker#newWindow
	 */
	
	/**
	 * @cfg {Number} truncate
	 * @inheritdoc Autolinker#truncate
	 */
	
	/**
	 * @cfg {String} className
	 * @inheritdoc Autolinker#className
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},
	
	
	/**
	 * Generates the actual anchor (&lt;a&gt;) tag to use in place of the matched URL/email/Twitter text,
	 * via its `match` object.
	 * 
	 * @param {Autolinker.match.Match} match The Match instance to generate an anchor tag from.
	 * @return {Autolinker.HtmlTag} The HtmlTag instance for the anchor tag.
	 */
	build : function( match ) {
		var tag = new Autolinker.HtmlTag( {
			tagName   : 'a',
			attrs     : this.createAttrs( match.getType(), match.getAnchorHref() ),
			innerHtml : this.processAnchorText( match.getAnchorText() )
		} );
		
		return tag;
	},
	
	
	/**
	 * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;) tag being generated.
	 * 
	 * @protected
	 * @param {"url"/"email"/"twitter"} matchType The type of match that an anchor tag is being generated for.
	 * @param {String} href The href for the anchor tag.
	 * @return {Object} A key/value Object (map) of the anchor tag's attributes. 
	 */
	createAttrs : function( matchType, anchorHref ) {
		var attrs = {
			'href' : anchorHref  // we'll always have the `href` attribute
		};
		
		var cssClass = this.createCssClass( matchType );
		if( cssClass ) {
			attrs[ 'class' ] = cssClass;
		}
		if( this.newWindow ) {
			attrs[ 'target' ] = "_blank";
		}
		
		return attrs;
	},
	
	
	/**
	 * Creates the CSS class that will be used for a given anchor tag, based on the `matchType` and the {@link #className}
	 * config.
	 * 
	 * @private
	 * @param {"url"/"email"/"twitter"} matchType The type of match that an anchor tag is being generated for.
	 * @return {String} The CSS class string for the link. Example return: "myLink myLink-url". If no {@link #className}
	 *   was configured, returns an empty string.
	 */
	createCssClass : function( matchType ) {
		var className = this.className;
		
		if( !className ) 
			return "";
		else
			return className + " " + className + "-" + matchType;  // ex: "myLink myLink-url", "myLink myLink-email", or "myLink myLink-twitter"
	},
	
	
	/**
	 * Processes the `anchorText` by truncating the text according to the {@link #truncate} config.
	 * 
	 * @private
	 * @param {String} anchorText The anchor tag's text (i.e. what will be displayed).
	 * @return {String} The processed `anchorText`.
	 */
	processAnchorText : function( anchorText ) {
		anchorText = this.doTruncate( anchorText );
		
		return anchorText;
	},
	
	
	/**
	 * Performs the truncation of the `anchorText`, if the `anchorText` is longer than the {@link #truncate} option.
	 * Truncates the text to 2 characters fewer than the {@link #truncate} option, and adds ".." to the end.
	 * 
	 * @private
	 * @param {String} text The anchor tag's text (i.e. what will be displayed).
	 * @return {String} The truncated anchor text.
	 */
	doTruncate : function( anchorText ) {
		return Autolinker.Util.ellipsis( anchorText, this.truncate || Number.POSITIVE_INFINITY );
	}
	
} );
/*global Autolinker */
/**
 * @private
 * @class Autolinker.htmlParser.HtmlParser
 * @extends Object
 * 
 * An HTML parser implementation which simply walks an HTML string and returns an array of 
 * {@link Autolinker.htmlParser.HtmlNode HtmlNodes} that represent the basic HTML structure of the input string.
 * 
 * Autolinker uses this to only link URLs/emails/Twitter handles within text nodes, effectively ignoring / "walking
 * around" HTML tags.
 */
Autolinker.htmlParser.HtmlParser = Autolinker.Util.extend( Object, {
	
	/**
	 * @private
	 * @property {RegExp} htmlRegex
	 * 
	 * The regular expression used to pull out HTML tags from a string. Handles namespaced HTML tags and
	 * attribute names, as specified by http://www.w3.org/TR/html-markup/syntax.html.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The "!DOCTYPE" tag name, if a tag is a &lt;!DOCTYPE&gt; tag.
	 * 2. If it is an end tag, this group will have the '/'.
	 * 3. The tag name for all tags (other than the &lt;!DOCTYPE&gt; tag)
	 */
	htmlRegex : (function() {
		var tagNameRegex = /[0-9a-zA-Z][0-9a-zA-Z:]*/,
		    attrNameRegex = /[^\s\0"'>\/=\x01-\x1F\x7F]+/,   // the unicode range accounts for excluding control chars, and the delete char
		    attrValueRegex = /(?:"[^"]*?"|'[^']*?'|[^'"=<>`\s]+)/, // double quoted, single quoted, or unquoted attribute values
		    nameEqualsValueRegex = attrNameRegex.source + '(?:\\s*=\\s*' + attrValueRegex.source + ')?';  // optional '=[value]'
		
		return new RegExp( [
			// for <!DOCTYPE> tag. Ex: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">) 
			'(?:',
				'<(!DOCTYPE)',  // *** Capturing Group 1 - If it's a doctype tag
					
					// Zero or more attributes following the tag name
					'(?:',
						'\\s+',  // one or more whitespace chars before an attribute
						
						// Either:
						// A. attr="value", or 
						// B. "value" alone (To cover example doctype tag: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">) 
						'(?:', nameEqualsValueRegex, '|', attrValueRegex.source + ')',
					')*',
				'>',
			')',
			
			'|',
			
			// All other HTML tags (i.e. tags that are not <!DOCTYPE>)
			'(?:',
				'<(/)?',  // Beginning of a tag. Either '<' for a start tag, or '</' for an end tag. 
				          // *** Capturing Group 2: The slash or an empty string. Slash ('/') for end tag, empty string for start or self-closing tag.
			
					// *** Capturing Group 3 - The tag name
					'(' + tagNameRegex.source + ')',
					
					// Zero or more attributes following the tag name
					'(?:',
						'\\s+',                // one or more whitespace chars before an attribute
						nameEqualsValueRegex,  // attr="value" (with optional ="value" part)
					')*',
					
					'\\s*/?',  // any trailing spaces and optional '/' before the closing '>'
				'>',
			')'
		].join( "" ), 'gi' );
	} )(),
	
	/**
	 * @private
	 * @property {RegExp} htmlCharacterEntitiesRegex
	 *
	 * The regular expression that matches common HTML character entities.
	 * 
	 * Ignoring &amp; as it could be part of a query string -- handling it separately.
	 */
	htmlCharacterEntitiesRegex: /(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi,
	
	
	/**
	 * Parses an HTML string and returns a simple array of {@link Autolinker.htmlParser.HtmlNode HtmlNodes} to represent
	 * the HTML structure of the input string. 
	 * 
	 * @param {String} html The HTML to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]}
	 */
	parse : function( html ) {
		var htmlRegex = this.htmlRegex,
		    currentResult,
		    lastIndex = 0,
		    textAndEntityNodes,
		    nodes = [];  // will be the result of the method
		
		while( ( currentResult = htmlRegex.exec( html ) ) !== null ) {
			var tagText = currentResult[ 0 ],
			    tagName = currentResult[ 1 ] || currentResult[ 3 ],  // The <!DOCTYPE> tag (ex: "!DOCTYPE"), or another tag (ex: "a" or "img") 
			    isClosingTag = !!currentResult[ 2 ],
			    inBetweenTagsText = html.substring( lastIndex, currentResult.index );
			
			// Push TextNodes and EntityNodes for any text found between tags
			if( inBetweenTagsText ) {
				textAndEntityNodes = this.parseTextAndEntityNodes( inBetweenTagsText );
				nodes.push.apply( nodes, textAndEntityNodes );
			}
			
			// Push the ElementNode
			nodes.push( this.createElementNode( tagText, tagName, isClosingTag ) );
			
			lastIndex = currentResult.index + tagText.length;
		}
		
		// Process any remaining text after the last HTML element. Will process all of the text if there were no HTML elements.
		if( lastIndex < html.length ) {
			var text = html.substring( lastIndex );
			
			// Push TextNodes and EntityNodes for any text found between tags
			if( text ) {
				textAndEntityNodes = this.parseTextAndEntityNodes( text );
				nodes.push.apply( nodes, textAndEntityNodes );
			}
		}
		
		return nodes;
	},
	
	
	/**
	 * Parses text and HTML entity nodes from a given string. The input string should not have any HTML tags (elements)
	 * within it.
	 * 
	 * @private
	 * @param {String} text The text to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]} An array of HtmlNodes to represent the 
	 *   {@link Autolinker.htmlParser.TextNode TextNodes} and {@link Autolinker.htmlParser.EntityNode EntityNodes} found.
	 */
	parseTextAndEntityNodes : function( text ) {
		var nodes = [],
		    textAndEntityTokens = Autolinker.Util.splitAndCapture( text, this.htmlCharacterEntitiesRegex );  // split at HTML entities, but include the HTML entities in the results array
		
		// Every even numbered token is a TextNode, and every odd numbered token is an EntityNode
		// For example: an input `text` of "Test &quot;this&quot; today" would turn into the 
		//   `textAndEntityTokens`: [ 'Test ', '&quot;', 'this', '&quot;', ' today' ]
		for( var i = 0, len = textAndEntityTokens.length; i < len; i += 2 ) {
			var textToken = textAndEntityTokens[ i ],
			    entityToken = textAndEntityTokens[ i + 1 ];
			
			if( textToken ) nodes.push( this.createTextNode( textToken ) );
			if( entityToken ) nodes.push( this.createEntityNode( entityToken ) );
		}
		return nodes;
	},
	
	
	/**
	 * Factory method to create an {@link Autolinker.htmlParser.ElementNode ElementNode}.
	 * 
	 * @private
	 * @param {String} tagText The full text of the tag (element) that was matched, including its attributes.
	 * @param {String} tagName The name of the tag. Ex: An &lt;img&gt; tag would be passed to this method as "img".
	 * @param {Boolean} isClosingTag `true` if it's a closing tag, false otherwise.
	 * @return {Autolinker.htmlParser.ElementNode}
	 */
	createElementNode : function( tagText, tagName, isClosingTag ) {
		return new Autolinker.htmlParser.ElementNode( {
			text    : tagText,
			tagName : tagName.toLowerCase(),
			closing : isClosingTag
		} );
	},
	
	
	/**
	 * Factory method to create a {@link Autolinker.htmlParser.EntityNode EntityNode}.
	 * 
	 * @private
	 * @param {String} text The text that was matched for the HTML entity (such as '&amp;nbsp;').
	 * @return {Autolinker.htmlParser.EntityNode}
	 */
	createEntityNode : function( text ) {
		return new Autolinker.htmlParser.EntityNode( { text: text } );
	},
	
	
	/**
	 * Factory method to create a {@link Autolinker.htmlParser.TextNode TextNode}.
	 * 
	 * @private
	 * @param {String} text The text that was matched.
	 * @return {Autolinker.htmlParser.TextNode}
	 */
	createTextNode : function( text ) {
		return new Autolinker.htmlParser.TextNode( { text: text } );
	}
	
} );
/*global Autolinker */
/**
 * @abstract
 * @class Autolinker.htmlParser.HtmlNode
 * 
 * Represents an HTML node found in an input string. An HTML node is one of the following:
 * 
 * 1. An {@link Autolinker.htmlParser.ElementNode ElementNode}, which represents HTML tags.
 * 2. A {@link Autolinker.htmlParser.TextNode TextNode}, which represents text outside or within HTML tags.
 * 3. A {@link Autolinker.htmlParser.EntityNode EntityNode}, which represents one of the known HTML
 *    entities that Autolinker looks for. This includes common ones such as &amp;quot; and &amp;nbsp;
 */
Autolinker.htmlParser.HtmlNode = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {String} text (required)
	 * 
	 * The original text that was matched for the HtmlNode. 
	 * 
	 * - In the case of an {@link Autolinker.htmlParser.ElementNode ElementNode}, this will be the tag's
	 *   text.
	 * - In the case of a {@link Autolinker.htmlParser.TextNode TextNode}, this will be the text itself.
	 * - In the case of a {@link Autolinker.htmlParser.EntityNode EntityNode}, this will be the text of
	 *   the HTML entity.
	 */
	text : "",
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},

	
	/**
	 * Returns a string name for the type of node that this class represents.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getType : Autolinker.Util.abstractMethod,
	
	
	/**
	 * Retrieves the {@link #text} for the HtmlNode.
	 * 
	 * @return {String}
	 */
	getText : function() {
		return this.text;
	}

} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.ElementNode
 * @extends Autolinker.htmlParser.HtmlNode
 * 
 * Represents an HTML element node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 * 
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more details.
 */
Autolinker.htmlParser.ElementNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {
	
	/**
	 * @cfg {String} tagName (required)
	 * 
	 * The name of the tag that was matched.
	 */
	tagName : '',
	
	/**
	 * @cfg {Boolean} closing (required)
	 * 
	 * `true` if the element (tag) is a closing tag, `false` if its an opening tag.
	 */
	closing : false,

	
	/**
	 * Returns a string name for the type of node that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'element';
	},
	

	/**
	 * Returns the HTML element's (tag's) name. Ex: for an &lt;img&gt; tag, returns "img".
	 * 
	 * @return {String}
	 */
	getTagName : function() {
		return this.tagName;
	},
	
	
	/**
	 * Determines if the HTML element (tag) is a closing tag. Ex: &lt;div&gt; returns
	 * `false`, while &lt;/div&gt; returns `true`.
	 * 
	 * @return {Boolean}
	 */
	isClosing : function() {
		return this.closing;
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.EntityNode
 * @extends Autolinker.htmlParser.HtmlNode
 * 
 * Represents a known HTML entity node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 * Ex: '&amp;nbsp;', or '&amp#160;' (which will be retrievable from the {@link #getText} method.
 * 
 * Note that this class will only be returned from the HtmlParser for the set of checked HTML entity nodes 
 * defined by the {@link Autolinker.htmlParser.HtmlParser#htmlCharacterEntitiesRegex}.
 * 
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more details.
 */
Autolinker.htmlParser.EntityNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {
	
	/**
	 * Returns a string name for the type of node that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'entity';
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.TextNode
 * @extends Autolinker.htmlParser.HtmlNode
 * 
 * Represents a text node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 * 
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more details.
 */
Autolinker.htmlParser.TextNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {
	
	/**
	 * Returns a string name for the type of node that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'text';
	}
	
} );
/*global Autolinker */
/**
 * @private
 * @class Autolinker.matchParser.MatchParser
 * @extends Object
 * 
 * Used by Autolinker to parse {@link #urls URLs}, {@link #emails email addresses}, and {@link #twitter Twitter handles}, 
 * given an input string of text.
 * 
 * The MatchParser is fed a non-HTML string in order to search out URLs, email addresses and Twitter handles. Autolinker
 * first uses the {@link HtmlParser} to "walk around" HTML tags, and then the text around the HTML tags is passed into
 * the MatchParser in order to find the actual matches.
 */
Autolinker.matchParser.MatchParser = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {Boolean} urls
	 * 
	 * `true` if miscellaneous URLs should be automatically linked, `false` if they should not be.
	 */
	urls : true,
	
	/**
	 * @cfg {Boolean} email
	 * 
	 * `true` if email addresses should be automatically linked, `false` if they should not be.
	 */
	email : true,
	
	/**
	 * @cfg {Boolean} twitter
	 * 
	 * `true` if Twitter handles ("@example") should be automatically linked, `false` if they should not be.
	 */
	twitter : true,
	
	/**
	 * @cfg {Boolean} stripPrefix
	 * 
	 * `true` if 'http://' or 'https://' and/or the 'www.' should be stripped from the beginning of URL links' text
	 * in {@link Autolinker.match.Url URL matches}, `false` otherwise.
	 * 
	 * TODO: Handle this before a URL Match object is instantiated.
	 */
	stripPrefix : true,
	
	
	/**
	 * @private
	 * @property {RegExp} matcherRegex
	 * 
	 * The regular expression that matches URLs, email addresses, and Twitter handles.
	 * 
	 * This regular expression has the following capturing groups:
	 * 
	 * 1. Group that is used to determine if there is a Twitter handle match (i.e. \@someTwitterUser). Simply check for its 
	 *    existence to determine if there is a Twitter handle match. The next couple of capturing groups give information 
	 *    about the Twitter handle match.
	 * 2. The whitespace character before the \@sign in a Twitter handle. This is needed because there are no lookbehinds in
	 *    JS regular expressions, and can be used to reconstruct the original string in a replace().
	 * 3. The Twitter handle itself in a Twitter match. If the match is '@someTwitterUser', the handle is 'someTwitterUser'.
	 * 4. Group that matches an email address. Used to determine if the match is an email address, as well as holding the full 
	 *    address. Ex: 'me@my.com'
	 * 5. Group that matches a URL in the input text. Ex: 'http://google.com', 'www.google.com', or just 'google.com'.
	 *    This also includes a path, url parameters, or hash anchors. Ex: google.com/path/to/file?q1=1&q2=2#myAnchor
	 * 6. Group that matches a protocol URL (i.e. 'http://google.com'). This is used to match protocol URLs with just a single
	 *    word, like 'http://localhost', where we won't double check that the domain name has at least one '.' in it.
	 * 7. A protocol-relative ('//') match for the case of a 'www.' prefixed URL. Will be an empty string if it is not a 
	 *    protocol-relative match. We need to know the character before the '//' in order to determine if it is a valid match
	 *    or the // was in a string we don't want to auto-link.
	 * 8. A protocol-relative ('//') match for the case of a known TLD prefixed URL. Will be an empty string if it is not a 
	 *    protocol-relative match. See #6 for more info. 
	 */
	matcherRegex : (function() {
		var twitterRegex = /(^|[^\w])@(\w{1,15})/,              // For matching a twitter handle. Ex: @gregory_jacobs
		    
		    emailRegex = /(?:[\-;:&=\+\$,\w\.]+@)/,             // something@ for email addresses (a.k.a. local-part)
		    
		    protocolRegex = /(?:[A-Za-z][-.+A-Za-z0-9]+:(?![A-Za-z][-.+A-Za-z0-9]+:\/\/)(?!\d+\/?)(?:\/\/)?)/,  // match protocol, allow in format "http://" or "mailto:". However, do not match the first part of something like 'link:http://www.google.com' (i.e. don't match "link:"). Also, make sure we don't interpret 'google.com:8000' as if 'google.com' was a protocol here (i.e. ignore a trailing port number in this regex)
		    wwwRegex = /(?:www\.)/,                             // starting with 'www.'
		    domainNameRegex = /[A-Za-z0-9\.\-]*[A-Za-z0-9\-]/,  // anything looking at all like a domain, non-unicode domains, not ending in a period
		    tldRegex = /\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b/,   // match our known top level domains (TLDs)
		    
		    // Allow optional path, query string, and hash anchor, not ending in the following characters: "?!:,.;"
		    // http://blog.codinghorror.com/the-problem-with-urls/
		    urlSuffixRegex = /[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]?!:,.;]*[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]]/;
		
		return new RegExp( [
			'(',  // *** Capturing group $1, which can be used to check for a twitter handle match. Use group $3 for the actual twitter handle though. $2 may be used to reconstruct the original string in a replace() 
				// *** Capturing group $2, which matches the whitespace character before the '@' sign (needed because of no lookbehinds), and 
				// *** Capturing group $3, which matches the actual twitter handle
				twitterRegex.source,
			')',
			
			'|',
			
			'(',  // *** Capturing group $4, which is used to determine an email match
				emailRegex.source,
				domainNameRegex.source,
				tldRegex.source,
			')',
			
			'|',
			
			'(',  // *** Capturing group $5, which is used to match a URL
				'(?:', // parens to cover match for protocol (optional), and domain
					'(',  // *** Capturing group $6, for a protocol-prefixed url (ex: http://google.com)
						protocolRegex.source,
						domainNameRegex.source,
					')',
					
					'|',
					
					'(?:',  // non-capturing paren for a 'www.' prefixed url (ex: www.google.com)
						'(.?//)?',  // *** Capturing group $7 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						wwwRegex.source,
						domainNameRegex.source,
					')',
					
					'|',
					
					'(?:',  // non-capturing paren for known a TLD url (ex: google.com)
						'(.?//)?',  // *** Capturing group $8 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						domainNameRegex.source,
						tldRegex.source,
					')',
				')',
				
				'(?:' + urlSuffixRegex.source + ')?',  // match for path, query string, and/or hash anchor - optional
			')'
		].join( "" ), 'gi' );
	} )(),
	
	/**
	 * @private
	 * @property {RegExp} charBeforeProtocolRelMatchRegex
	 * 
	 * The regular expression used to retrieve the character before a protocol-relative URL match.
	 * 
	 * This is used in conjunction with the {@link #matcherRegex}, which needs to grab the character before a protocol-relative
	 * '//' due to the lack of a negative look-behind in JavaScript regular expressions. The character before the match is stripped
	 * from the URL.
	 */
	charBeforeProtocolRelMatchRegex : /^(.)?\/\//,
	
	/**
	 * @private
	 * @property {Autolinker.MatchValidator} matchValidator
	 * 
	 * The MatchValidator object, used to filter out any false positives from the {@link #matcherRegex}. See
	 * {@link Autolinker.MatchValidator} for details.
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	
		this.matchValidator = new Autolinker.MatchValidator();
	},
	
	
	/**
	 * Parses the input `text` to search for URLs/emails/Twitter handles, and calls the `replaceFn`
	 * to allow replacements of the matches. Returns the `text` with matches replaced.
	 * 
	 * @param {String} text The text to search and repace matches in.
	 * @param {Function} replaceFn The iterator function to handle the replacements. The function takes a
	 *   single argument, a {@link Autolinker.match.Match} object, and should return the text that should
	 *   make the replacement.
	 * @param {Object} [contextObj=window] The context object ("scope") to run the `replaceFn` in.
	 * @return {String}
	 */
	replace : function( text, replaceFn, contextObj ) {
		var me = this;  // for closure
		
		return text.replace( this.matcherRegex, function( matchStr, $1, $2, $3, $4, $5, $6, $7, $8 ) {
			var matchDescObj = me.processCandidateMatch( matchStr, $1, $2, $3, $4, $5, $6, $7, $8 );  // "match description" object
			
			// Return out with no changes for match types that are disabled (url, email, twitter), or for matches that are 
			// invalid (false positives from the matcherRegex, which can't use look-behinds since they are unavailable in JS).
			if( !matchDescObj ) {
				return matchStr;
				
			} else {
				// Generate replacement text for the match from the `replaceFn`
				var replaceStr = replaceFn.call( contextObj, matchDescObj.match );
				return matchDescObj.prefixStr + replaceStr + matchDescObj.suffixStr;
			}
		} );
	},
	
	
	/**
	 * Processes a candidate match from the {@link #matcherRegex}. 
	 * 
	 * Not all matches found by the regex are actual URL/email/Twitter matches, as determined by the {@link #matchValidator}. In
	 * this case, the method returns `null`. Otherwise, a valid Object with `prefixStr`, `match`, and `suffixStr` is returned.
	 * 
	 * @private
	 * @param {String} matchStr The full match that was found by the {@link #matcherRegex}.
	 * @param {String} twitterMatch The matched text of a Twitter handle, if the match is a Twitter match.
	 * @param {String} twitterHandlePrefixWhitespaceChar The whitespace char before the @ sign in a Twitter handle match. This 
	 *   is needed because of no lookbehinds in JS regexes, and is need to re-include the character for the anchor tag replacement.
	 * @param {String} twitterHandle The actual Twitter user (i.e the word after the @ sign in a Twitter match).
	 * @param {String} emailAddressMatch The matched email address for an email address match.
	 * @param {String} urlMatch The matched URL string for a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol match. Ex: 'http://yahoo.com'. This is used to match
	 *   something like 'http://localhost', where we won't double check that the domain name has at least one '.' in it.
	 * @param {String} wwwProtocolRelativeMatch The '//' for a protocol-relative match from a 'www' url, with the character that 
	 *   comes before the '//'.
	 * @param {String} tldProtocolRelativeMatch The '//' for a protocol-relative match from a TLD (top level domain) match, with 
	 *   the character that comes before the '//'.
	 *   
	 * @return {Object} A "match description object". This will be `null` if the match was invalid, or if a match type is disabled.
	 *   Otherwise, this will be an Object (map) with the following properties:
	 * @return {String} return.prefixStr The char(s) that should be prepended to the replacement string. These are char(s) that
	 *   were needed to be included from the regex match that were ignored by processing code, and should be re-inserted into 
	 *   the replacement stream.
	 * @return {String} return.suffixStr The char(s) that should be appended to the replacement string. These are char(s) that
	 *   were needed to be included from the regex match that were ignored by processing code, and should be re-inserted into 
	 *   the replacement stream.
	 * @return {Autolinker.match.Match} return.match The Match object that represents the match that was found.
	 */
	processCandidateMatch : function( 
		matchStr, twitterMatch, twitterHandlePrefixWhitespaceChar, twitterHandle, 
		emailAddressMatch, urlMatch, protocolUrlMatch, wwwProtocolRelativeMatch, tldProtocolRelativeMatch
	) {
		// Note: The `matchStr` variable wil be fixed up to remove characters that are no longer needed (which will 
		// be added to `prefixStr` and `suffixStr`).
		
		var protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch,
		    match,  // Will be an Autolinker.match.Match object
		    
		    prefixStr = "",       // A string to use to prefix the anchor tag that is created. This is needed for the Twitter handle match
		    suffixStr = "";       // A string to suffix the anchor tag that is created. This is used if there is a trailing parenthesis that should not be auto-linked.
		    
		
		// Return out with `null` for match types that are disabled (url, email, twitter), or for matches that are 
		// invalid (false positives from the matcherRegex, which can't use look-behinds since they are unavailable in JS).
		if(
			( twitterMatch && !this.twitter ) || ( emailAddressMatch && !this.email ) || ( urlMatch && !this.urls ) ||
			!this.matchValidator.isValidMatch( urlMatch, protocolUrlMatch, protocolRelativeMatch ) 
		) {
			return null;
		}
		
		// Handle a closing parenthesis at the end of the match, and exclude it if there is not a matching open parenthesis
		// in the match itself. 
		if( this.matchHasUnbalancedClosingParen( matchStr ) ) {
			matchStr = matchStr.substr( 0, matchStr.length - 1 );  // remove the trailing ")"
			suffixStr = ")";  // this will be added after the generated <a> tag
		}
		
		
		if( emailAddressMatch ) {
			match = new Autolinker.match.Email( { matchedText: matchStr, email: emailAddressMatch } );
			
		} else if( twitterMatch ) {
			// fix up the `matchStr` if there was a preceding whitespace char, which was needed to determine the match 
			// itself (since there are no look-behinds in JS regexes)
			if( twitterHandlePrefixWhitespaceChar ) {
				prefixStr = twitterHandlePrefixWhitespaceChar;
				matchStr = matchStr.slice( 1 );  // remove the prefixed whitespace char from the match
			}
			match = new Autolinker.match.Twitter( { matchedText: matchStr, twitterHandle: twitterHandle } );
			
		} else {  // url match
			// If it's a protocol-relative '//' match, remove the character before the '//' (which the matcherRegex needed
			// to match due to the lack of a negative look-behind in JavaScript regular expressions)
			if( protocolRelativeMatch ) {
				var charBeforeMatch = protocolRelativeMatch.match( this.charBeforeProtocolRelMatchRegex )[ 1 ] || "";
				
				if( charBeforeMatch ) {  // fix up the `matchStr` if there was a preceding char before a protocol-relative match, which was needed to determine the match itself (since there are no look-behinds in JS regexes)
					prefixStr = charBeforeMatch;
					matchStr = matchStr.slice( 1 );  // remove the prefixed char from the match
				}
			}
			
			match = new Autolinker.match.Url( {
				matchedText : matchStr,
				url : matchStr,
				protocolUrlMatch : !!protocolUrlMatch,
				protocolRelativeMatch : !!protocolRelativeMatch,
				stripPrefix : this.stripPrefix
			} );
		}
		
		return {
			prefixStr : prefixStr,
			suffixStr : suffixStr,
			match     : match
		};
	},
	
	
	/**
	 * Determines if a match found has an unmatched closing parenthesis. If so, this parenthesis will be removed
	 * from the match itself, and appended after the generated anchor tag in {@link #processTextNode}.
	 * 
	 * A match may have an extra closing parenthesis at the end of the match because the regular expression must include parenthesis
	 * for URLs such as "wikipedia.com/something_(disambiguation)", which should be auto-linked. 
	 * 
	 * However, an extra parenthesis *will* be included when the URL itself is wrapped in parenthesis, such as in the case of
	 * "(wikipedia.com/something_(disambiguation))". In this case, the last closing parenthesis should *not* be part of the URL 
	 * itself, and this method will return `true`.
	 * 
	 * @private
	 * @param {String} matchStr The full match string from the {@link #matcherRegex}.
	 * @return {Boolean} `true` if there is an unbalanced closing parenthesis at the end of the `matchStr`, `false` otherwise.
	 */
	matchHasUnbalancedClosingParen : function( matchStr ) {
		var lastChar = matchStr.charAt( matchStr.length - 1 );
		
		if( lastChar === ')' ) {
			var openParensMatch = matchStr.match( /\(/g ),
			    closeParensMatch = matchStr.match( /\)/g ),
			    numOpenParens = ( openParensMatch && openParensMatch.length ) || 0,
			    numCloseParens = ( closeParensMatch && closeParensMatch.length ) || 0;
			
			if( numOpenParens < numCloseParens ) {
				return true;
			}
		}
		
		return false;
	}
	
} );
/*global Autolinker */
/*jshint scripturl:true */
/**
 * @private
 * @class Autolinker.MatchValidator
 * @extends Object
 * 
 * Used by Autolinker to filter out false positives from the {@link Autolinker#matcherRegex}.
 * 
 * Due to the limitations of regular expressions (including the missing feature of look-behinds in JS regular expressions),
 * we cannot always determine the validity of a given match. This class applies a bit of additional logic to filter out any
 * false positives that have been matched by the {@link Autolinker#matcherRegex}.
 */
Autolinker.MatchValidator = Autolinker.Util.extend( Object, {
	
	/**
	 * @private
	 * @property {RegExp} invalidProtocolRelMatchRegex
	 * 
	 * The regular expression used to check a potential protocol-relative URL match, coming from the 
	 * {@link Autolinker#matcherRegex}. A protocol-relative URL is, for example, "//yahoo.com"
	 * 
	 * This regular expression checks to see if there is a word character before the '//' match in order to determine if 
	 * we should actually autolink a protocol-relative URL. This is needed because there is no negative look-behind in 
	 * JavaScript regular expressions. 
	 * 
	 * For instance, we want to autolink something like "Go to: //google.com", but we don't want to autolink something 
	 * like "abc//google.com"
	 */
	invalidProtocolRelMatchRegex : /^[\w]\/\//,
	
	/**
	 * Regex to test for a full protocol, with the two trailing slashes. Ex: 'http://'
	 * 
	 * @private
	 * @property {RegExp} hasFullProtocolRegex
	 */
	hasFullProtocolRegex : /^[A-Za-z][-.+A-Za-z0-9]+:\/\//,
	
	/**
	 * Regex to find the URI scheme, such as 'mailto:'.
	 * 
	 * This is used to filter out 'javascript:' and 'vbscript:' schemes.
	 * 
	 * @private
	 * @property {RegExp} uriSchemeRegex
	 */
	uriSchemeRegex : /^[A-Za-z][-.+A-Za-z0-9]+:/,
	
	/**
	 * Regex to determine if at least one word char exists after the protocol (i.e. after the ':')
	 * 
	 * @private
	 * @property {RegExp} hasWordCharAfterProtocolRegex
	 */
	hasWordCharAfterProtocolRegex : /:[^\s]*?[A-Za-z]/,
	
	
	/**
	 * Determines if a given match found by {@link Autolinker#processTextNode} is valid. Will return `false` for:
	 * 
	 * 1) URL matches which do not have at least have one period ('.') in the domain name (effectively skipping over 
	 *    matches like "abc:def"). However, URL matches with a protocol will be allowed (ex: 'http://localhost')
	 * 2) URL matches which do not have at least one word character in the domain name (effectively skipping over
	 *    matches like "git:1.0").
	 * 3) A protocol-relative url match (a URL beginning with '//') whose previous character is a word character 
	 *    (effectively skipping over strings like "abc//google.com")
	 * 
	 * Otherwise, returns `true`.
	 * 
	 * @param {String} urlMatch The matched URL, if there was one. Will be an empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol match. Ex: 'http://yahoo.com'. This is used to match
	 *   something like 'http://localhost', where we won't double check that the domain name has at least one '.' in it.
	 * @param {String} protocolRelativeMatch The protocol-relative string for a URL match (i.e. '//'), possibly with a preceding
	 *   character (ex, a space, such as: ' //', or a letter, such as: 'a//'). The match is invalid if there is a word character
	 *   preceding the '//'.
	 * @return {Boolean} `true` if the match given is valid and should be processed, or `false` if the match is invalid and/or 
	 *   should just not be processed.
	 */
	isValidMatch : function( urlMatch, protocolUrlMatch, protocolRelativeMatch ) {
		if(
			( protocolUrlMatch && !this.isValidUriScheme( protocolUrlMatch ) ) ||
			this.urlMatchDoesNotHaveProtocolOrDot( urlMatch, protocolUrlMatch ) ||       // At least one period ('.') must exist in the URL match for us to consider it an actual URL, *unless* it was a full protocol match (like 'http://localhost')
			this.urlMatchDoesNotHaveAtLeastOneWordChar( urlMatch, protocolUrlMatch ) ||  // At least one letter character must exist in the domain name after a protocol match. Ex: skip over something like "git:1.0"
			this.isInvalidProtocolRelativeMatch( protocolRelativeMatch )                 // A protocol-relative match which has a word character in front of it (so we can skip something like "abc//google.com")
		) {
			return false;
		}
		
		return true;
	},
	
	
	/**
	 * Determines if the URI scheme is a valid scheme to be autolinked. Returns `false` if the scheme is 
	 * 'javascript:' or 'vbscript:'
	 * 
	 * @private
	 * @param {String} uriSchemeMatch The match URL string for a full URI scheme match. Ex: 'http://yahoo.com' 
	 *   or 'mailto:a@a.com'.
	 * @return {Boolean} `true` if the scheme is a valid one, `false` otherwise.
	 */
	isValidUriScheme : function( uriSchemeMatch ) {
		var uriScheme = uriSchemeMatch.match( this.uriSchemeRegex )[ 0 ].toLowerCase();
		
		return ( uriScheme !== 'javascript:' && uriScheme !== 'vbscript:' );
	},
	
	
	/**
	 * Determines if a URL match does not have either:
	 * 
	 * a) a full protocol (i.e. 'http://'), or
	 * b) at least one dot ('.') in the domain name (for a non-full-protocol match).
	 * 
	 * Either situation is considered an invalid URL (ex: 'git:d' does not have either the '://' part, or at least one dot
	 * in the domain name. If the match was 'git:abc.com', we would consider this valid.)
	 * 
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol match. Ex: 'http://yahoo.com'. This is used to match
	 *   something like 'http://localhost', where we won't double check that the domain name has at least one '.' in it.
	 * @return {Boolean} `true` if the URL match does not have a full protocol, or at least one dot ('.') in a non-full-protocol
	 *   match.
	 */
	urlMatchDoesNotHaveProtocolOrDot : function( urlMatch, protocolUrlMatch ) {
		return ( !!urlMatch && ( !protocolUrlMatch || !this.hasFullProtocolRegex.test( protocolUrlMatch ) ) && urlMatch.indexOf( '.' ) === -1 );
	},
	
	
	/**
	 * Determines if a URL match does not have at least one word character after the protocol (i.e. in the domain name).
	 * 
	 * At least one letter character must exist in the domain name after a protocol match. Ex: skip over something 
	 * like "git:1.0"
	 * 
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol match. Ex: 'http://yahoo.com'. This is used to
	 *   know whether or not we have a protocol in the URL string, in order to check for a word character after the protocol
	 *   separator (':').
	 * @return {Boolean} `true` if the URL match does not have at least one word character in it after the protocol, `false`
	 *   otherwise.
	 */
	urlMatchDoesNotHaveAtLeastOneWordChar : function( urlMatch, protocolUrlMatch ) {
		if( urlMatch && protocolUrlMatch ) {
			return !this.hasWordCharAfterProtocolRegex.test( urlMatch );
		} else {
			return false;
		}
	},
	
	
	/**
	 * Determines if a protocol-relative match is an invalid one. This method returns `true` if there is a `protocolRelativeMatch`,
	 * and that match contains a word character before the '//' (i.e. it must contain whitespace or nothing before the '//' in
	 * order to be considered valid).
	 * 
	 * @private
	 * @param {String} protocolRelativeMatch The protocol-relative string for a URL match (i.e. '//'), possibly with a preceding
	 *   character (ex, a space, such as: ' //', or a letter, such as: 'a//'). The match is invalid if there is a word character
	 *   preceding the '//'.
	 * @return {Boolean} `true` if it is an invalid protocol-relative match, `false` otherwise.
	 */
	isInvalidProtocolRelativeMatch : function( protocolRelativeMatch ) {
		return ( !!protocolRelativeMatch && this.invalidProtocolRelMatchRegex.test( protocolRelativeMatch ) );
	}

} );
/*global Autolinker */
/**
 * @abstract
 * @class Autolinker.match.Match
 * 
 * Represents a match found in an input string which should be Autolinked. A Match object is what is provided in a 
 * {@link Autolinker#replaceFn replaceFn}, and may be used to query for details about the match.
 * 
 * For example:
 * 
 *     var input = "...";  // string with URLs, Email Addresses, and Twitter Handles
 *     
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *         
 *             switch( match.getType() ) {
 *                 case 'url' : 
 *                     console.log( "url: ", match.getUrl() );
 *                     
 *                 case 'email' :
 *                     console.log( "email: ", match.getEmail() );
 *                     
 *                 case 'twitter' :
 *                     console.log( "twitter: ", match.getTwitterHandle() );
 *             }
 *         }
 *     } );
 *     
 * See the {@link Autolinker} class for more details on using the {@link Autolinker#replaceFn replaceFn}.
 */
Autolinker.match.Match = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {String} matchedText (required)
	 * 
	 * The original text that was matched.
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},

	
	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getType : Autolinker.Util.abstractMethod,
	
	
	/**
	 * Returns the original text that was matched.
	 * 
	 * @return {String}
	 */
	getMatchedText : function() {
		return this.matchedText;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getAnchorHref : Autolinker.Util.abstractMethod,
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getAnchorText : Autolinker.Util.abstractMethod

} );
/*global Autolinker */
/**
 * @class Autolinker.match.Email
 * @extends Autolinker.match.Match
 * 
 * Represents a Email match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Email = Autolinker.Util.extend( Autolinker.match.Match, {
	
	/**
	 * @cfg {String} email (required)
	 * 
	 * The email address that was matched.
	 */
	

	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'email';
	},
	
	
	/**
	 * Returns the email address that was matched.
	 * 
	 * @return {String}
	 */
	getEmail : function() {
		return this.email;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorHref : function() {
		return 'mailto:' + this.email;
	},
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorText : function() {
		return this.email;
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.match.Twitter
 * @extends Autolinker.match.Match
 * 
 * Represents a Twitter match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Twitter = Autolinker.Util.extend( Autolinker.match.Match, {
	
	/**
	 * @cfg {String} twitterHandle (required)
	 * 
	 * The Twitter handle that was matched.
	 */
	

	/**
	 * Returns the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'twitter';
	},
	
	
	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getTwitterHandle : function() {
		return this.twitterHandle;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorHref : function() {
		return 'https://twitter.com/' + this.twitterHandle;
	},
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorText : function() {
		return '@' + this.twitterHandle;
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.match.Url
 * @extends Autolinker.match.Match
 * 
 * Represents a Url match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Url = Autolinker.Util.extend( Autolinker.match.Match, {
	
	/**
	 * @cfg {String} url (required)
	 * 
	 * The url that was matched.
	 */
	
	/**
	 * @cfg {Boolean} protocolUrlMatch (required)
	 * 
	 * `true` if the URL is a match which already has a protocol (i.e. 'http://'), `false` if the match was from a 'www' or
	 * known TLD match.
	 */
	
	/**
	 * @cfg {Boolean} protocolRelativeMatch (required)
	 * 
	 * `true` if the URL is a protocol-relative match. A protocol-relative match is a URL that starts with '//',
	 * and will be either http:// or https:// based on the protocol that the site is loaded under.
	 */
	
	/**
	 * @cfg {Boolean} stripPrefix (required)
	 * @inheritdoc Autolinker#stripPrefix
	 */
	

	/**
	 * @private
	 * @property {RegExp} urlPrefixRegex
	 * 
	 * A regular expression used to remove the 'http://' or 'https://' and/or the 'www.' from URLs.
	 */
	urlPrefixRegex: /^(https?:\/\/)?(www\.)?/i,
	
	/**
	 * @private
	 * @property {RegExp} protocolRelativeRegex
	 * 
	 * The regular expression used to remove the protocol-relative '//' from the {@link #url} string, for purposes
	 * of {@link #getAnchorText}. A protocol-relative URL is, for example, "//yahoo.com"
	 */
	protocolRelativeRegex : /^\/\//,
	
	/**
	 * @private
	 * @property {Boolean} protocolPrepended
	 * 
	 * Will be set to `true` if the 'http://' protocol has been prepended to the {@link #url} (because the
	 * {@link #url} did not have a protocol)
	 */
	protocolPrepended : false,
	

	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'url';
	},
	
	
	/**
	 * Returns the url that was matched, assuming the protocol to be 'http://' if the original
	 * match was missing a protocol.
	 * 
	 * @return {String}
	 */
	getUrl : function() {
		var url = this.url;
		
		// if the url string doesn't begin with a protocol, assume 'http://'
		if( !this.protocolRelativeMatch && !this.protocolUrlMatch && !this.protocolPrepended ) {
			url = this.url = 'http://' + url;
			
			this.protocolPrepended = true;
		}
		
		return url;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorHref : function() {
		var url = this.getUrl();
		
		return url.replace( /&amp;/g, '&' );  // any &amp;'s in the URL should be converted back to '&' if they were displayed as &amp; in the source html 
	},
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorText : function() {
		var anchorText = this.getUrl();
		
		if( this.protocolRelativeMatch ) {
			// Strip off any protocol-relative '//' from the anchor text
			anchorText = this.stripProtocolRelativePrefix( anchorText );
		}
		if( this.stripPrefix ) {
			anchorText = this.stripUrlPrefix( anchorText );
		}
		anchorText = this.removeTrailingSlash( anchorText );  // remove trailing slash, if there is one
		
		return anchorText;
	},
	
	
	// ---------------------------------------
	
	// Utility Functionality
	
	/**
	 * Strips the URL prefix (such as "http://" or "https://") from the given text.
	 * 
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   url prefix (such as stripping off "http://")
	 * @return {String} The `anchorText`, with the prefix stripped.
	 */
	stripUrlPrefix : function( text ) {
		return text.replace( this.urlPrefixRegex, '' );
	},
	
	
	/**
	 * Strips any protocol-relative '//' from the anchor text.
	 * 
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   protocol-relative prefix (such as stripping off "//")
	 * @return {String} The `anchorText`, with the protocol-relative prefix stripped.
	 */
	stripProtocolRelativePrefix : function( text ) {
		return text.replace( this.protocolRelativeRegex, '' );
	},
	
	
	/**
	 * Removes any trailing slash from the given `anchorText`, in preparation for the text to be displayed.
	 * 
	 * @private
	 * @param {String} anchorText The text of the anchor that is being generated, for which to remove any trailing
	 *   slash ('/') that may exist.
	 * @return {String} The `anchorText`, with the trailing slash removed.
	 */
	removeTrailingSlash : function( anchorText ) {
		if( anchorText.charAt( anchorText.length - 1 ) === '/' ) {
			anchorText = anchorText.slice( 0, -1 );
		}
		return anchorText;
	}
	
} );
return Autolinker;

}));

},{}],2:[function(require,module,exports){
'use strict';


module.exports = require('./lib/');

},{"./lib/":16}],3:[function(require,module,exports){
// List of valid entities
//
// Generate with ./support/entities.js script
//
'use strict';

/*eslint quotes:0*/
module.exports = {
  "Aacute":"\u00C1",
  "aacute":"\u00E1",
  "Abreve":"\u0102",
  "abreve":"\u0103",
  "ac":"\u223E",
  "acd":"\u223F",
  "acE":"\u223E\u0333",
  "Acirc":"\u00C2",
  "acirc":"\u00E2",
  "acute":"\u00B4",
  "Acy":"\u0410",
  "acy":"\u0430",
  "AElig":"\u00C6",
  "aelig":"\u00E6",
  "af":"\u2061",
  "Afr":"\uD835\uDD04",
  "afr":"\uD835\uDD1E",
  "Agrave":"\u00C0",
  "agrave":"\u00E0",
  "alefsym":"\u2135",
  "aleph":"\u2135",
  "Alpha":"\u0391",
  "alpha":"\u03B1",
  "Amacr":"\u0100",
  "amacr":"\u0101",
  "amalg":"\u2A3F",
  "AMP":"\u0026",
  "amp":"\u0026",
  "And":"\u2A53",
  "and":"\u2227",
  "andand":"\u2A55",
  "andd":"\u2A5C",
  "andslope":"\u2A58",
  "andv":"\u2A5A",
  "ang":"\u2220",
  "ange":"\u29A4",
  "angle":"\u2220",
  "angmsd":"\u2221",
  "angmsdaa":"\u29A8",
  "angmsdab":"\u29A9",
  "angmsdac":"\u29AA",
  "angmsdad":"\u29AB",
  "angmsdae":"\u29AC",
  "angmsdaf":"\u29AD",
  "angmsdag":"\u29AE",
  "angmsdah":"\u29AF",
  "angrt":"\u221F",
  "angrtvb":"\u22BE",
  "angrtvbd":"\u299D",
  "angsph":"\u2222",
  "angst":"\u00C5",
  "angzarr":"\u237C",
  "Aogon":"\u0104",
  "aogon":"\u0105",
  "Aopf":"\uD835\uDD38",
  "aopf":"\uD835\uDD52",
  "ap":"\u2248",
  "apacir":"\u2A6F",
  "apE":"\u2A70",
  "ape":"\u224A",
  "apid":"\u224B",
  "apos":"\u0027",
  "ApplyFunction":"\u2061",
  "approx":"\u2248",
  "approxeq":"\u224A",
  "Aring":"\u00C5",
  "aring":"\u00E5",
  "Ascr":"\uD835\uDC9C",
  "ascr":"\uD835\uDCB6",
  "Assign":"\u2254",
  "ast":"\u002A",
  "asymp":"\u2248",
  "asympeq":"\u224D",
  "Atilde":"\u00C3",
  "atilde":"\u00E3",
  "Auml":"\u00C4",
  "auml":"\u00E4",
  "awconint":"\u2233",
  "awint":"\u2A11",
  "backcong":"\u224C",
  "backepsilon":"\u03F6",
  "backprime":"\u2035",
  "backsim":"\u223D",
  "backsimeq":"\u22CD",
  "Backslash":"\u2216",
  "Barv":"\u2AE7",
  "barvee":"\u22BD",
  "Barwed":"\u2306",
  "barwed":"\u2305",
  "barwedge":"\u2305",
  "bbrk":"\u23B5",
  "bbrktbrk":"\u23B6",
  "bcong":"\u224C",
  "Bcy":"\u0411",
  "bcy":"\u0431",
  "bdquo":"\u201E",
  "becaus":"\u2235",
  "Because":"\u2235",
  "because":"\u2235",
  "bemptyv":"\u29B0",
  "bepsi":"\u03F6",
  "bernou":"\u212C",
  "Bernoullis":"\u212C",
  "Beta":"\u0392",
  "beta":"\u03B2",
  "beth":"\u2136",
  "between":"\u226C",
  "Bfr":"\uD835\uDD05",
  "bfr":"\uD835\uDD1F",
  "bigcap":"\u22C2",
  "bigcirc":"\u25EF",
  "bigcup":"\u22C3",
  "bigodot":"\u2A00",
  "bigoplus":"\u2A01",
  "bigotimes":"\u2A02",
  "bigsqcup":"\u2A06",
  "bigstar":"\u2605",
  "bigtriangledown":"\u25BD",
  "bigtriangleup":"\u25B3",
  "biguplus":"\u2A04",
  "bigvee":"\u22C1",
  "bigwedge":"\u22C0",
  "bkarow":"\u290D",
  "blacklozenge":"\u29EB",
  "blacksquare":"\u25AA",
  "blacktriangle":"\u25B4",
  "blacktriangledown":"\u25BE",
  "blacktriangleleft":"\u25C2",
  "blacktriangleright":"\u25B8",
  "blank":"\u2423",
  "blk12":"\u2592",
  "blk14":"\u2591",
  "blk34":"\u2593",
  "block":"\u2588",
  "bne":"\u003D\u20E5",
  "bnequiv":"\u2261\u20E5",
  "bNot":"\u2AED",
  "bnot":"\u2310",
  "Bopf":"\uD835\uDD39",
  "bopf":"\uD835\uDD53",
  "bot":"\u22A5",
  "bottom":"\u22A5",
  "bowtie":"\u22C8",
  "boxbox":"\u29C9",
  "boxDL":"\u2557",
  "boxDl":"\u2556",
  "boxdL":"\u2555",
  "boxdl":"\u2510",
  "boxDR":"\u2554",
  "boxDr":"\u2553",
  "boxdR":"\u2552",
  "boxdr":"\u250C",
  "boxH":"\u2550",
  "boxh":"\u2500",
  "boxHD":"\u2566",
  "boxHd":"\u2564",
  "boxhD":"\u2565",
  "boxhd":"\u252C",
  "boxHU":"\u2569",
  "boxHu":"\u2567",
  "boxhU":"\u2568",
  "boxhu":"\u2534",
  "boxminus":"\u229F",
  "boxplus":"\u229E",
  "boxtimes":"\u22A0",
  "boxUL":"\u255D",
  "boxUl":"\u255C",
  "boxuL":"\u255B",
  "boxul":"\u2518",
  "boxUR":"\u255A",
  "boxUr":"\u2559",
  "boxuR":"\u2558",
  "boxur":"\u2514",
  "boxV":"\u2551",
  "boxv":"\u2502",
  "boxVH":"\u256C",
  "boxVh":"\u256B",
  "boxvH":"\u256A",
  "boxvh":"\u253C",
  "boxVL":"\u2563",
  "boxVl":"\u2562",
  "boxvL":"\u2561",
  "boxvl":"\u2524",
  "boxVR":"\u2560",
  "boxVr":"\u255F",
  "boxvR":"\u255E",
  "boxvr":"\u251C",
  "bprime":"\u2035",
  "Breve":"\u02D8",
  "breve":"\u02D8",
  "brvbar":"\u00A6",
  "Bscr":"\u212C",
  "bscr":"\uD835\uDCB7",
  "bsemi":"\u204F",
  "bsim":"\u223D",
  "bsime":"\u22CD",
  "bsol":"\u005C",
  "bsolb":"\u29C5",
  "bsolhsub":"\u27C8",
  "bull":"\u2022",
  "bullet":"\u2022",
  "bump":"\u224E",
  "bumpE":"\u2AAE",
  "bumpe":"\u224F",
  "Bumpeq":"\u224E",
  "bumpeq":"\u224F",
  "Cacute":"\u0106",
  "cacute":"\u0107",
  "Cap":"\u22D2",
  "cap":"\u2229",
  "capand":"\u2A44",
  "capbrcup":"\u2A49",
  "capcap":"\u2A4B",
  "capcup":"\u2A47",
  "capdot":"\u2A40",
  "CapitalDifferentialD":"\u2145",
  "caps":"\u2229\uFE00",
  "caret":"\u2041",
  "caron":"\u02C7",
  "Cayleys":"\u212D",
  "ccaps":"\u2A4D",
  "Ccaron":"\u010C",
  "ccaron":"\u010D",
  "Ccedil":"\u00C7",
  "ccedil":"\u00E7",
  "Ccirc":"\u0108",
  "ccirc":"\u0109",
  "Cconint":"\u2230",
  "ccups":"\u2A4C",
  "ccupssm":"\u2A50",
  "Cdot":"\u010A",
  "cdot":"\u010B",
  "cedil":"\u00B8",
  "Cedilla":"\u00B8",
  "cemptyv":"\u29B2",
  "cent":"\u00A2",
  "CenterDot":"\u00B7",
  "centerdot":"\u00B7",
  "Cfr":"\u212D",
  "cfr":"\uD835\uDD20",
  "CHcy":"\u0427",
  "chcy":"\u0447",
  "check":"\u2713",
  "checkmark":"\u2713",
  "Chi":"\u03A7",
  "chi":"\u03C7",
  "cir":"\u25CB",
  "circ":"\u02C6",
  "circeq":"\u2257",
  "circlearrowleft":"\u21BA",
  "circlearrowright":"\u21BB",
  "circledast":"\u229B",
  "circledcirc":"\u229A",
  "circleddash":"\u229D",
  "CircleDot":"\u2299",
  "circledR":"\u00AE",
  "circledS":"\u24C8",
  "CircleMinus":"\u2296",
  "CirclePlus":"\u2295",
  "CircleTimes":"\u2297",
  "cirE":"\u29C3",
  "cire":"\u2257",
  "cirfnint":"\u2A10",
  "cirmid":"\u2AEF",
  "cirscir":"\u29C2",
  "ClockwiseContourIntegral":"\u2232",
  "CloseCurlyDoubleQuote":"\u201D",
  "CloseCurlyQuote":"\u2019",
  "clubs":"\u2663",
  "clubsuit":"\u2663",
  "Colon":"\u2237",
  "colon":"\u003A",
  "Colone":"\u2A74",
  "colone":"\u2254",
  "coloneq":"\u2254",
  "comma":"\u002C",
  "commat":"\u0040",
  "comp":"\u2201",
  "compfn":"\u2218",
  "complement":"\u2201",
  "complexes":"\u2102",
  "cong":"\u2245",
  "congdot":"\u2A6D",
  "Congruent":"\u2261",
  "Conint":"\u222F",
  "conint":"\u222E",
  "ContourIntegral":"\u222E",
  "Copf":"\u2102",
  "copf":"\uD835\uDD54",
  "coprod":"\u2210",
  "Coproduct":"\u2210",
  "COPY":"\u00A9",
  "copy":"\u00A9",
  "copysr":"\u2117",
  "CounterClockwiseContourIntegral":"\u2233",
  "crarr":"\u21B5",
  "Cross":"\u2A2F",
  "cross":"\u2717",
  "Cscr":"\uD835\uDC9E",
  "cscr":"\uD835\uDCB8",
  "csub":"\u2ACF",
  "csube":"\u2AD1",
  "csup":"\u2AD0",
  "csupe":"\u2AD2",
  "ctdot":"\u22EF",
  "cudarrl":"\u2938",
  "cudarrr":"\u2935",
  "cuepr":"\u22DE",
  "cuesc":"\u22DF",
  "cularr":"\u21B6",
  "cularrp":"\u293D",
  "Cup":"\u22D3",
  "cup":"\u222A",
  "cupbrcap":"\u2A48",
  "CupCap":"\u224D",
  "cupcap":"\u2A46",
  "cupcup":"\u2A4A",
  "cupdot":"\u228D",
  "cupor":"\u2A45",
  "cups":"\u222A\uFE00",
  "curarr":"\u21B7",
  "curarrm":"\u293C",
  "curlyeqprec":"\u22DE",
  "curlyeqsucc":"\u22DF",
  "curlyvee":"\u22CE",
  "curlywedge":"\u22CF",
  "curren":"\u00A4",
  "curvearrowleft":"\u21B6",
  "curvearrowright":"\u21B7",
  "cuvee":"\u22CE",
  "cuwed":"\u22CF",
  "cwconint":"\u2232",
  "cwint":"\u2231",
  "cylcty":"\u232D",
  "Dagger":"\u2021",
  "dagger":"\u2020",
  "daleth":"\u2138",
  "Darr":"\u21A1",
  "dArr":"\u21D3",
  "darr":"\u2193",
  "dash":"\u2010",
  "Dashv":"\u2AE4",
  "dashv":"\u22A3",
  "dbkarow":"\u290F",
  "dblac":"\u02DD",
  "Dcaron":"\u010E",
  "dcaron":"\u010F",
  "Dcy":"\u0414",
  "dcy":"\u0434",
  "DD":"\u2145",
  "dd":"\u2146",
  "ddagger":"\u2021",
  "ddarr":"\u21CA",
  "DDotrahd":"\u2911",
  "ddotseq":"\u2A77",
  "deg":"\u00B0",
  "Del":"\u2207",
  "Delta":"\u0394",
  "delta":"\u03B4",
  "demptyv":"\u29B1",
  "dfisht":"\u297F",
  "Dfr":"\uD835\uDD07",
  "dfr":"\uD835\uDD21",
  "dHar":"\u2965",
  "dharl":"\u21C3",
  "dharr":"\u21C2",
  "DiacriticalAcute":"\u00B4",
  "DiacriticalDot":"\u02D9",
  "DiacriticalDoubleAcute":"\u02DD",
  "DiacriticalGrave":"\u0060",
  "DiacriticalTilde":"\u02DC",
  "diam":"\u22C4",
  "Diamond":"\u22C4",
  "diamond":"\u22C4",
  "diamondsuit":"\u2666",
  "diams":"\u2666",
  "die":"\u00A8",
  "DifferentialD":"\u2146",
  "digamma":"\u03DD",
  "disin":"\u22F2",
  "div":"\u00F7",
  "divide":"\u00F7",
  "divideontimes":"\u22C7",
  "divonx":"\u22C7",
  "DJcy":"\u0402",
  "djcy":"\u0452",
  "dlcorn":"\u231E",
  "dlcrop":"\u230D",
  "dollar":"\u0024",
  "Dopf":"\uD835\uDD3B",
  "dopf":"\uD835\uDD55",
  "Dot":"\u00A8",
  "dot":"\u02D9",
  "DotDot":"\u20DC",
  "doteq":"\u2250",
  "doteqdot":"\u2251",
  "DotEqual":"\u2250",
  "dotminus":"\u2238",
  "dotplus":"\u2214",
  "dotsquare":"\u22A1",
  "doublebarwedge":"\u2306",
  "DoubleContourIntegral":"\u222F",
  "DoubleDot":"\u00A8",
  "DoubleDownArrow":"\u21D3",
  "DoubleLeftArrow":"\u21D0",
  "DoubleLeftRightArrow":"\u21D4",
  "DoubleLeftTee":"\u2AE4",
  "DoubleLongLeftArrow":"\u27F8",
  "DoubleLongLeftRightArrow":"\u27FA",
  "DoubleLongRightArrow":"\u27F9",
  "DoubleRightArrow":"\u21D2",
  "DoubleRightTee":"\u22A8",
  "DoubleUpArrow":"\u21D1",
  "DoubleUpDownArrow":"\u21D5",
  "DoubleVerticalBar":"\u2225",
  "DownArrow":"\u2193",
  "Downarrow":"\u21D3",
  "downarrow":"\u2193",
  "DownArrowBar":"\u2913",
  "DownArrowUpArrow":"\u21F5",
  "DownBreve":"\u0311",
  "downdownarrows":"\u21CA",
  "downharpoonleft":"\u21C3",
  "downharpoonright":"\u21C2",
  "DownLeftRightVector":"\u2950",
  "DownLeftTeeVector":"\u295E",
  "DownLeftVector":"\u21BD",
  "DownLeftVectorBar":"\u2956",
  "DownRightTeeVector":"\u295F",
  "DownRightVector":"\u21C1",
  "DownRightVectorBar":"\u2957",
  "DownTee":"\u22A4",
  "DownTeeArrow":"\u21A7",
  "drbkarow":"\u2910",
  "drcorn":"\u231F",
  "drcrop":"\u230C",
  "Dscr":"\uD835\uDC9F",
  "dscr":"\uD835\uDCB9",
  "DScy":"\u0405",
  "dscy":"\u0455",
  "dsol":"\u29F6",
  "Dstrok":"\u0110",
  "dstrok":"\u0111",
  "dtdot":"\u22F1",
  "dtri":"\u25BF",
  "dtrif":"\u25BE",
  "duarr":"\u21F5",
  "duhar":"\u296F",
  "dwangle":"\u29A6",
  "DZcy":"\u040F",
  "dzcy":"\u045F",
  "dzigrarr":"\u27FF",
  "Eacute":"\u00C9",
  "eacute":"\u00E9",
  "easter":"\u2A6E",
  "Ecaron":"\u011A",
  "ecaron":"\u011B",
  "ecir":"\u2256",
  "Ecirc":"\u00CA",
  "ecirc":"\u00EA",
  "ecolon":"\u2255",
  "Ecy":"\u042D",
  "ecy":"\u044D",
  "eDDot":"\u2A77",
  "Edot":"\u0116",
  "eDot":"\u2251",
  "edot":"\u0117",
  "ee":"\u2147",
  "efDot":"\u2252",
  "Efr":"\uD835\uDD08",
  "efr":"\uD835\uDD22",
  "eg":"\u2A9A",
  "Egrave":"\u00C8",
  "egrave":"\u00E8",
  "egs":"\u2A96",
  "egsdot":"\u2A98",
  "el":"\u2A99",
  "Element":"\u2208",
  "elinters":"\u23E7",
  "ell":"\u2113",
  "els":"\u2A95",
  "elsdot":"\u2A97",
  "Emacr":"\u0112",
  "emacr":"\u0113",
  "empty":"\u2205",
  "emptyset":"\u2205",
  "EmptySmallSquare":"\u25FB",
  "emptyv":"\u2205",
  "EmptyVerySmallSquare":"\u25AB",
  "emsp":"\u2003",
  "emsp13":"\u2004",
  "emsp14":"\u2005",
  "ENG":"\u014A",
  "eng":"\u014B",
  "ensp":"\u2002",
  "Eogon":"\u0118",
  "eogon":"\u0119",
  "Eopf":"\uD835\uDD3C",
  "eopf":"\uD835\uDD56",
  "epar":"\u22D5",
  "eparsl":"\u29E3",
  "eplus":"\u2A71",
  "epsi":"\u03B5",
  "Epsilon":"\u0395",
  "epsilon":"\u03B5",
  "epsiv":"\u03F5",
  "eqcirc":"\u2256",
  "eqcolon":"\u2255",
  "eqsim":"\u2242",
  "eqslantgtr":"\u2A96",
  "eqslantless":"\u2A95",
  "Equal":"\u2A75",
  "equals":"\u003D",
  "EqualTilde":"\u2242",
  "equest":"\u225F",
  "Equilibrium":"\u21CC",
  "equiv":"\u2261",
  "equivDD":"\u2A78",
  "eqvparsl":"\u29E5",
  "erarr":"\u2971",
  "erDot":"\u2253",
  "Escr":"\u2130",
  "escr":"\u212F",
  "esdot":"\u2250",
  "Esim":"\u2A73",
  "esim":"\u2242",
  "Eta":"\u0397",
  "eta":"\u03B7",
  "ETH":"\u00D0",
  "eth":"\u00F0",
  "Euml":"\u00CB",
  "euml":"\u00EB",
  "euro":"\u20AC",
  "excl":"\u0021",
  "exist":"\u2203",
  "Exists":"\u2203",
  "expectation":"\u2130",
  "ExponentialE":"\u2147",
  "exponentiale":"\u2147",
  "fallingdotseq":"\u2252",
  "Fcy":"\u0424",
  "fcy":"\u0444",
  "female":"\u2640",
  "ffilig":"\uFB03",
  "fflig":"\uFB00",
  "ffllig":"\uFB04",
  "Ffr":"\uD835\uDD09",
  "ffr":"\uD835\uDD23",
  "filig":"\uFB01",
  "FilledSmallSquare":"\u25FC",
  "FilledVerySmallSquare":"\u25AA",
  "fjlig":"\u0066\u006A",
  "flat":"\u266D",
  "fllig":"\uFB02",
  "fltns":"\u25B1",
  "fnof":"\u0192",
  "Fopf":"\uD835\uDD3D",
  "fopf":"\uD835\uDD57",
  "ForAll":"\u2200",
  "forall":"\u2200",
  "fork":"\u22D4",
  "forkv":"\u2AD9",
  "Fouriertrf":"\u2131",
  "fpartint":"\u2A0D",
  "frac12":"\u00BD",
  "frac13":"\u2153",
  "frac14":"\u00BC",
  "frac15":"\u2155",
  "frac16":"\u2159",
  "frac18":"\u215B",
  "frac23":"\u2154",
  "frac25":"\u2156",
  "frac34":"\u00BE",
  "frac35":"\u2157",
  "frac38":"\u215C",
  "frac45":"\u2158",
  "frac56":"\u215A",
  "frac58":"\u215D",
  "frac78":"\u215E",
  "frasl":"\u2044",
  "frown":"\u2322",
  "Fscr":"\u2131",
  "fscr":"\uD835\uDCBB",
  "gacute":"\u01F5",
  "Gamma":"\u0393",
  "gamma":"\u03B3",
  "Gammad":"\u03DC",
  "gammad":"\u03DD",
  "gap":"\u2A86",
  "Gbreve":"\u011E",
  "gbreve":"\u011F",
  "Gcedil":"\u0122",
  "Gcirc":"\u011C",
  "gcirc":"\u011D",
  "Gcy":"\u0413",
  "gcy":"\u0433",
  "Gdot":"\u0120",
  "gdot":"\u0121",
  "gE":"\u2267",
  "ge":"\u2265",
  "gEl":"\u2A8C",
  "gel":"\u22DB",
  "geq":"\u2265",
  "geqq":"\u2267",
  "geqslant":"\u2A7E",
  "ges":"\u2A7E",
  "gescc":"\u2AA9",
  "gesdot":"\u2A80",
  "gesdoto":"\u2A82",
  "gesdotol":"\u2A84",
  "gesl":"\u22DB\uFE00",
  "gesles":"\u2A94",
  "Gfr":"\uD835\uDD0A",
  "gfr":"\uD835\uDD24",
  "Gg":"\u22D9",
  "gg":"\u226B",
  "ggg":"\u22D9",
  "gimel":"\u2137",
  "GJcy":"\u0403",
  "gjcy":"\u0453",
  "gl":"\u2277",
  "gla":"\u2AA5",
  "glE":"\u2A92",
  "glj":"\u2AA4",
  "gnap":"\u2A8A",
  "gnapprox":"\u2A8A",
  "gnE":"\u2269",
  "gne":"\u2A88",
  "gneq":"\u2A88",
  "gneqq":"\u2269",
  "gnsim":"\u22E7",
  "Gopf":"\uD835\uDD3E",
  "gopf":"\uD835\uDD58",
  "grave":"\u0060",
  "GreaterEqual":"\u2265",
  "GreaterEqualLess":"\u22DB",
  "GreaterFullEqual":"\u2267",
  "GreaterGreater":"\u2AA2",
  "GreaterLess":"\u2277",
  "GreaterSlantEqual":"\u2A7E",
  "GreaterTilde":"\u2273",
  "Gscr":"\uD835\uDCA2",
  "gscr":"\u210A",
  "gsim":"\u2273",
  "gsime":"\u2A8E",
  "gsiml":"\u2A90",
  "GT":"\u003E",
  "Gt":"\u226B",
  "gt":"\u003E",
  "gtcc":"\u2AA7",
  "gtcir":"\u2A7A",
  "gtdot":"\u22D7",
  "gtlPar":"\u2995",
  "gtquest":"\u2A7C",
  "gtrapprox":"\u2A86",
  "gtrarr":"\u2978",
  "gtrdot":"\u22D7",
  "gtreqless":"\u22DB",
  "gtreqqless":"\u2A8C",
  "gtrless":"\u2277",
  "gtrsim":"\u2273",
  "gvertneqq":"\u2269\uFE00",
  "gvnE":"\u2269\uFE00",
  "Hacek":"\u02C7",
  "hairsp":"\u200A",
  "half":"\u00BD",
  "hamilt":"\u210B",
  "HARDcy":"\u042A",
  "hardcy":"\u044A",
  "hArr":"\u21D4",
  "harr":"\u2194",
  "harrcir":"\u2948",
  "harrw":"\u21AD",
  "Hat":"\u005E",
  "hbar":"\u210F",
  "Hcirc":"\u0124",
  "hcirc":"\u0125",
  "hearts":"\u2665",
  "heartsuit":"\u2665",
  "hellip":"\u2026",
  "hercon":"\u22B9",
  "Hfr":"\u210C",
  "hfr":"\uD835\uDD25",
  "HilbertSpace":"\u210B",
  "hksearow":"\u2925",
  "hkswarow":"\u2926",
  "hoarr":"\u21FF",
  "homtht":"\u223B",
  "hookleftarrow":"\u21A9",
  "hookrightarrow":"\u21AA",
  "Hopf":"\u210D",
  "hopf":"\uD835\uDD59",
  "horbar":"\u2015",
  "HorizontalLine":"\u2500",
  "Hscr":"\u210B",
  "hscr":"\uD835\uDCBD",
  "hslash":"\u210F",
  "Hstrok":"\u0126",
  "hstrok":"\u0127",
  "HumpDownHump":"\u224E",
  "HumpEqual":"\u224F",
  "hybull":"\u2043",
  "hyphen":"\u2010",
  "Iacute":"\u00CD",
  "iacute":"\u00ED",
  "ic":"\u2063",
  "Icirc":"\u00CE",
  "icirc":"\u00EE",
  "Icy":"\u0418",
  "icy":"\u0438",
  "Idot":"\u0130",
  "IEcy":"\u0415",
  "iecy":"\u0435",
  "iexcl":"\u00A1",
  "iff":"\u21D4",
  "Ifr":"\u2111",
  "ifr":"\uD835\uDD26",
  "Igrave":"\u00CC",
  "igrave":"\u00EC",
  "ii":"\u2148",
  "iiiint":"\u2A0C",
  "iiint":"\u222D",
  "iinfin":"\u29DC",
  "iiota":"\u2129",
  "IJlig":"\u0132",
  "ijlig":"\u0133",
  "Im":"\u2111",
  "Imacr":"\u012A",
  "imacr":"\u012B",
  "image":"\u2111",
  "ImaginaryI":"\u2148",
  "imagline":"\u2110",
  "imagpart":"\u2111",
  "imath":"\u0131",
  "imof":"\u22B7",
  "imped":"\u01B5",
  "Implies":"\u21D2",
  "in":"\u2208",
  "incare":"\u2105",
  "infin":"\u221E",
  "infintie":"\u29DD",
  "inodot":"\u0131",
  "Int":"\u222C",
  "int":"\u222B",
  "intcal":"\u22BA",
  "integers":"\u2124",
  "Integral":"\u222B",
  "intercal":"\u22BA",
  "Intersection":"\u22C2",
  "intlarhk":"\u2A17",
  "intprod":"\u2A3C",
  "InvisibleComma":"\u2063",
  "InvisibleTimes":"\u2062",
  "IOcy":"\u0401",
  "iocy":"\u0451",
  "Iogon":"\u012E",
  "iogon":"\u012F",
  "Iopf":"\uD835\uDD40",
  "iopf":"\uD835\uDD5A",
  "Iota":"\u0399",
  "iota":"\u03B9",
  "iprod":"\u2A3C",
  "iquest":"\u00BF",
  "Iscr":"\u2110",
  "iscr":"\uD835\uDCBE",
  "isin":"\u2208",
  "isindot":"\u22F5",
  "isinE":"\u22F9",
  "isins":"\u22F4",
  "isinsv":"\u22F3",
  "isinv":"\u2208",
  "it":"\u2062",
  "Itilde":"\u0128",
  "itilde":"\u0129",
  "Iukcy":"\u0406",
  "iukcy":"\u0456",
  "Iuml":"\u00CF",
  "iuml":"\u00EF",
  "Jcirc":"\u0134",
  "jcirc":"\u0135",
  "Jcy":"\u0419",
  "jcy":"\u0439",
  "Jfr":"\uD835\uDD0D",
  "jfr":"\uD835\uDD27",
  "jmath":"\u0237",
  "Jopf":"\uD835\uDD41",
  "jopf":"\uD835\uDD5B",
  "Jscr":"\uD835\uDCA5",
  "jscr":"\uD835\uDCBF",
  "Jsercy":"\u0408",
  "jsercy":"\u0458",
  "Jukcy":"\u0404",
  "jukcy":"\u0454",
  "Kappa":"\u039A",
  "kappa":"\u03BA",
  "kappav":"\u03F0",
  "Kcedil":"\u0136",
  "kcedil":"\u0137",
  "Kcy":"\u041A",
  "kcy":"\u043A",
  "Kfr":"\uD835\uDD0E",
  "kfr":"\uD835\uDD28",
  "kgreen":"\u0138",
  "KHcy":"\u0425",
  "khcy":"\u0445",
  "KJcy":"\u040C",
  "kjcy":"\u045C",
  "Kopf":"\uD835\uDD42",
  "kopf":"\uD835\uDD5C",
  "Kscr":"\uD835\uDCA6",
  "kscr":"\uD835\uDCC0",
  "lAarr":"\u21DA",
  "Lacute":"\u0139",
  "lacute":"\u013A",
  "laemptyv":"\u29B4",
  "lagran":"\u2112",
  "Lambda":"\u039B",
  "lambda":"\u03BB",
  "Lang":"\u27EA",
  "lang":"\u27E8",
  "langd":"\u2991",
  "langle":"\u27E8",
  "lap":"\u2A85",
  "Laplacetrf":"\u2112",
  "laquo":"\u00AB",
  "Larr":"\u219E",
  "lArr":"\u21D0",
  "larr":"\u2190",
  "larrb":"\u21E4",
  "larrbfs":"\u291F",
  "larrfs":"\u291D",
  "larrhk":"\u21A9",
  "larrlp":"\u21AB",
  "larrpl":"\u2939",
  "larrsim":"\u2973",
  "larrtl":"\u21A2",
  "lat":"\u2AAB",
  "lAtail":"\u291B",
  "latail":"\u2919",
  "late":"\u2AAD",
  "lates":"\u2AAD\uFE00",
  "lBarr":"\u290E",
  "lbarr":"\u290C",
  "lbbrk":"\u2772",
  "lbrace":"\u007B",
  "lbrack":"\u005B",
  "lbrke":"\u298B",
  "lbrksld":"\u298F",
  "lbrkslu":"\u298D",
  "Lcaron":"\u013D",
  "lcaron":"\u013E",
  "Lcedil":"\u013B",
  "lcedil":"\u013C",
  "lceil":"\u2308",
  "lcub":"\u007B",
  "Lcy":"\u041B",
  "lcy":"\u043B",
  "ldca":"\u2936",
  "ldquo":"\u201C",
  "ldquor":"\u201E",
  "ldrdhar":"\u2967",
  "ldrushar":"\u294B",
  "ldsh":"\u21B2",
  "lE":"\u2266",
  "le":"\u2264",
  "LeftAngleBracket":"\u27E8",
  "LeftArrow":"\u2190",
  "Leftarrow":"\u21D0",
  "leftarrow":"\u2190",
  "LeftArrowBar":"\u21E4",
  "LeftArrowRightArrow":"\u21C6",
  "leftarrowtail":"\u21A2",
  "LeftCeiling":"\u2308",
  "LeftDoubleBracket":"\u27E6",
  "LeftDownTeeVector":"\u2961",
  "LeftDownVector":"\u21C3",
  "LeftDownVectorBar":"\u2959",
  "LeftFloor":"\u230A",
  "leftharpoondown":"\u21BD",
  "leftharpoonup":"\u21BC",
  "leftleftarrows":"\u21C7",
  "LeftRightArrow":"\u2194",
  "Leftrightarrow":"\u21D4",
  "leftrightarrow":"\u2194",
  "leftrightarrows":"\u21C6",
  "leftrightharpoons":"\u21CB",
  "leftrightsquigarrow":"\u21AD",
  "LeftRightVector":"\u294E",
  "LeftTee":"\u22A3",
  "LeftTeeArrow":"\u21A4",
  "LeftTeeVector":"\u295A",
  "leftthreetimes":"\u22CB",
  "LeftTriangle":"\u22B2",
  "LeftTriangleBar":"\u29CF",
  "LeftTriangleEqual":"\u22B4",
  "LeftUpDownVector":"\u2951",
  "LeftUpTeeVector":"\u2960",
  "LeftUpVector":"\u21BF",
  "LeftUpVectorBar":"\u2958",
  "LeftVector":"\u21BC",
  "LeftVectorBar":"\u2952",
  "lEg":"\u2A8B",
  "leg":"\u22DA",
  "leq":"\u2264",
  "leqq":"\u2266",
  "leqslant":"\u2A7D",
  "les":"\u2A7D",
  "lescc":"\u2AA8",
  "lesdot":"\u2A7F",
  "lesdoto":"\u2A81",
  "lesdotor":"\u2A83",
  "lesg":"\u22DA\uFE00",
  "lesges":"\u2A93",
  "lessapprox":"\u2A85",
  "lessdot":"\u22D6",
  "lesseqgtr":"\u22DA",
  "lesseqqgtr":"\u2A8B",
  "LessEqualGreater":"\u22DA",
  "LessFullEqual":"\u2266",
  "LessGreater":"\u2276",
  "lessgtr":"\u2276",
  "LessLess":"\u2AA1",
  "lesssim":"\u2272",
  "LessSlantEqual":"\u2A7D",
  "LessTilde":"\u2272",
  "lfisht":"\u297C",
  "lfloor":"\u230A",
  "Lfr":"\uD835\uDD0F",
  "lfr":"\uD835\uDD29",
  "lg":"\u2276",
  "lgE":"\u2A91",
  "lHar":"\u2962",
  "lhard":"\u21BD",
  "lharu":"\u21BC",
  "lharul":"\u296A",
  "lhblk":"\u2584",
  "LJcy":"\u0409",
  "ljcy":"\u0459",
  "Ll":"\u22D8",
  "ll":"\u226A",
  "llarr":"\u21C7",
  "llcorner":"\u231E",
  "Lleftarrow":"\u21DA",
  "llhard":"\u296B",
  "lltri":"\u25FA",
  "Lmidot":"\u013F",
  "lmidot":"\u0140",
  "lmoust":"\u23B0",
  "lmoustache":"\u23B0",
  "lnap":"\u2A89",
  "lnapprox":"\u2A89",
  "lnE":"\u2268",
  "lne":"\u2A87",
  "lneq":"\u2A87",
  "lneqq":"\u2268",
  "lnsim":"\u22E6",
  "loang":"\u27EC",
  "loarr":"\u21FD",
  "lobrk":"\u27E6",
  "LongLeftArrow":"\u27F5",
  "Longleftarrow":"\u27F8",
  "longleftarrow":"\u27F5",
  "LongLeftRightArrow":"\u27F7",
  "Longleftrightarrow":"\u27FA",
  "longleftrightarrow":"\u27F7",
  "longmapsto":"\u27FC",
  "LongRightArrow":"\u27F6",
  "Longrightarrow":"\u27F9",
  "longrightarrow":"\u27F6",
  "looparrowleft":"\u21AB",
  "looparrowright":"\u21AC",
  "lopar":"\u2985",
  "Lopf":"\uD835\uDD43",
  "lopf":"\uD835\uDD5D",
  "loplus":"\u2A2D",
  "lotimes":"\u2A34",
  "lowast":"\u2217",
  "lowbar":"\u005F",
  "LowerLeftArrow":"\u2199",
  "LowerRightArrow":"\u2198",
  "loz":"\u25CA",
  "lozenge":"\u25CA",
  "lozf":"\u29EB",
  "lpar":"\u0028",
  "lparlt":"\u2993",
  "lrarr":"\u21C6",
  "lrcorner":"\u231F",
  "lrhar":"\u21CB",
  "lrhard":"\u296D",
  "lrm":"\u200E",
  "lrtri":"\u22BF",
  "lsaquo":"\u2039",
  "Lscr":"\u2112",
  "lscr":"\uD835\uDCC1",
  "Lsh":"\u21B0",
  "lsh":"\u21B0",
  "lsim":"\u2272",
  "lsime":"\u2A8D",
  "lsimg":"\u2A8F",
  "lsqb":"\u005B",
  "lsquo":"\u2018",
  "lsquor":"\u201A",
  "Lstrok":"\u0141",
  "lstrok":"\u0142",
  "LT":"\u003C",
  "Lt":"\u226A",
  "lt":"\u003C",
  "ltcc":"\u2AA6",
  "ltcir":"\u2A79",
  "ltdot":"\u22D6",
  "lthree":"\u22CB",
  "ltimes":"\u22C9",
  "ltlarr":"\u2976",
  "ltquest":"\u2A7B",
  "ltri":"\u25C3",
  "ltrie":"\u22B4",
  "ltrif":"\u25C2",
  "ltrPar":"\u2996",
  "lurdshar":"\u294A",
  "luruhar":"\u2966",
  "lvertneqq":"\u2268\uFE00",
  "lvnE":"\u2268\uFE00",
  "macr":"\u00AF",
  "male":"\u2642",
  "malt":"\u2720",
  "maltese":"\u2720",
  "Map":"\u2905",
  "map":"\u21A6",
  "mapsto":"\u21A6",
  "mapstodown":"\u21A7",
  "mapstoleft":"\u21A4",
  "mapstoup":"\u21A5",
  "marker":"\u25AE",
  "mcomma":"\u2A29",
  "Mcy":"\u041C",
  "mcy":"\u043C",
  "mdash":"\u2014",
  "mDDot":"\u223A",
  "measuredangle":"\u2221",
  "MediumSpace":"\u205F",
  "Mellintrf":"\u2133",
  "Mfr":"\uD835\uDD10",
  "mfr":"\uD835\uDD2A",
  "mho":"\u2127",
  "micro":"\u00B5",
  "mid":"\u2223",
  "midast":"\u002A",
  "midcir":"\u2AF0",
  "middot":"\u00B7",
  "minus":"\u2212",
  "minusb":"\u229F",
  "minusd":"\u2238",
  "minusdu":"\u2A2A",
  "MinusPlus":"\u2213",
  "mlcp":"\u2ADB",
  "mldr":"\u2026",
  "mnplus":"\u2213",
  "models":"\u22A7",
  "Mopf":"\uD835\uDD44",
  "mopf":"\uD835\uDD5E",
  "mp":"\u2213",
  "Mscr":"\u2133",
  "mscr":"\uD835\uDCC2",
  "mstpos":"\u223E",
  "Mu":"\u039C",
  "mu":"\u03BC",
  "multimap":"\u22B8",
  "mumap":"\u22B8",
  "nabla":"\u2207",
  "Nacute":"\u0143",
  "nacute":"\u0144",
  "nang":"\u2220\u20D2",
  "nap":"\u2249",
  "napE":"\u2A70\u0338",
  "napid":"\u224B\u0338",
  "napos":"\u0149",
  "napprox":"\u2249",
  "natur":"\u266E",
  "natural":"\u266E",
  "naturals":"\u2115",
  "nbsp":"\u00A0",
  "nbump":"\u224E\u0338",
  "nbumpe":"\u224F\u0338",
  "ncap":"\u2A43",
  "Ncaron":"\u0147",
  "ncaron":"\u0148",
  "Ncedil":"\u0145",
  "ncedil":"\u0146",
  "ncong":"\u2247",
  "ncongdot":"\u2A6D\u0338",
  "ncup":"\u2A42",
  "Ncy":"\u041D",
  "ncy":"\u043D",
  "ndash":"\u2013",
  "ne":"\u2260",
  "nearhk":"\u2924",
  "neArr":"\u21D7",
  "nearr":"\u2197",
  "nearrow":"\u2197",
  "nedot":"\u2250\u0338",
  "NegativeMediumSpace":"\u200B",
  "NegativeThickSpace":"\u200B",
  "NegativeThinSpace":"\u200B",
  "NegativeVeryThinSpace":"\u200B",
  "nequiv":"\u2262",
  "nesear":"\u2928",
  "nesim":"\u2242\u0338",
  "NestedGreaterGreater":"\u226B",
  "NestedLessLess":"\u226A",
  "NewLine":"\u000A",
  "nexist":"\u2204",
  "nexists":"\u2204",
  "Nfr":"\uD835\uDD11",
  "nfr":"\uD835\uDD2B",
  "ngE":"\u2267\u0338",
  "nge":"\u2271",
  "ngeq":"\u2271",
  "ngeqq":"\u2267\u0338",
  "ngeqslant":"\u2A7E\u0338",
  "nges":"\u2A7E\u0338",
  "nGg":"\u22D9\u0338",
  "ngsim":"\u2275",
  "nGt":"\u226B\u20D2",
  "ngt":"\u226F",
  "ngtr":"\u226F",
  "nGtv":"\u226B\u0338",
  "nhArr":"\u21CE",
  "nharr":"\u21AE",
  "nhpar":"\u2AF2",
  "ni":"\u220B",
  "nis":"\u22FC",
  "nisd":"\u22FA",
  "niv":"\u220B",
  "NJcy":"\u040A",
  "njcy":"\u045A",
  "nlArr":"\u21CD",
  "nlarr":"\u219A",
  "nldr":"\u2025",
  "nlE":"\u2266\u0338",
  "nle":"\u2270",
  "nLeftarrow":"\u21CD",
  "nleftarrow":"\u219A",
  "nLeftrightarrow":"\u21CE",
  "nleftrightarrow":"\u21AE",
  "nleq":"\u2270",
  "nleqq":"\u2266\u0338",
  "nleqslant":"\u2A7D\u0338",
  "nles":"\u2A7D\u0338",
  "nless":"\u226E",
  "nLl":"\u22D8\u0338",
  "nlsim":"\u2274",
  "nLt":"\u226A\u20D2",
  "nlt":"\u226E",
  "nltri":"\u22EA",
  "nltrie":"\u22EC",
  "nLtv":"\u226A\u0338",
  "nmid":"\u2224",
  "NoBreak":"\u2060",
  "NonBreakingSpace":"\u00A0",
  "Nopf":"\u2115",
  "nopf":"\uD835\uDD5F",
  "Not":"\u2AEC",
  "not":"\u00AC",
  "NotCongruent":"\u2262",
  "NotCupCap":"\u226D",
  "NotDoubleVerticalBar":"\u2226",
  "NotElement":"\u2209",
  "NotEqual":"\u2260",
  "NotEqualTilde":"\u2242\u0338",
  "NotExists":"\u2204",
  "NotGreater":"\u226F",
  "NotGreaterEqual":"\u2271",
  "NotGreaterFullEqual":"\u2267\u0338",
  "NotGreaterGreater":"\u226B\u0338",
  "NotGreaterLess":"\u2279",
  "NotGreaterSlantEqual":"\u2A7E\u0338",
  "NotGreaterTilde":"\u2275",
  "NotHumpDownHump":"\u224E\u0338",
  "NotHumpEqual":"\u224F\u0338",
  "notin":"\u2209",
  "notindot":"\u22F5\u0338",
  "notinE":"\u22F9\u0338",
  "notinva":"\u2209",
  "notinvb":"\u22F7",
  "notinvc":"\u22F6",
  "NotLeftTriangle":"\u22EA",
  "NotLeftTriangleBar":"\u29CF\u0338",
  "NotLeftTriangleEqual":"\u22EC",
  "NotLess":"\u226E",
  "NotLessEqual":"\u2270",
  "NotLessGreater":"\u2278",
  "NotLessLess":"\u226A\u0338",
  "NotLessSlantEqual":"\u2A7D\u0338",
  "NotLessTilde":"\u2274",
  "NotNestedGreaterGreater":"\u2AA2\u0338",
  "NotNestedLessLess":"\u2AA1\u0338",
  "notni":"\u220C",
  "notniva":"\u220C",
  "notnivb":"\u22FE",
  "notnivc":"\u22FD",
  "NotPrecedes":"\u2280",
  "NotPrecedesEqual":"\u2AAF\u0338",
  "NotPrecedesSlantEqual":"\u22E0",
  "NotReverseElement":"\u220C",
  "NotRightTriangle":"\u22EB",
  "NotRightTriangleBar":"\u29D0\u0338",
  "NotRightTriangleEqual":"\u22ED",
  "NotSquareSubset":"\u228F\u0338",
  "NotSquareSubsetEqual":"\u22E2",
  "NotSquareSuperset":"\u2290\u0338",
  "NotSquareSupersetEqual":"\u22E3",
  "NotSubset":"\u2282\u20D2",
  "NotSubsetEqual":"\u2288",
  "NotSucceeds":"\u2281",
  "NotSucceedsEqual":"\u2AB0\u0338",
  "NotSucceedsSlantEqual":"\u22E1",
  "NotSucceedsTilde":"\u227F\u0338",
  "NotSuperset":"\u2283\u20D2",
  "NotSupersetEqual":"\u2289",
  "NotTilde":"\u2241",
  "NotTildeEqual":"\u2244",
  "NotTildeFullEqual":"\u2247",
  "NotTildeTilde":"\u2249",
  "NotVerticalBar":"\u2224",
  "npar":"\u2226",
  "nparallel":"\u2226",
  "nparsl":"\u2AFD\u20E5",
  "npart":"\u2202\u0338",
  "npolint":"\u2A14",
  "npr":"\u2280",
  "nprcue":"\u22E0",
  "npre":"\u2AAF\u0338",
  "nprec":"\u2280",
  "npreceq":"\u2AAF\u0338",
  "nrArr":"\u21CF",
  "nrarr":"\u219B",
  "nrarrc":"\u2933\u0338",
  "nrarrw":"\u219D\u0338",
  "nRightarrow":"\u21CF",
  "nrightarrow":"\u219B",
  "nrtri":"\u22EB",
  "nrtrie":"\u22ED",
  "nsc":"\u2281",
  "nsccue":"\u22E1",
  "nsce":"\u2AB0\u0338",
  "Nscr":"\uD835\uDCA9",
  "nscr":"\uD835\uDCC3",
  "nshortmid":"\u2224",
  "nshortparallel":"\u2226",
  "nsim":"\u2241",
  "nsime":"\u2244",
  "nsimeq":"\u2244",
  "nsmid":"\u2224",
  "nspar":"\u2226",
  "nsqsube":"\u22E2",
  "nsqsupe":"\u22E3",
  "nsub":"\u2284",
  "nsubE":"\u2AC5\u0338",
  "nsube":"\u2288",
  "nsubset":"\u2282\u20D2",
  "nsubseteq":"\u2288",
  "nsubseteqq":"\u2AC5\u0338",
  "nsucc":"\u2281",
  "nsucceq":"\u2AB0\u0338",
  "nsup":"\u2285",
  "nsupE":"\u2AC6\u0338",
  "nsupe":"\u2289",
  "nsupset":"\u2283\u20D2",
  "nsupseteq":"\u2289",
  "nsupseteqq":"\u2AC6\u0338",
  "ntgl":"\u2279",
  "Ntilde":"\u00D1",
  "ntilde":"\u00F1",
  "ntlg":"\u2278",
  "ntriangleleft":"\u22EA",
  "ntrianglelefteq":"\u22EC",
  "ntriangleright":"\u22EB",
  "ntrianglerighteq":"\u22ED",
  "Nu":"\u039D",
  "nu":"\u03BD",
  "num":"\u0023",
  "numero":"\u2116",
  "numsp":"\u2007",
  "nvap":"\u224D\u20D2",
  "nVDash":"\u22AF",
  "nVdash":"\u22AE",
  "nvDash":"\u22AD",
  "nvdash":"\u22AC",
  "nvge":"\u2265\u20D2",
  "nvgt":"\u003E\u20D2",
  "nvHarr":"\u2904",
  "nvinfin":"\u29DE",
  "nvlArr":"\u2902",
  "nvle":"\u2264\u20D2",
  "nvlt":"\u003C\u20D2",
  "nvltrie":"\u22B4\u20D2",
  "nvrArr":"\u2903",
  "nvrtrie":"\u22B5\u20D2",
  "nvsim":"\u223C\u20D2",
  "nwarhk":"\u2923",
  "nwArr":"\u21D6",
  "nwarr":"\u2196",
  "nwarrow":"\u2196",
  "nwnear":"\u2927",
  "Oacute":"\u00D3",
  "oacute":"\u00F3",
  "oast":"\u229B",
  "ocir":"\u229A",
  "Ocirc":"\u00D4",
  "ocirc":"\u00F4",
  "Ocy":"\u041E",
  "ocy":"\u043E",
  "odash":"\u229D",
  "Odblac":"\u0150",
  "odblac":"\u0151",
  "odiv":"\u2A38",
  "odot":"\u2299",
  "odsold":"\u29BC",
  "OElig":"\u0152",
  "oelig":"\u0153",
  "ofcir":"\u29BF",
  "Ofr":"\uD835\uDD12",
  "ofr":"\uD835\uDD2C",
  "ogon":"\u02DB",
  "Ograve":"\u00D2",
  "ograve":"\u00F2",
  "ogt":"\u29C1",
  "ohbar":"\u29B5",
  "ohm":"\u03A9",
  "oint":"\u222E",
  "olarr":"\u21BA",
  "olcir":"\u29BE",
  "olcross":"\u29BB",
  "oline":"\u203E",
  "olt":"\u29C0",
  "Omacr":"\u014C",
  "omacr":"\u014D",
  "Omega":"\u03A9",
  "omega":"\u03C9",
  "Omicron":"\u039F",
  "omicron":"\u03BF",
  "omid":"\u29B6",
  "ominus":"\u2296",
  "Oopf":"\uD835\uDD46",
  "oopf":"\uD835\uDD60",
  "opar":"\u29B7",
  "OpenCurlyDoubleQuote":"\u201C",
  "OpenCurlyQuote":"\u2018",
  "operp":"\u29B9",
  "oplus":"\u2295",
  "Or":"\u2A54",
  "or":"\u2228",
  "orarr":"\u21BB",
  "ord":"\u2A5D",
  "order":"\u2134",
  "orderof":"\u2134",
  "ordf":"\u00AA",
  "ordm":"\u00BA",
  "origof":"\u22B6",
  "oror":"\u2A56",
  "orslope":"\u2A57",
  "orv":"\u2A5B",
  "oS":"\u24C8",
  "Oscr":"\uD835\uDCAA",
  "oscr":"\u2134",
  "Oslash":"\u00D8",
  "oslash":"\u00F8",
  "osol":"\u2298",
  "Otilde":"\u00D5",
  "otilde":"\u00F5",
  "Otimes":"\u2A37",
  "otimes":"\u2297",
  "otimesas":"\u2A36",
  "Ouml":"\u00D6",
  "ouml":"\u00F6",
  "ovbar":"\u233D",
  "OverBar":"\u203E",
  "OverBrace":"\u23DE",
  "OverBracket":"\u23B4",
  "OverParenthesis":"\u23DC",
  "par":"\u2225",
  "para":"\u00B6",
  "parallel":"\u2225",
  "parsim":"\u2AF3",
  "parsl":"\u2AFD",
  "part":"\u2202",
  "PartialD":"\u2202",
  "Pcy":"\u041F",
  "pcy":"\u043F",
  "percnt":"\u0025",
  "period":"\u002E",
  "permil":"\u2030",
  "perp":"\u22A5",
  "pertenk":"\u2031",
  "Pfr":"\uD835\uDD13",
  "pfr":"\uD835\uDD2D",
  "Phi":"\u03A6",
  "phi":"\u03C6",
  "phiv":"\u03D5",
  "phmmat":"\u2133",
  "phone":"\u260E",
  "Pi":"\u03A0",
  "pi":"\u03C0",
  "pitchfork":"\u22D4",
  "piv":"\u03D6",
  "planck":"\u210F",
  "planckh":"\u210E",
  "plankv":"\u210F",
  "plus":"\u002B",
  "plusacir":"\u2A23",
  "plusb":"\u229E",
  "pluscir":"\u2A22",
  "plusdo":"\u2214",
  "plusdu":"\u2A25",
  "pluse":"\u2A72",
  "PlusMinus":"\u00B1",
  "plusmn":"\u00B1",
  "plussim":"\u2A26",
  "plustwo":"\u2A27",
  "pm":"\u00B1",
  "Poincareplane":"\u210C",
  "pointint":"\u2A15",
  "Popf":"\u2119",
  "popf":"\uD835\uDD61",
  "pound":"\u00A3",
  "Pr":"\u2ABB",
  "pr":"\u227A",
  "prap":"\u2AB7",
  "prcue":"\u227C",
  "prE":"\u2AB3",
  "pre":"\u2AAF",
  "prec":"\u227A",
  "precapprox":"\u2AB7",
  "preccurlyeq":"\u227C",
  "Precedes":"\u227A",
  "PrecedesEqual":"\u2AAF",
  "PrecedesSlantEqual":"\u227C",
  "PrecedesTilde":"\u227E",
  "preceq":"\u2AAF",
  "precnapprox":"\u2AB9",
  "precneqq":"\u2AB5",
  "precnsim":"\u22E8",
  "precsim":"\u227E",
  "Prime":"\u2033",
  "prime":"\u2032",
  "primes":"\u2119",
  "prnap":"\u2AB9",
  "prnE":"\u2AB5",
  "prnsim":"\u22E8",
  "prod":"\u220F",
  "Product":"\u220F",
  "profalar":"\u232E",
  "profline":"\u2312",
  "profsurf":"\u2313",
  "prop":"\u221D",
  "Proportion":"\u2237",
  "Proportional":"\u221D",
  "propto":"\u221D",
  "prsim":"\u227E",
  "prurel":"\u22B0",
  "Pscr":"\uD835\uDCAB",
  "pscr":"\uD835\uDCC5",
  "Psi":"\u03A8",
  "psi":"\u03C8",
  "puncsp":"\u2008",
  "Qfr":"\uD835\uDD14",
  "qfr":"\uD835\uDD2E",
  "qint":"\u2A0C",
  "Qopf":"\u211A",
  "qopf":"\uD835\uDD62",
  "qprime":"\u2057",
  "Qscr":"\uD835\uDCAC",
  "qscr":"\uD835\uDCC6",
  "quaternions":"\u210D",
  "quatint":"\u2A16",
  "quest":"\u003F",
  "questeq":"\u225F",
  "QUOT":"\u0022",
  "quot":"\u0022",
  "rAarr":"\u21DB",
  "race":"\u223D\u0331",
  "Racute":"\u0154",
  "racute":"\u0155",
  "radic":"\u221A",
  "raemptyv":"\u29B3",
  "Rang":"\u27EB",
  "rang":"\u27E9",
  "rangd":"\u2992",
  "range":"\u29A5",
  "rangle":"\u27E9",
  "raquo":"\u00BB",
  "Rarr":"\u21A0",
  "rArr":"\u21D2",
  "rarr":"\u2192",
  "rarrap":"\u2975",
  "rarrb":"\u21E5",
  "rarrbfs":"\u2920",
  "rarrc":"\u2933",
  "rarrfs":"\u291E",
  "rarrhk":"\u21AA",
  "rarrlp":"\u21AC",
  "rarrpl":"\u2945",
  "rarrsim":"\u2974",
  "Rarrtl":"\u2916",
  "rarrtl":"\u21A3",
  "rarrw":"\u219D",
  "rAtail":"\u291C",
  "ratail":"\u291A",
  "ratio":"\u2236",
  "rationals":"\u211A",
  "RBarr":"\u2910",
  "rBarr":"\u290F",
  "rbarr":"\u290D",
  "rbbrk":"\u2773",
  "rbrace":"\u007D",
  "rbrack":"\u005D",
  "rbrke":"\u298C",
  "rbrksld":"\u298E",
  "rbrkslu":"\u2990",
  "Rcaron":"\u0158",
  "rcaron":"\u0159",
  "Rcedil":"\u0156",
  "rcedil":"\u0157",
  "rceil":"\u2309",
  "rcub":"\u007D",
  "Rcy":"\u0420",
  "rcy":"\u0440",
  "rdca":"\u2937",
  "rdldhar":"\u2969",
  "rdquo":"\u201D",
  "rdquor":"\u201D",
  "rdsh":"\u21B3",
  "Re":"\u211C",
  "real":"\u211C",
  "realine":"\u211B",
  "realpart":"\u211C",
  "reals":"\u211D",
  "rect":"\u25AD",
  "REG":"\u00AE",
  "reg":"\u00AE",
  "ReverseElement":"\u220B",
  "ReverseEquilibrium":"\u21CB",
  "ReverseUpEquilibrium":"\u296F",
  "rfisht":"\u297D",
  "rfloor":"\u230B",
  "Rfr":"\u211C",
  "rfr":"\uD835\uDD2F",
  "rHar":"\u2964",
  "rhard":"\u21C1",
  "rharu":"\u21C0",
  "rharul":"\u296C",
  "Rho":"\u03A1",
  "rho":"\u03C1",
  "rhov":"\u03F1",
  "RightAngleBracket":"\u27E9",
  "RightArrow":"\u2192",
  "Rightarrow":"\u21D2",
  "rightarrow":"\u2192",
  "RightArrowBar":"\u21E5",
  "RightArrowLeftArrow":"\u21C4",
  "rightarrowtail":"\u21A3",
  "RightCeiling":"\u2309",
  "RightDoubleBracket":"\u27E7",
  "RightDownTeeVector":"\u295D",
  "RightDownVector":"\u21C2",
  "RightDownVectorBar":"\u2955",
  "RightFloor":"\u230B",
  "rightharpoondown":"\u21C1",
  "rightharpoonup":"\u21C0",
  "rightleftarrows":"\u21C4",
  "rightleftharpoons":"\u21CC",
  "rightrightarrows":"\u21C9",
  "rightsquigarrow":"\u219D",
  "RightTee":"\u22A2",
  "RightTeeArrow":"\u21A6",
  "RightTeeVector":"\u295B",
  "rightthreetimes":"\u22CC",
  "RightTriangle":"\u22B3",
  "RightTriangleBar":"\u29D0",
  "RightTriangleEqual":"\u22B5",
  "RightUpDownVector":"\u294F",
  "RightUpTeeVector":"\u295C",
  "RightUpVector":"\u21BE",
  "RightUpVectorBar":"\u2954",
  "RightVector":"\u21C0",
  "RightVectorBar":"\u2953",
  "ring":"\u02DA",
  "risingdotseq":"\u2253",
  "rlarr":"\u21C4",
  "rlhar":"\u21CC",
  "rlm":"\u200F",
  "rmoust":"\u23B1",
  "rmoustache":"\u23B1",
  "rnmid":"\u2AEE",
  "roang":"\u27ED",
  "roarr":"\u21FE",
  "robrk":"\u27E7",
  "ropar":"\u2986",
  "Ropf":"\u211D",
  "ropf":"\uD835\uDD63",
  "roplus":"\u2A2E",
  "rotimes":"\u2A35",
  "RoundImplies":"\u2970",
  "rpar":"\u0029",
  "rpargt":"\u2994",
  "rppolint":"\u2A12",
  "rrarr":"\u21C9",
  "Rrightarrow":"\u21DB",
  "rsaquo":"\u203A",
  "Rscr":"\u211B",
  "rscr":"\uD835\uDCC7",
  "Rsh":"\u21B1",
  "rsh":"\u21B1",
  "rsqb":"\u005D",
  "rsquo":"\u2019",
  "rsquor":"\u2019",
  "rthree":"\u22CC",
  "rtimes":"\u22CA",
  "rtri":"\u25B9",
  "rtrie":"\u22B5",
  "rtrif":"\u25B8",
  "rtriltri":"\u29CE",
  "RuleDelayed":"\u29F4",
  "ruluhar":"\u2968",
  "rx":"\u211E",
  "Sacute":"\u015A",
  "sacute":"\u015B",
  "sbquo":"\u201A",
  "Sc":"\u2ABC",
  "sc":"\u227B",
  "scap":"\u2AB8",
  "Scaron":"\u0160",
  "scaron":"\u0161",
  "sccue":"\u227D",
  "scE":"\u2AB4",
  "sce":"\u2AB0",
  "Scedil":"\u015E",
  "scedil":"\u015F",
  "Scirc":"\u015C",
  "scirc":"\u015D",
  "scnap":"\u2ABA",
  "scnE":"\u2AB6",
  "scnsim":"\u22E9",
  "scpolint":"\u2A13",
  "scsim":"\u227F",
  "Scy":"\u0421",
  "scy":"\u0441",
  "sdot":"\u22C5",
  "sdotb":"\u22A1",
  "sdote":"\u2A66",
  "searhk":"\u2925",
  "seArr":"\u21D8",
  "searr":"\u2198",
  "searrow":"\u2198",
  "sect":"\u00A7",
  "semi":"\u003B",
  "seswar":"\u2929",
  "setminus":"\u2216",
  "setmn":"\u2216",
  "sext":"\u2736",
  "Sfr":"\uD835\uDD16",
  "sfr":"\uD835\uDD30",
  "sfrown":"\u2322",
  "sharp":"\u266F",
  "SHCHcy":"\u0429",
  "shchcy":"\u0449",
  "SHcy":"\u0428",
  "shcy":"\u0448",
  "ShortDownArrow":"\u2193",
  "ShortLeftArrow":"\u2190",
  "shortmid":"\u2223",
  "shortparallel":"\u2225",
  "ShortRightArrow":"\u2192",
  "ShortUpArrow":"\u2191",
  "shy":"\u00AD",
  "Sigma":"\u03A3",
  "sigma":"\u03C3",
  "sigmaf":"\u03C2",
  "sigmav":"\u03C2",
  "sim":"\u223C",
  "simdot":"\u2A6A",
  "sime":"\u2243",
  "simeq":"\u2243",
  "simg":"\u2A9E",
  "simgE":"\u2AA0",
  "siml":"\u2A9D",
  "simlE":"\u2A9F",
  "simne":"\u2246",
  "simplus":"\u2A24",
  "simrarr":"\u2972",
  "slarr":"\u2190",
  "SmallCircle":"\u2218",
  "smallsetminus":"\u2216",
  "smashp":"\u2A33",
  "smeparsl":"\u29E4",
  "smid":"\u2223",
  "smile":"\u2323",
  "smt":"\u2AAA",
  "smte":"\u2AAC",
  "smtes":"\u2AAC\uFE00",
  "SOFTcy":"\u042C",
  "softcy":"\u044C",
  "sol":"\u002F",
  "solb":"\u29C4",
  "solbar":"\u233F",
  "Sopf":"\uD835\uDD4A",
  "sopf":"\uD835\uDD64",
  "spades":"\u2660",
  "spadesuit":"\u2660",
  "spar":"\u2225",
  "sqcap":"\u2293",
  "sqcaps":"\u2293\uFE00",
  "sqcup":"\u2294",
  "sqcups":"\u2294\uFE00",
  "Sqrt":"\u221A",
  "sqsub":"\u228F",
  "sqsube":"\u2291",
  "sqsubset":"\u228F",
  "sqsubseteq":"\u2291",
  "sqsup":"\u2290",
  "sqsupe":"\u2292",
  "sqsupset":"\u2290",
  "sqsupseteq":"\u2292",
  "squ":"\u25A1",
  "Square":"\u25A1",
  "square":"\u25A1",
  "SquareIntersection":"\u2293",
  "SquareSubset":"\u228F",
  "SquareSubsetEqual":"\u2291",
  "SquareSuperset":"\u2290",
  "SquareSupersetEqual":"\u2292",
  "SquareUnion":"\u2294",
  "squarf":"\u25AA",
  "squf":"\u25AA",
  "srarr":"\u2192",
  "Sscr":"\uD835\uDCAE",
  "sscr":"\uD835\uDCC8",
  "ssetmn":"\u2216",
  "ssmile":"\u2323",
  "sstarf":"\u22C6",
  "Star":"\u22C6",
  "star":"\u2606",
  "starf":"\u2605",
  "straightepsilon":"\u03F5",
  "straightphi":"\u03D5",
  "strns":"\u00AF",
  "Sub":"\u22D0",
  "sub":"\u2282",
  "subdot":"\u2ABD",
  "subE":"\u2AC5",
  "sube":"\u2286",
  "subedot":"\u2AC3",
  "submult":"\u2AC1",
  "subnE":"\u2ACB",
  "subne":"\u228A",
  "subplus":"\u2ABF",
  "subrarr":"\u2979",
  "Subset":"\u22D0",
  "subset":"\u2282",
  "subseteq":"\u2286",
  "subseteqq":"\u2AC5",
  "SubsetEqual":"\u2286",
  "subsetneq":"\u228A",
  "subsetneqq":"\u2ACB",
  "subsim":"\u2AC7",
  "subsub":"\u2AD5",
  "subsup":"\u2AD3",
  "succ":"\u227B",
  "succapprox":"\u2AB8",
  "succcurlyeq":"\u227D",
  "Succeeds":"\u227B",
  "SucceedsEqual":"\u2AB0",
  "SucceedsSlantEqual":"\u227D",
  "SucceedsTilde":"\u227F",
  "succeq":"\u2AB0",
  "succnapprox":"\u2ABA",
  "succneqq":"\u2AB6",
  "succnsim":"\u22E9",
  "succsim":"\u227F",
  "SuchThat":"\u220B",
  "Sum":"\u2211",
  "sum":"\u2211",
  "sung":"\u266A",
  "Sup":"\u22D1",
  "sup":"\u2283",
  "sup1":"\u00B9",
  "sup2":"\u00B2",
  "sup3":"\u00B3",
  "supdot":"\u2ABE",
  "supdsub":"\u2AD8",
  "supE":"\u2AC6",
  "supe":"\u2287",
  "supedot":"\u2AC4",
  "Superset":"\u2283",
  "SupersetEqual":"\u2287",
  "suphsol":"\u27C9",
  "suphsub":"\u2AD7",
  "suplarr":"\u297B",
  "supmult":"\u2AC2",
  "supnE":"\u2ACC",
  "supne":"\u228B",
  "supplus":"\u2AC0",
  "Supset":"\u22D1",
  "supset":"\u2283",
  "supseteq":"\u2287",
  "supseteqq":"\u2AC6",
  "supsetneq":"\u228B",
  "supsetneqq":"\u2ACC",
  "supsim":"\u2AC8",
  "supsub":"\u2AD4",
  "supsup":"\u2AD6",
  "swarhk":"\u2926",
  "swArr":"\u21D9",
  "swarr":"\u2199",
  "swarrow":"\u2199",
  "swnwar":"\u292A",
  "szlig":"\u00DF",
  "Tab":"\u0009",
  "target":"\u2316",
  "Tau":"\u03A4",
  "tau":"\u03C4",
  "tbrk":"\u23B4",
  "Tcaron":"\u0164",
  "tcaron":"\u0165",
  "Tcedil":"\u0162",
  "tcedil":"\u0163",
  "Tcy":"\u0422",
  "tcy":"\u0442",
  "tdot":"\u20DB",
  "telrec":"\u2315",
  "Tfr":"\uD835\uDD17",
  "tfr":"\uD835\uDD31",
  "there4":"\u2234",
  "Therefore":"\u2234",
  "therefore":"\u2234",
  "Theta":"\u0398",
  "theta":"\u03B8",
  "thetasym":"\u03D1",
  "thetav":"\u03D1",
  "thickapprox":"\u2248",
  "thicksim":"\u223C",
  "ThickSpace":"\u205F\u200A",
  "thinsp":"\u2009",
  "ThinSpace":"\u2009",
  "thkap":"\u2248",
  "thksim":"\u223C",
  "THORN":"\u00DE",
  "thorn":"\u00FE",
  "Tilde":"\u223C",
  "tilde":"\u02DC",
  "TildeEqual":"\u2243",
  "TildeFullEqual":"\u2245",
  "TildeTilde":"\u2248",
  "times":"\u00D7",
  "timesb":"\u22A0",
  "timesbar":"\u2A31",
  "timesd":"\u2A30",
  "tint":"\u222D",
  "toea":"\u2928",
  "top":"\u22A4",
  "topbot":"\u2336",
  "topcir":"\u2AF1",
  "Topf":"\uD835\uDD4B",
  "topf":"\uD835\uDD65",
  "topfork":"\u2ADA",
  "tosa":"\u2929",
  "tprime":"\u2034",
  "TRADE":"\u2122",
  "trade":"\u2122",
  "triangle":"\u25B5",
  "triangledown":"\u25BF",
  "triangleleft":"\u25C3",
  "trianglelefteq":"\u22B4",
  "triangleq":"\u225C",
  "triangleright":"\u25B9",
  "trianglerighteq":"\u22B5",
  "tridot":"\u25EC",
  "trie":"\u225C",
  "triminus":"\u2A3A",
  "TripleDot":"\u20DB",
  "triplus":"\u2A39",
  "trisb":"\u29CD",
  "tritime":"\u2A3B",
  "trpezium":"\u23E2",
  "Tscr":"\uD835\uDCAF",
  "tscr":"\uD835\uDCC9",
  "TScy":"\u0426",
  "tscy":"\u0446",
  "TSHcy":"\u040B",
  "tshcy":"\u045B",
  "Tstrok":"\u0166",
  "tstrok":"\u0167",
  "twixt":"\u226C",
  "twoheadleftarrow":"\u219E",
  "twoheadrightarrow":"\u21A0",
  "Uacute":"\u00DA",
  "uacute":"\u00FA",
  "Uarr":"\u219F",
  "uArr":"\u21D1",
  "uarr":"\u2191",
  "Uarrocir":"\u2949",
  "Ubrcy":"\u040E",
  "ubrcy":"\u045E",
  "Ubreve":"\u016C",
  "ubreve":"\u016D",
  "Ucirc":"\u00DB",
  "ucirc":"\u00FB",
  "Ucy":"\u0423",
  "ucy":"\u0443",
  "udarr":"\u21C5",
  "Udblac":"\u0170",
  "udblac":"\u0171",
  "udhar":"\u296E",
  "ufisht":"\u297E",
  "Ufr":"\uD835\uDD18",
  "ufr":"\uD835\uDD32",
  "Ugrave":"\u00D9",
  "ugrave":"\u00F9",
  "uHar":"\u2963",
  "uharl":"\u21BF",
  "uharr":"\u21BE",
  "uhblk":"\u2580",
  "ulcorn":"\u231C",
  "ulcorner":"\u231C",
  "ulcrop":"\u230F",
  "ultri":"\u25F8",
  "Umacr":"\u016A",
  "umacr":"\u016B",
  "uml":"\u00A8",
  "UnderBar":"\u005F",
  "UnderBrace":"\u23DF",
  "UnderBracket":"\u23B5",
  "UnderParenthesis":"\u23DD",
  "Union":"\u22C3",
  "UnionPlus":"\u228E",
  "Uogon":"\u0172",
  "uogon":"\u0173",
  "Uopf":"\uD835\uDD4C",
  "uopf":"\uD835\uDD66",
  "UpArrow":"\u2191",
  "Uparrow":"\u21D1",
  "uparrow":"\u2191",
  "UpArrowBar":"\u2912",
  "UpArrowDownArrow":"\u21C5",
  "UpDownArrow":"\u2195",
  "Updownarrow":"\u21D5",
  "updownarrow":"\u2195",
  "UpEquilibrium":"\u296E",
  "upharpoonleft":"\u21BF",
  "upharpoonright":"\u21BE",
  "uplus":"\u228E",
  "UpperLeftArrow":"\u2196",
  "UpperRightArrow":"\u2197",
  "Upsi":"\u03D2",
  "upsi":"\u03C5",
  "upsih":"\u03D2",
  "Upsilon":"\u03A5",
  "upsilon":"\u03C5",
  "UpTee":"\u22A5",
  "UpTeeArrow":"\u21A5",
  "upuparrows":"\u21C8",
  "urcorn":"\u231D",
  "urcorner":"\u231D",
  "urcrop":"\u230E",
  "Uring":"\u016E",
  "uring":"\u016F",
  "urtri":"\u25F9",
  "Uscr":"\uD835\uDCB0",
  "uscr":"\uD835\uDCCA",
  "utdot":"\u22F0",
  "Utilde":"\u0168",
  "utilde":"\u0169",
  "utri":"\u25B5",
  "utrif":"\u25B4",
  "uuarr":"\u21C8",
  "Uuml":"\u00DC",
  "uuml":"\u00FC",
  "uwangle":"\u29A7",
  "vangrt":"\u299C",
  "varepsilon":"\u03F5",
  "varkappa":"\u03F0",
  "varnothing":"\u2205",
  "varphi":"\u03D5",
  "varpi":"\u03D6",
  "varpropto":"\u221D",
  "vArr":"\u21D5",
  "varr":"\u2195",
  "varrho":"\u03F1",
  "varsigma":"\u03C2",
  "varsubsetneq":"\u228A\uFE00",
  "varsubsetneqq":"\u2ACB\uFE00",
  "varsupsetneq":"\u228B\uFE00",
  "varsupsetneqq":"\u2ACC\uFE00",
  "vartheta":"\u03D1",
  "vartriangleleft":"\u22B2",
  "vartriangleright":"\u22B3",
  "Vbar":"\u2AEB",
  "vBar":"\u2AE8",
  "vBarv":"\u2AE9",
  "Vcy":"\u0412",
  "vcy":"\u0432",
  "VDash":"\u22AB",
  "Vdash":"\u22A9",
  "vDash":"\u22A8",
  "vdash":"\u22A2",
  "Vdashl":"\u2AE6",
  "Vee":"\u22C1",
  "vee":"\u2228",
  "veebar":"\u22BB",
  "veeeq":"\u225A",
  "vellip":"\u22EE",
  "Verbar":"\u2016",
  "verbar":"\u007C",
  "Vert":"\u2016",
  "vert":"\u007C",
  "VerticalBar":"\u2223",
  "VerticalLine":"\u007C",
  "VerticalSeparator":"\u2758",
  "VerticalTilde":"\u2240",
  "VeryThinSpace":"\u200A",
  "Vfr":"\uD835\uDD19",
  "vfr":"\uD835\uDD33",
  "vltri":"\u22B2",
  "vnsub":"\u2282\u20D2",
  "vnsup":"\u2283\u20D2",
  "Vopf":"\uD835\uDD4D",
  "vopf":"\uD835\uDD67",
  "vprop":"\u221D",
  "vrtri":"\u22B3",
  "Vscr":"\uD835\uDCB1",
  "vscr":"\uD835\uDCCB",
  "vsubnE":"\u2ACB\uFE00",
  "vsubne":"\u228A\uFE00",
  "vsupnE":"\u2ACC\uFE00",
  "vsupne":"\u228B\uFE00",
  "Vvdash":"\u22AA",
  "vzigzag":"\u299A",
  "Wcirc":"\u0174",
  "wcirc":"\u0175",
  "wedbar":"\u2A5F",
  "Wedge":"\u22C0",
  "wedge":"\u2227",
  "wedgeq":"\u2259",
  "weierp":"\u2118",
  "Wfr":"\uD835\uDD1A",
  "wfr":"\uD835\uDD34",
  "Wopf":"\uD835\uDD4E",
  "wopf":"\uD835\uDD68",
  "wp":"\u2118",
  "wr":"\u2240",
  "wreath":"\u2240",
  "Wscr":"\uD835\uDCB2",
  "wscr":"\uD835\uDCCC",
  "xcap":"\u22C2",
  "xcirc":"\u25EF",
  "xcup":"\u22C3",
  "xdtri":"\u25BD",
  "Xfr":"\uD835\uDD1B",
  "xfr":"\uD835\uDD35",
  "xhArr":"\u27FA",
  "xharr":"\u27F7",
  "Xi":"\u039E",
  "xi":"\u03BE",
  "xlArr":"\u27F8",
  "xlarr":"\u27F5",
  "xmap":"\u27FC",
  "xnis":"\u22FB",
  "xodot":"\u2A00",
  "Xopf":"\uD835\uDD4F",
  "xopf":"\uD835\uDD69",
  "xoplus":"\u2A01",
  "xotime":"\u2A02",
  "xrArr":"\u27F9",
  "xrarr":"\u27F6",
  "Xscr":"\uD835\uDCB3",
  "xscr":"\uD835\uDCCD",
  "xsqcup":"\u2A06",
  "xuplus":"\u2A04",
  "xutri":"\u25B3",
  "xvee":"\u22C1",
  "xwedge":"\u22C0",
  "Yacute":"\u00DD",
  "yacute":"\u00FD",
  "YAcy":"\u042F",
  "yacy":"\u044F",
  "Ycirc":"\u0176",
  "ycirc":"\u0177",
  "Ycy":"\u042B",
  "ycy":"\u044B",
  "yen":"\u00A5",
  "Yfr":"\uD835\uDD1C",
  "yfr":"\uD835\uDD36",
  "YIcy":"\u0407",
  "yicy":"\u0457",
  "Yopf":"\uD835\uDD50",
  "yopf":"\uD835\uDD6A",
  "Yscr":"\uD835\uDCB4",
  "yscr":"\uD835\uDCCE",
  "YUcy":"\u042E",
  "yucy":"\u044E",
  "Yuml":"\u0178",
  "yuml":"\u00FF",
  "Zacute":"\u0179",
  "zacute":"\u017A",
  "Zcaron":"\u017D",
  "zcaron":"\u017E",
  "Zcy":"\u0417",
  "zcy":"\u0437",
  "Zdot":"\u017B",
  "zdot":"\u017C",
  "zeetrf":"\u2128",
  "ZeroWidthSpace":"\u200B",
  "Zeta":"\u0396",
  "zeta":"\u03B6",
  "Zfr":"\u2128",
  "zfr":"\uD835\uDD37",
  "ZHcy":"\u0416",
  "zhcy":"\u0436",
  "zigrarr":"\u21DD",
  "Zopf":"\u2124",
  "zopf":"\uD835\uDD6B",
  "Zscr":"\uD835\uDCB5",
  "zscr":"\uD835\uDCCF",
  "zwj":"\u200D",
  "zwnj":"\u200C"
};

},{}],4:[function(require,module,exports){
// List of valid html blocks names, accorting to commonmark spec
// http://jgm.github.io/CommonMark/spec.html#html-blocks

'use strict';

var html_blocks = {};

[
  'article',
  'aside',
  'button',
  'blockquote',
  'body',
  'canvas',
  'caption',
  'col',
  'colgroup',
  'dd',
  'div',
  'dl',
  'dt',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'iframe',
  'li',
  'map',
  'object',
  'ol',
  'output',
  'p',
  'pre',
  'progress',
  'script',
  'section',
  'style',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'tr',
  'thead',
  'ul',
  'video'
].forEach(function (name) { html_blocks[name] = true; });


module.exports = html_blocks;

},{}],5:[function(require,module,exports){
// Regexps to match html elements

'use strict';


function replace(regex, options) {
  regex = regex.source;
  options = options || '';

  return function self(name, val) {
    if (!name) {
      return new RegExp(regex, options);
    }
    val = val.source || val;
    regex = regex.replace(name, val);
    return self;
  };
}


var attr_name     = /[a-zA-Z_:][a-zA-Z0-9:._-]*/;

var unquoted      = /[^"'=<>`\x00-\x20]+/;
var single_quoted = /'[^']*'/;
var double_quoted = /"[^"]*"/;

/*eslint no-spaced-func:0*/
var attr_value  = replace(/(?:unquoted|single_quoted|double_quoted)/)
                    ('unquoted', unquoted)
                    ('single_quoted', single_quoted)
                    ('double_quoted', double_quoted)
                    ();

var attribute   = replace(/(?:\s+attr_name(?:\s*=\s*attr_value)?)/)
                    ('attr_name', attr_name)
                    ('attr_value', attr_value)
                    ();

var open_tag    = replace(/<[A-Za-z][A-Za-z0-9]*attribute*\s*\/?>/)
                    ('attribute', attribute)
                    ();

var close_tag   = /<\/[A-Za-z][A-Za-z0-9]*\s*>/;
var comment     = /<!--([^-]+|[-][^-]+)*-->/;
var processing  = /<[?].*?[?]>/;
var declaration = /<![A-Z]+\s+[^>]*>/;
var cdata       = /<!\[CDATA\[([^\]]+|\][^\]]|\]\][^>])*\]\]>/;

var HTML_TAG_RE = replace(/^(?:open_tag|close_tag|comment|processing|declaration|cdata)/)
  ('open_tag', open_tag)
  ('close_tag', close_tag)
  ('comment', comment)
  ('processing', processing)
  ('declaration', declaration)
  ('cdata', cdata)
  ();


module.exports.HTML_TAG_RE = HTML_TAG_RE;

},{}],6:[function(require,module,exports){
// List of valid url schemas, accorting to commonmark spec
// http://jgm.github.io/CommonMark/spec.html#autolinks

'use strict';


module.exports = [
  'coap',
  'doi',
  'javascript',
  'aaa',
  'aaas',
  'about',
  'acap',
  'cap',
  'cid',
  'crid',
  'data',
  'dav',
  'dict',
  'dns',
  'file',
  'ftp',
  'geo',
  'go',
  'gopher',
  'h323',
  'http',
  'https',
  'iax',
  'icap',
  'im',
  'imap',
  'info',
  'ipp',
  'iris',
  'iris.beep',
  'iris.xpc',
  'iris.xpcs',
  'iris.lwz',
  'ldap',
  'mailto',
  'mid',
  'msrp',
  'msrps',
  'mtqp',
  'mupdate',
  'news',
  'nfs',
  'ni',
  'nih',
  'nntp',
  'opaquelocktoken',
  'pop',
  'pres',
  'rtsp',
  'service',
  'session',
  'shttp',
  'sieve',
  'sip',
  'sips',
  'sms',
  'snmp',
  'soap.beep',
  'soap.beeps',
  'tag',
  'tel',
  'telnet',
  'tftp',
  'thismessage',
  'tn3270',
  'tip',
  'tv',
  'urn',
  'vemmi',
  'ws',
  'wss',
  'xcon',
  'xcon-userid',
  'xmlrpc.beep',
  'xmlrpc.beeps',
  'xmpp',
  'z39.50r',
  'z39.50s',
  'adiumxtra',
  'afp',
  'afs',
  'aim',
  'apt',
  'attachment',
  'aw',
  'beshare',
  'bitcoin',
  'bolo',
  'callto',
  'chrome',
  'chrome-extension',
  'com-eventbrite-attendee',
  'content',
  'cvs',
  'dlna-playsingle',
  'dlna-playcontainer',
  'dtn',
  'dvb',
  'ed2k',
  'facetime',
  'feed',
  'finger',
  'fish',
  'gg',
  'git',
  'gizmoproject',
  'gtalk',
  'hcp',
  'icon',
  'ipn',
  'irc',
  'irc6',
  'ircs',
  'itms',
  'jar',
  'jms',
  'keyparc',
  'lastfm',
  'ldaps',
  'magnet',
  'maps',
  'market',
  'message',
  'mms',
  'ms-help',
  'msnim',
  'mumble',
  'mvn',
  'notes',
  'oid',
  'palm',
  'paparazzi',
  'platform',
  'proxy',
  'psyc',
  'query',
  'res',
  'resource',
  'rmi',
  'rsync',
  'rtmp',
  'secondlife',
  'sftp',
  'sgn',
  'skype',
  'smb',
  'soldat',
  'spotify',
  'ssh',
  'steam',
  'svn',
  'teamspeak',
  'things',
  'udp',
  'unreal',
  'ut2004',
  'ventrilo',
  'view-source',
  'webcal',
  'wtai',
  'wyciwyg',
  'xfire',
  'xri',
  'ymsgr'
];

},{}],7:[function(require,module,exports){
'use strict';

/**
 * Utility functions
 */

function typeOf(obj) {
  return Object.prototype.toString.call(obj);
}

function isString(obj) {
  return typeOf(obj) === '[object String]';
}

var hasOwn = Object.prototype.hasOwnProperty;

function has(object, key) {
  return object
    ? hasOwn.call(object, key)
    : false;
}

// Extend objects
//
function assign(obj /*from1, from2, from3, ...*/) {
  var sources = [].slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be object');
    }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}

////////////////////////////////////////////////////////////////////////////////

var UNESCAPE_MD_RE = /\\([\\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;

function unescapeMd(str) {
  if (str.indexOf('\\') < 0) { return str; }
  return str.replace(UNESCAPE_MD_RE, '$1');
}

////////////////////////////////////////////////////////////////////////////////

function isValidEntityCode(c) {
  /*eslint no-bitwise:0*/
  // broken sequence
  if (c >= 0xD800 && c <= 0xDFFF) { return false; }
  // never used
  if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
  if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
  // control codes
  if (c >= 0x00 && c <= 0x08) { return false; }
  if (c === 0x0B) { return false; }
  if (c >= 0x0E && c <= 0x1F) { return false; }
  if (c >= 0x7F && c <= 0x9F) { return false; }
  // out of range
  if (c > 0x10FFFF) { return false; }
  return true;
}

function fromCodePoint(c) {
  /*eslint no-bitwise:0*/
  if (c > 0xffff) {
    c -= 0x10000;
    var surrogate1 = 0xd800 + (c >> 10),
        surrogate2 = 0xdc00 + (c & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}

var NAMED_ENTITY_RE   = /&([a-z#][a-z0-9]{1,31});/gi;
var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;
var entities = require('./entities');

function replaceEntityPattern(match, name) {
  var code = 0;

  if (has(entities, name)) {
    return entities[name];
  } else if (name.charCodeAt(0) === 0x23/* # */ && DIGITAL_ENTITY_TEST_RE.test(name)) {
    code = name[1].toLowerCase() === 'x' ?
      parseInt(name.slice(2), 16)
    :
      parseInt(name.slice(1), 10);
    if (isValidEntityCode(code)) {
      return fromCodePoint(code);
    }
  }
  return match;
}

function replaceEntities(str) {
  if (str.indexOf('&') < 0) { return str; }

  return str.replace(NAMED_ENTITY_RE, replaceEntityPattern);
}

////////////////////////////////////////////////////////////////////////////////

var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}

////////////////////////////////////////////////////////////////////////////////

exports.assign            = assign;
exports.isString          = isString;
exports.has               = has;
exports.unescapeMd        = unescapeMd;
exports.isValidEntityCode = isValidEntityCode;
exports.fromCodePoint     = fromCodePoint;
exports.replaceEntities   = replaceEntities;
exports.escapeHtml        = escapeHtml;

},{"./entities":3}],8:[function(require,module,exports){
// Commonmark default options

'use strict';


module.exports = {
  options: {
    html:         true,         // Enable HTML tags in source
    xhtmlOut:     true,         // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links
    linkTarget:   '',           // set target to open link in

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if input not changed
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,

    maxNesting:   20            // Internal protection, recursion limit
  },

  components: {

    core: {
      rules: [
        'block',
        'inline',
        'references',
        'abbr2'
      ]
    },

    block: {
      rules: [
        'blockquote',
        'code',
        'fences',
        'heading',
        'hr',
        'htmlblock',
        'lheading',
        'list',
        'paragraph'
      ]
    },

    inline: {
      rules: [
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'htmltag',
        'links',
        'newline',
        'text'
      ]
    }
  }
};

},{}],9:[function(require,module,exports){
// Remarkable default options

'use strict';


module.exports = {
  options: {
    html:         false,        // Enable HTML tags in source
    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links
    linkTarget:   '',           // set target to open link in

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if input not changed
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,

    maxNesting:   20            // Internal protection, recursion limit
  },

  components: {

    core: {
      rules: [
        'block',
        'inline',
        'references',
        'replacements',
        'linkify',
        'smartquotes',
        'references',
        'abbr2',
        'footnote_tail'
      ]
    },

    block: {
      rules: [
        'blockquote',
        'code',
        'fences',
        'heading',
        'hr',
        'htmlblock',
        'lheading',
        'list',
        'paragraph',
        'table'
      ]
    },

    inline: {
      rules: [
        'autolink',
        'backticks',
        'del',
        'emphasis',
        'entity',
        'escape',
        'footnote_ref',
        'htmltag',
        'links',
        'newline',
        'text'
      ]
    }
  }
};

},{}],10:[function(require,module,exports){
// Remarkable default options

'use strict';


module.exports = {
  options: {
    html:         false,        // Enable HTML tags in source
    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links
    linkTarget:   '',           // set target to open link in

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes:       '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if input not changed
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight:     null,

    maxNesting:    20            // Internal protection, recursion limit
  },

  components: {
    // Don't restrict core/block/inline rules
    core: {},
    block: {},
    inline: {}
  }
};

},{}],11:[function(require,module,exports){
'use strict';

var replaceEntities = require('../common/utils').replaceEntities;

module.exports = function normalizeLink(url) {
  var normalized = replaceEntities(url);
  // We shouldn't care about the result of malformed URIs,
  // and should not throw an exception.
  try {
    normalized = decodeURI(normalized);
  } catch (err) {}
  return encodeURI(normalized);
};

},{"../common/utils":7}],12:[function(require,module,exports){
'use strict';

module.exports = function normalizeReference(str) {
  // use .toUpperCase() instead of .toLowerCase()
  // here to avoid a conflict with Object.prototype
  // members (most notably, `__proto__`)
  return str.trim().replace(/\s+/g, ' ').toUpperCase();
};

},{}],13:[function(require,module,exports){
'use strict';


var normalizeLink = require('./normalize_link');
var unescapeMd    = require('../common/utils').unescapeMd;

/**
 * Parse link destination
 *
 *   - on success it returns a string and updates state.pos;
 *   - on failure it returns null
 *
 * @param  {Object} state
 * @param  {Number} pos
 * @api private
 */

module.exports = function parseLinkDestination(state, pos) {
  var code, level, link,
      start = pos,
      max = state.posMax;

  if (state.src.charCodeAt(pos) === 0x3C /* < */) {
    pos++;
    while (pos < max) {
      code = state.src.charCodeAt(pos);
      if (code === 0x0A /* \n */) { return false; }
      if (code === 0x3E /* > */) {
        link = normalizeLink(unescapeMd(state.src.slice(start + 1, pos)));
        if (!state.parser.validateLink(link)) { return false; }
        state.pos = pos + 1;
        state.linkContent = link;
        return true;
      }
      if (code === 0x5C /* \ */ && pos + 1 < max) {
        pos += 2;
        continue;
      }

      pos++;
    }

    // no closing '>'
    return false;
  }

  // this should be ... } else { ... branch

  level = 0;
  while (pos < max) {
    code = state.src.charCodeAt(pos);

    if (code === 0x20) { break; }

    if (code > 0x08 && code < 0x0e) { break; }

    if (code === 0x5C /* \ */ && pos + 1 < max) {
      pos += 2;
      continue;
    }

    if (code === 0x28 /* ( */) {
      level++;
      if (level > 1) { break; }
    }

    if (code === 0x29 /* ) */) {
      level--;
      if (level < 0) { break; }
    }

    pos++;
  }

  if (start === pos) { return false; }

  link = unescapeMd(state.src.slice(start, pos));
  if (!state.parser.validateLink(link)) { return false; }

  state.linkContent = link;
  state.pos = pos;
  return true;
};

},{"../common/utils":7,"./normalize_link":11}],14:[function(require,module,exports){
'use strict';

/**
 * Parse link labels
 *
 * This function assumes that first character (`[`) already matches;
 * returns the end of the label.
 *
 * @param  {Object} state
 * @param  {Number} start
 * @api private
 */

module.exports = function parseLinkLabel(state, start) {
  var level, found, marker,
      labelEnd = -1,
      max = state.posMax,
      oldPos = state.pos,
      oldFlag = state.isInLabel;

  if (state.isInLabel) { return -1; }

  if (state.labelUnmatchedScopes) {
    state.labelUnmatchedScopes--;
    return -1;
  }

  state.pos = start + 1;
  state.isInLabel = true;
  level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 0x5B /* [ */) {
      level++;
    } else if (marker === 0x5D /* ] */) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }

    state.parser.skipToken(state);
  }

  if (found) {
    labelEnd = state.pos;
    state.labelUnmatchedScopes = 0;
  } else {
    state.labelUnmatchedScopes = level - 1;
  }

  // restore old state
  state.pos = oldPos;
  state.isInLabel = oldFlag;

  return labelEnd;
};

},{}],15:[function(require,module,exports){
'use strict';


var unescapeMd = require('../common/utils').unescapeMd;

/**
 * Parse link title
 *
 *   - on success it returns a string and updates state.pos;
 *   - on failure it returns null
 *
 * @param  {Object} state
 * @param  {Number} pos
 * @api private
 */

module.exports = function parseLinkTitle(state, pos) {
  var code,
      start = pos,
      max = state.posMax,
      marker = state.src.charCodeAt(pos);

  if (marker !== 0x22 /* " */ && marker !== 0x27 /* ' */ && marker !== 0x28 /* ( */) { return false; }

  pos++;

  // if opening marker is "(", switch it to closing marker ")"
  if (marker === 0x28) { marker = 0x29; }

  while (pos < max) {
    code = state.src.charCodeAt(pos);
    if (code === marker) {
      state.pos = pos + 1;
      state.linkContent = unescapeMd(state.src.slice(start + 1, pos));
      return true;
    }
    if (code === 0x5C /* \ */ && pos + 1 < max) {
      pos += 2;
      continue;
    }

    pos++;
  }

  return false;
};

},{"../common/utils":7}],16:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var assign       = require('./common/utils').assign;
var Renderer     = require('./renderer');
var ParserCore   = require('./parser_core');
var ParserBlock  = require('./parser_block');
var ParserInline = require('./parser_inline');
var Ruler        = require('./ruler');

/**
 * Preset configs
 */

var config = {
  'default':    require('./configs/default'),
  'full':       require('./configs/full'),
  'commonmark': require('./configs/commonmark')
};

/**
 * The `StateCore` class manages state.
 *
 * @param {Object} `instance` Remarkable instance
 * @param {String} `str` Markdown string
 * @param {Object} `env`
 */

function StateCore(instance, str, env) {
  this.src = str;
  this.env = env;
  this.options = instance.options;
  this.tokens = [];
  this.inlineMode = false;

  this.inline = instance.inline;
  this.block = instance.block;
  this.renderer = instance.renderer;
  this.typographer = instance.typographer;
}

/**
 * The main `Remarkable` class. Create an instance of
 * `Remarkable` with a `preset` and/or `options`.
 *
 * @param {String} `preset` If no preset is given, `default` is used.
 * @param {Object} `options`
 */

function Remarkable(preset, options) {
  if (typeof preset !== 'string') {
    options = preset;
    preset = 'default';
  }

  this.inline   = new ParserInline();
  this.block    = new ParserBlock();
  this.core     = new ParserCore();
  this.renderer = new Renderer();
  this.ruler    = new Ruler();

  this.options  = {};
  this.configure(config[preset]);
  this.set(options || {});
}

/**
 * Set options as an alternative to passing them
 * to the constructor.
 *
 * ```js
 * md.set({typographer: true});
 * ```
 * @param {Object} `options`
 * @api public
 */

Remarkable.prototype.set = function (options) {
  assign(this.options, options);
};

/**
 * Batch loader for components rules states, and options
 *
 * @param  {Object} `presets`
 */

Remarkable.prototype.configure = function (presets) {
  var self = this;

  if (!presets) { throw new Error('Wrong `remarkable` preset, check name/content'); }
  if (presets.options) { self.set(presets.options); }
  if (presets.components) {
    Object.keys(presets.components).forEach(function (name) {
      if (presets.components[name].rules) {
        self[name].ruler.enable(presets.components[name].rules, true);
      }
    });
  }
};

/**
 * Use a plugin.
 *
 * ```js
 * var md = new Remarkable();
 *
 * md.use(plugin1)
 *   .use(plugin2, opts)
 *   .use(plugin3);
 * ```
 *
 * @param  {Function} `plugin`
 * @param  {Object} `options`
 * @return {Object} `Remarkable` for chaining
 */

Remarkable.prototype.use = function (plugin, options) {
  plugin(this, options);
  return this;
};


/**
 * Parse the input `string` and return a tokens array.
 * Modifies `env` with definitions data.
 *
 * @param  {String} `string`
 * @param  {Object} `env`
 * @return {Array} Array of tokens
 */

Remarkable.prototype.parse = function (str, env) {
  var state = new StateCore(this, str, env);
  this.core.process(state);
  return state.tokens;
};

/**
 * The main `.render()` method that does all the magic :)
 *
 * @param  {String} `string`
 * @param  {Object} `env`
 * @return {String} Rendered HTML.
 */

Remarkable.prototype.render = function (str, env) {
  env = env || {};
  return this.renderer.render(this.parse(str, env), this.options, env);
};

/**
 * Parse the given content `string` as a single string.
 *
 * @param  {String} `string`
 * @param  {Object} `env`
 * @return {Array} Array of tokens
 */

Remarkable.prototype.parseInline = function (str, env) {
  var state = new StateCore(this, str, env);
  state.inlineMode = true;
  this.core.process(state);
  return state.tokens;
};

/**
 * Render a single content `string`, without wrapping it
 * to paragraphs
 *
 * @param  {String} `str`
 * @param  {Object} `env`
 * @return {String}
 */

Remarkable.prototype.renderInline = function (str, env) {
  env = env || {};
  return this.renderer.render(this.parseInline(str, env), this.options, env);
};

/**
 * Expose `Remarkable`
 */

module.exports = Remarkable;

/**
 * Expose `utils`, Useful helper functions for custom
 * rendering.
 */

module.exports.utils = require('./common/utils');

},{"./common/utils":7,"./configs/commonmark":8,"./configs/default":9,"./configs/full":10,"./parser_block":17,"./parser_core":18,"./parser_inline":19,"./renderer":20,"./ruler":21}],17:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var Ruler      = require('./ruler');
var StateBlock = require('./rules_block/state_block');

/**
 * Parser rules
 */

var _rules = [
  [ 'code',       require('./rules_block/code') ],
  [ 'fences',     require('./rules_block/fences'),     [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'blockquote', require('./rules_block/blockquote'), [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'hr',         require('./rules_block/hr'),         [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'list',       require('./rules_block/list'),       [ 'paragraph', 'blockquote' ] ],
  [ 'footnote',   require('./rules_block/footnote'),   [ 'paragraph' ] ],
  [ 'heading',    require('./rules_block/heading'),    [ 'paragraph', 'blockquote' ] ],
  [ 'lheading',   require('./rules_block/lheading') ],
  [ 'htmlblock',  require('./rules_block/htmlblock'),  [ 'paragraph', 'blockquote' ] ],
  [ 'table',      require('./rules_block/table'),      [ 'paragraph' ] ],
  [ 'deflist',    require('./rules_block/deflist'),    [ 'paragraph' ] ],
  [ 'paragraph',  require('./rules_block/paragraph') ]
];

/**
 * Block Parser class
 *
 * @api private
 */

function ParserBlock() {
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1], {
      alt: (_rules[i][2] || []).slice()
    });
  }
}

/**
 * Generate tokens for the given input range.
 *
 * @param  {Object} `state` Has properties like `src`, `parser`, `options` etc
 * @param  {Number} `startLine`
 * @param  {Number} `endLine`
 * @api private
 */

ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var line = startLine;
  var hasEmptyLines = false;
  var ok, i;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);
    if (line >= endLine) {
      break;
    }

    // Termination condition for nested calls.
    // Nested calls currently used for blockquotes & lists
    if (state.tShift[line] < state.blkIndent) {
      break;
    }

    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.line`
    // - update `state.tokens`
    // - return true

    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);
      if (ok) {
        break;
      }
    }

    // set state.tight iff we had an empty line before current tag
    // i.e. latest empty line should not count
    state.tight = !hasEmptyLines;

    // paragraph might "eat" one newline after it in nested lists
    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;

      // two empty lines should stop the parser in list mode
      if (line < endLine && state.parentType === 'list' && state.isEmpty(line)) { break; }
      state.line = line;
    }
  }
};

var TABS_SCAN_RE = /[\n\t]/g;
var NEWLINES_RE  = /\r[\n\u0085]|[\u2424\u2028\u0085]/g;
var SPACES_RE    = /\u00a0/g;

/**
 * Tokenize the given `str`.
 *
 * @param  {String} `str` Source string
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @param  {Array} `outTokens`
 * @api private
 */

ParserBlock.prototype.parse = function (str, options, env, outTokens) {
  var state, lineStart = 0, lastTabPos = 0;
  if (!str) { return []; }

  // Normalize spaces
  str = str.replace(SPACES_RE, ' ');

  // Normalize newlines
  str = str.replace(NEWLINES_RE, '\n');

  // Replace tabs with proper number of spaces (1..4)
  if (str.indexOf('\t') >= 0) {
    str = str.replace(TABS_SCAN_RE, function (match, offset) {
      var result;
      if (str.charCodeAt(offset) === 0x0A) {
        lineStart = offset + 1;
        lastTabPos = 0;
        return match;
      }
      result = '    '.slice((offset - lineStart - lastTabPos) % 4);
      lastTabPos = offset - lineStart + 1;
      return result;
    });
  }

  state = new StateBlock(str, this, options, env, outTokens);
  this.tokenize(state, state.line, state.lineMax);
};

/**
 * Expose `ParserBlock`
 */

module.exports = ParserBlock;

},{"./ruler":21,"./rules_block/blockquote":23,"./rules_block/code":24,"./rules_block/deflist":25,"./rules_block/fences":26,"./rules_block/footnote":27,"./rules_block/heading":28,"./rules_block/hr":29,"./rules_block/htmlblock":30,"./rules_block/lheading":31,"./rules_block/list":32,"./rules_block/paragraph":33,"./rules_block/state_block":34,"./rules_block/table":35}],18:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var Ruler = require('./ruler');

/**
 * Core parser `rules`
 */

var _rules = [
  [ 'block',          require('./rules_core/block')          ],
  [ 'abbr',           require('./rules_core/abbr')           ],
  [ 'references',     require('./rules_core/references')     ],
  [ 'inline',         require('./rules_core/inline')         ],
  [ 'footnote_tail',  require('./rules_core/footnote_tail')  ],
  [ 'abbr2',          require('./rules_core/abbr2')          ],
  [ 'replacements',   require('./rules_core/replacements')   ],
  [ 'smartquotes',    require('./rules_core/smartquotes')    ],
  [ 'linkify',        require('./rules_core/linkify')        ]
];

/**
 * Class for top level (`core`) parser rules
 *
 * @api private
 */

function Core() {
  this.options = {};
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}

/**
 * Process rules with the given `state`
 *
 * @param  {Object} `state`
 * @api private
 */

Core.prototype.process = function (state) {
  var i, l, rules;
  rules = this.ruler.getRules('');
  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

/**
 * Expose `Core`
 */

module.exports = Core;

},{"./ruler":21,"./rules_core/abbr":36,"./rules_core/abbr2":37,"./rules_core/block":38,"./rules_core/footnote_tail":39,"./rules_core/inline":40,"./rules_core/linkify":41,"./rules_core/references":42,"./rules_core/replacements":43,"./rules_core/smartquotes":44}],19:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var Ruler       = require('./ruler');
var StateInline = require('./rules_inline/state_inline');
var utils       = require('./common/utils');

/**
 * Inline Parser `rules`
 */

var _rules = [
  [ 'text',            require('./rules_inline/text') ],
  [ 'newline',         require('./rules_inline/newline') ],
  [ 'escape',          require('./rules_inline/escape') ],
  [ 'backticks',       require('./rules_inline/backticks') ],
  [ 'del',             require('./rules_inline/del') ],
  [ 'ins',             require('./rules_inline/ins') ],
  [ 'mark',            require('./rules_inline/mark') ],
  [ 'emphasis',        require('./rules_inline/emphasis') ],
  [ 'sub',             require('./rules_inline/sub') ],
  [ 'sup',             require('./rules_inline/sup') ],
  [ 'links',           require('./rules_inline/links') ],
  [ 'footnote_inline', require('./rules_inline/footnote_inline') ],
  [ 'footnote_ref',    require('./rules_inline/footnote_ref') ],
  [ 'autolink',        require('./rules_inline/autolink') ],
  [ 'htmltag',         require('./rules_inline/htmltag') ],
  [ 'entity',          require('./rules_inline/entity') ]
];

/**
 * Inline Parser class. Note that link validation is stricter
 * in Remarkable than what is specified by CommonMark. If you
 * want to change this you can use a custom validator.
 *
 * @api private
 */

function ParserInline() {
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }

  // Can be overridden with a custom validator
  this.validateLink = validateLink;
}

/**
 * Skip a single token by running all rules in validation mode.
 * Returns `true` if any rule reports success.
 *
 * @param  {Object} `state`
 * @api privage
 */

ParserInline.prototype.skipToken = function (state) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var pos = state.pos;
  var i, cached_pos;

  if ((cached_pos = state.cacheGet(pos)) > 0) {
    state.pos = cached_pos;
    return;
  }

  for (i = 0; i < len; i++) {
    if (rules[i](state, true)) {
      state.cacheSet(pos, state.pos);
      return;
    }
  }

  state.pos++;
  state.cacheSet(pos, state.pos);
};

/**
 * Generate tokens for the given input range.
 *
 * @param  {Object} `state`
 * @api private
 */

ParserInline.prototype.tokenize = function (state) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var end = state.posMax;
  var ok, i;

  while (state.pos < end) {

    // Try all possible rules.
    // On success, the rule should:
    //
    // - update `state.pos`
    // - update `state.tokens`
    // - return true
    for (i = 0; i < len; i++) {
      ok = rules[i](state, false);

      if (ok) {
        break;
      }
    }

    if (ok) {
      if (state.pos >= end) { break; }
      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};

/**
 * Parse the given input string.
 *
 * @param  {String} `str`
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @param  {Array} `outTokens`
 * @api private
 */

ParserInline.prototype.parse = function (str, options, env, outTokens) {
  var state = new StateInline(str, this, options, env, outTokens);
  this.tokenize(state);
};

/**
 * Validate the given `url` by checking for bad protocols.
 *
 * @param  {String} `url`
 * @return {Boolean}
 */

function validateLink(url) {
  var BAD_PROTOCOLS = [ 'vbscript', 'javascript', 'file' ];
  var str = url.trim().toLowerCase();
  // Care about digital entities "javascript&#x3A;alert(1)"
  str = utils.replaceEntities(str);
  if (str.indexOf(':') !== -1 && BAD_PROTOCOLS.indexOf(str.split(':')[0]) !== -1) {
    return false;
  }
  return true;
}

/**
 * Expose `ParserInline`
 */

module.exports = ParserInline;

},{"./common/utils":7,"./ruler":21,"./rules_inline/autolink":45,"./rules_inline/backticks":46,"./rules_inline/del":47,"./rules_inline/emphasis":48,"./rules_inline/entity":49,"./rules_inline/escape":50,"./rules_inline/footnote_inline":51,"./rules_inline/footnote_ref":52,"./rules_inline/htmltag":53,"./rules_inline/ins":54,"./rules_inline/links":55,"./rules_inline/mark":56,"./rules_inline/newline":57,"./rules_inline/state_inline":58,"./rules_inline/sub":59,"./rules_inline/sup":60,"./rules_inline/text":61}],20:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var utils = require('./common/utils');
var rules = require('./rules');

/**
 * Expose `Renderer`
 */

module.exports = Renderer;

/**
 * Renderer class. Renders HTML and exposes `rules` to allow
 * local modifications.
 */

function Renderer() {
  this.rules = utils.assign({}, rules);

  // exported helper, for custom rules only
  this.getBreak = rules.getBreak;
}

/**
 * Render a string of inline HTML with the given `tokens` and
 * `options`.
 *
 * @param  {Array} `tokens`
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @return {String}
 * @api public
 */

Renderer.prototype.renderInline = function (tokens, options, env) {
  var _rules = this.rules;
  var len = tokens.length, i = 0;
  var result = '';

  while (len--) {
    result += _rules[tokens[i].type](tokens, i++, options, env, this);
  }

  return result;
};

/**
 * Render a string of HTML with the given `tokens` and
 * `options`.
 *
 * @param  {Array} `tokens`
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @return {String}
 * @api public
 */

Renderer.prototype.render = function (tokens, options, env) {
  var _rules = this.rules;
  var len = tokens.length, i = -1;
  var result = '';

  while (++i < len) {
    if (tokens[i].type === 'inline') {
      result += this.renderInline(tokens[i].children, options, env);
    } else {
      result += _rules[tokens[i].type](tokens, i, options, env, this);
    }
  }
  return result;
};

},{"./common/utils":7,"./rules":22}],21:[function(require,module,exports){
'use strict';

/**
 * Ruler is a helper class for building responsibility chains from
 * parse rules. It allows:
 *
 *   - easy stack rules chains
 *   - getting main chain and named chains content (as arrays of functions)
 *
 * Helper methods, should not be used directly.
 * @api private
 */

function Ruler() {
  // List of added rules. Each element is:
  //
  // { name: XXX,
  //   enabled: Boolean,
  //   fn: Function(),
  //   alt: [ name2, name3 ] }
  //
  this.__rules__ = [];

  // Cached rule chains.
  //
  // First level - chain name, '' for default.
  // Second level - digital anchor for fast filtering by charcodes.
  //
  this.__cache__ = null;
}

/**
 * Find the index of a rule by `name`.
 *
 * @param  {String} `name`
 * @return {Number} Index of the given `name`
 * @api private
 */

Ruler.prototype.__find__ = function (name) {
  var len = this.__rules__.length;
  var i = -1;

  while (len--) {
    if (this.__rules__[++i].name === name) {
      return i;
    }
  }
  return -1;
};

/**
 * Build the rules lookup cache
 *
 * @api private
 */

Ruler.prototype.__compile__ = function () {
  var self = this;
  var chains = [ '' ];

  // collect unique names
  self.__rules__.forEach(function (rule) {
    if (!rule.enabled) {
      return;
    }

    rule.alt.forEach(function (altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });

  self.__cache__ = {};

  chains.forEach(function (chain) {
    self.__cache__[chain] = [];
    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) {
        return;
      }

      if (chain && rule.alt.indexOf(chain) < 0) {
        return;
      }
      self.__cache__[chain].push(rule.fn);
    });
  });
};

/**
 * Ruler public methods
 * ------------------------------------------------
 */

/**
 * Replace rule function
 *
 * @param  {String} `name` Rule name
 * @param  {Function `fn`
 * @param  {Object} `options`
 * @api private
 */

Ruler.prototype.at = function (name, fn, options) {
  var idx = this.__find__(name);
  var opt = options || {};

  if (idx === -1) {
    throw new Error('Parser rule not found: ' + name);
  }

  this.__rules__[idx].fn = fn;
  this.__rules__[idx].alt = opt.alt || [];
  this.__cache__ = null;
};

/**
 * Add a rule to the chain before given the `ruleName`.
 *
 * @param  {String}   `beforeName`
 * @param  {String}   `ruleName`
 * @param  {Function} `fn`
 * @param  {Object}   `options`
 * @api private
 */

Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
  var idx = this.__find__(beforeName);
  var opt = options || {};

  if (idx === -1) {
    throw new Error('Parser rule not found: ' + beforeName);
  }

  this.__rules__.splice(idx, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};

/**
 * Add a rule to the chain after the given `ruleName`.
 *
 * @param  {String}   `afterName`
 * @param  {String}   `ruleName`
 * @param  {Function} `fn`
 * @param  {Object}   `options`
 * @api private
 */

Ruler.prototype.after = function (afterName, ruleName, fn, options) {
  var idx = this.__find__(afterName);
  var opt = options || {};

  if (idx === -1) {
    throw new Error('Parser rule not found: ' + afterName);
  }

  this.__rules__.splice(idx + 1, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};

/**
 * Add a rule to the end of chain.
 *
 * @param  {String}   `ruleName`
 * @param  {Function} `fn`
 * @param  {Object}   `options`
 * @return {String}
 */

Ruler.prototype.push = function (ruleName, fn, options) {
  var opt = options || {};

  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};

/**
 * Enable a rule or list of rules.
 *
 * @param  {String|Array} `list` Name or array of rule names to enable
 * @param  {Boolean} `strict` If `true`, all non listed rules will be disabled.
 * @api private
 */

Ruler.prototype.enable = function (list, strict) {
  list = !Array.isArray(list)
    ? [ list ]
    : list;

  // In strict mode disable all existing rules first
  if (strict) {
    this.__rules__.forEach(function (rule) {
      rule.enabled = false;
    });
  }

  // Search by name and enable
  list.forEach(function (name) {
    var idx = this.__find__(name);
    if (idx < 0) {
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = true;
  }, this);

  this.__cache__ = null;
};


/**
 * Disable a rule or list of rules.
 *
 * @param  {String|Array} `list` Name or array of rule names to disable
 * @api private
 */

Ruler.prototype.disable = function (list) {
  list = !Array.isArray(list)
    ? [ list ]
    : list;

  // Search by name and disable
  list.forEach(function (name) {
    var idx = this.__find__(name);
    if (idx < 0) {
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = false;
  }, this);

  this.__cache__ = null;
};

/**
 * Get a rules list as an array of functions.
 *
 * @param  {String} `chainName`
 * @return {Object}
 * @api private
 */

Ruler.prototype.getRules = function (chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  }
  return this.__cache__[chainName];
};

/**
 * Expose `Ruler`
 */

module.exports = Ruler;

},{}],22:[function(require,module,exports){
'use strict';

/**
 * Local dependencies
 */

var has             = require('./common/utils').has;
var unescapeMd      = require('./common/utils').unescapeMd;
var replaceEntities = require('./common/utils').replaceEntities;
var escapeHtml      = require('./common/utils').escapeHtml;

/**
 * Renderer rules cache
 */

var rules = {};

/**
 * Blockquotes
 */

rules.blockquote_open = function (/* tokens, idx, options, env */) {
  return '<blockquote>\n';
};

rules.blockquote_close = function (tokens, idx /*, options, env */) {
  return '</blockquote>' + getBreak(tokens, idx);
};

/**
 * Code
 */

rules.code = function (tokens, idx /*, options, env */) {
  if (tokens[idx].block) {
    return '<pre><code>' + escapeHtml(tokens[idx].content) + '</code></pre>' + getBreak(tokens, idx);
  }
  return '<code>' + escapeHtml(tokens[idx].content) + '</code>';
};

/**
 * Fenced code blocks
 */

rules.fence = function (tokens, idx, options, env, instance) {
  var token = tokens[idx];
  var langClass = '';
  var langPrefix = options.langPrefix;
  var langName = '', fenceName;
  var highlighted;

  if (token.params) {

    //
    // ```foo bar
    //
    // Try custom renderer "foo" first. That will simplify overwrite
    // for diagrams, latex, and any other fenced block with custom look
    //

    fenceName = token.params.split(/\s+/g)[0];

    if (has(instance.rules.fence_custom, fenceName)) {
      return instance.rules.fence_custom[fenceName](tokens, idx, options, env, instance);
    }

    langName = escapeHtml(replaceEntities(unescapeMd(fenceName)));
    langClass = ' class="' + langPrefix + langName + '"';
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  return '<pre><code' + langClass + '>'
        + highlighted
        + '</code></pre>'
        + getBreak(tokens, idx);
};

rules.fence_custom = {};

/**
 * Headings
 */

rules.heading_open = function (tokens, idx /*, options, env */) {
  return '<h' + tokens[idx].hLevel + '>';
};
rules.heading_close = function (tokens, idx /*, options, env */) {
  return '</h' + tokens[idx].hLevel + '>\n';
};

/**
 * Horizontal rules
 */

rules.hr = function (tokens, idx, options /*, env */) {
  return (options.xhtmlOut ? '<hr />' : '<hr>') + getBreak(tokens, idx);
};

/**
 * Bullets
 */

rules.bullet_list_open = function (/* tokens, idx, options, env */) {
  return '<ul>\n';
};
rules.bullet_list_close = function (tokens, idx /*, options, env */) {
  return '</ul>' + getBreak(tokens, idx);
};

/**
 * List items
 */

rules.list_item_open = function (/* tokens, idx, options, env */) {
  return '<li>';
};
rules.list_item_close = function (/* tokens, idx, options, env */) {
  return '</li>\n';
};

/**
 * Ordered list items
 */

rules.ordered_list_open = function (tokens, idx /*, options, env */) {
  var token = tokens[idx];
  var order = token.order > 1 ? ' start="' + token.order + '"' : '';
  return '<ol' + order + '>\n';
};
rules.ordered_list_close = function (tokens, idx /*, options, env */) {
  return '</ol>' + getBreak(tokens, idx);
};

/**
 * Paragraphs
 */

rules.paragraph_open = function (tokens, idx /*, options, env */) {
  return tokens[idx].tight ? '' : '<p>';
};
rules.paragraph_close = function (tokens, idx /*, options, env */) {
  var addBreak = !(tokens[idx].tight && idx && tokens[idx - 1].type === 'inline' && !tokens[idx - 1].content);
  return (tokens[idx].tight ? '' : '</p>') + (addBreak ? getBreak(tokens, idx) : '');
};

/**
 * Links
 */

rules.link_open = function (tokens, idx, options /* env */) {
  var title = tokens[idx].title ? (' title="' + escapeHtml(replaceEntities(tokens[idx].title)) + '"') : '';
  var target = options.linkTarget ? (' target="' + options.linkTarget + '"') : '';
  return '<a href="' + escapeHtml(tokens[idx].href) + '"' + title + target + '>';
};
rules.link_close = function (/* tokens, idx, options, env */) {
  return '</a>';
};

/**
 * Images
 */

rules.image = function (tokens, idx, options /*, env */) {
  var src = ' src="' + escapeHtml(tokens[idx].src) + '"';
  var title = tokens[idx].title ? (' title="' + escapeHtml(replaceEntities(tokens[idx].title)) + '"') : '';
  var alt = ' alt="' + (tokens[idx].alt ? escapeHtml(replaceEntities(tokens[idx].alt)) : '') + '"';
  var suffix = options.xhtmlOut ? ' /' : '';
  return '<img' + src + alt + title + suffix + '>';
};

/**
 * Tables
 */

rules.table_open = function (/* tokens, idx, options, env */) {
  return '<table>\n';
};
rules.table_close = function (/* tokens, idx, options, env */) {
  return '</table>\n';
};
rules.thead_open = function (/* tokens, idx, options, env */) {
  return '<thead>\n';
};
rules.thead_close = function (/* tokens, idx, options, env */) {
  return '</thead>\n';
};
rules.tbody_open = function (/* tokens, idx, options, env */) {
  return '<tbody>\n';
};
rules.tbody_close = function (/* tokens, idx, options, env */) {
  return '</tbody>\n';
};
rules.tr_open = function (/* tokens, idx, options, env */) {
  return '<tr>';
};
rules.tr_close = function (/* tokens, idx, options, env */) {
  return '</tr>\n';
};
rules.th_open = function (tokens, idx /*, options, env */) {
  var token = tokens[idx];
  return '<th'
    + (token.align ? ' style="text-align:' + token.align + '"' : '')
    + '>';
};
rules.th_close = function (/* tokens, idx, options, env */) {
  return '</th>';
};
rules.td_open = function (tokens, idx /*, options, env */) {
  var token = tokens[idx];
  return '<td'
    + (token.align ? ' style="text-align:' + token.align + '"' : '')
    + '>';
};
rules.td_close = function (/* tokens, idx, options, env */) {
  return '</td>';
};

/**
 * Bold
 */

rules.strong_open = function (/* tokens, idx, options, env */) {
  return '<strong>';
};
rules.strong_close = function (/* tokens, idx, options, env */) {
  return '</strong>';
};

/**
 * Italicize
 */

rules.em_open = function (/* tokens, idx, options, env */) {
  return '<em>';
};
rules.em_close = function (/* tokens, idx, options, env */) {
  return '</em>';
};

/**
 * Strikethrough
 */

rules.del_open = function (/* tokens, idx, options, env */) {
  return '<del>';
};
rules.del_close = function (/* tokens, idx, options, env */) {
  return '</del>';
};

/**
 * Insert
 */

rules.ins_open = function (/* tokens, idx, options, env */) {
  return '<ins>';
};
rules.ins_close = function (/* tokens, idx, options, env */) {
  return '</ins>';
};

/**
 * Highlight
 */

rules.mark_open = function (/* tokens, idx, options, env */) {
  return '<mark>';
};
rules.mark_close = function (/* tokens, idx, options, env */) {
  return '</mark>';
};

/**
 * Super- and sub-script
 */

rules.sub = function (tokens, idx /*, options, env */) {
  return '<sub>' + escapeHtml(tokens[idx].content) + '</sub>';
};
rules.sup = function (tokens, idx /*, options, env */) {
  return '<sup>' + escapeHtml(tokens[idx].content) + '</sup>';
};

/**
 * Breaks
 */

rules.hardbreak = function (tokens, idx, options /*, env */) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
};
rules.softbreak = function (tokens, idx, options /*, env */) {
  return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
};

/**
 * Text
 */

rules.text = function (tokens, idx /*, options, env */) {
  return escapeHtml(tokens[idx].content);
};

/**
 * Content
 */

rules.htmlblock = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};
rules.htmltag = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};

/**
 * Abbreviations, initialism
 */

rules.abbr_open = function (tokens, idx /*, options, env */) {
  return '<abbr title="' + escapeHtml(replaceEntities(tokens[idx].title)) + '">';
};
rules.abbr_close = function (/* tokens, idx, options, env */) {
  return '</abbr>';
};

/**
 * Footnotes
 */

rules.footnote_ref = function (tokens, idx) {
  var n = Number(tokens[idx].id + 1).toString();
  var id = 'fnref' + n;
  if (tokens[idx].subId > 0) {
    id += ':' + tokens[idx].subId;
  }
  return '<sup class="footnote-ref"><a href="#fn' + n + '" id="' + id + '">[' + n + ']</a></sup>';
};
rules.footnote_block_open = function (tokens, idx, options) {
  var hr = options.xhtmlOut
    ? '<hr class="footnotes-sep" />\n'
    : '<hr class="footnotes-sep">\n';
  return  hr + '<section class="footnotes">\n<ol class="footnotes-list">\n';
};
rules.footnote_block_close = function () {
  return '</ol>\n</section>\n';
};
rules.footnote_open = function (tokens, idx) {
  var id = Number(tokens[idx].id + 1).toString();
  return '<li id="fn' + id + '"  class="footnote-item">';
};
rules.footnote_close = function () {
  return '</li>\n';
};
rules.footnote_anchor = function (tokens, idx) {
  var n = Number(tokens[idx].id + 1).toString();
  var id = 'fnref' + n;
  if (tokens[idx].subId > 0) {
    id += ':' + tokens[idx].subId;
  }
  return ' <a href="#' + id + '" class="footnote-backref">↩</a>';
};

/**
 * Definition lists
 */

rules.dl_open = function() {
  return '<dl>\n';
};
rules.dt_open = function() {
  return '<dt>';
};
rules.dd_open = function() {
  return '<dd>';
};
rules.dl_close = function() {
  return '</dl>\n';
};
rules.dt_close = function() {
  return '</dt>\n';
};
rules.dd_close = function() {
  return '</dd>\n';
};

/**
 * Helper functions
 */

function nextToken(tokens, idx) {
  if (++idx >= tokens.length - 2) {
    return idx;
  }
  if ((tokens[idx].type === 'paragraph_open' && tokens[idx].tight) &&
      (tokens[idx + 1].type === 'inline' && tokens[idx + 1].content.length === 0) &&
      (tokens[idx + 2].type === 'paragraph_close' && tokens[idx + 2].tight)) {
    return nextToken(tokens, idx + 2);
  }
  return idx;
}

/**
 * Check to see if `\n` is needed before the next token.
 *
 * @param  {Array} `tokens`
 * @param  {Number} `idx`
 * @return {String} Empty string or newline
 * @api private
 */

var getBreak = rules.getBreak = function getBreak(tokens, idx) {
  idx = nextToken(tokens, idx);
  if (idx < tokens.length && tokens[idx].type === 'list_item_close') {
    return '';
  }
  return '\n';
};

/**
 * Expose `rules`
 */

module.exports = rules;

},{"./common/utils":7}],23:[function(require,module,exports){
// Block quotes

'use strict';


module.exports = function blockquote(state, startLine, endLine, silent) {
  var nextLine, lastLineEmpty, oldTShift, oldBMarks, oldIndent, oldParentType, lines,
      terminatorRules,
      i, l, terminate,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  if (pos > max) { return false; }

  // check the block quote marker
  if (state.src.charCodeAt(pos++) !== 0x3E/* > */) { return false; }

  if (state.level >= state.options.maxNesting) { return false; }

  // we know that it's going to be a valid blockquote,
  // so no point trying to find the end of it in silent mode
  if (silent) { return true; }

  // skip one optional space after '>'
  if (state.src.charCodeAt(pos) === 0x20) { pos++; }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;

  oldBMarks = [ state.bMarks[startLine] ];
  state.bMarks[startLine] = pos;

  // check if we have an empty blockquote
  pos = pos < max ? state.skipSpaces(pos) : pos;
  lastLineEmpty = pos >= max;

  oldTShift = [ state.tShift[startLine] ];
  state.tShift[startLine] = pos - state.bMarks[startLine];

  terminatorRules = state.parser.ruler.getRules('blockquote');

  // Search the end of the block
  //
  // Block ends with either:
  //  1. an empty line outside:
  //     ```
  //     > test
  //
  //     ```
  //  2. an empty line inside:
  //     ```
  //     >
  //     test
  //     ```
  //  3. another tag
  //     ```
  //     > test
  //      - - -
  //     ```
  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      // Case 1: line is not inside the blockquote, and this line is empty.
      break;
    }

    if (state.src.charCodeAt(pos++) === 0x3E/* > */) {
      // This line is inside the blockquote.

      // skip one optional space after '>'
      if (state.src.charCodeAt(pos) === 0x20) { pos++; }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      pos = pos < max ? state.skipSpaces(pos) : pos;
      lastLineEmpty = pos >= max;

      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }

    // Case 2: line is not inside the blockquote, and the last line was empty.
    if (lastLineEmpty) { break; }

    // Case 3: another tag found.
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }

    oldBMarks.push(state.bMarks[nextLine]);
    oldTShift.push(state.tShift[nextLine]);

    // A negative number means that this is a paragraph continuation;
    //
    // Any negative number will do the job here, but it's better for it
    // to be large enough to make any bugs obvious.
    state.tShift[nextLine] = -1337;
  }

  oldParentType = state.parentType;
  state.parentType = 'blockquote';
  state.tokens.push({
    type: 'blockquote_open',
    lines: lines = [ startLine, 0 ],
    level: state.level++
  });
  state.parser.tokenize(state, startLine, nextLine);
  state.tokens.push({
    type: 'blockquote_close',
    level: --state.level
  });
  state.parentType = oldParentType;
  lines[1] = state.line;

  // Restore original tShift; this might not be necessary since the parser
  // has already been here, but just to make sure we can do that.
  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
  }
  state.blkIndent = oldIndent;

  return true;
};

},{}],24:[function(require,module,exports){
// Code block (4 spaces padded)

'use strict';


module.exports = function code(state, startLine, endLine/*, silent*/) {
  var nextLine, last;

  if (state.tShift[startLine] - state.blkIndent < 4) { return false; }

  last = nextLine = startLine + 1;

  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }
    if (state.tShift[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }
    break;
  }

  state.line = nextLine;
  state.tokens.push({
    type: 'code',
    content: state.getLines(startLine, last, 4 + state.blkIndent, true),
    block: true,
    lines: [ startLine, state.line ],
    level: state.level
  });

  return true;
};

},{}],25:[function(require,module,exports){
// Definition lists

'use strict';


// Search `[:~][\n ]`, returns next pos after marker on success
// or -1 on fail.
function skipMarker(state, line) {
  var pos, marker,
      start = state.bMarks[line] + state.tShift[line],
      max = state.eMarks[line];

  if (start >= max) { return -1; }

  // Check bullet
  marker = state.src.charCodeAt(start++);
  if (marker !== 0x7E/* ~ */ && marker !== 0x3A/* : */) { return -1; }

  pos = state.skipSpaces(start);

  // require space after ":"
  if (start === pos) { return -1; }

  // no empty definitions, e.g. "  : "
  if (pos >= max) { return -1; }

  return pos;
}

function markTightParagraphs(state, idx) {
  var i, l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].tight = true;
      state.tokens[i].tight = true;
      i += 2;
    }
  }
}

module.exports = function deflist(state, startLine, endLine, silent) {
  var contentStart,
      ddLine,
      dtLine,
      itemLines,
      listLines,
      listTokIdx,
      nextLine,
      oldIndent,
      oldDDIndent,
      oldParentType,
      oldTShift,
      oldTight,
      prevEmptyEnd,
      tight;

  if (silent) {
    // quirk: validation mode validates a dd block only, not a whole deflist
    if (state.ddIndent < 0) { return false; }
    return skipMarker(state, startLine) >= 0;
  }

  nextLine = startLine + 1;
  if (state.isEmpty(nextLine)) {
    if (++nextLine > endLine) { return false; }
  }

  if (state.tShift[nextLine] < state.blkIndent) { return false; }
  contentStart = skipMarker(state, nextLine);
  if (contentStart < 0) { return false; }

  if (state.level >= state.options.maxNesting) { return false; }

  // Start list
  listTokIdx = state.tokens.length;

  state.tokens.push({
    type: 'dl_open',
    lines: listLines = [ startLine, 0 ],
    level: state.level++
  });

  //
  // Iterate list items
  //

  dtLine = startLine;
  ddLine = nextLine;

  // One definition list can contain multiple DTs,
  // and one DT can be followed by multiple DDs.
  //
  // Thus, there is two loops here, and label is
  // needed to break out of the second one
  //
  /*eslint no-labels:0,block-scoped-var:0*/
  OUTER:
  for (;;) {
    tight = true;
    prevEmptyEnd = false;

    state.tokens.push({
      type: 'dt_open',
      lines: [ dtLine, dtLine ],
      level: state.level++
    });
    state.tokens.push({
      type: 'inline',
      content: state.getLines(dtLine, dtLine + 1, state.blkIndent, false).trim(),
      level: state.level + 1,
      lines: [ dtLine, dtLine ],
      children: []
    });
    state.tokens.push({
      type: 'dt_close',
      level: --state.level
    });

    for (;;) {
      state.tokens.push({
        type: 'dd_open',
        lines: itemLines = [ nextLine, 0 ],
        level: state.level++
      });

      oldTight = state.tight;
      oldDDIndent = state.ddIndent;
      oldIndent = state.blkIndent;
      oldTShift = state.tShift[ddLine];
      oldParentType = state.parentType;
      state.blkIndent = state.ddIndent = state.tShift[ddLine] + 2;
      state.tShift[ddLine] = contentStart - state.bMarks[ddLine];
      state.tight = true;
      state.parentType = 'deflist';

      state.parser.tokenize(state, ddLine, endLine, true);

      // If any of list item is tight, mark list as tight
      if (!state.tight || prevEmptyEnd) {
        tight = false;
      }
      // Item become loose if finish with empty line,
      // but we should filter last element, because it means list finish
      prevEmptyEnd = (state.line - ddLine) > 1 && state.isEmpty(state.line - 1);

      state.tShift[ddLine] = oldTShift;
      state.tight = oldTight;
      state.parentType = oldParentType;
      state.blkIndent = oldIndent;
      state.ddIndent = oldDDIndent;

      state.tokens.push({
        type: 'dd_close',
        level: --state.level
      });

      itemLines[1] = nextLine = state.line;

      if (nextLine >= endLine) { break OUTER; }

      if (state.tShift[nextLine] < state.blkIndent) { break OUTER; }
      contentStart = skipMarker(state, nextLine);
      if (contentStart < 0) { break; }

      ddLine = nextLine;

      // go to the next loop iteration:
      // insert DD tag and repeat checking
    }

    if (nextLine >= endLine) { break; }
    dtLine = nextLine;

    if (state.isEmpty(dtLine)) { break; }
    if (state.tShift[dtLine] < state.blkIndent) { break; }

    ddLine = dtLine + 1;
    if (ddLine >= endLine) { break; }
    if (state.isEmpty(ddLine)) { ddLine++; }
    if (ddLine >= endLine) { break; }

    if (state.tShift[ddLine] < state.blkIndent) { break; }
    contentStart = skipMarker(state, ddLine);
    if (contentStart < 0) { break; }

    // go to the next loop iteration:
    // insert DT and DD tags and repeat checking
  }

  // Finilize list
  state.tokens.push({
    type: 'dl_close',
    level: --state.level
  });
  listLines[1] = nextLine;

  state.line = nextLine;

  // mark paragraphs tight if needed
  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

},{}],26:[function(require,module,exports){
// fences (``` lang, ~~~ lang)

'use strict';


module.exports = function fences(state, startLine, endLine, silent) {
  var marker, len, params, nextLine, mem,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  if (pos + 3 > max) { return false; }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x7E/* ~ */ && marker !== 0x60 /* ` */) {
    return false;
  }

  // scan marker length
  mem = pos;
  pos = state.skipChars(pos, marker);

  len = pos - mem;

  if (len < 3) { return false; }

  params = state.src.slice(pos, max).trim();

  if (params.indexOf('`') >= 0) { return false; }

  // Since start is found, we can report success here in validation mode
  if (silent) { return true; }

  // search end of block
  nextLine = startLine;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.tShift[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      // - ```
      //  test
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) { continue; }

    if (state.tShift[nextLine] - state.blkIndent >= 4) {
      // closing fence should be indented less than 4 spaces
      continue;
    }

    pos = state.skipChars(pos, marker);

    // closing code fence must be at least as long as the opening one
    if (pos - mem < len) { continue; }

    // make sure tail has spaces only
    pos = state.skipSpaces(pos);

    if (pos < max) { continue; }

    haveEndMarker = true;
    // found!
    break;
  }

  // If a fence has heading spaces, they should be removed from its inner block
  len = state.tShift[startLine];

  state.line = nextLine + (haveEndMarker ? 1 : 0);
  state.tokens.push({
    type: 'fence',
    params: params,
    content: state.getLines(startLine + 1, nextLine, len, true),
    lines: [ startLine, state.line ],
    level: state.level
  });

  return true;
};

},{}],27:[function(require,module,exports){
// Process footnote reference list

'use strict';


module.exports = function footnote(state, startLine, endLine, silent) {
  var oldBMark, oldTShift, oldParentType, pos, label,
      start = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // line should be at least 5 chars - "[^x]:"
  if (start + 4 > max) { return false; }

  if (state.src.charCodeAt(start) !== 0x5B/* [ */) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x5E/* ^ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  for (pos = start + 2; pos < max; pos++) {
    if (state.src.charCodeAt(pos) === 0x20) { return false; }
    if (state.src.charCodeAt(pos) === 0x5D /* ] */) {
      break;
    }
  }

  if (pos === start + 2) { return false; } // no empty footnote labels
  if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3A /* : */) { return false; }
  if (silent) { return true; }
  pos++;

  if (!state.env.footnotes) { state.env.footnotes = {}; }
  if (!state.env.footnotes.refs) { state.env.footnotes.refs = {}; }
  label = state.src.slice(start + 2, pos - 2);
  state.env.footnotes.refs[':' + label] = -1;

  state.tokens.push({
    type: 'footnote_reference_open',
    label: label,
    level: state.level++
  });

  oldBMark = state.bMarks[startLine];
  oldTShift = state.tShift[startLine];
  oldParentType = state.parentType;
  state.tShift[startLine] = state.skipSpaces(pos) - pos;
  state.bMarks[startLine] = pos;
  state.blkIndent += 4;
  state.parentType = 'footnote';

  if (state.tShift[startLine] < state.blkIndent) {
    state.tShift[startLine] += state.blkIndent;
    state.bMarks[startLine] -= state.blkIndent;
  }

  state.parser.tokenize(state, startLine, endLine, true);

  state.parentType = oldParentType;
  state.blkIndent -= 4;
  state.tShift[startLine] = oldTShift;
  state.bMarks[startLine] = oldBMark;

  state.tokens.push({
    type: 'footnote_reference_close',
    level: --state.level
  });

  return true;
};

},{}],28:[function(require,module,exports){
// heading (#, ##, ...)

'use strict';


module.exports = function heading(state, startLine, endLine, silent) {
  var ch, level, tmp,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  if (pos >= max) { return false; }

  ch  = state.src.charCodeAt(pos);

  if (ch !== 0x23/* # */ || pos >= max) { return false; }

  // count heading level
  level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23/* # */ && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || (pos < max && ch !== 0x20/* space */)) { return false; }

  if (silent) { return true; }

  // Let's cut tails like '    ###  ' from the end of string

  max = state.skipCharsBack(max, 0x20, pos); // space
  tmp = state.skipCharsBack(max, 0x23, pos); // #
  if (tmp > pos && state.src.charCodeAt(tmp - 1) === 0x20/* space */) {
    max = tmp;
  }

  state.line = startLine + 1;

  state.tokens.push({ type: 'heading_open',
    hLevel: level,
    lines: [ startLine, state.line ],
    level: state.level
  });

  // only if header is not empty
  if (pos < max) {
    state.tokens.push({
      type: 'inline',
      content: state.src.slice(pos, max).trim(),
      level: state.level + 1,
      lines: [ startLine, state.line ],
      children: []
    });
  }
  state.tokens.push({ type: 'heading_close', hLevel: level, level: state.level });

  return true;
};

},{}],29:[function(require,module,exports){
// Horizontal rule

'use strict';


module.exports = function hr(state, startLine, endLine, silent) {
  var marker, cnt, ch,
      pos = state.bMarks[startLine],
      max = state.eMarks[startLine];

  pos += state.tShift[startLine];

  if (pos > max) { return false; }

  marker = state.src.charCodeAt(pos++);

  // Check hr marker
  if (marker !== 0x2A/* * */ &&
      marker !== 0x2D/* - */ &&
      marker !== 0x5F/* _ */) {
    return false;
  }

  // markers can be mixed with spaces, but there should be at least 3 one

  cnt = 1;
  while (pos < max) {
    ch = state.src.charCodeAt(pos++);
    if (ch !== marker && ch !== 0x20/* space */) { return false; }
    if (ch === marker) { cnt++; }
  }

  if (cnt < 3) { return false; }

  if (silent) { return true; }

  state.line = startLine + 1;
  state.tokens.push({
    type: 'hr',
    lines: [ startLine, state.line ],
    level: state.level
  });

  return true;
};

},{}],30:[function(require,module,exports){
// HTML block

'use strict';


var block_names = require('../common/html_blocks');


var HTML_TAG_OPEN_RE = /^<([a-zA-Z]{1,15})[\s\/>]/;
var HTML_TAG_CLOSE_RE = /^<\/([a-zA-Z]{1,15})[\s>]/;

function isLetter(ch) {
  /*eslint no-bitwise:0*/
  var lc = ch | 0x20; // to lower case
  return (lc >= 0x61/* a */) && (lc <= 0x7a/* z */);
}

module.exports = function htmlblock(state, startLine, endLine, silent) {
  var ch, match, nextLine,
      pos = state.bMarks[startLine],
      max = state.eMarks[startLine],
      shift = state.tShift[startLine];

  pos += shift;

  if (!state.options.html) { return false; }

  if (shift > 3 || pos + 2 >= max) { return false; }

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  ch = state.src.charCodeAt(pos + 1);

  if (ch === 0x21/* ! */ || ch === 0x3F/* ? */) {
    // Directive start / comment start / processing instruction start
    if (silent) { return true; }

  } else if (ch === 0x2F/* / */ || isLetter(ch)) {

    // Probably start or end of tag
    if (ch === 0x2F/* \ */) {
      // closing tag
      match = state.src.slice(pos, max).match(HTML_TAG_CLOSE_RE);
      if (!match) { return false; }
    } else {
      // opening tag
      match = state.src.slice(pos, max).match(HTML_TAG_OPEN_RE);
      if (!match) { return false; }
    }
    // Make sure tag name is valid
    if (block_names[match[1].toLowerCase()] !== true) { return false; }
    if (silent) { return true; }

  } else {
    return false;
  }

  // If we are here - we detected HTML block.
  // Let's roll down till empty line (block end).
  nextLine = startLine + 1;
  while (nextLine < state.lineMax && !state.isEmpty(nextLine)) {
    nextLine++;
  }

  state.line = nextLine;
  state.tokens.push({
    type: 'htmlblock',
    level: state.level,
    lines: [ startLine, state.line ],
    content: state.getLines(startLine, nextLine, 0, true)
  });

  return true;
};

},{"../common/html_blocks":4}],31:[function(require,module,exports){
// lheading (---, ===)

'use strict';


module.exports = function lheading(state, startLine, endLine/*, silent*/) {
  var marker, pos, max,
      next = startLine + 1;

  if (next >= endLine) { return false; }
  if (state.tShift[next] < state.blkIndent) { return false; }

  // Scan next line

  if (state.tShift[next] - state.blkIndent > 3) { return false; }

  pos = state.bMarks[next] + state.tShift[next];
  max = state.eMarks[next];

  if (pos >= max) { return false; }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x2D/* - */ && marker !== 0x3D/* = */) { return false; }

  pos = state.skipChars(pos, marker);

  pos = state.skipSpaces(pos);

  if (pos < max) { return false; }

  pos = state.bMarks[startLine] + state.tShift[startLine];

  state.line = next + 1;
  state.tokens.push({
    type: 'heading_open',
    hLevel: marker === 0x3D/* = */ ? 1 : 2,
    lines: [ startLine, state.line ],
    level: state.level
  });
  state.tokens.push({
    type: 'inline',
    content: state.src.slice(pos, state.eMarks[startLine]).trim(),
    level: state.level + 1,
    lines: [ startLine, state.line - 1 ],
    children: []
  });
  state.tokens.push({
    type: 'heading_close',
    hLevel: marker === 0x3D/* = */ ? 1 : 2,
    level: state.level
  });

  return true;
};

},{}],32:[function(require,module,exports){
// Lists

'use strict';


// Search `[-+*][\n ]`, returns next pos arter marker on success
// or -1 on fail.
function skipBulletListMarker(state, startLine) {
  var marker, pos, max;

  pos = state.bMarks[startLine] + state.tShift[startLine];
  max = state.eMarks[startLine];

  if (pos >= max) { return -1; }

  marker = state.src.charCodeAt(pos++);
  // Check bullet
  if (marker !== 0x2A/* * */ &&
      marker !== 0x2D/* - */ &&
      marker !== 0x2B/* + */) {
    return -1;
  }

  if (pos < max && state.src.charCodeAt(pos) !== 0x20) {
    // " 1.test " - is not a list item
    return -1;
  }

  return pos;
}

// Search `\d+[.)][\n ]`, returns next pos arter marker on success
// or -1 on fail.
function skipOrderedListMarker(state, startLine) {
  var ch,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  if (pos + 1 >= max) { return -1; }

  ch = state.src.charCodeAt(pos++);

  if (ch < 0x30/* 0 */ || ch > 0x39/* 9 */) { return -1; }

  for (;;) {
    // EOL -> fail
    if (pos >= max) { return -1; }

    ch = state.src.charCodeAt(pos++);

    if (ch >= 0x30/* 0 */ && ch <= 0x39/* 9 */) {
      continue;
    }

    // found valid marker
    if (ch === 0x29/* ) */ || ch === 0x2e/* . */) {
      break;
    }

    return -1;
  }


  if (pos < max && state.src.charCodeAt(pos) !== 0x20/* space */) {
    // " 1.test " - is not a list item
    return -1;
  }
  return pos;
}

function markTightParagraphs(state, idx) {
  var i, l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].tight = true;
      state.tokens[i].tight = true;
      i += 2;
    }
  }
}


module.exports = function list(state, startLine, endLine, silent) {
  var nextLine,
      indent,
      oldTShift,
      oldIndent,
      oldTight,
      oldParentType,
      start,
      posAfterMarker,
      max,
      indentAfterMarker,
      markerValue,
      markerCharCode,
      isOrdered,
      contentStart,
      listTokIdx,
      prevEmptyEnd,
      listLines,
      itemLines,
      tight = true,
      terminatorRules,
      i, l, terminate;

  // Detect list type and position after marker
  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
    isOrdered = true;
  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
    isOrdered = false;
  } else {
    return false;
  }

  if (state.level >= state.options.maxNesting) { return false; }

  // We should terminate list on style change. Remember first one to compare.
  markerCharCode = state.src.charCodeAt(posAfterMarker - 1);

  // For validation mode we can terminate immediately
  if (silent) { return true; }

  // Start list
  listTokIdx = state.tokens.length;

  if (isOrdered) {
    start = state.bMarks[startLine] + state.tShift[startLine];
    markerValue = Number(state.src.substr(start, posAfterMarker - start - 1));

    state.tokens.push({
      type: 'ordered_list_open',
      order: markerValue,
      lines: listLines = [ startLine, 0 ],
      level: state.level++
    });

  } else {
    state.tokens.push({
      type: 'bullet_list_open',
      lines: listLines = [ startLine, 0 ],
      level: state.level++
    });
  }

  //
  // Iterate list items
  //

  nextLine = startLine;
  prevEmptyEnd = false;
  terminatorRules = state.parser.ruler.getRules('list');

  while (nextLine < endLine) {
    contentStart = state.skipSpaces(posAfterMarker);
    max = state.eMarks[nextLine];

    if (contentStart >= max) {
      // trimming space in "-    \n  3" case, indent is 1 here
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = contentStart - posAfterMarker;
    }

    // If we have more than 4 spaces, the indent is 1
    // (the rest is just indented code block)
    if (indentAfterMarker > 4) { indentAfterMarker = 1; }

    // If indent is less than 1, assume that it's one, example:
    //  "-\n  test"
    if (indentAfterMarker < 1) { indentAfterMarker = 1; }

    // "  -  test"
    //  ^^^^^ - calculating total length of this thing
    indent = (posAfterMarker - state.bMarks[nextLine]) + indentAfterMarker;

    // Run subparser & write tokens
    state.tokens.push({
      type: 'list_item_open',
      lines: itemLines = [ startLine, 0 ],
      level: state.level++
    });

    oldIndent = state.blkIndent;
    oldTight = state.tight;
    oldTShift = state.tShift[startLine];
    oldParentType = state.parentType;
    state.tShift[startLine] = contentStart - state.bMarks[startLine];
    state.blkIndent = indent;
    state.tight = true;
    state.parentType = 'list';

    state.parser.tokenize(state, startLine, endLine, true);

    // If any of list item is tight, mark list as tight
    if (!state.tight || prevEmptyEnd) {
      tight = false;
    }
    // Item become loose if finish with empty line,
    // but we should filter last element, because it means list finish
    prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

    state.blkIndent = oldIndent;
    state.tShift[startLine] = oldTShift;
    state.tight = oldTight;
    state.parentType = oldParentType;

    state.tokens.push({
      type: 'list_item_close',
      level: --state.level
    });

    nextLine = startLine = state.line;
    itemLines[1] = nextLine;
    contentStart = state.bMarks[startLine];

    if (nextLine >= endLine) { break; }

    if (state.isEmpty(nextLine)) {
      break;
    }

    //
    // Try to check if list is terminated or continued.
    //
    if (state.tShift[nextLine] < state.blkIndent) { break; }

    // fail if terminating block found
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }

    // fail if list has another type
    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    }

    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) { break; }
  }

  // Finilize list
  state.tokens.push({
    type: isOrdered ? 'ordered_list_close' : 'bullet_list_close',
    level: --state.level
  });
  listLines[1] = nextLine;

  state.line = nextLine;

  // mark paragraphs tight if needed
  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

},{}],33:[function(require,module,exports){
// Paragraph

'use strict';


module.exports = function paragraph(state, startLine/*, endLine*/) {
  var endLine, content, terminate, i, l,
      nextLine = startLine + 1,
      terminatorRules;

  endLine = state.lineMax;

  // jump line-by-line until empty one or EOF
  if (nextLine < endLine && !state.isEmpty(nextLine)) {
    terminatorRules = state.parser.ruler.getRules('paragraph');

    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      // this would be a code block normally, but after paragraph
      // it's considered a lazy continuation regardless of what's there
      if (state.tShift[nextLine] - state.blkIndent > 3) { continue; }

      // Some tags can terminate paragraph without empty line.
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) { break; }
    }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

  state.line = nextLine;
  if (content.length) {
    state.tokens.push({
      type: 'paragraph_open',
      tight: false,
      lines: [ startLine, state.line ],
      level: state.level
    });
    state.tokens.push({
      type: 'inline',
      content: content,
      level: state.level + 1,
      lines: [ startLine, state.line ],
      children: []
    });
    state.tokens.push({
      type: 'paragraph_close',
      tight: false,
      level: state.level
    });
  }

  return true;
};

},{}],34:[function(require,module,exports){
// Parser state class

'use strict';


function StateBlock(src, parser, options, env, tokens) {
  var ch, s, start, pos, len, indent, indent_found;

  this.src = src;

  // Shortcuts to simplify nested calls
  this.parser = parser;

  this.options = options;

  this.env = env;

  //
  // Internal state vartiables
  //

  this.tokens = tokens;

  this.bMarks = [];  // line begin offsets for fast jumps
  this.eMarks = [];  // line end offsets for fast jumps
  this.tShift = [];  // indent for each line

  // block parser variables
  this.blkIndent  = 0; // required block content indent
                       // (for example, if we are in list)
  this.line       = 0; // line index in src
  this.lineMax    = 0; // lines count
  this.tight      = false;  // loose/tight mode for lists
  this.parentType = 'root'; // if `list`, block parser stops on two newlines
  this.ddIndent   = -1; // indent of the current dd block (-1 if there isn't any)

  this.level = 0;

  // renderer
  this.result = '';

  // Create caches
  // Generate markers.
  s = this.src;
  indent = 0;
  indent_found = false;

  for (start = pos = indent = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    if (!indent_found) {
      if (ch === 0x20/* space */) {
        indent++;
        continue;
      } else {
        indent_found = true;
      }
    }

    if (ch === 0x0A || pos === len - 1) {
      if (ch !== 0x0A) { pos++; }
      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent);

      indent_found = false;
      indent = 0;
      start = pos + 1;
    }
  }

  // Push fake entry to simplify cache bounds checks
  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);

  this.lineMax = this.bMarks.length - 1; // don't count last fake line
}

StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};

StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (var max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }
  return from;
};

// Skip spaces from given position.
StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== 0x20/* space */) { break; }
  }
  return pos;
};

// Skip char codes from given position
StateBlock.prototype.skipChars = function skipChars(pos, code) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code) { break; }
  }
  return pos;
};

// Skip char codes reverse from given position - 1
StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (code !== this.src.charCodeAt(--pos)) { return pos + 1; }
  }
  return pos;
};

// cut lines range from source.
StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
  var i, first, last, queue, shift,
      line = begin;

  if (begin >= end) {
    return '';
  }

  // Opt: don't use push queue for single line;
  if (line + 1 === end) {
    first = this.bMarks[line] + Math.min(this.tShift[line], indent);
    last = keepLastLF ? this.eMarks[line] + 1 : this.eMarks[line];
    return this.src.slice(first, last);
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    shift = this.tShift[line];
    if (shift > indent) { shift = indent; }
    if (shift < 0) { shift = 0; }

    first = this.bMarks[line] + shift;

    if (line + 1 < end || keepLastLF) {
      // No need for bounds check because we have fake entry on tail.
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }

    queue[i] = this.src.slice(first, last);
  }

  return queue.join('');
};


module.exports = StateBlock;

},{}],35:[function(require,module,exports){
// GFM table, non-standard

'use strict';


function getLine(state, line) {
  var pos = state.bMarks[line] + state.blkIndent,
      max = state.eMarks[line];

  return state.src.substr(pos, max - pos);
}


module.exports = function table(state, startLine, endLine, silent) {
  var ch, lineText, pos, i, nextLine, rows,
      aligns, t, tableLines, tbodyLines;

  // should have at least three lines
  if (startLine + 2 > endLine) { return false; }

  nextLine = startLine + 1;

  if (state.tShift[nextLine] < state.blkIndent) { return false; }

  // first character of the second line should be '|' or '-'

  pos = state.bMarks[nextLine] + state.tShift[nextLine];
  if (pos >= state.eMarks[nextLine]) { return false; }

  ch = state.src.charCodeAt(pos);
  if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */) { return false; }

  lineText = getLine(state, startLine + 1);
  if (!/^[-:| ]+$/.test(lineText)) { return false; }

  rows = lineText.split('|');
  if (rows <= 2) { return false; }
  aligns = [];
  for (i = 0; i < rows.length; i++) {
    t = rows[i].trim();
    if (!t) {
      // allow empty columns before and after table, but not in between columns;
      // e.g. allow ` |---| `, disallow ` ---||--- `
      if (i === 0 || i === rows.length - 1) {
        continue;
      } else {
        return false;
      }
    }

    if (!/^:?-+:?$/.test(t)) { return false; }
    if (t.charCodeAt(t.length - 1) === 0x3A/* : */) {
      aligns.push(t.charCodeAt(0) === 0x3A/* : */ ? 'center' : 'right');
    } else if (t.charCodeAt(0) === 0x3A/* : */) {
      aligns.push('left');
    } else {
      aligns.push('');
    }
  }

  lineText = getLine(state, startLine).trim();
  if (lineText.indexOf('|') === -1) { return false; }
  rows = lineText.replace(/^\||\|$/g, '').split('|');
  if (aligns.length !== rows.length) { return false; }
  if (silent) { return true; }

  state.tokens.push({
    type: 'table_open',
    lines: tableLines = [ startLine, 0 ],
    level: state.level++
  });
  state.tokens.push({
    type: 'thead_open',
    lines: [ startLine, startLine + 1 ],
    level: state.level++
  });

  state.tokens.push({
    type: 'tr_open',
    lines: [ startLine, startLine + 1 ],
    level: state.level++
  });
  for (i = 0; i < rows.length; i++) {
    state.tokens.push({
      type: 'th_open',
      align: aligns[i],
      lines: [ startLine, startLine + 1 ],
      level: state.level++
    });
    state.tokens.push({
      type: 'inline',
      content: rows[i].trim(),
      lines: [ startLine, startLine + 1 ],
      level: state.level,
      children: []
    });
    state.tokens.push({ type: 'th_close', level: --state.level });
  }
  state.tokens.push({ type: 'tr_close', level: --state.level });
  state.tokens.push({ type: 'thead_close', level: --state.level });

  state.tokens.push({
    type: 'tbody_open',
    lines: tbodyLines = [ startLine + 2, 0 ],
    level: state.level++
  });

  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.tShift[nextLine] < state.blkIndent) { break; }

    lineText = getLine(state, nextLine).trim();
    if (lineText.indexOf('|') === -1) { break; }
    rows = lineText.replace(/^\||\|$/g, '').split('|');

    state.tokens.push({ type: 'tr_open', level: state.level++ });
    for (i = 0; i < rows.length; i++) {
      state.tokens.push({ type: 'td_open', align: aligns[i], level: state.level++ });
      state.tokens.push({
        type: 'inline',
        content: rows[i].replace(/^\|? *| *\|?$/g, ''),
        level: state.level,
        children: []
      });
      state.tokens.push({ type: 'td_close', level: --state.level });
    }
    state.tokens.push({ type: 'tr_close', level: --state.level });
  }
  state.tokens.push({ type: 'tbody_close', level: --state.level });
  state.tokens.push({ type: 'table_close', level: --state.level });

  tableLines[1] = tbodyLines[1] = nextLine;
  state.line = nextLine;
  return true;
};

},{}],36:[function(require,module,exports){
// Parse abbreviation definitions, i.e. `*[abbr]: description`
//

'use strict';


var StateInline    = require('../rules_inline/state_inline');
var parseLinkLabel = require('../helpers/parse_link_label');


function parseAbbr(str, parserInline, options, env) {
  var state, labelEnd, pos, max, label, title;

  if (str.charCodeAt(0) !== 0x2A/* * */) { return -1; }
  if (str.charCodeAt(1) !== 0x5B/* [ */) { return -1; }

  if (str.indexOf(']:') === -1) { return -1; }

  state = new StateInline(str, parserInline, options, env, []);
  labelEnd = parseLinkLabel(state, 1);

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A/* : */) { return -1; }

  max = state.posMax;

  // abbr title is always one line, so looking for ending "\n" here
  for (pos = labelEnd + 2; pos < max; pos++) {
    if (state.src.charCodeAt(pos) === 0x0A) { break; }
  }

  label = str.slice(2, labelEnd);
  title = str.slice(labelEnd + 2, pos).trim();
  if (title.length === 0) { return -1; }
  if (!env.abbreviations) { env.abbreviations = {}; }
  // prepend ':' to avoid conflict with Object.prototype members
  if (typeof env.abbreviations[':' + label] === 'undefined') {
    env.abbreviations[':' + label] = title;
  }

  return pos;
}

module.exports = function abbr(state) {
  var tokens = state.tokens, i, l, content, pos;

  if (state.inlineMode) {
    return;
  }

  // Parse inlines
  for (i = 1, l = tokens.length - 1; i < l; i++) {
    if (tokens[i - 1].type === 'paragraph_open' &&
        tokens[i].type === 'inline' &&
        tokens[i + 1].type === 'paragraph_close') {

      content = tokens[i].content;
      while (content.length) {
        pos = parseAbbr(content, state.inline, state.options, state.env);
        if (pos < 0) { break; }
        content = content.slice(pos).trim();
      }

      tokens[i].content = content;
      if (!content.length) {
        tokens[i - 1].tight = true;
        tokens[i + 1].tight = true;
      }
    }
  }
};

},{"../helpers/parse_link_label":14,"../rules_inline/state_inline":58}],37:[function(require,module,exports){
// Enclose abbreviations in <abbr> tags
//
'use strict';


var PUNCT_CHARS = ' \n()[]\'".,!?-';


// from Google closure library
// http://closure-library.googlecode.com/git-history/docs/local_closure_goog_string_string.js.source.html#line1021
function regEscape(s) {
  return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1');
}


module.exports = function abbr2(state) {
  var i, j, l, tokens, token, text, nodes, pos, level, reg, m, regText,
      blockTokens = state.tokens;

  if (!state.env.abbreviations) { return; }
  if (!state.env.abbrRegExp) {
    regText = '(^|[' + PUNCT_CHARS.split('').map(regEscape).join('') + '])'
            + '(' + Object.keys(state.env.abbreviations).map(function (x) {
                      return x.substr(1);
                    }).sort(function (a, b) {
                      return b.length - a.length;
                    }).map(regEscape).join('|') + ')'
            + '($|[' + PUNCT_CHARS.split('').map(regEscape).join('') + '])';
    state.env.abbrRegExp = new RegExp(regText, 'g');
  }
  reg = state.env.abbrRegExp;

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline') { continue; }
    tokens = blockTokens[j].children;

    // We scan from the end, to keep position when new tags added.
    for (i = tokens.length - 1; i >= 0; i--) {
      token = tokens[i];
      if (token.type !== 'text') { continue; }

      pos = 0;
      text = token.content;
      reg.lastIndex = 0;
      level = token.level;
      nodes = [];

      while ((m = reg.exec(text))) {
        if (reg.lastIndex > pos) {
          nodes.push({
            type: 'text',
            content: text.slice(pos, m.index + m[1].length),
            level: level
          });
        }

        nodes.push({
          type: 'abbr_open',
          title: state.env.abbreviations[':' + m[2]],
          level: level++
        });
        nodes.push({
          type: 'text',
          content: m[2],
          level: level
        });
        nodes.push({
          type: 'abbr_close',
          level: --level
        });
        pos = reg.lastIndex - m[3].length;
      }

      if (!nodes.length) { continue; }

      if (pos < text.length) {
        nodes.push({
          type: 'text',
          content: text.slice(pos),
          level: level
        });
      }

      // replace current node
      blockTokens[j].children = tokens = [].concat(tokens.slice(0, i), nodes, tokens.slice(i + 1));
    }
  }
};

},{}],38:[function(require,module,exports){
'use strict';

module.exports = function block(state) {

  if (state.inlineMode) {
    state.tokens.push({
      type: 'inline',
      content: state.src.replace(/\n/g, ' ').trim(),
      level: 0,
      lines: [ 0, 1 ],
      children: []
    });

  } else {
    state.block.parse(state.src, state.options, state.env, state.tokens);
  }
};

},{}],39:[function(require,module,exports){
'use strict';


module.exports = function footnote_block(state) {
  var i, l, j, t, lastParagraph, list, tokens, current, currentLabel,
      level = 0,
      insideRef = false,
      refTokens = {};

  if (!state.env.footnotes) { return; }

  state.tokens = state.tokens.filter(function(tok) {
    if (tok.type === 'footnote_reference_open') {
      insideRef = true;
      current = [];
      currentLabel = tok.label;
      return false;
    }
    if (tok.type === 'footnote_reference_close') {
      insideRef = false;
      // prepend ':' to avoid conflict with Object.prototype members
      refTokens[':' + currentLabel] = current;
      return false;
    }
    if (insideRef) { current.push(tok); }
    return !insideRef;
  });

  if (!state.env.footnotes.list) { return; }
  list = state.env.footnotes.list;

  state.tokens.push({
    type: 'footnote_block_open',
    level: level++
  });
  for (i = 0, l = list.length; i < l; i++) {
    state.tokens.push({
      type: 'footnote_open',
      id: i,
      level: level++
    });

    if (list[i].tokens) {
      tokens = [];
      tokens.push({
        type: 'paragraph_open',
        tight: false,
        level: level++
      });
      tokens.push({
        type: 'inline',
        content: '',
        level: level,
        children: list[i].tokens
      });
      tokens.push({
        type: 'paragraph_close',
        tight: false,
        level: --level
      });
    } else if (list[i].label) {
      tokens = refTokens[':' + list[i].label];
    }

    state.tokens = state.tokens.concat(tokens);
    if (state.tokens[state.tokens.length - 1].type === 'paragraph_close') {
      lastParagraph = state.tokens.pop();
    } else {
      lastParagraph = null;
    }

    t = list[i].count > 0 ? list[i].count : 1;
    for (j = 0; j < t; j++) {
      state.tokens.push({
        type: 'footnote_anchor',
        id: i,
        subId: j,
        level: level
      });
    }

    if (lastParagraph) {
      state.tokens.push(lastParagraph);
    }

    state.tokens.push({
      type: 'footnote_close',
      level: --level
    });
  }
  state.tokens.push({
    type: 'footnote_block_close',
    level: --level
  });
};

},{}],40:[function(require,module,exports){
'use strict';

module.exports = function inline(state) {
  var tokens = state.tokens, tok, i, l;

  // Parse inlines
  for (i = 0, l = tokens.length; i < l; i++) {
    tok = tokens[i];
    if (tok.type === 'inline') {
      state.inline.parse(tok.content, state.options, state.env, tok.children);
    }
  }
};

},{}],41:[function(require,module,exports){
// Replace link-like texts with link nodes.
//
// Currently restricted by `inline.validateLink()` to http/https/ftp
//
'use strict';


var Autolinker = require('autolinker');


var LINK_SCAN_RE = /www|@|\:\/\//;


function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}

// Stupid fabric to avoid singletons, for thread safety.
// Required for engines like Nashorn.
//
function createLinkifier() {
  var links = [];
  var autolinker = new Autolinker({
    stripPrefix: false,
    url: true,
    email: true,
    twitter: false,
    replaceFn: function (linker, match) {
      // Only collect matched strings but don't change anything.
      switch (match.getType()) {
        /*eslint default-case:0*/
        case 'url':
          links.push({
            text: match.matchedText,
            url: match.getUrl()
          });
          break;
        case 'email':
          links.push({
            text: match.matchedText,
            // normalize email protocol
            url: 'mailto:' + match.getEmail().replace(/^mailto:/i, '')
          });
          break;
      }
      return false;
    }
  });

  return {
    links: links,
    autolinker: autolinker
  };
}


module.exports = function linkify(state) {
  var i, j, l, tokens, token, text, nodes, ln, pos, level, htmlLinkLevel,
      blockTokens = state.tokens,
      linkifier = null, links, autolinker;

  if (!state.options.linkify) { return; }

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline') { continue; }
    tokens = blockTokens[j].children;

    htmlLinkLevel = 0;

    // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match
    for (i = tokens.length - 1; i >= 0; i--) {
      token = tokens[i];

      // Skip content of markdown links
      if (token.type === 'link_close') {
        i--;
        while (tokens[i].level !== token.level && tokens[i].type !== 'link_open') {
          i--;
        }
        continue;
      }

      // Skip content of html tag links
      if (token.type === 'htmltag') {
        if (isLinkOpen(token.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }
        if (isLinkClose(token.content)) {
          htmlLinkLevel++;
        }
      }
      if (htmlLinkLevel > 0) { continue; }

      if (token.type === 'text' && LINK_SCAN_RE.test(token.content)) {

        // Init linkifier in lazy manner, only if required.
        if (!linkifier) {
          linkifier = createLinkifier();
          links = linkifier.links;
          autolinker = linkifier.autolinker;
        }

        text = token.content;
        links.length = 0;
        autolinker.link(text);

        if (!links.length) { continue; }

        // Now split string to nodes
        nodes = [];
        level = token.level;

        for (ln = 0; ln < links.length; ln++) {

          if (!state.inline.validateLink(links[ln].url)) { continue; }

          pos = text.indexOf(links[ln].text);

          if (pos) {
            level = level;
            nodes.push({
              type: 'text',
              content: text.slice(0, pos),
              level: level
            });
          }
          nodes.push({
            type: 'link_open',
            href: links[ln].url,
            title: '',
            level: level++
          });
          nodes.push({
            type: 'text',
            content: links[ln].text,
            level: level
          });
          nodes.push({
            type: 'link_close',
            level: --level
          });
          text = text.slice(pos + links[ln].text.length);
        }
        if (text.length) {
          nodes.push({
            type: 'text',
            content: text,
            level: level
          });
        }

        // replace current node
        blockTokens[j].children = tokens = [].concat(tokens.slice(0, i), nodes, tokens.slice(i + 1));
      }
    }
  }
};

},{"autolinker":1}],42:[function(require,module,exports){
'use strict';


var StateInline          = require('../rules_inline/state_inline');
var parseLinkLabel       = require('../helpers/parse_link_label');
var parseLinkDestination = require('../helpers/parse_link_destination');
var parseLinkTitle       = require('../helpers/parse_link_title');
var normalizeReference   = require('../helpers/normalize_reference');


function parseReference(str, parser, options, env) {
  var state, labelEnd, pos, max, code, start, href, title, label;

  if (str.charCodeAt(0) !== 0x5B/* [ */) { return -1; }

  if (str.indexOf(']:') === -1) { return -1; }

  state = new StateInline(str, parser, options, env, []);
  labelEnd = parseLinkLabel(state, 0);

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A/* : */) { return -1; }

  max = state.posMax;

  // [label]:   destination   'title'
  //         ^^^ skip optional whitespace here
  for (pos = labelEnd + 2; pos < max; pos++) {
    code = state.src.charCodeAt(pos);
    if (code !== 0x20 && code !== 0x0A) { break; }
  }

  // [label]:   destination   'title'
  //            ^^^^^^^^^^^ parse this
  if (!parseLinkDestination(state, pos)) { return -1; }
  href = state.linkContent;
  pos = state.pos;

  // [label]:   destination   'title'
  //                       ^^^ skipping those spaces
  start = pos;
  for (pos = pos + 1; pos < max; pos++) {
    code = state.src.charCodeAt(pos);
    if (code !== 0x20 && code !== 0x0A) { break; }
  }

  // [label]:   destination   'title'
  //                          ^^^^^^^ parse this
  if (pos < max && start !== pos && parseLinkTitle(state, pos)) {
    title = state.linkContent;
    pos = state.pos;
  } else {
    title = '';
    pos = start;
  }

  // ensure that the end of the line is empty
  while (pos < max && state.src.charCodeAt(pos) === 0x20/* space */) { pos++; }
  if (pos < max && state.src.charCodeAt(pos) !== 0x0A) { return -1; }

  label = normalizeReference(str.slice(1, labelEnd));
  if (typeof env.references[label] === 'undefined') {
    env.references[label] = { title: title, href: href };
  }

  return pos;
}


module.exports = function references(state) {
  var tokens = state.tokens, i, l, content, pos;

  state.env.references = state.env.references || {};

  if (state.inlineMode) {
    return;
  }

  // Scan definitions in paragraph inlines
  for (i = 1, l = tokens.length - 1; i < l; i++) {
    if (tokens[i].type === 'inline' &&
        tokens[i - 1].type === 'paragraph_open' &&
        tokens[i + 1].type === 'paragraph_close') {

      content = tokens[i].content;
      while (content.length) {
        pos = parseReference(content, state.inline, state.options, state.env);
        if (pos < 0) { break; }
        content = content.slice(pos).trim();
      }

      tokens[i].content = content;
      if (!content.length) {
        tokens[i - 1].tight = true;
        tokens[i + 1].tight = true;
      }
    }
  }
};

},{"../helpers/normalize_reference":12,"../helpers/parse_link_destination":13,"../helpers/parse_link_label":14,"../helpers/parse_link_title":15,"../rules_inline/state_inline":58}],43:[function(require,module,exports){
// Simple typographical replacements
//
'use strict';

// TODO:
// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
// - miltiplication 2 x 4 -> 2 × 4

var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;

var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
var SCOPED_ABBR = {
  'c': '©',
  'r': '®',
  'p': '§',
  'tm': '™'
};

function replaceScopedAbbr(str) {
  if (str.indexOf('(') < 0) { return str; }

  return str.replace(SCOPED_ABBR_RE, function(match, name) {
    return SCOPED_ABBR[name.toLowerCase()];
  });
}


module.exports = function replace(state) {
  var i, token, text, inlineTokens, blkIdx;

  if (!state.options.typographer) { return; }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline') { continue; }

    inlineTokens = state.tokens[blkIdx].children;

    for (i = inlineTokens.length - 1; i >= 0; i--) {
      token = inlineTokens[i];
      if (token.type === 'text') {
        text = token.content;

        text = replaceScopedAbbr(text);

        if (RARE_RE.test(text)) {
          text = text
            .replace(/\+-/g, '±')
            // .., ..., ....... -> …
            // but ?..... & !..... -> ?.. & !..
            .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..')
            .replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',')
            // em-dash
            .replace(/(^|[^-])---([^-]|$)/mg, '$1\u2014$2')
            // en-dash
            .replace(/(^|\s)--(\s|$)/mg, '$1\u2013$2')
            .replace(/(^|[^-\s])--([^-\s]|$)/mg, '$1\u2013$2');
        }

        token.content = text;
      }
    }
  }
};

},{}],44:[function(require,module,exports){
// Convert straight quotation marks to typographic ones
//
'use strict';


var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var PUNCT_RE = /[-\s()\[\]]/;
var APOSTROPHE = '’';

// This function returns true if the character at `pos`
// could be inside a word.
function isLetter(str, pos) {
  if (pos < 0 || pos >= str.length) { return false; }
  return !PUNCT_RE.test(str[pos]);
}


function replaceAt(str, index, ch) {
  return str.substr(0, index) + ch + str.substr(index + 1);
}


module.exports = function smartquotes(state) {
  /*eslint max-depth:0*/
  var i, token, text, t, pos, max, thisLevel, lastSpace, nextSpace, item,
      canOpen, canClose, j, isSingle, blkIdx, tokens,
      stack;

  if (!state.options.typographer) { return; }

  stack = [];

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline') { continue; }

    tokens = state.tokens[blkIdx].children;
    stack.length = 0;

    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];

      if (token.type !== 'text' || QUOTE_TEST_RE.test(token.text)) { continue; }

      thisLevel = tokens[i].level;

      for (j = stack.length - 1; j >= 0; j--) {
        if (stack[j].level <= thisLevel) { break; }
      }
      stack.length = j + 1;

      text = token.content;
      pos = 0;
      max = text.length;

      /*eslint no-labels:0,block-scoped-var:0*/
      OUTER:
      while (pos < max) {
        QUOTE_RE.lastIndex = pos;
        t = QUOTE_RE.exec(text);
        if (!t) { break; }

        lastSpace = !isLetter(text, t.index - 1);
        pos = t.index + 1;
        isSingle = (t[0] === "'");
        nextSpace = !isLetter(text, pos);

        if (!nextSpace && !lastSpace) {
          // middle of word
          if (isSingle) {
            token.content = replaceAt(token.content, t.index, APOSTROPHE);
          }
          continue;
        }

        canOpen = !nextSpace;
        canClose = !lastSpace;

        if (canClose) {
          // this could be a closing quote, rewind the stack to get a match
          for (j = stack.length - 1; j >= 0; j--) {
            item = stack[j];
            if (stack[j].level < thisLevel) { break; }
            if (item.single === isSingle && stack[j].level === thisLevel) {
              item = stack[j];
              if (isSingle) {
                tokens[item.token].content = replaceAt(tokens[item.token].content, item.pos, state.options.quotes[2]);
                token.content = replaceAt(token.content, t.index, state.options.quotes[3]);
              } else {
                tokens[item.token].content = replaceAt(tokens[item.token].content, item.pos, state.options.quotes[0]);
                token.content = replaceAt(token.content, t.index, state.options.quotes[1]);
              }
              stack.length = j;
              continue OUTER;
            }
          }
        }

        if (canOpen) {
          stack.push({
            token: i,
            pos: t.index,
            single: isSingle,
            level: thisLevel
          });
        } else if (canClose && isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }
      }
    }
  }
};

},{}],45:[function(require,module,exports){
// Process autolinks '<protocol:...>'

'use strict';

var url_schemas   = require('../common/url_schemas');
var normalizeLink = require('../helpers/normalize_link');


/*eslint max-len:0*/
var EMAIL_RE    = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
var AUTOLINK_RE = /^<([a-zA-Z.\-]{1,25}):([^<>\x00-\x20]*)>/;


module.exports = function autolink(state, silent) {
  var tail, linkMatch, emailMatch, url, fullUrl, pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  tail = state.src.slice(pos);

  if (tail.indexOf('>') < 0) { return false; }

  linkMatch = tail.match(AUTOLINK_RE);

  if (linkMatch) {
    if (url_schemas.indexOf(linkMatch[1].toLowerCase()) < 0) { return false; }

    url = linkMatch[0].slice(1, -1);
    fullUrl = normalizeLink(url);
    if (!state.parser.validateLink(url)) { return false; }

    if (!silent) {
      state.push({
        type: 'link_open',
        href: fullUrl,
        level: state.level
      });
      state.push({
        type: 'text',
        content: url,
        level: state.level + 1
      });
      state.push({ type: 'link_close', level: state.level });
    }

    state.pos += linkMatch[0].length;
    return true;
  }

  emailMatch = tail.match(EMAIL_RE);

  if (emailMatch) {

    url = emailMatch[0].slice(1, -1);

    fullUrl = normalizeLink('mailto:' + url);
    if (!state.parser.validateLink(fullUrl)) { return false; }

    if (!silent) {
      state.push({
        type: 'link_open',
        href: fullUrl,
        level: state.level
      });
      state.push({
        type: 'text',
        content: url,
        level: state.level + 1
      });
      state.push({ type: 'link_close', level: state.level });
    }

    state.pos += emailMatch[0].length;
    return true;
  }

  return false;
};

},{"../common/url_schemas":6,"../helpers/normalize_link":11}],46:[function(require,module,exports){
// Parse backticks

'use strict';

module.exports = function backticks(state, silent) {
  var start, max, marker, matchStart, matchEnd,
      pos = state.pos,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x60/* ` */) { return false; }

  start = pos;
  pos++;
  max = state.posMax;

  while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) { pos++; }

  marker = state.src.slice(start, pos);

  matchStart = matchEnd = pos;

  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
    matchEnd = matchStart + 1;

    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

    if (matchEnd - matchStart === marker.length) {
      if (!silent) {
        state.push({
          type: 'code',
          content: state.src.slice(pos, matchStart)
                              .replace(/[ \n]+/g, ' ')
                              .trim(),
          block: false,
          level: state.level
        });
      }
      state.pos = matchEnd;
      return true;
    }
  }

  if (!silent) { state.pending += marker; }
  state.pos += marker.length;
  return true;
};

},{}],47:[function(require,module,exports){
// Process ~~deleted text~~

'use strict';

module.exports = function del(state, silent) {
  var found,
      pos,
      stack,
      max = state.posMax,
      start = state.pos,
      lastChar,
      nextChar;

  if (state.src.charCodeAt(start) !== 0x7E/* ~ */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 4 >= max) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x7E/* ~ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : -1;
  nextChar = state.src.charCodeAt(start + 2);

  if (lastChar === 0x7E/* ~ */) { return false; }
  if (nextChar === 0x7E/* ~ */) { return false; }
  if (nextChar === 0x20 || nextChar === 0x0A) { return false; }

  pos = start + 2;
  while (pos < max && state.src.charCodeAt(pos) === 0x7E/* ~ */) { pos++; }
  if (pos > start + 3) {
    // sequence of 4+ markers taking as literal, same as in a emphasis
    state.pos += pos - start;
    if (!silent) { state.pending += state.src.slice(start, pos); }
    return true;
  }

  state.pos = start + 2;
  stack = 1;

  while (state.pos + 1 < max) {
    if (state.src.charCodeAt(state.pos) === 0x7E/* ~ */) {
      if (state.src.charCodeAt(state.pos + 1) === 0x7E/* ~ */) {
        lastChar = state.src.charCodeAt(state.pos - 1);
        nextChar = state.pos + 2 < max ? state.src.charCodeAt(state.pos + 2) : -1;
        if (nextChar !== 0x7E/* ~ */ && lastChar !== 0x7E/* ~ */) {
          if (lastChar !== 0x20 && lastChar !== 0x0A) {
            // closing '~~'
            stack--;
          } else if (nextChar !== 0x20 && nextChar !== 0x0A) {
            // opening '~~'
            stack++;
          } // else {
            //  // standalone ' ~~ ' indented with spaces
            // }
          if (stack <= 0) {
            found = true;
            break;
          }
        }
      }
    }

    state.parser.skipToken(state);
  }

  if (!found) {
    // parser failed to find ending tag, so it's not valid emphasis
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 2;

  if (!silent) {
    state.push({ type: 'del_open', level: state.level++ });
    state.parser.tokenize(state);
    state.push({ type: 'del_close', level: --state.level });
  }

  state.pos = state.posMax + 2;
  state.posMax = max;
  return true;
};

},{}],48:[function(require,module,exports){
// Process *this* and _that_

'use strict';


function isAlphaNum(code) {
  return (code >= 0x30 /* 0 */ && code <= 0x39 /* 9 */) ||
         (code >= 0x41 /* A */ && code <= 0x5A /* Z */) ||
         (code >= 0x61 /* a */ && code <= 0x7A /* z */);
}

// parse sequence of emphasis markers,
// "start" should point at a valid marker
function scanDelims(state, start) {
  var pos = start, lastChar, nextChar, count,
      can_open = true,
      can_close = true,
      max = state.posMax,
      marker = state.src.charCodeAt(start);

  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : -1;

  while (pos < max && state.src.charCodeAt(pos) === marker) { pos++; }
  if (pos >= max) { can_open = false; }
  count = pos - start;

  if (count >= 4) {
    // sequence of four or more unescaped markers can't start/end an emphasis
    can_open = can_close = false;
  } else {
    nextChar = pos < max ? state.src.charCodeAt(pos) : -1;

    // check whitespace conditions
    if (nextChar === 0x20 || nextChar === 0x0A) { can_open = false; }
    if (lastChar === 0x20 || lastChar === 0x0A) { can_close = false; }

    if (marker === 0x5F /* _ */) {
      // check if we aren't inside the word
      if (isAlphaNum(lastChar)) { can_open = false; }
      if (isAlphaNum(nextChar)) { can_close = false; }
    }
  }

  return {
    can_open: can_open,
    can_close: can_close,
    delims: count
  };
}

module.exports = function emphasis(state, silent) {
  var startCount,
      count,
      found,
      oldCount,
      newCount,
      stack,
      res,
      max = state.posMax,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (marker !== 0x5F/* _ */ && marker !== 0x2A /* * */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode

  res = scanDelims(state, start);
  startCount = res.delims;
  if (!res.can_open) {
    state.pos += startCount;
    if (!silent) { state.pending += state.src.slice(start, state.pos); }
    return true;
  }

  if (state.level >= state.options.maxNesting) { return false; }

  state.pos = start + startCount;
  stack = [ startCount ];

  while (state.pos < max) {
    if (state.src.charCodeAt(state.pos) === marker) {
      res = scanDelims(state, state.pos);
      count = res.delims;
      if (res.can_close) {
        oldCount = stack.pop();
        newCount = count;

        while (oldCount !== newCount) {
          if (newCount < oldCount) {
            stack.push(oldCount - newCount);
            break;
          }

          // assert(newCount > oldCount)
          newCount -= oldCount;

          if (stack.length === 0) { break; }
          state.pos += oldCount;
          oldCount = stack.pop();
        }

        if (stack.length === 0) {
          startCount = oldCount;
          found = true;
          break;
        }
        state.pos += count;
        continue;
      }

      if (res.can_open) { stack.push(count); }
      state.pos += count;
      continue;
    }

    state.parser.skipToken(state);
  }

  if (!found) {
    // parser failed to find ending tag, so it's not valid emphasis
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + startCount;

  if (!silent) {
    if (startCount === 2 || startCount === 3) {
      state.push({ type: 'strong_open', level: state.level++ });
    }
    if (startCount === 1 || startCount === 3) {
      state.push({ type: 'em_open', level: state.level++ });
    }

    state.parser.tokenize(state);

    if (startCount === 1 || startCount === 3) {
      state.push({ type: 'em_close', level: --state.level });
    }
    if (startCount === 2 || startCount === 3) {
      state.push({ type: 'strong_close', level: --state.level });
    }
  }

  state.pos = state.posMax + startCount;
  state.posMax = max;
  return true;
};

},{}],49:[function(require,module,exports){
// Process html entity - &#123;, &#xAF;, &quot;, ...

'use strict';

var entities          = require('../common/entities');
var has               = require('../common/utils').has;
var isValidEntityCode = require('../common/utils').isValidEntityCode;
var fromCodePoint     = require('../common/utils').fromCodePoint;


var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,8}|[0-9]{1,8}));/i;
var NAMED_RE   = /^&([a-z][a-z0-9]{1,31});/i;


module.exports = function entity(state, silent) {
  var ch, code, match, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26/* & */) { return false; }

  if (pos + 1 < max) {
    ch = state.src.charCodeAt(pos + 1);

    if (ch === 0x23 /* # */) {
      match = state.src.slice(pos).match(DIGITAL_RE);
      if (match) {
        if (!silent) {
          code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
          state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
        }
        state.pos += match[0].length;
        return true;
      }
    } else {
      match = state.src.slice(pos).match(NAMED_RE);
      if (match) {
        if (has(entities, match[1])) {
          if (!silent) { state.pending += entities[match[1]]; }
          state.pos += match[0].length;
          return true;
        }
      }
    }
  }

  if (!silent) { state.pending += '&'; }
  state.pos++;
  return true;
};

},{"../common/entities":3,"../common/utils":7}],50:[function(require,module,exports){
// Proceess escaped chars and hardbreaks

'use strict';

var ESCAPED = [];

for (var i = 0; i < 256; i++) { ESCAPED.push(0); }

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'
  .split('').forEach(function(ch) { ESCAPED[ch.charCodeAt(0)] = 1; });


module.exports = function escape(state, silent) {
  var ch, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5C/* \ */) { return false; }

  pos++;

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (ch < 256 && ESCAPED[ch] !== 0) {
      if (!silent) { state.pending += state.src[pos]; }
      state.pos += 2;
      return true;
    }

    if (ch === 0x0A) {
      if (!silent) {
        state.push({
          type: 'hardbreak',
          level: state.level
        });
      }

      pos++;
      // skip leading whitespaces from next line
      while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }

      state.pos = pos;
      return true;
    }
  }

  if (!silent) { state.pending += '\\'; }
  state.pos++;
  return true;
};

},{}],51:[function(require,module,exports){
// Process inline footnotes (^[...])

'use strict';

var parseLinkLabel = require('../helpers/parse_link_label');


module.exports = function footnote_inline(state, silent) {
  var labelStart,
      labelEnd,
      footnoteId,
      oldLength,
      max = state.posMax,
      start = state.pos;

  if (start + 2 >= max) { return false; }
  if (state.src.charCodeAt(start) !== 0x5E/* ^ */) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x5B/* [ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  labelStart = start + 2;
  labelEnd = parseLinkLabel(state, start + 1);

  // parser failed to find ']', so it's not a valid note
  if (labelEnd < 0) { return false; }

  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    if (!state.env.footnotes) { state.env.footnotes = {}; }
    if (!state.env.footnotes.list) { state.env.footnotes.list = []; }
    footnoteId = state.env.footnotes.list.length;

    state.pos = labelStart;
    state.posMax = labelEnd;

    state.push({
      type: 'footnote_ref',
      id: footnoteId,
      level: state.level
    });
    state.linkLevel++;
    oldLength = state.tokens.length;
    state.parser.tokenize(state);
    state.env.footnotes.list[footnoteId] = { tokens: state.tokens.splice(oldLength) };
    state.linkLevel--;
  }

  state.pos = labelEnd + 1;
  state.posMax = max;
  return true;
};

},{"../helpers/parse_link_label":14}],52:[function(require,module,exports){
// Process footnote references ([^...])

'use strict';


module.exports = function footnote_ref(state, silent) {
  var label,
      pos,
      footnoteId,
      footnoteSubId,
      max = state.posMax,
      start = state.pos;

  // should be at least 4 chars - "[^x]"
  if (start + 3 > max) { return false; }

  if (!state.env.footnotes || !state.env.footnotes.refs) { return false; }
  if (state.src.charCodeAt(start) !== 0x5B/* [ */) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x5E/* ^ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  for (pos = start + 2; pos < max; pos++) {
    if (state.src.charCodeAt(pos) === 0x20) { return false; }
    if (state.src.charCodeAt(pos) === 0x0A) { return false; }
    if (state.src.charCodeAt(pos) === 0x5D /* ] */) {
      break;
    }
  }

  if (pos === start + 2) { return false; } // no empty footnote labels
  if (pos >= max) { return false; }
  pos++;

  label = state.src.slice(start + 2, pos - 1);
  if (typeof state.env.footnotes.refs[':' + label] === 'undefined') { return false; }

  if (!silent) {
    if (!state.env.footnotes.list) { state.env.footnotes.list = []; }

    if (state.env.footnotes.refs[':' + label] < 0) {
      footnoteId = state.env.footnotes.list.length;
      state.env.footnotes.list[footnoteId] = { label: label, count: 0 };
      state.env.footnotes.refs[':' + label] = footnoteId;
    } else {
      footnoteId = state.env.footnotes.refs[':' + label];
    }

    footnoteSubId = state.env.footnotes.list[footnoteId].count;
    state.env.footnotes.list[footnoteId].count++;

    state.push({
      type: 'footnote_ref',
      id: footnoteId,
      subId: footnoteSubId,
      level: state.level
    });
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{}],53:[function(require,module,exports){
// Process html tags

'use strict';


var HTML_TAG_RE = require('../common/html_re').HTML_TAG_RE;


function isLetter(ch) {
  /*eslint no-bitwise:0*/
  var lc = ch | 0x20; // to lower case
  return (lc >= 0x61/* a */) && (lc <= 0x7a/* z */);
}


module.exports = function htmltag(state, silent) {
  var ch, match, max, pos = state.pos;

  if (!state.options.html) { return false; }

  // Check start
  max = state.posMax;
  if (state.src.charCodeAt(pos) !== 0x3C/* < */ ||
      pos + 2 >= max) {
    return false;
  }

  // Quick fail on second char
  ch = state.src.charCodeAt(pos + 1);
  if (ch !== 0x21/* ! */ &&
      ch !== 0x3F/* ? */ &&
      ch !== 0x2F/* / */ &&
      !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE);
  if (!match) { return false; }

  if (!silent) {
    state.push({
      type: 'htmltag',
      content: state.src.slice(pos, pos + match[0].length),
      level: state.level
    });
  }
  state.pos += match[0].length;
  return true;
};

},{"../common/html_re":5}],54:[function(require,module,exports){
// Process ++inserted text++

'use strict';

module.exports = function ins(state, silent) {
  var found,
      pos,
      stack,
      max = state.posMax,
      start = state.pos,
      lastChar,
      nextChar;

  if (state.src.charCodeAt(start) !== 0x2B/* + */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 4 >= max) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x2B/* + */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : -1;
  nextChar = state.src.charCodeAt(start + 2);

  if (lastChar === 0x2B/* + */) { return false; }
  if (nextChar === 0x2B/* + */) { return false; }
  if (nextChar === 0x20 || nextChar === 0x0A) { return false; }

  pos = start + 2;
  while (pos < max && state.src.charCodeAt(pos) === 0x2B/* + */) { pos++; }
  if (pos !== start + 2) {
    // sequence of 3+ markers taking as literal, same as in a emphasis
    state.pos += pos - start;
    if (!silent) { state.pending += state.src.slice(start, pos); }
    return true;
  }

  state.pos = start + 2;
  stack = 1;

  while (state.pos + 1 < max) {
    if (state.src.charCodeAt(state.pos) === 0x2B/* + */) {
      if (state.src.charCodeAt(state.pos + 1) === 0x2B/* + */) {
        lastChar = state.src.charCodeAt(state.pos - 1);
        nextChar = state.pos + 2 < max ? state.src.charCodeAt(state.pos + 2) : -1;
        if (nextChar !== 0x2B/* + */ && lastChar !== 0x2B/* + */) {
          if (lastChar !== 0x20 && lastChar !== 0x0A) {
            // closing '++'
            stack--;
          } else if (nextChar !== 0x20 && nextChar !== 0x0A) {
            // opening '++'
            stack++;
          } // else {
            //  // standalone ' ++ ' indented with spaces
            // }
          if (stack <= 0) {
            found = true;
            break;
          }
        }
      }
    }

    state.parser.skipToken(state);
  }

  if (!found) {
    // parser failed to find ending tag, so it's not valid emphasis
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 2;

  if (!silent) {
    state.push({ type: 'ins_open', level: state.level++ });
    state.parser.tokenize(state);
    state.push({ type: 'ins_close', level: --state.level });
  }

  state.pos = state.posMax + 2;
  state.posMax = max;
  return true;
};

},{}],55:[function(require,module,exports){
// Process [links](<to> "stuff")

'use strict';

var parseLinkLabel       = require('../helpers/parse_link_label');
var parseLinkDestination = require('../helpers/parse_link_destination');
var parseLinkTitle       = require('../helpers/parse_link_title');
var normalizeReference   = require('../helpers/normalize_reference');


module.exports = function links(state, silent) {
  var labelStart,
      labelEnd,
      label,
      href,
      title,
      pos,
      ref,
      code,
      isImage = false,
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (marker === 0x21/* ! */) {
    isImage = true;
    marker = state.src.charCodeAt(++start);
  }

  if (marker !== 0x5B/* [ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  labelStart = start + 1;
  labelEnd = parseLinkLabel(state, start);

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
    //
    // Inline link
    //

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    if (parseLinkDestination(state, pos)) {
      href = state.linkContent;
      pos = state.pos;
    } else {
      href = '';
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0A) { break; }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    if (pos < max && start !== pos && parseLinkTitle(state, pos)) {
      title = state.linkContent;
      pos = state.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (code !== 0x20 && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    //
    // Link reference
    //

    // do not allow nested reference links
    if (state.linkLevel > 0) { return false; }

    // [foo]  [bar]
    //      ^^ optional whitespace (can include newlines)
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0A) { break; }
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
      start = pos + 1;
      pos = parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = start - 1;
      }
    }

    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label) {
      if (typeof label === 'undefined') {
        pos = labelEnd + 1;
      }
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;

    if (isImage) {
      state.push({
        type: 'image',
        src: href,
        title: title,
        alt: state.src.substr(labelStart, labelEnd - labelStart),
        level: state.level
      });
    } else {
      state.push({
        type: 'link_open',
        href: href,
        title: title,
        level: state.level++
      });
      state.linkLevel++;
      state.parser.tokenize(state);
      state.linkLevel--;
      state.push({ type: 'link_close', level: --state.level });
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{"../helpers/normalize_reference":12,"../helpers/parse_link_destination":13,"../helpers/parse_link_label":14,"../helpers/parse_link_title":15}],56:[function(require,module,exports){
// Process ==highlighted text==

'use strict';

module.exports = function del(state, silent) {
  var found,
      pos,
      stack,
      max = state.posMax,
      start = state.pos,
      lastChar,
      nextChar;

  if (state.src.charCodeAt(start) !== 0x3D/* = */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 4 >= max) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x3D/* = */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  lastChar = start > 0 ? state.src.charCodeAt(start - 1) : -1;
  nextChar = state.src.charCodeAt(start + 2);

  if (lastChar === 0x3D/* = */) { return false; }
  if (nextChar === 0x3D/* = */) { return false; }
  if (nextChar === 0x20 || nextChar === 0x0A) { return false; }

  pos = start + 2;
  while (pos < max && state.src.charCodeAt(pos) === 0x3D/* = */) { pos++; }
  if (pos !== start + 2) {
    // sequence of 3+ markers taking as literal, same as in a emphasis
    state.pos += pos - start;
    if (!silent) { state.pending += state.src.slice(start, pos); }
    return true;
  }

  state.pos = start + 2;
  stack = 1;

  while (state.pos + 1 < max) {
    if (state.src.charCodeAt(state.pos) === 0x3D/* = */) {
      if (state.src.charCodeAt(state.pos + 1) === 0x3D/* = */) {
        lastChar = state.src.charCodeAt(state.pos - 1);
        nextChar = state.pos + 2 < max ? state.src.charCodeAt(state.pos + 2) : -1;
        if (nextChar !== 0x3D/* = */ && lastChar !== 0x3D/* = */) {
          if (lastChar !== 0x20 && lastChar !== 0x0A) {
            // closing '=='
            stack--;
          } else if (nextChar !== 0x20 && nextChar !== 0x0A) {
            // opening '=='
            stack++;
          } // else {
            //  // standalone ' == ' indented with spaces
            // }
          if (stack <= 0) {
            found = true;
            break;
          }
        }
      }
    }

    state.parser.skipToken(state);
  }

  if (!found) {
    // parser failed to find ending tag, so it's not valid emphasis
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 2;

  if (!silent) {
    state.push({ type: 'mark_open', level: state.level++ });
    state.parser.tokenize(state);
    state.push({ type: 'mark_close', level: --state.level });
  }

  state.pos = state.posMax + 2;
  state.posMax = max;
  return true;
};

},{}],57:[function(require,module,exports){
// Proceess '\n'

'use strict';

module.exports = function newline(state, silent) {
  var pmax, max, pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x0A/* \n */) { return false; }

  pmax = state.pending.length - 1;
  max = state.posMax;

  // '  \n' -> hardbreak
  // Lookup in pending chars is bad practice! Don't copy to other rules!
  // Pending string is stored in concat mode, indexed lookups will cause
  // convertion to flat mode.
  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
        state.pending = state.pending.replace(/ +$/, '');
        state.push({
          type: 'hardbreak',
          level: state.level
        });
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push({
          type: 'softbreak',
          level: state.level
        });
      }

    } else {
      state.push({
        type: 'softbreak',
        level: state.level
      });
    }
  }

  pos++;

  // skip heading spaces for next line
  while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }

  state.pos = pos;
  return true;
};

},{}],58:[function(require,module,exports){
// Inline parser state

'use strict';


function StateInline(src, parserInline, options, env, outTokens) {
  this.src = src;
  this.env = env;
  this.options = options;
  this.parser = parserInline;
  this.tokens = outTokens;
  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0;

  this.cache = [];        // Stores { start: end } pairs. Useful for backtrack
                          // optimization of pairs parse (emphasis, strikes).

  // Link parser state vars

  this.isInLabel = false; // Set true when seek link label - we should disable
                          // "paired" rules (emphasis, strikes) to not skip
                          // tailing `]`

  this.linkLevel = 0;     // Increment for each nesting link. Used to prevent
                          // nesting in definitions

  this.linkContent = '';  // Temporary storage for link url

  this.labelUnmatchedScopes = 0; // Track unpaired `[` for link labels
                                 // (backtrack optimization)
}


// Flush pending text
//
StateInline.prototype.pushPending = function () {
  this.tokens.push({
    type: 'text',
    content: this.pending,
    level: this.pendingLevel
  });
  this.pending = '';
};


// Push new token to "stream".
// If pending text exists - flush it as text token
//
StateInline.prototype.push = function (token) {
  if (this.pending) {
    this.pushPending();
  }

  this.tokens.push(token);
  this.pendingLevel = this.level;
};


// Store value to cache.
// !!! Implementation has parser-specific optimizations
// !!! keys MUST be integer, >= 0; values MUST be integer, > 0
//
StateInline.prototype.cacheSet = function (key, val) {
  for (var i = this.cache.length; i <= key; i++) {
    this.cache.push(0);
  }

  this.cache[key] = val;
};


// Get cache value
//
StateInline.prototype.cacheGet = function (key) {
  return key < this.cache.length ? this.cache[key] : 0;
};


module.exports = StateInline;

},{}],59:[function(require,module,exports){
// Process ~subscript~

'use strict';

// same as UNESCAPE_MD_RE plus a space
var UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;

module.exports = function sub(state, silent) {
  var found,
      content,
      max = state.posMax,
      start = state.pos;

  if (state.src.charCodeAt(start) !== 0x7E/* ~ */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 2 >= max) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  state.pos = start + 1;

  while (state.pos < max) {
    if (state.src.charCodeAt(state.pos) === 0x7E/* ~ */) {
      found = true;
      break;
    }

    state.parser.skipToken(state);
  }

  if (!found || start + 1 === state.pos) {
    state.pos = start;
    return false;
  }

  content = state.src.slice(start + 1, state.pos);

  // don't allow unescaped spaces/newlines inside
  if (content.match(/(^|[^\\])(\\\\)*\s/)) {
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 1;

  if (!silent) {
    state.push({
      type: 'sub',
      level: state.level,
      content: content.replace(UNESCAPE_RE, '$1')
    });
  }

  state.pos = state.posMax + 1;
  state.posMax = max;
  return true;
};

},{}],60:[function(require,module,exports){
// Process ^superscript^

'use strict';

// same as UNESCAPE_MD_RE plus a space
var UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;

module.exports = function sup(state, silent) {
  var found,
      content,
      max = state.posMax,
      start = state.pos;

  if (state.src.charCodeAt(start) !== 0x5E/* ^ */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 2 >= max) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }

  state.pos = start + 1;

  while (state.pos < max) {
    if (state.src.charCodeAt(state.pos) === 0x5E/* ^ */) {
      found = true;
      break;
    }

    state.parser.skipToken(state);
  }

  if (!found || start + 1 === state.pos) {
    state.pos = start;
    return false;
  }

  content = state.src.slice(start + 1, state.pos);

  // don't allow unescaped spaces/newlines inside
  if (content.match(/(^|[^\\])(\\\\)*\s/)) {
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 1;

  if (!silent) {
    state.push({
      type: 'sup',
      level: state.level,
      content: content.replace(UNESCAPE_RE, '$1')
    });
  }

  state.pos = state.posMax + 1;
  state.posMax = max;
  return true;
};

},{}],61:[function(require,module,exports){
// Skip text characters for text token, place those to pending buffer
// and increment current pos

'use strict';


// Rule to skip pure text
// '{}$%@~+=:' reserved for extentions

function isTerminatorChar(ch) {
  switch (ch) {
    case 0x0A/* \n */:
    case 0x5C/* \ */:
    case 0x60/* ` */:
    case 0x2A/* * */:
    case 0x5F/* _ */:
    case 0x5E/* ^ */:
    case 0x5B/* [ */:
    case 0x5D/* ] */:
    case 0x21/* ! */:
    case 0x26/* & */:
    case 0x3C/* < */:
    case 0x3E/* > */:
    case 0x7B/* { */:
    case 0x7D/* } */:
    case 0x24/* $ */:
    case 0x25/* % */:
    case 0x40/* @ */:
    case 0x7E/* ~ */:
    case 0x2B/* + */:
    case 0x3D/* = */:
    case 0x3A/* : */:
      return true;
    default:
      return false;
  }
}

module.exports = function text(state, silent) {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) { return false; }

  if (!silent) { state.pending += state.src.slice(state.pos, pos); }

  state.pos = pos;

  return true;
};

},{}],62:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _comment_box = require('./comment_box');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_reactDom2.default.render(_react2.default.createElement(_comment_box.CommentBox, null), document.getElementById('content'));

},{"./comment_box":64,"react":"react","react-dom":"react-dom"}],63:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _remarkable = require('remarkable');

var _remarkable2 = _interopRequireDefault(_remarkable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Comment = function (_React$Component) {
    _inherits(Comment, _React$Component);

    function Comment() {
        _classCallCheck(this, Comment);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Comment).call(this));

        _this.md = new _remarkable2.default();
        return _this;
    }

    _createClass(Comment, [{
        key: 'render',
        value: function render() {

            return _react2.default.createElement(
                'div',
                { className: 'comment' },
                _react2.default.createElement(
                    'h2',
                    { className: 'commentAuthor' },
                    this.props.author
                ),
                this.md.render(this.props.children.toString())
            );
        }
    }]);

    return Comment;
}(_react2.default.Component);

exports.default = Comment;
;

},{"react":"react","remarkable":2}],64:[function(require,module,exports){
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

},{"./comment":63,"react":"react"}]},{},[62])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXV0b2xpbmtlci9kaXN0L0F1dG9saW5rZXIuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9jb21tb24vZW50aXRpZXMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvY29tbW9uL2h0bWxfYmxvY2tzLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL2NvbW1vbi9odG1sX3JlLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL2NvbW1vbi91cmxfc2NoZW1hcy5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9jb21tb24vdXRpbHMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvY29uZmlncy9jb21tb25tYXJrLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL2NvbmZpZ3MvZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9jb25maWdzL2Z1bGwuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvaGVscGVycy9ub3JtYWxpemVfbGluay5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9oZWxwZXJzL25vcm1hbGl6ZV9yZWZlcmVuY2UuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvaGVscGVycy9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL2hlbHBlcnMvcGFyc2VfbGlua19sYWJlbC5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfdGl0bGUuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcGFyc2VyX2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3BhcnNlcl9jb3JlLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3BhcnNlcl9pbmxpbmUuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcmVuZGVyZXIuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXIuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfYmxvY2svYmxvY2txdW90ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19ibG9jay9jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL2RlZmxpc3QuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfYmxvY2svZmVuY2VzLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL2Zvb3Rub3RlLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL2hlYWRpbmcuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfYmxvY2svaHIuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfYmxvY2svaHRtbGJsb2NrLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL2xoZWFkaW5nLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL2xpc3QuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfYmxvY2svcGFyYWdyYXBoLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL3N0YXRlX2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2Jsb2NrL3RhYmxlLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2NvcmUvYWJici5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19jb3JlL2FiYnIyLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2NvcmUvYmxvY2suanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfY29yZS9mb290bm90ZV90YWlsLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2NvcmUvaW5saW5lLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2NvcmUvbGlua2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19jb3JlL3JlZmVyZW5jZXMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfY29yZS9yZXBsYWNlbWVudHMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfY29yZS9zbWFydHF1b3Rlcy5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19pbmxpbmUvYXV0b2xpbmsuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfaW5saW5lL2JhY2t0aWNrcy5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19pbmxpbmUvZGVsLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9lbXBoYXNpcy5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19pbmxpbmUvZW50aXR5LmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfaW5saW5lL2Zvb3Rub3RlX2lubGluZS5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19pbmxpbmUvZm9vdG5vdGVfcmVmLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9odG1sdGFnLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9pbnMuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfaW5saW5lL2xpbmtzLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9tYXJrLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9uZXdsaW5lLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUuanMiLCJub2RlX21vZHVsZXMvcmVtYXJrYWJsZS9saWIvcnVsZXNfaW5saW5lL3N1Yi5qcyIsIm5vZGVfbW9kdWxlcy9yZW1hcmthYmxlL2xpYi9ydWxlc19pbmxpbmUvc3VwLmpzIiwibm9kZV9tb2R1bGVzL3JlbWFya2FibGUvbGliL3J1bGVzX2lubGluZS90ZXh0LmpzIiwic2NyaXB0cy9mcm9udC9hcHAuanMiLCJzY3JpcHRzL2Zyb250L2NvbW1lbnQuanMiLCJzY3JpcHRzL2Zyb250L2NvbW1lbnRfYm94LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNueEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckRBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBLG1CQUFTLE1BQVQsQ0FDRSw0REFERixFQUVFLFNBQVMsY0FBVCxDQUF3QixTQUF4QixDQUZGOzs7Ozs7Ozs7OztBQ0pBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQUVxQixPOzs7QUFDakIsdUJBQWM7QUFBQTs7QUFBQTs7QUFHVixjQUFLLEVBQUwsR0FBVSwwQkFBVjtBQUhVO0FBSWI7Ozs7aUNBRVE7O0FBRUwsbUJBQ0U7QUFBQTtBQUFBLGtCQUFLLFdBQVUsU0FBZjtBQUNFO0FBQUE7QUFBQSxzQkFBSSxXQUFVLGVBQWQ7QUFDRyx5QkFBSyxLQUFMLENBQVc7QUFEZCxpQkFERjtBQUlHLHFCQUFLLEVBQUwsQ0FBUSxNQUFSLENBQWUsS0FBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixRQUFwQixFQUFmO0FBSkgsYUFERjtBQVFIOzs7O0VBakJnQyxnQkFBTSxTOztrQkFBdEIsTztBQWtCcEI7Ozs7Ozs7Ozs7QUNyQkQ7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBSSxjQUFjLGdCQUFNLFdBQU4sQ0FBa0I7QUFBQTs7QUFDbEMsVUFBUSxrQkFBVztBQUNqQixXQUNFO0FBQUE7QUFBQSxRQUFLLFdBQVUsYUFBZjtBQUNFO0FBQUE7QUFBQSxVQUFTLFFBQU8sV0FBaEI7QUFBQTtBQUFBLE9BREY7QUFFRTtBQUFBO0FBQUEsVUFBUyxRQUFPLGNBQWhCO0FBQUE7QUFBQTtBQUZGLEtBREY7QUFNRDtBQVJpQyxDQUFsQixDQUFsQjs7QUFXQSxJQUFJLGNBQWMsZ0JBQU0sV0FBTixDQUFrQjtBQUFBOztBQUNsQyxVQUFRLGtCQUFXO0FBQ2pCLFdBQ0U7QUFBQTtBQUFBLFFBQUssV0FBVSxhQUFmO0FBQUE7QUFBQSxLQURGO0FBS0Q7QUFQaUMsQ0FBbEIsQ0FBbEI7O0FBVUEsSUFBSSxhQUFhLGdCQUFNLFdBQU4sQ0FBa0I7QUFBQTs7QUFDakMsVUFBUSxrQkFBVztBQUNqQixXQUNFO0FBQUE7QUFBQSxRQUFLLFdBQVUsWUFBZjtBQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUEsT0FERjtBQUVFLG9DQUFDLFdBQUQsT0FGRjtBQUdFLG9DQUFDLFdBQUQ7QUFIRixLQURGO0FBT0Q7QUFUZ0MsQ0FBbEIsQ0FBakI7O1FBWVEsVyxHQUFBLFc7UUFBYSxXLEdBQUEsVztRQUFhLFUsR0FBQSxVIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlIHVubGVzcyBhbWRNb2R1bGVJZCBpcyBzZXRcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAocm9vdFsnQXV0b2xpbmtlciddID0gZmFjdG9yeSgpKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLCBidXRcbiAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAvLyBsaWtlIE5vZGUuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdFsnQXV0b2xpbmtlciddID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuLyohXG4gKiBBdXRvbGlua2VyLmpzXG4gKiAwLjE1LjNcbiAqXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBHcmVnb3J5IEphY29icyA8Z3JlZ0BncmVnLWphY29icy5jb20+XG4gKiBNSVQgTGljZW5zZWQuIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2dyZWdqYWNvYnMvQXV0b2xpbmtlci5qc1xuICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqIFxuICogVXRpbGl0eSBjbGFzcyB1c2VkIHRvIHByb2Nlc3MgYSBnaXZlbiBzdHJpbmcgb2YgdGV4dCwgYW5kIHdyYXAgdGhlIFVSTHMsIGVtYWlsIGFkZHJlc3NlcywgYW5kIFR3aXR0ZXIgaGFuZGxlcyBpbiBcbiAqIHRoZSBhcHByb3ByaWF0ZSBhbmNob3IgKCZsdDthJmd0OykgdGFncyB0byB0dXJuIHRoZW0gaW50byBsaW5rcy5cbiAqIFxuICogQW55IG9mIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgbWF5IGJlIHByb3ZpZGVkIGluIGFuIE9iamVjdCAobWFwKSBwcm92aWRlZCB0byB0aGUgQXV0b2xpbmtlciBjb25zdHJ1Y3Rvciwgd2hpY2hcbiAqIHdpbGwgY29uZmlndXJlIGhvdyB0aGUge0BsaW5rICNsaW5rIGxpbmsoKX0gbWV0aG9kIHdpbGwgcHJvY2VzcyB0aGUgbGlua3MuXG4gKiBcbiAqIEZvciBleGFtcGxlOlxuICogXG4gKiAgICAgdmFyIGF1dG9saW5rZXIgPSBuZXcgQXV0b2xpbmtlcigge1xuICogICAgICAgICBuZXdXaW5kb3cgOiBmYWxzZSxcbiAqICAgICAgICAgdHJ1bmNhdGUgIDogMzBcbiAqICAgICB9ICk7XG4gKiAgICAgXG4gKiAgICAgdmFyIGh0bWwgPSBhdXRvbGlua2VyLmxpbmsoIFwiSm9lIHdlbnQgdG8gd3d3LnlhaG9vLmNvbVwiICk7XG4gKiAgICAgLy8gcHJvZHVjZXM6ICdKb2Ugd2VudCB0byA8YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIj55YWhvby5jb208L2E+J1xuICogXG4gKiBcbiAqIFRoZSB7QGxpbmsgI3N0YXRpYy1saW5rIHN0YXRpYyBsaW5rKCl9IG1ldGhvZCBtYXkgYWxzbyBiZSB1c2VkIHRvIGlubGluZSBvcHRpb25zIGludG8gYSBzaW5nbGUgY2FsbCwgd2hpY2ggbWF5XG4gKiBiZSBtb3JlIGNvbnZlbmllbnQgZm9yIG9uZS1vZmYgdXNlcy4gRm9yIGV4YW1wbGU6XG4gKiBcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJKb2Ugd2VudCB0byB3d3cueWFob28uY29tXCIsIHtcbiAqICAgICAgICAgbmV3V2luZG93IDogZmFsc2UsXG4gKiAgICAgICAgIHRydW5jYXRlICA6IDMwXG4gKiAgICAgfSApO1xuICogICAgIC8vIHByb2R1Y2VzOiAnSm9lIHdlbnQgdG8gPGEgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCI+eWFob28uY29tPC9hPidcbiAqIFxuICogXG4gKiAjIyBDdXN0b20gUmVwbGFjZW1lbnRzIG9mIExpbmtzXG4gKiBcbiAqIElmIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZG8gbm90IHByb3ZpZGUgZW5vdWdoIGZsZXhpYmlsaXR5LCBhIHtAbGluayAjcmVwbGFjZUZufSBtYXkgYmUgcHJvdmlkZWQgdG8gZnVsbHkgY3VzdG9taXplXG4gKiB0aGUgb3V0cHV0IG9mIEF1dG9saW5rZXIuIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG9uY2UgZm9yIGVhY2ggVVJML0VtYWlsL1R3aXR0ZXIgaGFuZGxlIG1hdGNoIHRoYXQgaXMgZW5jb3VudGVyZWQuXG4gKiBcbiAqIEZvciBleGFtcGxlOlxuICogXG4gKiAgICAgdmFyIGlucHV0ID0gXCIuLi5cIjsgIC8vIHN0cmluZyB3aXRoIFVSTHMsIEVtYWlsIEFkZHJlc3NlcywgYW5kIFR3aXR0ZXIgSGFuZGxlc1xuICogICAgIFxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBpbnB1dCwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJocmVmID0gXCIsIG1hdGNoLmdldEFuY2hvckhyZWYoKSApO1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwidGV4dCA9IFwiLCBtYXRjaC5nZXRBbmNob3JUZXh0KCkgKTtcbiAqICAgICAgICAgXG4gKiAgICAgICAgICAgICBzd2l0Y2goIG1hdGNoLmdldFR5cGUoKSApIHtcbiAqICAgICAgICAgICAgICAgICBjYXNlICd1cmwnIDogXG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInVybDogXCIsIG1hdGNoLmdldFVybCgpICk7XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgICAgICBpZiggbWF0Y2guZ2V0VXJsKCkuaW5kZXhPZiggJ215c2l0ZS5jb20nICkgPT09IC0xICkge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiBgQXV0b2xpbmtlci5IdG1sVGFnYCBpbnN0YW5jZSwgd2hpY2ggcHJvdmlkZXMgbXV0YXRvciBtZXRob2RzIGZvciBlYXN5IGNoYW5nZXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuICogICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmFkZENsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyBsZXQgQXV0b2xpbmtlciBwZXJmb3JtIGl0cyBub3JtYWwgYW5jaG9yIHRhZyByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICB9XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciBlbWFpbCA9IG1hdGNoLmdldEVtYWlsKCk7XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImVtYWlsOiBcIiwgZW1haWwgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgXG4gKiAgICAgICAgICAgICAgICAgICAgIGlmKCBlbWFpbCA9PT0gXCJteUBvd24uYWRkcmVzc1wiICkge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAgLy8gZG9uJ3QgYXV0by1saW5rIHRoaXMgcGFydGljdWxhciBlbWFpbCBhZGRyZXNzOyBsZWF2ZSBhcy1pc1xuICogICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAgLy8gbm8gcmV0dXJuIHZhbHVlIHdpbGwgaGF2ZSBBdXRvbGlua2VyIHBlcmZvcm0gaXRzIG5vcm1hbCBhbmNob3IgdGFnIHJlcGxhY2VtZW50IChzYW1lIGFzIHJldHVybmluZyBgdHJ1ZWApXG4gKiAgICAgICAgICAgICAgICAgICAgIH1cbiAqICAgICAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciB0d2l0dGVySGFuZGxlID0gbWF0Y2guZ2V0VHdpdHRlckhhbmRsZSgpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggdHdpdHRlckhhbmRsZSApO1xuICogICAgICAgICAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsudHdpdHRlci5oYW5kbGVzLnRvL1wiPicgKyB0d2l0dGVySGFuZGxlICsgJzwvYT4nO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICogXG4gKiBcbiAqIFRoZSBmdW5jdGlvbiBtYXkgcmV0dXJuIHRoZSBmb2xsb3dpbmcgdmFsdWVzOlxuICogXG4gKiAtIGB0cnVlYCAoQm9vbGVhbik6IEFsbG93IEF1dG9saW5rZXIgdG8gcmVwbGFjZSB0aGUgbWF0Y2ggYXMgaXQgbm9ybWFsbHkgd291bGQuXG4gKiAtIGBmYWxzZWAgKEJvb2xlYW4pOiBEbyBub3QgcmVwbGFjZSB0aGUgY3VycmVudCBtYXRjaCBhdCBhbGwgLSBsZWF2ZSBhcy1pcy5cbiAqIC0gQW55IFN0cmluZzogSWYgYSBzdHJpbmcgaXMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24sIHRoZSBzdHJpbmcgd2lsbCBiZSB1c2VkIGRpcmVjdGx5IGFzIHRoZSByZXBsYWNlbWVudCBIVE1MIGZvclxuICogICB0aGUgbWF0Y2guXG4gKiAtIEFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlLCB3aGljaCBjYW4gYmUgdXNlZCB0byBidWlsZC9tb2RpZnkgYW4gSFRNTCB0YWcgYmVmb3JlIHdyaXRpbmcgb3V0IGl0cyBIVE1MIHRleHQuXG4gKiBcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWddIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBdXRvbGlua2VyIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuICovXG52YXIgQXV0b2xpbmtlciA9IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApOyAgLy8gYXNzaWduIHRoZSBwcm9wZXJ0aWVzIG9mIGBjZmdgIG9udG8gdGhlIEF1dG9saW5rZXIgaW5zdGFuY2UuIFByb3RvdHlwZSBwcm9wZXJ0aWVzIHdpbGwgYmUgdXNlZCBmb3IgbWlzc2luZyBjb25maWdzLlxufTtcblxuXG5BdXRvbGlua2VyLnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3IgOiBBdXRvbGlua2VyLCAgLy8gZml4IGNvbnN0cnVjdG9yIHByb3BlcnR5XG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gdXJsc1xuXHQgKiBcblx0ICogYHRydWVgIGlmIG1pc2NlbGxhbmVvdXMgVVJMcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0dXJscyA6IHRydWUsXG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gZW1haWxcblx0ICogXG5cdCAqIGB0cnVlYCBpZiBlbWFpbCBhZGRyZXNzZXMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLCBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdGVtYWlsIDogdHJ1ZSxcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB0d2l0dGVyXG5cdCAqIFxuXHQgKiBgdHJ1ZWAgaWYgVHdpdHRlciBoYW5kbGVzIChcIkBleGFtcGxlXCIpIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHR0d2l0dGVyIDogdHJ1ZSxcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBuZXdXaW5kb3dcblx0ICogXG5cdCAqIGB0cnVlYCBpZiB0aGUgbGlua3Mgc2hvdWxkIG9wZW4gaW4gYSBuZXcgd2luZG93LCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdG5ld1dpbmRvdyA6IHRydWUsXG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXhcblx0ICogXG5cdCAqIGB0cnVlYCBpZiAnaHR0cDovLycgb3IgJ2h0dHBzOi8vJyBhbmQvb3IgdGhlICd3d3cuJyBzaG91bGQgYmUgc3RyaXBwZWQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIFVSTCBsaW5rcycgdGV4dCwgXG5cdCAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0c3RyaXBQcmVmaXggOiB0cnVlLFxuXHRcblx0LyoqXG5cdCAqIEBjZmcge051bWJlcn0gdHJ1bmNhdGVcblx0ICogXG5cdCAqIEEgbnVtYmVyIGZvciBob3cgbWFueSBjaGFyYWN0ZXJzIGxvbmcgVVJMcy9lbWFpbHMvdHdpdHRlciBoYW5kbGVzIHNob3VsZCBiZSB0cnVuY2F0ZWQgdG8gaW5zaWRlIHRoZSB0ZXh0IG9mIFxuXHQgKiBhIGxpbmsuIElmIHRoZSBVUkwvZW1haWwvdHdpdHRlciBpcyBvdmVyIHRoaXMgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIGl0IHdpbGwgYmUgdHJ1bmNhdGVkIHRvIHRoaXMgbGVuZ3RoIGJ5IFxuXHQgKiBhZGRpbmcgYSB0d28gcGVyaW9kIGVsbGlwc2lzICgnLi4nKSB0byB0aGUgZW5kIG9mIHRoZSBzdHJpbmcuXG5cdCAqIFxuXHQgKiBGb3IgZXhhbXBsZTogQSB1cmwgbGlrZSAnaHR0cDovL3d3dy55YWhvby5jb20vc29tZS9sb25nL3BhdGgvdG8vYS9maWxlJyB0cnVuY2F0ZWQgdG8gMjUgY2hhcmFjdGVycyBtaWdodCBsb29rXG5cdCAqIHNvbWV0aGluZyBsaWtlIHRoaXM6ICd5YWhvby5jb20vc29tZS9sb25nL3BhdC4uJ1xuXHQgKi9cblx0dHJ1bmNhdGUgOiB1bmRlZmluZWQsXG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjbGFzc05hbWVcblx0ICogXG5cdCAqIEEgQ1NTIGNsYXNzIG5hbWUgdG8gYWRkIHRvIHRoZSBnZW5lcmF0ZWQgbGlua3MuIFRoaXMgY2xhc3Mgd2lsbCBiZSBhZGRlZCB0byBhbGwgbGlua3MsIGFzIHdlbGwgYXMgdGhpcyBjbGFzc1xuXHQgKiBwbHVzIHVybC9lbWFpbC90d2l0dGVyIHN1ZmZpeGVzIGZvciBzdHlsaW5nIHVybC9lbWFpbC90d2l0dGVyIGxpbmtzIGRpZmZlcmVudGx5LlxuXHQgKiBcblx0ICogRm9yIGV4YW1wbGUsIGlmIHRoaXMgY29uZmlnIGlzIHByb3ZpZGVkIGFzIFwibXlMaW5rXCIsIHRoZW46XG5cdCAqIFxuXHQgKiAtIFVSTCBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstdXJsXCJcblx0ICogLSBFbWFpbCBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstZW1haWxcIiwgYW5kXG5cdCAqIC0gVHdpdHRlciBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstdHdpdHRlclwiXG5cdCAqL1xuXHRjbGFzc05hbWUgOiBcIlwiLFxuXHRcblx0LyoqXG5cdCAqIEBjZmcge0Z1bmN0aW9ufSByZXBsYWNlRm5cblx0ICogXG5cdCAqIEEgZnVuY3Rpb24gdG8gaW5kaXZpZHVhbGx5IHByb2Nlc3MgZWFjaCBVUkwvRW1haWwvVHdpdHRlciBtYXRjaCBmb3VuZCBpbiB0aGUgaW5wdXQgc3RyaW5nLlxuXHQgKiBcblx0ICogU2VlIHRoZSBjbGFzcydzIGRlc2NyaXB0aW9uIGZvciB1c2FnZS5cblx0ICogXG5cdCAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuXHQgKiBcblx0ICogQGNmZyB7QXV0b2xpbmtlcn0gcmVwbGFjZUZuLmF1dG9saW5rZXIgVGhlIEF1dG9saW5rZXIgaW5zdGFuY2UsIHdoaWNoIG1heSBiZSB1c2VkIHRvIHJldHJpZXZlIGNoaWxkIG9iamVjdHMgZnJvbSAoc3VjaFxuXHQgKiAgIGFzIHRoZSBpbnN0YW5jZSdzIHtAbGluayAjZ2V0VGFnQnVpbGRlciB0YWcgYnVpbGRlcn0pLlxuXHQgKiBAY2ZnIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSByZXBsYWNlRm4ubWF0Y2ggVGhlIE1hdGNoIGluc3RhbmNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZVxuXHQgKiAgIHtAbGluayBBdXRvbGlua2VyLm1hdGNoLlVybCBVUkx9L3tAbGluayBBdXRvbGlua2VyLm1hdGNoLkVtYWlsIGVtYWlsfS97QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyIFR3aXR0ZXJ9XG5cdCAqICAgbWF0Y2ggdGhhdCB0aGUgYHJlcGxhY2VGbmAgaXMgY3VycmVudGx5IHByb2Nlc3NpbmcuXG5cdCAqL1xuXHRcblx0XG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfSBodG1sUGFyc2VyXG5cdCAqIFxuXHQgKiBUaGUgSHRtbFBhcnNlciBpbnN0YW5jZSB1c2VkIHRvIHNraXAgb3ZlciBIVE1MIHRhZ3MsIHdoaWxlIGZpbmRpbmcgdGV4dCBub2RlcyB0byBwcm9jZXNzLiBUaGlzIGlzIGxhemlseSBpbnN0YW50aWF0ZWRcblx0ICogaW4gdGhlIHtAbGluayAjZ2V0SHRtbFBhcnNlcn0gbWV0aG9kLlxuXHQgKi9cblx0aHRtbFBhcnNlciA6IHVuZGVmaW5lZCxcblx0XG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJ9IG1hdGNoUGFyc2VyXG5cdCAqIFxuXHQgKiBUaGUgTWF0Y2hQYXJzZXIgaW5zdGFuY2UgdXNlZCB0byBmaW5kIFVSTC9lbWFpbC9Ud2l0dGVyIG1hdGNoZXMgaW4gdGhlIHRleHQgbm9kZXMgb2YgYW4gaW5wdXQgc3RyaW5nIHBhc3NlZCB0b1xuXHQgKiB7QGxpbmsgI2xpbmt9LiBUaGlzIGlzIGxhemlseSBpbnN0YW50aWF0ZWQgaW4gdGhlIHtAbGluayAjZ2V0TWF0Y2hQYXJzZXJ9IG1ldGhvZC5cblx0ICovXG5cdG1hdGNoUGFyc2VyIDogdW5kZWZpbmVkLFxuXHRcblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyfSB0YWdCdWlsZGVyXG5cdCAqIFxuXHQgKiBUaGUgQW5jaG9yVGFnQnVpbGRlciBpbnN0YW5jZSB1c2VkIHRvIGJ1aWxkIHRoZSBVUkwvZW1haWwvVHdpdHRlciByZXBsYWNlbWVudCBhbmNob3IgdGFncy4gVGhpcyBpcyBsYXppbHkgaW5zdGFudGlhdGVkXG5cdCAqIGluIHRoZSB7QGxpbmsgI2dldFRhZ0J1aWxkZXJ9IG1ldGhvZC5cblx0ICovXG5cdHRhZ0J1aWxkZXIgOiB1bmRlZmluZWQsXG5cdFxuXHRcblx0LyoqXG5cdCAqIEF1dG9tYXRpY2FsbHkgbGlua3MgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBhbmQgVHdpdHRlciBoYW5kbGVzIGZvdW5kIGluIHRoZSBnaXZlbiBjaHVuayBvZiBIVE1MLiBcblx0ICogRG9lcyBub3QgbGluayBVUkxzIGZvdW5kIHdpdGhpbiBIVE1MIHRhZ3MuXG5cdCAqIFxuXHQgKiBGb3IgaW5zdGFuY2UsIGlmIGdpdmVuIHRoZSB0ZXh0OiBgWW91IHNob3VsZCBnbyB0byBodHRwOi8vd3d3LnlhaG9vLmNvbWAsIHRoZW4gdGhlIHJlc3VsdFxuXHQgKiB3aWxsIGJlIGBZb3Ugc2hvdWxkIGdvIHRvICZsdDthIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiJmd0O2h0dHA6Ly93d3cueWFob28uY29tJmx0Oy9hJmd0O2Bcblx0ICogXG5cdCAqIFRoaXMgbWV0aG9kIGZpbmRzIHRoZSB0ZXh0IGFyb3VuZCBhbnkgSFRNTCBlbGVtZW50cyBpbiB0aGUgaW5wdXQgYHRleHRPckh0bWxgLCB3aGljaCB3aWxsIGJlIHRoZSB0ZXh0IHRoYXQgaXMgcHJvY2Vzc2VkLlxuXHQgKiBBbnkgb3JpZ2luYWwgSFRNTCBlbGVtZW50cyB3aWxsIGJlIGxlZnQgYXMtaXMsIGFzIHdlbGwgYXMgdGhlIHRleHQgdGhhdCBpcyBhbHJlYWR5IHdyYXBwZWQgaW4gYW5jaG9yICgmbHQ7YSZndDspIHRhZ3MuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dE9ySHRtbCBUaGUgSFRNTCBvciB0ZXh0IHRvIGxpbmsgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBhbmQgVHdpdHRlciBoYW5kbGVzIHdpdGhpbiAoZGVwZW5kaW5nIG9uIGlmXG5cdCAqICAgdGhlIHtAbGluayAjdXJsc30sIHtAbGluayAjZW1haWx9LCBhbmQge0BsaW5rICN0d2l0dGVyfSBvcHRpb25zIGFyZSBlbmFibGVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCwgd2l0aCBVUkxzL2VtYWlscy9Ud2l0dGVyIGhhbmRsZXMgYXV0b21hdGljYWxseSBsaW5rZWQuXG5cdCAqL1xuXHRsaW5rIDogZnVuY3Rpb24oIHRleHRPckh0bWwgKSB7XG5cdFx0dmFyIGh0bWxQYXJzZXIgPSB0aGlzLmdldEh0bWxQYXJzZXIoKSxcblx0XHQgICAgaHRtbE5vZGVzID0gaHRtbFBhcnNlci5wYXJzZSggdGV4dE9ySHRtbCApLFxuXHRcdCAgICBhbmNob3JUYWdTdGFja0NvdW50ID0gMCwgIC8vIHVzZWQgdG8gb25seSBwcm9jZXNzIHRleHQgYXJvdW5kIGFuY2hvciB0YWdzLCBhbmQgYW55IGlubmVyIHRleHQvaHRtbCB0aGV5IG1heSBoYXZlXG5cdFx0ICAgIHJlc3VsdEh0bWwgPSBbXTtcblx0XHRcblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gaHRtbE5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0dmFyIG5vZGUgPSBodG1sTm9kZXNbIGkgXSxcblx0XHRcdCAgICBub2RlVHlwZSA9IG5vZGUuZ2V0VHlwZSgpLFxuXHRcdFx0ICAgIG5vZGVUZXh0ID0gbm9kZS5nZXRUZXh0KCk7XG5cdFx0XHRcblx0XHRcdGlmKCBub2RlVHlwZSA9PT0gJ2VsZW1lbnQnICkge1xuXHRcdFx0XHQvLyBQcm9jZXNzIEhUTUwgbm9kZXMgaW4gdGhlIGlucHV0IGB0ZXh0T3JIdG1sYFxuXHRcdFx0XHRpZiggbm9kZS5nZXRUYWdOYW1lKCkgPT09ICdhJyApIHtcblx0XHRcdFx0XHRpZiggIW5vZGUuaXNDbG9zaW5nKCkgKSB7ICAvLyBpdCdzIHRoZSBzdGFydCA8YT4gdGFnXG5cdFx0XHRcdFx0XHRhbmNob3JUYWdTdGFja0NvdW50Kys7XG5cdFx0XHRcdFx0fSBlbHNlIHsgICAvLyBpdCdzIHRoZSBlbmQgPC9hPiB0YWdcblx0XHRcdFx0XHRcdGFuY2hvclRhZ1N0YWNrQ291bnQgPSBNYXRoLm1heCggYW5jaG9yVGFnU3RhY2tDb3VudCAtIDEsIDAgKTsgIC8vIGF0dGVtcHQgdG8gaGFuZGxlIGV4dHJhbmVvdXMgPC9hPiB0YWdzIGJ5IG1ha2luZyBzdXJlIHRoZSBzdGFjayBjb3VudCBuZXZlciBnb2VzIGJlbG93IDBcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBub2RlVGV4dCApOyAgLy8gbm93IGFkZCB0aGUgdGV4dCBvZiB0aGUgdGFnIGl0c2VsZiB2ZXJiYXRpbVxuXHRcdFx0XHRcblx0XHRcdH0gZWxzZSBpZiggbm9kZVR5cGUgPT09ICdlbnRpdHknICkge1xuXHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIG5vZGVUZXh0ICk7ICAvLyBhcHBlbmQgSFRNTCBlbnRpdHkgbm9kZXMgKHN1Y2ggYXMgJyZuYnNwOycpIHZlcmJhdGltXG5cdFx0XHRcdFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyB0ZXh0IG5vZGVzIGluIHRoZSBpbnB1dCBgdGV4dE9ySHRtbGBcblx0XHRcdFx0aWYoIGFuY2hvclRhZ1N0YWNrQ291bnQgPT09IDAgKSB7XG5cdFx0XHRcdFx0Ly8gSWYgd2UncmUgbm90IHdpdGhpbiBhbiA8YT4gdGFnLCBwcm9jZXNzIHRoZSB0ZXh0IG5vZGUgdG8gbGlua2lmeVxuXHRcdFx0XHRcdHZhciBsaW5raWZpZWRTdHIgPSB0aGlzLmxpbmtpZnlTdHIoIG5vZGVUZXh0ICk7XG5cdFx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBsaW5raWZpZWRTdHIgKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBgdGV4dGAgaXMgd2l0aGluIGFuIDxhPiB0YWcsIHNpbXBseSBhcHBlbmQgdGhlIHRleHQgLSB3ZSBkbyBub3Qgd2FudCB0byBhdXRvbGluayBhbnl0aGluZyBcblx0XHRcdFx0XHQvLyBhbHJlYWR5IHdpdGhpbiBhbiA8YT4uLi48L2E+IHRhZ1xuXHRcdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbm9kZVRleHQgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gcmVzdWx0SHRtbC5qb2luKCBcIlwiICk7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFByb2Nlc3MgdGhlIHRleHQgdGhhdCBsaWVzIGluIGJldHdlZW4gSFRNTCB0YWdzLCBwZXJmb3JtaW5nIHRoZSBhbmNob3IgdGFnIHJlcGxhY2VtZW50cyBmb3IgbWF0Y2hlZCBcblx0ICogVVJMcy9lbWFpbHMvVHdpdHRlciBoYW5kbGVzLCBhbmQgcmV0dXJucyB0aGUgc3RyaW5nIHdpdGggdGhlIHJlcGxhY2VtZW50cyBtYWRlLiBcblx0ICogXG5cdCAqIFRoaXMgbWV0aG9kIGRvZXMgdGhlIGFjdHVhbCB3cmFwcGluZyBvZiBVUkxzL2VtYWlscy9Ud2l0dGVyIGhhbmRsZXMgd2l0aCBhbmNob3IgdGFncy5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyBvZiB0ZXh0IHRvIGF1dG8tbGluay5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgdGV4dCB3aXRoIGFuY2hvciB0YWdzIGF1dG8tZmlsbGVkLlxuXHQgKi9cblx0bGlua2lmeVN0ciA6IGZ1bmN0aW9uKCBzdHIgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TWF0Y2hQYXJzZXIoKS5yZXBsYWNlKCBzdHIsIHRoaXMuY3JlYXRlTWF0Y2hSZXR1cm5WYWwsIHRoaXMgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgcmV0dXJuIHN0cmluZyB2YWx1ZSBmb3IgYSBnaXZlbiBtYXRjaCBpbiB0aGUgaW5wdXQgc3RyaW5nLCBmb3IgdGhlIHtAbGluayAjcHJvY2Vzc1RleHROb2RlfSBtZXRob2QuXG5cdCAqIFxuXHQgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSB7QGxpbmsgI3JlcGxhY2VGbn0sIGlmIG9uZSB3YXMgcHJvdmlkZWQuXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IG1hdGNoIFRoZSBNYXRjaCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBtYXRjaC5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgc3RyaW5nIHRoYXQgdGhlIGBtYXRjaGAgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGguIFRoaXMgaXMgdXN1YWxseSB0aGUgYW5jaG9yIHRhZyBzdHJpbmcsIGJ1dFxuXHQgKiAgIG1heSBiZSB0aGUgYG1hdGNoU3RyYCBpdHNlbGYgaWYgdGhlIG1hdGNoIGlzIG5vdCB0byBiZSByZXBsYWNlZC5cblx0ICovXG5cdGNyZWF0ZU1hdGNoUmV0dXJuVmFsIDogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdC8vIEhhbmRsZSBhIGN1c3RvbSBgcmVwbGFjZUZuYCBiZWluZyBwcm92aWRlZFxuXHRcdHZhciByZXBsYWNlRm5SZXN1bHQ7XG5cdFx0aWYoIHRoaXMucmVwbGFjZUZuICkge1xuXHRcdFx0cmVwbGFjZUZuUmVzdWx0ID0gdGhpcy5yZXBsYWNlRm4uY2FsbCggdGhpcywgdGhpcywgbWF0Y2ggKTsgIC8vIEF1dG9saW5rZXIgaW5zdGFuY2UgaXMgdGhlIGNvbnRleHQsIGFuZCB0aGUgZmlyc3QgYXJnXG5cdFx0fVxuXHRcdFxuXHRcdGlmKCB0eXBlb2YgcmVwbGFjZUZuUmVzdWx0ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdHJldHVybiByZXBsYWNlRm5SZXN1bHQ7ICAvLyBgcmVwbGFjZUZuYCByZXR1cm5lZCBhIHN0cmluZywgdXNlIHRoYXRcblx0XHRcdFxuXHRcdH0gZWxzZSBpZiggcmVwbGFjZUZuUmVzdWx0ID09PSBmYWxzZSApIHtcblx0XHRcdHJldHVybiBtYXRjaC5nZXRNYXRjaGVkVGV4dCgpOyAgLy8gbm8gcmVwbGFjZW1lbnQgZm9yIHRoZSBtYXRjaFxuXHRcdFx0XG5cdFx0fSBlbHNlIGlmKCByZXBsYWNlRm5SZXN1bHQgaW5zdGFuY2VvZiBBdXRvbGlua2VyLkh0bWxUYWcgKSB7XG5cdFx0XHRyZXR1cm4gcmVwbGFjZUZuUmVzdWx0LnRvU3RyaW5nKCk7XG5cdFx0XG5cdFx0fSBlbHNlIHsgIC8vIHJlcGxhY2VGblJlc3VsdCA9PT0gdHJ1ZSwgb3Igbm8vdW5rbm93biByZXR1cm4gdmFsdWUgZnJvbSBmdW5jdGlvblxuXHRcdFx0Ly8gUGVyZm9ybSBBdXRvbGlua2VyJ3MgZGVmYXVsdCBhbmNob3IgdGFnIGdlbmVyYXRpb25cblx0XHRcdHZhciB0YWdCdWlsZGVyID0gdGhpcy5nZXRUYWdCdWlsZGVyKCksXG5cdFx0XHQgICAgYW5jaG9yVGFnID0gdGFnQnVpbGRlci5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4gQXV0b2xpbmtlci5IdG1sVGFnIGluc3RhbmNlXG5cdFx0XHRcblx0XHRcdHJldHVybiBhbmNob3JUYWcudG9TdHJpbmcoKTtcblx0XHR9XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIExhemlseSBpbnN0YW50aWF0ZXMgYW5kIHJldHVybnMgdGhlIHtAbGluayAjaHRtbFBhcnNlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZS5cblx0ICogXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9XG5cdCAqL1xuXHRnZXRIdG1sUGFyc2VyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGh0bWxQYXJzZXIgPSB0aGlzLmh0bWxQYXJzZXI7XG5cdFx0XG5cdFx0aWYoICFodG1sUGFyc2VyICkge1xuXHRcdFx0aHRtbFBhcnNlciA9IHRoaXMuaHRtbFBhcnNlciA9IG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcigpO1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gaHRtbFBhcnNlcjtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogTGF6aWx5IGluc3RhbnRpYXRlcyBhbmQgcmV0dXJucyB0aGUge0BsaW5rICNtYXRjaFBhcnNlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZS5cblx0ICogXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlcn1cblx0ICovXG5cdGdldE1hdGNoUGFyc2VyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1hdGNoUGFyc2VyID0gdGhpcy5tYXRjaFBhcnNlcjtcblx0XHRcblx0XHRpZiggIW1hdGNoUGFyc2VyICkge1xuXHRcdFx0bWF0Y2hQYXJzZXIgPSB0aGlzLm1hdGNoUGFyc2VyID0gbmV3IEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIoIHtcblx0XHRcdFx0dXJscyA6IHRoaXMudXJscyxcblx0XHRcdFx0ZW1haWwgOiB0aGlzLmVtYWlsLFxuXHRcdFx0XHR0d2l0dGVyIDogdGhpcy50d2l0dGVyLFxuXHRcdFx0XHRzdHJpcFByZWZpeCA6IHRoaXMuc3RyaXBQcmVmaXhcblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIG1hdGNoUGFyc2VyO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB7QGxpbmsgI3RhZ0J1aWxkZXJ9IGluc3RhbmNlIGZvciB0aGlzIEF1dG9saW5rZXIgaW5zdGFuY2UsIGxhemlseSBpbnN0YW50aWF0aW5nIGl0XG5cdCAqIGlmIGl0IGRvZXMgbm90IHlldCBleGlzdC5cblx0ICogXG5cdCAqIFRoaXMgbWV0aG9kIG1heSBiZSB1c2VkIGluIGEge0BsaW5rICNyZXBsYWNlRm59IHRvIGdlbmVyYXRlIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnIEh0bWxUYWd9IGluc3RhbmNlIHRoYXQgXG5cdCAqIEF1dG9saW5rZXIgd291bGQgbm9ybWFsbHkgZ2VuZXJhdGUsIGFuZCB0aGVuIGFsbG93IGZvciBtb2RpZmljYXRpb25zIGJlZm9yZSByZXR1cm5pbmcgaXQuIEZvciBleGFtcGxlOlxuXHQgKiBcblx0ICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG5cdCAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuXHQgKiAgICAgICAgICAgICB2YXIgdGFnID0gYXV0b2xpbmtlci5nZXRUYWdCdWlsZGVyKCkuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlXG5cdCAqICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuXHQgKiAgICAgICAgICAgICBcblx0ICogICAgICAgICAgICAgcmV0dXJuIHRhZztcblx0ICogICAgICAgICB9XG5cdCAqICAgICB9ICk7XG5cdCAqICAgICBcblx0ICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuXHQgKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cblx0ICogXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcn1cblx0ICovXG5cdGdldFRhZ0J1aWxkZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGFnQnVpbGRlciA9IHRoaXMudGFnQnVpbGRlcjtcblx0XHRcblx0XHRpZiggIXRhZ0J1aWxkZXIgKSB7XG5cdFx0XHR0YWdCdWlsZGVyID0gdGhpcy50YWdCdWlsZGVyID0gbmV3IEF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcigge1xuXHRcdFx0XHRuZXdXaW5kb3cgICA6IHRoaXMubmV3V2luZG93LFxuXHRcdFx0XHR0cnVuY2F0ZSAgICA6IHRoaXMudHJ1bmNhdGUsXG5cdFx0XHRcdGNsYXNzTmFtZSAgIDogdGhpcy5jbGFzc05hbWVcblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHRhZ0J1aWxkZXI7XG5cdH1cblxufTtcblxuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgbGlua3MgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBhbmQgVHdpdHRlciBoYW5kbGVzIGZvdW5kIGluIHRoZSBnaXZlbiBjaHVuayBvZiBIVE1MLiBcbiAqIERvZXMgbm90IGxpbmsgVVJMcyBmb3VuZCB3aXRoaW4gSFRNTCB0YWdzLlxuICogXG4gKiBGb3IgaW5zdGFuY2UsIGlmIGdpdmVuIHRoZSB0ZXh0OiBgWW91IHNob3VsZCBnbyB0byBodHRwOi8vd3d3LnlhaG9vLmNvbWAsIHRoZW4gdGhlIHJlc3VsdFxuICogd2lsbCBiZSBgWW91IHNob3VsZCBnbyB0byAmbHQ7YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIiZndDtodHRwOi8vd3d3LnlhaG9vLmNvbSZsdDsvYSZndDtgXG4gKiBcbiAqIEV4YW1wbGU6XG4gKiBcbiAqICAgICB2YXIgbGlua2VkVGV4dCA9IEF1dG9saW5rZXIubGluayggXCJHbyB0byBnb29nbGUuY29tXCIsIHsgbmV3V2luZG93OiBmYWxzZSB9ICk7XG4gKiAgICAgLy8gUHJvZHVjZXM6IFwiR28gdG8gPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCI+Z29vZ2xlLmNvbTwvYT5cIlxuICogXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dE9ySHRtbCBUaGUgSFRNTCBvciB0ZXh0IHRvIGZpbmQgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBhbmQgVHdpdHRlciBoYW5kbGVzIHdpdGhpbiAoZGVwZW5kaW5nIG9uIGlmXG4gKiAgIHRoZSB7QGxpbmsgI3VybHN9LCB7QGxpbmsgI2VtYWlsfSwgYW5kIHtAbGluayAjdHdpdHRlcn0gb3B0aW9ucyBhcmUgZW5hYmxlZCkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIEFueSBvZiB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQXV0b2xpbmtlciBjbGFzcywgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cbiAqICAgU2VlIHRoZSBjbGFzcyBkZXNjcmlwdGlvbiBmb3IgYW4gZXhhbXBsZSBjYWxsLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCB0ZXh0LCB3aXRoIFVSTHMgYXV0b21hdGljYWxseSBsaW5rZWRcbiAqL1xuQXV0b2xpbmtlci5saW5rID0gZnVuY3Rpb24oIHRleHRPckh0bWwsIG9wdGlvbnMgKSB7XG5cdHZhciBhdXRvbGlua2VyID0gbmV3IEF1dG9saW5rZXIoIG9wdGlvbnMgKTtcblx0cmV0dXJuIGF1dG9saW5rZXIubGluayggdGV4dE9ySHRtbCApO1xufTtcblxuXG4vLyBBdXRvbGlua2VyIE5hbWVzcGFjZXNcbkF1dG9saW5rZXIubWF0Y2ggPSB7fTtcbkF1dG9saW5rZXIuaHRtbFBhcnNlciA9IHt9O1xuQXV0b2xpbmtlci5tYXRjaFBhcnNlciA9IHt9O1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgZXFudWxsOnRydWUsIGJvc3M6dHJ1ZSAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5VdGlsXG4gKiBAc2luZ2xldG9uXG4gKiBcbiAqIEEgZmV3IHV0aWxpdHkgbWV0aG9kcyBmb3IgQXV0b2xpbmtlci5cbiAqL1xuQXV0b2xpbmtlci5VdGlsID0ge1xuXHRcblx0LyoqXG5cdCAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGFic3RyYWN0TWV0aG9kXG5cdCAqIFxuXHQgKiBBIGZ1bmN0aW9uIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGFuIGFic3RyYWN0IG1ldGhvZC5cblx0ICovXG5cdGFic3RyYWN0TWV0aG9kIDogZnVuY3Rpb24oKSB7IHRocm93IFwiYWJzdHJhY3RcIjsgfSxcblx0XG5cdFxuXHQvKipcblx0ICogQXNzaWducyAoc2hhbGxvdyBjb3BpZXMpIHRoZSBwcm9wZXJ0aWVzIG9mIGBzcmNgIG9udG8gYGRlc3RgLlxuXHQgKiBcblx0ICogQHBhcmFtIHtPYmplY3R9IGRlc3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cblx0ICogQHBhcmFtIHtPYmplY3R9IHNyYyBUaGUgc291cmNlIG9iamVjdC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZGVzdGluYXRpb24gb2JqZWN0IChgZGVzdGApXG5cdCAqL1xuXHRhc3NpZ24gOiBmdW5jdGlvbiggZGVzdCwgc3JjICkge1xuXHRcdGZvciggdmFyIHByb3AgaW4gc3JjICkge1xuXHRcdFx0aWYoIHNyYy5oYXNPd25Qcm9wZXJ0eSggcHJvcCApICkge1xuXHRcdFx0XHRkZXN0WyBwcm9wIF0gPSBzcmNbIHByb3AgXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGRlc3Q7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIEV4dGVuZHMgYHN1cGVyY2xhc3NgIHRvIGNyZWF0ZSBhIG5ldyBzdWJjbGFzcywgYWRkaW5nIHRoZSBgcHJvdG9Qcm9wc2AgdG8gdGhlIG5ldyBzdWJjbGFzcydzIHByb3RvdHlwZS5cblx0ICogXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHN1cGVyY2xhc3MgVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgc3VwZXJjbGFzcy5cblx0ICogQHBhcmFtIHtPYmplY3R9IHByb3RvUHJvcHMgVGhlIG1ldGhvZHMvcHJvcGVydGllcyB0byBhZGQgdG8gdGhlIHN1YmNsYXNzJ3MgcHJvdG90eXBlLiBUaGlzIG1heSBjb250YWluIHRoZVxuXHQgKiAgIHNwZWNpYWwgcHJvcGVydHkgYGNvbnN0cnVjdG9yYCwgd2hpY2ggd2lsbCBiZSB1c2VkIGFzIHRoZSBuZXcgc3ViY2xhc3MncyBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBuZXcgc3ViY2xhc3MgZnVuY3Rpb24uXG5cdCAqL1xuXHRleHRlbmQgOiBmdW5jdGlvbiggc3VwZXJjbGFzcywgcHJvdG9Qcm9wcyApIHtcblx0XHR2YXIgc3VwZXJjbGFzc1Byb3RvID0gc3VwZXJjbGFzcy5wcm90b3R5cGU7XG5cdFx0XG5cdFx0dmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHRcdEYucHJvdG90eXBlID0gc3VwZXJjbGFzc1Byb3RvO1xuXHRcdFxuXHRcdHZhciBzdWJjbGFzcztcblx0XHRpZiggcHJvdG9Qcm9wcy5oYXNPd25Qcm9wZXJ0eSggJ2NvbnN0cnVjdG9yJyApICkge1xuXHRcdFx0c3ViY2xhc3MgPSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdWJjbGFzcyA9IGZ1bmN0aW9uKCkgeyBzdXBlcmNsYXNzUHJvdG8uY29uc3RydWN0b3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApOyB9O1xuXHRcdH1cblx0XHRcblx0XHR2YXIgc3ViY2xhc3NQcm90byA9IHN1YmNsYXNzLnByb3RvdHlwZSA9IG5ldyBGKCk7ICAvLyBzZXQgdXAgcHJvdG90eXBlIGNoYWluXG5cdFx0c3ViY2xhc3NQcm90by5jb25zdHJ1Y3RvciA9IHN1YmNsYXNzOyAgLy8gZml4IGNvbnN0cnVjdG9yIHByb3BlcnR5XG5cdFx0c3ViY2xhc3NQcm90by5zdXBlcmNsYXNzID0gc3VwZXJjbGFzc1Byb3RvO1xuXHRcdFxuXHRcdGRlbGV0ZSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yOyAgLy8gZG9uJ3QgcmUtYXNzaWduIGNvbnN0cnVjdG9yIHByb3BlcnR5IHRvIHRoZSBwcm90b3R5cGUsIHNpbmNlIGEgbmV3IGZ1bmN0aW9uIG1heSBoYXZlIGJlZW4gY3JlYXRlZCAoYHN1YmNsYXNzYCksIHdoaWNoIGlzIG5vdyBhbHJlYWR5IHRoZXJlXG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggc3ViY2xhc3NQcm90bywgcHJvdG9Qcm9wcyApO1xuXHRcdFxuXHRcdHJldHVybiBzdWJjbGFzcztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogVHJ1bmNhdGVzIHRoZSBgc3RyYCBhdCBgbGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGhgLCBhbmQgYWRkcyB0aGUgYGVsbGlwc2lzQ2hhcnNgIHRvIHRoZVxuXHQgKiBlbmQgb2YgdGhlIHN0cmluZyAoYnkgZGVmYXVsdCwgdHdvIHBlcmlvZHM6ICcuLicpLiBJZiB0aGUgYHN0cmAgbGVuZ3RoIGRvZXMgbm90IGV4Y2VlZCBcblx0ICogYGxlbmAsIHRoZSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCB1bmNoYW5nZWQuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gdHJ1bmNhdGUgYW5kIGFkZCBhbiBlbGxpcHNpcyB0by5cblx0ICogQHBhcmFtIHtOdW1iZXJ9IHRydW5jYXRlTGVuIFRoZSBsZW5ndGggdG8gdHJ1bmNhdGUgdGhlIHN0cmluZyBhdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IFtlbGxpcHNpc0NoYXJzPS4uXSBUaGUgZWxsaXBzaXMgY2hhcmFjdGVyKHMpIHRvIGFkZCB0byB0aGUgZW5kIG9mIGBzdHJgXG5cdCAqICAgd2hlbiB0cnVuY2F0ZWQuIERlZmF1bHRzIHRvICcuLidcblx0ICovXG5cdGVsbGlwc2lzIDogZnVuY3Rpb24oIHN0ciwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMgKSB7XG5cdFx0aWYoIHN0ci5sZW5ndGggPiB0cnVuY2F0ZUxlbiApIHtcblx0XHRcdGVsbGlwc2lzQ2hhcnMgPSAoIGVsbGlwc2lzQ2hhcnMgPT0gbnVsbCApID8gJy4uJyA6IGVsbGlwc2lzQ2hhcnM7XG5cdFx0XHRzdHIgPSBzdHIuc3Vic3RyaW5nKCAwLCB0cnVuY2F0ZUxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoICkgKyBlbGxpcHNpc0NoYXJzO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBTdXBwb3J0cyBgQXJyYXkucHJvdG90eXBlLmluZGV4T2YoKWAgZnVuY3Rpb25hbGl0eSBmb3Igb2xkIElFIChJRTggYW5kIGJlbG93KS5cblx0ICogXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFyciBUaGUgYXJyYXkgdG8gZmluZCBhbiBlbGVtZW50IG9mLlxuXHQgKiBAcGFyYW0geyp9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZmluZCBpbiB0aGUgYXJyYXksIGFuZCByZXR1cm4gdGhlIGluZGV4IG9mLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgYGVsZW1lbnRgLCBvciAtMSBpZiBpdCB3YXMgbm90IGZvdW5kLlxuXHQgKi9cblx0aW5kZXhPZiA6IGZ1bmN0aW9uKCBhcnIsIGVsZW1lbnQgKSB7XG5cdFx0aWYoIEFycmF5LnByb3RvdHlwZS5pbmRleE9mICkge1xuXHRcdFx0cmV0dXJuIGFyci5pbmRleE9mKCBlbGVtZW50ICk7XG5cdFx0XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0aWYoIGFyclsgaSBdID09PSBlbGVtZW50ICkgcmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXHR9LFxuXHRcblx0XG5cdFxuXHQvKipcblx0ICogUGVyZm9ybXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2Ygd2hhdCBtb2Rlcm4gYnJvd3NlcnMgZG8gd2hlbiBgU3RyaW5nLnByb3RvdHlwZS5zcGxpdCgpYCBpcyBjYWxsZWRcblx0ICogd2l0aCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGNvbnRhaW5zIGNhcHR1cmluZyBwYXJlbnRoZXNpcy5cblx0ICogXG5cdCAqIEZvciBleGFtcGxlOlxuXHQgKiBcblx0ICogICAgIC8vIE1vZGVybiBicm93c2VyczogXG5cdCAqICAgICBcImEsYixjXCIuc3BsaXQoIC8oLCkvICk7ICAvLyAtLT4gWyAnYScsICcsJywgJ2InLCAnLCcsICdjJyBdXG5cdCAqICAgICBcblx0ICogICAgIC8vIE9sZCBJRSAoaW5jbHVkaW5nIElFOCk6XG5cdCAqICAgICBcImEsYixjXCIuc3BsaXQoIC8oLCkvICk7ICAvLyAtLT4gWyAnYScsICdiJywgJ2MnIF1cblx0ICogICAgIFxuXHQgKiBUaGlzIG1ldGhvZCBlbXVsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiBtb2Rlcm4gYnJvd3NlcnMgZm9yIHRoZSBvbGQgSUUgY2FzZS5cblx0ICogXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBzcGxpdC5cblx0ICogQHBhcmFtIHtSZWdFeHB9IHNwbGl0UmVnZXggVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBzcGxpdCB0aGUgaW5wdXQgYHN0cmAgb24uIFRoZSBzcGxpdHRpbmdcblx0ICogICBjaGFyYWN0ZXIocykgd2lsbCBiZSBzcGxpY2VkIGludG8gdGhlIGFycmF5LCBhcyBpbiB0aGUgXCJtb2Rlcm4gYnJvd3NlcnNcIiBleGFtcGxlIGluIHRoZSBcblx0ICogICBkZXNjcmlwdGlvbiBvZiB0aGlzIG1ldGhvZC4gXG5cdCAqICAgTm90ZSAjMTogdGhlIHN1cHBsaWVkIHJlZ3VsYXIgZXhwcmVzc2lvbiAqKm11c3QqKiBoYXZlIHRoZSAnZycgZmxhZyBzcGVjaWZpZWQuXG5cdCAqICAgTm90ZSAjMjogZm9yIHNpbXBsaWNpdHkncyBzYWtlLCB0aGUgcmVndWxhciBleHByZXNzaW9uIGRvZXMgbm90IG5lZWQgXG5cdCAqICAgdG8gY29udGFpbiBjYXB0dXJpbmcgcGFyZW50aGVzaXMgLSBpdCB3aWxsIGJlIGFzc3VtZWQgdGhhdCBhbnkgbWF0Y2ggaGFzIHRoZW0uXG5cdCAqIEByZXR1cm4ge1N0cmluZ1tdfSBUaGUgc3BsaXQgYXJyYXkgb2Ygc3RyaW5ncywgd2l0aCB0aGUgc3BsaXR0aW5nIGNoYXJhY3RlcihzKSBpbmNsdWRlZC5cblx0ICovXG5cdHNwbGl0QW5kQ2FwdHVyZSA6IGZ1bmN0aW9uKCBzdHIsIHNwbGl0UmVnZXggKSB7XG5cdFx0aWYoICFzcGxpdFJlZ2V4Lmdsb2JhbCApIHRocm93IG5ldyBFcnJvciggXCJgc3BsaXRSZWdleGAgbXVzdCBoYXZlIHRoZSAnZycgZmxhZyBzZXRcIiApO1xuXHRcdFxuXHRcdHZhciByZXN1bHQgPSBbXSxcblx0XHQgICAgbGFzdElkeCA9IDAsXG5cdFx0ICAgIG1hdGNoO1xuXHRcdFxuXHRcdHdoaWxlKCBtYXRjaCA9IHNwbGl0UmVnZXguZXhlYyggc3RyICkgKSB7XG5cdFx0XHRyZXN1bHQucHVzaCggc3RyLnN1YnN0cmluZyggbGFzdElkeCwgbWF0Y2guaW5kZXggKSApO1xuXHRcdFx0cmVzdWx0LnB1c2goIG1hdGNoWyAwIF0gKTsgIC8vIHB1c2ggdGhlIHNwbGl0dGluZyBjaGFyKHMpXG5cdFx0XHRcblx0XHRcdGxhc3RJZHggPSBtYXRjaC5pbmRleCArIG1hdGNoWyAwIF0ubGVuZ3RoO1xuXHRcdH1cblx0XHRyZXN1bHQucHVzaCggc3RyLnN1YnN0cmluZyggbGFzdElkeCApICk7XG5cdFx0XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXHRcbn07XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBib3NzOnRydWUgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuSHRtbFRhZ1xuICogQGV4dGVuZHMgT2JqZWN0XG4gKiBcbiAqIFJlcHJlc2VudHMgYW4gSFRNTCB0YWcsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGVhc2lseSBidWlsZC9tb2RpZnkgSFRNTCB0YWdzIHByb2dyYW1tYXRpY2FsbHkuXG4gKiBcbiAqIEF1dG9saW5rZXIgdXNlcyB0aGlzIGFic3RyYWN0aW9uIHRvIGNyZWF0ZSBIVE1MIHRhZ3MsIGFuZCB0aGVuIHdyaXRlIHRoZW0gb3V0IGFzIHN0cmluZ3MuIFlvdSBtYXkgYWxzbyB1c2VcbiAqIHRoaXMgY2xhc3MgaW4geW91ciBjb2RlLCBlc3BlY2lhbGx5IHdpdGhpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LlxuICogXG4gKiAjIyBFeGFtcGxlc1xuICogXG4gKiBFeGFtcGxlIGluc3RhbnRpYXRpb246XG4gKiBcbiAqICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuICogICAgICAgICB0YWdOYW1lIDogJ2EnLFxuICogICAgICAgICBhdHRycyAgIDogeyAnaHJlZic6ICdodHRwOi8vZ29vZ2xlLmNvbScsICdjbGFzcyc6ICdleHRlcm5hbC1saW5rJyB9LFxuICogICAgICAgICBpbm5lckh0bWwgOiAnR29vZ2xlJ1xuICogICAgIH0gKTtcbiAqICAgICBcbiAqICAgICB0YWcudG9TdHJpbmcoKTsgIC8vIDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIGNsYXNzPVwiZXh0ZXJuYWwtbGlua1wiPkdvb2dsZTwvYT5cbiAqICAgICBcbiAqICAgICAvLyBJbmRpdmlkdWFsIGFjY2Vzc29yIG1ldGhvZHNcbiAqICAgICB0YWcuZ2V0VGFnTmFtZSgpOyAgICAgICAgICAgICAgICAgLy8gJ2EnXG4gKiAgICAgdGFnLmdldEF0dHIoICdocmVmJyApOyAgICAgICAgICAgIC8vICdodHRwOi8vZ29vZ2xlLmNvbSdcbiAqICAgICB0YWcuaGFzQ2xhc3MoICdleHRlcm5hbC1saW5rJyApOyAgLy8gdHJ1ZVxuICogXG4gKiBcbiAqIFVzaW5nIG11dGF0b3IgbWV0aG9kcyAod2hpY2ggbWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBpbnN0YW50aWF0aW9uIGNvbmZpZyBwcm9wZXJ0aWVzKTpcbiAqIFxuICogICAgIHZhciB0YWcgPSBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCk7XG4gKiAgICAgdGFnLnNldFRhZ05hbWUoICdhJyApO1xuICogICAgIHRhZy5zZXRBdHRyKCAnaHJlZicsICdodHRwOi8vZ29vZ2xlLmNvbScgKTtcbiAqICAgICB0YWcuYWRkQ2xhc3MoICdleHRlcm5hbC1saW5rJyApO1xuICogICAgIHRhZy5zZXRJbm5lckh0bWwoICdHb29nbGUnICk7XG4gKiAgICAgXG4gKiAgICAgdGFnLmdldFRhZ05hbWUoKTsgICAgICAgICAgICAgICAgIC8vICdhJ1xuICogICAgIHRhZy5nZXRBdHRyKCAnaHJlZicgKTsgICAgICAgICAgICAvLyAnaHR0cDovL2dvb2dsZS5jb20nXG4gKiAgICAgdGFnLmhhc0NsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTsgIC8vIHRydWVcbiAqICAgICBcbiAqICAgICB0YWcudG9TdHJpbmcoKTsgIC8vIDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIGNsYXNzPVwiZXh0ZXJuYWwtbGlua1wiPkdvb2dsZTwvYT5cbiAqICAgICBcbiAqIFxuICogIyMgRXhhbXBsZSB1c2Ugd2l0aGluIGEge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn1cbiAqIFxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2UsIGNvbmZpZ3VyZWQgd2l0aCB0aGUgTWF0Y2gncyBocmVmIGFuZCBhbmNob3IgdGV4dFxuICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKiAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKiAgICAgXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cbiAqICAgICBcbiAqICAgICBcbiAqICMjIEV4YW1wbGUgdXNlIHdpdGggYSBuZXcgdGFnIGZvciB0aGUgcmVwbGFjZW1lbnRcbiAqIFxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCB7XG4gKiAgICAgICAgICAgICAgICAgdGFnTmFtZSA6ICdidXR0b24nLFxuICogICAgICAgICAgICAgICAgIGF0dHJzICAgOiB7ICd0aXRsZSc6ICdMb2FkIFVSTDogJyArIG1hdGNoLmdldEFuY2hvckhyZWYoKSB9LFxuICogICAgICAgICAgICAgICAgIGlubmVySHRtbCA6ICdMb2FkIFVSTDogJyArIG1hdGNoLmdldEFuY2hvclRleHQoKVxuICogICAgICAgICAgICAgfSApO1xuICogICAgICAgICAgICAgXG4gKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICogICAgIFxuICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuICogICAgIC8vICAgVGVzdCA8YnV0dG9uIHRpdGxlPVwiTG9hZCBVUkw6IGh0dHA6Ly9nb29nbGUuY29tXCI+TG9hZCBVUkw6IGdvb2dsZS5jb208L2J1dHRvbj5cbiAqL1xuQXV0b2xpbmtlci5IdG1sVGFnID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0YWdOYW1lXG5cdCAqIFxuXHQgKiBUaGUgdGFnIG5hbWUuIEV4OiAnYScsICdidXR0b24nLCBldGMuXG5cdCAqIFxuXHQgKiBOb3QgcmVxdWlyZWQgYXQgaW5zdGFudGlhdGlvbiB0aW1lLCBidXQgc2hvdWxkIGJlIHNldCB1c2luZyB7QGxpbmsgI3NldFRhZ05hbWV9IGJlZm9yZSB7QGxpbmsgI3RvU3RyaW5nfVxuXHQgKiBpcyBleGVjdXRlZC5cblx0ICovXG5cdFxuXHQvKipcblx0ICogQGNmZyB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IGF0dHJzXG5cdCAqIFxuXHQgKiBBbiBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIGF0dHJpYnV0ZXMgdG8gY3JlYXRlIHRoZSB0YWcgd2l0aC4gVGhlIGtleXMgYXJlIHRoZSBhdHRyaWJ1dGUgbmFtZXMsIGFuZCB0aGVcblx0ICogdmFsdWVzIGFyZSB0aGUgYXR0cmlidXRlIHZhbHVlcy5cblx0ICovXG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBpbm5lckh0bWxcblx0ICogXG5cdCAqIFRoZSBpbm5lciBIVE1MIGZvciB0aGUgdGFnLiBcblx0ICogXG5cdCAqIE5vdGUgdGhlIGNhbWVsIGNhc2UgbmFtZSBvbiBgaW5uZXJIdG1sYC4gQWNyb255bXMgYXJlIGNhbWVsQ2FzZWQgaW4gdGhpcyB1dGlsaXR5IChzdWNoIGFzIG5vdCB0byBydW4gaW50byB0aGUgYWNyb255bSBcblx0ICogbmFtaW5nIGluY29uc2lzdGVuY3kgdGhhdCB0aGUgRE9NIGRldmVsb3BlcnMgY3JlYXRlZCB3aXRoIGBYTUxIdHRwUmVxdWVzdGApLiBZb3UgbWF5IGFsdGVybmF0aXZlbHkgdXNlIHtAbGluayAjaW5uZXJIVE1MfVxuXHQgKiBpZiB5b3UgcHJlZmVyLCBidXQgdGhpcyBvbmUgaXMgcmVjb21tZW5kZWQuXG5cdCAqL1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gaW5uZXJIVE1MXG5cdCAqIFxuXHQgKiBBbGlhcyBvZiB7QGxpbmsgI2lubmVySHRtbH0sIGFjY2VwdGVkIGZvciBjb25zaXN0ZW5jeSB3aXRoIHRoZSBicm93c2VyIERPTSBhcGksIGJ1dCBwcmVmZXIgdGhlIGNhbWVsQ2FzZWQgdmVyc2lvblxuXHQgKiBmb3IgYWNyb255bSBuYW1lcy5cblx0ICovXG5cdFxuXHRcblx0LyoqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHdoaXRlc3BhY2VSZWdleFxuXHQgKiBcblx0ICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gbWF0Y2ggd2hpdGVzcGFjZSBpbiBhIHN0cmluZyBvZiBDU1MgY2xhc3Nlcy5cblx0ICovXG5cdHdoaXRlc3BhY2VSZWdleCA6IC9cXHMrLyxcblx0XG5cdFxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGlzIGNsYXNzLCBpbiBhbiBPYmplY3QgKG1hcClcblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0XHRcblx0XHR0aGlzLmlubmVySHRtbCA9IHRoaXMuaW5uZXJIdG1sIHx8IHRoaXMuaW5uZXJIVE1MOyAgLy8gYWNjZXB0IGVpdGhlciB0aGUgY2FtZWxDYXNlZCBmb3JtIG9yIHRoZSBmdWxseSBjYXBpdGFsaXplZCBhY3JvbnltXG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFNldHMgdGhlIHRhZyBuYW1lIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGdlbmVyYXRlIHRoZSB0YWcgd2l0aC5cblx0ICogXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdOYW1lXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldFRhZ05hbWUgOiBmdW5jdGlvbiggdGFnTmFtZSApIHtcblx0XHR0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHRhZyBuYW1lLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGFnTmFtZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRhZ05hbWUgfHwgXCJcIjtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogU2V0cyBhbiBhdHRyaWJ1dGUgb24gdGhlIEh0bWxUYWcuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYXR0ck5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRvIHNldC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGF0dHJWYWx1ZSBUaGUgYXR0cmlidXRlIHZhbHVlIHRvIHNldC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0QXR0ciA6IGZ1bmN0aW9uKCBhdHRyTmFtZSwgYXR0clZhbHVlICkge1xuXHRcdHZhciB0YWdBdHRycyA9IHRoaXMuZ2V0QXR0cnMoKTtcblx0XHR0YWdBdHRyc1sgYXR0ck5hbWUgXSA9IGF0dHJWYWx1ZTtcblx0XHRcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0cmlldmVzIGFuIGF0dHJpYnV0ZSBmcm9tIHRoZSBIdG1sVGFnLiBJZiB0aGUgYXR0cmlidXRlIGRvZXMgbm90IGV4aXN0LCByZXR1cm5zIGB1bmRlZmluZWRgLlxuXHQgKiBcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRvIHJldHJpZXZlLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBhdHRyaWJ1dGUncyB2YWx1ZSwgb3IgYHVuZGVmaW5lZGAgaWYgaXQgZG9lcyBub3QgZXhpc3Qgb24gdGhlIEh0bWxUYWcuXG5cdCAqL1xuXHRnZXRBdHRyIDogZnVuY3Rpb24oIGF0dHJOYW1lICkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHJzKClbIGF0dHJOYW1lIF07XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFNldHMgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBvbiB0aGUgSHRtbFRhZy5cblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IGF0dHJzIEEga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiB0aGUgYXR0cmlidXRlcyB0byBzZXQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldEF0dHJzIDogZnVuY3Rpb24oIGF0dHJzICkge1xuXHRcdHZhciB0YWdBdHRycyA9IHRoaXMuZ2V0QXR0cnMoKTtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0YWdBdHRycywgYXR0cnMgKTtcblx0XHRcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBhdHRyaWJ1dGVzIE9iamVjdCAobWFwKSBmb3IgdGhlIEh0bWxUYWcuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtPYmplY3QuPFN0cmluZywgU3RyaW5nPn0gQSBrZXkvdmFsdWUgb2JqZWN0IG9mIHRoZSBhdHRyaWJ1dGVzIGZvciB0aGUgSHRtbFRhZy5cblx0ICovXG5cdGdldEF0dHJzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0cnMgfHwgKCB0aGlzLmF0dHJzID0ge30gKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogU2V0cyB0aGUgcHJvdmlkZWQgYGNzc0NsYXNzYCwgb3ZlcndyaXRpbmcgYW55IGN1cnJlbnQgQ1NTIGNsYXNzZXMgb24gdGhlIEh0bWxUYWcuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHRvIHNldCAob3ZlcndyaXRlKS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0QXR0ciggJ2NsYXNzJywgY3NzQ2xhc3MgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGFkZCBvbmUgb3IgbW9yZSBDU1MgY2xhc3NlcyB0byB0aGUgSHRtbFRhZy4gV2lsbCBub3QgYWRkIGR1cGxpY2F0ZSBDU1MgY2xhc3Nlcy5cblx0ICogXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzcyBPbmUgb3IgbW9yZSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRhZGRDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHR2YXIgY2xhc3NBdHRyID0gdGhpcy5nZXRDbGFzcygpLFxuXHRcdCAgICB3aGl0ZXNwYWNlUmVnZXggPSB0aGlzLndoaXRlc3BhY2VSZWdleCxcblx0XHQgICAgaW5kZXhPZiA9IEF1dG9saW5rZXIuVXRpbC5pbmRleE9mLCAgLy8gdG8gc3VwcG9ydCBJRTggYW5kIGJlbG93XG5cdFx0ICAgIGNsYXNzZXMgPSAoICFjbGFzc0F0dHIgKSA/IFtdIDogY2xhc3NBdHRyLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgbmV3Q2xhc3NlcyA9IGNzc0NsYXNzLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgbmV3Q2xhc3M7XG5cdFx0XG5cdFx0d2hpbGUoIG5ld0NsYXNzID0gbmV3Q2xhc3Nlcy5zaGlmdCgpICkge1xuXHRcdFx0aWYoIGluZGV4T2YoIGNsYXNzZXMsIG5ld0NsYXNzICkgPT09IC0xICkge1xuXHRcdFx0XHRjbGFzc2VzLnB1c2goIG5ld0NsYXNzICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdID0gY2xhc3Nlcy5qb2luKCBcIiBcIiApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmVtb3ZlIG9uZSBvciBtb3JlIENTUyBjbGFzc2VzIGZyb20gdGhlIEh0bWxUYWcuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0cmVtb3ZlQ2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0dmFyIGNsYXNzQXR0ciA9IHRoaXMuZ2V0Q2xhc3MoKSxcblx0XHQgICAgd2hpdGVzcGFjZVJlZ2V4ID0gdGhpcy53aGl0ZXNwYWNlUmVnZXgsXG5cdFx0ICAgIGluZGV4T2YgPSBBdXRvbGlua2VyLlV0aWwuaW5kZXhPZiwgIC8vIHRvIHN1cHBvcnQgSUU4IGFuZCBiZWxvd1xuXHRcdCAgICBjbGFzc2VzID0gKCAhY2xhc3NBdHRyICkgPyBbXSA6IGNsYXNzQXR0ci5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIHJlbW92ZUNsYXNzZXMgPSBjc3NDbGFzcy5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIHJlbW92ZUNsYXNzO1xuXHRcdFxuXHRcdHdoaWxlKCBjbGFzc2VzLmxlbmd0aCAmJiAoIHJlbW92ZUNsYXNzID0gcmVtb3ZlQ2xhc3Nlcy5zaGlmdCgpICkgKSB7XG5cdFx0XHR2YXIgaWR4ID0gaW5kZXhPZiggY2xhc3NlcywgcmVtb3ZlQ2xhc3MgKTtcblx0XHRcdGlmKCBpZHggIT09IC0xICkge1xuXHRcdFx0XHRjbGFzc2VzLnNwbGljZSggaWR4LCAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdID0gY2xhc3Nlcy5qb2luKCBcIiBcIiApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmV0cmlldmUgdGhlIENTUyBjbGFzcyhlcykgZm9yIHRoZSBIdG1sVGFnLCB3aGljaCB3aWxsIGVhY2ggYmUgc2VwYXJhdGVkIGJ5IHNwYWNlcyB3aGVuXG5cdCAqIHRoZXJlIGFyZSBtdWx0aXBsZS5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldENsYXNzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdIHx8IFwiXCI7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBjaGVjayBpZiB0aGUgdGFnIGhhcyBhIENTUyBjbGFzcyBvciBub3QuXG5cdCAqIFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgVGhlIENTUyBjbGFzcyB0byBjaGVjayBmb3IuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgSHRtbFRhZyBoYXMgdGhlIENTUyBjbGFzcywgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRoYXNDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHRyZXR1cm4gKCAnICcgKyB0aGlzLmdldENsYXNzKCkgKyAnICcgKS5pbmRleE9mKCAnICcgKyBjc3NDbGFzcyArICcgJyApICE9PSAtMTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogU2V0cyB0aGUgaW5uZXIgSFRNTCBmb3IgdGhlIHRhZy5cblx0ICogXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIFRoZSBpbm5lciBIVE1MIHRvIHNldC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0SW5uZXJIdG1sIDogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0dGhpcy5pbm5lckh0bWwgPSBodG1sO1xuXHRcdFxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGlubmVyIEhUTUwgZm9yIHRoZSB0YWcuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRJbm5lckh0bWwgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lckh0bWwgfHwgXCJcIjtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogT3ZlcnJpZGUgb2Ygc3VwZXJjbGFzcyBtZXRob2QgdXNlZCB0byBnZW5lcmF0ZSB0aGUgSFRNTCBzdHJpbmcgZm9yIHRoZSB0YWcuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHR0b1N0cmluZyA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0YWdOYW1lID0gdGhpcy5nZXRUYWdOYW1lKCksXG5cdFx0ICAgIGF0dHJzU3RyID0gdGhpcy5idWlsZEF0dHJzU3RyKCk7XG5cdFx0XG5cdFx0YXR0cnNTdHIgPSAoIGF0dHJzU3RyICkgPyAnICcgKyBhdHRyc1N0ciA6ICcnOyAgLy8gcHJlcGVuZCBhIHNwYWNlIGlmIHRoZXJlIGFyZSBhY3R1YWxseSBhdHRyaWJ1dGVzXG5cdFx0XG5cdFx0cmV0dXJuIFsgJzwnLCB0YWdOYW1lLCBhdHRyc1N0ciwgJz4nLCB0aGlzLmdldElubmVySHRtbCgpLCAnPC8nLCB0YWdOYW1lLCAnPicgXS5qb2luKCBcIlwiICk7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFN1cHBvcnQgbWV0aG9kIGZvciB7QGxpbmsgI3RvU3RyaW5nfSwgcmV0dXJucyB0aGUgc3RyaW5nIHNwYWNlLXNlcGFyYXRlZCBrZXk9XCJ2YWx1ZVwiIHBhaXJzLCB1c2VkIHRvIHBvcHVsYXRlIFxuXHQgKiB0aGUgc3RyaW5naWZpZWQgSHRtbFRhZy5cblx0ICogXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7U3RyaW5nfSBFeGFtcGxlIHJldHVybjogYGF0dHIxPVwidmFsdWUxXCIgYXR0cjI9XCJ2YWx1ZTJcImBcblx0ICovXG5cdGJ1aWxkQXR0cnNTdHIgOiBmdW5jdGlvbigpIHtcblx0XHRpZiggIXRoaXMuYXR0cnMgKSByZXR1cm4gXCJcIjsgIC8vIG5vIGBhdHRyc2AgT2JqZWN0IChtYXApIGhhcyBiZWVuIHNldCwgcmV0dXJuIGVtcHR5IHN0cmluZ1xuXHRcdFxuXHRcdHZhciBhdHRycyA9IHRoaXMuZ2V0QXR0cnMoKSxcblx0XHQgICAgYXR0cnNBcnIgPSBbXTtcblx0XHRcblx0XHRmb3IoIHZhciBwcm9wIGluIGF0dHJzICkge1xuXHRcdFx0aWYoIGF0dHJzLmhhc093blByb3BlcnR5KCBwcm9wICkgKSB7XG5cdFx0XHRcdGF0dHJzQXJyLnB1c2goIHByb3AgKyAnPVwiJyArIGF0dHJzWyBwcm9wIF0gKyAnXCInICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBhdHRyc0Fyci5qb2luKCBcIiBcIiApO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgc3ViOnRydWUgKi9cbi8qKlxuICogQHByb3RlY3RlZFxuICogQGNsYXNzIEF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKiBcbiAqIEJ1aWxkcyBhbmNob3IgKCZsdDthJmd0OykgdGFncyBmb3IgdGhlIEF1dG9saW5rZXIgdXRpbGl0eSB3aGVuIGEgbWF0Y2ggaXMgZm91bmQuXG4gKiBcbiAqIE5vcm1hbGx5IHRoaXMgY2xhc3MgaXMgaW5zdGFudGlhdGVkLCBjb25maWd1cmVkLCBhbmQgdXNlZCBpbnRlcm5hbGx5IGJ5IGFuIHtAbGluayBBdXRvbGlua2VyfSBpbnN0YW5jZSwgYnV0IG1heSBcbiAqIGFjdHVhbGx5IGJlIHJldHJpZXZlZCBpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59IHRvIGNyZWF0ZSB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnIEh0bWxUYWd9IGluc3RhbmNlc1xuICogd2hpY2ggbWF5IGJlIG1vZGlmaWVkIGJlZm9yZSByZXR1cm5pbmcgZnJvbSB0aGUge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0uIEZvciBleGFtcGxlOlxuICogXG4gKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiVGVzdCBnb29nbGUuY29tXCIsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZVxuICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKiAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKiAgICAgXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cbiAqL1xuQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gbmV3V2luZG93XG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjbmV3V2luZG93XG5cdCAqL1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge051bWJlcn0gdHJ1bmNhdGVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN0cnVuY2F0ZVxuXHQgKi9cblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGNsYXNzTmFtZVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI2NsYXNzTmFtZVxuXHQgKi9cblx0XG5cdFxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQW5jaG9yVGFnQnVpbGRlciBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogR2VuZXJhdGVzIHRoZSBhY3R1YWwgYW5jaG9yICgmbHQ7YSZndDspIHRhZyB0byB1c2UgaW4gcGxhY2Ugb2YgdGhlIG1hdGNoZWQgVVJML2VtYWlsL1R3aXR0ZXIgdGV4dCxcblx0ICogdmlhIGl0cyBgbWF0Y2hgIG9iamVjdC5cblx0ICogXG5cdCAqIEBwYXJhbSB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gbWF0Y2ggVGhlIE1hdGNoIGluc3RhbmNlIHRvIGdlbmVyYXRlIGFuIGFuY2hvciB0YWcgZnJvbS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGUgSHRtbFRhZyBpbnN0YW5jZSBmb3IgdGhlIGFuY2hvciB0YWcuXG5cdCAqL1xuXHRidWlsZCA6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHR2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuXHRcdFx0dGFnTmFtZSAgIDogJ2EnLFxuXHRcdFx0YXR0cnMgICAgIDogdGhpcy5jcmVhdGVBdHRycyggbWF0Y2guZ2V0VHlwZSgpLCBtYXRjaC5nZXRBbmNob3JIcmVmKCkgKSxcblx0XHRcdGlubmVySHRtbCA6IHRoaXMucHJvY2Vzc0FuY2hvclRleHQoIG1hdGNoLmdldEFuY2hvclRleHQoKSApXG5cdFx0fSApO1xuXHRcdFxuXHRcdHJldHVybiB0YWc7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhlIE9iamVjdCAobWFwKSBvZiB0aGUgSFRNTCBhdHRyaWJ1dGVzIGZvciB0aGUgYW5jaG9yICgmbHQ7YSZndDspIHRhZyBiZWluZyBnZW5lcmF0ZWQuXG5cdCAqIFxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7XCJ1cmxcIi9cImVtYWlsXCIvXCJ0d2l0dGVyXCJ9IG1hdGNoVHlwZSBUaGUgdHlwZSBvZiBtYXRjaCB0aGF0IGFuIGFuY2hvciB0YWcgaXMgYmVpbmcgZ2VuZXJhdGVkIGZvci5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGhyZWYgVGhlIGhyZWYgZm9yIHRoZSBhbmNob3IgdGFnLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEEga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiB0aGUgYW5jaG9yIHRhZydzIGF0dHJpYnV0ZXMuIFxuXHQgKi9cblx0Y3JlYXRlQXR0cnMgOiBmdW5jdGlvbiggbWF0Y2hUeXBlLCBhbmNob3JIcmVmICkge1xuXHRcdHZhciBhdHRycyA9IHtcblx0XHRcdCdocmVmJyA6IGFuY2hvckhyZWYgIC8vIHdlJ2xsIGFsd2F5cyBoYXZlIHRoZSBgaHJlZmAgYXR0cmlidXRlXG5cdFx0fTtcblx0XHRcblx0XHR2YXIgY3NzQ2xhc3MgPSB0aGlzLmNyZWF0ZUNzc0NsYXNzKCBtYXRjaFR5cGUgKTtcblx0XHRpZiggY3NzQ2xhc3MgKSB7XG5cdFx0XHRhdHRyc1sgJ2NsYXNzJyBdID0gY3NzQ2xhc3M7XG5cdFx0fVxuXHRcdGlmKCB0aGlzLm5ld1dpbmRvdyApIHtcblx0XHRcdGF0dHJzWyAndGFyZ2V0JyBdID0gXCJfYmxhbmtcIjtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGF0dHJzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBDU1MgY2xhc3MgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGEgZ2l2ZW4gYW5jaG9yIHRhZywgYmFzZWQgb24gdGhlIGBtYXRjaFR5cGVgIGFuZCB0aGUge0BsaW5rICNjbGFzc05hbWV9XG5cdCAqIGNvbmZpZy5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7XCJ1cmxcIi9cImVtYWlsXCIvXCJ0d2l0dGVyXCJ9IG1hdGNoVHlwZSBUaGUgdHlwZSBvZiBtYXRjaCB0aGF0IGFuIGFuY2hvciB0YWcgaXMgYmVpbmcgZ2VuZXJhdGVkIGZvci5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgQ1NTIGNsYXNzIHN0cmluZyBmb3IgdGhlIGxpbmsuIEV4YW1wbGUgcmV0dXJuOiBcIm15TGluayBteUxpbmstdXJsXCIuIElmIG5vIHtAbGluayAjY2xhc3NOYW1lfVxuXHQgKiAgIHdhcyBjb25maWd1cmVkLCByZXR1cm5zIGFuIGVtcHR5IHN0cmluZy5cblx0ICovXG5cdGNyZWF0ZUNzc0NsYXNzIDogZnVuY3Rpb24oIG1hdGNoVHlwZSApIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG5cdFx0XG5cdFx0aWYoICFjbGFzc05hbWUgKSBcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBjbGFzc05hbWUgKyBcIiBcIiArIGNsYXNzTmFtZSArIFwiLVwiICsgbWF0Y2hUeXBlOyAgLy8gZXg6IFwibXlMaW5rIG15TGluay11cmxcIiwgXCJteUxpbmsgbXlMaW5rLWVtYWlsXCIsIG9yIFwibXlMaW5rIG15TGluay10d2l0dGVyXCJcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUHJvY2Vzc2VzIHRoZSBgYW5jaG9yVGV4dGAgYnkgdHJ1bmNhdGluZyB0aGUgdGV4dCBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayAjdHJ1bmNhdGV9IGNvbmZpZy5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0IFRoZSBhbmNob3IgdGFnJ3MgdGV4dCAoaS5lLiB3aGF0IHdpbGwgYmUgZGlzcGxheWVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgcHJvY2Vzc2VkIGBhbmNob3JUZXh0YC5cblx0ICovXG5cdHByb2Nlc3NBbmNob3JUZXh0IDogZnVuY3Rpb24oIGFuY2hvclRleHQgKSB7XG5cdFx0YW5jaG9yVGV4dCA9IHRoaXMuZG9UcnVuY2F0ZSggYW5jaG9yVGV4dCApO1xuXHRcdFxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBQZXJmb3JtcyB0aGUgdHJ1bmNhdGlvbiBvZiB0aGUgYGFuY2hvclRleHRgLCBpZiB0aGUgYGFuY2hvclRleHRgIGlzIGxvbmdlciB0aGFuIHRoZSB7QGxpbmsgI3RydW5jYXRlfSBvcHRpb24uXG5cdCAqIFRydW5jYXRlcyB0aGUgdGV4dCB0byAyIGNoYXJhY3RlcnMgZmV3ZXIgdGhhbiB0aGUge0BsaW5rICN0cnVuY2F0ZX0gb3B0aW9uLCBhbmQgYWRkcyBcIi4uXCIgdG8gdGhlIGVuZC5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSBhbmNob3IgdGFnJ3MgdGV4dCAoaS5lLiB3aGF0IHdpbGwgYmUgZGlzcGxheWVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgdHJ1bmNhdGVkIGFuY2hvciB0ZXh0LlxuXHQgKi9cblx0ZG9UcnVuY2F0ZSA6IGZ1bmN0aW9uKCBhbmNob3JUZXh0ICkge1xuXHRcdHJldHVybiBBdXRvbGlua2VyLlV0aWwuZWxsaXBzaXMoIGFuY2hvclRleHQsIHRoaXMudHJ1bmNhdGUgfHwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICk7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICogXG4gKiBBbiBIVE1MIHBhcnNlciBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd2Fsa3MgYW4gSFRNTCBzdHJpbmcgYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlIEh0bWxOb2Rlc30gdGhhdCByZXByZXNlbnQgdGhlIGJhc2ljIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuXG4gKiBcbiAqIEF1dG9saW5rZXIgdXNlcyB0aGlzIHRvIG9ubHkgbGluayBVUkxzL2VtYWlscy9Ud2l0dGVyIGhhbmRsZXMgd2l0aGluIHRleHQgbm9kZXMsIGVmZmVjdGl2ZWx5IGlnbm9yaW5nIC8gXCJ3YWxraW5nXG4gKiBhcm91bmRcIiBIVE1MIHRhZ3MuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGh0bWxSZWdleFxuXHQgKiBcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHB1bGwgb3V0IEhUTUwgdGFncyBmcm9tIGEgc3RyaW5nLiBIYW5kbGVzIG5hbWVzcGFjZWQgSFRNTCB0YWdzIGFuZFxuXHQgKiBhdHRyaWJ1dGUgbmFtZXMsIGFzIHNwZWNpZmllZCBieSBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sLW1hcmt1cC9zeW50YXguaHRtbC5cblx0ICogXG5cdCAqIENhcHR1cmluZyBncm91cHM6XG5cdCAqIFxuXHQgKiAxLiBUaGUgXCIhRE9DVFlQRVwiIHRhZyBuYW1lLCBpZiBhIHRhZyBpcyBhICZsdDshRE9DVFlQRSZndDsgdGFnLlxuXHQgKiAyLiBJZiBpdCBpcyBhbiBlbmQgdGFnLCB0aGlzIGdyb3VwIHdpbGwgaGF2ZSB0aGUgJy8nLlxuXHQgKiAzLiBUaGUgdGFnIG5hbWUgZm9yIGFsbCB0YWdzIChvdGhlciB0aGFuIHRoZSAmbHQ7IURPQ1RZUEUmZ3Q7IHRhZylcblx0ICovXG5cdGh0bWxSZWdleCA6IChmdW5jdGlvbigpIHtcblx0XHR2YXIgdGFnTmFtZVJlZ2V4ID0gL1swLTlhLXpBLVpdWzAtOWEtekEtWjpdKi8sXG5cdFx0ICAgIGF0dHJOYW1lUmVnZXggPSAvW15cXHNcXDBcIic+XFwvPVxceDAxLVxceDFGXFx4N0ZdKy8sICAgLy8gdGhlIHVuaWNvZGUgcmFuZ2UgYWNjb3VudHMgZm9yIGV4Y2x1ZGluZyBjb250cm9sIGNoYXJzLCBhbmQgdGhlIGRlbGV0ZSBjaGFyXG5cdFx0ICAgIGF0dHJWYWx1ZVJlZ2V4ID0gLyg/OlwiW15cIl0qP1wifCdbXiddKj8nfFteJ1wiPTw+YFxcc10rKS8sIC8vIGRvdWJsZSBxdW90ZWQsIHNpbmdsZSBxdW90ZWQsIG9yIHVucXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZXNcblx0XHQgICAgbmFtZUVxdWFsc1ZhbHVlUmVnZXggPSBhdHRyTmFtZVJlZ2V4LnNvdXJjZSArICcoPzpcXFxccyo9XFxcXHMqJyArIGF0dHJWYWx1ZVJlZ2V4LnNvdXJjZSArICcpPyc7ICAvLyBvcHRpb25hbCAnPVt2YWx1ZV0nXG5cdFx0XG5cdFx0cmV0dXJuIG5ldyBSZWdFeHAoIFtcblx0XHRcdC8vIGZvciA8IURPQ1RZUEU+IHRhZy4gRXg6IDwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBTdHJpY3QvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS1zdHJpY3QuZHRkXCI+KSBcblx0XHRcdCcoPzonLFxuXHRcdFx0XHQnPCghRE9DVFlQRSknLCAgLy8gKioqIENhcHR1cmluZyBHcm91cCAxIC0gSWYgaXQncyBhIGRvY3R5cGUgdGFnXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gWmVybyBvciBtb3JlIGF0dHJpYnV0ZXMgZm9sbG93aW5nIHRoZSB0YWcgbmFtZVxuXHRcdFx0XHRcdCcoPzonLFxuXHRcdFx0XHRcdFx0J1xcXFxzKycsICAvLyBvbmUgb3IgbW9yZSB3aGl0ZXNwYWNlIGNoYXJzIGJlZm9yZSBhbiBhdHRyaWJ1dGVcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gRWl0aGVyOlxuXHRcdFx0XHRcdFx0Ly8gQS4gYXR0cj1cInZhbHVlXCIsIG9yIFxuXHRcdFx0XHRcdFx0Ly8gQi4gXCJ2YWx1ZVwiIGFsb25lIChUbyBjb3ZlciBleGFtcGxlIGRvY3R5cGUgdGFnOiA8IURPQ1RZUEUgaHRtbCBQVUJMSUMgXCItLy9XM0MvL0RURCBYSFRNTCAxLjAgU3RyaWN0Ly9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvVFIveGh0bWwxL0RURC94aHRtbDEtc3RyaWN0LmR0ZFwiPikgXG5cdFx0XHRcdFx0XHQnKD86JywgbmFtZUVxdWFsc1ZhbHVlUmVnZXgsICd8JywgYXR0clZhbHVlUmVnZXguc291cmNlICsgJyknLFxuXHRcdFx0XHRcdCcpKicsXG5cdFx0XHRcdCc+Jyxcblx0XHRcdCcpJyxcblx0XHRcdFxuXHRcdFx0J3wnLFxuXHRcdFx0XG5cdFx0XHQvLyBBbGwgb3RoZXIgSFRNTCB0YWdzIChpLmUuIHRhZ3MgdGhhdCBhcmUgbm90IDwhRE9DVFlQRT4pXG5cdFx0XHQnKD86Jyxcblx0XHRcdFx0JzwoLyk/JywgIC8vIEJlZ2lubmluZyBvZiBhIHRhZy4gRWl0aGVyICc8JyBmb3IgYSBzdGFydCB0YWcsIG9yICc8LycgZm9yIGFuIGVuZCB0YWcuIFxuXHRcdFx0XHQgICAgICAgICAgLy8gKioqIENhcHR1cmluZyBHcm91cCAyOiBUaGUgc2xhc2ggb3IgYW4gZW1wdHkgc3RyaW5nLiBTbGFzaCAoJy8nKSBmb3IgZW5kIHRhZywgZW1wdHkgc3RyaW5nIGZvciBzdGFydCBvciBzZWxmLWNsb3NpbmcgdGFnLlxuXHRcdFx0XG5cdFx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBHcm91cCAzIC0gVGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0JygnICsgdGFnTmFtZVJlZ2V4LnNvdXJjZSArICcpJyxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBaZXJvIG9yIG1vcmUgYXR0cmlidXRlcyBmb2xsb3dpbmcgdGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0Jyg/OicsXG5cdFx0XHRcdFx0XHQnXFxcXHMrJywgICAgICAgICAgICAgICAgLy8gb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFycyBiZWZvcmUgYW4gYXR0cmlidXRlXG5cdFx0XHRcdFx0XHRuYW1lRXF1YWxzVmFsdWVSZWdleCwgIC8vIGF0dHI9XCJ2YWx1ZVwiICh3aXRoIG9wdGlvbmFsID1cInZhbHVlXCIgcGFydClcblx0XHRcdFx0XHQnKSonLFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdCdcXFxccyovPycsICAvLyBhbnkgdHJhaWxpbmcgc3BhY2VzIGFuZCBvcHRpb25hbCAnLycgYmVmb3JlIHRoZSBjbG9zaW5nICc+J1xuXHRcdFx0XHQnPicsXG5cdFx0XHQnKSdcblx0XHRdLmpvaW4oIFwiXCIgKSwgJ2dpJyApO1xuXHR9ICkoKSxcblx0XG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgY29tbW9uIEhUTUwgY2hhcmFjdGVyIGVudGl0aWVzLlxuXHQgKiBcblx0ICogSWdub3JpbmcgJmFtcDsgYXMgaXQgY291bGQgYmUgcGFydCBvZiBhIHF1ZXJ5IHN0cmluZyAtLSBoYW5kbGluZyBpdCBzZXBhcmF0ZWx5LlxuXHQgKi9cblx0aHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXg6IC8oJm5ic3A7fCYjMTYwO3wmbHQ7fCYjNjA7fCZndDt8JiM2Mjt8JnF1b3Q7fCYjMzQ7fCYjMzk7KS9naSxcblx0XG5cdFxuXHQvKipcblx0ICogUGFyc2VzIGFuIEhUTUwgc3RyaW5nIGFuZCByZXR1cm5zIGEgc2ltcGxlIGFycmF5IG9mIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgSHRtbE5vZGVzfSB0byByZXByZXNlbnRcblx0ICogdGhlIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuIFxuXHQgKiBcblx0ICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgVGhlIEhUTUwgdG8gcGFyc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVtdfVxuXHQgKi9cblx0cGFyc2UgOiBmdW5jdGlvbiggaHRtbCApIHtcblx0XHR2YXIgaHRtbFJlZ2V4ID0gdGhpcy5odG1sUmVnZXgsXG5cdFx0ICAgIGN1cnJlbnRSZXN1bHQsXG5cdFx0ICAgIGxhc3RJbmRleCA9IDAsXG5cdFx0ICAgIHRleHRBbmRFbnRpdHlOb2Rlcyxcblx0XHQgICAgbm9kZXMgPSBbXTsgIC8vIHdpbGwgYmUgdGhlIHJlc3VsdCBvZiB0aGUgbWV0aG9kXG5cdFx0XG5cdFx0d2hpbGUoICggY3VycmVudFJlc3VsdCA9IGh0bWxSZWdleC5leGVjKCBodG1sICkgKSAhPT0gbnVsbCApIHtcblx0XHRcdHZhciB0YWdUZXh0ID0gY3VycmVudFJlc3VsdFsgMCBdLFxuXHRcdFx0ICAgIHRhZ05hbWUgPSBjdXJyZW50UmVzdWx0WyAxIF0gfHwgY3VycmVudFJlc3VsdFsgMyBdLCAgLy8gVGhlIDwhRE9DVFlQRT4gdGFnIChleDogXCIhRE9DVFlQRVwiKSwgb3IgYW5vdGhlciB0YWcgKGV4OiBcImFcIiBvciBcImltZ1wiKSBcblx0XHRcdCAgICBpc0Nsb3NpbmdUYWcgPSAhIWN1cnJlbnRSZXN1bHRbIDIgXSxcblx0XHRcdCAgICBpbkJldHdlZW5UYWdzVGV4dCA9IGh0bWwuc3Vic3RyaW5nKCBsYXN0SW5kZXgsIGN1cnJlbnRSZXN1bHQuaW5kZXggKTtcblx0XHRcdFxuXHRcdFx0Ly8gUHVzaCBUZXh0Tm9kZXMgYW5kIEVudGl0eU5vZGVzIGZvciBhbnkgdGV4dCBmb3VuZCBiZXR3ZWVuIHRhZ3Ncblx0XHRcdGlmKCBpbkJldHdlZW5UYWdzVGV4dCApIHtcblx0XHRcdFx0dGV4dEFuZEVudGl0eU5vZGVzID0gdGhpcy5wYXJzZVRleHRBbmRFbnRpdHlOb2RlcyggaW5CZXR3ZWVuVGFnc1RleHQgKTtcblx0XHRcdFx0bm9kZXMucHVzaC5hcHBseSggbm9kZXMsIHRleHRBbmRFbnRpdHlOb2RlcyApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBQdXNoIHRoZSBFbGVtZW50Tm9kZVxuXHRcdFx0bm9kZXMucHVzaCggdGhpcy5jcmVhdGVFbGVtZW50Tm9kZSggdGFnVGV4dCwgdGFnTmFtZSwgaXNDbG9zaW5nVGFnICkgKTtcblx0XHRcdFxuXHRcdFx0bGFzdEluZGV4ID0gY3VycmVudFJlc3VsdC5pbmRleCArIHRhZ1RleHQubGVuZ3RoO1xuXHRcdH1cblx0XHRcblx0XHQvLyBQcm9jZXNzIGFueSByZW1haW5pbmcgdGV4dCBhZnRlciB0aGUgbGFzdCBIVE1MIGVsZW1lbnQuIFdpbGwgcHJvY2VzcyBhbGwgb2YgdGhlIHRleHQgaWYgdGhlcmUgd2VyZSBubyBIVE1MIGVsZW1lbnRzLlxuXHRcdGlmKCBsYXN0SW5kZXggPCBodG1sLmxlbmd0aCApIHtcblx0XHRcdHZhciB0ZXh0ID0gaHRtbC5zdWJzdHJpbmcoIGxhc3RJbmRleCApO1xuXHRcdFx0XG5cdFx0XHQvLyBQdXNoIFRleHROb2RlcyBhbmQgRW50aXR5Tm9kZXMgZm9yIGFueSB0ZXh0IGZvdW5kIGJldHdlZW4gdGFnc1xuXHRcdFx0aWYoIHRleHQgKSB7XG5cdFx0XHRcdHRleHRBbmRFbnRpdHlOb2RlcyA9IHRoaXMucGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMoIHRleHQgKTtcblx0XHRcdFx0bm9kZXMucHVzaC5hcHBseSggbm9kZXMsIHRleHRBbmRFbnRpdHlOb2RlcyApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gbm9kZXM7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFBhcnNlcyB0ZXh0IGFuZCBIVE1MIGVudGl0eSBub2RlcyBmcm9tIGEgZ2l2ZW4gc3RyaW5nLiBUaGUgaW5wdXQgc3RyaW5nIHNob3VsZCBub3QgaGF2ZSBhbnkgSFRNTCB0YWdzIChlbGVtZW50cylcblx0ICogd2l0aGluIGl0LlxuXHQgKiBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gcGFyc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVtdfSBBbiBhcnJheSBvZiBIdG1sTm9kZXMgdG8gcmVwcmVzZW50IHRoZSBcblx0ICogICB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2Rlc30gYW5kIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2Rlc30gZm91bmQuXG5cdCAqL1xuXHRwYXJzZVRleHRBbmRFbnRpdHlOb2RlcyA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHZhciBub2RlcyA9IFtdLFxuXHRcdCAgICB0ZXh0QW5kRW50aXR5VG9rZW5zID0gQXV0b2xpbmtlci5VdGlsLnNwbGl0QW5kQ2FwdHVyZSggdGV4dCwgdGhpcy5odG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleCApOyAgLy8gc3BsaXQgYXQgSFRNTCBlbnRpdGllcywgYnV0IGluY2x1ZGUgdGhlIEhUTUwgZW50aXRpZXMgaW4gdGhlIHJlc3VsdHMgYXJyYXlcblx0XHRcblx0XHQvLyBFdmVyeSBldmVuIG51bWJlcmVkIHRva2VuIGlzIGEgVGV4dE5vZGUsIGFuZCBldmVyeSBvZGQgbnVtYmVyZWQgdG9rZW4gaXMgYW4gRW50aXR5Tm9kZVxuXHRcdC8vIEZvciBleGFtcGxlOiBhbiBpbnB1dCBgdGV4dGAgb2YgXCJUZXN0ICZxdW90O3RoaXMmcXVvdDsgdG9kYXlcIiB3b3VsZCB0dXJuIGludG8gdGhlIFxuXHRcdC8vICAgYHRleHRBbmRFbnRpdHlUb2tlbnNgOiBbICdUZXN0ICcsICcmcXVvdDsnLCAndGhpcycsICcmcXVvdDsnLCAnIHRvZGF5JyBdXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHRleHRBbmRFbnRpdHlUb2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIgKSB7XG5cdFx0XHR2YXIgdGV4dFRva2VuID0gdGV4dEFuZEVudGl0eVRva2Vuc1sgaSBdLFxuXHRcdFx0ICAgIGVudGl0eVRva2VuID0gdGV4dEFuZEVudGl0eVRva2Vuc1sgaSArIDEgXTtcblx0XHRcdFxuXHRcdFx0aWYoIHRleHRUb2tlbiApIG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlVGV4dE5vZGUoIHRleHRUb2tlbiApICk7XG5cdFx0XHRpZiggZW50aXR5VG9rZW4gKSBub2Rlcy5wdXNoKCB0aGlzLmNyZWF0ZUVudGl0eU5vZGUoIGVudGl0eVRva2VuICkgKTtcblx0XHR9XG5cdFx0cmV0dXJuIG5vZGVzO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSBFbGVtZW50Tm9kZX0uXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnVGV4dCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSB0YWcgKGVsZW1lbnQpIHRoYXQgd2FzIG1hdGNoZWQsIGluY2x1ZGluZyBpdHMgYXR0cmlidXRlcy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIHRhZy4gRXg6IEFuICZsdDtpbWcmZ3Q7IHRhZyB3b3VsZCBiZSBwYXNzZWQgdG8gdGhpcyBtZXRob2QgYXMgXCJpbWdcIi5cblx0ICogQHBhcmFtIHtCb29sZWFufSBpc0Nsb3NpbmdUYWcgYHRydWVgIGlmIGl0J3MgYSBjbG9zaW5nIHRhZywgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGV9XG5cdCAqL1xuXHRjcmVhdGVFbGVtZW50Tm9kZSA6IGZ1bmN0aW9uKCB0YWdUZXh0LCB0YWdOYW1lLCBpc0Nsb3NpbmdUYWcgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUoIHtcblx0XHRcdHRleHQgICAgOiB0YWdUZXh0LFxuXHRcdFx0dGFnTmFtZSA6IHRhZ05hbWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdGNsb3NpbmcgOiBpc0Nsb3NpbmdUYWdcblx0XHR9ICk7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfS5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQgZm9yIHRoZSBIVE1MIGVudGl0eSAoc3VjaCBhcyAnJmFtcDtuYnNwOycpLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZX1cblx0ICovXG5cdGNyZWF0ZUVudGl0eU5vZGUgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlKCB7IHRleHQ6IHRleHQgfSApO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfS5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZX1cblx0ICovXG5cdGNyZWF0ZVRleHROb2RlIDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUoIHsgdGV4dDogdGV4dCB9ICk7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICogXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgbm9kZSBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcuIEFuIEhUTUwgbm9kZSBpcyBvbmUgb2YgdGhlIGZvbGxvd2luZzpcbiAqIFxuICogMS4gQW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSBFbGVtZW50Tm9kZX0sIHdoaWNoIHJlcHJlc2VudHMgSFRNTCB0YWdzLlxuICogMi4gQSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfSwgd2hpY2ggcmVwcmVzZW50cyB0ZXh0IG91dHNpZGUgb3Igd2l0aGluIEhUTUwgdGFncy5cbiAqIDMuIEEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LCB3aGljaCByZXByZXNlbnRzIG9uZSBvZiB0aGUga25vd24gSFRNTFxuICogICAgZW50aXRpZXMgdGhhdCBBdXRvbGlua2VyIGxvb2tzIGZvci4gVGhpcyBpbmNsdWRlcyBjb21tb24gb25lcyBzdWNoIGFzICZhbXA7cXVvdDsgYW5kICZhbXA7bmJzcDtcbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0ZXh0IChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQgZm9yIHRoZSBIdG1sTm9kZS4gXG5cdCAqIFxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LCB0aGlzIHdpbGwgYmUgdGhlIHRhZydzXG5cdCAqICAgdGV4dC5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGV9LCB0aGlzIHdpbGwgYmUgdGhlIHRleHQgaXRzZWxmLlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LCB0aGlzIHdpbGwgYmUgdGhlIHRleHQgb2Zcblx0ICogICB0aGUgSFRNTCBlbnRpdHkuXG5cdCAqL1xuXHR0ZXh0IDogXCJcIixcblx0XG5cdFxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhlIE1hdGNoIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUge0BsaW5rICN0ZXh0fSBmb3IgdGhlIEh0bWxOb2RlLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRleHQ7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqIFxuICogUmVwcmVzZW50cyBhbiBIVE1MIGVsZW1lbnQgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfS5cbiAqIFxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0YWdOYW1lIChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBuYW1lIG9mIHRoZSB0YWcgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdHRhZ05hbWUgOiAnJyxcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBjbG9zaW5nIChyZXF1aXJlZClcblx0ICogXG5cdCAqIGB0cnVlYCBpZiB0aGUgZWxlbWVudCAodGFnKSBpcyBhIGNsb3NpbmcgdGFnLCBgZmFsc2VgIGlmIGl0cyBhbiBvcGVuaW5nIHRhZy5cblx0ICovXG5cdGNsb3NpbmcgOiBmYWxzZSxcblxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VsZW1lbnQnO1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgSFRNTCBlbGVtZW50J3MgKHRhZydzKSBuYW1lLiBFeDogZm9yIGFuICZsdDtpbWcmZ3Q7IHRhZywgcmV0dXJucyBcImltZ1wiLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGFnTmFtZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRhZ05hbWU7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgdGhlIEhUTUwgZWxlbWVudCAodGFnKSBpcyBhIGNsb3NpbmcgdGFnLiBFeDogJmx0O2RpdiZndDsgcmV0dXJuc1xuXHQgKiBgZmFsc2VgLCB3aGlsZSAmbHQ7L2RpdiZndDsgcmV0dXJucyBgdHJ1ZWAuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHQgKi9cblx0aXNDbG9zaW5nIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2luZztcblx0fVxuXHRcbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqIFxuICogUmVwcmVzZW50cyBhIGtub3duIEhUTUwgZW50aXR5IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKiBFeDogJyZhbXA7bmJzcDsnLCBvciAnJmFtcCMxNjA7JyAod2hpY2ggd2lsbCBiZSByZXRyaWV2YWJsZSBmcm9tIHRoZSB7QGxpbmsgI2dldFRleHR9IG1ldGhvZC5cbiAqIFxuICogTm90ZSB0aGF0IHRoaXMgY2xhc3Mgd2lsbCBvbmx5IGJlIHJldHVybmVkIGZyb20gdGhlIEh0bWxQYXJzZXIgZm9yIHRoZSBzZXQgb2YgY2hlY2tlZCBIVE1MIGVudGl0eSBub2RlcyBcbiAqIGRlZmluZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlciNodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleH0uXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZW50aXR5Jztcblx0fVxuXHRcbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKiBcbiAqIFJlcHJlc2VudHMgYSB0ZXh0IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3RleHQnO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICogXG4gKiBVc2VkIGJ5IEF1dG9saW5rZXIgdG8gcGFyc2Uge0BsaW5rICN1cmxzIFVSTHN9LCB7QGxpbmsgI2VtYWlscyBlbWFpbCBhZGRyZXNzZXN9LCBhbmQge0BsaW5rICN0d2l0dGVyIFR3aXR0ZXIgaGFuZGxlc30sIFxuICogZ2l2ZW4gYW4gaW5wdXQgc3RyaW5nIG9mIHRleHQuXG4gKiBcbiAqIFRoZSBNYXRjaFBhcnNlciBpcyBmZWQgYSBub24tSFRNTCBzdHJpbmcgaW4gb3JkZXIgdG8gc2VhcmNoIG91dCBVUkxzLCBlbWFpbCBhZGRyZXNzZXMgYW5kIFR3aXR0ZXIgaGFuZGxlcy4gQXV0b2xpbmtlclxuICogZmlyc3QgdXNlcyB0aGUge0BsaW5rIEh0bWxQYXJzZXJ9IHRvIFwid2FsayBhcm91bmRcIiBIVE1MIHRhZ3MsIGFuZCB0aGVuIHRoZSB0ZXh0IGFyb3VuZCB0aGUgSFRNTCB0YWdzIGlzIHBhc3NlZCBpbnRvXG4gKiB0aGUgTWF0Y2hQYXJzZXIgaW4gb3JkZXIgdG8gZmluZCB0aGUgYWN0dWFsIG1hdGNoZXMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB1cmxzXG5cdCAqIFxuXHQgKiBgdHJ1ZWAgaWYgbWlzY2VsbGFuZW91cyBVUkxzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHR1cmxzIDogdHJ1ZSxcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBlbWFpbFxuXHQgKiBcblx0ICogYHRydWVgIGlmIGVtYWlsIGFkZHJlc3NlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0ZW1haWwgOiB0cnVlLFxuXHRcblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHR3aXR0ZXJcblx0ICogXG5cdCAqIGB0cnVlYCBpZiBUd2l0dGVyIGhhbmRsZXMgKFwiQGV4YW1wbGVcIikgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLCBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdHR3aXR0ZXIgOiB0cnVlLFxuXHRcblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHN0cmlwUHJlZml4XG5cdCAqIFxuXHQgKiBgdHJ1ZWAgaWYgJ2h0dHA6Ly8nIG9yICdodHRwczovLycgYW5kL29yIHRoZSAnd3d3Licgc2hvdWxkIGJlIHN0cmlwcGVkIGZyb20gdGhlIGJlZ2lubmluZyBvZiBVUkwgbGlua3MnIHRleHRcblx0ICogaW4ge0BsaW5rIEF1dG9saW5rZXIubWF0Y2guVXJsIFVSTCBtYXRjaGVzfSwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqIFxuXHQgKiBUT0RPOiBIYW5kbGUgdGhpcyBiZWZvcmUgYSBVUkwgTWF0Y2ggb2JqZWN0IGlzIGluc3RhbnRpYXRlZC5cblx0ICovXG5cdHN0cmlwUHJlZml4IDogdHJ1ZSxcblx0XG5cdFxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IG1hdGNoZXJSZWdleFxuXHQgKiBcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBhbmQgVHdpdHRlciBoYW5kbGVzLlxuXHQgKiBcblx0ICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gaGFzIHRoZSBmb2xsb3dpbmcgY2FwdHVyaW5nIGdyb3Vwczpcblx0ICogXG5cdCAqIDEuIEdyb3VwIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlcmUgaXMgYSBUd2l0dGVyIGhhbmRsZSBtYXRjaCAoaS5lLiBcXEBzb21lVHdpdHRlclVzZXIpLiBTaW1wbHkgY2hlY2sgZm9yIGl0cyBcblx0ICogICAgZXhpc3RlbmNlIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIFR3aXR0ZXIgaGFuZGxlIG1hdGNoLiBUaGUgbmV4dCBjb3VwbGUgb2YgY2FwdHVyaW5nIGdyb3VwcyBnaXZlIGluZm9ybWF0aW9uIFxuXHQgKiAgICBhYm91dCB0aGUgVHdpdHRlciBoYW5kbGUgbWF0Y2guXG5cdCAqIDIuIFRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlIFxcQHNpZ24gaW4gYSBUd2l0dGVyIGhhbmRsZS4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB0aGVyZSBhcmUgbm8gbG9va2JlaGluZHMgaW5cblx0ICogICAgSlMgcmVndWxhciBleHByZXNzaW9ucywgYW5kIGNhbiBiZSB1c2VkIHRvIHJlY29uc3RydWN0IHRoZSBvcmlnaW5hbCBzdHJpbmcgaW4gYSByZXBsYWNlKCkuXG5cdCAqIDMuIFRoZSBUd2l0dGVyIGhhbmRsZSBpdHNlbGYgaW4gYSBUd2l0dGVyIG1hdGNoLiBJZiB0aGUgbWF0Y2ggaXMgJ0Bzb21lVHdpdHRlclVzZXInLCB0aGUgaGFuZGxlIGlzICdzb21lVHdpdHRlclVzZXInLlxuXHQgKiA0LiBHcm91cCB0aGF0IG1hdGNoZXMgYW4gZW1haWwgYWRkcmVzcy4gVXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIG1hdGNoIGlzIGFuIGVtYWlsIGFkZHJlc3MsIGFzIHdlbGwgYXMgaG9sZGluZyB0aGUgZnVsbCBcblx0ICogICAgYWRkcmVzcy4gRXg6ICdtZUBteS5jb20nXG5cdCAqIDUuIEdyb3VwIHRoYXQgbWF0Y2hlcyBhIFVSTCBpbiB0aGUgaW5wdXQgdGV4dC4gRXg6ICdodHRwOi8vZ29vZ2xlLmNvbScsICd3d3cuZ29vZ2xlLmNvbScsIG9yIGp1c3QgJ2dvb2dsZS5jb20nLlxuXHQgKiAgICBUaGlzIGFsc28gaW5jbHVkZXMgYSBwYXRoLCB1cmwgcGFyYW1ldGVycywgb3IgaGFzaCBhbmNob3JzLiBFeDogZ29vZ2xlLmNvbS9wYXRoL3RvL2ZpbGU/cTE9MSZxMj0yI215QW5jaG9yXG5cdCAqIDYuIEdyb3VwIHRoYXQgbWF0Y2hlcyBhIHByb3RvY29sIFVSTCAoaS5lLiAnaHR0cDovL2dvb2dsZS5jb20nKS4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHByb3RvY29sIFVSTHMgd2l0aCBqdXN0IGEgc2luZ2xlXG5cdCAqICAgIHdvcmQsIGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWUgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIDcuIEEgcHJvdG9jb2wtcmVsYXRpdmUgKCcvLycpIG1hdGNoIGZvciB0aGUgY2FzZSBvZiBhICd3d3cuJyBwcmVmaXhlZCBVUkwuIFdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIGlmIGl0IGlzIG5vdCBhIFxuXHQgKiAgICBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC4gV2UgbmVlZCB0byBrbm93IHRoZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnLy8nIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiBpdCBpcyBhIHZhbGlkIG1hdGNoXG5cdCAqICAgIG9yIHRoZSAvLyB3YXMgaW4gYSBzdHJpbmcgd2UgZG9uJ3Qgd2FudCB0byBhdXRvLWxpbmsuXG5cdCAqIDguIEEgcHJvdG9jb2wtcmVsYXRpdmUgKCcvLycpIG1hdGNoIGZvciB0aGUgY2FzZSBvZiBhIGtub3duIFRMRCBwcmVmaXhlZCBVUkwuIFdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIGlmIGl0IGlzIG5vdCBhIFxuXHQgKiAgICBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC4gU2VlICM2IGZvciBtb3JlIGluZm8uIFxuXHQgKi9cblx0bWF0Y2hlclJlZ2V4IDogKGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0d2l0dGVyUmVnZXggPSAvKF58W15cXHddKUAoXFx3ezEsMTV9KS8sICAgICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYSB0d2l0dGVyIGhhbmRsZS4gRXg6IEBncmVnb3J5X2phY29ic1xuXHRcdCAgICBcblx0XHQgICAgZW1haWxSZWdleCA9IC8oPzpbXFwtOzomPVxcK1xcJCxcXHdcXC5dK0ApLywgICAgICAgICAgICAgLy8gc29tZXRoaW5nQCBmb3IgZW1haWwgYWRkcmVzc2VzIChhLmsuYS4gbG9jYWwtcGFydClcblx0XHQgICAgXG5cdFx0ICAgIHByb3RvY29sUmVnZXggPSAvKD86W0EtWmEtel1bLS4rQS1aYS16MC05XSs6KD8hW0EtWmEtel1bLS4rQS1aYS16MC05XSs6XFwvXFwvKSg/IVxcZCtcXC8/KSg/OlxcL1xcLyk/KS8sICAvLyBtYXRjaCBwcm90b2NvbCwgYWxsb3cgaW4gZm9ybWF0IFwiaHR0cDovL1wiIG9yIFwibWFpbHRvOlwiLiBIb3dldmVyLCBkbyBub3QgbWF0Y2ggdGhlIGZpcnN0IHBhcnQgb2Ygc29tZXRoaW5nIGxpa2UgJ2xpbms6aHR0cDovL3d3dy5nb29nbGUuY29tJyAoaS5lLiBkb24ndCBtYXRjaCBcImxpbms6XCIpLiBBbHNvLCBtYWtlIHN1cmUgd2UgZG9uJ3QgaW50ZXJwcmV0ICdnb29nbGUuY29tOjgwMDAnIGFzIGlmICdnb29nbGUuY29tJyB3YXMgYSBwcm90b2NvbCBoZXJlIChpLmUuIGlnbm9yZSBhIHRyYWlsaW5nIHBvcnQgbnVtYmVyIGluIHRoaXMgcmVnZXgpXG5cdFx0ICAgIHd3d1JlZ2V4ID0gLyg/Ond3d1xcLikvLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgd2l0aCAnd3d3Lidcblx0XHQgICAgZG9tYWluTmFtZVJlZ2V4ID0gL1tBLVphLXowLTlcXC5cXC1dKltBLVphLXowLTlcXC1dLywgIC8vIGFueXRoaW5nIGxvb2tpbmcgYXQgYWxsIGxpa2UgYSBkb21haW4sIG5vbi11bmljb2RlIGRvbWFpbnMsIG5vdCBlbmRpbmcgaW4gYSBwZXJpb2Rcblx0XHQgICAgdGxkUmVnZXggPSAvXFwuKD86aW50ZXJuYXRpb25hbHxjb25zdHJ1Y3Rpb258Y29udHJhY3RvcnN8ZW50ZXJwcmlzZXN8cGhvdG9ncmFwaHl8cHJvZHVjdGlvbnN8Zm91bmRhdGlvbnxpbW1vYmlsaWVufGluZHVzdHJpZXN8bWFuYWdlbWVudHxwcm9wZXJ0aWVzfHRlY2hub2xvZ3l8Y2hyaXN0bWFzfGNvbW11bml0eXxkaXJlY3Rvcnl8ZWR1Y2F0aW9ufGVxdWlwbWVudHxpbnN0aXR1dGV8bWFya2V0aW5nfHNvbHV0aW9uc3x2YWNhdGlvbnN8YmFyZ2FpbnN8Ym91dGlxdWV8YnVpbGRlcnN8Y2F0ZXJpbmd8Y2xlYW5pbmd8Y2xvdGhpbmd8Y29tcHV0ZXJ8ZGVtb2NyYXR8ZGlhbW9uZHN8Z3JhcGhpY3N8aG9sZGluZ3N8bGlnaHRpbmd8cGFydG5lcnN8cGx1bWJpbmd8c3VwcGxpZXN8dHJhaW5pbmd8dmVudHVyZXN8YWNhZGVteXxjYXJlZXJzfGNvbXBhbnl8Y3J1aXNlc3xkb21haW5zfGV4cG9zZWR8ZmxpZ2h0c3xmbG9yaXN0fGdhbGxlcnl8Z3VpdGFyc3xob2xpZGF5fGtpdGNoZW58bmV1c3Rhcnxva2luYXdhfHJlY2lwZXN8cmVudGFsc3xyZXZpZXdzfHNoaWtzaGF8c2luZ2xlc3xzdXBwb3J0fHN5c3RlbXN8YWdlbmN5fGJlcmxpbnxjYW1lcmF8Y2VudGVyfGNvZmZlZXxjb25kb3N8ZGF0aW5nfGVzdGF0ZXxldmVudHN8ZXhwZXJ0fGZ1dGJvbHxrYXVmZW58bHV4dXJ5fG1haXNvbnxtb25hc2h8bXVzZXVtfG5hZ295YXxwaG90b3N8cmVwYWlyfHJlcG9ydHxzb2NpYWx8c3VwcGx5fHRhdHRvb3x0aWVuZGF8dHJhdmVsfHZpYWplc3x2aWxsYXN8dmlzaW9ufHZvdGluZ3x2b3lhZ2V8YWN0b3J8YnVpbGR8Y2FyZHN8Y2hlYXB8Y29kZXN8ZGFuY2V8ZW1haWx8Z2xhc3N8aG91c2V8bWFuZ298bmluamF8cGFydHN8cGhvdG98c2hvZXN8c29sYXJ8dG9kYXl8dG9reW98dG9vbHN8d2F0Y2h8d29ya3N8YWVyb3xhcnBhfGFzaWF8YmVzdHxiaWtlfGJsdWV8YnV6enxjYW1wfGNsdWJ8Y29vbHxjb29wfGZhcm18ZmlzaHxnaWZ0fGd1cnV8aW5mb3xqb2JzfGtpd2l8a3JlZHxsYW5kfGxpbW98bGlua3xtZW51fG1vYml8bW9kYXxuYW1lfHBpY3N8cGlua3xwb3N0fHFwb258cmljaHxydWhyfHNleHl8dGlwc3x2b3RlfHZvdG98d2FuZ3x3aWVufHdpa2l8em9uZXxiYXJ8YmlkfGJpenxjYWJ8Y2F0fGNlb3xjb218ZWR1fGdvdnxpbnR8a2ltfG1pbHxuZXR8b25sfG9yZ3xwcm98cHVifHJlZHx0ZWx8dW5vfHdlZHx4eHh8eHl6fGFjfGFkfGFlfGFmfGFnfGFpfGFsfGFtfGFufGFvfGFxfGFyfGFzfGF0fGF1fGF3fGF4fGF6fGJhfGJifGJkfGJlfGJmfGJnfGJofGJpfGJqfGJtfGJufGJvfGJyfGJzfGJ0fGJ2fGJ3fGJ5fGJ6fGNhfGNjfGNkfGNmfGNnfGNofGNpfGNrfGNsfGNtfGNufGNvfGNyfGN1fGN2fGN3fGN4fGN5fGN6fGRlfGRqfGRrfGRtfGRvfGR6fGVjfGVlfGVnfGVyfGVzfGV0fGV1fGZpfGZqfGZrfGZtfGZvfGZyfGdhfGdifGdkfGdlfGdmfGdnfGdofGdpfGdsfGdtfGdufGdwfGdxfGdyfGdzfGd0fGd1fGd3fGd5fGhrfGhtfGhufGhyfGh0fGh1fGlkfGllfGlsfGltfGlufGlvfGlxfGlyfGlzfGl0fGplfGptfGpvfGpwfGtlfGtnfGtofGtpfGttfGtufGtwfGtyfGt3fGt5fGt6fGxhfGxifGxjfGxpfGxrfGxyfGxzfGx0fGx1fGx2fGx5fG1hfG1jfG1kfG1lfG1nfG1ofG1rfG1sfG1tfG1ufG1vfG1wfG1xfG1yfG1zfG10fG11fG12fG13fG14fG15fG16fG5hfG5jfG5lfG5mfG5nfG5pfG5sfG5vfG5wfG5yfG51fG56fG9tfHBhfHBlfHBmfHBnfHBofHBrfHBsfHBtfHBufHByfHBzfHB0fHB3fHB5fHFhfHJlfHJvfHJzfHJ1fHJ3fHNhfHNifHNjfHNkfHNlfHNnfHNofHNpfHNqfHNrfHNsfHNtfHNufHNvfHNyfHN0fHN1fHN2fHN4fHN5fHN6fHRjfHRkfHRmfHRnfHRofHRqfHRrfHRsfHRtfHRufHRvfHRwfHRyfHR0fHR2fHR3fHR6fHVhfHVnfHVrfHVzfHV5fHV6fHZhfHZjfHZlfHZnfHZpfHZufHZ1fHdmfHdzfHllfHl0fHphfHptfHp3KVxcYi8sICAgLy8gbWF0Y2ggb3VyIGtub3duIHRvcCBsZXZlbCBkb21haW5zIChUTERzKVxuXHRcdCAgICBcblx0XHQgICAgLy8gQWxsb3cgb3B0aW9uYWwgcGF0aCwgcXVlcnkgc3RyaW5nLCBhbmQgaGFzaCBhbmNob3IsIG5vdCBlbmRpbmcgaW4gdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzOiBcIj8hOiwuO1wiXG5cdFx0ICAgIC8vIGh0dHA6Ly9ibG9nLmNvZGluZ2hvcnJvci5jb20vdGhlLXByb2JsZW0td2l0aC11cmxzL1xuXHRcdCAgICB1cmxTdWZmaXhSZWdleCA9IC9bXFwtQS1aYS16MC05KyZAI1xcLyU9fl8oKXwnJCpcXFtcXF0/ITosLjtdKltcXC1BLVphLXowLTkrJkAjXFwvJT1+XygpfCckKlxcW1xcXV0vO1xuXHRcdFxuXHRcdHJldHVybiBuZXcgUmVnRXhwKCBbXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxLCB3aGljaCBjYW4gYmUgdXNlZCB0byBjaGVjayBmb3IgYSB0d2l0dGVyIGhhbmRsZSBtYXRjaC4gVXNlIGdyb3VwICQzIGZvciB0aGUgYWN0dWFsIHR3aXR0ZXIgaGFuZGxlIHRob3VnaC4gJDIgbWF5IGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKSBcblx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMiwgd2hpY2ggbWF0Y2hlcyB0aGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnQCcgc2lnbiAobmVlZGVkIGJlY2F1c2Ugb2Ygbm8gbG9va2JlaGluZHMpLCBhbmQgXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDMsIHdoaWNoIG1hdGNoZXMgdGhlIGFjdHVhbCB0d2l0dGVyIGhhbmRsZVxuXHRcdFx0XHR0d2l0dGVyUmVnZXguc291cmNlLFxuXHRcdFx0JyknLFxuXHRcdFx0XG5cdFx0XHQnfCcsXG5cdFx0XHRcblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDQsIHdoaWNoIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGFuIGVtYWlsIG1hdGNoXG5cdFx0XHRcdGVtYWlsUmVnZXguc291cmNlLFxuXHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHR0bGRSZWdleC5zb3VyY2UsXG5cdFx0XHQnKScsXG5cdFx0XHRcblx0XHRcdCd8Jyxcblx0XHRcdFxuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNSwgd2hpY2ggaXMgdXNlZCB0byBtYXRjaCBhIFVSTFxuXHRcdFx0XHQnKD86JywgLy8gcGFyZW5zIHRvIGNvdmVyIG1hdGNoIGZvciBwcm90b2NvbCAob3B0aW9uYWwpLCBhbmQgZG9tYWluXG5cdFx0XHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNiwgZm9yIGEgcHJvdG9jb2wtcHJlZml4ZWQgdXJsIChleDogaHR0cDovL2dvb2dsZS5jb20pXG5cdFx0XHRcdFx0XHRwcm90b2NvbFJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0JyknLFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdCd8Jyxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQnKD86JywgIC8vIG5vbi1jYXB0dXJpbmcgcGFyZW4gZm9yIGEgJ3d3dy4nIHByZWZpeGVkIHVybCAoZXg6IHd3dy5nb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0JyguPy8vKT8nLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNyBmb3IgYW4gb3B0aW9uYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBNdXN0IGJlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBvciBzdGFydCB3aXRoIGEgbm9uLXdvcmQgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHR3d3dSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQnfCcsXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Jyg/OicsICAvLyBub24tY2FwdHVyaW5nIHBhcmVuIGZvciBrbm93biBhIFRMRCB1cmwgKGV4OiBnb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0JyguPy8vKT8nLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkOCBmb3IgYW4gb3B0aW9uYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBNdXN0IGJlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBvciBzdGFydCB3aXRoIGEgbm9uLXdvcmQgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdFx0dGxkUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0JyknLFxuXHRcdFx0XHRcblx0XHRcdFx0Jyg/OicgKyB1cmxTdWZmaXhSZWdleC5zb3VyY2UgKyAnKT8nLCAgLy8gbWF0Y2ggZm9yIHBhdGgsIHF1ZXJ5IHN0cmluZywgYW5kL29yIGhhc2ggYW5jaG9yIC0gb3B0aW9uYWxcblx0XHRcdCcpJ1xuXHRcdF0uam9pbiggXCJcIiApLCAnZ2knICk7XG5cdH0gKSgpLFxuXHRcblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBjaGFyQmVmb3JlUHJvdG9jb2xSZWxNYXRjaFJlZ2V4XG5cdCAqIFxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmV0cmlldmUgdGhlIGNoYXJhY3RlciBiZWZvcmUgYSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgbWF0Y2guXG5cdCAqIFxuXHQgKiBUaGlzIGlzIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LCB3aGljaCBuZWVkcyB0byBncmFiIHRoZSBjaGFyYWN0ZXIgYmVmb3JlIGEgcHJvdG9jb2wtcmVsYXRpdmVcblx0ICogJy8vJyBkdWUgdG8gdGhlIGxhY2sgb2YgYSBuZWdhdGl2ZSBsb29rLWJlaGluZCBpbiBKYXZhU2NyaXB0IHJlZ3VsYXIgZXhwcmVzc2lvbnMuIFRoZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSBtYXRjaCBpcyBzdHJpcHBlZFxuXHQgKiBmcm9tIHRoZSBVUkwuXG5cdCAqL1xuXHRjaGFyQmVmb3JlUHJvdG9jb2xSZWxNYXRjaFJlZ2V4IDogL14oLik/XFwvXFwvLyxcblx0XG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3J9IG1hdGNoVmFsaWRhdG9yXG5cdCAqIFxuXHQgKiBUaGUgTWF0Y2hWYWxpZGF0b3Igb2JqZWN0LCB1c2VkIHRvIGZpbHRlciBvdXQgYW55IGZhbHNlIHBvc2l0aXZlcyBmcm9tIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0uIFNlZVxuXHQgKiB7QGxpbmsgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvcn0gZm9yIGRldGFpbHMuXG5cdCAqL1xuXHRcblx0XG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IFtjZmddIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBbmNob3JUYWdCdWlsZGVyIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHRcblx0XHR0aGlzLm1hdGNoVmFsaWRhdG9yID0gbmV3IEF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3IoKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUGFyc2VzIHRoZSBpbnB1dCBgdGV4dGAgdG8gc2VhcmNoIGZvciBVUkxzL2VtYWlscy9Ud2l0dGVyIGhhbmRsZXMsIGFuZCBjYWxscyB0aGUgYHJlcGxhY2VGbmBcblx0ICogdG8gYWxsb3cgcmVwbGFjZW1lbnRzIG9mIHRoZSBtYXRjaGVzLiBSZXR1cm5zIHRoZSBgdGV4dGAgd2l0aCBtYXRjaGVzIHJlcGxhY2VkLlxuXHQgKiBcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gc2VhcmNoIGFuZCByZXBhY2UgbWF0Y2hlcyBpbi5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZUZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbiB0byBoYW5kbGUgdGhlIHJlcGxhY2VtZW50cy4gVGhlIGZ1bmN0aW9uIHRha2VzIGFcblx0ICogICBzaW5nbGUgYXJndW1lbnQsIGEge0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9IG9iamVjdCwgYW5kIHNob3VsZCByZXR1cm4gdGhlIHRleHQgdGhhdCBzaG91bGRcblx0ICogICBtYWtlIHRoZSByZXBsYWNlbWVudC5cblx0ICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0T2JqPXdpbmRvd10gVGhlIGNvbnRleHQgb2JqZWN0IChcInNjb3BlXCIpIHRvIHJ1biB0aGUgYHJlcGxhY2VGbmAgaW4uXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHJlcGxhY2UgOiBmdW5jdGlvbiggdGV4dCwgcmVwbGFjZUZuLCBjb250ZXh0T2JqICkge1xuXHRcdHZhciBtZSA9IHRoaXM7ICAvLyBmb3IgY2xvc3VyZVxuXHRcdFxuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMubWF0Y2hlclJlZ2V4LCBmdW5jdGlvbiggbWF0Y2hTdHIsICQxLCAkMiwgJDMsICQ0LCAkNSwgJDYsICQ3LCAkOCApIHtcblx0XHRcdHZhciBtYXRjaERlc2NPYmogPSBtZS5wcm9jZXNzQ2FuZGlkYXRlTWF0Y2goIG1hdGNoU3RyLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2LCAkNywgJDggKTsgIC8vIFwibWF0Y2ggZGVzY3JpcHRpb25cIiBvYmplY3Rcblx0XHRcdFxuXHRcdFx0Ly8gUmV0dXJuIG91dCB3aXRoIG5vIGNoYW5nZXMgZm9yIG1hdGNoIHR5cGVzIHRoYXQgYXJlIGRpc2FibGVkICh1cmwsIGVtYWlsLCB0d2l0dGVyKSwgb3IgZm9yIG1hdGNoZXMgdGhhdCBhcmUgXG5cdFx0XHQvLyBpbnZhbGlkIChmYWxzZSBwb3NpdGl2ZXMgZnJvbSB0aGUgbWF0Y2hlclJlZ2V4LCB3aGljaCBjYW4ndCB1c2UgbG9vay1iZWhpbmRzIHNpbmNlIHRoZXkgYXJlIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRcdGlmKCAhbWF0Y2hEZXNjT2JqICkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2hTdHI7XG5cdFx0XHRcdFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gR2VuZXJhdGUgcmVwbGFjZW1lbnQgdGV4dCBmb3IgdGhlIG1hdGNoIGZyb20gdGhlIGByZXBsYWNlRm5gXG5cdFx0XHRcdHZhciByZXBsYWNlU3RyID0gcmVwbGFjZUZuLmNhbGwoIGNvbnRleHRPYmosIG1hdGNoRGVzY09iai5tYXRjaCApO1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2hEZXNjT2JqLnByZWZpeFN0ciArIHJlcGxhY2VTdHIgKyBtYXRjaERlc2NPYmouc3VmZml4U3RyO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUHJvY2Vzc2VzIGEgY2FuZGlkYXRlIG1hdGNoIGZyb20gdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS4gXG5cdCAqIFxuXHQgKiBOb3QgYWxsIG1hdGNoZXMgZm91bmQgYnkgdGhlIHJlZ2V4IGFyZSBhY3R1YWwgVVJML2VtYWlsL1R3aXR0ZXIgbWF0Y2hlcywgYXMgZGV0ZXJtaW5lZCBieSB0aGUge0BsaW5rICNtYXRjaFZhbGlkYXRvcn0uIEluXG5cdCAqIHRoaXMgY2FzZSwgdGhlIG1ldGhvZCByZXR1cm5zIGBudWxsYC4gT3RoZXJ3aXNlLCBhIHZhbGlkIE9iamVjdCB3aXRoIGBwcmVmaXhTdHJgLCBgbWF0Y2hgLCBhbmQgYHN1ZmZpeFN0cmAgaXMgcmV0dXJuZWQuXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbWF0Y2hTdHIgVGhlIGZ1bGwgbWF0Y2ggdGhhdCB3YXMgZm91bmQgYnkgdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHR3aXR0ZXJNYXRjaCBUaGUgbWF0Y2hlZCB0ZXh0IG9mIGEgVHdpdHRlciBoYW5kbGUsIGlmIHRoZSBtYXRjaCBpcyBhIFR3aXR0ZXIgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIgVGhlIHdoaXRlc3BhY2UgY2hhciBiZWZvcmUgdGhlIEAgc2lnbiBpbiBhIFR3aXR0ZXIgaGFuZGxlIG1hdGNoLiBUaGlzIFxuXHQgKiAgIGlzIG5lZWRlZCBiZWNhdXNlIG9mIG5vIGxvb2tiZWhpbmRzIGluIEpTIHJlZ2V4ZXMsIGFuZCBpcyBuZWVkIHRvIHJlLWluY2x1ZGUgdGhlIGNoYXJhY3RlciBmb3IgdGhlIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlIFRoZSBhY3R1YWwgVHdpdHRlciB1c2VyIChpLmUgdGhlIHdvcmQgYWZ0ZXIgdGhlIEAgc2lnbiBpbiBhIFR3aXR0ZXIgbWF0Y2gpLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZW1haWxBZGRyZXNzTWF0Y2ggVGhlIG1hdGNoZWQgZW1haWwgYWRkcmVzcyBmb3IgYW4gZW1haWwgYWRkcmVzcyBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCBzdHJpbmcgZm9yIGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbCBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoXG5cdCAqICAgc29tZXRoaW5nIGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWUgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlICcvLycgZm9yIGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggZnJvbSBhICd3d3cnIHVybCwgd2l0aCB0aGUgY2hhcmFjdGVyIHRoYXQgXG5cdCAqICAgY29tZXMgYmVmb3JlIHRoZSAnLy8nLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSAnLy8nIGZvciBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoIGZyb20gYSBUTEQgKHRvcCBsZXZlbCBkb21haW4pIG1hdGNoLCB3aXRoIFxuXHQgKiAgIHRoZSBjaGFyYWN0ZXIgdGhhdCBjb21lcyBiZWZvcmUgdGhlICcvLycuXG5cdCAqICAgXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQSBcIm1hdGNoIGRlc2NyaXB0aW9uIG9iamVjdFwiLiBUaGlzIHdpbGwgYmUgYG51bGxgIGlmIHRoZSBtYXRjaCB3YXMgaW52YWxpZCwgb3IgaWYgYSBtYXRjaCB0eXBlIGlzIGRpc2FibGVkLlxuXHQgKiAgIE90aGVyd2lzZSwgdGhpcyB3aWxsIGJlIGFuIE9iamVjdCAobWFwKSB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblx0ICogQHJldHVybiB7U3RyaW5nfSByZXR1cm4ucHJlZml4U3RyIFRoZSBjaGFyKHMpIHRoYXQgc2hvdWxkIGJlIHByZXBlbmRlZCB0byB0aGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBUaGVzZSBhcmUgY2hhcihzKSB0aGF0XG5cdCAqICAgd2VyZSBuZWVkZWQgdG8gYmUgaW5jbHVkZWQgZnJvbSB0aGUgcmVnZXggbWF0Y2ggdGhhdCB3ZXJlIGlnbm9yZWQgYnkgcHJvY2Vzc2luZyBjb2RlLCBhbmQgc2hvdWxkIGJlIHJlLWluc2VydGVkIGludG8gXG5cdCAqICAgdGhlIHJlcGxhY2VtZW50IHN0cmVhbS5cblx0ICogQHJldHVybiB7U3RyaW5nfSByZXR1cm4uc3VmZml4U3RyIFRoZSBjaGFyKHMpIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkIHRvIHRoZSByZXBsYWNlbWVudCBzdHJpbmcuIFRoZXNlIGFyZSBjaGFyKHMpIHRoYXRcblx0ICogICB3ZXJlIG5lZWRlZCB0byBiZSBpbmNsdWRlZCBmcm9tIHRoZSByZWdleCBtYXRjaCB0aGF0IHdlcmUgaWdub3JlZCBieSBwcm9jZXNzaW5nIGNvZGUsIGFuZCBzaG91bGQgYmUgcmUtaW5zZXJ0ZWQgaW50byBcblx0ICogICB0aGUgcmVwbGFjZW1lbnQgc3RyZWFtLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSByZXR1cm4ubWF0Y2ggVGhlIE1hdGNoIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG1hdGNoIHRoYXQgd2FzIGZvdW5kLlxuXHQgKi9cblx0cHJvY2Vzc0NhbmRpZGF0ZU1hdGNoIDogZnVuY3Rpb24oIFxuXHRcdG1hdGNoU3RyLCB0d2l0dGVyTWF0Y2gsIHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhciwgdHdpdHRlckhhbmRsZSwgXG5cdFx0ZW1haWxBZGRyZXNzTWF0Y2gsIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoLCB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2gsIHRsZFByb3RvY29sUmVsYXRpdmVNYXRjaFxuXHQpIHtcblx0XHQvLyBOb3RlOiBUaGUgYG1hdGNoU3RyYCB2YXJpYWJsZSB3aWwgYmUgZml4ZWQgdXAgdG8gcmVtb3ZlIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm8gbG9uZ2VyIG5lZWRlZCAod2hpY2ggd2lsbCBcblx0XHQvLyBiZSBhZGRlZCB0byBgcHJlZml4U3RyYCBhbmQgYHN1ZmZpeFN0cmApLlxuXHRcdFxuXHRcdHZhciBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggPSB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2ggfHwgdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoLFxuXHRcdCAgICBtYXRjaCwgIC8vIFdpbGwgYmUgYW4gQXV0b2xpbmtlci5tYXRjaC5NYXRjaCBvYmplY3Rcblx0XHQgICAgXG5cdFx0ICAgIHByZWZpeFN0ciA9IFwiXCIsICAgICAgIC8vIEEgc3RyaW5nIHRvIHVzZSB0byBwcmVmaXggdGhlIGFuY2hvciB0YWcgdGhhdCBpcyBjcmVhdGVkLiBUaGlzIGlzIG5lZWRlZCBmb3IgdGhlIFR3aXR0ZXIgaGFuZGxlIG1hdGNoXG5cdFx0ICAgIHN1ZmZpeFN0ciA9IFwiXCI7ICAgICAgIC8vIEEgc3RyaW5nIHRvIHN1ZmZpeCB0aGUgYW5jaG9yIHRhZyB0aGF0IGlzIGNyZWF0ZWQuIFRoaXMgaXMgdXNlZCBpZiB0aGVyZSBpcyBhIHRyYWlsaW5nIHBhcmVudGhlc2lzIHRoYXQgc2hvdWxkIG5vdCBiZSBhdXRvLWxpbmtlZC5cblx0XHQgICAgXG5cdFx0XG5cdFx0Ly8gUmV0dXJuIG91dCB3aXRoIGBudWxsYCBmb3IgbWF0Y2ggdHlwZXMgdGhhdCBhcmUgZGlzYWJsZWQgKHVybCwgZW1haWwsIHR3aXR0ZXIpLCBvciBmb3IgbWF0Y2hlcyB0aGF0IGFyZSBcblx0XHQvLyBpbnZhbGlkIChmYWxzZSBwb3NpdGl2ZXMgZnJvbSB0aGUgbWF0Y2hlclJlZ2V4LCB3aGljaCBjYW4ndCB1c2UgbG9vay1iZWhpbmRzIHNpbmNlIHRoZXkgYXJlIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRpZihcblx0XHRcdCggdHdpdHRlck1hdGNoICYmICF0aGlzLnR3aXR0ZXIgKSB8fCAoIGVtYWlsQWRkcmVzc01hdGNoICYmICF0aGlzLmVtYWlsICkgfHwgKCB1cmxNYXRjaCAmJiAhdGhpcy51cmxzICkgfHxcblx0XHRcdCF0aGlzLm1hdGNoVmFsaWRhdG9yLmlzVmFsaWRNYXRjaCggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2gsIHByb3RvY29sUmVsYXRpdmVNYXRjaCApIFxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIEhhbmRsZSBhIGNsb3NpbmcgcGFyZW50aGVzaXMgYXQgdGhlIGVuZCBvZiB0aGUgbWF0Y2gsIGFuZCBleGNsdWRlIGl0IGlmIHRoZXJlIGlzIG5vdCBhIG1hdGNoaW5nIG9wZW4gcGFyZW50aGVzaXNcblx0XHQvLyBpbiB0aGUgbWF0Y2ggaXRzZWxmLiBcblx0XHRpZiggdGhpcy5tYXRjaEhhc1VuYmFsYW5jZWRDbG9zaW5nUGFyZW4oIG1hdGNoU3RyICkgKSB7XG5cdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnN1YnN0ciggMCwgbWF0Y2hTdHIubGVuZ3RoIC0gMSApOyAgLy8gcmVtb3ZlIHRoZSB0cmFpbGluZyBcIilcIlxuXHRcdFx0c3VmZml4U3RyID0gXCIpXCI7ICAvLyB0aGlzIHdpbGwgYmUgYWRkZWQgYWZ0ZXIgdGhlIGdlbmVyYXRlZCA8YT4gdGFnXG5cdFx0fVxuXHRcdFxuXHRcdFxuXHRcdGlmKCBlbWFpbEFkZHJlc3NNYXRjaCApIHtcblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guRW1haWwoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCBlbWFpbDogZW1haWxBZGRyZXNzTWF0Y2ggfSApO1xuXHRcdFx0XG5cdFx0fSBlbHNlIGlmKCB0d2l0dGVyTWF0Y2ggKSB7XG5cdFx0XHQvLyBmaXggdXAgdGhlIGBtYXRjaFN0cmAgaWYgdGhlcmUgd2FzIGEgcHJlY2VkaW5nIHdoaXRlc3BhY2UgY2hhciwgd2hpY2ggd2FzIG5lZWRlZCB0byBkZXRlcm1pbmUgdGhlIG1hdGNoIFxuXHRcdFx0Ly8gaXRzZWxmIChzaW5jZSB0aGVyZSBhcmUgbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ2V4ZXMpXG5cdFx0XHRpZiggdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyICkge1xuXHRcdFx0XHRwcmVmaXhTdHIgPSB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXI7XG5cdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc2xpY2UoIDEgKTsgIC8vIHJlbW92ZSB0aGUgcHJlZml4ZWQgd2hpdGVzcGFjZSBjaGFyIGZyb20gdGhlIG1hdGNoXG5cdFx0XHR9XG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXIoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCB0d2l0dGVySGFuZGxlOiB0d2l0dGVySGFuZGxlIH0gKTtcblx0XHRcdFxuXHRcdH0gZWxzZSB7ICAvLyB1cmwgbWF0Y2hcblx0XHRcdC8vIElmIGl0J3MgYSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIG1hdGNoLCByZW1vdmUgdGhlIGNoYXJhY3RlciBiZWZvcmUgdGhlICcvLycgKHdoaWNoIHRoZSBtYXRjaGVyUmVnZXggbmVlZGVkXG5cdFx0XHQvLyB0byBtYXRjaCBkdWUgdG8gdGhlIGxhY2sgb2YgYSBuZWdhdGl2ZSBsb29rLWJlaGluZCBpbiBKYXZhU2NyaXB0IHJlZ3VsYXIgZXhwcmVzc2lvbnMpXG5cdFx0XHRpZiggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdFx0XHR2YXIgY2hhckJlZm9yZU1hdGNoID0gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoLm1hdGNoKCB0aGlzLmNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXggKVsgMSBdIHx8IFwiXCI7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiggY2hhckJlZm9yZU1hdGNoICkgeyAgLy8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyBjaGFyIGJlZm9yZSBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLCB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmUgbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ2V4ZXMpXG5cdFx0XHRcdFx0cHJlZml4U3RyID0gY2hhckJlZm9yZU1hdGNoO1xuXHRcdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc2xpY2UoIDEgKTsgIC8vIHJlbW92ZSB0aGUgcHJlZml4ZWQgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guVXJsKCB7XG5cdFx0XHRcdG1hdGNoZWRUZXh0IDogbWF0Y2hTdHIsXG5cdFx0XHRcdHVybCA6IG1hdGNoU3RyLFxuXHRcdFx0XHRwcm90b2NvbFVybE1hdGNoIDogISFwcm90b2NvbFVybE1hdGNoLFxuXHRcdFx0XHRwcm90b2NvbFJlbGF0aXZlTWF0Y2ggOiAhIXByb3RvY29sUmVsYXRpdmVNYXRjaCxcblx0XHRcdFx0c3RyaXBQcmVmaXggOiB0aGlzLnN0cmlwUHJlZml4XG5cdFx0XHR9ICk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB7XG5cdFx0XHRwcmVmaXhTdHIgOiBwcmVmaXhTdHIsXG5cdFx0XHRzdWZmaXhTdHIgOiBzdWZmaXhTdHIsXG5cdFx0XHRtYXRjaCAgICAgOiBtYXRjaFxuXHRcdH07XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBtYXRjaCBmb3VuZCBoYXMgYW4gdW5tYXRjaGVkIGNsb3NpbmcgcGFyZW50aGVzaXMuIElmIHNvLCB0aGlzIHBhcmVudGhlc2lzIHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBmcm9tIHRoZSBtYXRjaCBpdHNlbGYsIGFuZCBhcHBlbmRlZCBhZnRlciB0aGUgZ2VuZXJhdGVkIGFuY2hvciB0YWcgaW4ge0BsaW5rICNwcm9jZXNzVGV4dE5vZGV9LlxuXHQgKiBcblx0ICogQSBtYXRjaCBtYXkgaGF2ZSBhbiBleHRyYSBjbG9zaW5nIHBhcmVudGhlc2lzIGF0IHRoZSBlbmQgb2YgdGhlIG1hdGNoIGJlY2F1c2UgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtdXN0IGluY2x1ZGUgcGFyZW50aGVzaXNcblx0ICogZm9yIFVSTHMgc3VjaCBhcyBcIndpa2lwZWRpYS5jb20vc29tZXRoaW5nXyhkaXNhbWJpZ3VhdGlvbilcIiwgd2hpY2ggc2hvdWxkIGJlIGF1dG8tbGlua2VkLiBcblx0ICogXG5cdCAqIEhvd2V2ZXIsIGFuIGV4dHJhIHBhcmVudGhlc2lzICp3aWxsKiBiZSBpbmNsdWRlZCB3aGVuIHRoZSBVUkwgaXRzZWxmIGlzIHdyYXBwZWQgaW4gcGFyZW50aGVzaXMsIHN1Y2ggYXMgaW4gdGhlIGNhc2Ugb2Zcblx0ICogXCIod2lraXBlZGlhLmNvbS9zb21ldGhpbmdfKGRpc2FtYmlndWF0aW9uKSlcIi4gSW4gdGhpcyBjYXNlLCB0aGUgbGFzdCBjbG9zaW5nIHBhcmVudGhlc2lzIHNob3VsZCAqbm90KiBiZSBwYXJ0IG9mIHRoZSBVUkwgXG5cdCAqIGl0c2VsZiwgYW5kIHRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGB0cnVlYC5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBtYXRjaFN0ciBUaGUgZnVsbCBtYXRjaCBzdHJpbmcgZnJvbSB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlcmUgaXMgYW4gdW5iYWxhbmNlZCBjbG9zaW5nIHBhcmVudGhlc2lzIGF0IHRoZSBlbmQgb2YgdGhlIGBtYXRjaFN0cmAsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0bWF0Y2hIYXNVbmJhbGFuY2VkQ2xvc2luZ1BhcmVuIDogZnVuY3Rpb24oIG1hdGNoU3RyICkge1xuXHRcdHZhciBsYXN0Q2hhciA9IG1hdGNoU3RyLmNoYXJBdCggbWF0Y2hTdHIubGVuZ3RoIC0gMSApO1xuXHRcdFxuXHRcdGlmKCBsYXN0Q2hhciA9PT0gJyknICkge1xuXHRcdFx0dmFyIG9wZW5QYXJlbnNNYXRjaCA9IG1hdGNoU3RyLm1hdGNoKCAvXFwoL2cgKSxcblx0XHRcdCAgICBjbG9zZVBhcmVuc01hdGNoID0gbWF0Y2hTdHIubWF0Y2goIC9cXCkvZyApLFxuXHRcdFx0ICAgIG51bU9wZW5QYXJlbnMgPSAoIG9wZW5QYXJlbnNNYXRjaCAmJiBvcGVuUGFyZW5zTWF0Y2gubGVuZ3RoICkgfHwgMCxcblx0XHRcdCAgICBudW1DbG9zZVBhcmVucyA9ICggY2xvc2VQYXJlbnNNYXRjaCAmJiBjbG9zZVBhcmVuc01hdGNoLmxlbmd0aCApIHx8IDA7XG5cdFx0XHRcblx0XHRcdGlmKCBudW1PcGVuUGFyZW5zIDwgbnVtQ2xvc2VQYXJlbnMgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBzY3JpcHR1cmw6dHJ1ZSAqL1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNsYXNzIEF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3JcbiAqIEBleHRlbmRzIE9iamVjdFxuICogXG4gKiBVc2VkIGJ5IEF1dG9saW5rZXIgdG8gZmlsdGVyIG91dCBmYWxzZSBwb3NpdGl2ZXMgZnJvbSB0aGUge0BsaW5rIEF1dG9saW5rZXIjbWF0Y2hlclJlZ2V4fS5cbiAqIFxuICogRHVlIHRvIHRoZSBsaW1pdGF0aW9ucyBvZiByZWd1bGFyIGV4cHJlc3Npb25zIChpbmNsdWRpbmcgdGhlIG1pc3NpbmcgZmVhdHVyZSBvZiBsb29rLWJlaGluZHMgaW4gSlMgcmVndWxhciBleHByZXNzaW9ucyksXG4gKiB3ZSBjYW5ub3QgYWx3YXlzIGRldGVybWluZSB0aGUgdmFsaWRpdHkgb2YgYSBnaXZlbiBtYXRjaC4gVGhpcyBjbGFzcyBhcHBsaWVzIGEgYml0IG9mIGFkZGl0aW9uYWwgbG9naWMgdG8gZmlsdGVyIG91dCBhbnlcbiAqIGZhbHNlIHBvc2l0aXZlcyB0aGF0IGhhdmUgYmVlbiBtYXRjaGVkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlciNtYXRjaGVyUmVnZXh9LlxuICovXG5BdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGludmFsaWRQcm90b2NvbFJlbE1hdGNoUmVnZXhcblx0ICogXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBjaGVjayBhIHBvdGVudGlhbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgbWF0Y2gsIGNvbWluZyBmcm9tIHRoZSBcblx0ICoge0BsaW5rIEF1dG9saW5rZXIjbWF0Y2hlclJlZ2V4fS4gQSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgaXMsIGZvciBleGFtcGxlLCBcIi8veWFob28uY29tXCJcblx0ICogXG5cdCAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlcmUgaXMgYSB3b3JkIGNoYXJhY3RlciBiZWZvcmUgdGhlICcvLycgbWF0Y2ggaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIFxuXHQgKiB3ZSBzaG91bGQgYWN0dWFsbHkgYXV0b2xpbmsgYSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVnYXRpdmUgbG9vay1iZWhpbmQgaW4gXG5cdCAqIEphdmFTY3JpcHQgcmVndWxhciBleHByZXNzaW9ucy4gXG5cdCAqIFxuXHQgKiBGb3IgaW5zdGFuY2UsIHdlIHdhbnQgdG8gYXV0b2xpbmsgc29tZXRoaW5nIGxpa2UgXCJHbyB0bzogLy9nb29nbGUuY29tXCIsIGJ1dCB3ZSBkb24ndCB3YW50IHRvIGF1dG9saW5rIHNvbWV0aGluZyBcblx0ICogbGlrZSBcImFiYy8vZ29vZ2xlLmNvbVwiXG5cdCAqL1xuXHRpbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4IDogL15bXFx3XVxcL1xcLy8sXG5cdFxuXHQvKipcblx0ICogUmVnZXggdG8gdGVzdCBmb3IgYSBmdWxsIHByb3RvY29sLCB3aXRoIHRoZSB0d28gdHJhaWxpbmcgc2xhc2hlcy4gRXg6ICdodHRwOi8vJ1xuXHQgKiBcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGhhc0Z1bGxQcm90b2NvbFJlZ2V4XG5cdCAqL1xuXHRoYXNGdWxsUHJvdG9jb2xSZWdleCA6IC9eW0EtWmEtel1bLS4rQS1aYS16MC05XSs6XFwvXFwvLyxcblx0XG5cdC8qKlxuXHQgKiBSZWdleCB0byBmaW5kIHRoZSBVUkkgc2NoZW1lLCBzdWNoIGFzICdtYWlsdG86Jy5cblx0ICogXG5cdCAqIFRoaXMgaXMgdXNlZCB0byBmaWx0ZXIgb3V0ICdqYXZhc2NyaXB0OicgYW5kICd2YnNjcmlwdDonIHNjaGVtZXMuXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gdXJpU2NoZW1lUmVnZXhcblx0ICovXG5cdHVyaVNjaGVtZVJlZ2V4IDogL15bQS1aYS16XVstLitBLVphLXowLTldKzovLFxuXHRcblx0LyoqXG5cdCAqIFJlZ2V4IHRvIGRldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgd29yZCBjaGFyIGV4aXN0cyBhZnRlciB0aGUgcHJvdG9jb2wgKGkuZS4gYWZ0ZXIgdGhlICc6Jylcblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBoYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleFxuXHQgKi9cblx0aGFzV29yZENoYXJBZnRlclByb3RvY29sUmVnZXggOiAvOlteXFxzXSo/W0EtWmEtel0vLFxuXHRcblx0XG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gbWF0Y2ggZm91bmQgYnkge0BsaW5rIEF1dG9saW5rZXIjcHJvY2Vzc1RleHROb2RlfSBpcyB2YWxpZC4gV2lsbCByZXR1cm4gYGZhbHNlYCBmb3I6XG5cdCAqIFxuXHQgKiAxKSBVUkwgbWF0Y2hlcyB3aGljaCBkbyBub3QgaGF2ZSBhdCBsZWFzdCBoYXZlIG9uZSBwZXJpb2QgKCcuJykgaW4gdGhlIGRvbWFpbiBuYW1lIChlZmZlY3RpdmVseSBza2lwcGluZyBvdmVyIFxuXHQgKiAgICBtYXRjaGVzIGxpa2UgXCJhYmM6ZGVmXCIpLiBIb3dldmVyLCBVUkwgbWF0Y2hlcyB3aXRoIGEgcHJvdG9jb2wgd2lsbCBiZSBhbGxvd2VkIChleDogJ2h0dHA6Ly9sb2NhbGhvc3QnKVxuXHQgKiAyKSBVUkwgbWF0Y2hlcyB3aGljaCBkbyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZCBjaGFyYWN0ZXIgaW4gdGhlIGRvbWFpbiBuYW1lIChlZmZlY3RpdmVseSBza2lwcGluZyBvdmVyXG5cdCAqICAgIG1hdGNoZXMgbGlrZSBcImdpdDoxLjBcIikuXG5cdCAqIDMpIEEgcHJvdG9jb2wtcmVsYXRpdmUgdXJsIG1hdGNoIChhIFVSTCBiZWdpbm5pbmcgd2l0aCAnLy8nKSB3aG9zZSBwcmV2aW91cyBjaGFyYWN0ZXIgaXMgYSB3b3JkIGNoYXJhY3RlciBcblx0ICogICAgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXIgc3RyaW5ncyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCIpXG5cdCAqIFxuXHQgKiBPdGhlcndpc2UsIHJldHVybnMgYHRydWVgLlxuXHQgKiBcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCwgaWYgdGhlcmUgd2FzIG9uZS4gV2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2wgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaFxuXHQgKiAgIHNvbWV0aGluZyBsaWtlICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lIGhhcyBhdCBsZWFzdCBvbmUgJy4nIGluIGl0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSBwcm90b2NvbC1yZWxhdGl2ZSBzdHJpbmcgZm9yIGEgVVJMIG1hdGNoIChpLmUuICcvLycpLCBwb3NzaWJseSB3aXRoIGEgcHJlY2VkaW5nXG5cdCAqICAgY2hhcmFjdGVyIChleCwgYSBzcGFjZSwgc3VjaCBhczogJyAvLycsIG9yIGEgbGV0dGVyLCBzdWNoIGFzOiAnYS8vJykuIFRoZSBtYXRjaCBpcyBpbnZhbGlkIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXJcblx0ICogICBwcmVjZWRpbmcgdGhlICcvLycuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgbWF0Y2ggZ2l2ZW4gaXMgdmFsaWQgYW5kIHNob3VsZCBiZSBwcm9jZXNzZWQsIG9yIGBmYWxzZWAgaWYgdGhlIG1hdGNoIGlzIGludmFsaWQgYW5kL29yIFxuXHQgKiAgIHNob3VsZCBqdXN0IG5vdCBiZSBwcm9jZXNzZWQuXG5cdCAqL1xuXHRpc1ZhbGlkTWF0Y2ggOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2gsIHByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRpZihcblx0XHRcdCggcHJvdG9jb2xVcmxNYXRjaCAmJiAhdGhpcy5pc1ZhbGlkVXJpU2NoZW1lKCBwcm90b2NvbFVybE1hdGNoICkgKSB8fFxuXHRcdFx0dGhpcy51cmxNYXRjaERvZXNOb3RIYXZlUHJvdG9jb2xPckRvdCggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB8fCAgICAgICAvLyBBdCBsZWFzdCBvbmUgcGVyaW9kICgnLicpIG11c3QgZXhpc3QgaW4gdGhlIFVSTCBtYXRjaCBmb3IgdXMgdG8gY29uc2lkZXIgaXQgYW4gYWN0dWFsIFVSTCwgKnVubGVzcyogaXQgd2FzIGEgZnVsbCBwcm90b2NvbCBtYXRjaCAobGlrZSAnaHR0cDovL2xvY2FsaG9zdCcpXG5cdFx0XHR0aGlzLnVybE1hdGNoRG9lc05vdEhhdmVBdExlYXN0T25lV29yZENoYXIoIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkgfHwgIC8vIEF0IGxlYXN0IG9uZSBsZXR0ZXIgY2hhcmFjdGVyIG11c3QgZXhpc3QgaW4gdGhlIGRvbWFpbiBuYW1lIGFmdGVyIGEgcHJvdG9jb2wgbWF0Y2guIEV4OiBza2lwIG92ZXIgc29tZXRoaW5nIGxpa2UgXCJnaXQ6MS4wXCJcblx0XHRcdHRoaXMuaXNJbnZhbGlkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoKCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSAgICAgICAgICAgICAgICAgLy8gQSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCB3aGljaCBoYXMgYSB3b3JkIGNoYXJhY3RlciBpbiBmcm9udCBvZiBpdCAoc28gd2UgY2FuIHNraXAgc29tZXRoaW5nIGxpa2UgXCJhYmMvL2dvb2dsZS5jb21cIilcblx0XHQpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgdGhlIFVSSSBzY2hlbWUgaXMgYSB2YWxpZCBzY2hlbWUgdG8gYmUgYXV0b2xpbmtlZC4gUmV0dXJucyBgZmFsc2VgIGlmIHRoZSBzY2hlbWUgaXMgXG5cdCAqICdqYXZhc2NyaXB0Oicgb3IgJ3Zic2NyaXB0Oidcblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmlTY2hlbWVNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBmdWxsIFVSSSBzY2hlbWUgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScgXG5cdCAqICAgb3IgJ21haWx0bzphQGEuY29tJy5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBzY2hlbWUgaXMgYSB2YWxpZCBvbmUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0aXNWYWxpZFVyaVNjaGVtZSA6IGZ1bmN0aW9uKCB1cmlTY2hlbWVNYXRjaCApIHtcblx0XHR2YXIgdXJpU2NoZW1lID0gdXJpU2NoZW1lTWF0Y2gubWF0Y2goIHRoaXMudXJpU2NoZW1lUmVnZXggKVsgMCBdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XG5cdFx0cmV0dXJuICggdXJpU2NoZW1lICE9PSAnamF2YXNjcmlwdDonICYmIHVyaVNjaGVtZSAhPT0gJ3Zic2NyaXB0OicgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGVpdGhlcjpcblx0ICogXG5cdCAqIGEpIGEgZnVsbCBwcm90b2NvbCAoaS5lLiAnaHR0cDovLycpLCBvclxuXHQgKiBiKSBhdCBsZWFzdCBvbmUgZG90ICgnLicpIGluIHRoZSBkb21haW4gbmFtZSAoZm9yIGEgbm9uLWZ1bGwtcHJvdG9jb2wgbWF0Y2gpLlxuXHQgKiBcblx0ICogRWl0aGVyIHNpdHVhdGlvbiBpcyBjb25zaWRlcmVkIGFuIGludmFsaWQgVVJMIChleDogJ2dpdDpkJyBkb2VzIG5vdCBoYXZlIGVpdGhlciB0aGUgJzovLycgcGFydCwgb3IgYXQgbGVhc3Qgb25lIGRvdFxuXHQgKiBpbiB0aGUgZG9tYWluIG5hbWUuIElmIHRoZSBtYXRjaCB3YXMgJ2dpdDphYmMuY29tJywgd2Ugd291bGQgY29uc2lkZXIgdGhpcyB2YWxpZC4pXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbCBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoXG5cdCAqICAgc29tZXRoaW5nIGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWUgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYSBmdWxsIHByb3RvY29sLCBvciBhdCBsZWFzdCBvbmUgZG90ICgnLicpIGluIGEgbm9uLWZ1bGwtcHJvdG9jb2xcblx0ICogICBtYXRjaC5cblx0ICovXG5cdHVybE1hdGNoRG9lc05vdEhhdmVQcm90b2NvbE9yRG90IDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdHJldHVybiAoICEhdXJsTWF0Y2ggJiYgKCAhcHJvdG9jb2xVcmxNYXRjaCB8fCAhdGhpcy5oYXNGdWxsUHJvdG9jb2xSZWdleC50ZXN0KCBwcm90b2NvbFVybE1hdGNoICkgKSAmJiB1cmxNYXRjaC5pbmRleE9mKCAnLicgKSA9PT0gLTEgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGF0IGxlYXN0IG9uZSB3b3JkIGNoYXJhY3RlciBhZnRlciB0aGUgcHJvdG9jb2wgKGkuZS4gaW4gdGhlIGRvbWFpbiBuYW1lKS5cblx0ICogXG5cdCAqIEF0IGxlYXN0IG9uZSBsZXR0ZXIgY2hhcmFjdGVyIG11c3QgZXhpc3QgaW4gdGhlIGRvbWFpbiBuYW1lIGFmdGVyIGEgcHJvdG9jb2wgbWF0Y2guIEV4OiBza2lwIG92ZXIgc29tZXRoaW5nIFxuXHQgKiBsaWtlIFwiZ2l0OjEuMFwiXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbCBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvXG5cdCAqICAga25vdyB3aGV0aGVyIG9yIG5vdCB3ZSBoYXZlIGEgcHJvdG9jb2wgaW4gdGhlIFVSTCBzdHJpbmcsIGluIG9yZGVyIHRvIGNoZWNrIGZvciBhIHdvcmQgY2hhcmFjdGVyIGFmdGVyIHRoZSBwcm90b2NvbFxuXHQgKiAgIHNlcGFyYXRvciAoJzonKS5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZCBjaGFyYWN0ZXIgaW4gaXQgYWZ0ZXIgdGhlIHByb3RvY29sLCBgZmFsc2VgXG5cdCAqICAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0dXJsTWF0Y2hEb2VzTm90SGF2ZUF0TGVhc3RPbmVXb3JkQ2hhciA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRpZiggdXJsTWF0Y2ggJiYgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRcdHJldHVybiAhdGhpcy5oYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleC50ZXN0KCB1cmxNYXRjaCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggaXMgYW4gaW52YWxpZCBvbmUuIFRoaXMgbWV0aG9kIHJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIGEgYHByb3RvY29sUmVsYXRpdmVNYXRjaGAsXG5cdCAqIGFuZCB0aGF0IG1hdGNoIGNvbnRhaW5zIGEgd29yZCBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnLy8nIChpLmUuIGl0IG11c3QgY29udGFpbiB3aGl0ZXNwYWNlIG9yIG5vdGhpbmcgYmVmb3JlIHRoZSAnLy8nIGluXG5cdCAqIG9yZGVyIHRvIGJlIGNvbnNpZGVyZWQgdmFsaWQpLlxuXHQgKiBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgcHJvdG9jb2wtcmVsYXRpdmUgc3RyaW5nIGZvciBhIFVSTCBtYXRjaCAoaS5lLiAnLy8nKSwgcG9zc2libHkgd2l0aCBhIHByZWNlZGluZ1xuXHQgKiAgIGNoYXJhY3RlciAoZXgsIGEgc3BhY2UsIHN1Y2ggYXM6ICcgLy8nLCBvciBhIGxldHRlciwgc3VjaCBhczogJ2EvLycpLiBUaGUgbWF0Y2ggaXMgaW52YWxpZCBpZiB0aGVyZSBpcyBhIHdvcmQgY2hhcmFjdGVyXG5cdCAqICAgcHJlY2VkaW5nIHRoZSAnLy8nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgaXQgaXMgYW4gaW52YWxpZCBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRpc0ludmFsaWRQcm90b2NvbFJlbGF0aXZlTWF0Y2ggOiBmdW5jdGlvbiggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdHJldHVybiAoICEhcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICYmIHRoaXMuaW52YWxpZFByb3RvY29sUmVsTWF0Y2hSZWdleC50ZXN0KCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSApO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLiBBIE1hdGNoIG9iamVjdCBpcyB3aGF0IGlzIHByb3ZpZGVkIGluIGEgXG4gKiB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufSwgYW5kIG1heSBiZSB1c2VkIHRvIHF1ZXJ5IGZvciBkZXRhaWxzIGFib3V0IHRoZSBtYXRjaC5cbiAqIFxuICogRm9yIGV4YW1wbGU6XG4gKiBcbiAqICAgICB2YXIgaW5wdXQgPSBcIi4uLlwiOyAgLy8gc3RyaW5nIHdpdGggVVJMcywgRW1haWwgQWRkcmVzc2VzLCBhbmQgVHdpdHRlciBIYW5kbGVzXG4gKiAgICAgXG4gKiAgICAgdmFyIGxpbmtlZFRleHQgPSBBdXRvbGlua2VyLmxpbmsoIGlucHV0LCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImhyZWYgPSBcIiwgbWF0Y2guZ2V0QW5jaG9ySHJlZigpICk7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ0ZXh0ID0gXCIsIG1hdGNoLmdldEFuY2hvclRleHQoKSApO1xuICogICAgICAgICBcbiAqICAgICAgICAgICAgIHN3aXRjaCggbWF0Y2guZ2V0VHlwZSgpICkge1xuICogICAgICAgICAgICAgICAgIGNhc2UgJ3VybCcgOiBcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwidXJsOiBcIiwgbWF0Y2guZ2V0VXJsKCkgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwiZW1haWw6IFwiLCBtYXRjaC5nZXRFbWFpbCgpICk7XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInIDpcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwidHdpdHRlcjogXCIsIG1hdGNoLmdldFR3aXR0ZXJIYW5kbGUoKSApO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICogICAgIFxuICogU2VlIHRoZSB7QGxpbmsgQXV0b2xpbmtlcn0gY2xhc3MgZm9yIG1vcmUgZGV0YWlscyBvbiB1c2luZyB0aGUge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0uXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guTWF0Y2ggPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IG1hdGNoZWRUZXh0IChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRcblx0XG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IGNmZyBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgTWF0Y2ggaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cdH0sXG5cblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIG9yaWdpbmFsIHRleHQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldE1hdGNoZWRUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubWF0Y2hlZFRleHQ7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kLFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kXG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guRW1haWxcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIEVtYWlsIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC5cbiAqIFxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guRW1haWwgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBlbWFpbCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgZW1haWwgYWRkcmVzcyB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdlbWFpbCc7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGVtYWlsIGFkZHJlc3MgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEVtYWlsIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZW1haWw7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ21haWx0bzonICsgdGhpcy5lbWFpbDtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZW1haWw7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXJcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIFR3aXR0ZXIgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLlxuICogXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdHdpdHRlckhhbmRsZSAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgVHdpdHRlciBoYW5kbGUgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndHdpdHRlcic7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUd2l0dGVySGFuZGxlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudHdpdHRlckhhbmRsZTtcblx0fSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnaHR0cHM6Ly90d2l0dGVyLmNvbS8nICsgdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ0AnICsgdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5VcmxcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIFVybCBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLlVybCA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHVybCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgdXJsIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHByb3RvY29sVXJsTWF0Y2ggKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogYHRydWVgIGlmIHRoZSBVUkwgaXMgYSBtYXRjaCB3aGljaCBhbHJlYWR5IGhhcyBhIHByb3RvY29sIChpLmUuICdodHRwOi8vJyksIGBmYWxzZWAgaWYgdGhlIG1hdGNoIHdhcyBmcm9tIGEgJ3d3dycgb3Jcblx0ICoga25vd24gVExEIG1hdGNoLlxuXHQgKi9cblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogYHRydWVgIGlmIHRoZSBVUkwgaXMgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC4gQSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCBpcyBhIFVSTCB0aGF0IHN0YXJ0cyB3aXRoICcvLycsXG5cdCAqIGFuZCB3aWxsIGJlIGVpdGhlciBodHRwOi8vIG9yIGh0dHBzOi8vIGJhc2VkIG9uIHRoZSBwcm90b2NvbCB0aGF0IHRoZSBzaXRlIGlzIGxvYWRlZCB1bmRlci5cblx0ICovXG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXggKHJlcXVpcmVkKVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3N0cmlwUHJlZml4XG5cdCAqL1xuXHRcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHVybFByZWZpeFJlZ2V4XG5cdCAqIFxuXHQgKiBBIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHJlbW92ZSB0aGUgJ2h0dHA6Ly8nIG9yICdodHRwczovLycgYW5kL29yIHRoZSAnd3d3LicgZnJvbSBVUkxzLlxuXHQgKi9cblx0dXJsUHJlZml4UmVnZXg6IC9eKGh0dHBzPzpcXC9cXC8pPyh3d3dcXC4pPy9pLFxuXHRcblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBwcm90b2NvbFJlbGF0aXZlUmVnZXhcblx0ICogXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byByZW1vdmUgdGhlIHByb3RvY29sLXJlbGF0aXZlICcvLycgZnJvbSB0aGUge0BsaW5rICN1cmx9IHN0cmluZywgZm9yIHB1cnBvc2VzXG5cdCAqIG9mIHtAbGluayAjZ2V0QW5jaG9yVGV4dH0uIEEgcHJvdG9jb2wtcmVsYXRpdmUgVVJMIGlzLCBmb3IgZXhhbXBsZSwgXCIvL3lhaG9vLmNvbVwiXG5cdCAqL1xuXHRwcm90b2NvbFJlbGF0aXZlUmVnZXggOiAvXlxcL1xcLy8sXG5cdFxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBwcm90b2NvbFByZXBlbmRlZFxuXHQgKiBcblx0ICogV2lsbCBiZSBzZXQgdG8gYHRydWVgIGlmIHRoZSAnaHR0cDovLycgcHJvdG9jb2wgaGFzIGJlZW4gcHJlcGVuZGVkIHRvIHRoZSB7QGxpbmsgI3VybH0gKGJlY2F1c2UgdGhlXG5cdCAqIHtAbGluayAjdXJsfSBkaWQgbm90IGhhdmUgYSBwcm90b2NvbClcblx0ICovXG5cdHByb3RvY29sUHJlcGVuZGVkIDogZmFsc2UsXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndXJsJztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgdXJsIHRoYXQgd2FzIG1hdGNoZWQsIGFzc3VtaW5nIHRoZSBwcm90b2NvbCB0byBiZSAnaHR0cDovLycgaWYgdGhlIG9yaWdpbmFsXG5cdCAqIG1hdGNoIHdhcyBtaXNzaW5nIGEgcHJvdG9jb2wuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRVcmwgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy51cmw7XG5cdFx0XG5cdFx0Ly8gaWYgdGhlIHVybCBzdHJpbmcgZG9lc24ndCBiZWdpbiB3aXRoIGEgcHJvdG9jb2wsIGFzc3VtZSAnaHR0cDovLydcblx0XHRpZiggIXRoaXMucHJvdG9jb2xSZWxhdGl2ZU1hdGNoICYmICF0aGlzLnByb3RvY29sVXJsTWF0Y2ggJiYgIXRoaXMucHJvdG9jb2xQcmVwZW5kZWQgKSB7XG5cdFx0XHR1cmwgPSB0aGlzLnVybCA9ICdodHRwOi8vJyArIHVybDtcblx0XHRcdFxuXHRcdFx0dGhpcy5wcm90b2NvbFByZXBlbmRlZCA9IHRydWU7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB1cmw7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5nZXRVcmwoKTtcblx0XHRcblx0XHRyZXR1cm4gdXJsLnJlcGxhY2UoIC8mYW1wOy9nLCAnJicgKTsgIC8vIGFueSAmYW1wOydzIGluIHRoZSBVUkwgc2hvdWxkIGJlIGNvbnZlcnRlZCBiYWNrIHRvICcmJyBpZiB0aGV5IHdlcmUgZGlzcGxheWVkIGFzICZhbXA7IGluIHRoZSBzb3VyY2UgaHRtbCBcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFuY2hvclRleHQgPSB0aGlzLmdldFVybCgpO1xuXHRcdFxuXHRcdGlmKCB0aGlzLnByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRcdC8vIFN0cmlwIG9mZiBhbnkgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSBhbmNob3IgdGV4dFxuXHRcdFx0YW5jaG9yVGV4dCA9IHRoaXMuc3RyaXBQcm90b2NvbFJlbGF0aXZlUHJlZml4KCBhbmNob3JUZXh0ICk7XG5cdFx0fVxuXHRcdGlmKCB0aGlzLnN0cmlwUHJlZml4ICkge1xuXHRcdFx0YW5jaG9yVGV4dCA9IHRoaXMuc3RyaXBVcmxQcmVmaXgoIGFuY2hvclRleHQgKTtcblx0XHR9XG5cdFx0YW5jaG9yVGV4dCA9IHRoaXMucmVtb3ZlVHJhaWxpbmdTbGFzaCggYW5jaG9yVGV4dCApOyAgLy8gcmVtb3ZlIHRyYWlsaW5nIHNsYXNoLCBpZiB0aGVyZSBpcyBvbmVcblx0XHRcblx0XHRyZXR1cm4gYW5jaG9yVGV4dDtcblx0fSxcblx0XG5cdFxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XG5cdC8vIFV0aWxpdHkgRnVuY3Rpb25hbGl0eVxuXHRcblx0LyoqXG5cdCAqIFN0cmlwcyB0aGUgVVJMIHByZWZpeCAoc3VjaCBhcyBcImh0dHA6Ly9cIiBvciBcImh0dHBzOi8vXCIpIGZyb20gdGhlIGdpdmVuIHRleHQuXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCBvZiB0aGUgYW5jaG9yIHRoYXQgaXMgYmVpbmcgZ2VuZXJhdGVkLCBmb3Igd2hpY2ggdG8gc3RyaXAgb2ZmIHRoZVxuXHQgKiAgIHVybCBwcmVmaXggKHN1Y2ggYXMgc3RyaXBwaW5nIG9mZiBcImh0dHA6Ly9cIilcblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgYGFuY2hvclRleHRgLCB3aXRoIHRoZSBwcmVmaXggc3RyaXBwZWQuXG5cdCAqL1xuXHRzdHJpcFVybFByZWZpeCA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMudXJsUHJlZml4UmVnZXgsICcnICk7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFN0cmlwcyBhbnkgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSBhbmNob3IgdGV4dC5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byBzdHJpcCBvZmYgdGhlXG5cdCAqICAgcHJvdG9jb2wtcmVsYXRpdmUgcHJlZml4IChzdWNoIGFzIHN0cmlwcGluZyBvZmYgXCIvL1wiKVxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHByb3RvY29sLXJlbGF0aXZlIHByZWZpeCBzdHJpcHBlZC5cblx0ICovXG5cdHN0cmlwUHJvdG9jb2xSZWxhdGl2ZVByZWZpeCA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMucHJvdG9jb2xSZWxhdGl2ZVJlZ2V4LCAnJyApO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFueSB0cmFpbGluZyBzbGFzaCBmcm9tIHRoZSBnaXZlbiBgYW5jaG9yVGV4dGAsIGluIHByZXBhcmF0aW9uIGZvciB0aGUgdGV4dCB0byBiZSBkaXNwbGF5ZWQuXG5cdCAqIFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9yVGV4dCBUaGUgdGV4dCBvZiB0aGUgYW5jaG9yIHRoYXQgaXMgYmVpbmcgZ2VuZXJhdGVkLCBmb3Igd2hpY2ggdG8gcmVtb3ZlIGFueSB0cmFpbGluZ1xuXHQgKiAgIHNsYXNoICgnLycpIHRoYXQgbWF5IGV4aXN0LlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHRyYWlsaW5nIHNsYXNoIHJlbW92ZWQuXG5cdCAqL1xuXHRyZW1vdmVUcmFpbGluZ1NsYXNoIDogZnVuY3Rpb24oIGFuY2hvclRleHQgKSB7XG5cdFx0aWYoIGFuY2hvclRleHQuY2hhckF0KCBhbmNob3JUZXh0Lmxlbmd0aCAtIDEgKSA9PT0gJy8nICkge1xuXHRcdFx0YW5jaG9yVGV4dCA9IGFuY2hvclRleHQuc2xpY2UoIDAsIC0xICk7XG5cdFx0fVxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9XG5cdFxufSApO1xucmV0dXJuIEF1dG9saW5rZXI7XG5cbn0pKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliLycpO1xuIiwiLy8gTGlzdCBvZiB2YWxpZCBlbnRpdGllc1xuLy9cbi8vIEdlbmVyYXRlIHdpdGggLi9zdXBwb3J0L2VudGl0aWVzLmpzIHNjcmlwdFxuLy9cbid1c2Ugc3RyaWN0JztcblxuLyplc2xpbnQgcXVvdGVzOjAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFwiQWFjdXRlXCI6XCJcXHUwMEMxXCIsXG4gIFwiYWFjdXRlXCI6XCJcXHUwMEUxXCIsXG4gIFwiQWJyZXZlXCI6XCJcXHUwMTAyXCIsXG4gIFwiYWJyZXZlXCI6XCJcXHUwMTAzXCIsXG4gIFwiYWNcIjpcIlxcdTIyM0VcIixcbiAgXCJhY2RcIjpcIlxcdTIyM0ZcIixcbiAgXCJhY0VcIjpcIlxcdTIyM0VcXHUwMzMzXCIsXG4gIFwiQWNpcmNcIjpcIlxcdTAwQzJcIixcbiAgXCJhY2lyY1wiOlwiXFx1MDBFMlwiLFxuICBcImFjdXRlXCI6XCJcXHUwMEI0XCIsXG4gIFwiQWN5XCI6XCJcXHUwNDEwXCIsXG4gIFwiYWN5XCI6XCJcXHUwNDMwXCIsXG4gIFwiQUVsaWdcIjpcIlxcdTAwQzZcIixcbiAgXCJhZWxpZ1wiOlwiXFx1MDBFNlwiLFxuICBcImFmXCI6XCJcXHUyMDYxXCIsXG4gIFwiQWZyXCI6XCJcXHVEODM1XFx1REQwNFwiLFxuICBcImFmclwiOlwiXFx1RDgzNVxcdUREMUVcIixcbiAgXCJBZ3JhdmVcIjpcIlxcdTAwQzBcIixcbiAgXCJhZ3JhdmVcIjpcIlxcdTAwRTBcIixcbiAgXCJhbGVmc3ltXCI6XCJcXHUyMTM1XCIsXG4gIFwiYWxlcGhcIjpcIlxcdTIxMzVcIixcbiAgXCJBbHBoYVwiOlwiXFx1MDM5MVwiLFxuICBcImFscGhhXCI6XCJcXHUwM0IxXCIsXG4gIFwiQW1hY3JcIjpcIlxcdTAxMDBcIixcbiAgXCJhbWFjclwiOlwiXFx1MDEwMVwiLFxuICBcImFtYWxnXCI6XCJcXHUyQTNGXCIsXG4gIFwiQU1QXCI6XCJcXHUwMDI2XCIsXG4gIFwiYW1wXCI6XCJcXHUwMDI2XCIsXG4gIFwiQW5kXCI6XCJcXHUyQTUzXCIsXG4gIFwiYW5kXCI6XCJcXHUyMjI3XCIsXG4gIFwiYW5kYW5kXCI6XCJcXHUyQTU1XCIsXG4gIFwiYW5kZFwiOlwiXFx1MkE1Q1wiLFxuICBcImFuZHNsb3BlXCI6XCJcXHUyQTU4XCIsXG4gIFwiYW5kdlwiOlwiXFx1MkE1QVwiLFxuICBcImFuZ1wiOlwiXFx1MjIyMFwiLFxuICBcImFuZ2VcIjpcIlxcdTI5QTRcIixcbiAgXCJhbmdsZVwiOlwiXFx1MjIyMFwiLFxuICBcImFuZ21zZFwiOlwiXFx1MjIyMVwiLFxuICBcImFuZ21zZGFhXCI6XCJcXHUyOUE4XCIsXG4gIFwiYW5nbXNkYWJcIjpcIlxcdTI5QTlcIixcbiAgXCJhbmdtc2RhY1wiOlwiXFx1MjlBQVwiLFxuICBcImFuZ21zZGFkXCI6XCJcXHUyOUFCXCIsXG4gIFwiYW5nbXNkYWVcIjpcIlxcdTI5QUNcIixcbiAgXCJhbmdtc2RhZlwiOlwiXFx1MjlBRFwiLFxuICBcImFuZ21zZGFnXCI6XCJcXHUyOUFFXCIsXG4gIFwiYW5nbXNkYWhcIjpcIlxcdTI5QUZcIixcbiAgXCJhbmdydFwiOlwiXFx1MjIxRlwiLFxuICBcImFuZ3J0dmJcIjpcIlxcdTIyQkVcIixcbiAgXCJhbmdydHZiZFwiOlwiXFx1Mjk5RFwiLFxuICBcImFuZ3NwaFwiOlwiXFx1MjIyMlwiLFxuICBcImFuZ3N0XCI6XCJcXHUwMEM1XCIsXG4gIFwiYW5nemFyclwiOlwiXFx1MjM3Q1wiLFxuICBcIkFvZ29uXCI6XCJcXHUwMTA0XCIsXG4gIFwiYW9nb25cIjpcIlxcdTAxMDVcIixcbiAgXCJBb3BmXCI6XCJcXHVEODM1XFx1REQzOFwiLFxuICBcImFvcGZcIjpcIlxcdUQ4MzVcXHVERDUyXCIsXG4gIFwiYXBcIjpcIlxcdTIyNDhcIixcbiAgXCJhcGFjaXJcIjpcIlxcdTJBNkZcIixcbiAgXCJhcEVcIjpcIlxcdTJBNzBcIixcbiAgXCJhcGVcIjpcIlxcdTIyNEFcIixcbiAgXCJhcGlkXCI6XCJcXHUyMjRCXCIsXG4gIFwiYXBvc1wiOlwiXFx1MDAyN1wiLFxuICBcIkFwcGx5RnVuY3Rpb25cIjpcIlxcdTIwNjFcIixcbiAgXCJhcHByb3hcIjpcIlxcdTIyNDhcIixcbiAgXCJhcHByb3hlcVwiOlwiXFx1MjI0QVwiLFxuICBcIkFyaW5nXCI6XCJcXHUwMEM1XCIsXG4gIFwiYXJpbmdcIjpcIlxcdTAwRTVcIixcbiAgXCJBc2NyXCI6XCJcXHVEODM1XFx1REM5Q1wiLFxuICBcImFzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I2XCIsXG4gIFwiQXNzaWduXCI6XCJcXHUyMjU0XCIsXG4gIFwiYXN0XCI6XCJcXHUwMDJBXCIsXG4gIFwiYXN5bXBcIjpcIlxcdTIyNDhcIixcbiAgXCJhc3ltcGVxXCI6XCJcXHUyMjREXCIsXG4gIFwiQXRpbGRlXCI6XCJcXHUwMEMzXCIsXG4gIFwiYXRpbGRlXCI6XCJcXHUwMEUzXCIsXG4gIFwiQXVtbFwiOlwiXFx1MDBDNFwiLFxuICBcImF1bWxcIjpcIlxcdTAwRTRcIixcbiAgXCJhd2NvbmludFwiOlwiXFx1MjIzM1wiLFxuICBcImF3aW50XCI6XCJcXHUyQTExXCIsXG4gIFwiYmFja2NvbmdcIjpcIlxcdTIyNENcIixcbiAgXCJiYWNrZXBzaWxvblwiOlwiXFx1MDNGNlwiLFxuICBcImJhY2twcmltZVwiOlwiXFx1MjAzNVwiLFxuICBcImJhY2tzaW1cIjpcIlxcdTIyM0RcIixcbiAgXCJiYWNrc2ltZXFcIjpcIlxcdTIyQ0RcIixcbiAgXCJCYWNrc2xhc2hcIjpcIlxcdTIyMTZcIixcbiAgXCJCYXJ2XCI6XCJcXHUyQUU3XCIsXG4gIFwiYmFydmVlXCI6XCJcXHUyMkJEXCIsXG4gIFwiQmFyd2VkXCI6XCJcXHUyMzA2XCIsXG4gIFwiYmFyd2VkXCI6XCJcXHUyMzA1XCIsXG4gIFwiYmFyd2VkZ2VcIjpcIlxcdTIzMDVcIixcbiAgXCJiYnJrXCI6XCJcXHUyM0I1XCIsXG4gIFwiYmJya3RicmtcIjpcIlxcdTIzQjZcIixcbiAgXCJiY29uZ1wiOlwiXFx1MjI0Q1wiLFxuICBcIkJjeVwiOlwiXFx1MDQxMVwiLFxuICBcImJjeVwiOlwiXFx1MDQzMVwiLFxuICBcImJkcXVvXCI6XCJcXHUyMDFFXCIsXG4gIFwiYmVjYXVzXCI6XCJcXHUyMjM1XCIsXG4gIFwiQmVjYXVzZVwiOlwiXFx1MjIzNVwiLFxuICBcImJlY2F1c2VcIjpcIlxcdTIyMzVcIixcbiAgXCJiZW1wdHl2XCI6XCJcXHUyOUIwXCIsXG4gIFwiYmVwc2lcIjpcIlxcdTAzRjZcIixcbiAgXCJiZXJub3VcIjpcIlxcdTIxMkNcIixcbiAgXCJCZXJub3VsbGlzXCI6XCJcXHUyMTJDXCIsXG4gIFwiQmV0YVwiOlwiXFx1MDM5MlwiLFxuICBcImJldGFcIjpcIlxcdTAzQjJcIixcbiAgXCJiZXRoXCI6XCJcXHUyMTM2XCIsXG4gIFwiYmV0d2VlblwiOlwiXFx1MjI2Q1wiLFxuICBcIkJmclwiOlwiXFx1RDgzNVxcdUREMDVcIixcbiAgXCJiZnJcIjpcIlxcdUQ4MzVcXHVERDFGXCIsXG4gIFwiYmlnY2FwXCI6XCJcXHUyMkMyXCIsXG4gIFwiYmlnY2lyY1wiOlwiXFx1MjVFRlwiLFxuICBcImJpZ2N1cFwiOlwiXFx1MjJDM1wiLFxuICBcImJpZ29kb3RcIjpcIlxcdTJBMDBcIixcbiAgXCJiaWdvcGx1c1wiOlwiXFx1MkEwMVwiLFxuICBcImJpZ290aW1lc1wiOlwiXFx1MkEwMlwiLFxuICBcImJpZ3NxY3VwXCI6XCJcXHUyQTA2XCIsXG4gIFwiYmlnc3RhclwiOlwiXFx1MjYwNVwiLFxuICBcImJpZ3RyaWFuZ2xlZG93blwiOlwiXFx1MjVCRFwiLFxuICBcImJpZ3RyaWFuZ2xldXBcIjpcIlxcdTI1QjNcIixcbiAgXCJiaWd1cGx1c1wiOlwiXFx1MkEwNFwiLFxuICBcImJpZ3ZlZVwiOlwiXFx1MjJDMVwiLFxuICBcImJpZ3dlZGdlXCI6XCJcXHUyMkMwXCIsXG4gIFwiYmthcm93XCI6XCJcXHUyOTBEXCIsXG4gIFwiYmxhY2tsb3plbmdlXCI6XCJcXHUyOUVCXCIsXG4gIFwiYmxhY2tzcXVhcmVcIjpcIlxcdTI1QUFcIixcbiAgXCJibGFja3RyaWFuZ2xlXCI6XCJcXHUyNUI0XCIsXG4gIFwiYmxhY2t0cmlhbmdsZWRvd25cIjpcIlxcdTI1QkVcIixcbiAgXCJibGFja3RyaWFuZ2xlbGVmdFwiOlwiXFx1MjVDMlwiLFxuICBcImJsYWNrdHJpYW5nbGVyaWdodFwiOlwiXFx1MjVCOFwiLFxuICBcImJsYW5rXCI6XCJcXHUyNDIzXCIsXG4gIFwiYmxrMTJcIjpcIlxcdTI1OTJcIixcbiAgXCJibGsxNFwiOlwiXFx1MjU5MVwiLFxuICBcImJsazM0XCI6XCJcXHUyNTkzXCIsXG4gIFwiYmxvY2tcIjpcIlxcdTI1ODhcIixcbiAgXCJibmVcIjpcIlxcdTAwM0RcXHUyMEU1XCIsXG4gIFwiYm5lcXVpdlwiOlwiXFx1MjI2MVxcdTIwRTVcIixcbiAgXCJiTm90XCI6XCJcXHUyQUVEXCIsXG4gIFwiYm5vdFwiOlwiXFx1MjMxMFwiLFxuICBcIkJvcGZcIjpcIlxcdUQ4MzVcXHVERDM5XCIsXG4gIFwiYm9wZlwiOlwiXFx1RDgzNVxcdURENTNcIixcbiAgXCJib3RcIjpcIlxcdTIyQTVcIixcbiAgXCJib3R0b21cIjpcIlxcdTIyQTVcIixcbiAgXCJib3d0aWVcIjpcIlxcdTIyQzhcIixcbiAgXCJib3hib3hcIjpcIlxcdTI5QzlcIixcbiAgXCJib3hETFwiOlwiXFx1MjU1N1wiLFxuICBcImJveERsXCI6XCJcXHUyNTU2XCIsXG4gIFwiYm94ZExcIjpcIlxcdTI1NTVcIixcbiAgXCJib3hkbFwiOlwiXFx1MjUxMFwiLFxuICBcImJveERSXCI6XCJcXHUyNTU0XCIsXG4gIFwiYm94RHJcIjpcIlxcdTI1NTNcIixcbiAgXCJib3hkUlwiOlwiXFx1MjU1MlwiLFxuICBcImJveGRyXCI6XCJcXHUyNTBDXCIsXG4gIFwiYm94SFwiOlwiXFx1MjU1MFwiLFxuICBcImJveGhcIjpcIlxcdTI1MDBcIixcbiAgXCJib3hIRFwiOlwiXFx1MjU2NlwiLFxuICBcImJveEhkXCI6XCJcXHUyNTY0XCIsXG4gIFwiYm94aERcIjpcIlxcdTI1NjVcIixcbiAgXCJib3hoZFwiOlwiXFx1MjUyQ1wiLFxuICBcImJveEhVXCI6XCJcXHUyNTY5XCIsXG4gIFwiYm94SHVcIjpcIlxcdTI1NjdcIixcbiAgXCJib3hoVVwiOlwiXFx1MjU2OFwiLFxuICBcImJveGh1XCI6XCJcXHUyNTM0XCIsXG4gIFwiYm94bWludXNcIjpcIlxcdTIyOUZcIixcbiAgXCJib3hwbHVzXCI6XCJcXHUyMjlFXCIsXG4gIFwiYm94dGltZXNcIjpcIlxcdTIyQTBcIixcbiAgXCJib3hVTFwiOlwiXFx1MjU1RFwiLFxuICBcImJveFVsXCI6XCJcXHUyNTVDXCIsXG4gIFwiYm94dUxcIjpcIlxcdTI1NUJcIixcbiAgXCJib3h1bFwiOlwiXFx1MjUxOFwiLFxuICBcImJveFVSXCI6XCJcXHUyNTVBXCIsXG4gIFwiYm94VXJcIjpcIlxcdTI1NTlcIixcbiAgXCJib3h1UlwiOlwiXFx1MjU1OFwiLFxuICBcImJveHVyXCI6XCJcXHUyNTE0XCIsXG4gIFwiYm94VlwiOlwiXFx1MjU1MVwiLFxuICBcImJveHZcIjpcIlxcdTI1MDJcIixcbiAgXCJib3hWSFwiOlwiXFx1MjU2Q1wiLFxuICBcImJveFZoXCI6XCJcXHUyNTZCXCIsXG4gIFwiYm94dkhcIjpcIlxcdTI1NkFcIixcbiAgXCJib3h2aFwiOlwiXFx1MjUzQ1wiLFxuICBcImJveFZMXCI6XCJcXHUyNTYzXCIsXG4gIFwiYm94VmxcIjpcIlxcdTI1NjJcIixcbiAgXCJib3h2TFwiOlwiXFx1MjU2MVwiLFxuICBcImJveHZsXCI6XCJcXHUyNTI0XCIsXG4gIFwiYm94VlJcIjpcIlxcdTI1NjBcIixcbiAgXCJib3hWclwiOlwiXFx1MjU1RlwiLFxuICBcImJveHZSXCI6XCJcXHUyNTVFXCIsXG4gIFwiYm94dnJcIjpcIlxcdTI1MUNcIixcbiAgXCJicHJpbWVcIjpcIlxcdTIwMzVcIixcbiAgXCJCcmV2ZVwiOlwiXFx1MDJEOFwiLFxuICBcImJyZXZlXCI6XCJcXHUwMkQ4XCIsXG4gIFwiYnJ2YmFyXCI6XCJcXHUwMEE2XCIsXG4gIFwiQnNjclwiOlwiXFx1MjEyQ1wiLFxuICBcImJzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I3XCIsXG4gIFwiYnNlbWlcIjpcIlxcdTIwNEZcIixcbiAgXCJic2ltXCI6XCJcXHUyMjNEXCIsXG4gIFwiYnNpbWVcIjpcIlxcdTIyQ0RcIixcbiAgXCJic29sXCI6XCJcXHUwMDVDXCIsXG4gIFwiYnNvbGJcIjpcIlxcdTI5QzVcIixcbiAgXCJic29saHN1YlwiOlwiXFx1MjdDOFwiLFxuICBcImJ1bGxcIjpcIlxcdTIwMjJcIixcbiAgXCJidWxsZXRcIjpcIlxcdTIwMjJcIixcbiAgXCJidW1wXCI6XCJcXHUyMjRFXCIsXG4gIFwiYnVtcEVcIjpcIlxcdTJBQUVcIixcbiAgXCJidW1wZVwiOlwiXFx1MjI0RlwiLFxuICBcIkJ1bXBlcVwiOlwiXFx1MjI0RVwiLFxuICBcImJ1bXBlcVwiOlwiXFx1MjI0RlwiLFxuICBcIkNhY3V0ZVwiOlwiXFx1MDEwNlwiLFxuICBcImNhY3V0ZVwiOlwiXFx1MDEwN1wiLFxuICBcIkNhcFwiOlwiXFx1MjJEMlwiLFxuICBcImNhcFwiOlwiXFx1MjIyOVwiLFxuICBcImNhcGFuZFwiOlwiXFx1MkE0NFwiLFxuICBcImNhcGJyY3VwXCI6XCJcXHUyQTQ5XCIsXG4gIFwiY2FwY2FwXCI6XCJcXHUyQTRCXCIsXG4gIFwiY2FwY3VwXCI6XCJcXHUyQTQ3XCIsXG4gIFwiY2FwZG90XCI6XCJcXHUyQTQwXCIsXG4gIFwiQ2FwaXRhbERpZmZlcmVudGlhbERcIjpcIlxcdTIxNDVcIixcbiAgXCJjYXBzXCI6XCJcXHUyMjI5XFx1RkUwMFwiLFxuICBcImNhcmV0XCI6XCJcXHUyMDQxXCIsXG4gIFwiY2Fyb25cIjpcIlxcdTAyQzdcIixcbiAgXCJDYXlsZXlzXCI6XCJcXHUyMTJEXCIsXG4gIFwiY2NhcHNcIjpcIlxcdTJBNERcIixcbiAgXCJDY2Fyb25cIjpcIlxcdTAxMENcIixcbiAgXCJjY2Fyb25cIjpcIlxcdTAxMERcIixcbiAgXCJDY2VkaWxcIjpcIlxcdTAwQzdcIixcbiAgXCJjY2VkaWxcIjpcIlxcdTAwRTdcIixcbiAgXCJDY2lyY1wiOlwiXFx1MDEwOFwiLFxuICBcImNjaXJjXCI6XCJcXHUwMTA5XCIsXG4gIFwiQ2NvbmludFwiOlwiXFx1MjIzMFwiLFxuICBcImNjdXBzXCI6XCJcXHUyQTRDXCIsXG4gIFwiY2N1cHNzbVwiOlwiXFx1MkE1MFwiLFxuICBcIkNkb3RcIjpcIlxcdTAxMEFcIixcbiAgXCJjZG90XCI6XCJcXHUwMTBCXCIsXG4gIFwiY2VkaWxcIjpcIlxcdTAwQjhcIixcbiAgXCJDZWRpbGxhXCI6XCJcXHUwMEI4XCIsXG4gIFwiY2VtcHR5dlwiOlwiXFx1MjlCMlwiLFxuICBcImNlbnRcIjpcIlxcdTAwQTJcIixcbiAgXCJDZW50ZXJEb3RcIjpcIlxcdTAwQjdcIixcbiAgXCJjZW50ZXJkb3RcIjpcIlxcdTAwQjdcIixcbiAgXCJDZnJcIjpcIlxcdTIxMkRcIixcbiAgXCJjZnJcIjpcIlxcdUQ4MzVcXHVERDIwXCIsXG4gIFwiQ0hjeVwiOlwiXFx1MDQyN1wiLFxuICBcImNoY3lcIjpcIlxcdTA0NDdcIixcbiAgXCJjaGVja1wiOlwiXFx1MjcxM1wiLFxuICBcImNoZWNrbWFya1wiOlwiXFx1MjcxM1wiLFxuICBcIkNoaVwiOlwiXFx1MDNBN1wiLFxuICBcImNoaVwiOlwiXFx1MDNDN1wiLFxuICBcImNpclwiOlwiXFx1MjVDQlwiLFxuICBcImNpcmNcIjpcIlxcdTAyQzZcIixcbiAgXCJjaXJjZXFcIjpcIlxcdTIyNTdcIixcbiAgXCJjaXJjbGVhcnJvd2xlZnRcIjpcIlxcdTIxQkFcIixcbiAgXCJjaXJjbGVhcnJvd3JpZ2h0XCI6XCJcXHUyMUJCXCIsXG4gIFwiY2lyY2xlZGFzdFwiOlwiXFx1MjI5QlwiLFxuICBcImNpcmNsZWRjaXJjXCI6XCJcXHUyMjlBXCIsXG4gIFwiY2lyY2xlZGRhc2hcIjpcIlxcdTIyOURcIixcbiAgXCJDaXJjbGVEb3RcIjpcIlxcdTIyOTlcIixcbiAgXCJjaXJjbGVkUlwiOlwiXFx1MDBBRVwiLFxuICBcImNpcmNsZWRTXCI6XCJcXHUyNEM4XCIsXG4gIFwiQ2lyY2xlTWludXNcIjpcIlxcdTIyOTZcIixcbiAgXCJDaXJjbGVQbHVzXCI6XCJcXHUyMjk1XCIsXG4gIFwiQ2lyY2xlVGltZXNcIjpcIlxcdTIyOTdcIixcbiAgXCJjaXJFXCI6XCJcXHUyOUMzXCIsXG4gIFwiY2lyZVwiOlwiXFx1MjI1N1wiLFxuICBcImNpcmZuaW50XCI6XCJcXHUyQTEwXCIsXG4gIFwiY2lybWlkXCI6XCJcXHUyQUVGXCIsXG4gIFwiY2lyc2NpclwiOlwiXFx1MjlDMlwiLFxuICBcIkNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIzMlwiLFxuICBcIkNsb3NlQ3VybHlEb3VibGVRdW90ZVwiOlwiXFx1MjAxRFwiLFxuICBcIkNsb3NlQ3VybHlRdW90ZVwiOlwiXFx1MjAxOVwiLFxuICBcImNsdWJzXCI6XCJcXHUyNjYzXCIsXG4gIFwiY2x1YnN1aXRcIjpcIlxcdTI2NjNcIixcbiAgXCJDb2xvblwiOlwiXFx1MjIzN1wiLFxuICBcImNvbG9uXCI6XCJcXHUwMDNBXCIsXG4gIFwiQ29sb25lXCI6XCJcXHUyQTc0XCIsXG4gIFwiY29sb25lXCI6XCJcXHUyMjU0XCIsXG4gIFwiY29sb25lcVwiOlwiXFx1MjI1NFwiLFxuICBcImNvbW1hXCI6XCJcXHUwMDJDXCIsXG4gIFwiY29tbWF0XCI6XCJcXHUwMDQwXCIsXG4gIFwiY29tcFwiOlwiXFx1MjIwMVwiLFxuICBcImNvbXBmblwiOlwiXFx1MjIxOFwiLFxuICBcImNvbXBsZW1lbnRcIjpcIlxcdTIyMDFcIixcbiAgXCJjb21wbGV4ZXNcIjpcIlxcdTIxMDJcIixcbiAgXCJjb25nXCI6XCJcXHUyMjQ1XCIsXG4gIFwiY29uZ2RvdFwiOlwiXFx1MkE2RFwiLFxuICBcIkNvbmdydWVudFwiOlwiXFx1MjI2MVwiLFxuICBcIkNvbmludFwiOlwiXFx1MjIyRlwiLFxuICBcImNvbmludFwiOlwiXFx1MjIyRVwiLFxuICBcIkNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIyRVwiLFxuICBcIkNvcGZcIjpcIlxcdTIxMDJcIixcbiAgXCJjb3BmXCI6XCJcXHVEODM1XFx1REQ1NFwiLFxuICBcImNvcHJvZFwiOlwiXFx1MjIxMFwiLFxuICBcIkNvcHJvZHVjdFwiOlwiXFx1MjIxMFwiLFxuICBcIkNPUFlcIjpcIlxcdTAwQTlcIixcbiAgXCJjb3B5XCI6XCJcXHUwMEE5XCIsXG4gIFwiY29weXNyXCI6XCJcXHUyMTE3XCIsXG4gIFwiQ291bnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIzM1wiLFxuICBcImNyYXJyXCI6XCJcXHUyMUI1XCIsXG4gIFwiQ3Jvc3NcIjpcIlxcdTJBMkZcIixcbiAgXCJjcm9zc1wiOlwiXFx1MjcxN1wiLFxuICBcIkNzY3JcIjpcIlxcdUQ4MzVcXHVEQzlFXCIsXG4gIFwiY3NjclwiOlwiXFx1RDgzNVxcdURDQjhcIixcbiAgXCJjc3ViXCI6XCJcXHUyQUNGXCIsXG4gIFwiY3N1YmVcIjpcIlxcdTJBRDFcIixcbiAgXCJjc3VwXCI6XCJcXHUyQUQwXCIsXG4gIFwiY3N1cGVcIjpcIlxcdTJBRDJcIixcbiAgXCJjdGRvdFwiOlwiXFx1MjJFRlwiLFxuICBcImN1ZGFycmxcIjpcIlxcdTI5MzhcIixcbiAgXCJjdWRhcnJyXCI6XCJcXHUyOTM1XCIsXG4gIFwiY3VlcHJcIjpcIlxcdTIyREVcIixcbiAgXCJjdWVzY1wiOlwiXFx1MjJERlwiLFxuICBcImN1bGFyclwiOlwiXFx1MjFCNlwiLFxuICBcImN1bGFycnBcIjpcIlxcdTI5M0RcIixcbiAgXCJDdXBcIjpcIlxcdTIyRDNcIixcbiAgXCJjdXBcIjpcIlxcdTIyMkFcIixcbiAgXCJjdXBicmNhcFwiOlwiXFx1MkE0OFwiLFxuICBcIkN1cENhcFwiOlwiXFx1MjI0RFwiLFxuICBcImN1cGNhcFwiOlwiXFx1MkE0NlwiLFxuICBcImN1cGN1cFwiOlwiXFx1MkE0QVwiLFxuICBcImN1cGRvdFwiOlwiXFx1MjI4RFwiLFxuICBcImN1cG9yXCI6XCJcXHUyQTQ1XCIsXG4gIFwiY3Vwc1wiOlwiXFx1MjIyQVxcdUZFMDBcIixcbiAgXCJjdXJhcnJcIjpcIlxcdTIxQjdcIixcbiAgXCJjdXJhcnJtXCI6XCJcXHUyOTNDXCIsXG4gIFwiY3VybHllcXByZWNcIjpcIlxcdTIyREVcIixcbiAgXCJjdXJseWVxc3VjY1wiOlwiXFx1MjJERlwiLFxuICBcImN1cmx5dmVlXCI6XCJcXHUyMkNFXCIsXG4gIFwiY3VybHl3ZWRnZVwiOlwiXFx1MjJDRlwiLFxuICBcImN1cnJlblwiOlwiXFx1MDBBNFwiLFxuICBcImN1cnZlYXJyb3dsZWZ0XCI6XCJcXHUyMUI2XCIsXG4gIFwiY3VydmVhcnJvd3JpZ2h0XCI6XCJcXHUyMUI3XCIsXG4gIFwiY3V2ZWVcIjpcIlxcdTIyQ0VcIixcbiAgXCJjdXdlZFwiOlwiXFx1MjJDRlwiLFxuICBcImN3Y29uaW50XCI6XCJcXHUyMjMyXCIsXG4gIFwiY3dpbnRcIjpcIlxcdTIyMzFcIixcbiAgXCJjeWxjdHlcIjpcIlxcdTIzMkRcIixcbiAgXCJEYWdnZXJcIjpcIlxcdTIwMjFcIixcbiAgXCJkYWdnZXJcIjpcIlxcdTIwMjBcIixcbiAgXCJkYWxldGhcIjpcIlxcdTIxMzhcIixcbiAgXCJEYXJyXCI6XCJcXHUyMUExXCIsXG4gIFwiZEFyclwiOlwiXFx1MjFEM1wiLFxuICBcImRhcnJcIjpcIlxcdTIxOTNcIixcbiAgXCJkYXNoXCI6XCJcXHUyMDEwXCIsXG4gIFwiRGFzaHZcIjpcIlxcdTJBRTRcIixcbiAgXCJkYXNodlwiOlwiXFx1MjJBM1wiLFxuICBcImRia2Fyb3dcIjpcIlxcdTI5MEZcIixcbiAgXCJkYmxhY1wiOlwiXFx1MDJERFwiLFxuICBcIkRjYXJvblwiOlwiXFx1MDEwRVwiLFxuICBcImRjYXJvblwiOlwiXFx1MDEwRlwiLFxuICBcIkRjeVwiOlwiXFx1MDQxNFwiLFxuICBcImRjeVwiOlwiXFx1MDQzNFwiLFxuICBcIkREXCI6XCJcXHUyMTQ1XCIsXG4gIFwiZGRcIjpcIlxcdTIxNDZcIixcbiAgXCJkZGFnZ2VyXCI6XCJcXHUyMDIxXCIsXG4gIFwiZGRhcnJcIjpcIlxcdTIxQ0FcIixcbiAgXCJERG90cmFoZFwiOlwiXFx1MjkxMVwiLFxuICBcImRkb3RzZXFcIjpcIlxcdTJBNzdcIixcbiAgXCJkZWdcIjpcIlxcdTAwQjBcIixcbiAgXCJEZWxcIjpcIlxcdTIyMDdcIixcbiAgXCJEZWx0YVwiOlwiXFx1MDM5NFwiLFxuICBcImRlbHRhXCI6XCJcXHUwM0I0XCIsXG4gIFwiZGVtcHR5dlwiOlwiXFx1MjlCMVwiLFxuICBcImRmaXNodFwiOlwiXFx1Mjk3RlwiLFxuICBcIkRmclwiOlwiXFx1RDgzNVxcdUREMDdcIixcbiAgXCJkZnJcIjpcIlxcdUQ4MzVcXHVERDIxXCIsXG4gIFwiZEhhclwiOlwiXFx1Mjk2NVwiLFxuICBcImRoYXJsXCI6XCJcXHUyMUMzXCIsXG4gIFwiZGhhcnJcIjpcIlxcdTIxQzJcIixcbiAgXCJEaWFjcml0aWNhbEFjdXRlXCI6XCJcXHUwMEI0XCIsXG4gIFwiRGlhY3JpdGljYWxEb3RcIjpcIlxcdTAyRDlcIixcbiAgXCJEaWFjcml0aWNhbERvdWJsZUFjdXRlXCI6XCJcXHUwMkREXCIsXG4gIFwiRGlhY3JpdGljYWxHcmF2ZVwiOlwiXFx1MDA2MFwiLFxuICBcIkRpYWNyaXRpY2FsVGlsZGVcIjpcIlxcdTAyRENcIixcbiAgXCJkaWFtXCI6XCJcXHUyMkM0XCIsXG4gIFwiRGlhbW9uZFwiOlwiXFx1MjJDNFwiLFxuICBcImRpYW1vbmRcIjpcIlxcdTIyQzRcIixcbiAgXCJkaWFtb25kc3VpdFwiOlwiXFx1MjY2NlwiLFxuICBcImRpYW1zXCI6XCJcXHUyNjY2XCIsXG4gIFwiZGllXCI6XCJcXHUwMEE4XCIsXG4gIFwiRGlmZmVyZW50aWFsRFwiOlwiXFx1MjE0NlwiLFxuICBcImRpZ2FtbWFcIjpcIlxcdTAzRERcIixcbiAgXCJkaXNpblwiOlwiXFx1MjJGMlwiLFxuICBcImRpdlwiOlwiXFx1MDBGN1wiLFxuICBcImRpdmlkZVwiOlwiXFx1MDBGN1wiLFxuICBcImRpdmlkZW9udGltZXNcIjpcIlxcdTIyQzdcIixcbiAgXCJkaXZvbnhcIjpcIlxcdTIyQzdcIixcbiAgXCJESmN5XCI6XCJcXHUwNDAyXCIsXG4gIFwiZGpjeVwiOlwiXFx1MDQ1MlwiLFxuICBcImRsY29yblwiOlwiXFx1MjMxRVwiLFxuICBcImRsY3JvcFwiOlwiXFx1MjMwRFwiLFxuICBcImRvbGxhclwiOlwiXFx1MDAyNFwiLFxuICBcIkRvcGZcIjpcIlxcdUQ4MzVcXHVERDNCXCIsXG4gIFwiZG9wZlwiOlwiXFx1RDgzNVxcdURENTVcIixcbiAgXCJEb3RcIjpcIlxcdTAwQThcIixcbiAgXCJkb3RcIjpcIlxcdTAyRDlcIixcbiAgXCJEb3REb3RcIjpcIlxcdTIwRENcIixcbiAgXCJkb3RlcVwiOlwiXFx1MjI1MFwiLFxuICBcImRvdGVxZG90XCI6XCJcXHUyMjUxXCIsXG4gIFwiRG90RXF1YWxcIjpcIlxcdTIyNTBcIixcbiAgXCJkb3RtaW51c1wiOlwiXFx1MjIzOFwiLFxuICBcImRvdHBsdXNcIjpcIlxcdTIyMTRcIixcbiAgXCJkb3RzcXVhcmVcIjpcIlxcdTIyQTFcIixcbiAgXCJkb3VibGViYXJ3ZWRnZVwiOlwiXFx1MjMwNlwiLFxuICBcIkRvdWJsZUNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIyRlwiLFxuICBcIkRvdWJsZURvdFwiOlwiXFx1MDBBOFwiLFxuICBcIkRvdWJsZURvd25BcnJvd1wiOlwiXFx1MjFEM1wiLFxuICBcIkRvdWJsZUxlZnRBcnJvd1wiOlwiXFx1MjFEMFwiLFxuICBcIkRvdWJsZUxlZnRSaWdodEFycm93XCI6XCJcXHUyMUQ0XCIsXG4gIFwiRG91YmxlTGVmdFRlZVwiOlwiXFx1MkFFNFwiLFxuICBcIkRvdWJsZUxvbmdMZWZ0QXJyb3dcIjpcIlxcdTI3RjhcIixcbiAgXCJEb3VibGVMb25nTGVmdFJpZ2h0QXJyb3dcIjpcIlxcdTI3RkFcIixcbiAgXCJEb3VibGVMb25nUmlnaHRBcnJvd1wiOlwiXFx1MjdGOVwiLFxuICBcIkRvdWJsZVJpZ2h0QXJyb3dcIjpcIlxcdTIxRDJcIixcbiAgXCJEb3VibGVSaWdodFRlZVwiOlwiXFx1MjJBOFwiLFxuICBcIkRvdWJsZVVwQXJyb3dcIjpcIlxcdTIxRDFcIixcbiAgXCJEb3VibGVVcERvd25BcnJvd1wiOlwiXFx1MjFENVwiLFxuICBcIkRvdWJsZVZlcnRpY2FsQmFyXCI6XCJcXHUyMjI1XCIsXG4gIFwiRG93bkFycm93XCI6XCJcXHUyMTkzXCIsXG4gIFwiRG93bmFycm93XCI6XCJcXHUyMUQzXCIsXG4gIFwiZG93bmFycm93XCI6XCJcXHUyMTkzXCIsXG4gIFwiRG93bkFycm93QmFyXCI6XCJcXHUyOTEzXCIsXG4gIFwiRG93bkFycm93VXBBcnJvd1wiOlwiXFx1MjFGNVwiLFxuICBcIkRvd25CcmV2ZVwiOlwiXFx1MDMxMVwiLFxuICBcImRvd25kb3duYXJyb3dzXCI6XCJcXHUyMUNBXCIsXG4gIFwiZG93bmhhcnBvb25sZWZ0XCI6XCJcXHUyMUMzXCIsXG4gIFwiZG93bmhhcnBvb25yaWdodFwiOlwiXFx1MjFDMlwiLFxuICBcIkRvd25MZWZ0UmlnaHRWZWN0b3JcIjpcIlxcdTI5NTBcIixcbiAgXCJEb3duTGVmdFRlZVZlY3RvclwiOlwiXFx1Mjk1RVwiLFxuICBcIkRvd25MZWZ0VmVjdG9yXCI6XCJcXHUyMUJEXCIsXG4gIFwiRG93bkxlZnRWZWN0b3JCYXJcIjpcIlxcdTI5NTZcIixcbiAgXCJEb3duUmlnaHRUZWVWZWN0b3JcIjpcIlxcdTI5NUZcIixcbiAgXCJEb3duUmlnaHRWZWN0b3JcIjpcIlxcdTIxQzFcIixcbiAgXCJEb3duUmlnaHRWZWN0b3JCYXJcIjpcIlxcdTI5NTdcIixcbiAgXCJEb3duVGVlXCI6XCJcXHUyMkE0XCIsXG4gIFwiRG93blRlZUFycm93XCI6XCJcXHUyMUE3XCIsXG4gIFwiZHJia2Fyb3dcIjpcIlxcdTI5MTBcIixcbiAgXCJkcmNvcm5cIjpcIlxcdTIzMUZcIixcbiAgXCJkcmNyb3BcIjpcIlxcdTIzMENcIixcbiAgXCJEc2NyXCI6XCJcXHVEODM1XFx1REM5RlwiLFxuICBcImRzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I5XCIsXG4gIFwiRFNjeVwiOlwiXFx1MDQwNVwiLFxuICBcImRzY3lcIjpcIlxcdTA0NTVcIixcbiAgXCJkc29sXCI6XCJcXHUyOUY2XCIsXG4gIFwiRHN0cm9rXCI6XCJcXHUwMTEwXCIsXG4gIFwiZHN0cm9rXCI6XCJcXHUwMTExXCIsXG4gIFwiZHRkb3RcIjpcIlxcdTIyRjFcIixcbiAgXCJkdHJpXCI6XCJcXHUyNUJGXCIsXG4gIFwiZHRyaWZcIjpcIlxcdTI1QkVcIixcbiAgXCJkdWFyclwiOlwiXFx1MjFGNVwiLFxuICBcImR1aGFyXCI6XCJcXHUyOTZGXCIsXG4gIFwiZHdhbmdsZVwiOlwiXFx1MjlBNlwiLFxuICBcIkRaY3lcIjpcIlxcdTA0MEZcIixcbiAgXCJkemN5XCI6XCJcXHUwNDVGXCIsXG4gIFwiZHppZ3JhcnJcIjpcIlxcdTI3RkZcIixcbiAgXCJFYWN1dGVcIjpcIlxcdTAwQzlcIixcbiAgXCJlYWN1dGVcIjpcIlxcdTAwRTlcIixcbiAgXCJlYXN0ZXJcIjpcIlxcdTJBNkVcIixcbiAgXCJFY2Fyb25cIjpcIlxcdTAxMUFcIixcbiAgXCJlY2Fyb25cIjpcIlxcdTAxMUJcIixcbiAgXCJlY2lyXCI6XCJcXHUyMjU2XCIsXG4gIFwiRWNpcmNcIjpcIlxcdTAwQ0FcIixcbiAgXCJlY2lyY1wiOlwiXFx1MDBFQVwiLFxuICBcImVjb2xvblwiOlwiXFx1MjI1NVwiLFxuICBcIkVjeVwiOlwiXFx1MDQyRFwiLFxuICBcImVjeVwiOlwiXFx1MDQ0RFwiLFxuICBcImVERG90XCI6XCJcXHUyQTc3XCIsXG4gIFwiRWRvdFwiOlwiXFx1MDExNlwiLFxuICBcImVEb3RcIjpcIlxcdTIyNTFcIixcbiAgXCJlZG90XCI6XCJcXHUwMTE3XCIsXG4gIFwiZWVcIjpcIlxcdTIxNDdcIixcbiAgXCJlZkRvdFwiOlwiXFx1MjI1MlwiLFxuICBcIkVmclwiOlwiXFx1RDgzNVxcdUREMDhcIixcbiAgXCJlZnJcIjpcIlxcdUQ4MzVcXHVERDIyXCIsXG4gIFwiZWdcIjpcIlxcdTJBOUFcIixcbiAgXCJFZ3JhdmVcIjpcIlxcdTAwQzhcIixcbiAgXCJlZ3JhdmVcIjpcIlxcdTAwRThcIixcbiAgXCJlZ3NcIjpcIlxcdTJBOTZcIixcbiAgXCJlZ3Nkb3RcIjpcIlxcdTJBOThcIixcbiAgXCJlbFwiOlwiXFx1MkE5OVwiLFxuICBcIkVsZW1lbnRcIjpcIlxcdTIyMDhcIixcbiAgXCJlbGludGVyc1wiOlwiXFx1MjNFN1wiLFxuICBcImVsbFwiOlwiXFx1MjExM1wiLFxuICBcImVsc1wiOlwiXFx1MkE5NVwiLFxuICBcImVsc2RvdFwiOlwiXFx1MkE5N1wiLFxuICBcIkVtYWNyXCI6XCJcXHUwMTEyXCIsXG4gIFwiZW1hY3JcIjpcIlxcdTAxMTNcIixcbiAgXCJlbXB0eVwiOlwiXFx1MjIwNVwiLFxuICBcImVtcHR5c2V0XCI6XCJcXHUyMjA1XCIsXG4gIFwiRW1wdHlTbWFsbFNxdWFyZVwiOlwiXFx1MjVGQlwiLFxuICBcImVtcHR5dlwiOlwiXFx1MjIwNVwiLFxuICBcIkVtcHR5VmVyeVNtYWxsU3F1YXJlXCI6XCJcXHUyNUFCXCIsXG4gIFwiZW1zcFwiOlwiXFx1MjAwM1wiLFxuICBcImVtc3AxM1wiOlwiXFx1MjAwNFwiLFxuICBcImVtc3AxNFwiOlwiXFx1MjAwNVwiLFxuICBcIkVOR1wiOlwiXFx1MDE0QVwiLFxuICBcImVuZ1wiOlwiXFx1MDE0QlwiLFxuICBcImVuc3BcIjpcIlxcdTIwMDJcIixcbiAgXCJFb2dvblwiOlwiXFx1MDExOFwiLFxuICBcImVvZ29uXCI6XCJcXHUwMTE5XCIsXG4gIFwiRW9wZlwiOlwiXFx1RDgzNVxcdUREM0NcIixcbiAgXCJlb3BmXCI6XCJcXHVEODM1XFx1REQ1NlwiLFxuICBcImVwYXJcIjpcIlxcdTIyRDVcIixcbiAgXCJlcGFyc2xcIjpcIlxcdTI5RTNcIixcbiAgXCJlcGx1c1wiOlwiXFx1MkE3MVwiLFxuICBcImVwc2lcIjpcIlxcdTAzQjVcIixcbiAgXCJFcHNpbG9uXCI6XCJcXHUwMzk1XCIsXG4gIFwiZXBzaWxvblwiOlwiXFx1MDNCNVwiLFxuICBcImVwc2l2XCI6XCJcXHUwM0Y1XCIsXG4gIFwiZXFjaXJjXCI6XCJcXHUyMjU2XCIsXG4gIFwiZXFjb2xvblwiOlwiXFx1MjI1NVwiLFxuICBcImVxc2ltXCI6XCJcXHUyMjQyXCIsXG4gIFwiZXFzbGFudGd0clwiOlwiXFx1MkE5NlwiLFxuICBcImVxc2xhbnRsZXNzXCI6XCJcXHUyQTk1XCIsXG4gIFwiRXF1YWxcIjpcIlxcdTJBNzVcIixcbiAgXCJlcXVhbHNcIjpcIlxcdTAwM0RcIixcbiAgXCJFcXVhbFRpbGRlXCI6XCJcXHUyMjQyXCIsXG4gIFwiZXF1ZXN0XCI6XCJcXHUyMjVGXCIsXG4gIFwiRXF1aWxpYnJpdW1cIjpcIlxcdTIxQ0NcIixcbiAgXCJlcXVpdlwiOlwiXFx1MjI2MVwiLFxuICBcImVxdWl2RERcIjpcIlxcdTJBNzhcIixcbiAgXCJlcXZwYXJzbFwiOlwiXFx1MjlFNVwiLFxuICBcImVyYXJyXCI6XCJcXHUyOTcxXCIsXG4gIFwiZXJEb3RcIjpcIlxcdTIyNTNcIixcbiAgXCJFc2NyXCI6XCJcXHUyMTMwXCIsXG4gIFwiZXNjclwiOlwiXFx1MjEyRlwiLFxuICBcImVzZG90XCI6XCJcXHUyMjUwXCIsXG4gIFwiRXNpbVwiOlwiXFx1MkE3M1wiLFxuICBcImVzaW1cIjpcIlxcdTIyNDJcIixcbiAgXCJFdGFcIjpcIlxcdTAzOTdcIixcbiAgXCJldGFcIjpcIlxcdTAzQjdcIixcbiAgXCJFVEhcIjpcIlxcdTAwRDBcIixcbiAgXCJldGhcIjpcIlxcdTAwRjBcIixcbiAgXCJFdW1sXCI6XCJcXHUwMENCXCIsXG4gIFwiZXVtbFwiOlwiXFx1MDBFQlwiLFxuICBcImV1cm9cIjpcIlxcdTIwQUNcIixcbiAgXCJleGNsXCI6XCJcXHUwMDIxXCIsXG4gIFwiZXhpc3RcIjpcIlxcdTIyMDNcIixcbiAgXCJFeGlzdHNcIjpcIlxcdTIyMDNcIixcbiAgXCJleHBlY3RhdGlvblwiOlwiXFx1MjEzMFwiLFxuICBcIkV4cG9uZW50aWFsRVwiOlwiXFx1MjE0N1wiLFxuICBcImV4cG9uZW50aWFsZVwiOlwiXFx1MjE0N1wiLFxuICBcImZhbGxpbmdkb3RzZXFcIjpcIlxcdTIyNTJcIixcbiAgXCJGY3lcIjpcIlxcdTA0MjRcIixcbiAgXCJmY3lcIjpcIlxcdTA0NDRcIixcbiAgXCJmZW1hbGVcIjpcIlxcdTI2NDBcIixcbiAgXCJmZmlsaWdcIjpcIlxcdUZCMDNcIixcbiAgXCJmZmxpZ1wiOlwiXFx1RkIwMFwiLFxuICBcImZmbGxpZ1wiOlwiXFx1RkIwNFwiLFxuICBcIkZmclwiOlwiXFx1RDgzNVxcdUREMDlcIixcbiAgXCJmZnJcIjpcIlxcdUQ4MzVcXHVERDIzXCIsXG4gIFwiZmlsaWdcIjpcIlxcdUZCMDFcIixcbiAgXCJGaWxsZWRTbWFsbFNxdWFyZVwiOlwiXFx1MjVGQ1wiLFxuICBcIkZpbGxlZFZlcnlTbWFsbFNxdWFyZVwiOlwiXFx1MjVBQVwiLFxuICBcImZqbGlnXCI6XCJcXHUwMDY2XFx1MDA2QVwiLFxuICBcImZsYXRcIjpcIlxcdTI2NkRcIixcbiAgXCJmbGxpZ1wiOlwiXFx1RkIwMlwiLFxuICBcImZsdG5zXCI6XCJcXHUyNUIxXCIsXG4gIFwiZm5vZlwiOlwiXFx1MDE5MlwiLFxuICBcIkZvcGZcIjpcIlxcdUQ4MzVcXHVERDNEXCIsXG4gIFwiZm9wZlwiOlwiXFx1RDgzNVxcdURENTdcIixcbiAgXCJGb3JBbGxcIjpcIlxcdTIyMDBcIixcbiAgXCJmb3JhbGxcIjpcIlxcdTIyMDBcIixcbiAgXCJmb3JrXCI6XCJcXHUyMkQ0XCIsXG4gIFwiZm9ya3ZcIjpcIlxcdTJBRDlcIixcbiAgXCJGb3VyaWVydHJmXCI6XCJcXHUyMTMxXCIsXG4gIFwiZnBhcnRpbnRcIjpcIlxcdTJBMERcIixcbiAgXCJmcmFjMTJcIjpcIlxcdTAwQkRcIixcbiAgXCJmcmFjMTNcIjpcIlxcdTIxNTNcIixcbiAgXCJmcmFjMTRcIjpcIlxcdTAwQkNcIixcbiAgXCJmcmFjMTVcIjpcIlxcdTIxNTVcIixcbiAgXCJmcmFjMTZcIjpcIlxcdTIxNTlcIixcbiAgXCJmcmFjMThcIjpcIlxcdTIxNUJcIixcbiAgXCJmcmFjMjNcIjpcIlxcdTIxNTRcIixcbiAgXCJmcmFjMjVcIjpcIlxcdTIxNTZcIixcbiAgXCJmcmFjMzRcIjpcIlxcdTAwQkVcIixcbiAgXCJmcmFjMzVcIjpcIlxcdTIxNTdcIixcbiAgXCJmcmFjMzhcIjpcIlxcdTIxNUNcIixcbiAgXCJmcmFjNDVcIjpcIlxcdTIxNThcIixcbiAgXCJmcmFjNTZcIjpcIlxcdTIxNUFcIixcbiAgXCJmcmFjNThcIjpcIlxcdTIxNURcIixcbiAgXCJmcmFjNzhcIjpcIlxcdTIxNUVcIixcbiAgXCJmcmFzbFwiOlwiXFx1MjA0NFwiLFxuICBcImZyb3duXCI6XCJcXHUyMzIyXCIsXG4gIFwiRnNjclwiOlwiXFx1MjEzMVwiLFxuICBcImZzY3JcIjpcIlxcdUQ4MzVcXHVEQ0JCXCIsXG4gIFwiZ2FjdXRlXCI6XCJcXHUwMUY1XCIsXG4gIFwiR2FtbWFcIjpcIlxcdTAzOTNcIixcbiAgXCJnYW1tYVwiOlwiXFx1MDNCM1wiLFxuICBcIkdhbW1hZFwiOlwiXFx1MDNEQ1wiLFxuICBcImdhbW1hZFwiOlwiXFx1MDNERFwiLFxuICBcImdhcFwiOlwiXFx1MkE4NlwiLFxuICBcIkdicmV2ZVwiOlwiXFx1MDExRVwiLFxuICBcImdicmV2ZVwiOlwiXFx1MDExRlwiLFxuICBcIkdjZWRpbFwiOlwiXFx1MDEyMlwiLFxuICBcIkdjaXJjXCI6XCJcXHUwMTFDXCIsXG4gIFwiZ2NpcmNcIjpcIlxcdTAxMURcIixcbiAgXCJHY3lcIjpcIlxcdTA0MTNcIixcbiAgXCJnY3lcIjpcIlxcdTA0MzNcIixcbiAgXCJHZG90XCI6XCJcXHUwMTIwXCIsXG4gIFwiZ2RvdFwiOlwiXFx1MDEyMVwiLFxuICBcImdFXCI6XCJcXHUyMjY3XCIsXG4gIFwiZ2VcIjpcIlxcdTIyNjVcIixcbiAgXCJnRWxcIjpcIlxcdTJBOENcIixcbiAgXCJnZWxcIjpcIlxcdTIyREJcIixcbiAgXCJnZXFcIjpcIlxcdTIyNjVcIixcbiAgXCJnZXFxXCI6XCJcXHUyMjY3XCIsXG4gIFwiZ2Vxc2xhbnRcIjpcIlxcdTJBN0VcIixcbiAgXCJnZXNcIjpcIlxcdTJBN0VcIixcbiAgXCJnZXNjY1wiOlwiXFx1MkFBOVwiLFxuICBcImdlc2RvdFwiOlwiXFx1MkE4MFwiLFxuICBcImdlc2RvdG9cIjpcIlxcdTJBODJcIixcbiAgXCJnZXNkb3RvbFwiOlwiXFx1MkE4NFwiLFxuICBcImdlc2xcIjpcIlxcdTIyREJcXHVGRTAwXCIsXG4gIFwiZ2VzbGVzXCI6XCJcXHUyQTk0XCIsXG4gIFwiR2ZyXCI6XCJcXHVEODM1XFx1REQwQVwiLFxuICBcImdmclwiOlwiXFx1RDgzNVxcdUREMjRcIixcbiAgXCJHZ1wiOlwiXFx1MjJEOVwiLFxuICBcImdnXCI6XCJcXHUyMjZCXCIsXG4gIFwiZ2dnXCI6XCJcXHUyMkQ5XCIsXG4gIFwiZ2ltZWxcIjpcIlxcdTIxMzdcIixcbiAgXCJHSmN5XCI6XCJcXHUwNDAzXCIsXG4gIFwiZ2pjeVwiOlwiXFx1MDQ1M1wiLFxuICBcImdsXCI6XCJcXHUyMjc3XCIsXG4gIFwiZ2xhXCI6XCJcXHUyQUE1XCIsXG4gIFwiZ2xFXCI6XCJcXHUyQTkyXCIsXG4gIFwiZ2xqXCI6XCJcXHUyQUE0XCIsXG4gIFwiZ25hcFwiOlwiXFx1MkE4QVwiLFxuICBcImduYXBwcm94XCI6XCJcXHUyQThBXCIsXG4gIFwiZ25FXCI6XCJcXHUyMjY5XCIsXG4gIFwiZ25lXCI6XCJcXHUyQTg4XCIsXG4gIFwiZ25lcVwiOlwiXFx1MkE4OFwiLFxuICBcImduZXFxXCI6XCJcXHUyMjY5XCIsXG4gIFwiZ25zaW1cIjpcIlxcdTIyRTdcIixcbiAgXCJHb3BmXCI6XCJcXHVEODM1XFx1REQzRVwiLFxuICBcImdvcGZcIjpcIlxcdUQ4MzVcXHVERDU4XCIsXG4gIFwiZ3JhdmVcIjpcIlxcdTAwNjBcIixcbiAgXCJHcmVhdGVyRXF1YWxcIjpcIlxcdTIyNjVcIixcbiAgXCJHcmVhdGVyRXF1YWxMZXNzXCI6XCJcXHUyMkRCXCIsXG4gIFwiR3JlYXRlckZ1bGxFcXVhbFwiOlwiXFx1MjI2N1wiLFxuICBcIkdyZWF0ZXJHcmVhdGVyXCI6XCJcXHUyQUEyXCIsXG4gIFwiR3JlYXRlckxlc3NcIjpcIlxcdTIyNzdcIixcbiAgXCJHcmVhdGVyU2xhbnRFcXVhbFwiOlwiXFx1MkE3RVwiLFxuICBcIkdyZWF0ZXJUaWxkZVwiOlwiXFx1MjI3M1wiLFxuICBcIkdzY3JcIjpcIlxcdUQ4MzVcXHVEQ0EyXCIsXG4gIFwiZ3NjclwiOlwiXFx1MjEwQVwiLFxuICBcImdzaW1cIjpcIlxcdTIyNzNcIixcbiAgXCJnc2ltZVwiOlwiXFx1MkE4RVwiLFxuICBcImdzaW1sXCI6XCJcXHUyQTkwXCIsXG4gIFwiR1RcIjpcIlxcdTAwM0VcIixcbiAgXCJHdFwiOlwiXFx1MjI2QlwiLFxuICBcImd0XCI6XCJcXHUwMDNFXCIsXG4gIFwiZ3RjY1wiOlwiXFx1MkFBN1wiLFxuICBcImd0Y2lyXCI6XCJcXHUyQTdBXCIsXG4gIFwiZ3Rkb3RcIjpcIlxcdTIyRDdcIixcbiAgXCJndGxQYXJcIjpcIlxcdTI5OTVcIixcbiAgXCJndHF1ZXN0XCI6XCJcXHUyQTdDXCIsXG4gIFwiZ3RyYXBwcm94XCI6XCJcXHUyQTg2XCIsXG4gIFwiZ3RyYXJyXCI6XCJcXHUyOTc4XCIsXG4gIFwiZ3RyZG90XCI6XCJcXHUyMkQ3XCIsXG4gIFwiZ3RyZXFsZXNzXCI6XCJcXHUyMkRCXCIsXG4gIFwiZ3RyZXFxbGVzc1wiOlwiXFx1MkE4Q1wiLFxuICBcImd0cmxlc3NcIjpcIlxcdTIyNzdcIixcbiAgXCJndHJzaW1cIjpcIlxcdTIyNzNcIixcbiAgXCJndmVydG5lcXFcIjpcIlxcdTIyNjlcXHVGRTAwXCIsXG4gIFwiZ3ZuRVwiOlwiXFx1MjI2OVxcdUZFMDBcIixcbiAgXCJIYWNla1wiOlwiXFx1MDJDN1wiLFxuICBcImhhaXJzcFwiOlwiXFx1MjAwQVwiLFxuICBcImhhbGZcIjpcIlxcdTAwQkRcIixcbiAgXCJoYW1pbHRcIjpcIlxcdTIxMEJcIixcbiAgXCJIQVJEY3lcIjpcIlxcdTA0MkFcIixcbiAgXCJoYXJkY3lcIjpcIlxcdTA0NEFcIixcbiAgXCJoQXJyXCI6XCJcXHUyMUQ0XCIsXG4gIFwiaGFyclwiOlwiXFx1MjE5NFwiLFxuICBcImhhcnJjaXJcIjpcIlxcdTI5NDhcIixcbiAgXCJoYXJyd1wiOlwiXFx1MjFBRFwiLFxuICBcIkhhdFwiOlwiXFx1MDA1RVwiLFxuICBcImhiYXJcIjpcIlxcdTIxMEZcIixcbiAgXCJIY2lyY1wiOlwiXFx1MDEyNFwiLFxuICBcImhjaXJjXCI6XCJcXHUwMTI1XCIsXG4gIFwiaGVhcnRzXCI6XCJcXHUyNjY1XCIsXG4gIFwiaGVhcnRzdWl0XCI6XCJcXHUyNjY1XCIsXG4gIFwiaGVsbGlwXCI6XCJcXHUyMDI2XCIsXG4gIFwiaGVyY29uXCI6XCJcXHUyMkI5XCIsXG4gIFwiSGZyXCI6XCJcXHUyMTBDXCIsXG4gIFwiaGZyXCI6XCJcXHVEODM1XFx1REQyNVwiLFxuICBcIkhpbGJlcnRTcGFjZVwiOlwiXFx1MjEwQlwiLFxuICBcImhrc2Vhcm93XCI6XCJcXHUyOTI1XCIsXG4gIFwiaGtzd2Fyb3dcIjpcIlxcdTI5MjZcIixcbiAgXCJob2FyclwiOlwiXFx1MjFGRlwiLFxuICBcImhvbXRodFwiOlwiXFx1MjIzQlwiLFxuICBcImhvb2tsZWZ0YXJyb3dcIjpcIlxcdTIxQTlcIixcbiAgXCJob29rcmlnaHRhcnJvd1wiOlwiXFx1MjFBQVwiLFxuICBcIkhvcGZcIjpcIlxcdTIxMERcIixcbiAgXCJob3BmXCI6XCJcXHVEODM1XFx1REQ1OVwiLFxuICBcImhvcmJhclwiOlwiXFx1MjAxNVwiLFxuICBcIkhvcml6b250YWxMaW5lXCI6XCJcXHUyNTAwXCIsXG4gIFwiSHNjclwiOlwiXFx1MjEwQlwiLFxuICBcImhzY3JcIjpcIlxcdUQ4MzVcXHVEQ0JEXCIsXG4gIFwiaHNsYXNoXCI6XCJcXHUyMTBGXCIsXG4gIFwiSHN0cm9rXCI6XCJcXHUwMTI2XCIsXG4gIFwiaHN0cm9rXCI6XCJcXHUwMTI3XCIsXG4gIFwiSHVtcERvd25IdW1wXCI6XCJcXHUyMjRFXCIsXG4gIFwiSHVtcEVxdWFsXCI6XCJcXHUyMjRGXCIsXG4gIFwiaHlidWxsXCI6XCJcXHUyMDQzXCIsXG4gIFwiaHlwaGVuXCI6XCJcXHUyMDEwXCIsXG4gIFwiSWFjdXRlXCI6XCJcXHUwMENEXCIsXG4gIFwiaWFjdXRlXCI6XCJcXHUwMEVEXCIsXG4gIFwiaWNcIjpcIlxcdTIwNjNcIixcbiAgXCJJY2lyY1wiOlwiXFx1MDBDRVwiLFxuICBcImljaXJjXCI6XCJcXHUwMEVFXCIsXG4gIFwiSWN5XCI6XCJcXHUwNDE4XCIsXG4gIFwiaWN5XCI6XCJcXHUwNDM4XCIsXG4gIFwiSWRvdFwiOlwiXFx1MDEzMFwiLFxuICBcIklFY3lcIjpcIlxcdTA0MTVcIixcbiAgXCJpZWN5XCI6XCJcXHUwNDM1XCIsXG4gIFwiaWV4Y2xcIjpcIlxcdTAwQTFcIixcbiAgXCJpZmZcIjpcIlxcdTIxRDRcIixcbiAgXCJJZnJcIjpcIlxcdTIxMTFcIixcbiAgXCJpZnJcIjpcIlxcdUQ4MzVcXHVERDI2XCIsXG4gIFwiSWdyYXZlXCI6XCJcXHUwMENDXCIsXG4gIFwiaWdyYXZlXCI6XCJcXHUwMEVDXCIsXG4gIFwiaWlcIjpcIlxcdTIxNDhcIixcbiAgXCJpaWlpbnRcIjpcIlxcdTJBMENcIixcbiAgXCJpaWludFwiOlwiXFx1MjIyRFwiLFxuICBcImlpbmZpblwiOlwiXFx1MjlEQ1wiLFxuICBcImlpb3RhXCI6XCJcXHUyMTI5XCIsXG4gIFwiSUpsaWdcIjpcIlxcdTAxMzJcIixcbiAgXCJpamxpZ1wiOlwiXFx1MDEzM1wiLFxuICBcIkltXCI6XCJcXHUyMTExXCIsXG4gIFwiSW1hY3JcIjpcIlxcdTAxMkFcIixcbiAgXCJpbWFjclwiOlwiXFx1MDEyQlwiLFxuICBcImltYWdlXCI6XCJcXHUyMTExXCIsXG4gIFwiSW1hZ2luYXJ5SVwiOlwiXFx1MjE0OFwiLFxuICBcImltYWdsaW5lXCI6XCJcXHUyMTEwXCIsXG4gIFwiaW1hZ3BhcnRcIjpcIlxcdTIxMTFcIixcbiAgXCJpbWF0aFwiOlwiXFx1MDEzMVwiLFxuICBcImltb2ZcIjpcIlxcdTIyQjdcIixcbiAgXCJpbXBlZFwiOlwiXFx1MDFCNVwiLFxuICBcIkltcGxpZXNcIjpcIlxcdTIxRDJcIixcbiAgXCJpblwiOlwiXFx1MjIwOFwiLFxuICBcImluY2FyZVwiOlwiXFx1MjEwNVwiLFxuICBcImluZmluXCI6XCJcXHUyMjFFXCIsXG4gIFwiaW5maW50aWVcIjpcIlxcdTI5RERcIixcbiAgXCJpbm9kb3RcIjpcIlxcdTAxMzFcIixcbiAgXCJJbnRcIjpcIlxcdTIyMkNcIixcbiAgXCJpbnRcIjpcIlxcdTIyMkJcIixcbiAgXCJpbnRjYWxcIjpcIlxcdTIyQkFcIixcbiAgXCJpbnRlZ2Vyc1wiOlwiXFx1MjEyNFwiLFxuICBcIkludGVncmFsXCI6XCJcXHUyMjJCXCIsXG4gIFwiaW50ZXJjYWxcIjpcIlxcdTIyQkFcIixcbiAgXCJJbnRlcnNlY3Rpb25cIjpcIlxcdTIyQzJcIixcbiAgXCJpbnRsYXJoa1wiOlwiXFx1MkExN1wiLFxuICBcImludHByb2RcIjpcIlxcdTJBM0NcIixcbiAgXCJJbnZpc2libGVDb21tYVwiOlwiXFx1MjA2M1wiLFxuICBcIkludmlzaWJsZVRpbWVzXCI6XCJcXHUyMDYyXCIsXG4gIFwiSU9jeVwiOlwiXFx1MDQwMVwiLFxuICBcImlvY3lcIjpcIlxcdTA0NTFcIixcbiAgXCJJb2dvblwiOlwiXFx1MDEyRVwiLFxuICBcImlvZ29uXCI6XCJcXHUwMTJGXCIsXG4gIFwiSW9wZlwiOlwiXFx1RDgzNVxcdURENDBcIixcbiAgXCJpb3BmXCI6XCJcXHVEODM1XFx1REQ1QVwiLFxuICBcIklvdGFcIjpcIlxcdTAzOTlcIixcbiAgXCJpb3RhXCI6XCJcXHUwM0I5XCIsXG4gIFwiaXByb2RcIjpcIlxcdTJBM0NcIixcbiAgXCJpcXVlc3RcIjpcIlxcdTAwQkZcIixcbiAgXCJJc2NyXCI6XCJcXHUyMTEwXCIsXG4gIFwiaXNjclwiOlwiXFx1RDgzNVxcdURDQkVcIixcbiAgXCJpc2luXCI6XCJcXHUyMjA4XCIsXG4gIFwiaXNpbmRvdFwiOlwiXFx1MjJGNVwiLFxuICBcImlzaW5FXCI6XCJcXHUyMkY5XCIsXG4gIFwiaXNpbnNcIjpcIlxcdTIyRjRcIixcbiAgXCJpc2luc3ZcIjpcIlxcdTIyRjNcIixcbiAgXCJpc2ludlwiOlwiXFx1MjIwOFwiLFxuICBcIml0XCI6XCJcXHUyMDYyXCIsXG4gIFwiSXRpbGRlXCI6XCJcXHUwMTI4XCIsXG4gIFwiaXRpbGRlXCI6XCJcXHUwMTI5XCIsXG4gIFwiSXVrY3lcIjpcIlxcdTA0MDZcIixcbiAgXCJpdWtjeVwiOlwiXFx1MDQ1NlwiLFxuICBcIkl1bWxcIjpcIlxcdTAwQ0ZcIixcbiAgXCJpdW1sXCI6XCJcXHUwMEVGXCIsXG4gIFwiSmNpcmNcIjpcIlxcdTAxMzRcIixcbiAgXCJqY2lyY1wiOlwiXFx1MDEzNVwiLFxuICBcIkpjeVwiOlwiXFx1MDQxOVwiLFxuICBcImpjeVwiOlwiXFx1MDQzOVwiLFxuICBcIkpmclwiOlwiXFx1RDgzNVxcdUREMERcIixcbiAgXCJqZnJcIjpcIlxcdUQ4MzVcXHVERDI3XCIsXG4gIFwiam1hdGhcIjpcIlxcdTAyMzdcIixcbiAgXCJKb3BmXCI6XCJcXHVEODM1XFx1REQ0MVwiLFxuICBcImpvcGZcIjpcIlxcdUQ4MzVcXHVERDVCXCIsXG4gIFwiSnNjclwiOlwiXFx1RDgzNVxcdURDQTVcIixcbiAgXCJqc2NyXCI6XCJcXHVEODM1XFx1RENCRlwiLFxuICBcIkpzZXJjeVwiOlwiXFx1MDQwOFwiLFxuICBcImpzZXJjeVwiOlwiXFx1MDQ1OFwiLFxuICBcIkp1a2N5XCI6XCJcXHUwNDA0XCIsXG4gIFwianVrY3lcIjpcIlxcdTA0NTRcIixcbiAgXCJLYXBwYVwiOlwiXFx1MDM5QVwiLFxuICBcImthcHBhXCI6XCJcXHUwM0JBXCIsXG4gIFwia2FwcGF2XCI6XCJcXHUwM0YwXCIsXG4gIFwiS2NlZGlsXCI6XCJcXHUwMTM2XCIsXG4gIFwia2NlZGlsXCI6XCJcXHUwMTM3XCIsXG4gIFwiS2N5XCI6XCJcXHUwNDFBXCIsXG4gIFwia2N5XCI6XCJcXHUwNDNBXCIsXG4gIFwiS2ZyXCI6XCJcXHVEODM1XFx1REQwRVwiLFxuICBcImtmclwiOlwiXFx1RDgzNVxcdUREMjhcIixcbiAgXCJrZ3JlZW5cIjpcIlxcdTAxMzhcIixcbiAgXCJLSGN5XCI6XCJcXHUwNDI1XCIsXG4gIFwia2hjeVwiOlwiXFx1MDQ0NVwiLFxuICBcIktKY3lcIjpcIlxcdTA0MENcIixcbiAgXCJramN5XCI6XCJcXHUwNDVDXCIsXG4gIFwiS29wZlwiOlwiXFx1RDgzNVxcdURENDJcIixcbiAgXCJrb3BmXCI6XCJcXHVEODM1XFx1REQ1Q1wiLFxuICBcIktzY3JcIjpcIlxcdUQ4MzVcXHVEQ0E2XCIsXG4gIFwia3NjclwiOlwiXFx1RDgzNVxcdURDQzBcIixcbiAgXCJsQWFyclwiOlwiXFx1MjFEQVwiLFxuICBcIkxhY3V0ZVwiOlwiXFx1MDEzOVwiLFxuICBcImxhY3V0ZVwiOlwiXFx1MDEzQVwiLFxuICBcImxhZW1wdHl2XCI6XCJcXHUyOUI0XCIsXG4gIFwibGFncmFuXCI6XCJcXHUyMTEyXCIsXG4gIFwiTGFtYmRhXCI6XCJcXHUwMzlCXCIsXG4gIFwibGFtYmRhXCI6XCJcXHUwM0JCXCIsXG4gIFwiTGFuZ1wiOlwiXFx1MjdFQVwiLFxuICBcImxhbmdcIjpcIlxcdTI3RThcIixcbiAgXCJsYW5nZFwiOlwiXFx1Mjk5MVwiLFxuICBcImxhbmdsZVwiOlwiXFx1MjdFOFwiLFxuICBcImxhcFwiOlwiXFx1MkE4NVwiLFxuICBcIkxhcGxhY2V0cmZcIjpcIlxcdTIxMTJcIixcbiAgXCJsYXF1b1wiOlwiXFx1MDBBQlwiLFxuICBcIkxhcnJcIjpcIlxcdTIxOUVcIixcbiAgXCJsQXJyXCI6XCJcXHUyMUQwXCIsXG4gIFwibGFyclwiOlwiXFx1MjE5MFwiLFxuICBcImxhcnJiXCI6XCJcXHUyMUU0XCIsXG4gIFwibGFycmJmc1wiOlwiXFx1MjkxRlwiLFxuICBcImxhcnJmc1wiOlwiXFx1MjkxRFwiLFxuICBcImxhcnJoa1wiOlwiXFx1MjFBOVwiLFxuICBcImxhcnJscFwiOlwiXFx1MjFBQlwiLFxuICBcImxhcnJwbFwiOlwiXFx1MjkzOVwiLFxuICBcImxhcnJzaW1cIjpcIlxcdTI5NzNcIixcbiAgXCJsYXJydGxcIjpcIlxcdTIxQTJcIixcbiAgXCJsYXRcIjpcIlxcdTJBQUJcIixcbiAgXCJsQXRhaWxcIjpcIlxcdTI5MUJcIixcbiAgXCJsYXRhaWxcIjpcIlxcdTI5MTlcIixcbiAgXCJsYXRlXCI6XCJcXHUyQUFEXCIsXG4gIFwibGF0ZXNcIjpcIlxcdTJBQURcXHVGRTAwXCIsXG4gIFwibEJhcnJcIjpcIlxcdTI5MEVcIixcbiAgXCJsYmFyclwiOlwiXFx1MjkwQ1wiLFxuICBcImxiYnJrXCI6XCJcXHUyNzcyXCIsXG4gIFwibGJyYWNlXCI6XCJcXHUwMDdCXCIsXG4gIFwibGJyYWNrXCI6XCJcXHUwMDVCXCIsXG4gIFwibGJya2VcIjpcIlxcdTI5OEJcIixcbiAgXCJsYnJrc2xkXCI6XCJcXHUyOThGXCIsXG4gIFwibGJya3NsdVwiOlwiXFx1Mjk4RFwiLFxuICBcIkxjYXJvblwiOlwiXFx1MDEzRFwiLFxuICBcImxjYXJvblwiOlwiXFx1MDEzRVwiLFxuICBcIkxjZWRpbFwiOlwiXFx1MDEzQlwiLFxuICBcImxjZWRpbFwiOlwiXFx1MDEzQ1wiLFxuICBcImxjZWlsXCI6XCJcXHUyMzA4XCIsXG4gIFwibGN1YlwiOlwiXFx1MDA3QlwiLFxuICBcIkxjeVwiOlwiXFx1MDQxQlwiLFxuICBcImxjeVwiOlwiXFx1MDQzQlwiLFxuICBcImxkY2FcIjpcIlxcdTI5MzZcIixcbiAgXCJsZHF1b1wiOlwiXFx1MjAxQ1wiLFxuICBcImxkcXVvclwiOlwiXFx1MjAxRVwiLFxuICBcImxkcmRoYXJcIjpcIlxcdTI5NjdcIixcbiAgXCJsZHJ1c2hhclwiOlwiXFx1Mjk0QlwiLFxuICBcImxkc2hcIjpcIlxcdTIxQjJcIixcbiAgXCJsRVwiOlwiXFx1MjI2NlwiLFxuICBcImxlXCI6XCJcXHUyMjY0XCIsXG4gIFwiTGVmdEFuZ2xlQnJhY2tldFwiOlwiXFx1MjdFOFwiLFxuICBcIkxlZnRBcnJvd1wiOlwiXFx1MjE5MFwiLFxuICBcIkxlZnRhcnJvd1wiOlwiXFx1MjFEMFwiLFxuICBcImxlZnRhcnJvd1wiOlwiXFx1MjE5MFwiLFxuICBcIkxlZnRBcnJvd0JhclwiOlwiXFx1MjFFNFwiLFxuICBcIkxlZnRBcnJvd1JpZ2h0QXJyb3dcIjpcIlxcdTIxQzZcIixcbiAgXCJsZWZ0YXJyb3d0YWlsXCI6XCJcXHUyMUEyXCIsXG4gIFwiTGVmdENlaWxpbmdcIjpcIlxcdTIzMDhcIixcbiAgXCJMZWZ0RG91YmxlQnJhY2tldFwiOlwiXFx1MjdFNlwiLFxuICBcIkxlZnREb3duVGVlVmVjdG9yXCI6XCJcXHUyOTYxXCIsXG4gIFwiTGVmdERvd25WZWN0b3JcIjpcIlxcdTIxQzNcIixcbiAgXCJMZWZ0RG93blZlY3RvckJhclwiOlwiXFx1Mjk1OVwiLFxuICBcIkxlZnRGbG9vclwiOlwiXFx1MjMwQVwiLFxuICBcImxlZnRoYXJwb29uZG93blwiOlwiXFx1MjFCRFwiLFxuICBcImxlZnRoYXJwb29udXBcIjpcIlxcdTIxQkNcIixcbiAgXCJsZWZ0bGVmdGFycm93c1wiOlwiXFx1MjFDN1wiLFxuICBcIkxlZnRSaWdodEFycm93XCI6XCJcXHUyMTk0XCIsXG4gIFwiTGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTIxRDRcIixcbiAgXCJsZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjE5NFwiLFxuICBcImxlZnRyaWdodGFycm93c1wiOlwiXFx1MjFDNlwiLFxuICBcImxlZnRyaWdodGhhcnBvb25zXCI6XCJcXHUyMUNCXCIsXG4gIFwibGVmdHJpZ2h0c3F1aWdhcnJvd1wiOlwiXFx1MjFBRFwiLFxuICBcIkxlZnRSaWdodFZlY3RvclwiOlwiXFx1Mjk0RVwiLFxuICBcIkxlZnRUZWVcIjpcIlxcdTIyQTNcIixcbiAgXCJMZWZ0VGVlQXJyb3dcIjpcIlxcdTIxQTRcIixcbiAgXCJMZWZ0VGVlVmVjdG9yXCI6XCJcXHUyOTVBXCIsXG4gIFwibGVmdHRocmVldGltZXNcIjpcIlxcdTIyQ0JcIixcbiAgXCJMZWZ0VHJpYW5nbGVcIjpcIlxcdTIyQjJcIixcbiAgXCJMZWZ0VHJpYW5nbGVCYXJcIjpcIlxcdTI5Q0ZcIixcbiAgXCJMZWZ0VHJpYW5nbGVFcXVhbFwiOlwiXFx1MjJCNFwiLFxuICBcIkxlZnRVcERvd25WZWN0b3JcIjpcIlxcdTI5NTFcIixcbiAgXCJMZWZ0VXBUZWVWZWN0b3JcIjpcIlxcdTI5NjBcIixcbiAgXCJMZWZ0VXBWZWN0b3JcIjpcIlxcdTIxQkZcIixcbiAgXCJMZWZ0VXBWZWN0b3JCYXJcIjpcIlxcdTI5NThcIixcbiAgXCJMZWZ0VmVjdG9yXCI6XCJcXHUyMUJDXCIsXG4gIFwiTGVmdFZlY3RvckJhclwiOlwiXFx1Mjk1MlwiLFxuICBcImxFZ1wiOlwiXFx1MkE4QlwiLFxuICBcImxlZ1wiOlwiXFx1MjJEQVwiLFxuICBcImxlcVwiOlwiXFx1MjI2NFwiLFxuICBcImxlcXFcIjpcIlxcdTIyNjZcIixcbiAgXCJsZXFzbGFudFwiOlwiXFx1MkE3RFwiLFxuICBcImxlc1wiOlwiXFx1MkE3RFwiLFxuICBcImxlc2NjXCI6XCJcXHUyQUE4XCIsXG4gIFwibGVzZG90XCI6XCJcXHUyQTdGXCIsXG4gIFwibGVzZG90b1wiOlwiXFx1MkE4MVwiLFxuICBcImxlc2RvdG9yXCI6XCJcXHUyQTgzXCIsXG4gIFwibGVzZ1wiOlwiXFx1MjJEQVxcdUZFMDBcIixcbiAgXCJsZXNnZXNcIjpcIlxcdTJBOTNcIixcbiAgXCJsZXNzYXBwcm94XCI6XCJcXHUyQTg1XCIsXG4gIFwibGVzc2RvdFwiOlwiXFx1MjJENlwiLFxuICBcImxlc3NlcWd0clwiOlwiXFx1MjJEQVwiLFxuICBcImxlc3NlcXFndHJcIjpcIlxcdTJBOEJcIixcbiAgXCJMZXNzRXF1YWxHcmVhdGVyXCI6XCJcXHUyMkRBXCIsXG4gIFwiTGVzc0Z1bGxFcXVhbFwiOlwiXFx1MjI2NlwiLFxuICBcIkxlc3NHcmVhdGVyXCI6XCJcXHUyMjc2XCIsXG4gIFwibGVzc2d0clwiOlwiXFx1MjI3NlwiLFxuICBcIkxlc3NMZXNzXCI6XCJcXHUyQUExXCIsXG4gIFwibGVzc3NpbVwiOlwiXFx1MjI3MlwiLFxuICBcIkxlc3NTbGFudEVxdWFsXCI6XCJcXHUyQTdEXCIsXG4gIFwiTGVzc1RpbGRlXCI6XCJcXHUyMjcyXCIsXG4gIFwibGZpc2h0XCI6XCJcXHUyOTdDXCIsXG4gIFwibGZsb29yXCI6XCJcXHUyMzBBXCIsXG4gIFwiTGZyXCI6XCJcXHVEODM1XFx1REQwRlwiLFxuICBcImxmclwiOlwiXFx1RDgzNVxcdUREMjlcIixcbiAgXCJsZ1wiOlwiXFx1MjI3NlwiLFxuICBcImxnRVwiOlwiXFx1MkE5MVwiLFxuICBcImxIYXJcIjpcIlxcdTI5NjJcIixcbiAgXCJsaGFyZFwiOlwiXFx1MjFCRFwiLFxuICBcImxoYXJ1XCI6XCJcXHUyMUJDXCIsXG4gIFwibGhhcnVsXCI6XCJcXHUyOTZBXCIsXG4gIFwibGhibGtcIjpcIlxcdTI1ODRcIixcbiAgXCJMSmN5XCI6XCJcXHUwNDA5XCIsXG4gIFwibGpjeVwiOlwiXFx1MDQ1OVwiLFxuICBcIkxsXCI6XCJcXHUyMkQ4XCIsXG4gIFwibGxcIjpcIlxcdTIyNkFcIixcbiAgXCJsbGFyclwiOlwiXFx1MjFDN1wiLFxuICBcImxsY29ybmVyXCI6XCJcXHUyMzFFXCIsXG4gIFwiTGxlZnRhcnJvd1wiOlwiXFx1MjFEQVwiLFxuICBcImxsaGFyZFwiOlwiXFx1Mjk2QlwiLFxuICBcImxsdHJpXCI6XCJcXHUyNUZBXCIsXG4gIFwiTG1pZG90XCI6XCJcXHUwMTNGXCIsXG4gIFwibG1pZG90XCI6XCJcXHUwMTQwXCIsXG4gIFwibG1vdXN0XCI6XCJcXHUyM0IwXCIsXG4gIFwibG1vdXN0YWNoZVwiOlwiXFx1MjNCMFwiLFxuICBcImxuYXBcIjpcIlxcdTJBODlcIixcbiAgXCJsbmFwcHJveFwiOlwiXFx1MkE4OVwiLFxuICBcImxuRVwiOlwiXFx1MjI2OFwiLFxuICBcImxuZVwiOlwiXFx1MkE4N1wiLFxuICBcImxuZXFcIjpcIlxcdTJBODdcIixcbiAgXCJsbmVxcVwiOlwiXFx1MjI2OFwiLFxuICBcImxuc2ltXCI6XCJcXHUyMkU2XCIsXG4gIFwibG9hbmdcIjpcIlxcdTI3RUNcIixcbiAgXCJsb2FyclwiOlwiXFx1MjFGRFwiLFxuICBcImxvYnJrXCI6XCJcXHUyN0U2XCIsXG4gIFwiTG9uZ0xlZnRBcnJvd1wiOlwiXFx1MjdGNVwiLFxuICBcIkxvbmdsZWZ0YXJyb3dcIjpcIlxcdTI3RjhcIixcbiAgXCJsb25nbGVmdGFycm93XCI6XCJcXHUyN0Y1XCIsXG4gIFwiTG9uZ0xlZnRSaWdodEFycm93XCI6XCJcXHUyN0Y3XCIsXG4gIFwiTG9uZ2xlZnRyaWdodGFycm93XCI6XCJcXHUyN0ZBXCIsXG4gIFwibG9uZ2xlZnRyaWdodGFycm93XCI6XCJcXHUyN0Y3XCIsXG4gIFwibG9uZ21hcHN0b1wiOlwiXFx1MjdGQ1wiLFxuICBcIkxvbmdSaWdodEFycm93XCI6XCJcXHUyN0Y2XCIsXG4gIFwiTG9uZ3JpZ2h0YXJyb3dcIjpcIlxcdTI3RjlcIixcbiAgXCJsb25ncmlnaHRhcnJvd1wiOlwiXFx1MjdGNlwiLFxuICBcImxvb3BhcnJvd2xlZnRcIjpcIlxcdTIxQUJcIixcbiAgXCJsb29wYXJyb3dyaWdodFwiOlwiXFx1MjFBQ1wiLFxuICBcImxvcGFyXCI6XCJcXHUyOTg1XCIsXG4gIFwiTG9wZlwiOlwiXFx1RDgzNVxcdURENDNcIixcbiAgXCJsb3BmXCI6XCJcXHVEODM1XFx1REQ1RFwiLFxuICBcImxvcGx1c1wiOlwiXFx1MkEyRFwiLFxuICBcImxvdGltZXNcIjpcIlxcdTJBMzRcIixcbiAgXCJsb3dhc3RcIjpcIlxcdTIyMTdcIixcbiAgXCJsb3diYXJcIjpcIlxcdTAwNUZcIixcbiAgXCJMb3dlckxlZnRBcnJvd1wiOlwiXFx1MjE5OVwiLFxuICBcIkxvd2VyUmlnaHRBcnJvd1wiOlwiXFx1MjE5OFwiLFxuICBcImxvelwiOlwiXFx1MjVDQVwiLFxuICBcImxvemVuZ2VcIjpcIlxcdTI1Q0FcIixcbiAgXCJsb3pmXCI6XCJcXHUyOUVCXCIsXG4gIFwibHBhclwiOlwiXFx1MDAyOFwiLFxuICBcImxwYXJsdFwiOlwiXFx1Mjk5M1wiLFxuICBcImxyYXJyXCI6XCJcXHUyMUM2XCIsXG4gIFwibHJjb3JuZXJcIjpcIlxcdTIzMUZcIixcbiAgXCJscmhhclwiOlwiXFx1MjFDQlwiLFxuICBcImxyaGFyZFwiOlwiXFx1Mjk2RFwiLFxuICBcImxybVwiOlwiXFx1MjAwRVwiLFxuICBcImxydHJpXCI6XCJcXHUyMkJGXCIsXG4gIFwibHNhcXVvXCI6XCJcXHUyMDM5XCIsXG4gIFwiTHNjclwiOlwiXFx1MjExMlwiLFxuICBcImxzY3JcIjpcIlxcdUQ4MzVcXHVEQ0MxXCIsXG4gIFwiTHNoXCI6XCJcXHUyMUIwXCIsXG4gIFwibHNoXCI6XCJcXHUyMUIwXCIsXG4gIFwibHNpbVwiOlwiXFx1MjI3MlwiLFxuICBcImxzaW1lXCI6XCJcXHUyQThEXCIsXG4gIFwibHNpbWdcIjpcIlxcdTJBOEZcIixcbiAgXCJsc3FiXCI6XCJcXHUwMDVCXCIsXG4gIFwibHNxdW9cIjpcIlxcdTIwMThcIixcbiAgXCJsc3F1b3JcIjpcIlxcdTIwMUFcIixcbiAgXCJMc3Ryb2tcIjpcIlxcdTAxNDFcIixcbiAgXCJsc3Ryb2tcIjpcIlxcdTAxNDJcIixcbiAgXCJMVFwiOlwiXFx1MDAzQ1wiLFxuICBcIkx0XCI6XCJcXHUyMjZBXCIsXG4gIFwibHRcIjpcIlxcdTAwM0NcIixcbiAgXCJsdGNjXCI6XCJcXHUyQUE2XCIsXG4gIFwibHRjaXJcIjpcIlxcdTJBNzlcIixcbiAgXCJsdGRvdFwiOlwiXFx1MjJENlwiLFxuICBcImx0aHJlZVwiOlwiXFx1MjJDQlwiLFxuICBcImx0aW1lc1wiOlwiXFx1MjJDOVwiLFxuICBcImx0bGFyclwiOlwiXFx1Mjk3NlwiLFxuICBcImx0cXVlc3RcIjpcIlxcdTJBN0JcIixcbiAgXCJsdHJpXCI6XCJcXHUyNUMzXCIsXG4gIFwibHRyaWVcIjpcIlxcdTIyQjRcIixcbiAgXCJsdHJpZlwiOlwiXFx1MjVDMlwiLFxuICBcImx0clBhclwiOlwiXFx1Mjk5NlwiLFxuICBcImx1cmRzaGFyXCI6XCJcXHUyOTRBXCIsXG4gIFwibHVydWhhclwiOlwiXFx1Mjk2NlwiLFxuICBcImx2ZXJ0bmVxcVwiOlwiXFx1MjI2OFxcdUZFMDBcIixcbiAgXCJsdm5FXCI6XCJcXHUyMjY4XFx1RkUwMFwiLFxuICBcIm1hY3JcIjpcIlxcdTAwQUZcIixcbiAgXCJtYWxlXCI6XCJcXHUyNjQyXCIsXG4gIFwibWFsdFwiOlwiXFx1MjcyMFwiLFxuICBcIm1hbHRlc2VcIjpcIlxcdTI3MjBcIixcbiAgXCJNYXBcIjpcIlxcdTI5MDVcIixcbiAgXCJtYXBcIjpcIlxcdTIxQTZcIixcbiAgXCJtYXBzdG9cIjpcIlxcdTIxQTZcIixcbiAgXCJtYXBzdG9kb3duXCI6XCJcXHUyMUE3XCIsXG4gIFwibWFwc3RvbGVmdFwiOlwiXFx1MjFBNFwiLFxuICBcIm1hcHN0b3VwXCI6XCJcXHUyMUE1XCIsXG4gIFwibWFya2VyXCI6XCJcXHUyNUFFXCIsXG4gIFwibWNvbW1hXCI6XCJcXHUyQTI5XCIsXG4gIFwiTWN5XCI6XCJcXHUwNDFDXCIsXG4gIFwibWN5XCI6XCJcXHUwNDNDXCIsXG4gIFwibWRhc2hcIjpcIlxcdTIwMTRcIixcbiAgXCJtRERvdFwiOlwiXFx1MjIzQVwiLFxuICBcIm1lYXN1cmVkYW5nbGVcIjpcIlxcdTIyMjFcIixcbiAgXCJNZWRpdW1TcGFjZVwiOlwiXFx1MjA1RlwiLFxuICBcIk1lbGxpbnRyZlwiOlwiXFx1MjEzM1wiLFxuICBcIk1mclwiOlwiXFx1RDgzNVxcdUREMTBcIixcbiAgXCJtZnJcIjpcIlxcdUQ4MzVcXHVERDJBXCIsXG4gIFwibWhvXCI6XCJcXHUyMTI3XCIsXG4gIFwibWljcm9cIjpcIlxcdTAwQjVcIixcbiAgXCJtaWRcIjpcIlxcdTIyMjNcIixcbiAgXCJtaWRhc3RcIjpcIlxcdTAwMkFcIixcbiAgXCJtaWRjaXJcIjpcIlxcdTJBRjBcIixcbiAgXCJtaWRkb3RcIjpcIlxcdTAwQjdcIixcbiAgXCJtaW51c1wiOlwiXFx1MjIxMlwiLFxuICBcIm1pbnVzYlwiOlwiXFx1MjI5RlwiLFxuICBcIm1pbnVzZFwiOlwiXFx1MjIzOFwiLFxuICBcIm1pbnVzZHVcIjpcIlxcdTJBMkFcIixcbiAgXCJNaW51c1BsdXNcIjpcIlxcdTIyMTNcIixcbiAgXCJtbGNwXCI6XCJcXHUyQURCXCIsXG4gIFwibWxkclwiOlwiXFx1MjAyNlwiLFxuICBcIm1ucGx1c1wiOlwiXFx1MjIxM1wiLFxuICBcIm1vZGVsc1wiOlwiXFx1MjJBN1wiLFxuICBcIk1vcGZcIjpcIlxcdUQ4MzVcXHVERDQ0XCIsXG4gIFwibW9wZlwiOlwiXFx1RDgzNVxcdURENUVcIixcbiAgXCJtcFwiOlwiXFx1MjIxM1wiLFxuICBcIk1zY3JcIjpcIlxcdTIxMzNcIixcbiAgXCJtc2NyXCI6XCJcXHVEODM1XFx1RENDMlwiLFxuICBcIm1zdHBvc1wiOlwiXFx1MjIzRVwiLFxuICBcIk11XCI6XCJcXHUwMzlDXCIsXG4gIFwibXVcIjpcIlxcdTAzQkNcIixcbiAgXCJtdWx0aW1hcFwiOlwiXFx1MjJCOFwiLFxuICBcIm11bWFwXCI6XCJcXHUyMkI4XCIsXG4gIFwibmFibGFcIjpcIlxcdTIyMDdcIixcbiAgXCJOYWN1dGVcIjpcIlxcdTAxNDNcIixcbiAgXCJuYWN1dGVcIjpcIlxcdTAxNDRcIixcbiAgXCJuYW5nXCI6XCJcXHUyMjIwXFx1MjBEMlwiLFxuICBcIm5hcFwiOlwiXFx1MjI0OVwiLFxuICBcIm5hcEVcIjpcIlxcdTJBNzBcXHUwMzM4XCIsXG4gIFwibmFwaWRcIjpcIlxcdTIyNEJcXHUwMzM4XCIsXG4gIFwibmFwb3NcIjpcIlxcdTAxNDlcIixcbiAgXCJuYXBwcm94XCI6XCJcXHUyMjQ5XCIsXG4gIFwibmF0dXJcIjpcIlxcdTI2NkVcIixcbiAgXCJuYXR1cmFsXCI6XCJcXHUyNjZFXCIsXG4gIFwibmF0dXJhbHNcIjpcIlxcdTIxMTVcIixcbiAgXCJuYnNwXCI6XCJcXHUwMEEwXCIsXG4gIFwibmJ1bXBcIjpcIlxcdTIyNEVcXHUwMzM4XCIsXG4gIFwibmJ1bXBlXCI6XCJcXHUyMjRGXFx1MDMzOFwiLFxuICBcIm5jYXBcIjpcIlxcdTJBNDNcIixcbiAgXCJOY2Fyb25cIjpcIlxcdTAxNDdcIixcbiAgXCJuY2Fyb25cIjpcIlxcdTAxNDhcIixcbiAgXCJOY2VkaWxcIjpcIlxcdTAxNDVcIixcbiAgXCJuY2VkaWxcIjpcIlxcdTAxNDZcIixcbiAgXCJuY29uZ1wiOlwiXFx1MjI0N1wiLFxuICBcIm5jb25nZG90XCI6XCJcXHUyQTZEXFx1MDMzOFwiLFxuICBcIm5jdXBcIjpcIlxcdTJBNDJcIixcbiAgXCJOY3lcIjpcIlxcdTA0MURcIixcbiAgXCJuY3lcIjpcIlxcdTA0M0RcIixcbiAgXCJuZGFzaFwiOlwiXFx1MjAxM1wiLFxuICBcIm5lXCI6XCJcXHUyMjYwXCIsXG4gIFwibmVhcmhrXCI6XCJcXHUyOTI0XCIsXG4gIFwibmVBcnJcIjpcIlxcdTIxRDdcIixcbiAgXCJuZWFyclwiOlwiXFx1MjE5N1wiLFxuICBcIm5lYXJyb3dcIjpcIlxcdTIxOTdcIixcbiAgXCJuZWRvdFwiOlwiXFx1MjI1MFxcdTAzMzhcIixcbiAgXCJOZWdhdGl2ZU1lZGl1bVNwYWNlXCI6XCJcXHUyMDBCXCIsXG4gIFwiTmVnYXRpdmVUaGlja1NwYWNlXCI6XCJcXHUyMDBCXCIsXG4gIFwiTmVnYXRpdmVUaGluU3BhY2VcIjpcIlxcdTIwMEJcIixcbiAgXCJOZWdhdGl2ZVZlcnlUaGluU3BhY2VcIjpcIlxcdTIwMEJcIixcbiAgXCJuZXF1aXZcIjpcIlxcdTIyNjJcIixcbiAgXCJuZXNlYXJcIjpcIlxcdTI5MjhcIixcbiAgXCJuZXNpbVwiOlwiXFx1MjI0MlxcdTAzMzhcIixcbiAgXCJOZXN0ZWRHcmVhdGVyR3JlYXRlclwiOlwiXFx1MjI2QlwiLFxuICBcIk5lc3RlZExlc3NMZXNzXCI6XCJcXHUyMjZBXCIsXG4gIFwiTmV3TGluZVwiOlwiXFx1MDAwQVwiLFxuICBcIm5leGlzdFwiOlwiXFx1MjIwNFwiLFxuICBcIm5leGlzdHNcIjpcIlxcdTIyMDRcIixcbiAgXCJOZnJcIjpcIlxcdUQ4MzVcXHVERDExXCIsXG4gIFwibmZyXCI6XCJcXHVEODM1XFx1REQyQlwiLFxuICBcIm5nRVwiOlwiXFx1MjI2N1xcdTAzMzhcIixcbiAgXCJuZ2VcIjpcIlxcdTIyNzFcIixcbiAgXCJuZ2VxXCI6XCJcXHUyMjcxXCIsXG4gIFwibmdlcXFcIjpcIlxcdTIyNjdcXHUwMzM4XCIsXG4gIFwibmdlcXNsYW50XCI6XCJcXHUyQTdFXFx1MDMzOFwiLFxuICBcIm5nZXNcIjpcIlxcdTJBN0VcXHUwMzM4XCIsXG4gIFwibkdnXCI6XCJcXHUyMkQ5XFx1MDMzOFwiLFxuICBcIm5nc2ltXCI6XCJcXHUyMjc1XCIsXG4gIFwibkd0XCI6XCJcXHUyMjZCXFx1MjBEMlwiLFxuICBcIm5ndFwiOlwiXFx1MjI2RlwiLFxuICBcIm5ndHJcIjpcIlxcdTIyNkZcIixcbiAgXCJuR3R2XCI6XCJcXHUyMjZCXFx1MDMzOFwiLFxuICBcIm5oQXJyXCI6XCJcXHUyMUNFXCIsXG4gIFwibmhhcnJcIjpcIlxcdTIxQUVcIixcbiAgXCJuaHBhclwiOlwiXFx1MkFGMlwiLFxuICBcIm5pXCI6XCJcXHUyMjBCXCIsXG4gIFwibmlzXCI6XCJcXHUyMkZDXCIsXG4gIFwibmlzZFwiOlwiXFx1MjJGQVwiLFxuICBcIm5pdlwiOlwiXFx1MjIwQlwiLFxuICBcIk5KY3lcIjpcIlxcdTA0MEFcIixcbiAgXCJuamN5XCI6XCJcXHUwNDVBXCIsXG4gIFwibmxBcnJcIjpcIlxcdTIxQ0RcIixcbiAgXCJubGFyclwiOlwiXFx1MjE5QVwiLFxuICBcIm5sZHJcIjpcIlxcdTIwMjVcIixcbiAgXCJubEVcIjpcIlxcdTIyNjZcXHUwMzM4XCIsXG4gIFwibmxlXCI6XCJcXHUyMjcwXCIsXG4gIFwibkxlZnRhcnJvd1wiOlwiXFx1MjFDRFwiLFxuICBcIm5sZWZ0YXJyb3dcIjpcIlxcdTIxOUFcIixcbiAgXCJuTGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTIxQ0VcIixcbiAgXCJubGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTIxQUVcIixcbiAgXCJubGVxXCI6XCJcXHUyMjcwXCIsXG4gIFwibmxlcXFcIjpcIlxcdTIyNjZcXHUwMzM4XCIsXG4gIFwibmxlcXNsYW50XCI6XCJcXHUyQTdEXFx1MDMzOFwiLFxuICBcIm5sZXNcIjpcIlxcdTJBN0RcXHUwMzM4XCIsXG4gIFwibmxlc3NcIjpcIlxcdTIyNkVcIixcbiAgXCJuTGxcIjpcIlxcdTIyRDhcXHUwMzM4XCIsXG4gIFwibmxzaW1cIjpcIlxcdTIyNzRcIixcbiAgXCJuTHRcIjpcIlxcdTIyNkFcXHUyMEQyXCIsXG4gIFwibmx0XCI6XCJcXHUyMjZFXCIsXG4gIFwibmx0cmlcIjpcIlxcdTIyRUFcIixcbiAgXCJubHRyaWVcIjpcIlxcdTIyRUNcIixcbiAgXCJuTHR2XCI6XCJcXHUyMjZBXFx1MDMzOFwiLFxuICBcIm5taWRcIjpcIlxcdTIyMjRcIixcbiAgXCJOb0JyZWFrXCI6XCJcXHUyMDYwXCIsXG4gIFwiTm9uQnJlYWtpbmdTcGFjZVwiOlwiXFx1MDBBMFwiLFxuICBcIk5vcGZcIjpcIlxcdTIxMTVcIixcbiAgXCJub3BmXCI6XCJcXHVEODM1XFx1REQ1RlwiLFxuICBcIk5vdFwiOlwiXFx1MkFFQ1wiLFxuICBcIm5vdFwiOlwiXFx1MDBBQ1wiLFxuICBcIk5vdENvbmdydWVudFwiOlwiXFx1MjI2MlwiLFxuICBcIk5vdEN1cENhcFwiOlwiXFx1MjI2RFwiLFxuICBcIk5vdERvdWJsZVZlcnRpY2FsQmFyXCI6XCJcXHUyMjI2XCIsXG4gIFwiTm90RWxlbWVudFwiOlwiXFx1MjIwOVwiLFxuICBcIk5vdEVxdWFsXCI6XCJcXHUyMjYwXCIsXG4gIFwiTm90RXF1YWxUaWxkZVwiOlwiXFx1MjI0MlxcdTAzMzhcIixcbiAgXCJOb3RFeGlzdHNcIjpcIlxcdTIyMDRcIixcbiAgXCJOb3RHcmVhdGVyXCI6XCJcXHUyMjZGXCIsXG4gIFwiTm90R3JlYXRlckVxdWFsXCI6XCJcXHUyMjcxXCIsXG4gIFwiTm90R3JlYXRlckZ1bGxFcXVhbFwiOlwiXFx1MjI2N1xcdTAzMzhcIixcbiAgXCJOb3RHcmVhdGVyR3JlYXRlclwiOlwiXFx1MjI2QlxcdTAzMzhcIixcbiAgXCJOb3RHcmVhdGVyTGVzc1wiOlwiXFx1MjI3OVwiLFxuICBcIk5vdEdyZWF0ZXJTbGFudEVxdWFsXCI6XCJcXHUyQTdFXFx1MDMzOFwiLFxuICBcIk5vdEdyZWF0ZXJUaWxkZVwiOlwiXFx1MjI3NVwiLFxuICBcIk5vdEh1bXBEb3duSHVtcFwiOlwiXFx1MjI0RVxcdTAzMzhcIixcbiAgXCJOb3RIdW1wRXF1YWxcIjpcIlxcdTIyNEZcXHUwMzM4XCIsXG4gIFwibm90aW5cIjpcIlxcdTIyMDlcIixcbiAgXCJub3RpbmRvdFwiOlwiXFx1MjJGNVxcdTAzMzhcIixcbiAgXCJub3RpbkVcIjpcIlxcdTIyRjlcXHUwMzM4XCIsXG4gIFwibm90aW52YVwiOlwiXFx1MjIwOVwiLFxuICBcIm5vdGludmJcIjpcIlxcdTIyRjdcIixcbiAgXCJub3RpbnZjXCI6XCJcXHUyMkY2XCIsXG4gIFwiTm90TGVmdFRyaWFuZ2xlXCI6XCJcXHUyMkVBXCIsXG4gIFwiTm90TGVmdFRyaWFuZ2xlQmFyXCI6XCJcXHUyOUNGXFx1MDMzOFwiLFxuICBcIk5vdExlZnRUcmlhbmdsZUVxdWFsXCI6XCJcXHUyMkVDXCIsXG4gIFwiTm90TGVzc1wiOlwiXFx1MjI2RVwiLFxuICBcIk5vdExlc3NFcXVhbFwiOlwiXFx1MjI3MFwiLFxuICBcIk5vdExlc3NHcmVhdGVyXCI6XCJcXHUyMjc4XCIsXG4gIFwiTm90TGVzc0xlc3NcIjpcIlxcdTIyNkFcXHUwMzM4XCIsXG4gIFwiTm90TGVzc1NsYW50RXF1YWxcIjpcIlxcdTJBN0RcXHUwMzM4XCIsXG4gIFwiTm90TGVzc1RpbGRlXCI6XCJcXHUyMjc0XCIsXG4gIFwiTm90TmVzdGVkR3JlYXRlckdyZWF0ZXJcIjpcIlxcdTJBQTJcXHUwMzM4XCIsXG4gIFwiTm90TmVzdGVkTGVzc0xlc3NcIjpcIlxcdTJBQTFcXHUwMzM4XCIsXG4gIFwibm90bmlcIjpcIlxcdTIyMENcIixcbiAgXCJub3RuaXZhXCI6XCJcXHUyMjBDXCIsXG4gIFwibm90bml2YlwiOlwiXFx1MjJGRVwiLFxuICBcIm5vdG5pdmNcIjpcIlxcdTIyRkRcIixcbiAgXCJOb3RQcmVjZWRlc1wiOlwiXFx1MjI4MFwiLFxuICBcIk5vdFByZWNlZGVzRXF1YWxcIjpcIlxcdTJBQUZcXHUwMzM4XCIsXG4gIFwiTm90UHJlY2VkZXNTbGFudEVxdWFsXCI6XCJcXHUyMkUwXCIsXG4gIFwiTm90UmV2ZXJzZUVsZW1lbnRcIjpcIlxcdTIyMENcIixcbiAgXCJOb3RSaWdodFRyaWFuZ2xlXCI6XCJcXHUyMkVCXCIsXG4gIFwiTm90UmlnaHRUcmlhbmdsZUJhclwiOlwiXFx1MjlEMFxcdTAzMzhcIixcbiAgXCJOb3RSaWdodFRyaWFuZ2xlRXF1YWxcIjpcIlxcdTIyRURcIixcbiAgXCJOb3RTcXVhcmVTdWJzZXRcIjpcIlxcdTIyOEZcXHUwMzM4XCIsXG4gIFwiTm90U3F1YXJlU3Vic2V0RXF1YWxcIjpcIlxcdTIyRTJcIixcbiAgXCJOb3RTcXVhcmVTdXBlcnNldFwiOlwiXFx1MjI5MFxcdTAzMzhcIixcbiAgXCJOb3RTcXVhcmVTdXBlcnNldEVxdWFsXCI6XCJcXHUyMkUzXCIsXG4gIFwiTm90U3Vic2V0XCI6XCJcXHUyMjgyXFx1MjBEMlwiLFxuICBcIk5vdFN1YnNldEVxdWFsXCI6XCJcXHUyMjg4XCIsXG4gIFwiTm90U3VjY2VlZHNcIjpcIlxcdTIyODFcIixcbiAgXCJOb3RTdWNjZWVkc0VxdWFsXCI6XCJcXHUyQUIwXFx1MDMzOFwiLFxuICBcIk5vdFN1Y2NlZWRzU2xhbnRFcXVhbFwiOlwiXFx1MjJFMVwiLFxuICBcIk5vdFN1Y2NlZWRzVGlsZGVcIjpcIlxcdTIyN0ZcXHUwMzM4XCIsXG4gIFwiTm90U3VwZXJzZXRcIjpcIlxcdTIyODNcXHUyMEQyXCIsXG4gIFwiTm90U3VwZXJzZXRFcXVhbFwiOlwiXFx1MjI4OVwiLFxuICBcIk5vdFRpbGRlXCI6XCJcXHUyMjQxXCIsXG4gIFwiTm90VGlsZGVFcXVhbFwiOlwiXFx1MjI0NFwiLFxuICBcIk5vdFRpbGRlRnVsbEVxdWFsXCI6XCJcXHUyMjQ3XCIsXG4gIFwiTm90VGlsZGVUaWxkZVwiOlwiXFx1MjI0OVwiLFxuICBcIk5vdFZlcnRpY2FsQmFyXCI6XCJcXHUyMjI0XCIsXG4gIFwibnBhclwiOlwiXFx1MjIyNlwiLFxuICBcIm5wYXJhbGxlbFwiOlwiXFx1MjIyNlwiLFxuICBcIm5wYXJzbFwiOlwiXFx1MkFGRFxcdTIwRTVcIixcbiAgXCJucGFydFwiOlwiXFx1MjIwMlxcdTAzMzhcIixcbiAgXCJucG9saW50XCI6XCJcXHUyQTE0XCIsXG4gIFwibnByXCI6XCJcXHUyMjgwXCIsXG4gIFwibnByY3VlXCI6XCJcXHUyMkUwXCIsXG4gIFwibnByZVwiOlwiXFx1MkFBRlxcdTAzMzhcIixcbiAgXCJucHJlY1wiOlwiXFx1MjI4MFwiLFxuICBcIm5wcmVjZXFcIjpcIlxcdTJBQUZcXHUwMzM4XCIsXG4gIFwibnJBcnJcIjpcIlxcdTIxQ0ZcIixcbiAgXCJucmFyclwiOlwiXFx1MjE5QlwiLFxuICBcIm5yYXJyY1wiOlwiXFx1MjkzM1xcdTAzMzhcIixcbiAgXCJucmFycndcIjpcIlxcdTIxOURcXHUwMzM4XCIsXG4gIFwiblJpZ2h0YXJyb3dcIjpcIlxcdTIxQ0ZcIixcbiAgXCJucmlnaHRhcnJvd1wiOlwiXFx1MjE5QlwiLFxuICBcIm5ydHJpXCI6XCJcXHUyMkVCXCIsXG4gIFwibnJ0cmllXCI6XCJcXHUyMkVEXCIsXG4gIFwibnNjXCI6XCJcXHUyMjgxXCIsXG4gIFwibnNjY3VlXCI6XCJcXHUyMkUxXCIsXG4gIFwibnNjZVwiOlwiXFx1MkFCMFxcdTAzMzhcIixcbiAgXCJOc2NyXCI6XCJcXHVEODM1XFx1RENBOVwiLFxuICBcIm5zY3JcIjpcIlxcdUQ4MzVcXHVEQ0MzXCIsXG4gIFwibnNob3J0bWlkXCI6XCJcXHUyMjI0XCIsXG4gIFwibnNob3J0cGFyYWxsZWxcIjpcIlxcdTIyMjZcIixcbiAgXCJuc2ltXCI6XCJcXHUyMjQxXCIsXG4gIFwibnNpbWVcIjpcIlxcdTIyNDRcIixcbiAgXCJuc2ltZXFcIjpcIlxcdTIyNDRcIixcbiAgXCJuc21pZFwiOlwiXFx1MjIyNFwiLFxuICBcIm5zcGFyXCI6XCJcXHUyMjI2XCIsXG4gIFwibnNxc3ViZVwiOlwiXFx1MjJFMlwiLFxuICBcIm5zcXN1cGVcIjpcIlxcdTIyRTNcIixcbiAgXCJuc3ViXCI6XCJcXHUyMjg0XCIsXG4gIFwibnN1YkVcIjpcIlxcdTJBQzVcXHUwMzM4XCIsXG4gIFwibnN1YmVcIjpcIlxcdTIyODhcIixcbiAgXCJuc3Vic2V0XCI6XCJcXHUyMjgyXFx1MjBEMlwiLFxuICBcIm5zdWJzZXRlcVwiOlwiXFx1MjI4OFwiLFxuICBcIm5zdWJzZXRlcXFcIjpcIlxcdTJBQzVcXHUwMzM4XCIsXG4gIFwibnN1Y2NcIjpcIlxcdTIyODFcIixcbiAgXCJuc3VjY2VxXCI6XCJcXHUyQUIwXFx1MDMzOFwiLFxuICBcIm5zdXBcIjpcIlxcdTIyODVcIixcbiAgXCJuc3VwRVwiOlwiXFx1MkFDNlxcdTAzMzhcIixcbiAgXCJuc3VwZVwiOlwiXFx1MjI4OVwiLFxuICBcIm5zdXBzZXRcIjpcIlxcdTIyODNcXHUyMEQyXCIsXG4gIFwibnN1cHNldGVxXCI6XCJcXHUyMjg5XCIsXG4gIFwibnN1cHNldGVxcVwiOlwiXFx1MkFDNlxcdTAzMzhcIixcbiAgXCJudGdsXCI6XCJcXHUyMjc5XCIsXG4gIFwiTnRpbGRlXCI6XCJcXHUwMEQxXCIsXG4gIFwibnRpbGRlXCI6XCJcXHUwMEYxXCIsXG4gIFwibnRsZ1wiOlwiXFx1MjI3OFwiLFxuICBcIm50cmlhbmdsZWxlZnRcIjpcIlxcdTIyRUFcIixcbiAgXCJudHJpYW5nbGVsZWZ0ZXFcIjpcIlxcdTIyRUNcIixcbiAgXCJudHJpYW5nbGVyaWdodFwiOlwiXFx1MjJFQlwiLFxuICBcIm50cmlhbmdsZXJpZ2h0ZXFcIjpcIlxcdTIyRURcIixcbiAgXCJOdVwiOlwiXFx1MDM5RFwiLFxuICBcIm51XCI6XCJcXHUwM0JEXCIsXG4gIFwibnVtXCI6XCJcXHUwMDIzXCIsXG4gIFwibnVtZXJvXCI6XCJcXHUyMTE2XCIsXG4gIFwibnVtc3BcIjpcIlxcdTIwMDdcIixcbiAgXCJudmFwXCI6XCJcXHUyMjREXFx1MjBEMlwiLFxuICBcIm5WRGFzaFwiOlwiXFx1MjJBRlwiLFxuICBcIm5WZGFzaFwiOlwiXFx1MjJBRVwiLFxuICBcIm52RGFzaFwiOlwiXFx1MjJBRFwiLFxuICBcIm52ZGFzaFwiOlwiXFx1MjJBQ1wiLFxuICBcIm52Z2VcIjpcIlxcdTIyNjVcXHUyMEQyXCIsXG4gIFwibnZndFwiOlwiXFx1MDAzRVxcdTIwRDJcIixcbiAgXCJudkhhcnJcIjpcIlxcdTI5MDRcIixcbiAgXCJudmluZmluXCI6XCJcXHUyOURFXCIsXG4gIFwibnZsQXJyXCI6XCJcXHUyOTAyXCIsXG4gIFwibnZsZVwiOlwiXFx1MjI2NFxcdTIwRDJcIixcbiAgXCJudmx0XCI6XCJcXHUwMDNDXFx1MjBEMlwiLFxuICBcIm52bHRyaWVcIjpcIlxcdTIyQjRcXHUyMEQyXCIsXG4gIFwibnZyQXJyXCI6XCJcXHUyOTAzXCIsXG4gIFwibnZydHJpZVwiOlwiXFx1MjJCNVxcdTIwRDJcIixcbiAgXCJudnNpbVwiOlwiXFx1MjIzQ1xcdTIwRDJcIixcbiAgXCJud2FyaGtcIjpcIlxcdTI5MjNcIixcbiAgXCJud0FyclwiOlwiXFx1MjFENlwiLFxuICBcIm53YXJyXCI6XCJcXHUyMTk2XCIsXG4gIFwibndhcnJvd1wiOlwiXFx1MjE5NlwiLFxuICBcIm53bmVhclwiOlwiXFx1MjkyN1wiLFxuICBcIk9hY3V0ZVwiOlwiXFx1MDBEM1wiLFxuICBcIm9hY3V0ZVwiOlwiXFx1MDBGM1wiLFxuICBcIm9hc3RcIjpcIlxcdTIyOUJcIixcbiAgXCJvY2lyXCI6XCJcXHUyMjlBXCIsXG4gIFwiT2NpcmNcIjpcIlxcdTAwRDRcIixcbiAgXCJvY2lyY1wiOlwiXFx1MDBGNFwiLFxuICBcIk9jeVwiOlwiXFx1MDQxRVwiLFxuICBcIm9jeVwiOlwiXFx1MDQzRVwiLFxuICBcIm9kYXNoXCI6XCJcXHUyMjlEXCIsXG4gIFwiT2RibGFjXCI6XCJcXHUwMTUwXCIsXG4gIFwib2RibGFjXCI6XCJcXHUwMTUxXCIsXG4gIFwib2RpdlwiOlwiXFx1MkEzOFwiLFxuICBcIm9kb3RcIjpcIlxcdTIyOTlcIixcbiAgXCJvZHNvbGRcIjpcIlxcdTI5QkNcIixcbiAgXCJPRWxpZ1wiOlwiXFx1MDE1MlwiLFxuICBcIm9lbGlnXCI6XCJcXHUwMTUzXCIsXG4gIFwib2ZjaXJcIjpcIlxcdTI5QkZcIixcbiAgXCJPZnJcIjpcIlxcdUQ4MzVcXHVERDEyXCIsXG4gIFwib2ZyXCI6XCJcXHVEODM1XFx1REQyQ1wiLFxuICBcIm9nb25cIjpcIlxcdTAyREJcIixcbiAgXCJPZ3JhdmVcIjpcIlxcdTAwRDJcIixcbiAgXCJvZ3JhdmVcIjpcIlxcdTAwRjJcIixcbiAgXCJvZ3RcIjpcIlxcdTI5QzFcIixcbiAgXCJvaGJhclwiOlwiXFx1MjlCNVwiLFxuICBcIm9obVwiOlwiXFx1MDNBOVwiLFxuICBcIm9pbnRcIjpcIlxcdTIyMkVcIixcbiAgXCJvbGFyclwiOlwiXFx1MjFCQVwiLFxuICBcIm9sY2lyXCI6XCJcXHUyOUJFXCIsXG4gIFwib2xjcm9zc1wiOlwiXFx1MjlCQlwiLFxuICBcIm9saW5lXCI6XCJcXHUyMDNFXCIsXG4gIFwib2x0XCI6XCJcXHUyOUMwXCIsXG4gIFwiT21hY3JcIjpcIlxcdTAxNENcIixcbiAgXCJvbWFjclwiOlwiXFx1MDE0RFwiLFxuICBcIk9tZWdhXCI6XCJcXHUwM0E5XCIsXG4gIFwib21lZ2FcIjpcIlxcdTAzQzlcIixcbiAgXCJPbWljcm9uXCI6XCJcXHUwMzlGXCIsXG4gIFwib21pY3JvblwiOlwiXFx1MDNCRlwiLFxuICBcIm9taWRcIjpcIlxcdTI5QjZcIixcbiAgXCJvbWludXNcIjpcIlxcdTIyOTZcIixcbiAgXCJPb3BmXCI6XCJcXHVEODM1XFx1REQ0NlwiLFxuICBcIm9vcGZcIjpcIlxcdUQ4MzVcXHVERDYwXCIsXG4gIFwib3BhclwiOlwiXFx1MjlCN1wiLFxuICBcIk9wZW5DdXJseURvdWJsZVF1b3RlXCI6XCJcXHUyMDFDXCIsXG4gIFwiT3BlbkN1cmx5UXVvdGVcIjpcIlxcdTIwMThcIixcbiAgXCJvcGVycFwiOlwiXFx1MjlCOVwiLFxuICBcIm9wbHVzXCI6XCJcXHUyMjk1XCIsXG4gIFwiT3JcIjpcIlxcdTJBNTRcIixcbiAgXCJvclwiOlwiXFx1MjIyOFwiLFxuICBcIm9yYXJyXCI6XCJcXHUyMUJCXCIsXG4gIFwib3JkXCI6XCJcXHUyQTVEXCIsXG4gIFwib3JkZXJcIjpcIlxcdTIxMzRcIixcbiAgXCJvcmRlcm9mXCI6XCJcXHUyMTM0XCIsXG4gIFwib3JkZlwiOlwiXFx1MDBBQVwiLFxuICBcIm9yZG1cIjpcIlxcdTAwQkFcIixcbiAgXCJvcmlnb2ZcIjpcIlxcdTIyQjZcIixcbiAgXCJvcm9yXCI6XCJcXHUyQTU2XCIsXG4gIFwib3JzbG9wZVwiOlwiXFx1MkE1N1wiLFxuICBcIm9ydlwiOlwiXFx1MkE1QlwiLFxuICBcIm9TXCI6XCJcXHUyNEM4XCIsXG4gIFwiT3NjclwiOlwiXFx1RDgzNVxcdURDQUFcIixcbiAgXCJvc2NyXCI6XCJcXHUyMTM0XCIsXG4gIFwiT3NsYXNoXCI6XCJcXHUwMEQ4XCIsXG4gIFwib3NsYXNoXCI6XCJcXHUwMEY4XCIsXG4gIFwib3NvbFwiOlwiXFx1MjI5OFwiLFxuICBcIk90aWxkZVwiOlwiXFx1MDBENVwiLFxuICBcIm90aWxkZVwiOlwiXFx1MDBGNVwiLFxuICBcIk90aW1lc1wiOlwiXFx1MkEzN1wiLFxuICBcIm90aW1lc1wiOlwiXFx1MjI5N1wiLFxuICBcIm90aW1lc2FzXCI6XCJcXHUyQTM2XCIsXG4gIFwiT3VtbFwiOlwiXFx1MDBENlwiLFxuICBcIm91bWxcIjpcIlxcdTAwRjZcIixcbiAgXCJvdmJhclwiOlwiXFx1MjMzRFwiLFxuICBcIk92ZXJCYXJcIjpcIlxcdTIwM0VcIixcbiAgXCJPdmVyQnJhY2VcIjpcIlxcdTIzREVcIixcbiAgXCJPdmVyQnJhY2tldFwiOlwiXFx1MjNCNFwiLFxuICBcIk92ZXJQYXJlbnRoZXNpc1wiOlwiXFx1MjNEQ1wiLFxuICBcInBhclwiOlwiXFx1MjIyNVwiLFxuICBcInBhcmFcIjpcIlxcdTAwQjZcIixcbiAgXCJwYXJhbGxlbFwiOlwiXFx1MjIyNVwiLFxuICBcInBhcnNpbVwiOlwiXFx1MkFGM1wiLFxuICBcInBhcnNsXCI6XCJcXHUyQUZEXCIsXG4gIFwicGFydFwiOlwiXFx1MjIwMlwiLFxuICBcIlBhcnRpYWxEXCI6XCJcXHUyMjAyXCIsXG4gIFwiUGN5XCI6XCJcXHUwNDFGXCIsXG4gIFwicGN5XCI6XCJcXHUwNDNGXCIsXG4gIFwicGVyY250XCI6XCJcXHUwMDI1XCIsXG4gIFwicGVyaW9kXCI6XCJcXHUwMDJFXCIsXG4gIFwicGVybWlsXCI6XCJcXHUyMDMwXCIsXG4gIFwicGVycFwiOlwiXFx1MjJBNVwiLFxuICBcInBlcnRlbmtcIjpcIlxcdTIwMzFcIixcbiAgXCJQZnJcIjpcIlxcdUQ4MzVcXHVERDEzXCIsXG4gIFwicGZyXCI6XCJcXHVEODM1XFx1REQyRFwiLFxuICBcIlBoaVwiOlwiXFx1MDNBNlwiLFxuICBcInBoaVwiOlwiXFx1MDNDNlwiLFxuICBcInBoaXZcIjpcIlxcdTAzRDVcIixcbiAgXCJwaG1tYXRcIjpcIlxcdTIxMzNcIixcbiAgXCJwaG9uZVwiOlwiXFx1MjYwRVwiLFxuICBcIlBpXCI6XCJcXHUwM0EwXCIsXG4gIFwicGlcIjpcIlxcdTAzQzBcIixcbiAgXCJwaXRjaGZvcmtcIjpcIlxcdTIyRDRcIixcbiAgXCJwaXZcIjpcIlxcdTAzRDZcIixcbiAgXCJwbGFuY2tcIjpcIlxcdTIxMEZcIixcbiAgXCJwbGFuY2toXCI6XCJcXHUyMTBFXCIsXG4gIFwicGxhbmt2XCI6XCJcXHUyMTBGXCIsXG4gIFwicGx1c1wiOlwiXFx1MDAyQlwiLFxuICBcInBsdXNhY2lyXCI6XCJcXHUyQTIzXCIsXG4gIFwicGx1c2JcIjpcIlxcdTIyOUVcIixcbiAgXCJwbHVzY2lyXCI6XCJcXHUyQTIyXCIsXG4gIFwicGx1c2RvXCI6XCJcXHUyMjE0XCIsXG4gIFwicGx1c2R1XCI6XCJcXHUyQTI1XCIsXG4gIFwicGx1c2VcIjpcIlxcdTJBNzJcIixcbiAgXCJQbHVzTWludXNcIjpcIlxcdTAwQjFcIixcbiAgXCJwbHVzbW5cIjpcIlxcdTAwQjFcIixcbiAgXCJwbHVzc2ltXCI6XCJcXHUyQTI2XCIsXG4gIFwicGx1c3R3b1wiOlwiXFx1MkEyN1wiLFxuICBcInBtXCI6XCJcXHUwMEIxXCIsXG4gIFwiUG9pbmNhcmVwbGFuZVwiOlwiXFx1MjEwQ1wiLFxuICBcInBvaW50aW50XCI6XCJcXHUyQTE1XCIsXG4gIFwiUG9wZlwiOlwiXFx1MjExOVwiLFxuICBcInBvcGZcIjpcIlxcdUQ4MzVcXHVERDYxXCIsXG4gIFwicG91bmRcIjpcIlxcdTAwQTNcIixcbiAgXCJQclwiOlwiXFx1MkFCQlwiLFxuICBcInByXCI6XCJcXHUyMjdBXCIsXG4gIFwicHJhcFwiOlwiXFx1MkFCN1wiLFxuICBcInByY3VlXCI6XCJcXHUyMjdDXCIsXG4gIFwicHJFXCI6XCJcXHUyQUIzXCIsXG4gIFwicHJlXCI6XCJcXHUyQUFGXCIsXG4gIFwicHJlY1wiOlwiXFx1MjI3QVwiLFxuICBcInByZWNhcHByb3hcIjpcIlxcdTJBQjdcIixcbiAgXCJwcmVjY3VybHllcVwiOlwiXFx1MjI3Q1wiLFxuICBcIlByZWNlZGVzXCI6XCJcXHUyMjdBXCIsXG4gIFwiUHJlY2VkZXNFcXVhbFwiOlwiXFx1MkFBRlwiLFxuICBcIlByZWNlZGVzU2xhbnRFcXVhbFwiOlwiXFx1MjI3Q1wiLFxuICBcIlByZWNlZGVzVGlsZGVcIjpcIlxcdTIyN0VcIixcbiAgXCJwcmVjZXFcIjpcIlxcdTJBQUZcIixcbiAgXCJwcmVjbmFwcHJveFwiOlwiXFx1MkFCOVwiLFxuICBcInByZWNuZXFxXCI6XCJcXHUyQUI1XCIsXG4gIFwicHJlY25zaW1cIjpcIlxcdTIyRThcIixcbiAgXCJwcmVjc2ltXCI6XCJcXHUyMjdFXCIsXG4gIFwiUHJpbWVcIjpcIlxcdTIwMzNcIixcbiAgXCJwcmltZVwiOlwiXFx1MjAzMlwiLFxuICBcInByaW1lc1wiOlwiXFx1MjExOVwiLFxuICBcInBybmFwXCI6XCJcXHUyQUI5XCIsXG4gIFwicHJuRVwiOlwiXFx1MkFCNVwiLFxuICBcInBybnNpbVwiOlwiXFx1MjJFOFwiLFxuICBcInByb2RcIjpcIlxcdTIyMEZcIixcbiAgXCJQcm9kdWN0XCI6XCJcXHUyMjBGXCIsXG4gIFwicHJvZmFsYXJcIjpcIlxcdTIzMkVcIixcbiAgXCJwcm9mbGluZVwiOlwiXFx1MjMxMlwiLFxuICBcInByb2ZzdXJmXCI6XCJcXHUyMzEzXCIsXG4gIFwicHJvcFwiOlwiXFx1MjIxRFwiLFxuICBcIlByb3BvcnRpb25cIjpcIlxcdTIyMzdcIixcbiAgXCJQcm9wb3J0aW9uYWxcIjpcIlxcdTIyMURcIixcbiAgXCJwcm9wdG9cIjpcIlxcdTIyMURcIixcbiAgXCJwcnNpbVwiOlwiXFx1MjI3RVwiLFxuICBcInBydXJlbFwiOlwiXFx1MjJCMFwiLFxuICBcIlBzY3JcIjpcIlxcdUQ4MzVcXHVEQ0FCXCIsXG4gIFwicHNjclwiOlwiXFx1RDgzNVxcdURDQzVcIixcbiAgXCJQc2lcIjpcIlxcdTAzQThcIixcbiAgXCJwc2lcIjpcIlxcdTAzQzhcIixcbiAgXCJwdW5jc3BcIjpcIlxcdTIwMDhcIixcbiAgXCJRZnJcIjpcIlxcdUQ4MzVcXHVERDE0XCIsXG4gIFwicWZyXCI6XCJcXHVEODM1XFx1REQyRVwiLFxuICBcInFpbnRcIjpcIlxcdTJBMENcIixcbiAgXCJRb3BmXCI6XCJcXHUyMTFBXCIsXG4gIFwicW9wZlwiOlwiXFx1RDgzNVxcdURENjJcIixcbiAgXCJxcHJpbWVcIjpcIlxcdTIwNTdcIixcbiAgXCJRc2NyXCI6XCJcXHVEODM1XFx1RENBQ1wiLFxuICBcInFzY3JcIjpcIlxcdUQ4MzVcXHVEQ0M2XCIsXG4gIFwicXVhdGVybmlvbnNcIjpcIlxcdTIxMERcIixcbiAgXCJxdWF0aW50XCI6XCJcXHUyQTE2XCIsXG4gIFwicXVlc3RcIjpcIlxcdTAwM0ZcIixcbiAgXCJxdWVzdGVxXCI6XCJcXHUyMjVGXCIsXG4gIFwiUVVPVFwiOlwiXFx1MDAyMlwiLFxuICBcInF1b3RcIjpcIlxcdTAwMjJcIixcbiAgXCJyQWFyclwiOlwiXFx1MjFEQlwiLFxuICBcInJhY2VcIjpcIlxcdTIyM0RcXHUwMzMxXCIsXG4gIFwiUmFjdXRlXCI6XCJcXHUwMTU0XCIsXG4gIFwicmFjdXRlXCI6XCJcXHUwMTU1XCIsXG4gIFwicmFkaWNcIjpcIlxcdTIyMUFcIixcbiAgXCJyYWVtcHR5dlwiOlwiXFx1MjlCM1wiLFxuICBcIlJhbmdcIjpcIlxcdTI3RUJcIixcbiAgXCJyYW5nXCI6XCJcXHUyN0U5XCIsXG4gIFwicmFuZ2RcIjpcIlxcdTI5OTJcIixcbiAgXCJyYW5nZVwiOlwiXFx1MjlBNVwiLFxuICBcInJhbmdsZVwiOlwiXFx1MjdFOVwiLFxuICBcInJhcXVvXCI6XCJcXHUwMEJCXCIsXG4gIFwiUmFyclwiOlwiXFx1MjFBMFwiLFxuICBcInJBcnJcIjpcIlxcdTIxRDJcIixcbiAgXCJyYXJyXCI6XCJcXHUyMTkyXCIsXG4gIFwicmFycmFwXCI6XCJcXHUyOTc1XCIsXG4gIFwicmFycmJcIjpcIlxcdTIxRTVcIixcbiAgXCJyYXJyYmZzXCI6XCJcXHUyOTIwXCIsXG4gIFwicmFycmNcIjpcIlxcdTI5MzNcIixcbiAgXCJyYXJyZnNcIjpcIlxcdTI5MUVcIixcbiAgXCJyYXJyaGtcIjpcIlxcdTIxQUFcIixcbiAgXCJyYXJybHBcIjpcIlxcdTIxQUNcIixcbiAgXCJyYXJycGxcIjpcIlxcdTI5NDVcIixcbiAgXCJyYXJyc2ltXCI6XCJcXHUyOTc0XCIsXG4gIFwiUmFycnRsXCI6XCJcXHUyOTE2XCIsXG4gIFwicmFycnRsXCI6XCJcXHUyMUEzXCIsXG4gIFwicmFycndcIjpcIlxcdTIxOURcIixcbiAgXCJyQXRhaWxcIjpcIlxcdTI5MUNcIixcbiAgXCJyYXRhaWxcIjpcIlxcdTI5MUFcIixcbiAgXCJyYXRpb1wiOlwiXFx1MjIzNlwiLFxuICBcInJhdGlvbmFsc1wiOlwiXFx1MjExQVwiLFxuICBcIlJCYXJyXCI6XCJcXHUyOTEwXCIsXG4gIFwickJhcnJcIjpcIlxcdTI5MEZcIixcbiAgXCJyYmFyclwiOlwiXFx1MjkwRFwiLFxuICBcInJiYnJrXCI6XCJcXHUyNzczXCIsXG4gIFwicmJyYWNlXCI6XCJcXHUwMDdEXCIsXG4gIFwicmJyYWNrXCI6XCJcXHUwMDVEXCIsXG4gIFwicmJya2VcIjpcIlxcdTI5OENcIixcbiAgXCJyYnJrc2xkXCI6XCJcXHUyOThFXCIsXG4gIFwicmJya3NsdVwiOlwiXFx1Mjk5MFwiLFxuICBcIlJjYXJvblwiOlwiXFx1MDE1OFwiLFxuICBcInJjYXJvblwiOlwiXFx1MDE1OVwiLFxuICBcIlJjZWRpbFwiOlwiXFx1MDE1NlwiLFxuICBcInJjZWRpbFwiOlwiXFx1MDE1N1wiLFxuICBcInJjZWlsXCI6XCJcXHUyMzA5XCIsXG4gIFwicmN1YlwiOlwiXFx1MDA3RFwiLFxuICBcIlJjeVwiOlwiXFx1MDQyMFwiLFxuICBcInJjeVwiOlwiXFx1MDQ0MFwiLFxuICBcInJkY2FcIjpcIlxcdTI5MzdcIixcbiAgXCJyZGxkaGFyXCI6XCJcXHUyOTY5XCIsXG4gIFwicmRxdW9cIjpcIlxcdTIwMURcIixcbiAgXCJyZHF1b3JcIjpcIlxcdTIwMURcIixcbiAgXCJyZHNoXCI6XCJcXHUyMUIzXCIsXG4gIFwiUmVcIjpcIlxcdTIxMUNcIixcbiAgXCJyZWFsXCI6XCJcXHUyMTFDXCIsXG4gIFwicmVhbGluZVwiOlwiXFx1MjExQlwiLFxuICBcInJlYWxwYXJ0XCI6XCJcXHUyMTFDXCIsXG4gIFwicmVhbHNcIjpcIlxcdTIxMURcIixcbiAgXCJyZWN0XCI6XCJcXHUyNUFEXCIsXG4gIFwiUkVHXCI6XCJcXHUwMEFFXCIsXG4gIFwicmVnXCI6XCJcXHUwMEFFXCIsXG4gIFwiUmV2ZXJzZUVsZW1lbnRcIjpcIlxcdTIyMEJcIixcbiAgXCJSZXZlcnNlRXF1aWxpYnJpdW1cIjpcIlxcdTIxQ0JcIixcbiAgXCJSZXZlcnNlVXBFcXVpbGlicml1bVwiOlwiXFx1Mjk2RlwiLFxuICBcInJmaXNodFwiOlwiXFx1Mjk3RFwiLFxuICBcInJmbG9vclwiOlwiXFx1MjMwQlwiLFxuICBcIlJmclwiOlwiXFx1MjExQ1wiLFxuICBcInJmclwiOlwiXFx1RDgzNVxcdUREMkZcIixcbiAgXCJySGFyXCI6XCJcXHUyOTY0XCIsXG4gIFwicmhhcmRcIjpcIlxcdTIxQzFcIixcbiAgXCJyaGFydVwiOlwiXFx1MjFDMFwiLFxuICBcInJoYXJ1bFwiOlwiXFx1Mjk2Q1wiLFxuICBcIlJob1wiOlwiXFx1MDNBMVwiLFxuICBcInJob1wiOlwiXFx1MDNDMVwiLFxuICBcInJob3ZcIjpcIlxcdTAzRjFcIixcbiAgXCJSaWdodEFuZ2xlQnJhY2tldFwiOlwiXFx1MjdFOVwiLFxuICBcIlJpZ2h0QXJyb3dcIjpcIlxcdTIxOTJcIixcbiAgXCJSaWdodGFycm93XCI6XCJcXHUyMUQyXCIsXG4gIFwicmlnaHRhcnJvd1wiOlwiXFx1MjE5MlwiLFxuICBcIlJpZ2h0QXJyb3dCYXJcIjpcIlxcdTIxRTVcIixcbiAgXCJSaWdodEFycm93TGVmdEFycm93XCI6XCJcXHUyMUM0XCIsXG4gIFwicmlnaHRhcnJvd3RhaWxcIjpcIlxcdTIxQTNcIixcbiAgXCJSaWdodENlaWxpbmdcIjpcIlxcdTIzMDlcIixcbiAgXCJSaWdodERvdWJsZUJyYWNrZXRcIjpcIlxcdTI3RTdcIixcbiAgXCJSaWdodERvd25UZWVWZWN0b3JcIjpcIlxcdTI5NURcIixcbiAgXCJSaWdodERvd25WZWN0b3JcIjpcIlxcdTIxQzJcIixcbiAgXCJSaWdodERvd25WZWN0b3JCYXJcIjpcIlxcdTI5NTVcIixcbiAgXCJSaWdodEZsb29yXCI6XCJcXHUyMzBCXCIsXG4gIFwicmlnaHRoYXJwb29uZG93blwiOlwiXFx1MjFDMVwiLFxuICBcInJpZ2h0aGFycG9vbnVwXCI6XCJcXHUyMUMwXCIsXG4gIFwicmlnaHRsZWZ0YXJyb3dzXCI6XCJcXHUyMUM0XCIsXG4gIFwicmlnaHRsZWZ0aGFycG9vbnNcIjpcIlxcdTIxQ0NcIixcbiAgXCJyaWdodHJpZ2h0YXJyb3dzXCI6XCJcXHUyMUM5XCIsXG4gIFwicmlnaHRzcXVpZ2Fycm93XCI6XCJcXHUyMTlEXCIsXG4gIFwiUmlnaHRUZWVcIjpcIlxcdTIyQTJcIixcbiAgXCJSaWdodFRlZUFycm93XCI6XCJcXHUyMUE2XCIsXG4gIFwiUmlnaHRUZWVWZWN0b3JcIjpcIlxcdTI5NUJcIixcbiAgXCJyaWdodHRocmVldGltZXNcIjpcIlxcdTIyQ0NcIixcbiAgXCJSaWdodFRyaWFuZ2xlXCI6XCJcXHUyMkIzXCIsXG4gIFwiUmlnaHRUcmlhbmdsZUJhclwiOlwiXFx1MjlEMFwiLFxuICBcIlJpZ2h0VHJpYW5nbGVFcXVhbFwiOlwiXFx1MjJCNVwiLFxuICBcIlJpZ2h0VXBEb3duVmVjdG9yXCI6XCJcXHUyOTRGXCIsXG4gIFwiUmlnaHRVcFRlZVZlY3RvclwiOlwiXFx1Mjk1Q1wiLFxuICBcIlJpZ2h0VXBWZWN0b3JcIjpcIlxcdTIxQkVcIixcbiAgXCJSaWdodFVwVmVjdG9yQmFyXCI6XCJcXHUyOTU0XCIsXG4gIFwiUmlnaHRWZWN0b3JcIjpcIlxcdTIxQzBcIixcbiAgXCJSaWdodFZlY3RvckJhclwiOlwiXFx1Mjk1M1wiLFxuICBcInJpbmdcIjpcIlxcdTAyREFcIixcbiAgXCJyaXNpbmdkb3RzZXFcIjpcIlxcdTIyNTNcIixcbiAgXCJybGFyclwiOlwiXFx1MjFDNFwiLFxuICBcInJsaGFyXCI6XCJcXHUyMUNDXCIsXG4gIFwicmxtXCI6XCJcXHUyMDBGXCIsXG4gIFwicm1vdXN0XCI6XCJcXHUyM0IxXCIsXG4gIFwicm1vdXN0YWNoZVwiOlwiXFx1MjNCMVwiLFxuICBcInJubWlkXCI6XCJcXHUyQUVFXCIsXG4gIFwicm9hbmdcIjpcIlxcdTI3RURcIixcbiAgXCJyb2FyclwiOlwiXFx1MjFGRVwiLFxuICBcInJvYnJrXCI6XCJcXHUyN0U3XCIsXG4gIFwicm9wYXJcIjpcIlxcdTI5ODZcIixcbiAgXCJSb3BmXCI6XCJcXHUyMTFEXCIsXG4gIFwicm9wZlwiOlwiXFx1RDgzNVxcdURENjNcIixcbiAgXCJyb3BsdXNcIjpcIlxcdTJBMkVcIixcbiAgXCJyb3RpbWVzXCI6XCJcXHUyQTM1XCIsXG4gIFwiUm91bmRJbXBsaWVzXCI6XCJcXHUyOTcwXCIsXG4gIFwicnBhclwiOlwiXFx1MDAyOVwiLFxuICBcInJwYXJndFwiOlwiXFx1Mjk5NFwiLFxuICBcInJwcG9saW50XCI6XCJcXHUyQTEyXCIsXG4gIFwicnJhcnJcIjpcIlxcdTIxQzlcIixcbiAgXCJScmlnaHRhcnJvd1wiOlwiXFx1MjFEQlwiLFxuICBcInJzYXF1b1wiOlwiXFx1MjAzQVwiLFxuICBcIlJzY3JcIjpcIlxcdTIxMUJcIixcbiAgXCJyc2NyXCI6XCJcXHVEODM1XFx1RENDN1wiLFxuICBcIlJzaFwiOlwiXFx1MjFCMVwiLFxuICBcInJzaFwiOlwiXFx1MjFCMVwiLFxuICBcInJzcWJcIjpcIlxcdTAwNURcIixcbiAgXCJyc3F1b1wiOlwiXFx1MjAxOVwiLFxuICBcInJzcXVvclwiOlwiXFx1MjAxOVwiLFxuICBcInJ0aHJlZVwiOlwiXFx1MjJDQ1wiLFxuICBcInJ0aW1lc1wiOlwiXFx1MjJDQVwiLFxuICBcInJ0cmlcIjpcIlxcdTI1QjlcIixcbiAgXCJydHJpZVwiOlwiXFx1MjJCNVwiLFxuICBcInJ0cmlmXCI6XCJcXHUyNUI4XCIsXG4gIFwicnRyaWx0cmlcIjpcIlxcdTI5Q0VcIixcbiAgXCJSdWxlRGVsYXllZFwiOlwiXFx1MjlGNFwiLFxuICBcInJ1bHVoYXJcIjpcIlxcdTI5NjhcIixcbiAgXCJyeFwiOlwiXFx1MjExRVwiLFxuICBcIlNhY3V0ZVwiOlwiXFx1MDE1QVwiLFxuICBcInNhY3V0ZVwiOlwiXFx1MDE1QlwiLFxuICBcInNicXVvXCI6XCJcXHUyMDFBXCIsXG4gIFwiU2NcIjpcIlxcdTJBQkNcIixcbiAgXCJzY1wiOlwiXFx1MjI3QlwiLFxuICBcInNjYXBcIjpcIlxcdTJBQjhcIixcbiAgXCJTY2Fyb25cIjpcIlxcdTAxNjBcIixcbiAgXCJzY2Fyb25cIjpcIlxcdTAxNjFcIixcbiAgXCJzY2N1ZVwiOlwiXFx1MjI3RFwiLFxuICBcInNjRVwiOlwiXFx1MkFCNFwiLFxuICBcInNjZVwiOlwiXFx1MkFCMFwiLFxuICBcIlNjZWRpbFwiOlwiXFx1MDE1RVwiLFxuICBcInNjZWRpbFwiOlwiXFx1MDE1RlwiLFxuICBcIlNjaXJjXCI6XCJcXHUwMTVDXCIsXG4gIFwic2NpcmNcIjpcIlxcdTAxNURcIixcbiAgXCJzY25hcFwiOlwiXFx1MkFCQVwiLFxuICBcInNjbkVcIjpcIlxcdTJBQjZcIixcbiAgXCJzY25zaW1cIjpcIlxcdTIyRTlcIixcbiAgXCJzY3BvbGludFwiOlwiXFx1MkExM1wiLFxuICBcInNjc2ltXCI6XCJcXHUyMjdGXCIsXG4gIFwiU2N5XCI6XCJcXHUwNDIxXCIsXG4gIFwic2N5XCI6XCJcXHUwNDQxXCIsXG4gIFwic2RvdFwiOlwiXFx1MjJDNVwiLFxuICBcInNkb3RiXCI6XCJcXHUyMkExXCIsXG4gIFwic2RvdGVcIjpcIlxcdTJBNjZcIixcbiAgXCJzZWFyaGtcIjpcIlxcdTI5MjVcIixcbiAgXCJzZUFyclwiOlwiXFx1MjFEOFwiLFxuICBcInNlYXJyXCI6XCJcXHUyMTk4XCIsXG4gIFwic2VhcnJvd1wiOlwiXFx1MjE5OFwiLFxuICBcInNlY3RcIjpcIlxcdTAwQTdcIixcbiAgXCJzZW1pXCI6XCJcXHUwMDNCXCIsXG4gIFwic2Vzd2FyXCI6XCJcXHUyOTI5XCIsXG4gIFwic2V0bWludXNcIjpcIlxcdTIyMTZcIixcbiAgXCJzZXRtblwiOlwiXFx1MjIxNlwiLFxuICBcInNleHRcIjpcIlxcdTI3MzZcIixcbiAgXCJTZnJcIjpcIlxcdUQ4MzVcXHVERDE2XCIsXG4gIFwic2ZyXCI6XCJcXHVEODM1XFx1REQzMFwiLFxuICBcInNmcm93blwiOlwiXFx1MjMyMlwiLFxuICBcInNoYXJwXCI6XCJcXHUyNjZGXCIsXG4gIFwiU0hDSGN5XCI6XCJcXHUwNDI5XCIsXG4gIFwic2hjaGN5XCI6XCJcXHUwNDQ5XCIsXG4gIFwiU0hjeVwiOlwiXFx1MDQyOFwiLFxuICBcInNoY3lcIjpcIlxcdTA0NDhcIixcbiAgXCJTaG9ydERvd25BcnJvd1wiOlwiXFx1MjE5M1wiLFxuICBcIlNob3J0TGVmdEFycm93XCI6XCJcXHUyMTkwXCIsXG4gIFwic2hvcnRtaWRcIjpcIlxcdTIyMjNcIixcbiAgXCJzaG9ydHBhcmFsbGVsXCI6XCJcXHUyMjI1XCIsXG4gIFwiU2hvcnRSaWdodEFycm93XCI6XCJcXHUyMTkyXCIsXG4gIFwiU2hvcnRVcEFycm93XCI6XCJcXHUyMTkxXCIsXG4gIFwic2h5XCI6XCJcXHUwMEFEXCIsXG4gIFwiU2lnbWFcIjpcIlxcdTAzQTNcIixcbiAgXCJzaWdtYVwiOlwiXFx1MDNDM1wiLFxuICBcInNpZ21hZlwiOlwiXFx1MDNDMlwiLFxuICBcInNpZ21hdlwiOlwiXFx1MDNDMlwiLFxuICBcInNpbVwiOlwiXFx1MjIzQ1wiLFxuICBcInNpbWRvdFwiOlwiXFx1MkE2QVwiLFxuICBcInNpbWVcIjpcIlxcdTIyNDNcIixcbiAgXCJzaW1lcVwiOlwiXFx1MjI0M1wiLFxuICBcInNpbWdcIjpcIlxcdTJBOUVcIixcbiAgXCJzaW1nRVwiOlwiXFx1MkFBMFwiLFxuICBcInNpbWxcIjpcIlxcdTJBOURcIixcbiAgXCJzaW1sRVwiOlwiXFx1MkE5RlwiLFxuICBcInNpbW5lXCI6XCJcXHUyMjQ2XCIsXG4gIFwic2ltcGx1c1wiOlwiXFx1MkEyNFwiLFxuICBcInNpbXJhcnJcIjpcIlxcdTI5NzJcIixcbiAgXCJzbGFyclwiOlwiXFx1MjE5MFwiLFxuICBcIlNtYWxsQ2lyY2xlXCI6XCJcXHUyMjE4XCIsXG4gIFwic21hbGxzZXRtaW51c1wiOlwiXFx1MjIxNlwiLFxuICBcInNtYXNocFwiOlwiXFx1MkEzM1wiLFxuICBcInNtZXBhcnNsXCI6XCJcXHUyOUU0XCIsXG4gIFwic21pZFwiOlwiXFx1MjIyM1wiLFxuICBcInNtaWxlXCI6XCJcXHUyMzIzXCIsXG4gIFwic210XCI6XCJcXHUyQUFBXCIsXG4gIFwic210ZVwiOlwiXFx1MkFBQ1wiLFxuICBcInNtdGVzXCI6XCJcXHUyQUFDXFx1RkUwMFwiLFxuICBcIlNPRlRjeVwiOlwiXFx1MDQyQ1wiLFxuICBcInNvZnRjeVwiOlwiXFx1MDQ0Q1wiLFxuICBcInNvbFwiOlwiXFx1MDAyRlwiLFxuICBcInNvbGJcIjpcIlxcdTI5QzRcIixcbiAgXCJzb2xiYXJcIjpcIlxcdTIzM0ZcIixcbiAgXCJTb3BmXCI6XCJcXHVEODM1XFx1REQ0QVwiLFxuICBcInNvcGZcIjpcIlxcdUQ4MzVcXHVERDY0XCIsXG4gIFwic3BhZGVzXCI6XCJcXHUyNjYwXCIsXG4gIFwic3BhZGVzdWl0XCI6XCJcXHUyNjYwXCIsXG4gIFwic3BhclwiOlwiXFx1MjIyNVwiLFxuICBcInNxY2FwXCI6XCJcXHUyMjkzXCIsXG4gIFwic3FjYXBzXCI6XCJcXHUyMjkzXFx1RkUwMFwiLFxuICBcInNxY3VwXCI6XCJcXHUyMjk0XCIsXG4gIFwic3FjdXBzXCI6XCJcXHUyMjk0XFx1RkUwMFwiLFxuICBcIlNxcnRcIjpcIlxcdTIyMUFcIixcbiAgXCJzcXN1YlwiOlwiXFx1MjI4RlwiLFxuICBcInNxc3ViZVwiOlwiXFx1MjI5MVwiLFxuICBcInNxc3Vic2V0XCI6XCJcXHUyMjhGXCIsXG4gIFwic3FzdWJzZXRlcVwiOlwiXFx1MjI5MVwiLFxuICBcInNxc3VwXCI6XCJcXHUyMjkwXCIsXG4gIFwic3FzdXBlXCI6XCJcXHUyMjkyXCIsXG4gIFwic3FzdXBzZXRcIjpcIlxcdTIyOTBcIixcbiAgXCJzcXN1cHNldGVxXCI6XCJcXHUyMjkyXCIsXG4gIFwic3F1XCI6XCJcXHUyNUExXCIsXG4gIFwiU3F1YXJlXCI6XCJcXHUyNUExXCIsXG4gIFwic3F1YXJlXCI6XCJcXHUyNUExXCIsXG4gIFwiU3F1YXJlSW50ZXJzZWN0aW9uXCI6XCJcXHUyMjkzXCIsXG4gIFwiU3F1YXJlU3Vic2V0XCI6XCJcXHUyMjhGXCIsXG4gIFwiU3F1YXJlU3Vic2V0RXF1YWxcIjpcIlxcdTIyOTFcIixcbiAgXCJTcXVhcmVTdXBlcnNldFwiOlwiXFx1MjI5MFwiLFxuICBcIlNxdWFyZVN1cGVyc2V0RXF1YWxcIjpcIlxcdTIyOTJcIixcbiAgXCJTcXVhcmVVbmlvblwiOlwiXFx1MjI5NFwiLFxuICBcInNxdWFyZlwiOlwiXFx1MjVBQVwiLFxuICBcInNxdWZcIjpcIlxcdTI1QUFcIixcbiAgXCJzcmFyclwiOlwiXFx1MjE5MlwiLFxuICBcIlNzY3JcIjpcIlxcdUQ4MzVcXHVEQ0FFXCIsXG4gIFwic3NjclwiOlwiXFx1RDgzNVxcdURDQzhcIixcbiAgXCJzc2V0bW5cIjpcIlxcdTIyMTZcIixcbiAgXCJzc21pbGVcIjpcIlxcdTIzMjNcIixcbiAgXCJzc3RhcmZcIjpcIlxcdTIyQzZcIixcbiAgXCJTdGFyXCI6XCJcXHUyMkM2XCIsXG4gIFwic3RhclwiOlwiXFx1MjYwNlwiLFxuICBcInN0YXJmXCI6XCJcXHUyNjA1XCIsXG4gIFwic3RyYWlnaHRlcHNpbG9uXCI6XCJcXHUwM0Y1XCIsXG4gIFwic3RyYWlnaHRwaGlcIjpcIlxcdTAzRDVcIixcbiAgXCJzdHJuc1wiOlwiXFx1MDBBRlwiLFxuICBcIlN1YlwiOlwiXFx1MjJEMFwiLFxuICBcInN1YlwiOlwiXFx1MjI4MlwiLFxuICBcInN1YmRvdFwiOlwiXFx1MkFCRFwiLFxuICBcInN1YkVcIjpcIlxcdTJBQzVcIixcbiAgXCJzdWJlXCI6XCJcXHUyMjg2XCIsXG4gIFwic3ViZWRvdFwiOlwiXFx1MkFDM1wiLFxuICBcInN1Ym11bHRcIjpcIlxcdTJBQzFcIixcbiAgXCJzdWJuRVwiOlwiXFx1MkFDQlwiLFxuICBcInN1Ym5lXCI6XCJcXHUyMjhBXCIsXG4gIFwic3VicGx1c1wiOlwiXFx1MkFCRlwiLFxuICBcInN1YnJhcnJcIjpcIlxcdTI5NzlcIixcbiAgXCJTdWJzZXRcIjpcIlxcdTIyRDBcIixcbiAgXCJzdWJzZXRcIjpcIlxcdTIyODJcIixcbiAgXCJzdWJzZXRlcVwiOlwiXFx1MjI4NlwiLFxuICBcInN1YnNldGVxcVwiOlwiXFx1MkFDNVwiLFxuICBcIlN1YnNldEVxdWFsXCI6XCJcXHUyMjg2XCIsXG4gIFwic3Vic2V0bmVxXCI6XCJcXHUyMjhBXCIsXG4gIFwic3Vic2V0bmVxcVwiOlwiXFx1MkFDQlwiLFxuICBcInN1YnNpbVwiOlwiXFx1MkFDN1wiLFxuICBcInN1YnN1YlwiOlwiXFx1MkFENVwiLFxuICBcInN1YnN1cFwiOlwiXFx1MkFEM1wiLFxuICBcInN1Y2NcIjpcIlxcdTIyN0JcIixcbiAgXCJzdWNjYXBwcm94XCI6XCJcXHUyQUI4XCIsXG4gIFwic3VjY2N1cmx5ZXFcIjpcIlxcdTIyN0RcIixcbiAgXCJTdWNjZWVkc1wiOlwiXFx1MjI3QlwiLFxuICBcIlN1Y2NlZWRzRXF1YWxcIjpcIlxcdTJBQjBcIixcbiAgXCJTdWNjZWVkc1NsYW50RXF1YWxcIjpcIlxcdTIyN0RcIixcbiAgXCJTdWNjZWVkc1RpbGRlXCI6XCJcXHUyMjdGXCIsXG4gIFwic3VjY2VxXCI6XCJcXHUyQUIwXCIsXG4gIFwic3VjY25hcHByb3hcIjpcIlxcdTJBQkFcIixcbiAgXCJzdWNjbmVxcVwiOlwiXFx1MkFCNlwiLFxuICBcInN1Y2Nuc2ltXCI6XCJcXHUyMkU5XCIsXG4gIFwic3VjY3NpbVwiOlwiXFx1MjI3RlwiLFxuICBcIlN1Y2hUaGF0XCI6XCJcXHUyMjBCXCIsXG4gIFwiU3VtXCI6XCJcXHUyMjExXCIsXG4gIFwic3VtXCI6XCJcXHUyMjExXCIsXG4gIFwic3VuZ1wiOlwiXFx1MjY2QVwiLFxuICBcIlN1cFwiOlwiXFx1MjJEMVwiLFxuICBcInN1cFwiOlwiXFx1MjI4M1wiLFxuICBcInN1cDFcIjpcIlxcdTAwQjlcIixcbiAgXCJzdXAyXCI6XCJcXHUwMEIyXCIsXG4gIFwic3VwM1wiOlwiXFx1MDBCM1wiLFxuICBcInN1cGRvdFwiOlwiXFx1MkFCRVwiLFxuICBcInN1cGRzdWJcIjpcIlxcdTJBRDhcIixcbiAgXCJzdXBFXCI6XCJcXHUyQUM2XCIsXG4gIFwic3VwZVwiOlwiXFx1MjI4N1wiLFxuICBcInN1cGVkb3RcIjpcIlxcdTJBQzRcIixcbiAgXCJTdXBlcnNldFwiOlwiXFx1MjI4M1wiLFxuICBcIlN1cGVyc2V0RXF1YWxcIjpcIlxcdTIyODdcIixcbiAgXCJzdXBoc29sXCI6XCJcXHUyN0M5XCIsXG4gIFwic3VwaHN1YlwiOlwiXFx1MkFEN1wiLFxuICBcInN1cGxhcnJcIjpcIlxcdTI5N0JcIixcbiAgXCJzdXBtdWx0XCI6XCJcXHUyQUMyXCIsXG4gIFwic3VwbkVcIjpcIlxcdTJBQ0NcIixcbiAgXCJzdXBuZVwiOlwiXFx1MjI4QlwiLFxuICBcInN1cHBsdXNcIjpcIlxcdTJBQzBcIixcbiAgXCJTdXBzZXRcIjpcIlxcdTIyRDFcIixcbiAgXCJzdXBzZXRcIjpcIlxcdTIyODNcIixcbiAgXCJzdXBzZXRlcVwiOlwiXFx1MjI4N1wiLFxuICBcInN1cHNldGVxcVwiOlwiXFx1MkFDNlwiLFxuICBcInN1cHNldG5lcVwiOlwiXFx1MjI4QlwiLFxuICBcInN1cHNldG5lcXFcIjpcIlxcdTJBQ0NcIixcbiAgXCJzdXBzaW1cIjpcIlxcdTJBQzhcIixcbiAgXCJzdXBzdWJcIjpcIlxcdTJBRDRcIixcbiAgXCJzdXBzdXBcIjpcIlxcdTJBRDZcIixcbiAgXCJzd2FyaGtcIjpcIlxcdTI5MjZcIixcbiAgXCJzd0FyclwiOlwiXFx1MjFEOVwiLFxuICBcInN3YXJyXCI6XCJcXHUyMTk5XCIsXG4gIFwic3dhcnJvd1wiOlwiXFx1MjE5OVwiLFxuICBcInN3bndhclwiOlwiXFx1MjkyQVwiLFxuICBcInN6bGlnXCI6XCJcXHUwMERGXCIsXG4gIFwiVGFiXCI6XCJcXHUwMDA5XCIsXG4gIFwidGFyZ2V0XCI6XCJcXHUyMzE2XCIsXG4gIFwiVGF1XCI6XCJcXHUwM0E0XCIsXG4gIFwidGF1XCI6XCJcXHUwM0M0XCIsXG4gIFwidGJya1wiOlwiXFx1MjNCNFwiLFxuICBcIlRjYXJvblwiOlwiXFx1MDE2NFwiLFxuICBcInRjYXJvblwiOlwiXFx1MDE2NVwiLFxuICBcIlRjZWRpbFwiOlwiXFx1MDE2MlwiLFxuICBcInRjZWRpbFwiOlwiXFx1MDE2M1wiLFxuICBcIlRjeVwiOlwiXFx1MDQyMlwiLFxuICBcInRjeVwiOlwiXFx1MDQ0MlwiLFxuICBcInRkb3RcIjpcIlxcdTIwREJcIixcbiAgXCJ0ZWxyZWNcIjpcIlxcdTIzMTVcIixcbiAgXCJUZnJcIjpcIlxcdUQ4MzVcXHVERDE3XCIsXG4gIFwidGZyXCI6XCJcXHVEODM1XFx1REQzMVwiLFxuICBcInRoZXJlNFwiOlwiXFx1MjIzNFwiLFxuICBcIlRoZXJlZm9yZVwiOlwiXFx1MjIzNFwiLFxuICBcInRoZXJlZm9yZVwiOlwiXFx1MjIzNFwiLFxuICBcIlRoZXRhXCI6XCJcXHUwMzk4XCIsXG4gIFwidGhldGFcIjpcIlxcdTAzQjhcIixcbiAgXCJ0aGV0YXN5bVwiOlwiXFx1MDNEMVwiLFxuICBcInRoZXRhdlwiOlwiXFx1MDNEMVwiLFxuICBcInRoaWNrYXBwcm94XCI6XCJcXHUyMjQ4XCIsXG4gIFwidGhpY2tzaW1cIjpcIlxcdTIyM0NcIixcbiAgXCJUaGlja1NwYWNlXCI6XCJcXHUyMDVGXFx1MjAwQVwiLFxuICBcInRoaW5zcFwiOlwiXFx1MjAwOVwiLFxuICBcIlRoaW5TcGFjZVwiOlwiXFx1MjAwOVwiLFxuICBcInRoa2FwXCI6XCJcXHUyMjQ4XCIsXG4gIFwidGhrc2ltXCI6XCJcXHUyMjNDXCIsXG4gIFwiVEhPUk5cIjpcIlxcdTAwREVcIixcbiAgXCJ0aG9yblwiOlwiXFx1MDBGRVwiLFxuICBcIlRpbGRlXCI6XCJcXHUyMjNDXCIsXG4gIFwidGlsZGVcIjpcIlxcdTAyRENcIixcbiAgXCJUaWxkZUVxdWFsXCI6XCJcXHUyMjQzXCIsXG4gIFwiVGlsZGVGdWxsRXF1YWxcIjpcIlxcdTIyNDVcIixcbiAgXCJUaWxkZVRpbGRlXCI6XCJcXHUyMjQ4XCIsXG4gIFwidGltZXNcIjpcIlxcdTAwRDdcIixcbiAgXCJ0aW1lc2JcIjpcIlxcdTIyQTBcIixcbiAgXCJ0aW1lc2JhclwiOlwiXFx1MkEzMVwiLFxuICBcInRpbWVzZFwiOlwiXFx1MkEzMFwiLFxuICBcInRpbnRcIjpcIlxcdTIyMkRcIixcbiAgXCJ0b2VhXCI6XCJcXHUyOTI4XCIsXG4gIFwidG9wXCI6XCJcXHUyMkE0XCIsXG4gIFwidG9wYm90XCI6XCJcXHUyMzM2XCIsXG4gIFwidG9wY2lyXCI6XCJcXHUyQUYxXCIsXG4gIFwiVG9wZlwiOlwiXFx1RDgzNVxcdURENEJcIixcbiAgXCJ0b3BmXCI6XCJcXHVEODM1XFx1REQ2NVwiLFxuICBcInRvcGZvcmtcIjpcIlxcdTJBREFcIixcbiAgXCJ0b3NhXCI6XCJcXHUyOTI5XCIsXG4gIFwidHByaW1lXCI6XCJcXHUyMDM0XCIsXG4gIFwiVFJBREVcIjpcIlxcdTIxMjJcIixcbiAgXCJ0cmFkZVwiOlwiXFx1MjEyMlwiLFxuICBcInRyaWFuZ2xlXCI6XCJcXHUyNUI1XCIsXG4gIFwidHJpYW5nbGVkb3duXCI6XCJcXHUyNUJGXCIsXG4gIFwidHJpYW5nbGVsZWZ0XCI6XCJcXHUyNUMzXCIsXG4gIFwidHJpYW5nbGVsZWZ0ZXFcIjpcIlxcdTIyQjRcIixcbiAgXCJ0cmlhbmdsZXFcIjpcIlxcdTIyNUNcIixcbiAgXCJ0cmlhbmdsZXJpZ2h0XCI6XCJcXHUyNUI5XCIsXG4gIFwidHJpYW5nbGVyaWdodGVxXCI6XCJcXHUyMkI1XCIsXG4gIFwidHJpZG90XCI6XCJcXHUyNUVDXCIsXG4gIFwidHJpZVwiOlwiXFx1MjI1Q1wiLFxuICBcInRyaW1pbnVzXCI6XCJcXHUyQTNBXCIsXG4gIFwiVHJpcGxlRG90XCI6XCJcXHUyMERCXCIsXG4gIFwidHJpcGx1c1wiOlwiXFx1MkEzOVwiLFxuICBcInRyaXNiXCI6XCJcXHUyOUNEXCIsXG4gIFwidHJpdGltZVwiOlwiXFx1MkEzQlwiLFxuICBcInRycGV6aXVtXCI6XCJcXHUyM0UyXCIsXG4gIFwiVHNjclwiOlwiXFx1RDgzNVxcdURDQUZcIixcbiAgXCJ0c2NyXCI6XCJcXHVEODM1XFx1RENDOVwiLFxuICBcIlRTY3lcIjpcIlxcdTA0MjZcIixcbiAgXCJ0c2N5XCI6XCJcXHUwNDQ2XCIsXG4gIFwiVFNIY3lcIjpcIlxcdTA0MEJcIixcbiAgXCJ0c2hjeVwiOlwiXFx1MDQ1QlwiLFxuICBcIlRzdHJva1wiOlwiXFx1MDE2NlwiLFxuICBcInRzdHJva1wiOlwiXFx1MDE2N1wiLFxuICBcInR3aXh0XCI6XCJcXHUyMjZDXCIsXG4gIFwidHdvaGVhZGxlZnRhcnJvd1wiOlwiXFx1MjE5RVwiLFxuICBcInR3b2hlYWRyaWdodGFycm93XCI6XCJcXHUyMUEwXCIsXG4gIFwiVWFjdXRlXCI6XCJcXHUwMERBXCIsXG4gIFwidWFjdXRlXCI6XCJcXHUwMEZBXCIsXG4gIFwiVWFyclwiOlwiXFx1MjE5RlwiLFxuICBcInVBcnJcIjpcIlxcdTIxRDFcIixcbiAgXCJ1YXJyXCI6XCJcXHUyMTkxXCIsXG4gIFwiVWFycm9jaXJcIjpcIlxcdTI5NDlcIixcbiAgXCJVYnJjeVwiOlwiXFx1MDQwRVwiLFxuICBcInVicmN5XCI6XCJcXHUwNDVFXCIsXG4gIFwiVWJyZXZlXCI6XCJcXHUwMTZDXCIsXG4gIFwidWJyZXZlXCI6XCJcXHUwMTZEXCIsXG4gIFwiVWNpcmNcIjpcIlxcdTAwREJcIixcbiAgXCJ1Y2lyY1wiOlwiXFx1MDBGQlwiLFxuICBcIlVjeVwiOlwiXFx1MDQyM1wiLFxuICBcInVjeVwiOlwiXFx1MDQ0M1wiLFxuICBcInVkYXJyXCI6XCJcXHUyMUM1XCIsXG4gIFwiVWRibGFjXCI6XCJcXHUwMTcwXCIsXG4gIFwidWRibGFjXCI6XCJcXHUwMTcxXCIsXG4gIFwidWRoYXJcIjpcIlxcdTI5NkVcIixcbiAgXCJ1ZmlzaHRcIjpcIlxcdTI5N0VcIixcbiAgXCJVZnJcIjpcIlxcdUQ4MzVcXHVERDE4XCIsXG4gIFwidWZyXCI6XCJcXHVEODM1XFx1REQzMlwiLFxuICBcIlVncmF2ZVwiOlwiXFx1MDBEOVwiLFxuICBcInVncmF2ZVwiOlwiXFx1MDBGOVwiLFxuICBcInVIYXJcIjpcIlxcdTI5NjNcIixcbiAgXCJ1aGFybFwiOlwiXFx1MjFCRlwiLFxuICBcInVoYXJyXCI6XCJcXHUyMUJFXCIsXG4gIFwidWhibGtcIjpcIlxcdTI1ODBcIixcbiAgXCJ1bGNvcm5cIjpcIlxcdTIzMUNcIixcbiAgXCJ1bGNvcm5lclwiOlwiXFx1MjMxQ1wiLFxuICBcInVsY3JvcFwiOlwiXFx1MjMwRlwiLFxuICBcInVsdHJpXCI6XCJcXHUyNUY4XCIsXG4gIFwiVW1hY3JcIjpcIlxcdTAxNkFcIixcbiAgXCJ1bWFjclwiOlwiXFx1MDE2QlwiLFxuICBcInVtbFwiOlwiXFx1MDBBOFwiLFxuICBcIlVuZGVyQmFyXCI6XCJcXHUwMDVGXCIsXG4gIFwiVW5kZXJCcmFjZVwiOlwiXFx1MjNERlwiLFxuICBcIlVuZGVyQnJhY2tldFwiOlwiXFx1MjNCNVwiLFxuICBcIlVuZGVyUGFyZW50aGVzaXNcIjpcIlxcdTIzRERcIixcbiAgXCJVbmlvblwiOlwiXFx1MjJDM1wiLFxuICBcIlVuaW9uUGx1c1wiOlwiXFx1MjI4RVwiLFxuICBcIlVvZ29uXCI6XCJcXHUwMTcyXCIsXG4gIFwidW9nb25cIjpcIlxcdTAxNzNcIixcbiAgXCJVb3BmXCI6XCJcXHVEODM1XFx1REQ0Q1wiLFxuICBcInVvcGZcIjpcIlxcdUQ4MzVcXHVERDY2XCIsXG4gIFwiVXBBcnJvd1wiOlwiXFx1MjE5MVwiLFxuICBcIlVwYXJyb3dcIjpcIlxcdTIxRDFcIixcbiAgXCJ1cGFycm93XCI6XCJcXHUyMTkxXCIsXG4gIFwiVXBBcnJvd0JhclwiOlwiXFx1MjkxMlwiLFxuICBcIlVwQXJyb3dEb3duQXJyb3dcIjpcIlxcdTIxQzVcIixcbiAgXCJVcERvd25BcnJvd1wiOlwiXFx1MjE5NVwiLFxuICBcIlVwZG93bmFycm93XCI6XCJcXHUyMUQ1XCIsXG4gIFwidXBkb3duYXJyb3dcIjpcIlxcdTIxOTVcIixcbiAgXCJVcEVxdWlsaWJyaXVtXCI6XCJcXHUyOTZFXCIsXG4gIFwidXBoYXJwb29ubGVmdFwiOlwiXFx1MjFCRlwiLFxuICBcInVwaGFycG9vbnJpZ2h0XCI6XCJcXHUyMUJFXCIsXG4gIFwidXBsdXNcIjpcIlxcdTIyOEVcIixcbiAgXCJVcHBlckxlZnRBcnJvd1wiOlwiXFx1MjE5NlwiLFxuICBcIlVwcGVyUmlnaHRBcnJvd1wiOlwiXFx1MjE5N1wiLFxuICBcIlVwc2lcIjpcIlxcdTAzRDJcIixcbiAgXCJ1cHNpXCI6XCJcXHUwM0M1XCIsXG4gIFwidXBzaWhcIjpcIlxcdTAzRDJcIixcbiAgXCJVcHNpbG9uXCI6XCJcXHUwM0E1XCIsXG4gIFwidXBzaWxvblwiOlwiXFx1MDNDNVwiLFxuICBcIlVwVGVlXCI6XCJcXHUyMkE1XCIsXG4gIFwiVXBUZWVBcnJvd1wiOlwiXFx1MjFBNVwiLFxuICBcInVwdXBhcnJvd3NcIjpcIlxcdTIxQzhcIixcbiAgXCJ1cmNvcm5cIjpcIlxcdTIzMURcIixcbiAgXCJ1cmNvcm5lclwiOlwiXFx1MjMxRFwiLFxuICBcInVyY3JvcFwiOlwiXFx1MjMwRVwiLFxuICBcIlVyaW5nXCI6XCJcXHUwMTZFXCIsXG4gIFwidXJpbmdcIjpcIlxcdTAxNkZcIixcbiAgXCJ1cnRyaVwiOlwiXFx1MjVGOVwiLFxuICBcIlVzY3JcIjpcIlxcdUQ4MzVcXHVEQ0IwXCIsXG4gIFwidXNjclwiOlwiXFx1RDgzNVxcdURDQ0FcIixcbiAgXCJ1dGRvdFwiOlwiXFx1MjJGMFwiLFxuICBcIlV0aWxkZVwiOlwiXFx1MDE2OFwiLFxuICBcInV0aWxkZVwiOlwiXFx1MDE2OVwiLFxuICBcInV0cmlcIjpcIlxcdTI1QjVcIixcbiAgXCJ1dHJpZlwiOlwiXFx1MjVCNFwiLFxuICBcInV1YXJyXCI6XCJcXHUyMUM4XCIsXG4gIFwiVXVtbFwiOlwiXFx1MDBEQ1wiLFxuICBcInV1bWxcIjpcIlxcdTAwRkNcIixcbiAgXCJ1d2FuZ2xlXCI6XCJcXHUyOUE3XCIsXG4gIFwidmFuZ3J0XCI6XCJcXHUyOTlDXCIsXG4gIFwidmFyZXBzaWxvblwiOlwiXFx1MDNGNVwiLFxuICBcInZhcmthcHBhXCI6XCJcXHUwM0YwXCIsXG4gIFwidmFybm90aGluZ1wiOlwiXFx1MjIwNVwiLFxuICBcInZhcnBoaVwiOlwiXFx1MDNENVwiLFxuICBcInZhcnBpXCI6XCJcXHUwM0Q2XCIsXG4gIFwidmFycHJvcHRvXCI6XCJcXHUyMjFEXCIsXG4gIFwidkFyclwiOlwiXFx1MjFENVwiLFxuICBcInZhcnJcIjpcIlxcdTIxOTVcIixcbiAgXCJ2YXJyaG9cIjpcIlxcdTAzRjFcIixcbiAgXCJ2YXJzaWdtYVwiOlwiXFx1MDNDMlwiLFxuICBcInZhcnN1YnNldG5lcVwiOlwiXFx1MjI4QVxcdUZFMDBcIixcbiAgXCJ2YXJzdWJzZXRuZXFxXCI6XCJcXHUyQUNCXFx1RkUwMFwiLFxuICBcInZhcnN1cHNldG5lcVwiOlwiXFx1MjI4QlxcdUZFMDBcIixcbiAgXCJ2YXJzdXBzZXRuZXFxXCI6XCJcXHUyQUNDXFx1RkUwMFwiLFxuICBcInZhcnRoZXRhXCI6XCJcXHUwM0QxXCIsXG4gIFwidmFydHJpYW5nbGVsZWZ0XCI6XCJcXHUyMkIyXCIsXG4gIFwidmFydHJpYW5nbGVyaWdodFwiOlwiXFx1MjJCM1wiLFxuICBcIlZiYXJcIjpcIlxcdTJBRUJcIixcbiAgXCJ2QmFyXCI6XCJcXHUyQUU4XCIsXG4gIFwidkJhcnZcIjpcIlxcdTJBRTlcIixcbiAgXCJWY3lcIjpcIlxcdTA0MTJcIixcbiAgXCJ2Y3lcIjpcIlxcdTA0MzJcIixcbiAgXCJWRGFzaFwiOlwiXFx1MjJBQlwiLFxuICBcIlZkYXNoXCI6XCJcXHUyMkE5XCIsXG4gIFwidkRhc2hcIjpcIlxcdTIyQThcIixcbiAgXCJ2ZGFzaFwiOlwiXFx1MjJBMlwiLFxuICBcIlZkYXNobFwiOlwiXFx1MkFFNlwiLFxuICBcIlZlZVwiOlwiXFx1MjJDMVwiLFxuICBcInZlZVwiOlwiXFx1MjIyOFwiLFxuICBcInZlZWJhclwiOlwiXFx1MjJCQlwiLFxuICBcInZlZWVxXCI6XCJcXHUyMjVBXCIsXG4gIFwidmVsbGlwXCI6XCJcXHUyMkVFXCIsXG4gIFwiVmVyYmFyXCI6XCJcXHUyMDE2XCIsXG4gIFwidmVyYmFyXCI6XCJcXHUwMDdDXCIsXG4gIFwiVmVydFwiOlwiXFx1MjAxNlwiLFxuICBcInZlcnRcIjpcIlxcdTAwN0NcIixcbiAgXCJWZXJ0aWNhbEJhclwiOlwiXFx1MjIyM1wiLFxuICBcIlZlcnRpY2FsTGluZVwiOlwiXFx1MDA3Q1wiLFxuICBcIlZlcnRpY2FsU2VwYXJhdG9yXCI6XCJcXHUyNzU4XCIsXG4gIFwiVmVydGljYWxUaWxkZVwiOlwiXFx1MjI0MFwiLFxuICBcIlZlcnlUaGluU3BhY2VcIjpcIlxcdTIwMEFcIixcbiAgXCJWZnJcIjpcIlxcdUQ4MzVcXHVERDE5XCIsXG4gIFwidmZyXCI6XCJcXHVEODM1XFx1REQzM1wiLFxuICBcInZsdHJpXCI6XCJcXHUyMkIyXCIsXG4gIFwidm5zdWJcIjpcIlxcdTIyODJcXHUyMEQyXCIsXG4gIFwidm5zdXBcIjpcIlxcdTIyODNcXHUyMEQyXCIsXG4gIFwiVm9wZlwiOlwiXFx1RDgzNVxcdURENERcIixcbiAgXCJ2b3BmXCI6XCJcXHVEODM1XFx1REQ2N1wiLFxuICBcInZwcm9wXCI6XCJcXHUyMjFEXCIsXG4gIFwidnJ0cmlcIjpcIlxcdTIyQjNcIixcbiAgXCJWc2NyXCI6XCJcXHVEODM1XFx1RENCMVwiLFxuICBcInZzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NCXCIsXG4gIFwidnN1Ym5FXCI6XCJcXHUyQUNCXFx1RkUwMFwiLFxuICBcInZzdWJuZVwiOlwiXFx1MjI4QVxcdUZFMDBcIixcbiAgXCJ2c3VwbkVcIjpcIlxcdTJBQ0NcXHVGRTAwXCIsXG4gIFwidnN1cG5lXCI6XCJcXHUyMjhCXFx1RkUwMFwiLFxuICBcIlZ2ZGFzaFwiOlwiXFx1MjJBQVwiLFxuICBcInZ6aWd6YWdcIjpcIlxcdTI5OUFcIixcbiAgXCJXY2lyY1wiOlwiXFx1MDE3NFwiLFxuICBcIndjaXJjXCI6XCJcXHUwMTc1XCIsXG4gIFwid2VkYmFyXCI6XCJcXHUyQTVGXCIsXG4gIFwiV2VkZ2VcIjpcIlxcdTIyQzBcIixcbiAgXCJ3ZWRnZVwiOlwiXFx1MjIyN1wiLFxuICBcIndlZGdlcVwiOlwiXFx1MjI1OVwiLFxuICBcIndlaWVycFwiOlwiXFx1MjExOFwiLFxuICBcIldmclwiOlwiXFx1RDgzNVxcdUREMUFcIixcbiAgXCJ3ZnJcIjpcIlxcdUQ4MzVcXHVERDM0XCIsXG4gIFwiV29wZlwiOlwiXFx1RDgzNVxcdURENEVcIixcbiAgXCJ3b3BmXCI6XCJcXHVEODM1XFx1REQ2OFwiLFxuICBcIndwXCI6XCJcXHUyMTE4XCIsXG4gIFwid3JcIjpcIlxcdTIyNDBcIixcbiAgXCJ3cmVhdGhcIjpcIlxcdTIyNDBcIixcbiAgXCJXc2NyXCI6XCJcXHVEODM1XFx1RENCMlwiLFxuICBcIndzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NDXCIsXG4gIFwieGNhcFwiOlwiXFx1MjJDMlwiLFxuICBcInhjaXJjXCI6XCJcXHUyNUVGXCIsXG4gIFwieGN1cFwiOlwiXFx1MjJDM1wiLFxuICBcInhkdHJpXCI6XCJcXHUyNUJEXCIsXG4gIFwiWGZyXCI6XCJcXHVEODM1XFx1REQxQlwiLFxuICBcInhmclwiOlwiXFx1RDgzNVxcdUREMzVcIixcbiAgXCJ4aEFyclwiOlwiXFx1MjdGQVwiLFxuICBcInhoYXJyXCI6XCJcXHUyN0Y3XCIsXG4gIFwiWGlcIjpcIlxcdTAzOUVcIixcbiAgXCJ4aVwiOlwiXFx1MDNCRVwiLFxuICBcInhsQXJyXCI6XCJcXHUyN0Y4XCIsXG4gIFwieGxhcnJcIjpcIlxcdTI3RjVcIixcbiAgXCJ4bWFwXCI6XCJcXHUyN0ZDXCIsXG4gIFwieG5pc1wiOlwiXFx1MjJGQlwiLFxuICBcInhvZG90XCI6XCJcXHUyQTAwXCIsXG4gIFwiWG9wZlwiOlwiXFx1RDgzNVxcdURENEZcIixcbiAgXCJ4b3BmXCI6XCJcXHVEODM1XFx1REQ2OVwiLFxuICBcInhvcGx1c1wiOlwiXFx1MkEwMVwiLFxuICBcInhvdGltZVwiOlwiXFx1MkEwMlwiLFxuICBcInhyQXJyXCI6XCJcXHUyN0Y5XCIsXG4gIFwieHJhcnJcIjpcIlxcdTI3RjZcIixcbiAgXCJYc2NyXCI6XCJcXHVEODM1XFx1RENCM1wiLFxuICBcInhzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NEXCIsXG4gIFwieHNxY3VwXCI6XCJcXHUyQTA2XCIsXG4gIFwieHVwbHVzXCI6XCJcXHUyQTA0XCIsXG4gIFwieHV0cmlcIjpcIlxcdTI1QjNcIixcbiAgXCJ4dmVlXCI6XCJcXHUyMkMxXCIsXG4gIFwieHdlZGdlXCI6XCJcXHUyMkMwXCIsXG4gIFwiWWFjdXRlXCI6XCJcXHUwMEREXCIsXG4gIFwieWFjdXRlXCI6XCJcXHUwMEZEXCIsXG4gIFwiWUFjeVwiOlwiXFx1MDQyRlwiLFxuICBcInlhY3lcIjpcIlxcdTA0NEZcIixcbiAgXCJZY2lyY1wiOlwiXFx1MDE3NlwiLFxuICBcInljaXJjXCI6XCJcXHUwMTc3XCIsXG4gIFwiWWN5XCI6XCJcXHUwNDJCXCIsXG4gIFwieWN5XCI6XCJcXHUwNDRCXCIsXG4gIFwieWVuXCI6XCJcXHUwMEE1XCIsXG4gIFwiWWZyXCI6XCJcXHVEODM1XFx1REQxQ1wiLFxuICBcInlmclwiOlwiXFx1RDgzNVxcdUREMzZcIixcbiAgXCJZSWN5XCI6XCJcXHUwNDA3XCIsXG4gIFwieWljeVwiOlwiXFx1MDQ1N1wiLFxuICBcIllvcGZcIjpcIlxcdUQ4MzVcXHVERDUwXCIsXG4gIFwieW9wZlwiOlwiXFx1RDgzNVxcdURENkFcIixcbiAgXCJZc2NyXCI6XCJcXHVEODM1XFx1RENCNFwiLFxuICBcInlzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NFXCIsXG4gIFwiWVVjeVwiOlwiXFx1MDQyRVwiLFxuICBcInl1Y3lcIjpcIlxcdTA0NEVcIixcbiAgXCJZdW1sXCI6XCJcXHUwMTc4XCIsXG4gIFwieXVtbFwiOlwiXFx1MDBGRlwiLFxuICBcIlphY3V0ZVwiOlwiXFx1MDE3OVwiLFxuICBcInphY3V0ZVwiOlwiXFx1MDE3QVwiLFxuICBcIlpjYXJvblwiOlwiXFx1MDE3RFwiLFxuICBcInpjYXJvblwiOlwiXFx1MDE3RVwiLFxuICBcIlpjeVwiOlwiXFx1MDQxN1wiLFxuICBcInpjeVwiOlwiXFx1MDQzN1wiLFxuICBcIlpkb3RcIjpcIlxcdTAxN0JcIixcbiAgXCJ6ZG90XCI6XCJcXHUwMTdDXCIsXG4gIFwiemVldHJmXCI6XCJcXHUyMTI4XCIsXG4gIFwiWmVyb1dpZHRoU3BhY2VcIjpcIlxcdTIwMEJcIixcbiAgXCJaZXRhXCI6XCJcXHUwMzk2XCIsXG4gIFwiemV0YVwiOlwiXFx1MDNCNlwiLFxuICBcIlpmclwiOlwiXFx1MjEyOFwiLFxuICBcInpmclwiOlwiXFx1RDgzNVxcdUREMzdcIixcbiAgXCJaSGN5XCI6XCJcXHUwNDE2XCIsXG4gIFwiemhjeVwiOlwiXFx1MDQzNlwiLFxuICBcInppZ3JhcnJcIjpcIlxcdTIxRERcIixcbiAgXCJab3BmXCI6XCJcXHUyMTI0XCIsXG4gIFwiem9wZlwiOlwiXFx1RDgzNVxcdURENkJcIixcbiAgXCJac2NyXCI6XCJcXHVEODM1XFx1RENCNVwiLFxuICBcInpzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NGXCIsXG4gIFwiendqXCI6XCJcXHUyMDBEXCIsXG4gIFwiendualwiOlwiXFx1MjAwQ1wiXG59O1xuIiwiLy8gTGlzdCBvZiB2YWxpZCBodG1sIGJsb2NrcyBuYW1lcywgYWNjb3J0aW5nIHRvIGNvbW1vbm1hcmsgc3BlY1xuLy8gaHR0cDovL2pnbS5naXRodWIuaW8vQ29tbW9uTWFyay9zcGVjLmh0bWwjaHRtbC1ibG9ja3NcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaHRtbF9ibG9ja3MgPSB7fTtcblxuW1xuICAnYXJ0aWNsZScsXG4gICdhc2lkZScsXG4gICdidXR0b24nLFxuICAnYmxvY2txdW90ZScsXG4gICdib2R5JyxcbiAgJ2NhbnZhcycsXG4gICdjYXB0aW9uJyxcbiAgJ2NvbCcsXG4gICdjb2xncm91cCcsXG4gICdkZCcsXG4gICdkaXYnLFxuICAnZGwnLFxuICAnZHQnLFxuICAnZW1iZWQnLFxuICAnZmllbGRzZXQnLFxuICAnZmlnY2FwdGlvbicsXG4gICdmaWd1cmUnLFxuICAnZm9vdGVyJyxcbiAgJ2Zvcm0nLFxuICAnaDEnLFxuICAnaDInLFxuICAnaDMnLFxuICAnaDQnLFxuICAnaDUnLFxuICAnaDYnLFxuICAnaGVhZGVyJyxcbiAgJ2hncm91cCcsXG4gICdocicsXG4gICdpZnJhbWUnLFxuICAnbGknLFxuICAnbWFwJyxcbiAgJ29iamVjdCcsXG4gICdvbCcsXG4gICdvdXRwdXQnLFxuICAncCcsXG4gICdwcmUnLFxuICAncHJvZ3Jlc3MnLFxuICAnc2NyaXB0JyxcbiAgJ3NlY3Rpb24nLFxuICAnc3R5bGUnLFxuICAndGFibGUnLFxuICAndGJvZHknLFxuICAndGQnLFxuICAndGV4dGFyZWEnLFxuICAndGZvb3QnLFxuICAndGgnLFxuICAndHInLFxuICAndGhlYWQnLFxuICAndWwnLFxuICAndmlkZW8nXG5dLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgaHRtbF9ibG9ja3NbbmFtZV0gPSB0cnVlOyB9KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGh0bWxfYmxvY2tzO1xuIiwiLy8gUmVnZXhwcyB0byBtYXRjaCBodG1sIGVsZW1lbnRzXG5cbid1c2Ugc3RyaWN0JztcblxuXG5mdW5jdGlvbiByZXBsYWNlKHJlZ2V4LCBvcHRpb25zKSB7XG4gIHJlZ2V4ID0gcmVnZXguc291cmNlO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCAnJztcblxuICByZXR1cm4gZnVuY3Rpb24gc2VsZihuYW1lLCB2YWwpIHtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LCBvcHRpb25zKTtcbiAgICB9XG4gICAgdmFsID0gdmFsLnNvdXJjZSB8fCB2YWw7XG4gICAgcmVnZXggPSByZWdleC5yZXBsYWNlKG5hbWUsIHZhbCk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG59XG5cblxudmFyIGF0dHJfbmFtZSAgICAgPSAvW2EtekEtWl86XVthLXpBLVowLTk6Ll8tXSovO1xuXG52YXIgdW5xdW90ZWQgICAgICA9IC9bXlwiJz08PmBcXHgwMC1cXHgyMF0rLztcbnZhciBzaW5nbGVfcXVvdGVkID0gLydbXiddKicvO1xudmFyIGRvdWJsZV9xdW90ZWQgPSAvXCJbXlwiXSpcIi87XG5cbi8qZXNsaW50IG5vLXNwYWNlZC1mdW5jOjAqL1xudmFyIGF0dHJfdmFsdWUgID0gcmVwbGFjZSgvKD86dW5xdW90ZWR8c2luZ2xlX3F1b3RlZHxkb3VibGVfcXVvdGVkKS8pXG4gICAgICAgICAgICAgICAgICAgICgndW5xdW90ZWQnLCB1bnF1b3RlZClcbiAgICAgICAgICAgICAgICAgICAgKCdzaW5nbGVfcXVvdGVkJywgc2luZ2xlX3F1b3RlZClcbiAgICAgICAgICAgICAgICAgICAgKCdkb3VibGVfcXVvdGVkJywgZG91YmxlX3F1b3RlZClcbiAgICAgICAgICAgICAgICAgICAgKCk7XG5cbnZhciBhdHRyaWJ1dGUgICA9IHJlcGxhY2UoLyg/OlxccythdHRyX25hbWUoPzpcXHMqPVxccyphdHRyX3ZhbHVlKT8pLylcbiAgICAgICAgICAgICAgICAgICAgKCdhdHRyX25hbWUnLCBhdHRyX25hbWUpXG4gICAgICAgICAgICAgICAgICAgICgnYXR0cl92YWx1ZScsIGF0dHJfdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICgpO1xuXG52YXIgb3Blbl90YWcgICAgPSByZXBsYWNlKC88W0EtWmEtel1bQS1aYS16MC05XSphdHRyaWJ1dGUqXFxzKlxcLz8+LylcbiAgICAgICAgICAgICAgICAgICAgKCdhdHRyaWJ1dGUnLCBhdHRyaWJ1dGUpXG4gICAgICAgICAgICAgICAgICAgICgpO1xuXG52YXIgY2xvc2VfdGFnICAgPSAvPFxcL1tBLVphLXpdW0EtWmEtejAtOV0qXFxzKj4vO1xudmFyIGNvbW1lbnQgICAgID0gLzwhLS0oW14tXSt8Wy1dW14tXSspKi0tPi87XG52YXIgcHJvY2Vzc2luZyAgPSAvPFs/XS4qP1s/XT4vO1xudmFyIGRlY2xhcmF0aW9uID0gLzwhW0EtWl0rXFxzK1tePl0qPi87XG52YXIgY2RhdGEgICAgICAgPSAvPCFcXFtDREFUQVxcWyhbXlxcXV0rfFxcXVteXFxdXXxcXF1cXF1bXj5dKSpcXF1cXF0+LztcblxudmFyIEhUTUxfVEFHX1JFID0gcmVwbGFjZSgvXig/Om9wZW5fdGFnfGNsb3NlX3RhZ3xjb21tZW50fHByb2Nlc3Npbmd8ZGVjbGFyYXRpb258Y2RhdGEpLylcbiAgKCdvcGVuX3RhZycsIG9wZW5fdGFnKVxuICAoJ2Nsb3NlX3RhZycsIGNsb3NlX3RhZylcbiAgKCdjb21tZW50JywgY29tbWVudClcbiAgKCdwcm9jZXNzaW5nJywgcHJvY2Vzc2luZylcbiAgKCdkZWNsYXJhdGlvbicsIGRlY2xhcmF0aW9uKVxuICAoJ2NkYXRhJywgY2RhdGEpXG4gICgpO1xuXG5cbm1vZHVsZS5leHBvcnRzLkhUTUxfVEFHX1JFID0gSFRNTF9UQUdfUkU7XG4iLCIvLyBMaXN0IG9mIHZhbGlkIHVybCBzY2hlbWFzLCBhY2NvcnRpbmcgdG8gY29tbW9ubWFyayBzcGVjXG4vLyBodHRwOi8vamdtLmdpdGh1Yi5pby9Db21tb25NYXJrL3NwZWMuaHRtbCNhdXRvbGlua3NcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gW1xuICAnY29hcCcsXG4gICdkb2knLFxuICAnamF2YXNjcmlwdCcsXG4gICdhYWEnLFxuICAnYWFhcycsXG4gICdhYm91dCcsXG4gICdhY2FwJyxcbiAgJ2NhcCcsXG4gICdjaWQnLFxuICAnY3JpZCcsXG4gICdkYXRhJyxcbiAgJ2RhdicsXG4gICdkaWN0JyxcbiAgJ2RucycsXG4gICdmaWxlJyxcbiAgJ2Z0cCcsXG4gICdnZW8nLFxuICAnZ28nLFxuICAnZ29waGVyJyxcbiAgJ2gzMjMnLFxuICAnaHR0cCcsXG4gICdodHRwcycsXG4gICdpYXgnLFxuICAnaWNhcCcsXG4gICdpbScsXG4gICdpbWFwJyxcbiAgJ2luZm8nLFxuICAnaXBwJyxcbiAgJ2lyaXMnLFxuICAnaXJpcy5iZWVwJyxcbiAgJ2lyaXMueHBjJyxcbiAgJ2lyaXMueHBjcycsXG4gICdpcmlzLmx3eicsXG4gICdsZGFwJyxcbiAgJ21haWx0bycsXG4gICdtaWQnLFxuICAnbXNycCcsXG4gICdtc3JwcycsXG4gICdtdHFwJyxcbiAgJ211cGRhdGUnLFxuICAnbmV3cycsXG4gICduZnMnLFxuICAnbmknLFxuICAnbmloJyxcbiAgJ25udHAnLFxuICAnb3BhcXVlbG9ja3Rva2VuJyxcbiAgJ3BvcCcsXG4gICdwcmVzJyxcbiAgJ3J0c3AnLFxuICAnc2VydmljZScsXG4gICdzZXNzaW9uJyxcbiAgJ3NodHRwJyxcbiAgJ3NpZXZlJyxcbiAgJ3NpcCcsXG4gICdzaXBzJyxcbiAgJ3NtcycsXG4gICdzbm1wJyxcbiAgJ3NvYXAuYmVlcCcsXG4gICdzb2FwLmJlZXBzJyxcbiAgJ3RhZycsXG4gICd0ZWwnLFxuICAndGVsbmV0JyxcbiAgJ3RmdHAnLFxuICAndGhpc21lc3NhZ2UnLFxuICAndG4zMjcwJyxcbiAgJ3RpcCcsXG4gICd0dicsXG4gICd1cm4nLFxuICAndmVtbWknLFxuICAnd3MnLFxuICAnd3NzJyxcbiAgJ3hjb24nLFxuICAneGNvbi11c2VyaWQnLFxuICAneG1scnBjLmJlZXAnLFxuICAneG1scnBjLmJlZXBzJyxcbiAgJ3htcHAnLFxuICAnejM5LjUwcicsXG4gICd6MzkuNTBzJyxcbiAgJ2FkaXVteHRyYScsXG4gICdhZnAnLFxuICAnYWZzJyxcbiAgJ2FpbScsXG4gICdhcHQnLFxuICAnYXR0YWNobWVudCcsXG4gICdhdycsXG4gICdiZXNoYXJlJyxcbiAgJ2JpdGNvaW4nLFxuICAnYm9sbycsXG4gICdjYWxsdG8nLFxuICAnY2hyb21lJyxcbiAgJ2Nocm9tZS1leHRlbnNpb24nLFxuICAnY29tLWV2ZW50YnJpdGUtYXR0ZW5kZWUnLFxuICAnY29udGVudCcsXG4gICdjdnMnLFxuICAnZGxuYS1wbGF5c2luZ2xlJyxcbiAgJ2RsbmEtcGxheWNvbnRhaW5lcicsXG4gICdkdG4nLFxuICAnZHZiJyxcbiAgJ2VkMmsnLFxuICAnZmFjZXRpbWUnLFxuICAnZmVlZCcsXG4gICdmaW5nZXInLFxuICAnZmlzaCcsXG4gICdnZycsXG4gICdnaXQnLFxuICAnZ2l6bW9wcm9qZWN0JyxcbiAgJ2d0YWxrJyxcbiAgJ2hjcCcsXG4gICdpY29uJyxcbiAgJ2lwbicsXG4gICdpcmMnLFxuICAnaXJjNicsXG4gICdpcmNzJyxcbiAgJ2l0bXMnLFxuICAnamFyJyxcbiAgJ2ptcycsXG4gICdrZXlwYXJjJyxcbiAgJ2xhc3RmbScsXG4gICdsZGFwcycsXG4gICdtYWduZXQnLFxuICAnbWFwcycsXG4gICdtYXJrZXQnLFxuICAnbWVzc2FnZScsXG4gICdtbXMnLFxuICAnbXMtaGVscCcsXG4gICdtc25pbScsXG4gICdtdW1ibGUnLFxuICAnbXZuJyxcbiAgJ25vdGVzJyxcbiAgJ29pZCcsXG4gICdwYWxtJyxcbiAgJ3BhcGFyYXp6aScsXG4gICdwbGF0Zm9ybScsXG4gICdwcm94eScsXG4gICdwc3ljJyxcbiAgJ3F1ZXJ5JyxcbiAgJ3JlcycsXG4gICdyZXNvdXJjZScsXG4gICdybWknLFxuICAncnN5bmMnLFxuICAncnRtcCcsXG4gICdzZWNvbmRsaWZlJyxcbiAgJ3NmdHAnLFxuICAnc2duJyxcbiAgJ3NreXBlJyxcbiAgJ3NtYicsXG4gICdzb2xkYXQnLFxuICAnc3BvdGlmeScsXG4gICdzc2gnLFxuICAnc3RlYW0nLFxuICAnc3ZuJyxcbiAgJ3RlYW1zcGVhaycsXG4gICd0aGluZ3MnLFxuICAndWRwJyxcbiAgJ3VucmVhbCcsXG4gICd1dDIwMDQnLFxuICAndmVudHJpbG8nLFxuICAndmlldy1zb3VyY2UnLFxuICAnd2ViY2FsJyxcbiAgJ3d0YWknLFxuICAnd3ljaXd5ZycsXG4gICd4ZmlyZScsXG4gICd4cmknLFxuICAneW1zZ3InXG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zXG4gKi9cblxuZnVuY3Rpb24gdHlwZU9mKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKG9iaikge1xuICByZXR1cm4gdHlwZU9mKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xufVxuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gaGFzKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBvYmplY3RcbiAgICA/IGhhc093bi5jYWxsKG9iamVjdCwga2V5KVxuICAgIDogZmFsc2U7XG59XG5cbi8vIEV4dGVuZCBvYmplY3RzXG4vL1xuZnVuY3Rpb24gYXNzaWduKG9iaiAvKmZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiovKSB7XG4gIHZhciBzb3VyY2VzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKCFzb3VyY2UpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc291cmNlICsgJ211c3QgYmUgb2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBVTkVTQ0FQRV9NRF9SRSA9IC9cXFxcKFtcXFxcIVwiIyQlJicoKSorLC5cXC86Ozw9Pj9AW1xcXV5fYHt8fX4tXSkvZztcblxuZnVuY3Rpb24gdW5lc2NhcGVNZChzdHIpIHtcbiAgaWYgKHN0ci5pbmRleE9mKCdcXFxcJykgPCAwKSB7IHJldHVybiBzdHI7IH1cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFVORVNDQVBFX01EX1JFLCAnJDEnKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gaXNWYWxpZEVudGl0eUNvZGUoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICAvLyBicm9rZW4gc2VxdWVuY2VcbiAgaWYgKGMgPj0gMHhEODAwICYmIGMgPD0gMHhERkZGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBuZXZlciB1c2VkXG4gIGlmIChjID49IDB4RkREMCAmJiBjIDw9IDB4RkRFRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKChjICYgMHhGRkZGKSA9PT0gMHhGRkZGIHx8IChjICYgMHhGRkZGKSA9PT0gMHhGRkZFKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBjb250cm9sIGNvZGVzXG4gIGlmIChjID49IDB4MDAgJiYgYyA8PSAweDA4KSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoYyA9PT0gMHgwQikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKGMgPj0gMHgwRSAmJiBjIDw9IDB4MUYpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChjID49IDB4N0YgJiYgYyA8PSAweDlGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBvdXQgb2YgcmFuZ2VcbiAgaWYgKGMgPiAweDEwRkZGRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGZyb21Db2RlUG9pbnQoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICBpZiAoYyA+IDB4ZmZmZikge1xuICAgIGMgLT0gMHgxMDAwMDtcbiAgICB2YXIgc3Vycm9nYXRlMSA9IDB4ZDgwMCArIChjID4+IDEwKSxcbiAgICAgICAgc3Vycm9nYXRlMiA9IDB4ZGMwMCArIChjICYgMHgzZmYpO1xuXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoc3Vycm9nYXRlMSwgc3Vycm9nYXRlMik7XG4gIH1cbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG59XG5cbnZhciBOQU1FRF9FTlRJVFlfUkUgICA9IC8mKFthLXojXVthLXowLTldezEsMzF9KTsvZ2k7XG52YXIgRElHSVRBTF9FTlRJVFlfVEVTVF9SRSA9IC9eIygoPzp4W2EtZjAtOV17MSw4fXxbMC05XXsxLDh9KSkvaTtcbnZhciBlbnRpdGllcyA9IHJlcXVpcmUoJy4vZW50aXRpZXMnKTtcblxuZnVuY3Rpb24gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIG5hbWUpIHtcbiAgdmFyIGNvZGUgPSAwO1xuXG4gIGlmIChoYXMoZW50aXRpZXMsIG5hbWUpKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW25hbWVdO1xuICB9IGVsc2UgaWYgKG5hbWUuY2hhckNvZGVBdCgwKSA9PT0gMHgyMy8qICMgKi8gJiYgRElHSVRBTF9FTlRJVFlfVEVTVF9SRS50ZXN0KG5hbWUpKSB7XG4gICAgY29kZSA9IG5hbWVbMV0udG9Mb3dlckNhc2UoKSA9PT0gJ3gnID9cbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMiksIDE2KVxuICAgIDpcbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMSksIDEwKTtcbiAgICBpZiAoaXNWYWxpZEVudGl0eUNvZGUoY29kZSkpIHtcbiAgICAgIHJldHVybiBmcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2g7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VFbnRpdGllcyhzdHIpIHtcbiAgaWYgKHN0ci5pbmRleE9mKCcmJykgPCAwKSB7IHJldHVybiBzdHI7IH1cblxuICByZXR1cm4gc3RyLnJlcGxhY2UoTkFNRURfRU5USVRZX1JFLCByZXBsYWNlRW50aXR5UGF0dGVybik7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBIVE1MX0VTQ0FQRV9URVNUX1JFID0gL1smPD5cIl0vO1xudmFyIEhUTUxfRVNDQVBFX1JFUExBQ0VfUkUgPSAvWyY8PlwiXS9nO1xudmFyIEhUTUxfUkVQTEFDRU1FTlRTID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90Oydcbn07XG5cbmZ1bmN0aW9uIHJlcGxhY2VVbnNhZmVDaGFyKGNoKSB7XG4gIHJldHVybiBIVE1MX1JFUExBQ0VNRU5UU1tjaF07XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUh0bWwoc3RyKSB7XG4gIGlmIChIVE1MX0VTQ0FQRV9URVNUX1JFLnRlc3Qoc3RyKSkge1xuICAgIHJldHVybiBzdHIucmVwbGFjZShIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFLCByZXBsYWNlVW5zYWZlQ2hhcik7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0cy5hc3NpZ24gICAgICAgICAgICA9IGFzc2lnbjtcbmV4cG9ydHMuaXNTdHJpbmcgICAgICAgICAgPSBpc1N0cmluZztcbmV4cG9ydHMuaGFzICAgICAgICAgICAgICAgPSBoYXM7XG5leHBvcnRzLnVuZXNjYXBlTWQgICAgICAgID0gdW5lc2NhcGVNZDtcbmV4cG9ydHMuaXNWYWxpZEVudGl0eUNvZGUgPSBpc1ZhbGlkRW50aXR5Q29kZTtcbmV4cG9ydHMuZnJvbUNvZGVQb2ludCAgICAgPSBmcm9tQ29kZVBvaW50O1xuZXhwb3J0cy5yZXBsYWNlRW50aXRpZXMgICA9IHJlcGxhY2VFbnRpdGllcztcbmV4cG9ydHMuZXNjYXBlSHRtbCAgICAgICAgPSBlc2NhcGVIdG1sO1xuIiwiLy8gQ29tbW9ubWFyayBkZWZhdWx0IG9wdGlvbnNcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBvcHRpb25zOiB7XG4gICAgaHRtbDogICAgICAgICB0cnVlLCAgICAgICAgIC8vIEVuYWJsZSBIVE1MIHRhZ3MgaW4gc291cmNlXG4gICAgeGh0bWxPdXQ6ICAgICB0cnVlLCAgICAgICAgIC8vIFVzZSAnLycgdG8gY2xvc2Ugc2luZ2xlIHRhZ3MgKDxiciAvPilcbiAgICBicmVha3M6ICAgICAgIGZhbHNlLCAgICAgICAgLy8gQ29udmVydCAnXFxuJyBpbiBwYXJhZ3JhcGhzIGludG8gPGJyPlxuICAgIGxhbmdQcmVmaXg6ICAgJ2xhbmd1YWdlLScsICAvLyBDU1MgbGFuZ3VhZ2UgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzXG4gICAgbGlua2lmeTogICAgICBmYWxzZSwgICAgICAgIC8vIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHRzIHRvIGxpbmtzXG4gICAgbGlua1RhcmdldDogICAnJywgICAgICAgICAgIC8vIHNldCB0YXJnZXQgdG8gb3BlbiBsaW5rIGluXG5cbiAgICAvLyBFbmFibGUgc29tZSBsYW5ndWFnZS1uZXV0cmFsIHJlcGxhY2VtZW50cyArIHF1b3RlcyBiZWF1dGlmaWNhdGlvblxuICAgIHR5cG9ncmFwaGVyOiAgZmFsc2UsXG5cbiAgICAvLyBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50IHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQsXG4gICAgLy8gYW5kIHNtYXJ0cXVvdGVzIG9uLiBTZXQgZG91YmxlcyB0byAnwqvCuycgZm9yIFJ1c3NpYW4sICfigJ7igJwnIGZvciBHZXJtYW4uXG4gICAgcXVvdGVzOiAn4oCc4oCd4oCY4oCZJyxcblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiBpbnB1dCBub3QgY2hhbmdlZFxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgIDIwICAgICAgICAgICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2Jsb2NrJyxcbiAgICAgICAgJ2lubGluZScsXG4gICAgICAgICdyZWZlcmVuY2VzJyxcbiAgICAgICAgJ2FiYnIyJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2Jsb2NrcXVvdGUnLFxuICAgICAgICAnY29kZScsXG4gICAgICAgICdmZW5jZXMnLFxuICAgICAgICAnaGVhZGluZycsXG4gICAgICAgICdocicsXG4gICAgICAgICdodG1sYmxvY2snLFxuICAgICAgICAnbGhlYWRpbmcnLFxuICAgICAgICAnbGlzdCcsXG4gICAgICAgICdwYXJhZ3JhcGgnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2F1dG9saW5rJyxcbiAgICAgICAgJ2JhY2t0aWNrcycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdlbnRpdHknLFxuICAgICAgICAnZXNjYXBlJyxcbiAgICAgICAgJ2h0bWx0YWcnLFxuICAgICAgICAnbGlua3MnLFxuICAgICAgICAnbmV3bGluZScsXG4gICAgICAgICd0ZXh0J1xuICAgICAgXVxuICAgIH1cbiAgfVxufTtcbiIsIi8vIFJlbWFya2FibGUgZGVmYXVsdCBvcHRpb25zXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3B0aW9uczoge1xuICAgIGh0bWw6ICAgICAgICAgZmFsc2UsICAgICAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIHhodG1sT3V0OiAgICAgZmFsc2UsICAgICAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgYnJlYWtzOiAgICAgICBmYWxzZSwgICAgICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBsYW5nUHJlZml4OiAgICdsYW5ndWFnZS0nLCAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxpbmtpZnk6ICAgICAgZmFsc2UsICAgICAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuICAgIGxpbmtUYXJnZXQ6ICAgJycsICAgICAgICAgICAvLyBzZXQgdGFyZ2V0IHRvIG9wZW4gbGluayBpblxuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogIGZhbHNlLFxuXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gU2V0IGRvdWJsZXMgdG8gJ8KrwrsnIGZvciBSdXNzaWFuLCAn4oCe4oCcJyBmb3IgR2VybWFuLlxuICAgIHF1b3RlczogJ+KAnOKAneKAmOKAmScsXG5cbiAgICAvLyBIaWdobGlnaHRlciBmdW5jdGlvbi4gU2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwsXG4gICAgLy8gb3IgJycgaWYgaW5wdXQgbm90IGNoYW5nZWRcbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgbWF4TmVzdGluZzogICAyMCAgICAgICAgICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICB9LFxuXG4gIGNvbXBvbmVudHM6IHtcblxuICAgIGNvcmU6IHtcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnLFxuICAgICAgICAncmVmZXJlbmNlcycsXG4gICAgICAgICdyZXBsYWNlbWVudHMnLFxuICAgICAgICAnbGlua2lmeScsXG4gICAgICAgICdzbWFydHF1b3RlcycsXG4gICAgICAgICdyZWZlcmVuY2VzJyxcbiAgICAgICAgJ2FiYnIyJyxcbiAgICAgICAgJ2Zvb3Rub3RlX3RhaWwnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnYmxvY2txdW90ZScsXG4gICAgICAgICdjb2RlJyxcbiAgICAgICAgJ2ZlbmNlcycsXG4gICAgICAgICdoZWFkaW5nJyxcbiAgICAgICAgJ2hyJyxcbiAgICAgICAgJ2h0bWxibG9jaycsXG4gICAgICAgICdsaGVhZGluZycsXG4gICAgICAgICdsaXN0JyxcbiAgICAgICAgJ3BhcmFncmFwaCcsXG4gICAgICAgICd0YWJsZSdcbiAgICAgIF1cbiAgICB9LFxuXG4gICAgaW5saW5lOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnYXV0b2xpbmsnLFxuICAgICAgICAnYmFja3RpY2tzJyxcbiAgICAgICAgJ2RlbCcsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdlbnRpdHknLFxuICAgICAgICAnZXNjYXBlJyxcbiAgICAgICAgJ2Zvb3Rub3RlX3JlZicsXG4gICAgICAgICdodG1sdGFnJyxcbiAgICAgICAgJ2xpbmtzJyxcbiAgICAgICAgJ25ld2xpbmUnLFxuICAgICAgICAndGV4dCdcbiAgICAgIF1cbiAgICB9XG4gIH1cbn07XG4iLCIvLyBSZW1hcmthYmxlIGRlZmF1bHQgb3B0aW9uc1xuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9wdGlvbnM6IHtcbiAgICBodG1sOiAgICAgICAgIGZhbHNlLCAgICAgICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICB4aHRtbE91dDogICAgIGZhbHNlLCAgICAgICAgLy8gVXNlICcvJyB0byBjbG9zZSBzaW5nbGUgdGFncyAoPGJyIC8+KVxuICAgIGJyZWFrczogICAgICAgZmFsc2UsICAgICAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgbGFuZ1ByZWZpeDogICAnbGFuZ3VhZ2UtJywgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsaW5raWZ5OiAgICAgIGZhbHNlLCAgICAgICAgLy8gYXV0b2NvbnZlcnQgVVJMLWxpa2UgdGV4dHMgdG8gbGlua3NcbiAgICBsaW5rVGFyZ2V0OiAgICcnLCAgICAgICAgICAgLy8gc2V0IHRhcmdldCB0byBvcGVuIGxpbmsgaW5cblxuICAgIC8vIEVuYWJsZSBzb21lIGxhbmd1YWdlLW5ldXRyYWwgcmVwbGFjZW1lbnRzICsgcXVvdGVzIGJlYXV0aWZpY2F0aW9uXG4gICAgdHlwb2dyYXBoZXI6ICBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIFNldCBkb3VibGVzIHRvICfCq8K7JyBmb3IgUnVzc2lhbiwgJ+KAnuKAnCcgZm9yIEdlcm1hbi5cbiAgICBxdW90ZXM6ICAgICAgICfigJzigJ3igJjigJknLFxuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIGlucHV0IG5vdCBjaGFuZ2VkXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiAoLypzdHIsIGxhbmcqLykgeyByZXR1cm4gJyc7IH1cbiAgICAvL1xuICAgIGhpZ2hsaWdodDogICAgIG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgICAyMCAgICAgICAgICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICB9LFxuXG4gIGNvbXBvbmVudHM6IHtcbiAgICAvLyBEb24ndCByZXN0cmljdCBjb3JlL2Jsb2NrL2lubGluZSBydWxlc1xuICAgIGNvcmU6IHt9LFxuICAgIGJsb2NrOiB7fSxcbiAgICBpbmxpbmU6IHt9XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZXBsYWNlRW50aXRpZXMgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5yZXBsYWNlRW50aXRpZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9ybWFsaXplTGluayh1cmwpIHtcbiAgdmFyIG5vcm1hbGl6ZWQgPSByZXBsYWNlRW50aXRpZXModXJsKTtcbiAgLy8gV2Ugc2hvdWxkbid0IGNhcmUgYWJvdXQgdGhlIHJlc3VsdCBvZiBtYWxmb3JtZWQgVVJJcyxcbiAgLy8gYW5kIHNob3VsZCBub3QgdGhyb3cgYW4gZXhjZXB0aW9uLlxuICB0cnkge1xuICAgIG5vcm1hbGl6ZWQgPSBkZWNvZGVVUkkobm9ybWFsaXplZCk7XG4gIH0gY2F0Y2ggKGVycikge31cbiAgcmV0dXJuIGVuY29kZVVSSShub3JtYWxpemVkKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9ybWFsaXplUmVmZXJlbmNlKHN0cikge1xuICAvLyB1c2UgLnRvVXBwZXJDYXNlKCkgaW5zdGVhZCBvZiAudG9Mb3dlckNhc2UoKVxuICAvLyBoZXJlIHRvIGF2b2lkIGEgY29uZmxpY3Qgd2l0aCBPYmplY3QucHJvdG90eXBlXG4gIC8vIG1lbWJlcnMgKG1vc3Qgbm90YWJseSwgYF9fcHJvdG9fX2ApXG4gIHJldHVybiBzdHIudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKS50b1VwcGVyQ2FzZSgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgbm9ybWFsaXplTGluayA9IHJlcXVpcmUoJy4vbm9ybWFsaXplX2xpbmsnKTtcbnZhciB1bmVzY2FwZU1kICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVNZDtcblxuLyoqXG4gKiBQYXJzZSBsaW5rIGRlc3RpbmF0aW9uXG4gKlxuICogICAtIG9uIHN1Y2Nlc3MgaXQgcmV0dXJucyBhIHN0cmluZyBhbmQgdXBkYXRlcyBzdGF0ZS5wb3M7XG4gKiAgIC0gb24gZmFpbHVyZSBpdCByZXR1cm5zIG51bGxcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IHN0YXRlXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHBvc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZSwgcG9zKSB7XG4gIHZhciBjb2RlLCBsZXZlbCwgbGluayxcbiAgICAgIHN0YXJ0ID0gcG9zLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDNDIC8qIDwgKi8pIHtcbiAgICBwb3MrKztcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmIChjb2RlID09PSAweDBBIC8qIFxcbiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgIGlmIChjb2RlID09PSAweDNFIC8qID4gKi8pIHtcbiAgICAgICAgbGluayA9IG5vcm1hbGl6ZUxpbmsodW5lc2NhcGVNZChzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQgKyAxLCBwb3MpKSk7XG4gICAgICAgIGlmICghc3RhdGUucGFyc2VyLnZhbGlkYXRlTGluayhsaW5rKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgc3RhdGUucG9zID0gcG9zICsgMTtcbiAgICAgICAgc3RhdGUubGlua0NvbnRlbnQgPSBsaW5rO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjb2RlID09PSAweDVDIC8qIFxcICovICYmIHBvcyArIDEgPCBtYXgpIHtcbiAgICAgICAgcG9zICs9IDI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwb3MrKztcbiAgICB9XG5cbiAgICAvLyBubyBjbG9zaW5nICc+J1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIHRoaXMgc2hvdWxkIGJlIC4uLiB9IGVsc2UgeyAuLi4gYnJhbmNoXG5cbiAgbGV2ZWwgPSAwO1xuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICBpZiAoY29kZSA9PT0gMHgyMCkgeyBicmVhazsgfVxuXG4gICAgaWYgKGNvZGUgPiAweDA4ICYmIGNvZGUgPCAweDBlKSB7IGJyZWFrOyB9XG5cbiAgICBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAweDI4IC8qICggKi8pIHtcbiAgICAgIGxldmVsKys7XG4gICAgICBpZiAobGV2ZWwgPiAxKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09IDB4MjkgLyogKSAqLykge1xuICAgICAgbGV2ZWwtLTtcbiAgICAgIGlmIChsZXZlbCA8IDApIHsgYnJlYWs7IH1cbiAgICB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gcG9zKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxpbmsgPSB1bmVzY2FwZU1kKHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKSk7XG4gIGlmICghc3RhdGUucGFyc2VyLnZhbGlkYXRlTGluayhsaW5rKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBzdGF0ZS5saW5rQ29udGVudCA9IGxpbms7XG4gIHN0YXRlLnBvcyA9IHBvcztcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFBhcnNlIGxpbmsgbGFiZWxzXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhc3N1bWVzIHRoYXQgZmlyc3QgY2hhcmFjdGVyIChgW2ApIGFscmVhZHkgbWF0Y2hlcztcbiAqIHJldHVybnMgdGhlIGVuZCBvZiB0aGUgbGFiZWwuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBzdGF0ZVxuICogQHBhcmFtICB7TnVtYmVyfSBzdGFydFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhcnQpIHtcbiAgdmFyIGxldmVsLCBmb3VuZCwgbWFya2VyLFxuICAgICAgbGFiZWxFbmQgPSAtMSxcbiAgICAgIG1heCA9IHN0YXRlLnBvc01heCxcbiAgICAgIG9sZFBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIG9sZEZsYWcgPSBzdGF0ZS5pc0luTGFiZWw7XG5cbiAgaWYgKHN0YXRlLmlzSW5MYWJlbCkgeyByZXR1cm4gLTE7IH1cblxuICBpZiAoc3RhdGUubGFiZWxVbm1hdGNoZWRTY29wZXMpIHtcbiAgICBzdGF0ZS5sYWJlbFVubWF0Y2hlZFNjb3Blcy0tO1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMTtcbiAgc3RhdGUuaXNJbkxhYmVsID0gdHJ1ZTtcbiAgbGV2ZWwgPSAxO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBtYXgpIHtcbiAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpO1xuICAgIGlmIChtYXJrZXIgPT09IDB4NUIgLyogWyAqLykge1xuICAgICAgbGV2ZWwrKztcbiAgICB9IGVsc2UgaWYgKG1hcmtlciA9PT0gMHg1RCAvKiBdICovKSB7XG4gICAgICBsZXZlbC0tO1xuICAgICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGUucGFyc2VyLnNraXBUb2tlbihzdGF0ZSk7XG4gIH1cblxuICBpZiAoZm91bmQpIHtcbiAgICBsYWJlbEVuZCA9IHN0YXRlLnBvcztcbiAgICBzdGF0ZS5sYWJlbFVubWF0Y2hlZFNjb3BlcyA9IDA7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUubGFiZWxVbm1hdGNoZWRTY29wZXMgPSBsZXZlbCAtIDE7XG4gIH1cblxuICAvLyByZXN0b3JlIG9sZCBzdGF0ZVxuICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gIHN0YXRlLmlzSW5MYWJlbCA9IG9sZEZsYWc7XG5cbiAgcmV0dXJuIGxhYmVsRW5kO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgdW5lc2NhcGVNZCA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLnVuZXNjYXBlTWQ7XG5cbi8qKlxuICogUGFyc2UgbGluayB0aXRsZVxuICpcbiAqICAgLSBvbiBzdWNjZXNzIGl0IHJldHVybnMgYSBzdHJpbmcgYW5kIHVwZGF0ZXMgc3RhdGUucG9zO1xuICogICAtIG9uIGZhaWx1cmUgaXQgcmV0dXJucyBudWxsXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBzdGF0ZVxuICogQHBhcmFtICB7TnVtYmVyfSBwb3NcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VMaW5rVGl0bGUoc3RhdGUsIHBvcykge1xuICB2YXIgY29kZSxcbiAgICAgIHN0YXJ0ID0gcG9zLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAobWFya2VyICE9PSAweDIyIC8qIFwiICovICYmIG1hcmtlciAhPT0gMHgyNyAvKiAnICovICYmIG1hcmtlciAhPT0gMHgyOCAvKiAoICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBvcysrO1xuXG4gIC8vIGlmIG9wZW5pbmcgbWFya2VyIGlzIFwiKFwiLCBzd2l0Y2ggaXQgdG8gY2xvc2luZyBtYXJrZXIgXCIpXCJcbiAgaWYgKG1hcmtlciA9PT0gMHgyOCkgeyBtYXJrZXIgPSAweDI5OyB9XG5cbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjb2RlID09PSBtYXJrZXIpIHtcbiAgICAgIHN0YXRlLnBvcyA9IHBvcyArIDE7XG4gICAgICBzdGF0ZS5saW5rQ29udGVudCA9IHVuZXNjYXBlTWQoc3RhdGUuc3JjLnNsaWNlKHN0YXJ0ICsgMSwgcG9zKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTG9jYWwgZGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIGFzc2lnbiAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykuYXNzaWduO1xudmFyIFJlbmRlcmVyICAgICA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKTtcbnZhciBQYXJzZXJDb3JlICAgPSByZXF1aXJlKCcuL3BhcnNlcl9jb3JlJyk7XG52YXIgUGFyc2VyQmxvY2sgID0gcmVxdWlyZSgnLi9wYXJzZXJfYmxvY2snKTtcbnZhciBQYXJzZXJJbmxpbmUgPSByZXF1aXJlKCcuL3BhcnNlcl9pbmxpbmUnKTtcbnZhciBSdWxlciAgICAgICAgPSByZXF1aXJlKCcuL3J1bGVyJyk7XG5cbi8qKlxuICogUHJlc2V0IGNvbmZpZ3NcbiAqL1xuXG52YXIgY29uZmlnID0ge1xuICAnZGVmYXVsdCc6ICAgIHJlcXVpcmUoJy4vY29uZmlncy9kZWZhdWx0JyksXG4gICdmdWxsJzogICAgICAgcmVxdWlyZSgnLi9jb25maWdzL2Z1bGwnKSxcbiAgJ2NvbW1vbm1hcmsnOiByZXF1aXJlKCcuL2NvbmZpZ3MvY29tbW9ubWFyaycpXG59O1xuXG4vKipcbiAqIFRoZSBgU3RhdGVDb3JlYCBjbGFzcyBtYW5hZ2VzIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBgaW5zdGFuY2VgIFJlbWFya2FibGUgaW5zdGFuY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBgc3RyYCBNYXJrZG93biBzdHJpbmdcbiAqIEBwYXJhbSB7T2JqZWN0fSBgZW52YFxuICovXG5cbmZ1bmN0aW9uIFN0YXRlQ29yZShpbnN0YW5jZSwgc3RyLCBlbnYpIHtcbiAgdGhpcy5zcmMgPSBzdHI7XG4gIHRoaXMuZW52ID0gZW52O1xuICB0aGlzLm9wdGlvbnMgPSBpbnN0YW5jZS5vcHRpb25zO1xuICB0aGlzLnRva2VucyA9IFtdO1xuICB0aGlzLmlubGluZU1vZGUgPSBmYWxzZTtcblxuICB0aGlzLmlubGluZSA9IGluc3RhbmNlLmlubGluZTtcbiAgdGhpcy5ibG9jayA9IGluc3RhbmNlLmJsb2NrO1xuICB0aGlzLnJlbmRlcmVyID0gaW5zdGFuY2UucmVuZGVyZXI7XG4gIHRoaXMudHlwb2dyYXBoZXIgPSBpbnN0YW5jZS50eXBvZ3JhcGhlcjtcbn1cblxuLyoqXG4gKiBUaGUgbWFpbiBgUmVtYXJrYWJsZWAgY2xhc3MuIENyZWF0ZSBhbiBpbnN0YW5jZSBvZlxuICogYFJlbWFya2FibGVgIHdpdGggYSBgcHJlc2V0YCBhbmQvb3IgYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBgcHJlc2V0YCBJZiBubyBwcmVzZXQgaXMgZ2l2ZW4sIGBkZWZhdWx0YCBpcyB1c2VkLlxuICogQHBhcmFtIHtPYmplY3R9IGBvcHRpb25zYFxuICovXG5cbmZ1bmN0aW9uIFJlbWFya2FibGUocHJlc2V0LCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2YgcHJlc2V0ICE9PSAnc3RyaW5nJykge1xuICAgIG9wdGlvbnMgPSBwcmVzZXQ7XG4gICAgcHJlc2V0ID0gJ2RlZmF1bHQnO1xuICB9XG5cbiAgdGhpcy5pbmxpbmUgICA9IG5ldyBQYXJzZXJJbmxpbmUoKTtcbiAgdGhpcy5ibG9jayAgICA9IG5ldyBQYXJzZXJCbG9jaygpO1xuICB0aGlzLmNvcmUgICAgID0gbmV3IFBhcnNlckNvcmUoKTtcbiAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpO1xuICB0aGlzLnJ1bGVyICAgID0gbmV3IFJ1bGVyKCk7XG5cbiAgdGhpcy5vcHRpb25zICA9IHt9O1xuICB0aGlzLmNvbmZpZ3VyZShjb25maWdbcHJlc2V0XSk7XG4gIHRoaXMuc2V0KG9wdGlvbnMgfHwge30pO1xufVxuXG4vKipcbiAqIFNldCBvcHRpb25zIGFzIGFuIGFsdGVybmF0aXZlIHRvIHBhc3NpbmcgdGhlbVxuICogdG8gdGhlIGNvbnN0cnVjdG9yLlxuICpcbiAqIGBgYGpzXG4gKiBtZC5zZXQoe3R5cG9ncmFwaGVyOiB0cnVlfSk7XG4gKiBgYGBcbiAqIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2BcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVtYXJrYWJsZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIEJhdGNoIGxvYWRlciBmb3IgY29tcG9uZW50cyBydWxlcyBzdGF0ZXMsIGFuZCBvcHRpb25zXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBgcHJlc2V0c2BcbiAqL1xuXG5SZW1hcmthYmxlLnByb3RvdHlwZS5jb25maWd1cmUgPSBmdW5jdGlvbiAocHJlc2V0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCFwcmVzZXRzKSB7IHRocm93IG5ldyBFcnJvcignV3JvbmcgYHJlbWFya2FibGVgIHByZXNldCwgY2hlY2sgbmFtZS9jb250ZW50Jyk7IH1cbiAgaWYgKHByZXNldHMub3B0aW9ucykgeyBzZWxmLnNldChwcmVzZXRzLm9wdGlvbnMpOyB9XG4gIGlmIChwcmVzZXRzLmNvbXBvbmVudHMpIHtcbiAgICBPYmplY3Qua2V5cyhwcmVzZXRzLmNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpIHtcbiAgICAgICAgc2VsZltuYW1lXS5ydWxlci5lbmFibGUocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBVc2UgYSBwbHVnaW4uXG4gKlxuICogYGBganNcbiAqIHZhciBtZCA9IG5ldyBSZW1hcmthYmxlKCk7XG4gKlxuICogbWQudXNlKHBsdWdpbjEpXG4gKiAgIC51c2UocGx1Z2luMiwgb3B0cylcbiAqICAgLnVzZShwbHVnaW4zKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBgcGx1Z2luYFxuICogQHBhcmFtICB7T2JqZWN0fSBgb3B0aW9uc2BcbiAqIEByZXR1cm4ge09iamVjdH0gYFJlbWFya2FibGVgIGZvciBjaGFpbmluZ1xuICovXG5cblJlbWFya2FibGUucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uIChwbHVnaW4sIG9wdGlvbnMpIHtcbiAgcGx1Z2luKHRoaXMsIG9wdGlvbnMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBQYXJzZSB0aGUgaW5wdXQgYHN0cmluZ2AgYW5kIHJldHVybiBhIHRva2VucyBhcnJheS5cbiAqIE1vZGlmaWVzIGBlbnZgIHdpdGggZGVmaW5pdGlvbnMgZGF0YS5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGBzdHJpbmdgXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBlbnZgXG4gKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgb2YgdG9rZW5zXG4gKi9cblxuUmVtYXJrYWJsZS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBlbnYpIHtcbiAgdmFyIHN0YXRlID0gbmV3IFN0YXRlQ29yZSh0aGlzLCBzdHIsIGVudik7XG4gIHRoaXMuY29yZS5wcm9jZXNzKHN0YXRlKTtcbiAgcmV0dXJuIHN0YXRlLnRva2Vucztcbn07XG5cbi8qKlxuICogVGhlIG1haW4gYC5yZW5kZXIoKWAgbWV0aG9kIHRoYXQgZG9lcyBhbGwgdGhlIG1hZ2ljIDopXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBgc3RyaW5nYFxuICogQHBhcmFtICB7T2JqZWN0fSBgZW52YFxuICogQHJldHVybiB7U3RyaW5nfSBSZW5kZXJlZCBIVE1MLlxuICovXG5cblJlbWFya2FibGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChzdHIsIGVudikge1xuICBlbnYgPSBlbnYgfHwge307XG4gIHJldHVybiB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnBhcnNlKHN0ciwgZW52KSwgdGhpcy5vcHRpb25zLCBlbnYpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gY29udGVudCBgc3RyaW5nYCBhcyBhIHNpbmdsZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBgc3RyaW5nYFxuICogQHBhcmFtICB7T2JqZWN0fSBgZW52YFxuICogQHJldHVybiB7QXJyYXl9IEFycmF5IG9mIHRva2Vuc1xuICovXG5cblJlbWFya2FibGUucHJvdG90eXBlLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHN0ciwgZW52KSB7XG4gIHZhciBzdGF0ZSA9IG5ldyBTdGF0ZUNvcmUodGhpcywgc3RyLCBlbnYpO1xuICBzdGF0ZS5pbmxpbmVNb2RlID0gdHJ1ZTtcbiAgdGhpcy5jb3JlLnByb2Nlc3Moc3RhdGUpO1xuICByZXR1cm4gc3RhdGUudG9rZW5zO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgYSBzaW5nbGUgY29udGVudCBgc3RyaW5nYCwgd2l0aG91dCB3cmFwcGluZyBpdFxuICogdG8gcGFyYWdyYXBoc1xuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gYHN0cmBcbiAqIEBwYXJhbSAge09iamVjdH0gYGVudmBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5SZW1hcmthYmxlLnByb3RvdHlwZS5yZW5kZXJJbmxpbmUgPSBmdW5jdGlvbiAoc3RyLCBlbnYpIHtcbiAgZW52ID0gZW52IHx8IHt9O1xuICByZXR1cm4gdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5wYXJzZUlubGluZShzdHIsIGVudiksIHRoaXMub3B0aW9ucywgZW52KTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBSZW1hcmthYmxlYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUmVtYXJrYWJsZTtcblxuLyoqXG4gKiBFeHBvc2UgYHV0aWxzYCwgVXNlZnVsIGhlbHBlciBmdW5jdGlvbnMgZm9yIGN1c3RvbVxuICogcmVuZGVyaW5nLlxuICovXG5cbm1vZHVsZS5leHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi9jb21tb24vdXRpbHMnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBMb2NhbCBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgUnVsZXIgICAgICA9IHJlcXVpcmUoJy4vcnVsZXInKTtcbnZhciBTdGF0ZUJsb2NrID0gcmVxdWlyZSgnLi9ydWxlc19ibG9jay9zdGF0ZV9ibG9jaycpO1xuXG4vKipcbiAqIFBhcnNlciBydWxlc1xuICovXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ2NvZGUnLCAgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2NvZGUnKSBdLFxuICBbICdmZW5jZXMnLCAgICAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9mZW5jZXMnKSwgICAgIFsgJ3BhcmFncmFwaCcsICdibG9ja3F1b3RlJywgJ2xpc3QnIF0gXSxcbiAgWyAnYmxvY2txdW90ZScsIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svYmxvY2txdW90ZScpLCBbICdwYXJhZ3JhcGgnLCAnYmxvY2txdW90ZScsICdsaXN0JyBdIF0sXG4gIFsgJ2hyJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2hyJyksICAgICAgICAgWyAncGFyYWdyYXBoJywgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcgXSBdLFxuICBbICdsaXN0JywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9saXN0JyksICAgICAgIFsgJ3BhcmFncmFwaCcsICdibG9ja3F1b3RlJyBdIF0sXG4gIFsgJ2Zvb3Rub3RlJywgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2Zvb3Rub3RlJyksICAgWyAncGFyYWdyYXBoJyBdIF0sXG4gIFsgJ2hlYWRpbmcnLCAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2hlYWRpbmcnKSwgICAgWyAncGFyYWdyYXBoJywgJ2Jsb2NrcXVvdGUnIF0gXSxcbiAgWyAnbGhlYWRpbmcnLCAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svbGhlYWRpbmcnKSBdLFxuICBbICdodG1sYmxvY2snLCAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9odG1sYmxvY2snKSwgIFsgJ3BhcmFncmFwaCcsICdibG9ja3F1b3RlJyBdIF0sXG4gIFsgJ3RhYmxlJywgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL3RhYmxlJyksICAgICAgWyAncGFyYWdyYXBoJyBdIF0sXG4gIFsgJ2RlZmxpc3QnLCAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2RlZmxpc3QnKSwgICAgWyAncGFyYWdyYXBoJyBdIF0sXG4gIFsgJ3BhcmFncmFwaCcsICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL3BhcmFncmFwaCcpIF1cbl07XG5cbi8qKlxuICogQmxvY2sgUGFyc2VyIGNsYXNzXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gUGFyc2VyQmxvY2soKSB7XG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBfcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyLnB1c2goX3J1bGVzW2ldWzBdLCBfcnVsZXNbaV1bMV0sIHtcbiAgICAgIGFsdDogKF9ydWxlc1tpXVsyXSB8fCBbXSkuc2xpY2UoKVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdG9rZW5zIGZvciB0aGUgZ2l2ZW4gaW5wdXQgcmFuZ2UuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBgc3RhdGVgIEhhcyBwcm9wZXJ0aWVzIGxpa2UgYHNyY2AsIGBwYXJzZXJgLCBgb3B0aW9uc2AgZXRjXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGBzdGFydExpbmVgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGBlbmRMaW5lYFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUGFyc2VyQmxvY2sucHJvdG90eXBlLnRva2VuaXplID0gZnVuY3Rpb24gKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUpIHtcbiAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlci5nZXRSdWxlcygnJyk7XG4gIHZhciBsZW4gPSBydWxlcy5sZW5ndGg7XG4gIHZhciBsaW5lID0gc3RhcnRMaW5lO1xuICB2YXIgaGFzRW1wdHlMaW5lcyA9IGZhbHNlO1xuICB2YXIgb2ssIGk7XG5cbiAgd2hpbGUgKGxpbmUgPCBlbmRMaW5lKSB7XG4gICAgc3RhdGUubGluZSA9IGxpbmUgPSBzdGF0ZS5za2lwRW1wdHlMaW5lcyhsaW5lKTtcbiAgICBpZiAobGluZSA+PSBlbmRMaW5lKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBUZXJtaW5hdGlvbiBjb25kaXRpb24gZm9yIG5lc3RlZCBjYWxscy5cbiAgICAvLyBOZXN0ZWQgY2FsbHMgY3VycmVudGx5IHVzZWQgZm9yIGJsb2NrcXVvdGVzICYgbGlzdHNcbiAgICBpZiAoc3RhdGUudFNoaWZ0W2xpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBUcnkgYWxsIHBvc3NpYmxlIHJ1bGVzLlxuICAgIC8vIE9uIHN1Y2Nlc3MsIHJ1bGUgc2hvdWxkOlxuICAgIC8vXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLmxpbmVgXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnRva2Vuc2BcbiAgICAvLyAtIHJldHVybiB0cnVlXG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIGxpbmUsIGVuZExpbmUsIGZhbHNlKTtcbiAgICAgIGlmIChvaykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgc3RhdGUudGlnaHQgaWZmIHdlIGhhZCBhbiBlbXB0eSBsaW5lIGJlZm9yZSBjdXJyZW50IHRhZ1xuICAgIC8vIGkuZS4gbGF0ZXN0IGVtcHR5IGxpbmUgc2hvdWxkIG5vdCBjb3VudFxuICAgIHN0YXRlLnRpZ2h0ID0gIWhhc0VtcHR5TGluZXM7XG5cbiAgICAvLyBwYXJhZ3JhcGggbWlnaHQgXCJlYXRcIiBvbmUgbmV3bGluZSBhZnRlciBpdCBpbiBuZXN0ZWQgbGlzdHNcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShzdGF0ZS5saW5lIC0gMSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgIH1cblxuICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuXG4gICAgaWYgKGxpbmUgPCBlbmRMaW5lICYmIHN0YXRlLmlzRW1wdHkobGluZSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgICAgbGluZSsrO1xuXG4gICAgICAvLyB0d28gZW1wdHkgbGluZXMgc2hvdWxkIHN0b3AgdGhlIHBhcnNlciBpbiBsaXN0IG1vZGVcbiAgICAgIGlmIChsaW5lIDwgZW5kTGluZSAmJiBzdGF0ZS5wYXJlbnRUeXBlID09PSAnbGlzdCcgJiYgc3RhdGUuaXNFbXB0eShsaW5lKSkgeyBicmVhazsgfVxuICAgICAgc3RhdGUubGluZSA9IGxpbmU7XG4gICAgfVxuICB9XG59O1xuXG52YXIgVEFCU19TQ0FOX1JFID0gL1tcXG5cXHRdL2c7XG52YXIgTkVXTElORVNfUkUgID0gL1xccltcXG5cXHUwMDg1XXxbXFx1MjQyNFxcdTIwMjhcXHUwMDg1XS9nO1xudmFyIFNQQUNFU19SRSAgICA9IC9cXHUwMGEwL2c7XG5cbi8qKlxuICogVG9rZW5pemUgdGhlIGdpdmVuIGBzdHJgLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gYHN0cmAgU291cmNlIHN0cmluZ1xuICogQHBhcmFtICB7T2JqZWN0fSBgb3B0aW9uc2BcbiAqIEBwYXJhbSAge09iamVjdH0gYGVudmBcbiAqIEBwYXJhbSAge0FycmF5fSBgb3V0VG9rZW5zYFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUGFyc2VyQmxvY2sucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgb3B0aW9ucywgZW52LCBvdXRUb2tlbnMpIHtcbiAgdmFyIHN0YXRlLCBsaW5lU3RhcnQgPSAwLCBsYXN0VGFiUG9zID0gMDtcbiAgaWYgKCFzdHIpIHsgcmV0dXJuIFtdOyB9XG5cbiAgLy8gTm9ybWFsaXplIHNwYWNlc1xuICBzdHIgPSBzdHIucmVwbGFjZShTUEFDRVNfUkUsICcgJyk7XG5cbiAgLy8gTm9ybWFsaXplIG5ld2xpbmVzXG4gIHN0ciA9IHN0ci5yZXBsYWNlKE5FV0xJTkVTX1JFLCAnXFxuJyk7XG5cbiAgLy8gUmVwbGFjZSB0YWJzIHdpdGggcHJvcGVyIG51bWJlciBvZiBzcGFjZXMgKDEuLjQpXG4gIGlmIChzdHIuaW5kZXhPZignXFx0JykgPj0gMCkge1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKFRBQlNfU0NBTl9SRSwgZnVuY3Rpb24gKG1hdGNoLCBvZmZzZXQpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBpZiAoc3RyLmNoYXJDb2RlQXQob2Zmc2V0KSA9PT0gMHgwQSkge1xuICAgICAgICBsaW5lU3RhcnQgPSBvZmZzZXQgKyAxO1xuICAgICAgICBsYXN0VGFiUG9zID0gMDtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gJyAgICAnLnNsaWNlKChvZmZzZXQgLSBsaW5lU3RhcnQgLSBsYXN0VGFiUG9zKSAlIDQpO1xuICAgICAgbGFzdFRhYlBvcyA9IG9mZnNldCAtIGxpbmVTdGFydCArIDE7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGUgPSBuZXcgU3RhdGVCbG9jayhzdHIsIHRoaXMsIG9wdGlvbnMsIGVudiwgb3V0VG9rZW5zKTtcbiAgdGhpcy50b2tlbml6ZShzdGF0ZSwgc3RhdGUubGluZSwgc3RhdGUubGluZU1heCk7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgUGFyc2VyQmxvY2tgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBQYXJzZXJCbG9jaztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBMb2NhbCBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgUnVsZXIgPSByZXF1aXJlKCcuL3J1bGVyJyk7XG5cbi8qKlxuICogQ29yZSBwYXJzZXIgYHJ1bGVzYFxuICovXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ2Jsb2NrJywgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL2Jsb2NrJykgICAgICAgICAgXSxcbiAgWyAnYWJicicsICAgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvYWJicicpICAgICAgICAgICBdLFxuICBbICdyZWZlcmVuY2VzJywgICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9yZWZlcmVuY2VzJykgICAgIF0sXG4gIFsgJ2lubGluZScsICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL2lubGluZScpICAgICAgICAgXSxcbiAgWyAnZm9vdG5vdGVfdGFpbCcsICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvZm9vdG5vdGVfdGFpbCcpICBdLFxuICBbICdhYmJyMicsICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9hYmJyMicpICAgICAgICAgIF0sXG4gIFsgJ3JlcGxhY2VtZW50cycsICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cycpICAgXSxcbiAgWyAnc21hcnRxdW90ZXMnLCAgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvc21hcnRxdW90ZXMnKSAgICBdLFxuICBbICdsaW5raWZ5JywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9saW5raWZ5JykgICAgICAgIF1cbl07XG5cbi8qKlxuICogQ2xhc3MgZm9yIHRvcCBsZXZlbCAoYGNvcmVgKSBwYXJzZXIgcnVsZXNcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBDb3JlKCkge1xuICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIHJ1bGVzIHdpdGggdGhlIGdpdmVuIGBzdGF0ZWBcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBzdGF0ZWBcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkNvcmUucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgdmFyIGksIGwsIHJ1bGVzO1xuICBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpO1xuICBmb3IgKGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgQ29yZWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvcmU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTG9jYWwgZGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIFJ1bGVyICAgICAgID0gcmVxdWlyZSgnLi9ydWxlcicpO1xudmFyIFN0YXRlSW5saW5lID0gcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3RhdGVfaW5saW5lJyk7XG52YXIgdXRpbHMgICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbi91dGlscycpO1xuXG4vKipcbiAqIElubGluZSBQYXJzZXIgYHJ1bGVzYFxuICovXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ3RleHQnLCAgICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL3RleHQnKSBdLFxuICBbICduZXdsaW5lJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9uZXdsaW5lJykgXSxcbiAgWyAnZXNjYXBlJywgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvZXNjYXBlJykgXSxcbiAgWyAnYmFja3RpY2tzJywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvYmFja3RpY2tzJykgXSxcbiAgWyAnZGVsJywgICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvZGVsJykgXSxcbiAgWyAnaW5zJywgICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvaW5zJykgXSxcbiAgWyAnbWFyaycsICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvbWFyaycpIF0sXG4gIFsgJ2VtcGhhc2lzJywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzJykgXSxcbiAgWyAnc3ViJywgICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3ViJykgXSxcbiAgWyAnc3VwJywgICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3VwJykgXSxcbiAgWyAnbGlua3MnLCAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvbGlua3MnKSBdLFxuICBbICdmb290bm90ZV9pbmxpbmUnLCByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9mb290bm90ZV9pbmxpbmUnKSBdLFxuICBbICdmb290bm90ZV9yZWYnLCAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9mb290bm90ZV9yZWYnKSBdLFxuICBbICdhdXRvbGluaycsICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9hdXRvbGluaycpIF0sXG4gIFsgJ2h0bWx0YWcnLCAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2h0bWx0YWcnKSBdLFxuICBbICdlbnRpdHknLCAgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9lbnRpdHknKSBdXG5dO1xuXG4vKipcbiAqIElubGluZSBQYXJzZXIgY2xhc3MuIE5vdGUgdGhhdCBsaW5rIHZhbGlkYXRpb24gaXMgc3RyaWN0ZXJcbiAqIGluIFJlbWFya2FibGUgdGhhbiB3aGF0IGlzIHNwZWNpZmllZCBieSBDb21tb25NYXJrLiBJZiB5b3VcbiAqIHdhbnQgdG8gY2hhbmdlIHRoaXMgeW91IGNhbiB1c2UgYSBjdXN0b20gdmFsaWRhdG9yLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFBhcnNlcklubGluZSgpIHtcbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSk7XG4gIH1cblxuICAvLyBDYW4gYmUgb3ZlcnJpZGRlbiB3aXRoIGEgY3VzdG9tIHZhbGlkYXRvclxuICB0aGlzLnZhbGlkYXRlTGluayA9IHZhbGlkYXRlTGluaztcbn1cblxuLyoqXG4gKiBTa2lwIGEgc2luZ2xlIHRva2VuIGJ5IHJ1bm5pbmcgYWxsIHJ1bGVzIGluIHZhbGlkYXRpb24gbW9kZS5cbiAqIFJldHVybnMgYHRydWVgIGlmIGFueSBydWxlIHJlcG9ydHMgc3VjY2Vzcy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBzdGF0ZWBcbiAqIEBhcGkgcHJpdmFnZVxuICovXG5cblBhcnNlcklubGluZS5wcm90b3R5cGUuc2tpcFRva2VuID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gIHZhciBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpO1xuICB2YXIgbGVuID0gcnVsZXMubGVuZ3RoO1xuICB2YXIgcG9zID0gc3RhdGUucG9zO1xuICB2YXIgaSwgY2FjaGVkX3BvcztcblxuICBpZiAoKGNhY2hlZF9wb3MgPSBzdGF0ZS5jYWNoZUdldChwb3MpKSA+IDApIHtcbiAgICBzdGF0ZS5wb3MgPSBjYWNoZWRfcG9zO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChydWxlc1tpXShzdGF0ZSwgdHJ1ZSkpIHtcbiAgICAgIHN0YXRlLmNhY2hlU2V0KHBvcywgc3RhdGUucG9zKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS5wb3MrKztcbiAgc3RhdGUuY2FjaGVTZXQocG9zLCBzdGF0ZS5wb3MpO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSB0b2tlbnMgZm9yIHRoZSBnaXZlbiBpbnB1dCByYW5nZS5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBzdGF0ZWBcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblBhcnNlcklubGluZS5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlci5nZXRSdWxlcygnJyk7XG4gIHZhciBsZW4gPSBydWxlcy5sZW5ndGg7XG4gIHZhciBlbmQgPSBzdGF0ZS5wb3NNYXg7XG4gIHZhciBvaywgaTtcblxuICB3aGlsZSAoc3RhdGUucG9zIDwgZW5kKSB7XG5cbiAgICAvLyBUcnkgYWxsIHBvc3NpYmxlIHJ1bGVzLlxuICAgIC8vIE9uIHN1Y2Nlc3MsIHRoZSBydWxlIHNob3VsZDpcbiAgICAvL1xuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS5wb3NgXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnRva2Vuc2BcbiAgICAvLyAtIHJldHVybiB0cnVlXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBvayA9IHJ1bGVzW2ldKHN0YXRlLCBmYWxzZSk7XG5cbiAgICAgIGlmIChvaykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob2spIHtcbiAgICAgIGlmIChzdGF0ZS5wb3MgPj0gZW5kKSB7IGJyZWFrOyB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyY1tzdGF0ZS5wb3MrK107XG4gIH1cblxuICBpZiAoc3RhdGUucGVuZGluZykge1xuICAgIHN0YXRlLnB1c2hQZW5kaW5nKCk7XG4gIH1cbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGlucHV0IHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGBzdHJgXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBvcHRpb25zYFxuICogQHBhcmFtICB7T2JqZWN0fSBgZW52YFxuICogQHBhcmFtICB7QXJyYXl9IGBvdXRUb2tlbnNgXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5QYXJzZXJJbmxpbmUucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgb3B0aW9ucywgZW52LCBvdXRUb2tlbnMpIHtcbiAgdmFyIHN0YXRlID0gbmV3IFN0YXRlSW5saW5lKHN0ciwgdGhpcywgb3B0aW9ucywgZW52LCBvdXRUb2tlbnMpO1xuICB0aGlzLnRva2VuaXplKHN0YXRlKTtcbn07XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIGdpdmVuIGB1cmxgIGJ5IGNoZWNraW5nIGZvciBiYWQgcHJvdG9jb2xzLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gYHVybGBcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gdmFsaWRhdGVMaW5rKHVybCkge1xuICB2YXIgQkFEX1BST1RPQ09MUyA9IFsgJ3Zic2NyaXB0JywgJ2phdmFzY3JpcHQnLCAnZmlsZScgXTtcbiAgdmFyIHN0ciA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgLy8gQ2FyZSBhYm91dCBkaWdpdGFsIGVudGl0aWVzIFwiamF2YXNjcmlwdCYjeDNBO2FsZXJ0KDEpXCJcbiAgc3RyID0gdXRpbHMucmVwbGFjZUVudGl0aWVzKHN0cik7XG4gIGlmIChzdHIuaW5kZXhPZignOicpICE9PSAtMSAmJiBCQURfUFJPVE9DT0xTLmluZGV4T2Yoc3RyLnNwbGl0KCc6JylbMF0pICE9PSAtMSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBFeHBvc2UgYFBhcnNlcklubGluZWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnNlcklubGluZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBMb2NhbCBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL2NvbW1vbi91dGlscycpO1xudmFyIHJ1bGVzID0gcmVxdWlyZSgnLi9ydWxlcycpO1xuXG4vKipcbiAqIEV4cG9zZSBgUmVuZGVyZXJgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcblxuLyoqXG4gKiBSZW5kZXJlciBjbGFzcy4gUmVuZGVycyBIVE1MIGFuZCBleHBvc2VzIGBydWxlc2AgdG8gYWxsb3dcbiAqIGxvY2FsIG1vZGlmaWNhdGlvbnMuXG4gKi9cblxuZnVuY3Rpb24gUmVuZGVyZXIoKSB7XG4gIHRoaXMucnVsZXMgPSB1dGlscy5hc3NpZ24oe30sIHJ1bGVzKTtcblxuICAvLyBleHBvcnRlZCBoZWxwZXIsIGZvciBjdXN0b20gcnVsZXMgb25seVxuICB0aGlzLmdldEJyZWFrID0gcnVsZXMuZ2V0QnJlYWs7XG59XG5cbi8qKlxuICogUmVuZGVyIGEgc3RyaW5nIG9mIGlubGluZSBIVE1MIHdpdGggdGhlIGdpdmVuIGB0b2tlbnNgIGFuZFxuICogYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSBgdG9rZW5zYFxuICogQHBhcmFtICB7T2JqZWN0fSBgb3B0aW9uc2BcbiAqIEBwYXJhbSAge09iamVjdH0gYGVudmBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICB2YXIgX3J1bGVzID0gdGhpcy5ydWxlcztcbiAgdmFyIGxlbiA9IHRva2Vucy5sZW5ndGgsIGkgPSAwO1xuICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgd2hpbGUgKGxlbi0tKSB7XG4gICAgcmVzdWx0ICs9IF9ydWxlc1t0b2tlbnNbaV0udHlwZV0odG9rZW5zLCBpKyssIG9wdGlvbnMsIGVudiwgdGhpcyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW5kZXIgYSBzdHJpbmcgb2YgSFRNTCB3aXRoIHRoZSBnaXZlbiBgdG9rZW5zYCBhbmRcbiAqIGBvcHRpb25zYC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gYHRva2Vuc2BcbiAqIEBwYXJhbSAge09iamVjdH0gYG9wdGlvbnNgXG4gKiBAcGFyYW0gIHtPYmplY3R9IGBlbnZgXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAodG9rZW5zLCBvcHRpb25zLCBlbnYpIHtcbiAgdmFyIF9ydWxlcyA9IHRoaXMucnVsZXM7XG4gIHZhciBsZW4gPSB0b2tlbnMubGVuZ3RoLCBpID0gLTE7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgaWYgKHRva2Vuc1tpXS50eXBlID09PSAnaW5saW5lJykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVySW5saW5lKHRva2Vuc1tpXS5jaGlsZHJlbiwgb3B0aW9ucywgZW52KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IF9ydWxlc1t0b2tlbnNbaV0udHlwZV0odG9rZW5zLCBpLCBvcHRpb25zLCBlbnYsIHRoaXMpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSdWxlciBpcyBhIGhlbHBlciBjbGFzcyBmb3IgYnVpbGRpbmcgcmVzcG9uc2liaWxpdHkgY2hhaW5zIGZyb21cbiAqIHBhcnNlIHJ1bGVzLiBJdCBhbGxvd3M6XG4gKlxuICogICAtIGVhc3kgc3RhY2sgcnVsZXMgY2hhaW5zXG4gKiAgIC0gZ2V0dGluZyBtYWluIGNoYWluIGFuZCBuYW1lZCBjaGFpbnMgY29udGVudCAoYXMgYXJyYXlzIG9mIGZ1bmN0aW9ucylcbiAqXG4gKiBIZWxwZXIgbWV0aG9kcywgc2hvdWxkIG5vdCBiZSB1c2VkIGRpcmVjdGx5LlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gUnVsZXIoKSB7XG4gIC8vIExpc3Qgb2YgYWRkZWQgcnVsZXMuIEVhY2ggZWxlbWVudCBpczpcbiAgLy9cbiAgLy8geyBuYW1lOiBYWFgsXG4gIC8vICAgZW5hYmxlZDogQm9vbGVhbixcbiAgLy8gICBmbjogRnVuY3Rpb24oKSxcbiAgLy8gICBhbHQ6IFsgbmFtZTIsIG5hbWUzIF0gfVxuICAvL1xuICB0aGlzLl9fcnVsZXNfXyA9IFtdO1xuXG4gIC8vIENhY2hlZCBydWxlIGNoYWlucy5cbiAgLy9cbiAgLy8gRmlyc3QgbGV2ZWwgLSBjaGFpbiBuYW1lLCAnJyBmb3IgZGVmYXVsdC5cbiAgLy8gU2Vjb25kIGxldmVsIC0gZGlnaXRhbCBhbmNob3IgZm9yIGZhc3QgZmlsdGVyaW5nIGJ5IGNoYXJjb2Rlcy5cbiAgLy9cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIGluZGV4IG9mIGEgcnVsZSBieSBgbmFtZWAuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBgbmFtZWBcbiAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIGdpdmVuIGBuYW1lYFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUnVsZXIucHJvdG90eXBlLl9fZmluZF9fID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgdmFyIGxlbiA9IHRoaXMuX19ydWxlc19fLmxlbmd0aDtcbiAgdmFyIGkgPSAtMTtcblxuICB3aGlsZSAobGVuLS0pIHtcbiAgICBpZiAodGhpcy5fX3J1bGVzX19bKytpXS5uYW1lID09PSBuYW1lKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufTtcblxuLyoqXG4gKiBCdWlsZCB0aGUgcnVsZXMgbG9va3VwIGNhY2hlXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUnVsZXIucHJvdG90eXBlLl9fY29tcGlsZV9fID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjaGFpbnMgPSBbICcnIF07XG5cbiAgLy8gY29sbGVjdCB1bmlxdWUgbmFtZXNcbiAgc2VsZi5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgIGlmICghcnVsZS5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcnVsZS5hbHQuZm9yRWFjaChmdW5jdGlvbiAoYWx0TmFtZSkge1xuICAgICAgaWYgKGNoYWlucy5pbmRleE9mKGFsdE5hbWUpIDwgMCkge1xuICAgICAgICBjaGFpbnMucHVzaChhbHROYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgc2VsZi5fX2NhY2hlX18gPSB7fTtcblxuICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICBzZWxmLl9fY2FjaGVfX1tjaGFpbl0gPSBbXTtcbiAgICBzZWxmLl9fcnVsZXNfXy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICBpZiAoIXJ1bGUuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFpbiAmJiBydWxlLmFsdC5pbmRleE9mKGNoYWluKSA8IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VsZi5fX2NhY2hlX19bY2hhaW5dLnB1c2gocnVsZS5mbik7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBSdWxlciBwdWJsaWMgbWV0aG9kc1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBSZXBsYWNlIHJ1bGUgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGBuYW1lYCBSdWxlIG5hbWVcbiAqIEBwYXJhbSAge0Z1bmN0aW9uIGBmbmBcbiAqIEBwYXJhbSAge09iamVjdH0gYG9wdGlvbnNgXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SdWxlci5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAobmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgdmFyIGlkeCA9IHRoaXMuX19maW5kX18obmFtZSk7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmIChpZHggPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcbiAgfVxuXG4gIHRoaXMuX19ydWxlc19fW2lkeF0uZm4gPSBmbjtcbiAgdGhpcy5fX3J1bGVzX19baWR4XS5hbHQgPSBvcHQuYWx0IHx8IFtdO1xuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG4vKipcbiAqIEFkZCBhIHJ1bGUgdG8gdGhlIGNoYWluIGJlZm9yZSBnaXZlbiB0aGUgYHJ1bGVOYW1lYC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgYGJlZm9yZU5hbWVgXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgYHJ1bGVOYW1lYFxuICogQHBhcmFtICB7RnVuY3Rpb259IGBmbmBcbiAqIEBwYXJhbSAge09iamVjdH0gICBgb3B0aW9uc2BcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJ1bGVyLnByb3RvdHlwZS5iZWZvcmUgPSBmdW5jdGlvbiAoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIHZhciBpZHggPSB0aGlzLl9fZmluZF9fKGJlZm9yZU5hbWUpO1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcblxuICBpZiAoaWR4ID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgYmVmb3JlTmFtZSk7XG4gIH1cblxuICB0aGlzLl9fcnVsZXNfXy5zcGxpY2UoaWR4LCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbjogZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pO1xuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogQWRkIGEgcnVsZSB0byB0aGUgY2hhaW4gYWZ0ZXIgdGhlIGdpdmVuIGBydWxlTmFtZWAuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIGBhZnRlck5hbWVgXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgYHJ1bGVOYW1lYFxuICogQHBhcmFtICB7RnVuY3Rpb259IGBmbmBcbiAqIEBwYXJhbSAge09iamVjdH0gICBgb3B0aW9uc2BcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJ1bGVyLnByb3RvdHlwZS5hZnRlciA9IGZ1bmN0aW9uIChhZnRlck5hbWUsIHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICB2YXIgaWR4ID0gdGhpcy5fX2ZpbmRfXyhhZnRlck5hbWUpO1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcblxuICBpZiAoaWR4ID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgYWZ0ZXJOYW1lKTtcbiAgfVxuXG4gIHRoaXMuX19ydWxlc19fLnNwbGljZShpZHggKyAxLCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbjogZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pO1xuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogQWRkIGEgcnVsZSB0byB0aGUgZW5kIG9mIGNoYWluLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICBgcnVsZU5hbWVgXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gYGZuYFxuICogQHBhcmFtICB7T2JqZWN0fSAgIGBvcHRpb25zYFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cblJ1bGVyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcblxuICB0aGlzLl9fcnVsZXNfXy5wdXNoKHtcbiAgICBuYW1lOiBydWxlTmFtZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGZuOiBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSk7XG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xufTtcblxuLyoqXG4gKiBFbmFibGUgYSBydWxlIG9yIGxpc3Qgb2YgcnVsZXMuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfEFycmF5fSBgbGlzdGAgTmFtZSBvciBhcnJheSBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZVxuICogQHBhcmFtICB7Qm9vbGVhbn0gYHN0cmljdGAgSWYgYHRydWVgLCBhbGwgbm9uIGxpc3RlZCBydWxlcyB3aWxsIGJlIGRpc2FibGVkLlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUnVsZXIucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBzdHJpY3QpIHtcbiAgbGlzdCA9ICFBcnJheS5pc0FycmF5KGxpc3QpXG4gICAgPyBbIGxpc3QgXVxuICAgIDogbGlzdDtcblxuICAvLyBJbiBzdHJpY3QgbW9kZSBkaXNhYmxlIGFsbCBleGlzdGluZyBydWxlcyBmaXJzdFxuICBpZiAoc3RyaWN0KSB7XG4gICAgdGhpcy5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgcnVsZS5lbmFibGVkID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICAvLyBTZWFyY2ggYnkgbmFtZSBhbmQgZW5hYmxlXG4gIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBpZHggPSB0aGlzLl9fZmluZF9fKG5hbWUpO1xuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1J1bGVzIG1hbmFnZXI6IGludmFsaWQgcnVsZSBuYW1lICcgKyBuYW1lKTtcbiAgICB9XG4gICAgdGhpcy5fX3J1bGVzX19baWR4XS5lbmFibGVkID0gdHJ1ZTtcbiAgfSwgdGhpcyk7XG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xufTtcblxuXG4vKipcbiAqIERpc2FibGUgYSBydWxlIG9yIGxpc3Qgb2YgcnVsZXMuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfEFycmF5fSBgbGlzdGAgTmFtZSBvciBhcnJheSBvZiBydWxlIG5hbWVzIHRvIGRpc2FibGVcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJ1bGVyLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgbGlzdCA9ICFBcnJheS5pc0FycmF5KGxpc3QpXG4gICAgPyBbIGxpc3QgXVxuICAgIDogbGlzdDtcblxuICAvLyBTZWFyY2ggYnkgbmFtZSBhbmQgZGlzYWJsZVxuICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKTtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdWxlcyBtYW5hZ2VyOiBpbnZhbGlkIHJ1bGUgbmFtZSAnICsgbmFtZSk7XG4gICAgfVxuICAgIHRoaXMuX19ydWxlc19fW2lkeF0uZW5hYmxlZCA9IGZhbHNlO1xuICB9LCB0aGlzKTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG4vKipcbiAqIEdldCBhIHJ1bGVzIGxpc3QgYXMgYW4gYXJyYXkgb2YgZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gYGNoYWluTmFtZWBcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJ1bGVyLnByb3RvdHlwZS5nZXRSdWxlcyA9IGZ1bmN0aW9uIChjaGFpbk5hbWUpIHtcbiAgaWYgKHRoaXMuX19jYWNoZV9fID09PSBudWxsKSB7XG4gICAgdGhpcy5fX2NvbXBpbGVfXygpO1xuICB9XG4gIHJldHVybiB0aGlzLl9fY2FjaGVfX1tjaGFpbk5hbWVdO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYFJ1bGVyYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUnVsZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTG9jYWwgZGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIGhhcyAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykuaGFzO1xudmFyIHVuZXNjYXBlTWQgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVNZDtcbnZhciByZXBsYWNlRW50aXRpZXMgPSByZXF1aXJlKCcuL2NvbW1vbi91dGlscycpLnJlcGxhY2VFbnRpdGllcztcbnZhciBlc2NhcGVIdG1sICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbi91dGlscycpLmVzY2FwZUh0bWw7XG5cbi8qKlxuICogUmVuZGVyZXIgcnVsZXMgY2FjaGVcbiAqL1xuXG52YXIgcnVsZXMgPSB7fTtcblxuLyoqXG4gKiBCbG9ja3F1b3Rlc1xuICovXG5cbnJ1bGVzLmJsb2NrcXVvdGVfb3BlbiA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPGJsb2NrcXVvdGU+XFxuJztcbn07XG5cbnJ1bGVzLmJsb2NrcXVvdGVfY2xvc2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvYmxvY2txdW90ZT4nICsgZ2V0QnJlYWsodG9rZW5zLCBpZHgpO1xufTtcblxuLyoqXG4gKiBDb2RlXG4gKi9cblxucnVsZXMuY29kZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIGlmICh0b2tlbnNbaWR4XS5ibG9jaykge1xuICAgIHJldHVybiAnPHByZT48Y29kZT4nICsgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArICc8L2NvZGU+PC9wcmU+JyArIGdldEJyZWFrKHRva2VucywgaWR4KTtcbiAgfVxuICByZXR1cm4gJzxjb2RlPicgKyBlc2NhcGVIdG1sKHRva2Vuc1tpZHhdLmNvbnRlbnQpICsgJzwvY29kZT4nO1xufTtcblxuLyoqXG4gKiBGZW5jZWQgY29kZSBibG9ja3NcbiAqL1xuXG5ydWxlcy5mZW5jZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBpbnN0YW5jZSkge1xuICB2YXIgdG9rZW4gPSB0b2tlbnNbaWR4XTtcbiAgdmFyIGxhbmdDbGFzcyA9ICcnO1xuICB2YXIgbGFuZ1ByZWZpeCA9IG9wdGlvbnMubGFuZ1ByZWZpeDtcbiAgdmFyIGxhbmdOYW1lID0gJycsIGZlbmNlTmFtZTtcbiAgdmFyIGhpZ2hsaWdodGVkO1xuXG4gIGlmICh0b2tlbi5wYXJhbXMpIHtcblxuICAgIC8vXG4gICAgLy8gYGBgZm9vIGJhclxuICAgIC8vXG4gICAgLy8gVHJ5IGN1c3RvbSByZW5kZXJlciBcImZvb1wiIGZpcnN0LiBUaGF0IHdpbGwgc2ltcGxpZnkgb3ZlcndyaXRlXG4gICAgLy8gZm9yIGRpYWdyYW1zLCBsYXRleCwgYW5kIGFueSBvdGhlciBmZW5jZWQgYmxvY2sgd2l0aCBjdXN0b20gbG9va1xuICAgIC8vXG5cbiAgICBmZW5jZU5hbWUgPSB0b2tlbi5wYXJhbXMuc3BsaXQoL1xccysvZylbMF07XG5cbiAgICBpZiAoaGFzKGluc3RhbmNlLnJ1bGVzLmZlbmNlX2N1c3RvbSwgZmVuY2VOYW1lKSkge1xuICAgICAgcmV0dXJuIGluc3RhbmNlLnJ1bGVzLmZlbmNlX2N1c3RvbVtmZW5jZU5hbWVdKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIGluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBsYW5nTmFtZSA9IGVzY2FwZUh0bWwocmVwbGFjZUVudGl0aWVzKHVuZXNjYXBlTWQoZmVuY2VOYW1lKSkpO1xuICAgIGxhbmdDbGFzcyA9ICcgY2xhc3M9XCInICsgbGFuZ1ByZWZpeCArIGxhbmdOYW1lICsgJ1wiJztcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhpZ2hsaWdodCkge1xuICAgIGhpZ2hsaWdodGVkID0gb3B0aW9ucy5oaWdobGlnaHQodG9rZW4uY29udGVudCwgbGFuZ05hbWUpIHx8IGVzY2FwZUh0bWwodG9rZW4uY29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgaGlnaGxpZ2h0ZWQgPSBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpO1xuICB9XG5cbiAgcmV0dXJuICc8cHJlPjxjb2RlJyArIGxhbmdDbGFzcyArICc+J1xuICAgICAgICArIGhpZ2hsaWdodGVkXG4gICAgICAgICsgJzwvY29kZT48L3ByZT4nXG4gICAgICAgICsgZ2V0QnJlYWsodG9rZW5zLCBpZHgpO1xufTtcblxucnVsZXMuZmVuY2VfY3VzdG9tID0ge307XG5cbi8qKlxuICogSGVhZGluZ3NcbiAqL1xuXG5ydWxlcy5oZWFkaW5nX29wZW4gPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzxoJyArIHRva2Vuc1tpZHhdLmhMZXZlbCArICc+Jztcbn07XG5ydWxlcy5oZWFkaW5nX2Nsb3NlID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8L2gnICsgdG9rZW5zW2lkeF0uaExldmVsICsgJz5cXG4nO1xufTtcblxuLyoqXG4gKiBIb3Jpem9udGFsIHJ1bGVzXG4gKi9cblxucnVsZXMuaHIgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gKG9wdGlvbnMueGh0bWxPdXQgPyAnPGhyIC8+JyA6ICc8aHI+JykgKyBnZXRCcmVhayh0b2tlbnMsIGlkeCk7XG59O1xuXG4vKipcbiAqIEJ1bGxldHNcbiAqL1xuXG5ydWxlcy5idWxsZXRfbGlzdF9vcGVuID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8dWw+XFxuJztcbn07XG5ydWxlcy5idWxsZXRfbGlzdF9jbG9zZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC91bD4nICsgZ2V0QnJlYWsodG9rZW5zLCBpZHgpO1xufTtcblxuLyoqXG4gKiBMaXN0IGl0ZW1zXG4gKi9cblxucnVsZXMubGlzdF9pdGVtX29wZW4gPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzxsaT4nO1xufTtcbnJ1bGVzLmxpc3RfaXRlbV9jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC9saT5cXG4nO1xufTtcblxuLyoqXG4gKiBPcmRlcmVkIGxpc3QgaXRlbXNcbiAqL1xuXG5ydWxlcy5vcmRlcmVkX2xpc3Rfb3BlbiA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHZhciB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuICB2YXIgb3JkZXIgPSB0b2tlbi5vcmRlciA+IDEgPyAnIHN0YXJ0PVwiJyArIHRva2VuLm9yZGVyICsgJ1wiJyA6ICcnO1xuICByZXR1cm4gJzxvbCcgKyBvcmRlciArICc+XFxuJztcbn07XG5ydWxlcy5vcmRlcmVkX2xpc3RfY2xvc2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvb2w+JyArIGdldEJyZWFrKHRva2VucywgaWR4KTtcbn07XG5cbi8qKlxuICogUGFyYWdyYXBoc1xuICovXG5cbnJ1bGVzLnBhcmFncmFwaF9vcGVuID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIHRva2Vuc1tpZHhdLnRpZ2h0ID8gJycgOiAnPHA+Jztcbn07XG5ydWxlcy5wYXJhZ3JhcGhfY2xvc2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICB2YXIgYWRkQnJlYWsgPSAhKHRva2Vuc1tpZHhdLnRpZ2h0ICYmIGlkeCAmJiB0b2tlbnNbaWR4IC0gMV0udHlwZSA9PT0gJ2lubGluZScgJiYgIXRva2Vuc1tpZHggLSAxXS5jb250ZW50KTtcbiAgcmV0dXJuICh0b2tlbnNbaWR4XS50aWdodCA/ICcnIDogJzwvcD4nKSArIChhZGRCcmVhayA/IGdldEJyZWFrKHRva2VucywgaWR4KSA6ICcnKTtcbn07XG5cbi8qKlxuICogTGlua3NcbiAqL1xuXG5ydWxlcy5saW5rX29wZW4gPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyogZW52ICovKSB7XG4gIHZhciB0aXRsZSA9IHRva2Vuc1tpZHhdLnRpdGxlID8gKCcgdGl0bGU9XCInICsgZXNjYXBlSHRtbChyZXBsYWNlRW50aXRpZXModG9rZW5zW2lkeF0udGl0bGUpKSArICdcIicpIDogJyc7XG4gIHZhciB0YXJnZXQgPSBvcHRpb25zLmxpbmtUYXJnZXQgPyAoJyB0YXJnZXQ9XCInICsgb3B0aW9ucy5saW5rVGFyZ2V0ICsgJ1wiJykgOiAnJztcbiAgcmV0dXJuICc8YSBocmVmPVwiJyArIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uaHJlZikgKyAnXCInICsgdGl0bGUgKyB0YXJnZXQgKyAnPic7XG59O1xucnVsZXMubGlua19jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC9hPic7XG59O1xuXG4vKipcbiAqIEltYWdlc1xuICovXG5cbnJ1bGVzLmltYWdlID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zIC8qLCBlbnYgKi8pIHtcbiAgdmFyIHNyYyA9ICcgc3JjPVwiJyArIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uc3JjKSArICdcIic7XG4gIHZhciB0aXRsZSA9IHRva2Vuc1tpZHhdLnRpdGxlID8gKCcgdGl0bGU9XCInICsgZXNjYXBlSHRtbChyZXBsYWNlRW50aXRpZXModG9rZW5zW2lkeF0udGl0bGUpKSArICdcIicpIDogJyc7XG4gIHZhciBhbHQgPSAnIGFsdD1cIicgKyAodG9rZW5zW2lkeF0uYWx0ID8gZXNjYXBlSHRtbChyZXBsYWNlRW50aXRpZXModG9rZW5zW2lkeF0uYWx0KSkgOiAnJykgKyAnXCInO1xuICB2YXIgc3VmZml4ID0gb3B0aW9ucy54aHRtbE91dCA/ICcgLycgOiAnJztcbiAgcmV0dXJuICc8aW1nJyArIHNyYyArIGFsdCArIHRpdGxlICsgc3VmZml4ICsgJz4nO1xufTtcblxuLyoqXG4gKiBUYWJsZXNcbiAqL1xuXG5ydWxlcy50YWJsZV9vcGVuID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8dGFibGU+XFxuJztcbn07XG5ydWxlcy50YWJsZV9jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC90YWJsZT5cXG4nO1xufTtcbnJ1bGVzLnRoZWFkX29wZW4gPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzx0aGVhZD5cXG4nO1xufTtcbnJ1bGVzLnRoZWFkX2Nsb3NlID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8L3RoZWFkPlxcbic7XG59O1xucnVsZXMudGJvZHlfb3BlbiA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPHRib2R5Plxcbic7XG59O1xucnVsZXMudGJvZHlfY2xvc2UgPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvdGJvZHk+XFxuJztcbn07XG5ydWxlcy50cl9vcGVuID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8dHI+Jztcbn07XG5ydWxlcy50cl9jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC90cj5cXG4nO1xufTtcbnJ1bGVzLnRoX29wZW4gPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICB2YXIgdG9rZW4gPSB0b2tlbnNbaWR4XTtcbiAgcmV0dXJuICc8dGgnXG4gICAgKyAodG9rZW4uYWxpZ24gPyAnIHN0eWxlPVwidGV4dC1hbGlnbjonICsgdG9rZW4uYWxpZ24gKyAnXCInIDogJycpXG4gICAgKyAnPic7XG59O1xucnVsZXMudGhfY2xvc2UgPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvdGg+Jztcbn07XG5ydWxlcy50ZF9vcGVuID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgdmFyIHRva2VuID0gdG9rZW5zW2lkeF07XG4gIHJldHVybiAnPHRkJ1xuICAgICsgKHRva2VuLmFsaWduID8gJyBzdHlsZT1cInRleHQtYWxpZ246JyArIHRva2VuLmFsaWduICsgJ1wiJyA6ICcnKVxuICAgICsgJz4nO1xufTtcbnJ1bGVzLnRkX2Nsb3NlID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8L3RkPic7XG59O1xuXG4vKipcbiAqIEJvbGRcbiAqL1xuXG5ydWxlcy5zdHJvbmdfb3BlbiA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPHN0cm9uZz4nO1xufTtcbnJ1bGVzLnN0cm9uZ19jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC9zdHJvbmc+Jztcbn07XG5cbi8qKlxuICogSXRhbGljaXplXG4gKi9cblxucnVsZXMuZW1fb3BlbiA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPGVtPic7XG59O1xucnVsZXMuZW1fY2xvc2UgPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvZW0+Jztcbn07XG5cbi8qKlxuICogU3RyaWtldGhyb3VnaFxuICovXG5cbnJ1bGVzLmRlbF9vcGVuID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8ZGVsPic7XG59O1xucnVsZXMuZGVsX2Nsb3NlID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8L2RlbD4nO1xufTtcblxuLyoqXG4gKiBJbnNlcnRcbiAqL1xuXG5ydWxlcy5pbnNfb3BlbiA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPGlucz4nO1xufTtcbnJ1bGVzLmluc19jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC9pbnM+Jztcbn07XG5cbi8qKlxuICogSGlnaGxpZ2h0XG4gKi9cblxucnVsZXMubWFya19vcGVuID0gZnVuY3Rpb24gKC8qIHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8bWFyaz4nO1xufTtcbnJ1bGVzLm1hcmtfY2xvc2UgPSBmdW5jdGlvbiAoLyogdG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzwvbWFyaz4nO1xufTtcblxuLyoqXG4gKiBTdXBlci0gYW5kIHN1Yi1zY3JpcHRcbiAqL1xuXG5ydWxlcy5zdWIgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzxzdWI+JyArIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uY29udGVudCkgKyAnPC9zdWI+Jztcbn07XG5ydWxlcy5zdXAgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gJzxzdXA+JyArIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uY29udGVudCkgKyAnPC9zdXA+Jztcbn07XG5cbi8qKlxuICogQnJlYWtzXG4gKi9cblxucnVsZXMuaGFyZGJyZWFrID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zIC8qLCBlbnYgKi8pIHtcbiAgcmV0dXJuIG9wdGlvbnMueGh0bWxPdXQgPyAnPGJyIC8+XFxuJyA6ICc8YnI+XFxuJztcbn07XG5ydWxlcy5zb2Z0YnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy5icmVha3MgPyAob3B0aW9ucy54aHRtbE91dCA/ICc8YnIgLz5cXG4nIDogJzxicj5cXG4nKSA6ICdcXG4nO1xufTtcblxuLyoqXG4gKiBUZXh0XG4gKi9cblxucnVsZXMudGV4dCA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiBlc2NhcGVIdG1sKHRva2Vuc1tpZHhdLmNvbnRlbnQpO1xufTtcblxuLyoqXG4gKiBDb250ZW50XG4gKi9cblxucnVsZXMuaHRtbGJsb2NrID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIHRva2Vuc1tpZHhdLmNvbnRlbnQ7XG59O1xucnVsZXMuaHRtbHRhZyA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiB0b2tlbnNbaWR4XS5jb250ZW50O1xufTtcblxuLyoqXG4gKiBBYmJyZXZpYXRpb25zLCBpbml0aWFsaXNtXG4gKi9cblxucnVsZXMuYWJicl9vcGVuID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuICc8YWJiciB0aXRsZT1cIicgKyBlc2NhcGVIdG1sKHJlcGxhY2VFbnRpdGllcyh0b2tlbnNbaWR4XS50aXRsZSkpICsgJ1wiPic7XG59O1xucnVsZXMuYWJicl9jbG9zZSA9IGZ1bmN0aW9uICgvKiB0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiAnPC9hYmJyPic7XG59O1xuXG4vKipcbiAqIEZvb3Rub3Rlc1xuICovXG5cbnJ1bGVzLmZvb3Rub3RlX3JlZiA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCkge1xuICB2YXIgbiA9IE51bWJlcih0b2tlbnNbaWR4XS5pZCArIDEpLnRvU3RyaW5nKCk7XG4gIHZhciBpZCA9ICdmbnJlZicgKyBuO1xuICBpZiAodG9rZW5zW2lkeF0uc3ViSWQgPiAwKSB7XG4gICAgaWQgKz0gJzonICsgdG9rZW5zW2lkeF0uc3ViSWQ7XG4gIH1cbiAgcmV0dXJuICc8c3VwIGNsYXNzPVwiZm9vdG5vdGUtcmVmXCI+PGEgaHJlZj1cIiNmbicgKyBuICsgJ1wiIGlkPVwiJyArIGlkICsgJ1wiPlsnICsgbiArICddPC9hPjwvc3VwPic7XG59O1xucnVsZXMuZm9vdG5vdGVfYmxvY2tfb3BlbiA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucykge1xuICB2YXIgaHIgPSBvcHRpb25zLnhodG1sT3V0XG4gICAgPyAnPGhyIGNsYXNzPVwiZm9vdG5vdGVzLXNlcFwiIC8+XFxuJ1xuICAgIDogJzxociBjbGFzcz1cImZvb3Rub3Rlcy1zZXBcIj5cXG4nO1xuICByZXR1cm4gIGhyICsgJzxzZWN0aW9uIGNsYXNzPVwiZm9vdG5vdGVzXCI+XFxuPG9sIGNsYXNzPVwiZm9vdG5vdGVzLWxpc3RcIj5cXG4nO1xufTtcbnJ1bGVzLmZvb3Rub3RlX2Jsb2NrX2Nsb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJzwvb2w+XFxuPC9zZWN0aW9uPlxcbic7XG59O1xucnVsZXMuZm9vdG5vdGVfb3BlbiA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCkge1xuICB2YXIgaWQgPSBOdW1iZXIodG9rZW5zW2lkeF0uaWQgKyAxKS50b1N0cmluZygpO1xuICByZXR1cm4gJzxsaSBpZD1cImZuJyArIGlkICsgJ1wiICBjbGFzcz1cImZvb3Rub3RlLWl0ZW1cIj4nO1xufTtcbnJ1bGVzLmZvb3Rub3RlX2Nsb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJzwvbGk+XFxuJztcbn07XG5ydWxlcy5mb290bm90ZV9hbmNob3IgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgpIHtcbiAgdmFyIG4gPSBOdW1iZXIodG9rZW5zW2lkeF0uaWQgKyAxKS50b1N0cmluZygpO1xuICB2YXIgaWQgPSAnZm5yZWYnICsgbjtcbiAgaWYgKHRva2Vuc1tpZHhdLnN1YklkID4gMCkge1xuICAgIGlkICs9ICc6JyArIHRva2Vuc1tpZHhdLnN1YklkO1xuICB9XG4gIHJldHVybiAnIDxhIGhyZWY9XCIjJyArIGlkICsgJ1wiIGNsYXNzPVwiZm9vdG5vdGUtYmFja3JlZlwiPuKGqTwvYT4nO1xufTtcblxuLyoqXG4gKiBEZWZpbml0aW9uIGxpc3RzXG4gKi9cblxucnVsZXMuZGxfb3BlbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJzxkbD5cXG4nO1xufTtcbnJ1bGVzLmR0X29wZW4gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICc8ZHQ+Jztcbn07XG5ydWxlcy5kZF9vcGVuID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnPGRkPic7XG59O1xucnVsZXMuZGxfY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICc8L2RsPlxcbic7XG59O1xucnVsZXMuZHRfY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICc8L2R0Plxcbic7XG59O1xucnVsZXMuZGRfY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICc8L2RkPlxcbic7XG59O1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBuZXh0VG9rZW4odG9rZW5zLCBpZHgpIHtcbiAgaWYgKCsraWR4ID49IHRva2Vucy5sZW5ndGggLSAyKSB7XG4gICAgcmV0dXJuIGlkeDtcbiAgfVxuICBpZiAoKHRva2Vuc1tpZHhdLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicgJiYgdG9rZW5zW2lkeF0udGlnaHQpICYmXG4gICAgICAodG9rZW5zW2lkeCArIDFdLnR5cGUgPT09ICdpbmxpbmUnICYmIHRva2Vuc1tpZHggKyAxXS5jb250ZW50Lmxlbmd0aCA9PT0gMCkgJiZcbiAgICAgICh0b2tlbnNbaWR4ICsgMl0udHlwZSA9PT0gJ3BhcmFncmFwaF9jbG9zZScgJiYgdG9rZW5zW2lkeCArIDJdLnRpZ2h0KSkge1xuICAgIHJldHVybiBuZXh0VG9rZW4odG9rZW5zLCBpZHggKyAyKTtcbiAgfVxuICByZXR1cm4gaWR4O1xufVxuXG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiBgXFxuYCBpcyBuZWVkZWQgYmVmb3JlIHRoZSBuZXh0IHRva2VuLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSBgdG9rZW5zYFxuICogQHBhcmFtICB7TnVtYmVyfSBgaWR4YFxuICogQHJldHVybiB7U3RyaW5nfSBFbXB0eSBzdHJpbmcgb3IgbmV3bGluZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIGdldEJyZWFrID0gcnVsZXMuZ2V0QnJlYWsgPSBmdW5jdGlvbiBnZXRCcmVhayh0b2tlbnMsIGlkeCkge1xuICBpZHggPSBuZXh0VG9rZW4odG9rZW5zLCBpZHgpO1xuICBpZiAoaWR4IDwgdG9rZW5zLmxlbmd0aCAmJiB0b2tlbnNbaWR4XS50eXBlID09PSAnbGlzdF9pdGVtX2Nsb3NlJykge1xuICAgIHJldHVybiAnJztcbiAgfVxuICByZXR1cm4gJ1xcbic7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgcnVsZXNgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBydWxlcztcbiIsIi8vIEJsb2NrIHF1b3Rlc1xuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBibG9ja3F1b3RlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgbmV4dExpbmUsIGxhc3RMaW5lRW1wdHksIG9sZFRTaGlmdCwgb2xkQk1hcmtzLCBvbGRJbmRlbnQsIG9sZFBhcmVudFR5cGUsIGxpbmVzLFxuICAgICAgdGVybWluYXRvclJ1bGVzLFxuICAgICAgaSwgbCwgdGVybWluYXRlLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIGlmIChwb3MgPiBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gY2hlY2sgdGhlIGJsb2NrIHF1b3RlIG1hcmtlclxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspICE9PSAweDNFLyogPiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIHdlIGtub3cgdGhhdCBpdCdzIGdvaW5nIHRvIGJlIGEgdmFsaWQgYmxvY2txdW90ZSxcbiAgLy8gc28gbm8gcG9pbnQgdHJ5aW5nIHRvIGZpbmQgdGhlIGVuZCBvZiBpdCBpbiBzaWxlbnQgbW9kZVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgLy8gc2tpcCBvbmUgb3B0aW9uYWwgc3BhY2UgYWZ0ZXIgJz4nXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwKSB7IHBvcysrOyB9XG5cbiAgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICBzdGF0ZS5ibGtJbmRlbnQgPSAwO1xuXG4gIG9sZEJNYXJrcyA9IFsgc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gXTtcbiAgc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gPSBwb3M7XG5cbiAgLy8gY2hlY2sgaWYgd2UgaGF2ZSBhbiBlbXB0eSBibG9ja3F1b3RlXG4gIHBvcyA9IHBvcyA8IG1heCA/IHN0YXRlLnNraXBTcGFjZXMocG9zKSA6IHBvcztcbiAgbGFzdExpbmVFbXB0eSA9IHBvcyA+PSBtYXg7XG5cbiAgb2xkVFNoaWZ0ID0gWyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSBdO1xuICBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSA9IHBvcyAtIHN0YXRlLmJNYXJrc1tzdGFydExpbmVdO1xuXG4gIHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLnBhcnNlci5ydWxlci5nZXRSdWxlcygnYmxvY2txdW90ZScpO1xuXG4gIC8vIFNlYXJjaCB0aGUgZW5kIG9mIHRoZSBibG9ja1xuICAvL1xuICAvLyBCbG9jayBlbmRzIHdpdGggZWl0aGVyOlxuICAvLyAgMS4gYW4gZW1wdHkgbGluZSBvdXRzaWRlOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+IHRlc3RcbiAgLy9cbiAgLy8gICAgIGBgYFxuICAvLyAgMi4gYW4gZW1wdHkgbGluZSBpbnNpZGU6XG4gIC8vICAgICBgYGBcbiAgLy8gICAgID5cbiAgLy8gICAgIHRlc3RcbiAgLy8gICAgIGBgYFxuICAvLyAgMy4gYW5vdGhlciB0YWdcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPiB0ZXN0XG4gIC8vICAgICAgLSAtIC1cbiAgLy8gICAgIGBgYFxuICBmb3IgKG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXTtcblxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICAvLyBDYXNlIDE6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoaXMgbGluZSBpcyBlbXB0eS5cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKykgPT09IDB4M0UvKiA+ICovKSB7XG4gICAgICAvLyBUaGlzIGxpbmUgaXMgaW5zaWRlIHRoZSBibG9ja3F1b3RlLlxuXG4gICAgICAvLyBza2lwIG9uZSBvcHRpb25hbCBzcGFjZSBhZnRlciAnPidcbiAgICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwKSB7IHBvcysrOyB9XG5cbiAgICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pO1xuICAgICAgc3RhdGUuYk1hcmtzW25leHRMaW5lXSA9IHBvcztcblxuICAgICAgcG9zID0gcG9zIDwgbWF4ID8gc3RhdGUuc2tpcFNwYWNlcyhwb3MpIDogcG9zO1xuICAgICAgbGFzdExpbmVFbXB0eSA9IHBvcyA+PSBtYXg7XG5cbiAgICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuICAgICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IHBvcyAtIHN0YXRlLmJNYXJrc1tuZXh0TGluZV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIDI6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoZSBsYXN0IGxpbmUgd2FzIGVtcHR5LlxuICAgIGlmIChsYXN0TGluZUVtcHR5KSB7IGJyZWFrOyB9XG5cbiAgICAvLyBDYXNlIDM6IGFub3RoZXIgdGFnIGZvdW5kLlxuICAgIHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAoaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWs7IH1cblxuICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pO1xuICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuXG4gICAgLy8gQSBuZWdhdGl2ZSBudW1iZXIgbWVhbnMgdGhhdCB0aGlzIGlzIGEgcGFyYWdyYXBoIGNvbnRpbnVhdGlvbjtcbiAgICAvL1xuICAgIC8vIEFueSBuZWdhdGl2ZSBudW1iZXIgd2lsbCBkbyB0aGUgam9iIGhlcmUsIGJ1dCBpdCdzIGJldHRlciBmb3IgaXRcbiAgICAvLyB0byBiZSBsYXJnZSBlbm91Z2ggdG8gbWFrZSBhbnkgYnVncyBvYnZpb3VzLlxuICAgIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPSAtMTMzNztcbiAgfVxuXG4gIG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ2Jsb2NrcXVvdGUnO1xuICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgdHlwZTogJ2Jsb2NrcXVvdGVfb3BlbicsXG4gICAgbGluZXM6IGxpbmVzID0gWyBzdGFydExpbmUsIDAgXSxcbiAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICB9KTtcbiAgc3RhdGUucGFyc2VyLnRva2VuaXplKHN0YXRlLCBzdGFydExpbmUsIG5leHRMaW5lKTtcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdibG9ja3F1b3RlX2Nsb3NlJyxcbiAgICBsZXZlbDogLS1zdGF0ZS5sZXZlbFxuICB9KTtcbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG4gIGxpbmVzWzFdID0gc3RhdGUubGluZTtcblxuICAvLyBSZXN0b3JlIG9yaWdpbmFsIHRTaGlmdDsgdGhpcyBtaWdodCBub3QgYmUgbmVjZXNzYXJ5IHNpbmNlIHRoZSBwYXJzZXJcbiAgLy8gaGFzIGFscmVhZHkgYmVlbiBoZXJlLCBidXQganVzdCB0byBtYWtlIHN1cmUgd2UgY2FuIGRvIHRoYXQuXG4gIGZvciAoaSA9IDA7IGkgPCBvbGRUU2hpZnQubGVuZ3RoOyBpKyspIHtcbiAgICBzdGF0ZS5iTWFya3NbaSArIHN0YXJ0TGluZV0gPSBvbGRCTWFya3NbaV07XG4gICAgc3RhdGUudFNoaWZ0W2kgKyBzdGFydExpbmVdID0gb2xkVFNoaWZ0W2ldO1xuICB9XG4gIHN0YXRlLmJsa0luZGVudCA9IG9sZEluZGVudDtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBDb2RlIGJsb2NrICg0IHNwYWNlcyBwYWRkZWQpXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvZGUoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZS8qLCBzaWxlbnQqLykge1xuICB2YXIgbmV4dExpbmUsIGxhc3Q7XG5cbiAgaWYgKHN0YXRlLnRTaGlmdFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50IDwgNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsYXN0ID0gbmV4dExpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIHdoaWxlIChuZXh0TGluZSA8IGVuZExpbmUpIHtcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICAgIG5leHRMaW5lKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgbmV4dExpbmUrKztcbiAgICAgIGxhc3QgPSBuZXh0TGluZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBicmVhaztcbiAgfVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZTtcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdjb2RlJyxcbiAgICBjb250ZW50OiBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIGxhc3QsIDQgKyBzdGF0ZS5ibGtJbmRlbnQsIHRydWUpLFxuICAgIGJsb2NrOiB0cnVlLFxuICAgIGxpbmVzOiBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdLFxuICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBEZWZpbml0aW9uIGxpc3RzXG5cbid1c2Ugc3RyaWN0JztcblxuXG4vLyBTZWFyY2ggYFs6fl1bXFxuIF1gLCByZXR1cm5zIG5leHQgcG9zIGFmdGVyIG1hcmtlciBvbiBzdWNjZXNzXG4vLyBvciAtMSBvbiBmYWlsLlxuZnVuY3Rpb24gc2tpcE1hcmtlcihzdGF0ZSwgbGluZSkge1xuICB2YXIgcG9zLCBtYXJrZXIsXG4gICAgICBzdGFydCA9IHN0YXRlLmJNYXJrc1tsaW5lXSArIHN0YXRlLnRTaGlmdFtsaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tsaW5lXTtcblxuICBpZiAoc3RhcnQgPj0gbWF4KSB7IHJldHVybiAtMTsgfVxuXG4gIC8vIENoZWNrIGJ1bGxldFxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCsrKTtcbiAgaWYgKG1hcmtlciAhPT0gMHg3RS8qIH4gKi8gJiYgbWFya2VyICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gLTE7IH1cblxuICBwb3MgPSBzdGF0ZS5za2lwU3BhY2VzKHN0YXJ0KTtcblxuICAvLyByZXF1aXJlIHNwYWNlIGFmdGVyIFwiOlwiXG4gIGlmIChzdGFydCA9PT0gcG9zKSB7IHJldHVybiAtMTsgfVxuXG4gIC8vIG5vIGVtcHR5IGRlZmluaXRpb25zLCBlLmcuIFwiICA6IFwiXG4gIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiAtMTsgfVxuXG4gIHJldHVybiBwb3M7XG59XG5cbmZ1bmN0aW9uIG1hcmtUaWdodFBhcmFncmFwaHMoc3RhdGUsIGlkeCkge1xuICB2YXIgaSwgbCxcbiAgICAgIGxldmVsID0gc3RhdGUubGV2ZWwgKyAyO1xuXG4gIGZvciAoaSA9IGlkeCArIDIsIGwgPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMjsgaSA8IGw7IGkrKykge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbaV0ubGV2ZWwgPT09IGxldmVsICYmIHN0YXRlLnRva2Vuc1tpXS50eXBlID09PSAncGFyYWdyYXBoX29wZW4nKSB7XG4gICAgICBzdGF0ZS50b2tlbnNbaSArIDJdLnRpZ2h0ID0gdHJ1ZTtcbiAgICAgIHN0YXRlLnRva2Vuc1tpXS50aWdodCA9IHRydWU7XG4gICAgICBpICs9IDI7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmbGlzdChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGNvbnRlbnRTdGFydCxcbiAgICAgIGRkTGluZSxcbiAgICAgIGR0TGluZSxcbiAgICAgIGl0ZW1MaW5lcyxcbiAgICAgIGxpc3RMaW5lcyxcbiAgICAgIGxpc3RUb2tJZHgsXG4gICAgICBuZXh0TGluZSxcbiAgICAgIG9sZEluZGVudCxcbiAgICAgIG9sZERESW5kZW50LFxuICAgICAgb2xkUGFyZW50VHlwZSxcbiAgICAgIG9sZFRTaGlmdCxcbiAgICAgIG9sZFRpZ2h0LFxuICAgICAgcHJldkVtcHR5RW5kLFxuICAgICAgdGlnaHQ7XG5cbiAgaWYgKHNpbGVudCkge1xuICAgIC8vIHF1aXJrOiB2YWxpZGF0aW9uIG1vZGUgdmFsaWRhdGVzIGEgZGQgYmxvY2sgb25seSwgbm90IGEgd2hvbGUgZGVmbGlzdFxuICAgIGlmIChzdGF0ZS5kZEluZGVudCA8IDApIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgcmV0dXJuIHNraXBNYXJrZXIoc3RhdGUsIHN0YXJ0TGluZSkgPj0gMDtcbiAgfVxuXG4gIG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcbiAgaWYgKHN0YXRlLmlzRW1wdHkobmV4dExpbmUpKSB7XG4gICAgaWYgKCsrbmV4dExpbmUgPiBlbmRMaW5lKSB7IHJldHVybiBmYWxzZTsgfVxuICB9XG5cbiAgaWYgKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGNvbnRlbnRTdGFydCA9IHNraXBNYXJrZXIoc3RhdGUsIG5leHRMaW5lKTtcbiAgaWYgKGNvbnRlbnRTdGFydCA8IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHN0YXRlLmxldmVsID49IHN0YXRlLm9wdGlvbnMubWF4TmVzdGluZykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBTdGFydCBsaXN0XG4gIGxpc3RUb2tJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoO1xuXG4gIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICB0eXBlOiAnZGxfb3BlbicsXG4gICAgbGluZXM6IGxpc3RMaW5lcyA9IFsgc3RhcnRMaW5lLCAwIF0sXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgfSk7XG5cbiAgLy9cbiAgLy8gSXRlcmF0ZSBsaXN0IGl0ZW1zXG4gIC8vXG5cbiAgZHRMaW5lID0gc3RhcnRMaW5lO1xuICBkZExpbmUgPSBuZXh0TGluZTtcblxuICAvLyBPbmUgZGVmaW5pdGlvbiBsaXN0IGNhbiBjb250YWluIG11bHRpcGxlIERUcyxcbiAgLy8gYW5kIG9uZSBEVCBjYW4gYmUgZm9sbG93ZWQgYnkgbXVsdGlwbGUgRERzLlxuICAvL1xuICAvLyBUaHVzLCB0aGVyZSBpcyB0d28gbG9vcHMgaGVyZSwgYW5kIGxhYmVsIGlzXG4gIC8vIG5lZWRlZCB0byBicmVhayBvdXQgb2YgdGhlIHNlY29uZCBvbmVcbiAgLy9cbiAgLyplc2xpbnQgbm8tbGFiZWxzOjAsYmxvY2stc2NvcGVkLXZhcjowKi9cbiAgT1VURVI6XG4gIGZvciAoOzspIHtcbiAgICB0aWdodCA9IHRydWU7XG4gICAgcHJldkVtcHR5RW5kID0gZmFsc2U7XG5cbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnZHRfb3BlbicsXG4gICAgICBsaW5lczogWyBkdExpbmUsIGR0TGluZSBdLFxuICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgICB9KTtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnaW5saW5lJyxcbiAgICAgIGNvbnRlbnQ6IHN0YXRlLmdldExpbmVzKGR0TGluZSwgZHRMaW5lICsgMSwgc3RhdGUuYmxrSW5kZW50LCBmYWxzZSkudHJpbSgpLFxuICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsICsgMSxcbiAgICAgIGxpbmVzOiBbIGR0TGluZSwgZHRMaW5lIF0sXG4gICAgICBjaGlsZHJlbjogW11cbiAgICB9KTtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnZHRfY2xvc2UnLFxuICAgICAgbGV2ZWw6IC0tc3RhdGUubGV2ZWxcbiAgICB9KTtcblxuICAgIGZvciAoOzspIHtcbiAgICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2RkX29wZW4nLFxuICAgICAgICBsaW5lczogaXRlbUxpbmVzID0gWyBuZXh0TGluZSwgMCBdLFxuICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICAgICAgfSk7XG5cbiAgICAgIG9sZFRpZ2h0ID0gc3RhdGUudGlnaHQ7XG4gICAgICBvbGREREluZGVudCA9IHN0YXRlLmRkSW5kZW50O1xuICAgICAgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICAgICAgb2xkVFNoaWZ0ID0gc3RhdGUudFNoaWZ0W2RkTGluZV07XG4gICAgICBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgICAgIHN0YXRlLmJsa0luZGVudCA9IHN0YXRlLmRkSW5kZW50ID0gc3RhdGUudFNoaWZ0W2RkTGluZV0gKyAyO1xuICAgICAgc3RhdGUudFNoaWZ0W2RkTGluZV0gPSBjb250ZW50U3RhcnQgLSBzdGF0ZS5iTWFya3NbZGRMaW5lXTtcbiAgICAgIHN0YXRlLnRpZ2h0ID0gdHJ1ZTtcbiAgICAgIHN0YXRlLnBhcmVudFR5cGUgPSAnZGVmbGlzdCc7XG5cbiAgICAgIHN0YXRlLnBhcnNlci50b2tlbml6ZShzdGF0ZSwgZGRMaW5lLCBlbmRMaW5lLCB0cnVlKTtcblxuICAgICAgLy8gSWYgYW55IG9mIGxpc3QgaXRlbSBpcyB0aWdodCwgbWFyayBsaXN0IGFzIHRpZ2h0XG4gICAgICBpZiAoIXN0YXRlLnRpZ2h0IHx8IHByZXZFbXB0eUVuZCkge1xuICAgICAgICB0aWdodCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSXRlbSBiZWNvbWUgbG9vc2UgaWYgZmluaXNoIHdpdGggZW1wdHkgbGluZSxcbiAgICAgIC8vIGJ1dCB3ZSBzaG91bGQgZmlsdGVyIGxhc3QgZWxlbWVudCwgYmVjYXVzZSBpdCBtZWFucyBsaXN0IGZpbmlzaFxuICAgICAgcHJldkVtcHR5RW5kID0gKHN0YXRlLmxpbmUgLSBkZExpbmUpID4gMSAmJiBzdGF0ZS5pc0VtcHR5KHN0YXRlLmxpbmUgLSAxKTtcblxuICAgICAgc3RhdGUudFNoaWZ0W2RkTGluZV0gPSBvbGRUU2hpZnQ7XG4gICAgICBzdGF0ZS50aWdodCA9IG9sZFRpZ2h0O1xuICAgICAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG4gICAgICBzdGF0ZS5ibGtJbmRlbnQgPSBvbGRJbmRlbnQ7XG4gICAgICBzdGF0ZS5kZEluZGVudCA9IG9sZERESW5kZW50O1xuXG4gICAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdkZF9jbG9zZScsXG4gICAgICAgIGxldmVsOiAtLXN0YXRlLmxldmVsXG4gICAgICB9KTtcblxuICAgICAgaXRlbUxpbmVzWzFdID0gbmV4dExpbmUgPSBzdGF0ZS5saW5lO1xuXG4gICAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkgeyBicmVhayBPVVRFUjsgfVxuXG4gICAgICBpZiAoc3RhdGUudFNoaWZ0W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhayBPVVRFUjsgfVxuICAgICAgY29udGVudFN0YXJ0ID0gc2tpcE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpO1xuICAgICAgaWYgKGNvbnRlbnRTdGFydCA8IDApIHsgYnJlYWs7IH1cblxuICAgICAgZGRMaW5lID0gbmV4dExpbmU7XG5cbiAgICAgIC8vIGdvIHRvIHRoZSBuZXh0IGxvb3AgaXRlcmF0aW9uOlxuICAgICAgLy8gaW5zZXJ0IEREIHRhZyBhbmQgcmVwZWF0IGNoZWNraW5nXG4gICAgfVxuXG4gICAgaWYgKG5leHRMaW5lID49IGVuZExpbmUpIHsgYnJlYWs7IH1cbiAgICBkdExpbmUgPSBuZXh0TGluZTtcblxuICAgIGlmIChzdGF0ZS5pc0VtcHR5KGR0TGluZSkpIHsgYnJlYWs7IH1cbiAgICBpZiAoc3RhdGUudFNoaWZ0W2R0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWs7IH1cblxuICAgIGRkTGluZSA9IGR0TGluZSArIDE7XG4gICAgaWYgKGRkTGluZSA+PSBlbmRMaW5lKSB7IGJyZWFrOyB9XG4gICAgaWYgKHN0YXRlLmlzRW1wdHkoZGRMaW5lKSkgeyBkZExpbmUrKzsgfVxuICAgIGlmIChkZExpbmUgPj0gZW5kTGluZSkgeyBicmVhazsgfVxuXG4gICAgaWYgKHN0YXRlLnRTaGlmdFtkZExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG4gICAgY29udGVudFN0YXJ0ID0gc2tpcE1hcmtlcihzdGF0ZSwgZGRMaW5lKTtcbiAgICBpZiAoY29udGVudFN0YXJ0IDwgMCkgeyBicmVhazsgfVxuXG4gICAgLy8gZ28gdG8gdGhlIG5leHQgbG9vcCBpdGVyYXRpb246XG4gICAgLy8gaW5zZXJ0IERUIGFuZCBERCB0YWdzIGFuZCByZXBlYXQgY2hlY2tpbmdcbiAgfVxuXG4gIC8vIEZpbmlsaXplIGxpc3RcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdkbF9jbG9zZScsXG4gICAgbGV2ZWw6IC0tc3RhdGUubGV2ZWxcbiAgfSk7XG4gIGxpc3RMaW5lc1sxXSA9IG5leHRMaW5lO1xuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZTtcblxuICAvLyBtYXJrIHBhcmFncmFwaHMgdGlnaHQgaWYgbmVlZGVkXG4gIGlmICh0aWdodCkge1xuICAgIG1hcmtUaWdodFBhcmFncmFwaHMoc3RhdGUsIGxpc3RUb2tJZHgpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gZmVuY2VzIChgYGAgbGFuZywgfn5+IGxhbmcpXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZlbmNlcyhzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIG1hcmtlciwgbGVuLCBwYXJhbXMsIG5leHRMaW5lLCBtZW0sXG4gICAgICBoYXZlRW5kTWFya2VyID0gZmFsc2UsXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgaWYgKHBvcyArIDMgPiBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAobWFya2VyICE9PSAweDdFLyogfiAqLyAmJiBtYXJrZXIgIT09IDB4NjAgLyogYCAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIHNjYW4gbWFya2VyIGxlbmd0aFxuICBtZW0gPSBwb3M7XG4gIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcik7XG5cbiAgbGVuID0gcG9zIC0gbWVtO1xuXG4gIGlmIChsZW4gPCAzKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBhcmFtcyA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCkudHJpbSgpO1xuXG4gIGlmIChwYXJhbXMuaW5kZXhPZignYCcpID49IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gU2luY2Ugc3RhcnQgaXMgZm91bmQsIHdlIGNhbiByZXBvcnQgc3VjY2VzcyBoZXJlIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgLy8gc2VhcmNoIGVuZCBvZiBibG9ja1xuICBuZXh0TGluZSA9IHN0YXJ0TGluZTtcblxuICBmb3IgKDs7KSB7XG4gICAgbmV4dExpbmUrKztcbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkge1xuICAgICAgLy8gdW5jbG9zZWQgYmxvY2sgc2hvdWxkIGJlIGF1dG9jbG9zZWQgYnkgZW5kIG9mIGRvY3VtZW50LlxuICAgICAgLy8gYWxzbyBibG9jayBzZWVtcyB0byBiZSBhdXRvY2xvc2VkIGJ5IGVuZCBvZiBwYXJlbnRcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHBvcyA9IG1lbSA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIC8vIG5vbi1lbXB0eSBsaW5lIHdpdGggbmVnYXRpdmUgaW5kZW50IHNob3VsZCBzdG9wIHRoZSBsaXN0OlxuICAgICAgLy8gLSBgYGBcbiAgICAgIC8vICB0ZXN0XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gbWFya2VyKSB7IGNvbnRpbnVlOyB9XG5cbiAgICBpZiAoc3RhdGUudFNoaWZ0W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICAvLyBjbG9zaW5nIGZlbmNlIHNob3VsZCBiZSBpbmRlbnRlZCBsZXNzIHRoYW4gNCBzcGFjZXNcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcik7XG5cbiAgICAvLyBjbG9zaW5nIGNvZGUgZmVuY2UgbXVzdCBiZSBhdCBsZWFzdCBhcyBsb25nIGFzIHRoZSBvcGVuaW5nIG9uZVxuICAgIGlmIChwb3MgLSBtZW0gPCBsZW4pIHsgY29udGludWU7IH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0YWlsIGhhcyBzcGFjZXMgb25seVxuICAgIHBvcyA9IHN0YXRlLnNraXBTcGFjZXMocG9zKTtcblxuICAgIGlmIChwb3MgPCBtYXgpIHsgY29udGludWU7IH1cblxuICAgIGhhdmVFbmRNYXJrZXIgPSB0cnVlO1xuICAgIC8vIGZvdW5kIVxuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSWYgYSBmZW5jZSBoYXMgaGVhZGluZyBzcGFjZXMsIHRoZXkgc2hvdWxkIGJlIHJlbW92ZWQgZnJvbSBpdHMgaW5uZXIgYmxvY2tcbiAgbGVuID0gc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lICsgKGhhdmVFbmRNYXJrZXIgPyAxIDogMCk7XG4gIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICB0eXBlOiAnZmVuY2UnLFxuICAgIHBhcmFtczogcGFyYW1zLFxuICAgIGNvbnRlbnQ6IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSArIDEsIG5leHRMaW5lLCBsZW4sIHRydWUpLFxuICAgIGxpbmVzOiBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdLFxuICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZXNzIGZvb3Rub3RlIHJlZmVyZW5jZSBsaXN0XG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvb3Rub3RlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgb2xkQk1hcmssIG9sZFRTaGlmdCwgb2xkUGFyZW50VHlwZSwgcG9zLCBsYWJlbCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGxpbmUgc2hvdWxkIGJlIGF0IGxlYXN0IDUgY2hhcnMgLSBcIlteeF06XCJcbiAgaWYgKHN0YXJ0ICsgNCA+IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMSkgIT09IDB4NUUvKiBeICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGZvciAocG9zID0gc3RhcnQgKyAyOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjApIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUQgLyogXSAqLykge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBvcyA9PT0gc3RhcnQgKyAyKSB7IHJldHVybiBmYWxzZTsgfSAvLyBubyBlbXB0eSBmb290bm90ZSBsYWJlbHNcbiAgaWYgKHBvcyArIDEgPj0gbWF4IHx8IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKSAhPT0gMHgzQSAvKiA6ICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG4gIHBvcysrO1xuXG4gIGlmICghc3RhdGUuZW52LmZvb3Rub3RlcykgeyBzdGF0ZS5lbnYuZm9vdG5vdGVzID0ge307IH1cbiAgaWYgKCFzdGF0ZS5lbnYuZm9vdG5vdGVzLnJlZnMpIHsgc3RhdGUuZW52LmZvb3Rub3Rlcy5yZWZzID0ge307IH1cbiAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQgKyAyLCBwb3MgLSAyKTtcbiAgc3RhdGUuZW52LmZvb3Rub3Rlcy5yZWZzWyc6JyArIGxhYmVsXSA9IC0xO1xuXG4gIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICB0eXBlOiAnZm9vdG5vdGVfcmVmZXJlbmNlX29wZW4nLFxuICAgIGxhYmVsOiBsYWJlbCxcbiAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICB9KTtcblxuICBvbGRCTWFyayA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdO1xuICBvbGRUU2hpZnQgPSBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdID0gc3RhdGUuc2tpcFNwYWNlcyhwb3MpIC0gcG9zO1xuICBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSA9IHBvcztcbiAgc3RhdGUuYmxrSW5kZW50ICs9IDQ7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAnZm9vdG5vdGUnO1xuXG4gIGlmIChzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkge1xuICAgIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdICs9IHN0YXRlLmJsa0luZGVudDtcbiAgICBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSAtPSBzdGF0ZS5ibGtJbmRlbnQ7XG4gIH1cblxuICBzdGF0ZS5wYXJzZXIudG9rZW5pemUoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgdHJ1ZSk7XG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG4gIHN0YXRlLmJsa0luZGVudCAtPSA0O1xuICBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSA9IG9sZFRTaGlmdDtcbiAgc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gPSBvbGRCTWFyaztcblxuICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgdHlwZTogJ2Zvb3Rub3RlX3JlZmVyZW5jZV9jbG9zZScsXG4gICAgbGV2ZWw6IC0tc3RhdGUubGV2ZWxcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gaGVhZGluZyAoIywgIyMsIC4uLilcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGVhZGluZyhzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGNoLCBsZXZlbCwgdG1wLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGNoICA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgaWYgKGNoICE9PSAweDIzLyogIyAqLyB8fCBwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIGNvdW50IGhlYWRpbmcgbGV2ZWxcbiAgbGV2ZWwgPSAxO1xuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKTtcbiAgd2hpbGUgKGNoID09PSAweDIzLyogIyAqLyAmJiBwb3MgPCBtYXggJiYgbGV2ZWwgPD0gNikge1xuICAgIGxldmVsKys7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdCgrK3Bvcyk7XG4gIH1cblxuICBpZiAobGV2ZWwgPiA2IHx8IChwb3MgPCBtYXggJiYgY2ggIT09IDB4MjAvKiBzcGFjZSAqLykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIC8vIExldCdzIGN1dCB0YWlscyBsaWtlICcgICAgIyMjICAnIGZyb20gdGhlIGVuZCBvZiBzdHJpbmdcblxuICBtYXggPSBzdGF0ZS5za2lwQ2hhcnNCYWNrKG1heCwgMHgyMCwgcG9zKTsgLy8gc3BhY2VcbiAgdG1wID0gc3RhdGUuc2tpcENoYXJzQmFjayhtYXgsIDB4MjMsIHBvcyk7IC8vICNcbiAgaWYgKHRtcCA+IHBvcyAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdCh0bXAgLSAxKSA9PT0gMHgyMC8qIHNwYWNlICovKSB7XG4gICAgbWF4ID0gdG1wO1xuICB9XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAnaGVhZGluZ19vcGVuJyxcbiAgICBoTGV2ZWw6IGxldmVsLFxuICAgIGxpbmVzOiBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdLFxuICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICB9KTtcblxuICAvLyBvbmx5IGlmIGhlYWRlciBpcyBub3QgZW1wdHlcbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgY29udGVudDogc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KS50cmltKCksXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWwgKyAxLFxuICAgICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF0sXG4gICAgICBjaGlsZHJlbjogW11cbiAgICB9KTtcbiAgfVxuICBzdGF0ZS50b2tlbnMucHVzaCh7IHR5cGU6ICdoZWFkaW5nX2Nsb3NlJywgaExldmVsOiBsZXZlbCwgbGV2ZWw6IHN0YXRlLmxldmVsIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEhvcml6b250YWwgcnVsZVxuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBocihzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIG1hcmtlciwgY250LCBjaCxcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgcG9zICs9IHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuXG4gIGlmIChwb3MgPiBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuXG4gIC8vIENoZWNrIGhyIG1hcmtlclxuICBpZiAobWFya2VyICE9PSAweDJBLyogKiAqLyAmJlxuICAgICAgbWFya2VyICE9PSAweDJELyogLSAqLyAmJlxuICAgICAgbWFya2VyICE9PSAweDVGLyogXyAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIG1hcmtlcnMgY2FuIGJlIG1peGVkIHdpdGggc3BhY2VzLCBidXQgdGhlcmUgc2hvdWxkIGJlIGF0IGxlYXN0IDMgb25lXG5cbiAgY250ID0gMTtcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICAgIGlmIChjaCAhPT0gbWFya2VyICYmIGNoICE9PSAweDIwLyogc3BhY2UgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKGNoID09PSBtYXJrZXIpIHsgY250Kys7IH1cbiAgfVxuXG4gIGlmIChjbnQgPCAzKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWU7IH1cblxuICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lICsgMTtcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdocicsXG4gICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF0sXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsXG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEhUTUwgYmxvY2tcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBibG9ja19uYW1lcyA9IHJlcXVpcmUoJy4uL2NvbW1vbi9odG1sX2Jsb2NrcycpO1xuXG5cbnZhciBIVE1MX1RBR19PUEVOX1JFID0gL148KFthLXpBLVpdezEsMTV9KVtcXHNcXC8+XS87XG52YXIgSFRNTF9UQUdfQ0xPU0VfUkUgPSAvXjxcXC8oW2EtekEtWl17MSwxNX0pW1xccz5dLztcblxuZnVuY3Rpb24gaXNMZXR0ZXIoY2gpIHtcbiAgLyplc2xpbnQgbm8tYml0d2lzZTowKi9cbiAgdmFyIGxjID0gY2ggfCAweDIwOyAvLyB0byBsb3dlciBjYXNlXG4gIHJldHVybiAobGMgPj0gMHg2MS8qIGEgKi8pICYmIChsYyA8PSAweDdhLyogeiAqLyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHRtbGJsb2NrKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgY2gsIG1hdGNoLCBuZXh0TGluZSxcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV0sXG4gICAgICBzaGlmdCA9IHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuXG4gIHBvcyArPSBzaGlmdDtcblxuICBpZiAoIXN0YXRlLm9wdGlvbnMuaHRtbCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc2hpZnQgPiAzIHx8IHBvcyArIDIgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDNDLyogPCAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpO1xuXG4gIGlmIChjaCA9PT0gMHgyMS8qICEgKi8gfHwgY2ggPT09IDB4M0YvKiA/ICovKSB7XG4gICAgLy8gRGlyZWN0aXZlIHN0YXJ0IC8gY29tbWVudCBzdGFydCAvIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb24gc3RhcnRcbiAgICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgyRi8qIC8gKi8gfHwgaXNMZXR0ZXIoY2gpKSB7XG5cbiAgICAvLyBQcm9iYWJseSBzdGFydCBvciBlbmQgb2YgdGFnXG4gICAgaWYgKGNoID09PSAweDJGLyogXFwgKi8pIHtcbiAgICAgIC8vIGNsb3NpbmcgdGFnXG4gICAgICBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCkubWF0Y2goSFRNTF9UQUdfQ0xPU0VfUkUpO1xuICAgICAgaWYgKCFtYXRjaCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb3BlbmluZyB0YWdcbiAgICAgIG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KS5tYXRjaChIVE1MX1RBR19PUEVOX1JFKTtcbiAgICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSB0YWcgbmFtZSBpcyB2YWxpZFxuICAgIGlmIChibG9ja19uYW1lc1ttYXRjaFsxXS50b0xvd2VyQ2FzZSgpXSAhPT0gdHJ1ZSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJZiB3ZSBhcmUgaGVyZSAtIHdlIGRldGVjdGVkIEhUTUwgYmxvY2suXG4gIC8vIExldCdzIHJvbGwgZG93biB0aWxsIGVtcHR5IGxpbmUgKGJsb2NrIGVuZCkuXG4gIG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcbiAgd2hpbGUgKG5leHRMaW5lIDwgc3RhdGUubGluZU1heCAmJiAhc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICBuZXh0TGluZSsrO1xuICB9XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgdHlwZTogJ2h0bWxibG9jaycsXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsLFxuICAgIGxpbmVzOiBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdLFxuICAgIGNvbnRlbnQ6IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIDAsIHRydWUpXG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIGxoZWFkaW5nICgtLS0sID09PSlcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGhlYWRpbmcoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZS8qLCBzaWxlbnQqLykge1xuICB2YXIgbWFya2VyLCBwb3MsIG1heCxcbiAgICAgIG5leHQgPSBzdGFydExpbmUgKyAxO1xuXG4gIGlmIChuZXh0ID49IGVuZExpbmUpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChzdGF0ZS50U2hpZnRbbmV4dF0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gU2NhbiBuZXh0IGxpbmVcblxuICBpZiAoc3RhdGUudFNoaWZ0W25leHRdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dF0gKyBzdGF0ZS50U2hpZnRbbmV4dF07XG4gIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0XTtcblxuICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gIGlmIChtYXJrZXIgIT09IDB4MkQvKiAtICovICYmIG1hcmtlciAhPT0gMHgzRC8qID0gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG9zID0gc3RhdGUuc2tpcENoYXJzKHBvcywgbWFya2VyKTtcblxuICBwb3MgPSBzdGF0ZS5za2lwU3BhY2VzKHBvcyk7XG5cbiAgaWYgKHBvcyA8IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuXG4gIHN0YXRlLmxpbmUgPSBuZXh0ICsgMTtcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdoZWFkaW5nX29wZW4nLFxuICAgIGhMZXZlbDogbWFya2VyID09PSAweDNELyogPSAqLyA/IDEgOiAyLFxuICAgIGxpbmVzOiBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdLFxuICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICB9KTtcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgIGNvbnRlbnQ6IHN0YXRlLnNyYy5zbGljZShwb3MsIHN0YXRlLmVNYXJrc1tzdGFydExpbmVdKS50cmltKCksXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsICsgMSxcbiAgICBsaW5lczogWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgLSAxIF0sXG4gICAgY2hpbGRyZW46IFtdXG4gIH0pO1xuICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgdHlwZTogJ2hlYWRpbmdfY2xvc2UnLFxuICAgIGhMZXZlbDogbWFya2VyID09PSAweDNELyogPSAqLyA/IDEgOiAyLFxuICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBMaXN0c1xuXG4ndXNlIHN0cmljdCc7XG5cblxuLy8gU2VhcmNoIGBbLSsqXVtcXG4gXWAsIHJldHVybnMgbmV4dCBwb3MgYXJ0ZXIgbWFya2VyIG9uIHN1Y2Nlc3Ncbi8vIG9yIC0xIG9uIGZhaWwuXG5mdW5jdGlvbiBza2lwQnVsbGV0TGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSB7XG4gIHZhciBtYXJrZXIsIHBvcywgbWF4O1xuXG4gIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiAtMTsgfVxuXG4gIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcbiAgLy8gQ2hlY2sgYnVsbGV0XG4gIGlmIChtYXJrZXIgIT09IDB4MkEvKiAqICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkQvKiAtICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkIvKiArICovKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDIwKSB7XG4gICAgLy8gXCIgMS50ZXN0IFwiIC0gaXMgbm90IGEgbGlzdCBpdGVtXG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgcmV0dXJuIHBvcztcbn1cblxuLy8gU2VhcmNoIGBcXGQrWy4pXVtcXG4gXWAsIHJldHVybnMgbmV4dCBwb3MgYXJ0ZXIgbWFya2VyIG9uIHN1Y2Nlc3Ncbi8vIG9yIC0xIG9uIGZhaWwuXG5mdW5jdGlvbiBza2lwT3JkZXJlZExpc3RNYXJrZXIoc3RhdGUsIHN0YXJ0TGluZSkge1xuICB2YXIgY2gsXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgaWYgKHBvcyArIDEgPj0gbWF4KSB7IHJldHVybiAtMTsgfVxuXG4gIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuXG4gIGlmIChjaCA8IDB4MzAvKiAwICovIHx8IGNoID4gMHgzOS8qIDkgKi8pIHsgcmV0dXJuIC0xOyB9XG5cbiAgZm9yICg7Oykge1xuICAgIC8vIEVPTCAtPiBmYWlsXG4gICAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIC0xOyB9XG5cbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcblxuICAgIGlmIChjaCA+PSAweDMwLyogMCAqLyAmJiBjaCA8PSAweDM5LyogOSAqLykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZm91bmQgdmFsaWQgbWFya2VyXG4gICAgaWYgKGNoID09PSAweDI5LyogKSAqLyB8fCBjaCA9PT0gMHgyZS8qIC4gKi8pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiAtMTtcbiAgfVxuXG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDIwLyogc3BhY2UgKi8pIHtcbiAgICAvLyBcIiAxLnRlc3QgXCIgLSBpcyBub3QgYSBsaXN0IGl0ZW1cbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgcmV0dXJuIHBvcztcbn1cblxuZnVuY3Rpb24gbWFya1RpZ2h0UGFyYWdyYXBocyhzdGF0ZSwgaWR4KSB7XG4gIHZhciBpLCBsLFxuICAgICAgbGV2ZWwgPSBzdGF0ZS5sZXZlbCArIDI7XG5cbiAgZm9yIChpID0gaWR4ICsgMiwgbCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAyOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHN0YXRlLnRva2Vuc1tpXS5sZXZlbCA9PT0gbGV2ZWwgJiYgc3RhdGUudG9rZW5zW2ldLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tpICsgMl0udGlnaHQgPSB0cnVlO1xuICAgICAgc3RhdGUudG9rZW5zW2ldLnRpZ2h0ID0gdHJ1ZTtcbiAgICAgIGkgKz0gMjtcbiAgICB9XG4gIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxpc3Qoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBuZXh0TGluZSxcbiAgICAgIGluZGVudCxcbiAgICAgIG9sZFRTaGlmdCxcbiAgICAgIG9sZEluZGVudCxcbiAgICAgIG9sZFRpZ2h0LFxuICAgICAgb2xkUGFyZW50VHlwZSxcbiAgICAgIHN0YXJ0LFxuICAgICAgcG9zQWZ0ZXJNYXJrZXIsXG4gICAgICBtYXgsXG4gICAgICBpbmRlbnRBZnRlck1hcmtlcixcbiAgICAgIG1hcmtlclZhbHVlLFxuICAgICAgbWFya2VyQ2hhckNvZGUsXG4gICAgICBpc09yZGVyZWQsXG4gICAgICBjb250ZW50U3RhcnQsXG4gICAgICBsaXN0VG9rSWR4LFxuICAgICAgcHJldkVtcHR5RW5kLFxuICAgICAgbGlzdExpbmVzLFxuICAgICAgaXRlbUxpbmVzLFxuICAgICAgdGlnaHQgPSB0cnVlLFxuICAgICAgdGVybWluYXRvclJ1bGVzLFxuICAgICAgaSwgbCwgdGVybWluYXRlO1xuXG4gIC8vIERldGVjdCBsaXN0IHR5cGUgYW5kIHBvc2l0aW9uIGFmdGVyIG1hcmtlclxuICBpZiAoKHBvc0FmdGVyTWFya2VyID0gc2tpcE9yZGVyZWRMaXN0TWFya2VyKHN0YXRlLCBzdGFydExpbmUpKSA+PSAwKSB7XG4gICAgaXNPcmRlcmVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICgocG9zQWZ0ZXJNYXJrZXIgPSBza2lwQnVsbGV0TGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSkgPj0gMCkge1xuICAgIGlzT3JkZXJlZCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChzdGF0ZS5sZXZlbCA+PSBzdGF0ZS5vcHRpb25zLm1heE5lc3RpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gV2Ugc2hvdWxkIHRlcm1pbmF0ZSBsaXN0IG9uIHN0eWxlIGNoYW5nZS4gUmVtZW1iZXIgZmlyc3Qgb25lIHRvIGNvbXBhcmUuXG4gIG1hcmtlckNoYXJDb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKTtcblxuICAvLyBGb3IgdmFsaWRhdGlvbiBtb2RlIHdlIGNhbiB0ZXJtaW5hdGUgaW1tZWRpYXRlbHlcbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIC8vIFN0YXJ0IGxpc3RcbiAgbGlzdFRva0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGg7XG5cbiAgaWYgKGlzT3JkZXJlZCkge1xuICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgICBtYXJrZXJWYWx1ZSA9IE51bWJlcihzdGF0ZS5zcmMuc3Vic3RyKHN0YXJ0LCBwb3NBZnRlck1hcmtlciAtIHN0YXJ0IC0gMSkpO1xuXG4gICAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgICAgdHlwZTogJ29yZGVyZWRfbGlzdF9vcGVuJyxcbiAgICAgIG9yZGVyOiBtYXJrZXJWYWx1ZSxcbiAgICAgIGxpbmVzOiBsaXN0TGluZXMgPSBbIHN0YXJ0TGluZSwgMCBdLFxuICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgICB9KTtcblxuICB9IGVsc2Uge1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgIHR5cGU6ICdidWxsZXRfbGlzdF9vcGVuJyxcbiAgICAgIGxpbmVzOiBsaXN0TGluZXMgPSBbIHN0YXJ0TGluZSwgMCBdLFxuICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgICB9KTtcbiAgfVxuXG4gIC8vXG4gIC8vIEl0ZXJhdGUgbGlzdCBpdGVtc1xuICAvL1xuXG4gIG5leHRMaW5lID0gc3RhcnRMaW5lO1xuICBwcmV2RW1wdHlFbmQgPSBmYWxzZTtcbiAgdGVybWluYXRvclJ1bGVzID0gc3RhdGUucGFyc2VyLnJ1bGVyLmdldFJ1bGVzKCdsaXN0Jyk7XG5cbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIGNvbnRlbnRTdGFydCA9IHN0YXRlLnNraXBTcGFjZXMocG9zQWZ0ZXJNYXJrZXIpO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG5cbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCkge1xuICAgICAgLy8gdHJpbW1pbmcgc3BhY2UgaW4gXCItICAgIFxcbiAgM1wiIGNhc2UsIGluZGVudCBpcyAxIGhlcmVcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZW50QWZ0ZXJNYXJrZXIgPSBjb250ZW50U3RhcnQgLSBwb3NBZnRlck1hcmtlcjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIG1vcmUgdGhhbiA0IHNwYWNlcywgdGhlIGluZGVudCBpcyAxXG4gICAgLy8gKHRoZSByZXN0IGlzIGp1c3QgaW5kZW50ZWQgY29kZSBibG9jaylcbiAgICBpZiAoaW5kZW50QWZ0ZXJNYXJrZXIgPiA0KSB7IGluZGVudEFmdGVyTWFya2VyID0gMTsgfVxuXG4gICAgLy8gSWYgaW5kZW50IGlzIGxlc3MgdGhhbiAxLCBhc3N1bWUgdGhhdCBpdCdzIG9uZSwgZXhhbXBsZTpcbiAgICAvLyAgXCItXFxuICB0ZXN0XCJcbiAgICBpZiAoaW5kZW50QWZ0ZXJNYXJrZXIgPCAxKSB7IGluZGVudEFmdGVyTWFya2VyID0gMTsgfVxuXG4gICAgLy8gXCIgIC0gIHRlc3RcIlxuICAgIC8vICBeXl5eXiAtIGNhbGN1bGF0aW5nIHRvdGFsIGxlbmd0aCBvZiB0aGlzIHRoaW5nXG4gICAgaW5kZW50ID0gKHBvc0FmdGVyTWFya2VyIC0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSkgKyBpbmRlbnRBZnRlck1hcmtlcjtcblxuICAgIC8vIFJ1biBzdWJwYXJzZXIgJiB3cml0ZSB0b2tlbnNcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnbGlzdF9pdGVtX29wZW4nLFxuICAgICAgbGluZXM6IGl0ZW1MaW5lcyA9IFsgc3RhcnRMaW5lLCAwIF0sXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICAgIH0pO1xuXG4gICAgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICAgIG9sZFRpZ2h0ID0gc3RhdGUudGlnaHQ7XG4gICAgb2xkVFNoaWZ0ID0gc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gICAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gICAgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0gPSBjb250ZW50U3RhcnQgLSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXTtcbiAgICBzdGF0ZS5ibGtJbmRlbnQgPSBpbmRlbnQ7XG4gICAgc3RhdGUudGlnaHQgPSB0cnVlO1xuICAgIHN0YXRlLnBhcmVudFR5cGUgPSAnbGlzdCc7XG5cbiAgICBzdGF0ZS5wYXJzZXIudG9rZW5pemUoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgdHJ1ZSk7XG5cbiAgICAvLyBJZiBhbnkgb2YgbGlzdCBpdGVtIGlzIHRpZ2h0LCBtYXJrIGxpc3QgYXMgdGlnaHRcbiAgICBpZiAoIXN0YXRlLnRpZ2h0IHx8IHByZXZFbXB0eUVuZCkge1xuICAgICAgdGlnaHQgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gSXRlbSBiZWNvbWUgbG9vc2UgaWYgZmluaXNoIHdpdGggZW1wdHkgbGluZSxcbiAgICAvLyBidXQgd2Ugc2hvdWxkIGZpbHRlciBsYXN0IGVsZW1lbnQsIGJlY2F1c2UgaXQgbWVhbnMgbGlzdCBmaW5pc2hcbiAgICBwcmV2RW1wdHlFbmQgPSAoc3RhdGUubGluZSAtIHN0YXJ0TGluZSkgPiAxICYmIHN0YXRlLmlzRW1wdHkoc3RhdGUubGluZSAtIDEpO1xuXG4gICAgc3RhdGUuYmxrSW5kZW50ID0gb2xkSW5kZW50O1xuICAgIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdID0gb2xkVFNoaWZ0O1xuICAgIHN0YXRlLnRpZ2h0ID0gb2xkVGlnaHQ7XG4gICAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG5cbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnbGlzdF9pdGVtX2Nsb3NlJyxcbiAgICAgIGxldmVsOiAtLXN0YXRlLmxldmVsXG4gICAgfSk7XG5cbiAgICBuZXh0TGluZSA9IHN0YXJ0TGluZSA9IHN0YXRlLmxpbmU7XG4gICAgaXRlbUxpbmVzWzFdID0gbmV4dExpbmU7XG4gICAgY29udGVudFN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV07XG5cbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkgeyBicmVhazsgfVxuXG4gICAgaWYgKHN0YXRlLmlzRW1wdHkobmV4dExpbmUpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFRyeSB0byBjaGVjayBpZiBsaXN0IGlzIHRlcm1pbmF0ZWQgb3IgY29udGludWVkLlxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWs7IH1cblxuICAgIC8vIGZhaWwgaWYgdGVybWluYXRpbmcgYmxvY2sgZm91bmRcbiAgICB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7IGJyZWFrOyB9XG5cbiAgICAvLyBmYWlsIGlmIGxpc3QgaGFzIGFub3RoZXIgdHlwZVxuICAgIGlmIChpc09yZGVyZWQpIHtcbiAgICAgIHBvc0FmdGVyTWFya2VyID0gc2tpcE9yZGVyZWRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSk7XG4gICAgICBpZiAocG9zQWZ0ZXJNYXJrZXIgPCAwKSB7IGJyZWFrOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvc0FmdGVyTWFya2VyID0gc2tpcEJ1bGxldExpc3RNYXJrZXIoc3RhdGUsIG5leHRMaW5lKTtcbiAgICAgIGlmIChwb3NBZnRlck1hcmtlciA8IDApIHsgYnJlYWs7IH1cbiAgICB9XG5cbiAgICBpZiAobWFya2VyQ2hhckNvZGUgIT09IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvc0FmdGVyTWFya2VyIC0gMSkpIHsgYnJlYWs7IH1cbiAgfVxuXG4gIC8vIEZpbmlsaXplIGxpc3RcbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6IGlzT3JkZXJlZCA/ICdvcmRlcmVkX2xpc3RfY2xvc2UnIDogJ2J1bGxldF9saXN0X2Nsb3NlJyxcbiAgICBsZXZlbDogLS1zdGF0ZS5sZXZlbFxuICB9KTtcbiAgbGlzdExpbmVzWzFdID0gbmV4dExpbmU7XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuXG4gIC8vIG1hcmsgcGFyYWdyYXBocyB0aWdodCBpZiBuZWVkZWRcbiAgaWYgKHRpZ2h0KSB7XG4gICAgbWFya1RpZ2h0UGFyYWdyYXBocyhzdGF0ZSwgbGlzdFRva0lkeCk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQYXJhZ3JhcGhcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyYWdyYXBoKHN0YXRlLCBzdGFydExpbmUvKiwgZW5kTGluZSovKSB7XG4gIHZhciBlbmRMaW5lLCBjb250ZW50LCB0ZXJtaW5hdGUsIGksIGwsXG4gICAgICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDEsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXM7XG5cbiAgZW5kTGluZSA9IHN0YXRlLmxpbmVNYXg7XG5cbiAgLy8ganVtcCBsaW5lLWJ5LWxpbmUgdW50aWwgZW1wdHkgb25lIG9yIEVPRlxuICBpZiAobmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkge1xuICAgIHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLnBhcnNlci5ydWxlci5nZXRSdWxlcygncGFyYWdyYXBoJyk7XG5cbiAgICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKTsgbmV4dExpbmUrKykge1xuICAgICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgICBpZiAoc3RhdGUudFNoaWZ0W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgY29udGludWU7IH1cblxuICAgICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICAgIHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgICAgZm9yIChpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgICAgdGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhazsgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKS50cmltKCk7XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuICBpZiAoY29udGVudC5sZW5ndGgpIHtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAncGFyYWdyYXBoX29wZW4nLFxuICAgICAgdGlnaHQ6IGZhbHNlLFxuICAgICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF0sXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWxcbiAgICB9KTtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAnaW5saW5lJyxcbiAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWwgKyAxLFxuICAgICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF0sXG4gICAgICBjaGlsZHJlbjogW11cbiAgICB9KTtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAncGFyYWdyYXBoX2Nsb3NlJyxcbiAgICAgIHRpZ2h0OiBmYWxzZSxcbiAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUGFyc2VyIHN0YXRlIGNsYXNzXG5cbid1c2Ugc3RyaWN0JztcblxuXG5mdW5jdGlvbiBTdGF0ZUJsb2NrKHNyYywgcGFyc2VyLCBvcHRpb25zLCBlbnYsIHRva2Vucykge1xuICB2YXIgY2gsIHMsIHN0YXJ0LCBwb3MsIGxlbiwgaW5kZW50LCBpbmRlbnRfZm91bmQ7XG5cbiAgdGhpcy5zcmMgPSBzcmM7XG5cbiAgLy8gU2hvcnRjdXRzIHRvIHNpbXBsaWZ5IG5lc3RlZCBjYWxsc1xuICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHRoaXMuZW52ID0gZW52O1xuXG4gIC8vXG4gIC8vIEludGVybmFsIHN0YXRlIHZhcnRpYWJsZXNcbiAgLy9cblxuICB0aGlzLnRva2VucyA9IHRva2VucztcblxuICB0aGlzLmJNYXJrcyA9IFtdOyAgLy8gbGluZSBiZWdpbiBvZmZzZXRzIGZvciBmYXN0IGp1bXBzXG4gIHRoaXMuZU1hcmtzID0gW107ICAvLyBsaW5lIGVuZCBvZmZzZXRzIGZvciBmYXN0IGp1bXBzXG4gIHRoaXMudFNoaWZ0ID0gW107ICAvLyBpbmRlbnQgZm9yIGVhY2ggbGluZVxuXG4gIC8vIGJsb2NrIHBhcnNlciB2YXJpYWJsZXNcbiAgdGhpcy5ibGtJbmRlbnQgID0gMDsgLy8gcmVxdWlyZWQgYmxvY2sgY29udGVudCBpbmRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gKGZvciBleGFtcGxlLCBpZiB3ZSBhcmUgaW4gbGlzdClcbiAgdGhpcy5saW5lICAgICAgID0gMDsgLy8gbGluZSBpbmRleCBpbiBzcmNcbiAgdGhpcy5saW5lTWF4ICAgID0gMDsgLy8gbGluZXMgY291bnRcbiAgdGhpcy50aWdodCAgICAgID0gZmFsc2U7ICAvLyBsb29zZS90aWdodCBtb2RlIGZvciBsaXN0c1xuICB0aGlzLnBhcmVudFR5cGUgPSAncm9vdCc7IC8vIGlmIGBsaXN0YCwgYmxvY2sgcGFyc2VyIHN0b3BzIG9uIHR3byBuZXdsaW5lc1xuICB0aGlzLmRkSW5kZW50ICAgPSAtMTsgLy8gaW5kZW50IG9mIHRoZSBjdXJyZW50IGRkIGJsb2NrICgtMSBpZiB0aGVyZSBpc24ndCBhbnkpXG5cbiAgdGhpcy5sZXZlbCA9IDA7XG5cbiAgLy8gcmVuZGVyZXJcbiAgdGhpcy5yZXN1bHQgPSAnJztcblxuICAvLyBDcmVhdGUgY2FjaGVzXG4gIC8vIEdlbmVyYXRlIG1hcmtlcnMuXG4gIHMgPSB0aGlzLnNyYztcbiAgaW5kZW50ID0gMDtcbiAgaW5kZW50X2ZvdW5kID0gZmFsc2U7XG5cbiAgZm9yIChzdGFydCA9IHBvcyA9IGluZGVudCA9IDAsIGxlbiA9IHMubGVuZ3RoOyBwb3MgPCBsZW47IHBvcysrKSB7XG4gICAgY2ggPSBzLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmICghaW5kZW50X2ZvdW5kKSB7XG4gICAgICBpZiAoY2ggPT09IDB4MjAvKiBzcGFjZSAqLykge1xuICAgICAgICBpbmRlbnQrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRlbnRfZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjaCA9PT0gMHgwQSB8fCBwb3MgPT09IGxlbiAtIDEpIHtcbiAgICAgIGlmIChjaCAhPT0gMHgwQSkgeyBwb3MrKzsgfVxuICAgICAgdGhpcy5iTWFya3MucHVzaChzdGFydCk7XG4gICAgICB0aGlzLmVNYXJrcy5wdXNoKHBvcyk7XG4gICAgICB0aGlzLnRTaGlmdC5wdXNoKGluZGVudCk7XG5cbiAgICAgIGluZGVudF9mb3VuZCA9IGZhbHNlO1xuICAgICAgaW5kZW50ID0gMDtcbiAgICAgIHN0YXJ0ID0gcG9zICsgMTtcbiAgICB9XG4gIH1cblxuICAvLyBQdXNoIGZha2UgZW50cnkgdG8gc2ltcGxpZnkgY2FjaGUgYm91bmRzIGNoZWNrc1xuICB0aGlzLmJNYXJrcy5wdXNoKHMubGVuZ3RoKTtcbiAgdGhpcy5lTWFya3MucHVzaChzLmxlbmd0aCk7XG4gIHRoaXMudFNoaWZ0LnB1c2goMCk7XG5cbiAgdGhpcy5saW5lTWF4ID0gdGhpcy5iTWFya3MubGVuZ3RoIC0gMTsgLy8gZG9uJ3QgY291bnQgbGFzdCBmYWtlIGxpbmVcbn1cblxuU3RhdGVCbG9jay5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uIGlzRW1wdHkobGluZSkge1xuICByZXR1cm4gdGhpcy5iTWFya3NbbGluZV0gKyB0aGlzLnRTaGlmdFtsaW5lXSA+PSB0aGlzLmVNYXJrc1tsaW5lXTtcbn07XG5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBFbXB0eUxpbmVzID0gZnVuY3Rpb24gc2tpcEVtcHR5TGluZXMoZnJvbSkge1xuICBmb3IgKHZhciBtYXggPSB0aGlzLmxpbmVNYXg7IGZyb20gPCBtYXg7IGZyb20rKykge1xuICAgIGlmICh0aGlzLmJNYXJrc1tmcm9tXSArIHRoaXMudFNoaWZ0W2Zyb21dIDwgdGhpcy5lTWFya3NbZnJvbV0pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZnJvbTtcbn07XG5cbi8vIFNraXAgc3BhY2VzIGZyb20gZ2l2ZW4gcG9zaXRpb24uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwU3BhY2VzID0gZnVuY3Rpb24gc2tpcFNwYWNlcyhwb3MpIHtcbiAgZm9yICh2YXIgbWF4ID0gdGhpcy5zcmMubGVuZ3RoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgaWYgKHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgyMC8qIHNwYWNlICovKSB7IGJyZWFrOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgY2hhciBjb2RlcyBmcm9tIGdpdmVuIHBvc2l0aW9uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnMgPSBmdW5jdGlvbiBza2lwQ2hhcnMocG9zLCBjb2RlKSB7XG4gIGZvciAodmFyIG1heCA9IHRoaXMuc3JjLmxlbmd0aDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGlmICh0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IGNvZGUpIHsgYnJlYWs7IH1cbiAgfVxuICByZXR1cm4gcG9zO1xufTtcblxuLy8gU2tpcCBjaGFyIGNvZGVzIHJldmVyc2UgZnJvbSBnaXZlbiBwb3NpdGlvbiAtIDFcblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBDaGFyc0JhY2sgPSBmdW5jdGlvbiBza2lwQ2hhcnNCYWNrKHBvcywgY29kZSwgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7IHJldHVybiBwb3M7IH1cblxuICB3aGlsZSAocG9zID4gbWluKSB7XG4gICAgaWYgKGNvZGUgIT09IHRoaXMuc3JjLmNoYXJDb2RlQXQoLS1wb3MpKSB7IHJldHVybiBwb3MgKyAxOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIGN1dCBsaW5lcyByYW5nZSBmcm9tIHNvdXJjZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLmdldExpbmVzID0gZnVuY3Rpb24gZ2V0TGluZXMoYmVnaW4sIGVuZCwgaW5kZW50LCBrZWVwTGFzdExGKSB7XG4gIHZhciBpLCBmaXJzdCwgbGFzdCwgcXVldWUsIHNoaWZ0LFxuICAgICAgbGluZSA9IGJlZ2luO1xuXG4gIGlmIChiZWdpbiA+PSBlbmQpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBPcHQ6IGRvbid0IHVzZSBwdXNoIHF1ZXVlIGZvciBzaW5nbGUgbGluZTtcbiAgaWYgKGxpbmUgKyAxID09PSBlbmQpIHtcbiAgICBmaXJzdCA9IHRoaXMuYk1hcmtzW2xpbmVdICsgTWF0aC5taW4odGhpcy50U2hpZnRbbGluZV0sIGluZGVudCk7XG4gICAgbGFzdCA9IGtlZXBMYXN0TEYgPyB0aGlzLmVNYXJrc1tsaW5lXSArIDEgOiB0aGlzLmVNYXJrc1tsaW5lXTtcbiAgICByZXR1cm4gdGhpcy5zcmMuc2xpY2UoZmlyc3QsIGxhc3QpO1xuICB9XG5cbiAgcXVldWUgPSBuZXcgQXJyYXkoZW5kIC0gYmVnaW4pO1xuXG4gIGZvciAoaSA9IDA7IGxpbmUgPCBlbmQ7IGxpbmUrKywgaSsrKSB7XG4gICAgc2hpZnQgPSB0aGlzLnRTaGlmdFtsaW5lXTtcbiAgICBpZiAoc2hpZnQgPiBpbmRlbnQpIHsgc2hpZnQgPSBpbmRlbnQ7IH1cbiAgICBpZiAoc2hpZnQgPCAwKSB7IHNoaWZ0ID0gMDsgfVxuXG4gICAgZmlyc3QgPSB0aGlzLmJNYXJrc1tsaW5lXSArIHNoaWZ0O1xuXG4gICAgaWYgKGxpbmUgKyAxIDwgZW5kIHx8IGtlZXBMYXN0TEYpIHtcbiAgICAgIC8vIE5vIG5lZWQgZm9yIGJvdW5kcyBjaGVjayBiZWNhdXNlIHdlIGhhdmUgZmFrZSBlbnRyeSBvbiB0YWlsLlxuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdO1xuICAgIH1cblxuICAgIHF1ZXVlW2ldID0gdGhpcy5zcmMuc2xpY2UoZmlyc3QsIGxhc3QpO1xuICB9XG5cbiAgcmV0dXJuIHF1ZXVlLmpvaW4oJycpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlQmxvY2s7XG4iLCIvLyBHRk0gdGFibGUsIG5vbi1zdGFuZGFyZFxuXG4ndXNlIHN0cmljdCc7XG5cblxuZnVuY3Rpb24gZ2V0TGluZShzdGF0ZSwgbGluZSkge1xuICB2YXIgcG9zID0gc3RhdGUuYk1hcmtzW2xpbmVdICsgc3RhdGUuYmxrSW5kZW50LFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW2xpbmVdO1xuXG4gIHJldHVybiBzdGF0ZS5zcmMuc3Vic3RyKHBvcywgbWF4IC0gcG9zKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRhYmxlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgY2gsIGxpbmVUZXh0LCBwb3MsIGksIG5leHRMaW5lLCByb3dzLFxuICAgICAgYWxpZ25zLCB0LCB0YWJsZUxpbmVzLCB0Ym9keUxpbmVzO1xuXG4gIC8vIHNob3VsZCBoYXZlIGF0IGxlYXN0IHRocmVlIGxpbmVzXG4gIGlmIChzdGFydExpbmUgKyAyID4gZW5kTGluZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgaWYgKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBzZWNvbmQgbGluZSBzaG91bGQgYmUgJ3wnIG9yICctJ1xuXG4gIHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICBpZiAocG9zID49IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICBpZiAoY2ggIT09IDB4N0MvKiB8ICovICYmIGNoICE9PSAweDJELyogLSAqLyAmJiBjaCAhPT0gMHgzQS8qIDogKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBzdGFydExpbmUgKyAxKTtcbiAgaWYgKCEvXlstOnwgXSskLy50ZXN0KGxpbmVUZXh0KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICByb3dzID0gbGluZVRleHQuc3BsaXQoJ3wnKTtcbiAgaWYgKHJvd3MgPD0gMikgeyByZXR1cm4gZmFsc2U7IH1cbiAgYWxpZ25zID0gW107XG4gIGZvciAoaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgdCA9IHJvd3NbaV0udHJpbSgpO1xuICAgIGlmICghdCkge1xuICAgICAgLy8gYWxsb3cgZW1wdHkgY29sdW1ucyBiZWZvcmUgYW5kIGFmdGVyIHRhYmxlLCBidXQgbm90IGluIGJldHdlZW4gY29sdW1ucztcbiAgICAgIC8vIGUuZy4gYWxsb3cgYCB8LS0tfCBgLCBkaXNhbGxvdyBgIC0tLXx8LS0tIGBcbiAgICAgIGlmIChpID09PSAwIHx8IGkgPT09IHJvd3MubGVuZ3RoIC0gMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIS9eOj8tKzo/JC8udGVzdCh0KSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBpZiAodC5jaGFyQ29kZUF0KHQubGVuZ3RoIC0gMSkgPT09IDB4M0EvKiA6ICovKSB7XG4gICAgICBhbGlnbnMucHVzaCh0LmNoYXJDb2RlQXQoMCkgPT09IDB4M0EvKiA6ICovID8gJ2NlbnRlcicgOiAncmlnaHQnKTtcbiAgICB9IGVsc2UgaWYgKHQuY2hhckNvZGVBdCgwKSA9PT0gMHgzQS8qIDogKi8pIHtcbiAgICAgIGFsaWducy5wdXNoKCdsZWZ0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFsaWducy5wdXNoKCcnKTtcbiAgICB9XG4gIH1cblxuICBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIHN0YXJ0TGluZSkudHJpbSgpO1xuICBpZiAobGluZVRleHQuaW5kZXhPZignfCcpID09PSAtMSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgcm93cyA9IGxpbmVUZXh0LnJlcGxhY2UoL15cXHx8XFx8JC9nLCAnJykuc3BsaXQoJ3wnKTtcbiAgaWYgKGFsaWducy5sZW5ndGggIT09IHJvd3MubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICd0YWJsZV9vcGVuJyxcbiAgICBsaW5lczogdGFibGVMaW5lcyA9IFsgc3RhcnRMaW5lLCAwIF0sXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgfSk7XG4gIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICB0eXBlOiAndGhlYWRfb3BlbicsXG4gICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxIF0sXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgfSk7XG5cbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICd0cl9vcGVuJyxcbiAgICBsaW5lczogWyBzdGFydExpbmUsIHN0YXJ0TGluZSArIDEgXSxcbiAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICB9KTtcbiAgZm9yIChpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICB0eXBlOiAndGhfb3BlbicsXG4gICAgICBhbGlnbjogYWxpZ25zW2ldLFxuICAgICAgbGluZXM6IFsgc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxIF0sXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICAgIH0pO1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgY29udGVudDogcm93c1tpXS50cmltKCksXG4gICAgICBsaW5lczogWyBzdGFydExpbmUsIHN0YXJ0TGluZSArIDEgXSxcbiAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbCxcbiAgICAgIGNoaWxkcmVuOiBbXVxuICAgIH0pO1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHsgdHlwZTogJ3RoX2Nsb3NlJywgbGV2ZWw6IC0tc3RhdGUubGV2ZWwgfSk7XG4gIH1cbiAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAndHJfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcbiAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAndGhlYWRfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcblxuICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgdHlwZTogJ3Rib2R5X29wZW4nLFxuICAgIGxpbmVzOiB0Ym9keUxpbmVzID0gWyBzdGFydExpbmUgKyAyLCAwIF0sXG4gICAgbGV2ZWw6IHN0YXRlLmxldmVsKytcbiAgfSk7XG5cbiAgZm9yIChuZXh0TGluZSA9IHN0YXJ0TGluZSArIDI7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgIGlmIChzdGF0ZS50U2hpZnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG5cbiAgICBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIG5leHRMaW5lKS50cmltKCk7XG4gICAgaWYgKGxpbmVUZXh0LmluZGV4T2YoJ3wnKSA9PT0gLTEpIHsgYnJlYWs7IH1cbiAgICByb3dzID0gbGluZVRleHQucmVwbGFjZSgvXlxcfHxcXHwkL2csICcnKS5zcGxpdCgnfCcpO1xuXG4gICAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAndHJfb3BlbicsIGxldmVsOiBzdGF0ZS5sZXZlbCsrIH0pO1xuICAgIGZvciAoaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzdGF0ZS50b2tlbnMucHVzaCh7IHR5cGU6ICd0ZF9vcGVuJywgYWxpZ246IGFsaWduc1tpXSwgbGV2ZWw6IHN0YXRlLmxldmVsKysgfSk7XG4gICAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgICBjb250ZW50OiByb3dzW2ldLnJlcGxhY2UoL15cXHw/ICp8ICpcXHw/JC9nLCAnJyksXG4gICAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbCxcbiAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICB9KTtcbiAgICAgIHN0YXRlLnRva2Vucy5wdXNoKHsgdHlwZTogJ3RkX2Nsb3NlJywgbGV2ZWw6IC0tc3RhdGUubGV2ZWwgfSk7XG4gICAgfVxuICAgIHN0YXRlLnRva2Vucy5wdXNoKHsgdHlwZTogJ3RyX2Nsb3NlJywgbGV2ZWw6IC0tc3RhdGUubGV2ZWwgfSk7XG4gIH1cbiAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAndGJvZHlfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcbiAgc3RhdGUudG9rZW5zLnB1c2goeyB0eXBlOiAndGFibGVfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcblxuICB0YWJsZUxpbmVzWzFdID0gdGJvZHlMaW5lc1sxXSA9IG5leHRMaW5lO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFBhcnNlIGFiYnJldmlhdGlvbiBkZWZpbml0aW9ucywgaS5lLiBgKlthYmJyXTogZGVzY3JpcHRpb25gXG4vL1xuXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFN0YXRlSW5saW5lICAgID0gcmVxdWlyZSgnLi4vcnVsZXNfaW5saW5lL3N0YXRlX2lubGluZScpO1xudmFyIHBhcnNlTGlua0xhYmVsID0gcmVxdWlyZSgnLi4vaGVscGVycy9wYXJzZV9saW5rX2xhYmVsJyk7XG5cblxuZnVuY3Rpb24gcGFyc2VBYmJyKHN0ciwgcGFyc2VySW5saW5lLCBvcHRpb25zLCBlbnYpIHtcbiAgdmFyIHN0YXRlLCBsYWJlbEVuZCwgcG9zLCBtYXgsIGxhYmVsLCB0aXRsZTtcblxuICBpZiAoc3RyLmNoYXJDb2RlQXQoMCkgIT09IDB4MkEvKiAqICovKSB7IHJldHVybiAtMTsgfVxuICBpZiAoc3RyLmNoYXJDb2RlQXQoMSkgIT09IDB4NUIvKiBbICovKSB7IHJldHVybiAtMTsgfVxuXG4gIGlmIChzdHIuaW5kZXhPZignXTonKSA9PT0gLTEpIHsgcmV0dXJuIC0xOyB9XG5cbiAgc3RhdGUgPSBuZXcgU3RhdGVJbmxpbmUoc3RyLCBwYXJzZXJJbmxpbmUsIG9wdGlvbnMsIGVudiwgW10pO1xuICBsYWJlbEVuZCA9IHBhcnNlTGlua0xhYmVsKHN0YXRlLCAxKTtcblxuICBpZiAobGFiZWxFbmQgPCAwIHx8IHN0ci5jaGFyQ29kZUF0KGxhYmVsRW5kICsgMSkgIT09IDB4M0EvKiA6ICovKSB7IHJldHVybiAtMTsgfVxuXG4gIG1heCA9IHN0YXRlLnBvc01heDtcblxuICAvLyBhYmJyIHRpdGxlIGlzIGFsd2F5cyBvbmUgbGluZSwgc28gbG9va2luZyBmb3IgZW5kaW5nIFwiXFxuXCIgaGVyZVxuICBmb3IgKHBvcyA9IGxhYmVsRW5kICsgMjsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDBBKSB7IGJyZWFrOyB9XG4gIH1cblxuICBsYWJlbCA9IHN0ci5zbGljZSgyLCBsYWJlbEVuZCk7XG4gIHRpdGxlID0gc3RyLnNsaWNlKGxhYmVsRW5kICsgMiwgcG9zKS50cmltKCk7XG4gIGlmICh0aXRsZS5sZW5ndGggPT09IDApIHsgcmV0dXJuIC0xOyB9XG4gIGlmICghZW52LmFiYnJldmlhdGlvbnMpIHsgZW52LmFiYnJldmlhdGlvbnMgPSB7fTsgfVxuICAvLyBwcmVwZW5kICc6JyB0byBhdm9pZCBjb25mbGljdCB3aXRoIE9iamVjdC5wcm90b3R5cGUgbWVtYmVyc1xuICBpZiAodHlwZW9mIGVudi5hYmJyZXZpYXRpb25zWyc6JyArIGxhYmVsXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBlbnYuYWJicmV2aWF0aW9uc1snOicgKyBsYWJlbF0gPSB0aXRsZTtcbiAgfVxuXG4gIHJldHVybiBwb3M7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYWJicihzdGF0ZSkge1xuICB2YXIgdG9rZW5zID0gc3RhdGUudG9rZW5zLCBpLCBsLCBjb250ZW50LCBwb3M7XG5cbiAgaWYgKHN0YXRlLmlubGluZU1vZGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBQYXJzZSBpbmxpbmVzXG4gIGZvciAoaSA9IDEsIGwgPSB0b2tlbnMubGVuZ3RoIC0gMTsgaSA8IGw7IGkrKykge1xuICAgIGlmICh0b2tlbnNbaSAtIDFdLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicgJiZcbiAgICAgICAgdG9rZW5zW2ldLnR5cGUgPT09ICdpbmxpbmUnICYmXG4gICAgICAgIHRva2Vuc1tpICsgMV0udHlwZSA9PT0gJ3BhcmFncmFwaF9jbG9zZScpIHtcblxuICAgICAgY29udGVudCA9IHRva2Vuc1tpXS5jb250ZW50O1xuICAgICAgd2hpbGUgKGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgIHBvcyA9IHBhcnNlQWJicihjb250ZW50LCBzdGF0ZS5pbmxpbmUsIHN0YXRlLm9wdGlvbnMsIHN0YXRlLmVudik7XG4gICAgICAgIGlmIChwb3MgPCAwKSB7IGJyZWFrOyB9XG4gICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKHBvcykudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICB0b2tlbnNbaV0uY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICBpZiAoIWNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgIHRva2Vuc1tpIC0gMV0udGlnaHQgPSB0cnVlO1xuICAgICAgICB0b2tlbnNbaSArIDFdLnRpZ2h0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iLCIvLyBFbmNsb3NlIGFiYnJldmlhdGlvbnMgaW4gPGFiYnI+IHRhZ3Ncbi8vXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFBVTkNUX0NIQVJTID0gJyBcXG4oKVtdXFwnXCIuLCE/LSc7XG5cblxuLy8gZnJvbSBHb29nbGUgY2xvc3VyZSBsaWJyYXJ5XG4vLyBodHRwOi8vY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL2dpdC1oaXN0b3J5L2RvY3MvbG9jYWxfY2xvc3VyZV9nb29nX3N0cmluZ19zdHJpbmcuanMuc291cmNlLmh0bWwjbGluZTEwMjFcbmZ1bmN0aW9uIHJlZ0VzY2FwZShzKSB7XG4gIHJldHVybiBzLnJlcGxhY2UoLyhbLSgpXFxbXFxde30rPyouJFxcXnwsOiM8IVxcXFxdKS9nLCAnXFxcXCQxJyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhYmJyMihzdGF0ZSkge1xuICB2YXIgaSwgaiwgbCwgdG9rZW5zLCB0b2tlbiwgdGV4dCwgbm9kZXMsIHBvcywgbGV2ZWwsIHJlZywgbSwgcmVnVGV4dCxcbiAgICAgIGJsb2NrVG9rZW5zID0gc3RhdGUudG9rZW5zO1xuXG4gIGlmICghc3RhdGUuZW52LmFiYnJldmlhdGlvbnMpIHsgcmV0dXJuOyB9XG4gIGlmICghc3RhdGUuZW52LmFiYnJSZWdFeHApIHtcbiAgICByZWdUZXh0ID0gJyhefFsnICsgUFVOQ1RfQ0hBUlMuc3BsaXQoJycpLm1hcChyZWdFc2NhcGUpLmpvaW4oJycpICsgJ10pJ1xuICAgICAgICAgICAgKyAnKCcgKyBPYmplY3Qua2V5cyhzdGF0ZS5lbnYuYWJicmV2aWF0aW9ucykubWFwKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHguc3Vic3RyKDEpO1xuICAgICAgICAgICAgICAgICAgICB9KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH0pLm1hcChyZWdFc2NhcGUpLmpvaW4oJ3wnKSArICcpJ1xuICAgICAgICAgICAgKyAnKCR8WycgKyBQVU5DVF9DSEFSUy5zcGxpdCgnJykubWFwKHJlZ0VzY2FwZSkuam9pbignJykgKyAnXSknO1xuICAgIHN0YXRlLmVudi5hYmJyUmVnRXhwID0gbmV3IFJlZ0V4cChyZWdUZXh0LCAnZycpO1xuICB9XG4gIHJlZyA9IHN0YXRlLmVudi5hYmJyUmVnRXhwO1xuXG4gIGZvciAoaiA9IDAsIGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICBpZiAoYmxvY2tUb2tlbnNbal0udHlwZSAhPT0gJ2lubGluZScpIHsgY29udGludWU7IH1cbiAgICB0b2tlbnMgPSBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbjtcblxuICAgIC8vIFdlIHNjYW4gZnJvbSB0aGUgZW5kLCB0byBrZWVwIHBvc2l0aW9uIHdoZW4gbmV3IHRhZ3MgYWRkZWQuXG4gICAgZm9yIChpID0gdG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgIGlmICh0b2tlbi50eXBlICE9PSAndGV4dCcpIHsgY29udGludWU7IH1cblxuICAgICAgcG9zID0gMDtcbiAgICAgIHRleHQgPSB0b2tlbi5jb250ZW50O1xuICAgICAgcmVnLmxhc3RJbmRleCA9IDA7XG4gICAgICBsZXZlbCA9IHRva2VuLmxldmVsO1xuICAgICAgbm9kZXMgPSBbXTtcblxuICAgICAgd2hpbGUgKChtID0gcmVnLmV4ZWModGV4dCkpKSB7XG4gICAgICAgIGlmIChyZWcubGFzdEluZGV4ID4gcG9zKSB7XG4gICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICBjb250ZW50OiB0ZXh0LnNsaWNlKHBvcywgbS5pbmRleCArIG1bMV0ubGVuZ3RoKSxcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2FiYnJfb3BlbicsXG4gICAgICAgICAgdGl0bGU6IHN0YXRlLmVudi5hYmJyZXZpYXRpb25zWyc6JyArIG1bMl1dLFxuICAgICAgICAgIGxldmVsOiBsZXZlbCsrXG4gICAgICAgIH0pO1xuICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgY29udGVudDogbVsyXSxcbiAgICAgICAgICBsZXZlbDogbGV2ZWxcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdhYmJyX2Nsb3NlJyxcbiAgICAgICAgICBsZXZlbDogLS1sZXZlbFxuICAgICAgICB9KTtcbiAgICAgICAgcG9zID0gcmVnLmxhc3RJbmRleCAtIG1bM10ubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW5vZGVzLmxlbmd0aCkgeyBjb250aW51ZTsgfVxuXG4gICAgICBpZiAocG9zIDwgdGV4dC5sZW5ndGgpIHtcbiAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgIGNvbnRlbnQ6IHRleHQuc2xpY2UocG9zKSxcbiAgICAgICAgICBsZXZlbDogbGV2ZWxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJlcGxhY2UgY3VycmVudCBub2RlXG4gICAgICBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbiA9IHRva2VucyA9IFtdLmNvbmNhdCh0b2tlbnMuc2xpY2UoMCwgaSksIG5vZGVzLCB0b2tlbnMuc2xpY2UoaSArIDEpKTtcbiAgICB9XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmxvY2soc3RhdGUpIHtcblxuICBpZiAoc3RhdGUuaW5saW5lTW9kZSkge1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgY29udGVudDogc3RhdGUuc3JjLnJlcGxhY2UoL1xcbi9nLCAnICcpLnRyaW0oKSxcbiAgICAgIGxldmVsOiAwLFxuICAgICAgbGluZXM6IFsgMCwgMSBdLFxuICAgICAgY2hpbGRyZW46IFtdXG4gICAgfSk7XG5cbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5ibG9jay5wYXJzZShzdGF0ZS5zcmMsIHN0YXRlLm9wdGlvbnMsIHN0YXRlLmVudiwgc3RhdGUudG9rZW5zKTtcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvb3Rub3RlX2Jsb2NrKHN0YXRlKSB7XG4gIHZhciBpLCBsLCBqLCB0LCBsYXN0UGFyYWdyYXBoLCBsaXN0LCB0b2tlbnMsIGN1cnJlbnQsIGN1cnJlbnRMYWJlbCxcbiAgICAgIGxldmVsID0gMCxcbiAgICAgIGluc2lkZVJlZiA9IGZhbHNlLFxuICAgICAgcmVmVG9rZW5zID0ge307XG5cbiAgaWYgKCFzdGF0ZS5lbnYuZm9vdG5vdGVzKSB7IHJldHVybjsgfVxuXG4gIHN0YXRlLnRva2VucyA9IHN0YXRlLnRva2Vucy5maWx0ZXIoZnVuY3Rpb24odG9rKSB7XG4gICAgaWYgKHRvay50eXBlID09PSAnZm9vdG5vdGVfcmVmZXJlbmNlX29wZW4nKSB7XG4gICAgICBpbnNpZGVSZWYgPSB0cnVlO1xuICAgICAgY3VycmVudCA9IFtdO1xuICAgICAgY3VycmVudExhYmVsID0gdG9rLmxhYmVsO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodG9rLnR5cGUgPT09ICdmb290bm90ZV9yZWZlcmVuY2VfY2xvc2UnKSB7XG4gICAgICBpbnNpZGVSZWYgPSBmYWxzZTtcbiAgICAgIC8vIHByZXBlbmQgJzonIHRvIGF2b2lkIGNvbmZsaWN0IHdpdGggT2JqZWN0LnByb3RvdHlwZSBtZW1iZXJzXG4gICAgICByZWZUb2tlbnNbJzonICsgY3VycmVudExhYmVsXSA9IGN1cnJlbnQ7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpbnNpZGVSZWYpIHsgY3VycmVudC5wdXNoKHRvayk7IH1cbiAgICByZXR1cm4gIWluc2lkZVJlZjtcbiAgfSk7XG5cbiAgaWYgKCFzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3QpIHsgcmV0dXJuOyB9XG4gIGxpc3QgPSBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3Q7XG5cbiAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICdmb290bm90ZV9ibG9ja19vcGVuJyxcbiAgICBsZXZlbDogbGV2ZWwrK1xuICB9KTtcbiAgZm9yIChpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgc3RhdGUudG9rZW5zLnB1c2goe1xuICAgICAgdHlwZTogJ2Zvb3Rub3RlX29wZW4nLFxuICAgICAgaWQ6IGksXG4gICAgICBsZXZlbDogbGV2ZWwrK1xuICAgIH0pO1xuXG4gICAgaWYgKGxpc3RbaV0udG9rZW5zKSB7XG4gICAgICB0b2tlbnMgPSBbXTtcbiAgICAgIHRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3BhcmFncmFwaF9vcGVuJyxcbiAgICAgICAgdGlnaHQ6IGZhbHNlLFxuICAgICAgICBsZXZlbDogbGV2ZWwrK1xuICAgICAgfSk7XG4gICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdpbmxpbmUnLFxuICAgICAgICBjb250ZW50OiAnJyxcbiAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICBjaGlsZHJlbjogbGlzdFtpXS50b2tlbnNcbiAgICAgIH0pO1xuICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAncGFyYWdyYXBoX2Nsb3NlJyxcbiAgICAgICAgdGlnaHQ6IGZhbHNlLFxuICAgICAgICBsZXZlbDogLS1sZXZlbFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChsaXN0W2ldLmxhYmVsKSB7XG4gICAgICB0b2tlbnMgPSByZWZUb2tlbnNbJzonICsgbGlzdFtpXS5sYWJlbF07XG4gICAgfVxuXG4gICAgc3RhdGUudG9rZW5zID0gc3RhdGUudG9rZW5zLmNvbmNhdCh0b2tlbnMpO1xuICAgIGlmIChzdGF0ZS50b2tlbnNbc3RhdGUudG9rZW5zLmxlbmd0aCAtIDFdLnR5cGUgPT09ICdwYXJhZ3JhcGhfY2xvc2UnKSB7XG4gICAgICBsYXN0UGFyYWdyYXBoID0gc3RhdGUudG9rZW5zLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0UGFyYWdyYXBoID0gbnVsbDtcbiAgICB9XG5cbiAgICB0ID0gbGlzdFtpXS5jb3VudCA+IDAgPyBsaXN0W2ldLmNvdW50IDogMTtcbiAgICBmb3IgKGogPSAwOyBqIDwgdDsgaisrKSB7XG4gICAgICBzdGF0ZS50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdmb290bm90ZV9hbmNob3InLFxuICAgICAgICBpZDogaSxcbiAgICAgICAgc3ViSWQ6IGosXG4gICAgICAgIGxldmVsOiBsZXZlbFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGxhc3RQYXJhZ3JhcGgpIHtcbiAgICAgIHN0YXRlLnRva2Vucy5wdXNoKGxhc3RQYXJhZ3JhcGgpO1xuICAgIH1cblxuICAgIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICAgIHR5cGU6ICdmb290bm90ZV9jbG9zZScsXG4gICAgICBsZXZlbDogLS1sZXZlbFxuICAgIH0pO1xuICB9XG4gIHN0YXRlLnRva2Vucy5wdXNoKHtcbiAgICB0eXBlOiAnZm9vdG5vdGVfYmxvY2tfY2xvc2UnLFxuICAgIGxldmVsOiAtLWxldmVsXG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmxpbmUoc3RhdGUpIHtcbiAgdmFyIHRva2VucyA9IHN0YXRlLnRva2VucywgdG9rLCBpLCBsO1xuXG4gIC8vIFBhcnNlIGlubGluZXNcbiAgZm9yIChpID0gMCwgbCA9IHRva2Vucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB0b2sgPSB0b2tlbnNbaV07XG4gICAgaWYgKHRvay50eXBlID09PSAnaW5saW5lJykge1xuICAgICAgc3RhdGUuaW5saW5lLnBhcnNlKHRvay5jb250ZW50LCBzdGF0ZS5vcHRpb25zLCBzdGF0ZS5lbnYsIHRvay5jaGlsZHJlbik7XG4gICAgfVxuICB9XG59O1xuIiwiLy8gUmVwbGFjZSBsaW5rLWxpa2UgdGV4dHMgd2l0aCBsaW5rIG5vZGVzLlxuLy9cbi8vIEN1cnJlbnRseSByZXN0cmljdGVkIGJ5IGBpbmxpbmUudmFsaWRhdGVMaW5rKClgIHRvIGh0dHAvaHR0cHMvZnRwXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBBdXRvbGlua2VyID0gcmVxdWlyZSgnYXV0b2xpbmtlcicpO1xuXG5cbnZhciBMSU5LX1NDQU5fUkUgPSAvd3d3fEB8XFw6XFwvXFwvLztcblxuXG5mdW5jdGlvbiBpc0xpbmtPcGVuKHN0cikge1xuICByZXR1cm4gL148YVs+XFxzXS9pLnRlc3Qoc3RyKTtcbn1cbmZ1bmN0aW9uIGlzTGlua0Nsb3NlKHN0cikge1xuICByZXR1cm4gL148XFwvYVxccyo+L2kudGVzdChzdHIpO1xufVxuXG4vLyBTdHVwaWQgZmFicmljIHRvIGF2b2lkIHNpbmdsZXRvbnMsIGZvciB0aHJlYWQgc2FmZXR5LlxuLy8gUmVxdWlyZWQgZm9yIGVuZ2luZXMgbGlrZSBOYXNob3JuLlxuLy9cbmZ1bmN0aW9uIGNyZWF0ZUxpbmtpZmllcigpIHtcbiAgdmFyIGxpbmtzID0gW107XG4gIHZhciBhdXRvbGlua2VyID0gbmV3IEF1dG9saW5rZXIoe1xuICAgIHN0cmlwUHJlZml4OiBmYWxzZSxcbiAgICB1cmw6IHRydWUsXG4gICAgZW1haWw6IHRydWUsXG4gICAgdHdpdHRlcjogZmFsc2UsXG4gICAgcmVwbGFjZUZuOiBmdW5jdGlvbiAobGlua2VyLCBtYXRjaCkge1xuICAgICAgLy8gT25seSBjb2xsZWN0IG1hdGNoZWQgc3RyaW5ncyBidXQgZG9uJ3QgY2hhbmdlIGFueXRoaW5nLlxuICAgICAgc3dpdGNoIChtYXRjaC5nZXRUeXBlKCkpIHtcbiAgICAgICAgLyplc2xpbnQgZGVmYXVsdC1jYXNlOjAqL1xuICAgICAgICBjYXNlICd1cmwnOlxuICAgICAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICAgICAgdGV4dDogbWF0Y2gubWF0Y2hlZFRleHQsXG4gICAgICAgICAgICB1cmw6IG1hdGNoLmdldFVybCgpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2VtYWlsJzpcbiAgICAgICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgICAgIHRleHQ6IG1hdGNoLm1hdGNoZWRUZXh0LFxuICAgICAgICAgICAgLy8gbm9ybWFsaXplIGVtYWlsIHByb3RvY29sXG4gICAgICAgICAgICB1cmw6ICdtYWlsdG86JyArIG1hdGNoLmdldEVtYWlsKCkucmVwbGFjZSgvXm1haWx0bzovaSwgJycpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGxpbmtzOiBsaW5rcyxcbiAgICBhdXRvbGlua2VyOiBhdXRvbGlua2VyXG4gIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaW5raWZ5KHN0YXRlKSB7XG4gIHZhciBpLCBqLCBsLCB0b2tlbnMsIHRva2VuLCB0ZXh0LCBub2RlcywgbG4sIHBvcywgbGV2ZWwsIGh0bWxMaW5rTGV2ZWwsXG4gICAgICBibG9ja1Rva2VucyA9IHN0YXRlLnRva2VucyxcbiAgICAgIGxpbmtpZmllciA9IG51bGwsIGxpbmtzLCBhdXRvbGlua2VyO1xuXG4gIGlmICghc3RhdGUub3B0aW9ucy5saW5raWZ5KSB7IHJldHVybjsgfVxuXG4gIGZvciAoaiA9IDAsIGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICBpZiAoYmxvY2tUb2tlbnNbal0udHlwZSAhPT0gJ2lubGluZScpIHsgY29udGludWU7IH1cbiAgICB0b2tlbnMgPSBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbjtcblxuICAgIGh0bWxMaW5rTGV2ZWwgPSAwO1xuXG4gICAgLy8gV2Ugc2NhbiBmcm9tIHRoZSBlbmQsIHRvIGtlZXAgcG9zaXRpb24gd2hlbiBuZXcgdGFncyBhZGRlZC5cbiAgICAvLyBVc2UgcmV2ZXJzZWQgbG9naWMgaW4gbGlua3Mgc3RhcnQvZW5kIG1hdGNoXG4gICAgZm9yIChpID0gdG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgLy8gU2tpcCBjb250ZW50IG9mIG1hcmtkb3duIGxpbmtzXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2xpbmtfY2xvc2UnKSB7XG4gICAgICAgIGktLTtcbiAgICAgICAgd2hpbGUgKHRva2Vuc1tpXS5sZXZlbCAhPT0gdG9rZW4ubGV2ZWwgJiYgdG9rZW5zW2ldLnR5cGUgIT09ICdsaW5rX29wZW4nKSB7XG4gICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGNvbnRlbnQgb2YgaHRtbCB0YWcgbGlua3NcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSAnaHRtbHRhZycpIHtcbiAgICAgICAgaWYgKGlzTGlua09wZW4odG9rZW4uY29udGVudCkgJiYgaHRtbExpbmtMZXZlbCA+IDApIHtcbiAgICAgICAgICBodG1sTGlua0xldmVsLS07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTGlua0Nsb3NlKHRva2VuLmNvbnRlbnQpKSB7XG4gICAgICAgICAgaHRtbExpbmtMZXZlbCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaHRtbExpbmtMZXZlbCA+IDApIHsgY29udGludWU7IH1cblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiBMSU5LX1NDQU5fUkUudGVzdCh0b2tlbi5jb250ZW50KSkge1xuXG4gICAgICAgIC8vIEluaXQgbGlua2lmaWVyIGluIGxhenkgbWFubmVyLCBvbmx5IGlmIHJlcXVpcmVkLlxuICAgICAgICBpZiAoIWxpbmtpZmllcikge1xuICAgICAgICAgIGxpbmtpZmllciA9IGNyZWF0ZUxpbmtpZmllcigpO1xuICAgICAgICAgIGxpbmtzID0gbGlua2lmaWVyLmxpbmtzO1xuICAgICAgICAgIGF1dG9saW5rZXIgPSBsaW5raWZpZXIuYXV0b2xpbmtlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRleHQgPSB0b2tlbi5jb250ZW50O1xuICAgICAgICBsaW5rcy5sZW5ndGggPSAwO1xuICAgICAgICBhdXRvbGlua2VyLmxpbmsodGV4dCk7XG5cbiAgICAgICAgaWYgKCFsaW5rcy5sZW5ndGgpIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyBOb3cgc3BsaXQgc3RyaW5nIHRvIG5vZGVzXG4gICAgICAgIG5vZGVzID0gW107XG4gICAgICAgIGxldmVsID0gdG9rZW4ubGV2ZWw7XG5cbiAgICAgICAgZm9yIChsbiA9IDA7IGxuIDwgbGlua3MubGVuZ3RoOyBsbisrKSB7XG5cbiAgICAgICAgICBpZiAoIXN0YXRlLmlubGluZS52YWxpZGF0ZUxpbmsobGlua3NbbG5dLnVybCkpIHsgY29udGludWU7IH1cblxuICAgICAgICAgIHBvcyA9IHRleHQuaW5kZXhPZihsaW5rc1tsbl0udGV4dCk7XG5cbiAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICBsZXZlbCA9IGxldmVsO1xuICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgY29udGVudDogdGV4dC5zbGljZSgwLCBwb3MpLFxuICAgICAgICAgICAgICBsZXZlbDogbGV2ZWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdsaW5rX29wZW4nLFxuICAgICAgICAgICAgaHJlZjogbGlua3NbbG5dLnVybCxcbiAgICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbCsrXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICBjb250ZW50OiBsaW5rc1tsbl0udGV4dCxcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ2xpbmtfY2xvc2UnLFxuICAgICAgICAgICAgbGV2ZWw6IC0tbGV2ZWxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZShwb3MgKyBsaW5rc1tsbl0udGV4dC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgY29udGVudDogdGV4dCxcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjZSBjdXJyZW50IG5vZGVcbiAgICAgICAgYmxvY2tUb2tlbnNbal0uY2hpbGRyZW4gPSB0b2tlbnMgPSBbXS5jb25jYXQodG9rZW5zLnNsaWNlKDAsIGkpLCBub2RlcywgdG9rZW5zLnNsaWNlKGkgKyAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBTdGF0ZUlubGluZSAgICAgICAgICA9IHJlcXVpcmUoJy4uL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUnKTtcbnZhciBwYXJzZUxpbmtMYWJlbCAgICAgICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvcGFyc2VfbGlua19sYWJlbCcpO1xudmFyIHBhcnNlTGlua0Rlc3RpbmF0aW9uID0gcmVxdWlyZSgnLi4vaGVscGVycy9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uJyk7XG52YXIgcGFyc2VMaW5rVGl0bGUgICAgICAgPSByZXF1aXJlKCcuLi9oZWxwZXJzL3BhcnNlX2xpbmtfdGl0bGUnKTtcbnZhciBub3JtYWxpemVSZWZlcmVuY2UgICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvbm9ybWFsaXplX3JlZmVyZW5jZScpO1xuXG5cbmZ1bmN0aW9uIHBhcnNlUmVmZXJlbmNlKHN0ciwgcGFyc2VyLCBvcHRpb25zLCBlbnYpIHtcbiAgdmFyIHN0YXRlLCBsYWJlbEVuZCwgcG9zLCBtYXgsIGNvZGUsIHN0YXJ0LCBocmVmLCB0aXRsZSwgbGFiZWw7XG5cbiAgaWYgKHN0ci5jaGFyQ29kZUF0KDApICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gLTE7IH1cblxuICBpZiAoc3RyLmluZGV4T2YoJ106JykgPT09IC0xKSB7IHJldHVybiAtMTsgfVxuXG4gIHN0YXRlID0gbmV3IFN0YXRlSW5saW5lKHN0ciwgcGFyc2VyLCBvcHRpb25zLCBlbnYsIFtdKTtcbiAgbGFiZWxFbmQgPSBwYXJzZUxpbmtMYWJlbChzdGF0ZSwgMCk7XG5cbiAgaWYgKGxhYmVsRW5kIDwgMCB8fCBzdHIuY2hhckNvZGVBdChsYWJlbEVuZCArIDEpICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gLTE7IH1cblxuICBtYXggPSBzdGF0ZS5wb3NNYXg7XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICBeXl4gc2tpcCBvcHRpb25hbCB3aGl0ZXNwYWNlIGhlcmVcbiAgZm9yIChwb3MgPSBsYWJlbEVuZCArIDI7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY29kZSAhPT0gMHgyMCAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gIH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgIF5eXl5eXl5eXl5eIHBhcnNlIHRoaXNcbiAgaWYgKCFwYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZSwgcG9zKSkgeyByZXR1cm4gLTE7IH1cbiAgaHJlZiA9IHN0YXRlLmxpbmtDb250ZW50O1xuICBwb3MgPSBzdGF0ZS5wb3M7XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIF5eXiBza2lwcGluZyB0aG9zZSBzcGFjZXNcbiAgc3RhcnQgPSBwb3M7XG4gIGZvciAocG9zID0gcG9zICsgMTsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjb2RlICE9PSAweDIwICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNlIHRoaXNcbiAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHBhcnNlTGlua1RpdGxlKHN0YXRlLCBwb3MpKSB7XG4gICAgdGl0bGUgPSBzdGF0ZS5saW5rQ29udGVudDtcbiAgICBwb3MgPSBzdGF0ZS5wb3M7XG4gIH0gZWxzZSB7XG4gICAgdGl0bGUgPSAnJztcbiAgICBwb3MgPSBzdGFydDtcbiAgfVxuXG4gIC8vIGVuc3VyZSB0aGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUgaXMgZW1wdHlcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwLyogc3BhY2UgKi8pIHsgcG9zKys7IH1cbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDBBKSB7IHJldHVybiAtMTsgfVxuXG4gIGxhYmVsID0gbm9ybWFsaXplUmVmZXJlbmNlKHN0ci5zbGljZSgxLCBsYWJlbEVuZCkpO1xuICBpZiAodHlwZW9mIGVudi5yZWZlcmVuY2VzW2xhYmVsXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBlbnYucmVmZXJlbmNlc1tsYWJlbF0gPSB7IHRpdGxlOiB0aXRsZSwgaHJlZjogaHJlZiB9O1xuICB9XG5cbiAgcmV0dXJuIHBvcztcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZmVyZW5jZXMoc3RhdGUpIHtcbiAgdmFyIHRva2VucyA9IHN0YXRlLnRva2VucywgaSwgbCwgY29udGVudCwgcG9zO1xuXG4gIHN0YXRlLmVudi5yZWZlcmVuY2VzID0gc3RhdGUuZW52LnJlZmVyZW5jZXMgfHwge307XG5cbiAgaWYgKHN0YXRlLmlubGluZU1vZGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBTY2FuIGRlZmluaXRpb25zIGluIHBhcmFncmFwaCBpbmxpbmVzXG4gIGZvciAoaSA9IDEsIGwgPSB0b2tlbnMubGVuZ3RoIC0gMTsgaSA8IGw7IGkrKykge1xuICAgIGlmICh0b2tlbnNbaV0udHlwZSA9PT0gJ2lubGluZScgJiZcbiAgICAgICAgdG9rZW5zW2kgLSAxXS50eXBlID09PSAncGFyYWdyYXBoX29wZW4nICYmXG4gICAgICAgIHRva2Vuc1tpICsgMV0udHlwZSA9PT0gJ3BhcmFncmFwaF9jbG9zZScpIHtcblxuICAgICAgY29udGVudCA9IHRva2Vuc1tpXS5jb250ZW50O1xuICAgICAgd2hpbGUgKGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgIHBvcyA9IHBhcnNlUmVmZXJlbmNlKGNvbnRlbnQsIHN0YXRlLmlubGluZSwgc3RhdGUub3B0aW9ucywgc3RhdGUuZW52KTtcbiAgICAgICAgaWYgKHBvcyA8IDApIHsgYnJlYWs7IH1cbiAgICAgICAgY29udGVudCA9IGNvbnRlbnQuc2xpY2UocG9zKS50cmltKCk7XG4gICAgICB9XG5cbiAgICAgIHRva2Vuc1tpXS5jb250ZW50ID0gY29udGVudDtcbiAgICAgIGlmICghY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgdG9rZW5zW2kgLSAxXS50aWdodCA9IHRydWU7XG4gICAgICAgIHRva2Vuc1tpICsgMV0udGlnaHQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiIsIi8vIFNpbXBsZSB0eXBvZ3JhcGhpY2FsIHJlcGxhY2VtZW50c1xuLy9cbid1c2Ugc3RyaWN0JztcblxuLy8gVE9ETzpcbi8vIC0gZnJhY3Rpb25hbHMgMS8yLCAxLzQsIDMvNCAtPiDCvSwgwrwsIMK+XG4vLyAtIG1pbHRpcGxpY2F0aW9uIDIgeCA0IC0+IDIgw5cgNFxuXG52YXIgUkFSRV9SRSA9IC9cXCstfFxcLlxcLnxcXD9cXD9cXD9cXD98ISEhIXwsLHwtLS87XG5cbnZhciBTQ09QRURfQUJCUl9SRSA9IC9cXCgoY3x0bXxyfHApXFwpL2lnO1xudmFyIFNDT1BFRF9BQkJSID0ge1xuICAnYyc6ICfCqScsXG4gICdyJzogJ8KuJyxcbiAgJ3AnOiAnwqcnLFxuICAndG0nOiAn4oSiJ1xufTtcblxuZnVuY3Rpb24gcmVwbGFjZVNjb3BlZEFiYnIoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignKCcpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG5cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFNDT1BFRF9BQkJSX1JFLCBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgIHJldHVybiBTQ09QRURfQUJCUltuYW1lLnRvTG93ZXJDYXNlKCldO1xuICB9KTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAgdmFyIGksIHRva2VuLCB0ZXh0LCBpbmxpbmVUb2tlbnMsIGJsa0lkeDtcblxuICBpZiAoIXN0YXRlLm9wdGlvbnMudHlwb2dyYXBoZXIpIHsgcmV0dXJuOyB9XG5cbiAgZm9yIChibGtJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMTsgYmxrSWR4ID49IDA7IGJsa0lkeC0tKSB7XG5cbiAgICBpZiAoc3RhdGUudG9rZW5zW2Jsa0lkeF0udHlwZSAhPT0gJ2lubGluZScpIHsgY29udGludWU7IH1cblxuICAgIGlubGluZVRva2VucyA9IHN0YXRlLnRva2Vuc1tibGtJZHhdLmNoaWxkcmVuO1xuXG4gICAgZm9yIChpID0gaW5saW5lVG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0b2tlbiA9IGlubGluZVRva2Vuc1tpXTtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgdGV4dCA9IHRva2VuLmNvbnRlbnQ7XG5cbiAgICAgICAgdGV4dCA9IHJlcGxhY2VTY29wZWRBYmJyKHRleHQpO1xuXG4gICAgICAgIGlmIChSQVJFX1JFLnRlc3QodGV4dCkpIHtcbiAgICAgICAgICB0ZXh0ID0gdGV4dFxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcKy0vZywgJ8KxJylcbiAgICAgICAgICAgIC8vIC4uLCAuLi4sIC4uLi4uLi4gLT4g4oCmXG4gICAgICAgICAgICAvLyBidXQgPy4uLi4uICYgIS4uLi4uIC0+ID8uLiAmICEuLlxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcLnsyLH0vZywgJ+KApicpLnJlcGxhY2UoLyhbPyFdKeKApi9nLCAnJDEuLicpXG4gICAgICAgICAgICAucmVwbGFjZSgvKFs/IV0pezQsfS9nLCAnJDEkMSQxJykucmVwbGFjZSgvLHsyLH0vZywgJywnKVxuICAgICAgICAgICAgLy8gZW0tZGFzaFxuICAgICAgICAgICAgLnJlcGxhY2UoLyhefFteLV0pLS0tKFteLV18JCkvbWcsICckMVxcdTIwMTQkMicpXG4gICAgICAgICAgICAvLyBlbi1kYXNoXG4gICAgICAgICAgICAucmVwbGFjZSgvKF58XFxzKS0tKFxcc3wkKS9tZywgJyQxXFx1MjAxMyQyJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oXnxbXi1cXHNdKS0tKFteLVxcc118JCkvbWcsICckMVxcdTIwMTMkMicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW4uY29udGVudCA9IHRleHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIiwiLy8gQ29udmVydCBzdHJhaWdodCBxdW90YXRpb24gbWFya3MgdG8gdHlwb2dyYXBoaWMgb25lc1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgUVVPVEVfVEVTVF9SRSA9IC9bJ1wiXS87XG52YXIgUVVPVEVfUkUgPSAvWydcIl0vZztcbnZhciBQVU5DVF9SRSA9IC9bLVxccygpXFxbXFxdXS87XG52YXIgQVBPU1RST1BIRSA9ICfigJknO1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSBpZiB0aGUgY2hhcmFjdGVyIGF0IGBwb3NgXG4vLyBjb3VsZCBiZSBpbnNpZGUgYSB3b3JkLlxuZnVuY3Rpb24gaXNMZXR0ZXIoc3RyLCBwb3MpIHtcbiAgaWYgKHBvcyA8IDAgfHwgcG9zID49IHN0ci5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIHJldHVybiAhUFVOQ1RfUkUudGVzdChzdHJbcG9zXSk7XG59XG5cblxuZnVuY3Rpb24gcmVwbGFjZUF0KHN0ciwgaW5kZXgsIGNoKSB7XG4gIHJldHVybiBzdHIuc3Vic3RyKDAsIGluZGV4KSArIGNoICsgc3RyLnN1YnN0cihpbmRleCArIDEpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc21hcnRxdW90ZXMoc3RhdGUpIHtcbiAgLyplc2xpbnQgbWF4LWRlcHRoOjAqL1xuICB2YXIgaSwgdG9rZW4sIHRleHQsIHQsIHBvcywgbWF4LCB0aGlzTGV2ZWwsIGxhc3RTcGFjZSwgbmV4dFNwYWNlLCBpdGVtLFxuICAgICAgY2FuT3BlbiwgY2FuQ2xvc2UsIGosIGlzU2luZ2xlLCBibGtJZHgsIHRva2VucyxcbiAgICAgIHN0YWNrO1xuXG4gIGlmICghc3RhdGUub3B0aW9ucy50eXBvZ3JhcGhlcikgeyByZXR1cm47IH1cblxuICBzdGFjayA9IFtdO1xuXG4gIGZvciAoYmxrSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDE7IGJsa0lkeCA+PSAwOyBibGtJZHgtLSkge1xuXG4gICAgaWYgKHN0YXRlLnRva2Vuc1tibGtJZHhdLnR5cGUgIT09ICdpbmxpbmUnKSB7IGNvbnRpbnVlOyB9XG5cbiAgICB0b2tlbnMgPSBzdGF0ZS50b2tlbnNbYmxrSWR4XS5jaGlsZHJlbjtcbiAgICBzdGFjay5sZW5ndGggPSAwO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIGlmICh0b2tlbi50eXBlICE9PSAndGV4dCcgfHwgUVVPVEVfVEVTVF9SRS50ZXN0KHRva2VuLnRleHQpKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgIHRoaXNMZXZlbCA9IHRva2Vuc1tpXS5sZXZlbDtcblxuICAgICAgZm9yIChqID0gc3RhY2subGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgaWYgKHN0YWNrW2pdLmxldmVsIDw9IHRoaXNMZXZlbCkgeyBicmVhazsgfVxuICAgICAgfVxuICAgICAgc3RhY2subGVuZ3RoID0gaiArIDE7XG5cbiAgICAgIHRleHQgPSB0b2tlbi5jb250ZW50O1xuICAgICAgcG9zID0gMDtcbiAgICAgIG1heCA9IHRleHQubGVuZ3RoO1xuXG4gICAgICAvKmVzbGludCBuby1sYWJlbHM6MCxibG9jay1zY29wZWQtdmFyOjAqL1xuICAgICAgT1VURVI6XG4gICAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICAgIFFVT1RFX1JFLmxhc3RJbmRleCA9IHBvcztcbiAgICAgICAgdCA9IFFVT1RFX1JFLmV4ZWModGV4dCk7XG4gICAgICAgIGlmICghdCkgeyBicmVhazsgfVxuXG4gICAgICAgIGxhc3RTcGFjZSA9ICFpc0xldHRlcih0ZXh0LCB0LmluZGV4IC0gMSk7XG4gICAgICAgIHBvcyA9IHQuaW5kZXggKyAxO1xuICAgICAgICBpc1NpbmdsZSA9ICh0WzBdID09PSBcIidcIik7XG4gICAgICAgIG5leHRTcGFjZSA9ICFpc0xldHRlcih0ZXh0LCBwb3MpO1xuXG4gICAgICAgIGlmICghbmV4dFNwYWNlICYmICFsYXN0U3BhY2UpIHtcbiAgICAgICAgICAvLyBtaWRkbGUgb2Ygd29yZFxuICAgICAgICAgIGlmIChpc1NpbmdsZSkge1xuICAgICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBBUE9TVFJPUEhFKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjYW5PcGVuID0gIW5leHRTcGFjZTtcbiAgICAgICAgY2FuQ2xvc2UgPSAhbGFzdFNwYWNlO1xuXG4gICAgICAgIGlmIChjYW5DbG9zZSkge1xuICAgICAgICAgIC8vIHRoaXMgY291bGQgYmUgYSBjbG9zaW5nIHF1b3RlLCByZXdpbmQgdGhlIHN0YWNrIHRvIGdldCBhIG1hdGNoXG4gICAgICAgICAgZm9yIChqID0gc3RhY2subGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgIGl0ZW0gPSBzdGFja1tqXTtcbiAgICAgICAgICAgIGlmIChzdGFja1tqXS5sZXZlbCA8IHRoaXNMZXZlbCkgeyBicmVhazsgfVxuICAgICAgICAgICAgaWYgKGl0ZW0uc2luZ2xlID09PSBpc1NpbmdsZSAmJiBzdGFja1tqXS5sZXZlbCA9PT0gdGhpc0xldmVsKSB7XG4gICAgICAgICAgICAgIGl0ZW0gPSBzdGFja1tqXTtcbiAgICAgICAgICAgICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICAgICAgICAgICAgdG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQsIGl0ZW0ucG9zLCBzdGF0ZS5vcHRpb25zLnF1b3Rlc1syXSk7XG4gICAgICAgICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBzdGF0ZS5vcHRpb25zLnF1b3Rlc1szXSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQsIGl0ZW0ucG9zLCBzdGF0ZS5vcHRpb25zLnF1b3Rlc1swXSk7XG4gICAgICAgICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBzdGF0ZS5vcHRpb25zLnF1b3Rlc1sxXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhY2subGVuZ3RoID0gajtcbiAgICAgICAgICAgICAgY29udGludWUgT1VURVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNhbk9wZW4pIHtcbiAgICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICAgIHRva2VuOiBpLFxuICAgICAgICAgICAgcG9zOiB0LmluZGV4LFxuICAgICAgICAgICAgc2luZ2xlOiBpc1NpbmdsZSxcbiAgICAgICAgICAgIGxldmVsOiB0aGlzTGV2ZWxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChjYW5DbG9zZSAmJiBpc1NpbmdsZSkge1xuICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW4uY29udGVudCwgdC5pbmRleCwgQVBPU1RST1BIRSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iLCIvLyBQcm9jZXNzIGF1dG9saW5rcyAnPHByb3RvY29sOi4uLj4nXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHVybF9zY2hlbWFzICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXJsX3NjaGVtYXMnKTtcbnZhciBub3JtYWxpemVMaW5rID0gcmVxdWlyZSgnLi4vaGVscGVycy9ub3JtYWxpemVfbGluaycpO1xuXG5cbi8qZXNsaW50IG1heC1sZW46MCovXG52YXIgRU1BSUxfUkUgICAgPSAvXjwoW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKik+LztcbnZhciBBVVRPTElOS19SRSA9IC9ePChbYS16QS1aLlxcLV17MSwyNX0pOihbXjw+XFx4MDAtXFx4MjBdKik+LztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF1dG9saW5rKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHRhaWwsIGxpbmtNYXRjaCwgZW1haWxNYXRjaCwgdXJsLCBmdWxsVXJsLCBwb3MgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHRhaWwgPSBzdGF0ZS5zcmMuc2xpY2UocG9zKTtcblxuICBpZiAodGFpbC5pbmRleE9mKCc+JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxpbmtNYXRjaCA9IHRhaWwubWF0Y2goQVVUT0xJTktfUkUpO1xuXG4gIGlmIChsaW5rTWF0Y2gpIHtcbiAgICBpZiAodXJsX3NjaGVtYXMuaW5kZXhPZihsaW5rTWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkgPCAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgdXJsID0gbGlua01hdGNoWzBdLnNsaWNlKDEsIC0xKTtcbiAgICBmdWxsVXJsID0gbm9ybWFsaXplTGluayh1cmwpO1xuICAgIGlmICghc3RhdGUucGFyc2VyLnZhbGlkYXRlTGluayh1cmwpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHN0YXRlLnB1c2goe1xuICAgICAgICB0eXBlOiAnbGlua19vcGVuJyxcbiAgICAgICAgaHJlZjogZnVsbFVybCxcbiAgICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsXG4gICAgICB9KTtcbiAgICAgIHN0YXRlLnB1c2goe1xuICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgIGNvbnRlbnQ6IHVybCxcbiAgICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsICsgMVxuICAgICAgfSk7XG4gICAgICBzdGF0ZS5wdXNoKHsgdHlwZTogJ2xpbmtfY2xvc2UnLCBsZXZlbDogc3RhdGUubGV2ZWwgfSk7XG4gICAgfVxuXG4gICAgc3RhdGUucG9zICs9IGxpbmtNYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBlbWFpbE1hdGNoID0gdGFpbC5tYXRjaChFTUFJTF9SRSk7XG5cbiAgaWYgKGVtYWlsTWF0Y2gpIHtcblxuICAgIHVybCA9IGVtYWlsTWF0Y2hbMF0uc2xpY2UoMSwgLTEpO1xuXG4gICAgZnVsbFVybCA9IG5vcm1hbGl6ZUxpbmsoJ21haWx0bzonICsgdXJsKTtcbiAgICBpZiAoIXN0YXRlLnBhcnNlci52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICBpZiAoIXNpbGVudCkge1xuICAgICAgc3RhdGUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsaW5rX29wZW4nLFxuICAgICAgICBocmVmOiBmdWxsVXJsLFxuICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWxcbiAgICAgIH0pO1xuICAgICAgc3RhdGUucHVzaCh7XG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgY29udGVudDogdXJsLFxuICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWwgKyAxXG4gICAgICB9KTtcbiAgICAgIHN0YXRlLnB1c2goeyB0eXBlOiAnbGlua19jbG9zZScsIGxldmVsOiBzdGF0ZS5sZXZlbCB9KTtcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgKz0gZW1haWxNYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuIiwiLy8gUGFyc2UgYmFja3RpY2tzXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYWNrdGlja3Moc3RhdGUsIHNpbGVudCkge1xuICB2YXIgc3RhcnQsIG1heCwgbWFya2VyLCBtYXRjaFN0YXJ0LCBtYXRjaEVuZCxcbiAgICAgIHBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAoY2ggIT09IDB4NjAvKiBgICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHN0YXJ0ID0gcG9zO1xuICBwb3MrKztcbiAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIHdoaWxlIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg2MC8qIGAgKi8pIHsgcG9zKys7IH1cblxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgbWF0Y2hTdGFydCA9IG1hdGNoRW5kID0gcG9zO1xuXG4gIHdoaWxlICgobWF0Y2hTdGFydCA9IHN0YXRlLnNyYy5pbmRleE9mKCdgJywgbWF0Y2hFbmQpKSAhPT0gLTEpIHtcbiAgICBtYXRjaEVuZCA9IG1hdGNoU3RhcnQgKyAxO1xuXG4gICAgd2hpbGUgKG1hdGNoRW5kIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KG1hdGNoRW5kKSA9PT0gMHg2MC8qIGAgKi8pIHsgbWF0Y2hFbmQrKzsgfVxuXG4gICAgaWYgKG1hdGNoRW5kIC0gbWF0Y2hTdGFydCA9PT0gbWFya2VyLmxlbmd0aCkge1xuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgc3RhdGUucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICAgIGNvbnRlbnQ6IHN0YXRlLnNyYy5zbGljZShwb3MsIG1hdGNoU3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvWyBcXG5dKy9nLCAnICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudHJpbSgpLFxuICAgICAgICAgIGJsb2NrOiBmYWxzZSxcbiAgICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzdGF0ZS5wb3MgPSBtYXRjaEVuZDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gbWFya2VyOyB9XG4gIHN0YXRlLnBvcyArPSBtYXJrZXIubGVuZ3RoO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZXNzIH5+ZGVsZXRlZCB0ZXh0fn5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbChzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBmb3VuZCxcbiAgICAgIHBvcyxcbiAgICAgIHN0YWNrLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBsYXN0Q2hhcixcbiAgICAgIG5leHRDaGFyO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCkgIT09IDB4N0UvKiB+ICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc2lsZW50KSB7IHJldHVybiBmYWxzZTsgfSAvLyBkb24ndCBydW4gYW55IHBhaXJzIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc3RhcnQgKyA0ID49IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMSkgIT09IDB4N0UvKiB+ICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhc3RDaGFyID0gc3RhcnQgPiAwID8gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQgLSAxKSA6IC0xO1xuICBuZXh0Q2hhciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMik7XG5cbiAgaWYgKGxhc3RDaGFyID09PSAweDdFLyogfiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKG5leHRDaGFyID09PSAweDdFLyogfiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKG5leHRDaGFyID09PSAweDIwIHx8IG5leHRDaGFyID09PSAweDBBKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBvcyA9IHN0YXJ0ICsgMjtcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDdFLyogfiAqLykgeyBwb3MrKzsgfVxuICBpZiAocG9zID4gc3RhcnQgKyAzKSB7XG4gICAgLy8gc2VxdWVuY2Ugb2YgNCsgbWFya2VycyB0YWtpbmcgYXMgbGl0ZXJhbCwgc2FtZSBhcyBpbiBhIGVtcGhhc2lzXG4gICAgc3RhdGUucG9zICs9IHBvcyAtIHN0YXJ0O1xuICAgIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MpOyB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBzdGFydCArIDI7XG4gIHN0YWNrID0gMTtcblxuICB3aGlsZSAoc3RhdGUucG9zICsgMSA8IG1heCkge1xuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpID09PSAweDdFLyogfiAqLykge1xuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyArIDEpID09PSAweDdFLyogfiAqLykge1xuICAgICAgICBsYXN0Q2hhciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyAtIDEpO1xuICAgICAgICBuZXh0Q2hhciA9IHN0YXRlLnBvcyArIDIgPCBtYXggPyBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MgKyAyKSA6IC0xO1xuICAgICAgICBpZiAobmV4dENoYXIgIT09IDB4N0UvKiB+ICovICYmIGxhc3RDaGFyICE9PSAweDdFLyogfiAqLykge1xuICAgICAgICAgIGlmIChsYXN0Q2hhciAhPT0gMHgyMCAmJiBsYXN0Q2hhciAhPT0gMHgwQSkge1xuICAgICAgICAgICAgLy8gY2xvc2luZyAnfn4nXG4gICAgICAgICAgICBzdGFjay0tO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmV4dENoYXIgIT09IDB4MjAgJiYgbmV4dENoYXIgIT09IDB4MEEpIHtcbiAgICAgICAgICAgIC8vIG9wZW5pbmcgJ35+J1xuICAgICAgICAgICAgc3RhY2srKztcbiAgICAgICAgICB9IC8vIGVsc2Uge1xuICAgICAgICAgICAgLy8gIC8vIHN0YW5kYWxvbmUgJyB+fiAnIGluZGVudGVkIHdpdGggc3BhY2VzXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgaWYgKHN0YWNrIDw9IDApIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRlLnBhcnNlci5za2lwVG9rZW4oc3RhdGUpO1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIC8vIHBhcnNlciBmYWlsZWQgdG8gZmluZCBlbmRpbmcgdGFnLCBzbyBpdCdzIG5vdCB2YWxpZCBlbXBoYXNpc1xuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvdW5kIVxuICBzdGF0ZS5wb3NNYXggPSBzdGF0ZS5wb3M7XG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMjtcblxuICBpZiAoIXNpbGVudCkge1xuICAgIHN0YXRlLnB1c2goeyB0eXBlOiAnZGVsX29wZW4nLCBsZXZlbDogc3RhdGUubGV2ZWwrKyB9KTtcbiAgICBzdGF0ZS5wYXJzZXIudG9rZW5pemUoc3RhdGUpO1xuICAgIHN0YXRlLnB1c2goeyB0eXBlOiAnZGVsX2Nsb3NlJywgbGV2ZWw6IC0tc3RhdGUubGV2ZWwgfSk7XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBzdGF0ZS5wb3NNYXggKyAyO1xuICBzdGF0ZS5wb3NNYXggPSBtYXg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgKnRoaXMqIGFuZCBfdGhhdF9cblxuJ3VzZSBzdHJpY3QnO1xuXG5cbmZ1bmN0aW9uIGlzQWxwaGFOdW0oY29kZSkge1xuICByZXR1cm4gKGNvZGUgPj0gMHgzMCAvKiAwICovICYmIGNvZGUgPD0gMHgzOSAvKiA5ICovKSB8fFxuICAgICAgICAgKGNvZGUgPj0gMHg0MSAvKiBBICovICYmIGNvZGUgPD0gMHg1QSAvKiBaICovKSB8fFxuICAgICAgICAgKGNvZGUgPj0gMHg2MSAvKiBhICovICYmIGNvZGUgPD0gMHg3QSAvKiB6ICovKTtcbn1cblxuLy8gcGFyc2Ugc2VxdWVuY2Ugb2YgZW1waGFzaXMgbWFya2Vycyxcbi8vIFwic3RhcnRcIiBzaG91bGQgcG9pbnQgYXQgYSB2YWxpZCBtYXJrZXJcbmZ1bmN0aW9uIHNjYW5EZWxpbXMoc3RhdGUsIHN0YXJ0KSB7XG4gIHZhciBwb3MgPSBzdGFydCwgbGFzdENoYXIsIG5leHRDaGFyLCBjb3VudCxcbiAgICAgIGNhbl9vcGVuID0gdHJ1ZSxcbiAgICAgIGNhbl9jbG9zZSA9IHRydWUsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXgsXG4gICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgbGFzdENoYXIgPSBzdGFydCA+IDAgPyBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCAtIDEpIDogLTE7XG5cbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSBtYXJrZXIpIHsgcG9zKys7IH1cbiAgaWYgKHBvcyA+PSBtYXgpIHsgY2FuX29wZW4gPSBmYWxzZTsgfVxuICBjb3VudCA9IHBvcyAtIHN0YXJ0O1xuXG4gIGlmIChjb3VudCA+PSA0KSB7XG4gICAgLy8gc2VxdWVuY2Ugb2YgZm91ciBvciBtb3JlIHVuZXNjYXBlZCBtYXJrZXJzIGNhbid0IHN0YXJ0L2VuZCBhbiBlbXBoYXNpc1xuICAgIGNhbl9vcGVuID0gY2FuX2Nsb3NlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmV4dENoYXIgPSBwb3MgPCBtYXggPyBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpIDogLTE7XG5cbiAgICAvLyBjaGVjayB3aGl0ZXNwYWNlIGNvbmRpdGlvbnNcbiAgICBpZiAobmV4dENoYXIgPT09IDB4MjAgfHwgbmV4dENoYXIgPT09IDB4MEEpIHsgY2FuX29wZW4gPSBmYWxzZTsgfVxuICAgIGlmIChsYXN0Q2hhciA9PT0gMHgyMCB8fCBsYXN0Q2hhciA9PT0gMHgwQSkgeyBjYW5fY2xvc2UgPSBmYWxzZTsgfVxuXG4gICAgaWYgKG1hcmtlciA9PT0gMHg1RiAvKiBfICovKSB7XG4gICAgICAvLyBjaGVjayBpZiB3ZSBhcmVuJ3QgaW5zaWRlIHRoZSB3b3JkXG4gICAgICBpZiAoaXNBbHBoYU51bShsYXN0Q2hhcikpIHsgY2FuX29wZW4gPSBmYWxzZTsgfVxuICAgICAgaWYgKGlzQWxwaGFOdW0obmV4dENoYXIpKSB7IGNhbl9jbG9zZSA9IGZhbHNlOyB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjYW5fb3BlbjogY2FuX29wZW4sXG4gICAgY2FuX2Nsb3NlOiBjYW5fY2xvc2UsXG4gICAgZGVsaW1zOiBjb3VudFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVtcGhhc2lzKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHN0YXJ0Q291bnQsXG4gICAgICBjb3VudCxcbiAgICAgIGZvdW5kLFxuICAgICAgb2xkQ291bnQsXG4gICAgICBuZXdDb3VudCxcbiAgICAgIHN0YWNrLFxuICAgICAgcmVzLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgaWYgKG1hcmtlciAhPT0gMHg1Ri8qIF8gKi8gJiYgbWFya2VyICE9PSAweDJBIC8qICogKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIGZhbHNlOyB9IC8vIGRvbid0IHJ1biBhbnkgcGFpcnMgaW4gdmFsaWRhdGlvbiBtb2RlXG5cbiAgcmVzID0gc2NhbkRlbGltcyhzdGF0ZSwgc3RhcnQpO1xuICBzdGFydENvdW50ID0gcmVzLmRlbGltcztcbiAgaWYgKCFyZXMuY2FuX29wZW4pIHtcbiAgICBzdGF0ZS5wb3MgKz0gc3RhcnRDb3VudDtcbiAgICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgc3RhdGUucG9zKTsgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHN0YXRlLmxldmVsID49IHN0YXRlLm9wdGlvbnMubWF4TmVzdGluZykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBzdGF0ZS5wb3MgPSBzdGFydCArIHN0YXJ0Q291bnQ7XG4gIHN0YWNrID0gWyBzdGFydENvdW50IF07XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IG1heCkge1xuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpID09PSBtYXJrZXIpIHtcbiAgICAgIHJlcyA9IHNjYW5EZWxpbXMoc3RhdGUsIHN0YXRlLnBvcyk7XG4gICAgICBjb3VudCA9IHJlcy5kZWxpbXM7XG4gICAgICBpZiAocmVzLmNhbl9jbG9zZSkge1xuICAgICAgICBvbGRDb3VudCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICBuZXdDb3VudCA9IGNvdW50O1xuXG4gICAgICAgIHdoaWxlIChvbGRDb3VudCAhPT0gbmV3Q291bnQpIHtcbiAgICAgICAgICBpZiAobmV3Q291bnQgPCBvbGRDb3VudCkge1xuICAgICAgICAgICAgc3RhY2sucHVzaChvbGRDb3VudCAtIG5ld0NvdW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGFzc2VydChuZXdDb3VudCA+IG9sZENvdW50KVxuICAgICAgICAgIG5ld0NvdW50IC09IG9sZENvdW50O1xuXG4gICAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA9PT0gMCkgeyBicmVhazsgfVxuICAgICAgICAgIHN0YXRlLnBvcyArPSBvbGRDb3VudDtcbiAgICAgICAgICBvbGRDb3VudCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHN0YXJ0Q291bnQgPSBvbGRDb3VudDtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUucG9zICs9IGNvdW50O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcy5jYW5fb3BlbikgeyBzdGFjay5wdXNoKGNvdW50KTsgfVxuICAgICAgc3RhdGUucG9zICs9IGNvdW50O1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3RhdGUucGFyc2VyLnNraXBUb2tlbihzdGF0ZSk7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kIGVuZGluZyB0YWcsIHNvIGl0J3Mgbm90IHZhbGlkIGVtcGhhc2lzXG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gZm91bmQhXG4gIHN0YXRlLnBvc01heCA9IHN0YXRlLnBvcztcbiAgc3RhdGUucG9zID0gc3RhcnQgKyBzdGFydENvdW50O1xuXG4gIGlmICghc2lsZW50KSB7XG4gICAgaWYgKHN0YXJ0Q291bnQgPT09IDIgfHwgc3RhcnRDb3VudCA9PT0gMykge1xuICAgICAgc3RhdGUucHVzaCh7IHR5cGU6ICdzdHJvbmdfb3BlbicsIGxldmVsOiBzdGF0ZS5sZXZlbCsrIH0pO1xuICAgIH1cbiAgICBpZiAoc3RhcnRDb3VudCA9PT0gMSB8fCBzdGFydENvdW50ID09PSAzKSB7XG4gICAgICBzdGF0ZS5wdXNoKHsgdHlwZTogJ2VtX29wZW4nLCBsZXZlbDogc3RhdGUubGV2ZWwrKyB9KTtcbiAgICB9XG5cbiAgICBzdGF0ZS5wYXJzZXIudG9rZW5pemUoc3RhdGUpO1xuXG4gICAgaWYgKHN0YXJ0Q291bnQgPT09IDEgfHwgc3RhcnRDb3VudCA9PT0gMykge1xuICAgICAgc3RhdGUucHVzaCh7IHR5cGU6ICdlbV9jbG9zZScsIGxldmVsOiAtLXN0YXRlLmxldmVsIH0pO1xuICAgIH1cbiAgICBpZiAoc3RhcnRDb3VudCA9PT0gMiB8fCBzdGFydENvdW50ID09PSAzKSB7XG4gICAgICBzdGF0ZS5wdXNoKHsgdHlwZTogJ3N0cm9uZ19jbG9zZScsIGxldmVsOiAtLXN0YXRlLmxldmVsIH0pO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heCArIHN0YXJ0Q291bnQ7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBodG1sIGVudGl0eSAtICYjMTIzOywgJiN4QUY7LCAmcXVvdDssIC4uLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbnRpdGllcyAgICAgICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi9lbnRpdGllcycpO1xudmFyIGhhcyAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaGFzO1xudmFyIGlzVmFsaWRFbnRpdHlDb2RlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNWYWxpZEVudGl0eUNvZGU7XG52YXIgZnJvbUNvZGVQb2ludCAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5mcm9tQ29kZVBvaW50O1xuXG5cbnZhciBESUdJVEFMX1JFID0gL14mIygoPzp4W2EtZjAtOV17MSw4fXxbMC05XXsxLDh9KSk7L2k7XG52YXIgTkFNRURfUkUgICA9IC9eJihbYS16XVthLXowLTldezEsMzF9KTsvaTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVudGl0eShzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgY29kZSwgbWF0Y2gsIHBvcyA9IHN0YXRlLnBvcywgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI2LyogJiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAocG9zICsgMSA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSk7XG5cbiAgICBpZiAoY2ggPT09IDB4MjMgLyogIyAqLykge1xuICAgICAgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChESUdJVEFMX1JFKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgIGNvZGUgPSBtYXRjaFsxXVswXS50b0xvd2VyQ2FzZSgpID09PSAneCcgPyBwYXJzZUludChtYXRjaFsxXS5zbGljZSgxKSwgMTYpIDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICBzdGF0ZS5wZW5kaW5nICs9IGlzVmFsaWRFbnRpdHlDb2RlKGNvZGUpID8gZnJvbUNvZGVQb2ludChjb2RlKSA6IGZyb21Db2RlUG9pbnQoMHhGRkZEKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChOQU1FRF9SRSk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgaWYgKGhhcyhlbnRpdGllcywgbWF0Y2hbMV0pKSB7XG4gICAgICAgICAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBlbnRpdGllc1ttYXRjaFsxXV07IH1cbiAgICAgICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSAnJic7IH1cbiAgc3RhdGUucG9zKys7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2NlZXNzIGVzY2FwZWQgY2hhcnMgYW5kIGhhcmRicmVha3NcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRVNDQVBFRCA9IFtdO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7IEVTQ0FQRUQucHVzaCgwKTsgfVxuXG4nXFxcXCFcIiMkJSZcXCcoKSorLC4vOjs8PT4/QFtdXl9ge3x9fi0nXG4gIC5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbihjaCkgeyBFU0NBUEVEW2NoLmNoYXJDb2RlQXQoMCldID0gMTsgfSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlc2NhcGUoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgY2gsIHBvcyA9IHN0YXRlLnBvcywgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDVDLyogXFwgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG9zKys7XG5cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmIChjaCA8IDI1NiAmJiBFU0NBUEVEW2NoXSAhPT0gMCkge1xuICAgICAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmNbcG9zXTsgfVxuICAgICAgc3RhdGUucG9zICs9IDI7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY2ggPT09IDB4MEEpIHtcbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIHN0YXRlLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdoYXJkYnJlYWsnLFxuICAgICAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcG9zKys7XG4gICAgICAvLyBza2lwIGxlYWRpbmcgd2hpdGVzcGFjZXMgZnJvbSBuZXh0IGxpbmVcbiAgICAgIHdoaWxlIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyMCkgeyBwb3MrKzsgfVxuXG4gICAgICBzdGF0ZS5wb3MgPSBwb3M7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9ICdcXFxcJzsgfVxuICBzdGF0ZS5wb3MrKztcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBpbmxpbmUgZm9vdG5vdGVzICheWy4uLl0pXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBhcnNlTGlua0xhYmVsID0gcmVxdWlyZSgnLi4vaGVscGVycy9wYXJzZV9saW5rX2xhYmVsJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb290bm90ZV9pbmxpbmUoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgbGFiZWxTdGFydCxcbiAgICAgIGxhYmVsRW5kLFxuICAgICAgZm9vdG5vdGVJZCxcbiAgICAgIG9sZExlbmd0aCxcbiAgICAgIG1heCA9IHN0YXRlLnBvc01heCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zO1xuXG4gIGlmIChzdGFydCArIDIgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpICE9PSAweDVFLyogXiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMSkgIT09IDB4NUIvKiBbICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhYmVsU3RhcnQgPSBzdGFydCArIDI7XG4gIGxhYmVsRW5kID0gcGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXJ0ICsgMSk7XG5cbiAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kICddJywgc28gaXQncyBub3QgYSB2YWxpZCBub3RlXG4gIGlmIChsYWJlbEVuZCA8IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gV2UgZm91bmQgdGhlIGVuZCBvZiB0aGUgbGluaywgYW5kIGtub3cgZm9yIGEgZmFjdCBpdCdzIGEgdmFsaWQgbGluaztcbiAgLy8gc28gYWxsIHRoYXQncyBsZWZ0IHRvIGRvIGlzIHRvIGNhbGwgdG9rZW5pemVyLlxuICAvL1xuICBpZiAoIXNpbGVudCkge1xuICAgIGlmICghc3RhdGUuZW52LmZvb3Rub3RlcykgeyBzdGF0ZS5lbnYuZm9vdG5vdGVzID0ge307IH1cbiAgICBpZiAoIXN0YXRlLmVudi5mb290bm90ZXMubGlzdCkgeyBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3QgPSBbXTsgfVxuICAgIGZvb3Rub3RlSWQgPSBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3QubGVuZ3RoO1xuXG4gICAgc3RhdGUucG9zID0gbGFiZWxTdGFydDtcbiAgICBzdGF0ZS5wb3NNYXggPSBsYWJlbEVuZDtcblxuICAgIHN0YXRlLnB1c2goe1xuICAgICAgdHlwZTogJ2Zvb3Rub3RlX3JlZicsXG4gICAgICBpZDogZm9vdG5vdGVJZCxcbiAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgIH0pO1xuICAgIHN0YXRlLmxpbmtMZXZlbCsrO1xuICAgIG9sZExlbmd0aCA9IHN0YXRlLnRva2Vucy5sZW5ndGg7XG4gICAgc3RhdGUucGFyc2VyLnRva2VuaXplKHN0YXRlKTtcbiAgICBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3RbZm9vdG5vdGVJZF0gPSB7IHRva2Vuczogc3RhdGUudG9rZW5zLnNwbGljZShvbGRMZW5ndGgpIH07XG4gICAgc3RhdGUubGlua0xldmVsLS07XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBsYWJlbEVuZCArIDE7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBmb290bm90ZSByZWZlcmVuY2VzIChbXi4uLl0pXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvb3Rub3RlX3JlZihzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBsYWJlbCxcbiAgICAgIHBvcyxcbiAgICAgIGZvb3Rub3RlSWQsXG4gICAgICBmb290bm90ZVN1YklkLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3M7XG5cbiAgLy8gc2hvdWxkIGJlIGF0IGxlYXN0IDQgY2hhcnMgLSBcIlteeF1cIlxuICBpZiAoc3RhcnQgKyAzID4gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmICghc3RhdGUuZW52LmZvb3Rub3RlcyB8fCAhc3RhdGUuZW52LmZvb3Rub3Rlcy5yZWZzKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMSkgIT09IDB4NUUvKiBeICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGZvciAocG9zID0gc3RhcnQgKyAyOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjApIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MEEpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUQgLyogXSAqLykge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBvcyA9PT0gc3RhcnQgKyAyKSB7IHJldHVybiBmYWxzZTsgfSAvLyBubyBlbXB0eSBmb290bm90ZSBsYWJlbHNcbiAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIHBvcysrO1xuXG4gIGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0ICsgMiwgcG9zIC0gMSk7XG4gIGlmICh0eXBlb2Ygc3RhdGUuZW52LmZvb3Rub3Rlcy5yZWZzWyc6JyArIGxhYmVsXSA9PT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBpZiAoIXN0YXRlLmVudi5mb290bm90ZXMubGlzdCkgeyBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3QgPSBbXTsgfVxuXG4gICAgaWYgKHN0YXRlLmVudi5mb290bm90ZXMucmVmc1snOicgKyBsYWJlbF0gPCAwKSB7XG4gICAgICBmb290bm90ZUlkID0gc3RhdGUuZW52LmZvb3Rub3Rlcy5saXN0Lmxlbmd0aDtcbiAgICAgIHN0YXRlLmVudi5mb290bm90ZXMubGlzdFtmb290bm90ZUlkXSA9IHsgbGFiZWw6IGxhYmVsLCBjb3VudDogMCB9O1xuICAgICAgc3RhdGUuZW52LmZvb3Rub3Rlcy5yZWZzWyc6JyArIGxhYmVsXSA9IGZvb3Rub3RlSWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvb3Rub3RlSWQgPSBzdGF0ZS5lbnYuZm9vdG5vdGVzLnJlZnNbJzonICsgbGFiZWxdO1xuICAgIH1cblxuICAgIGZvb3Rub3RlU3ViSWQgPSBzdGF0ZS5lbnYuZm9vdG5vdGVzLmxpc3RbZm9vdG5vdGVJZF0uY291bnQ7XG4gICAgc3RhdGUuZW52LmZvb3Rub3Rlcy5saXN0W2Zvb3Rub3RlSWRdLmNvdW50Kys7XG5cbiAgICBzdGF0ZS5wdXNoKHtcbiAgICAgIHR5cGU6ICdmb290bm90ZV9yZWYnLFxuICAgICAgaWQ6IGZvb3Rub3RlSWQsXG4gICAgICBzdWJJZDogZm9vdG5vdGVTdWJJZCxcbiAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGUucG9zID0gcG9zO1xuICBzdGF0ZS5wb3NNYXggPSBtYXg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgaHRtbCB0YWdzXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgSFRNTF9UQUdfUkUgPSByZXF1aXJlKCcuLi9jb21tb24vaHRtbF9yZScpLkhUTUxfVEFHX1JFO1xuXG5cbmZ1bmN0aW9uIGlzTGV0dGVyKGNoKSB7XG4gIC8qZXNsaW50IG5vLWJpdHdpc2U6MCovXG4gIHZhciBsYyA9IGNoIHwgMHgyMDsgLy8gdG8gbG93ZXIgY2FzZVxuICByZXR1cm4gKGxjID49IDB4NjEvKiBhICovKSAmJiAobGMgPD0gMHg3YS8qIHogKi8pO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHRtbHRhZyhzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgbWF0Y2gsIG1heCwgcG9zID0gc3RhdGUucG9zO1xuXG4gIGlmICghc3RhdGUub3B0aW9ucy5odG1sKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIENoZWNrIHN0YXJ0XG4gIG1heCA9IHN0YXRlLnBvc01heDtcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovIHx8XG4gICAgICBwb3MgKyAyID49IG1heCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFF1aWNrIGZhaWwgb24gc2Vjb25kIGNoYXJcbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKTtcbiAgaWYgKGNoICE9PSAweDIxLyogISAqLyAmJlxuICAgICAgY2ggIT09IDB4M0YvKiA/ICovICYmXG4gICAgICBjaCAhPT0gMHgyRi8qIC8gKi8gJiZcbiAgICAgICFpc0xldHRlcihjaCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKEhUTUxfVEFHX1JFKTtcbiAgaWYgKCFtYXRjaCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoIXNpbGVudCkge1xuICAgIHN0YXRlLnB1c2goe1xuICAgICAgdHlwZTogJ2h0bWx0YWcnLFxuICAgICAgY29udGVudDogc3RhdGUuc3JjLnNsaWNlKHBvcywgcG9zICsgbWF0Y2hbMF0ubGVuZ3RoKSxcbiAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgIH0pO1xuICB9XG4gIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgKytpbnNlcnRlZCB0ZXh0KytcblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlucyhzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBmb3VuZCxcbiAgICAgIHBvcyxcbiAgICAgIHN0YWNrLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBsYXN0Q2hhcixcbiAgICAgIG5leHRDaGFyO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCkgIT09IDB4MkIvKiArICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc2lsZW50KSB7IHJldHVybiBmYWxzZTsgfSAvLyBkb24ndCBydW4gYW55IHBhaXJzIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc3RhcnQgKyA0ID49IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMSkgIT09IDB4MkIvKiArICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhc3RDaGFyID0gc3RhcnQgPiAwID8gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQgLSAxKSA6IC0xO1xuICBuZXh0Q2hhciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0ICsgMik7XG5cbiAgaWYgKGxhc3RDaGFyID09PSAweDJCLyogKyAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKG5leHRDaGFyID09PSAweDJCLyogKyAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKG5leHRDaGFyID09PSAweDIwIHx8IG5leHRDaGFyID09PSAweDBBKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBvcyA9IHN0YXJ0ICsgMjtcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDJCLyogKyAqLykgeyBwb3MrKzsgfVxuICBpZiAocG9zICE9PSBzdGFydCArIDIpIHtcbiAgICAvLyBzZXF1ZW5jZSBvZiAzKyBtYXJrZXJzIHRha2luZyBhcyBsaXRlcmFsLCBzYW1lIGFzIGluIGEgZW1waGFzaXNcbiAgICBzdGF0ZS5wb3MgKz0gcG9zIC0gc3RhcnQ7XG4gICAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcyk7IH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMjtcbiAgc3RhY2sgPSAxO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3MgKyAxIDwgbWF4KSB7XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgPT09IDB4MkIvKiArICovKSB7XG4gICAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zICsgMSkgPT09IDB4MkIvKiArICovKSB7XG4gICAgICAgIGxhc3RDaGFyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zIC0gMSk7XG4gICAgICAgIG5leHRDaGFyID0gc3RhdGUucG9zICsgMiA8IG1heCA/IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyArIDIpIDogLTE7XG4gICAgICAgIGlmIChuZXh0Q2hhciAhPT0gMHgyQi8qICsgKi8gJiYgbGFzdENoYXIgIT09IDB4MkIvKiArICovKSB7XG4gICAgICAgICAgaWYgKGxhc3RDaGFyICE9PSAweDIwICYmIGxhc3RDaGFyICE9PSAweDBBKSB7XG4gICAgICAgICAgICAvLyBjbG9zaW5nICcrKydcbiAgICAgICAgICAgIHN0YWNrLS07XG4gICAgICAgICAgfSBlbHNlIGlmIChuZXh0Q2hhciAhPT0gMHgyMCAmJiBuZXh0Q2hhciAhPT0gMHgwQSkge1xuICAgICAgICAgICAgLy8gb3BlbmluZyAnKysnXG4gICAgICAgICAgICBzdGFjaysrO1xuICAgICAgICAgIH0gLy8gZWxzZSB7XG4gICAgICAgICAgICAvLyAgLy8gc3RhbmRhbG9uZSAnICsrICcgaW5kZW50ZWQgd2l0aCBzcGFjZXNcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICBpZiAoc3RhY2sgPD0gMCkge1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGUucGFyc2VyLnNraXBUb2tlbihzdGF0ZSk7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kIGVuZGluZyB0YWcsIHNvIGl0J3Mgbm90IHZhbGlkIGVtcGhhc2lzXG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gZm91bmQhXG4gIHN0YXRlLnBvc01heCA9IHN0YXRlLnBvcztcbiAgc3RhdGUucG9zID0gc3RhcnQgKyAyO1xuXG4gIGlmICghc2lsZW50KSB7XG4gICAgc3RhdGUucHVzaCh7IHR5cGU6ICdpbnNfb3BlbicsIGxldmVsOiBzdGF0ZS5sZXZlbCsrIH0pO1xuICAgIHN0YXRlLnBhcnNlci50b2tlbml6ZShzdGF0ZSk7XG4gICAgc3RhdGUucHVzaCh7IHR5cGU6ICdpbnNfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heCArIDI7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBbbGlua3NdKDx0bz4gXCJzdHVmZlwiKVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwYXJzZUxpbmtMYWJlbCAgICAgICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvcGFyc2VfbGlua19sYWJlbCcpO1xudmFyIHBhcnNlTGlua0Rlc3RpbmF0aW9uID0gcmVxdWlyZSgnLi4vaGVscGVycy9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uJyk7XG52YXIgcGFyc2VMaW5rVGl0bGUgICAgICAgPSByZXF1aXJlKCcuLi9oZWxwZXJzL3BhcnNlX2xpbmtfdGl0bGUnKTtcbnZhciBub3JtYWxpemVSZWZlcmVuY2UgICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvbm9ybWFsaXplX3JlZmVyZW5jZScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGlua3Moc3RhdGUsIHNpbGVudCkge1xuICB2YXIgbGFiZWxTdGFydCxcbiAgICAgIGxhYmVsRW5kLFxuICAgICAgbGFiZWwsXG4gICAgICBocmVmLFxuICAgICAgdGl0bGUsXG4gICAgICBwb3MsXG4gICAgICByZWYsXG4gICAgICBjb2RlLFxuICAgICAgaXNJbWFnZSA9IGZhbHNlLFxuICAgICAgb2xkUG9zID0gc3RhdGUucG9zLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4LFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgaWYgKG1hcmtlciA9PT0gMHgyMS8qICEgKi8pIHtcbiAgICBpc0ltYWdlID0gdHJ1ZTtcbiAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdCgrK3N0YXJ0KTtcbiAgfVxuXG4gIGlmIChtYXJrZXIgIT09IDB4NUIvKiBbICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUubGV2ZWwgPj0gc3RhdGUub3B0aW9ucy5tYXhOZXN0aW5nKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhYmVsU3RhcnQgPSBzdGFydCArIDE7XG4gIGxhYmVsRW5kID0gcGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXJ0KTtcblxuICAvLyBwYXJzZXIgZmFpbGVkIHRvIGZpbmQgJ10nLCBzbyBpdCdzIG5vdCBhIHZhbGlkIGxpbmtcbiAgaWYgKGxhYmVsRW5kIDwgMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyOC8qICggKi8pIHtcbiAgICAvL1xuICAgIC8vIElubGluZSBsaW5rXG4gICAgLy9cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHBvcysrO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmIChjb2RlICE9PSAweDIwICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICB9XG4gICAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgIF5eXl5eXiBwYXJzaW5nIGxpbmsgZGVzdGluYXRpb25cbiAgICBzdGFydCA9IHBvcztcbiAgICBpZiAocGFyc2VMaW5rRGVzdGluYXRpb24oc3RhdGUsIHBvcykpIHtcbiAgICAgIGhyZWYgPSBzdGF0ZS5saW5rQ29udGVudDtcbiAgICAgIHBvcyA9IHN0YXRlLnBvcztcbiAgICB9IGVsc2Uge1xuICAgICAgaHJlZiA9ICcnO1xuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKGNvZGUgIT09IDB4MjAgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhazsgfVxuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNpbmcgbGluayB0aXRsZVxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiBwYXJzZUxpbmtUaXRsZShzdGF0ZSwgcG9zKSkge1xuICAgICAgdGl0bGUgPSBzdGF0ZS5saW5rQ29udGVudDtcbiAgICAgIHBvcyA9IHN0YXRlLnBvcztcblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChjb2RlICE9PSAweDIwICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGl0bGUgPSAnJztcbiAgICB9XG5cbiAgICBpZiAocG9zID49IG1heCB8fCBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI5LyogKSAqLykge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBwb3MrKztcbiAgfSBlbHNlIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cblxuICAgIC8vIGRvIG5vdCBhbGxvdyBuZXN0ZWQgcmVmZXJlbmNlIGxpbmtzXG4gICAgaWYgKHN0YXRlLmxpbmtMZXZlbCA+IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAvLyBbZm9vXSAgW2Jhcl1cbiAgICAvLyAgICAgIF5eIG9wdGlvbmFsIHdoaXRlc3BhY2UgKGNhbiBpbmNsdWRlIG5ld2xpbmVzKVxuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmIChjb2RlICE9PSAweDIwICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICB9XG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUIvKiBbICovKSB7XG4gICAgICBzdGFydCA9IHBvcyArIDE7XG4gICAgICBwb3MgPSBwYXJzZUxpbmtMYWJlbChzdGF0ZSwgcG9zKTtcbiAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKyspO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gc3RhcnQgLSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvdmVycyBsYWJlbCA9PT0gJycgYW5kIGxhYmVsID09PSB1bmRlZmluZWRcbiAgICAvLyAoY29sbGFwc2VkIHJlZmVyZW5jZSBsaW5rIGFuZCBzaG9ydGN1dCByZWZlcmVuY2UgbGluayByZXNwZWN0aXZlbHkpXG4gICAgaWYgKCFsYWJlbCkge1xuICAgICAgaWYgKHR5cGVvZiBsYWJlbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICAgICAgfVxuICAgICAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2UobGFiZWxTdGFydCwgbGFiZWxFbmQpO1xuICAgIH1cblxuICAgIHJlZiA9IHN0YXRlLmVudi5yZWZlcmVuY2VzW25vcm1hbGl6ZVJlZmVyZW5jZShsYWJlbCldO1xuICAgIGlmICghcmVmKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGhyZWYgPSByZWYuaHJlZjtcbiAgICB0aXRsZSA9IHJlZi50aXRsZTtcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wb3MgPSBsYWJlbFN0YXJ0O1xuICAgIHN0YXRlLnBvc01heCA9IGxhYmVsRW5kO1xuXG4gICAgaWYgKGlzSW1hZ2UpIHtcbiAgICAgIHN0YXRlLnB1c2goe1xuICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICBzcmM6IGhyZWYsXG4gICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgYWx0OiBzdGF0ZS5zcmMuc3Vic3RyKGxhYmVsU3RhcnQsIGxhYmVsRW5kIC0gbGFiZWxTdGFydCksXG4gICAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnB1c2goe1xuICAgICAgICB0eXBlOiAnbGlua19vcGVuJyxcbiAgICAgICAgaHJlZjogaHJlZixcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWwrK1xuICAgICAgfSk7XG4gICAgICBzdGF0ZS5saW5rTGV2ZWwrKztcbiAgICAgIHN0YXRlLnBhcnNlci50b2tlbml6ZShzdGF0ZSk7XG4gICAgICBzdGF0ZS5saW5rTGV2ZWwtLTtcbiAgICAgIHN0YXRlLnB1c2goeyB0eXBlOiAnbGlua19jbG9zZScsIGxldmVsOiAtLXN0YXRlLmxldmVsIH0pO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvcztcbiAgc3RhdGUucG9zTWF4ID0gbWF4O1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZXNzID09aGlnaGxpZ2h0ZWQgdGV4dD09XG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWwoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgZm91bmQsXG4gICAgICBwb3MsXG4gICAgICBzdGFjayxcbiAgICAgIG1heCA9IHN0YXRlLnBvc01heCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zLFxuICAgICAgbGFzdENoYXIsXG4gICAgICBuZXh0Q2hhcjtcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpICE9PSAweDNELyogPSAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2U7IH0gLy8gZG9uJ3QgcnVuIGFueSBwYWlycyBpbiB2YWxpZGF0aW9uIG1vZGVcbiAgaWYgKHN0YXJ0ICsgNCA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCArIDEpICE9PSAweDNELyogPSAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLmxldmVsID49IHN0YXRlLm9wdGlvbnMubWF4TmVzdGluZykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsYXN0Q2hhciA9IHN0YXJ0ID4gMCA/IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0IC0gMSkgOiAtMTtcbiAgbmV4dENoYXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCArIDIpO1xuXG4gIGlmIChsYXN0Q2hhciA9PT0gMHgzRC8qID0gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChuZXh0Q2hhciA9PT0gMHgzRC8qID0gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChuZXh0Q2hhciA9PT0gMHgyMCB8fCBuZXh0Q2hhciA9PT0gMHgwQSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBzdGFydCArIDI7XG4gIHdoaWxlIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgzRC8qID0gKi8pIHsgcG9zKys7IH1cbiAgaWYgKHBvcyAhPT0gc3RhcnQgKyAyKSB7XG4gICAgLy8gc2VxdWVuY2Ugb2YgMysgbWFya2VycyB0YWtpbmcgYXMgbGl0ZXJhbCwgc2FtZSBhcyBpbiBhIGVtcGhhc2lzXG4gICAgc3RhdGUucG9zICs9IHBvcyAtIHN0YXJ0O1xuICAgIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MpOyB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBzdGFydCArIDI7XG4gIHN0YWNrID0gMTtcblxuICB3aGlsZSAoc3RhdGUucG9zICsgMSA8IG1heCkge1xuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpID09PSAweDNELyogPSAqLykge1xuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyArIDEpID09PSAweDNELyogPSAqLykge1xuICAgICAgICBsYXN0Q2hhciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyAtIDEpO1xuICAgICAgICBuZXh0Q2hhciA9IHN0YXRlLnBvcyArIDIgPCBtYXggPyBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MgKyAyKSA6IC0xO1xuICAgICAgICBpZiAobmV4dENoYXIgIT09IDB4M0QvKiA9ICovICYmIGxhc3RDaGFyICE9PSAweDNELyogPSAqLykge1xuICAgICAgICAgIGlmIChsYXN0Q2hhciAhPT0gMHgyMCAmJiBsYXN0Q2hhciAhPT0gMHgwQSkge1xuICAgICAgICAgICAgLy8gY2xvc2luZyAnPT0nXG4gICAgICAgICAgICBzdGFjay0tO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmV4dENoYXIgIT09IDB4MjAgJiYgbmV4dENoYXIgIT09IDB4MEEpIHtcbiAgICAgICAgICAgIC8vIG9wZW5pbmcgJz09J1xuICAgICAgICAgICAgc3RhY2srKztcbiAgICAgICAgICB9IC8vIGVsc2Uge1xuICAgICAgICAgICAgLy8gIC8vIHN0YW5kYWxvbmUgJyA9PSAnIGluZGVudGVkIHdpdGggc3BhY2VzXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgaWYgKHN0YWNrIDw9IDApIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRlLnBhcnNlci5za2lwVG9rZW4oc3RhdGUpO1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIC8vIHBhcnNlciBmYWlsZWQgdG8gZmluZCBlbmRpbmcgdGFnLCBzbyBpdCdzIG5vdCB2YWxpZCBlbXBoYXNpc1xuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvdW5kIVxuICBzdGF0ZS5wb3NNYXggPSBzdGF0ZS5wb3M7XG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMjtcblxuICBpZiAoIXNpbGVudCkge1xuICAgIHN0YXRlLnB1c2goeyB0eXBlOiAnbWFya19vcGVuJywgbGV2ZWw6IHN0YXRlLmxldmVsKysgfSk7XG4gICAgc3RhdGUucGFyc2VyLnRva2VuaXplKHN0YXRlKTtcbiAgICBzdGF0ZS5wdXNoKHsgdHlwZTogJ21hcmtfY2xvc2UnLCBsZXZlbDogLS1zdGF0ZS5sZXZlbCB9KTtcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heCArIDI7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2Vlc3MgJ1xcbidcblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5ld2xpbmUoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG1heCwgbWF4LCBwb3MgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEvKiBcXG4gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG1heCA9IHN0YXRlLnBlbmRpbmcubGVuZ3RoIC0gMTtcbiAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIC8vICcgIFxcbicgLT4gaGFyZGJyZWFrXG4gIC8vIExvb2t1cCBpbiBwZW5kaW5nIGNoYXJzIGlzIGJhZCBwcmFjdGljZSEgRG9uJ3QgY29weSB0byBvdGhlciBydWxlcyFcbiAgLy8gUGVuZGluZyBzdHJpbmcgaXMgc3RvcmVkIGluIGNvbmNhdCBtb2RlLCBpbmRleGVkIGxvb2t1cHMgd2lsbCBjYXVzZVxuICAvLyBjb252ZXJ0aW9uIHRvIGZsYXQgbW9kZS5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBpZiAocG1heCA+PSAwICYmIHN0YXRlLnBlbmRpbmcuY2hhckNvZGVBdChwbWF4KSA9PT0gMHgyMCkge1xuICAgICAgaWYgKHBtYXggPj0gMSAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCAtIDEpID09PSAweDIwKSB7XG4gICAgICAgIHN0YXRlLnBlbmRpbmcgPSBzdGF0ZS5wZW5kaW5nLnJlcGxhY2UoLyArJC8sICcnKTtcbiAgICAgICAgc3RhdGUucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2hhcmRicmVhaycsXG4gICAgICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucGVuZGluZyA9IHN0YXRlLnBlbmRpbmcuc2xpY2UoMCwgLTEpO1xuICAgICAgICBzdGF0ZS5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnc29mdGJyZWFrJyxcbiAgICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucHVzaCh7XG4gICAgICAgIHR5cGU6ICdzb2Z0YnJlYWsnLFxuICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHBvcysrO1xuXG4gIC8vIHNraXAgaGVhZGluZyBzcGFjZXMgZm9yIG5leHQgbGluZVxuICB3aGlsZSAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjApIHsgcG9zKys7IH1cblxuICBzdGF0ZS5wb3MgPSBwb3M7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIElubGluZSBwYXJzZXIgc3RhdGVcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbmZ1bmN0aW9uIFN0YXRlSW5saW5lKHNyYywgcGFyc2VySW5saW5lLCBvcHRpb25zLCBlbnYsIG91dFRva2Vucykge1xuICB0aGlzLnNyYyA9IHNyYztcbiAgdGhpcy5lbnYgPSBlbnY7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIHRoaXMucGFyc2VyID0gcGFyc2VySW5saW5lO1xuICB0aGlzLnRva2VucyA9IG91dFRva2VucztcbiAgdGhpcy5wb3MgPSAwO1xuICB0aGlzLnBvc01heCA9IHRoaXMuc3JjLmxlbmd0aDtcbiAgdGhpcy5sZXZlbCA9IDA7XG4gIHRoaXMucGVuZGluZyA9ICcnO1xuICB0aGlzLnBlbmRpbmdMZXZlbCA9IDA7XG5cbiAgdGhpcy5jYWNoZSA9IFtdOyAgICAgICAgLy8gU3RvcmVzIHsgc3RhcnQ6IGVuZCB9IHBhaXJzLiBVc2VmdWwgZm9yIGJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvcHRpbWl6YXRpb24gb2YgcGFpcnMgcGFyc2UgKGVtcGhhc2lzLCBzdHJpa2VzKS5cblxuICAvLyBMaW5rIHBhcnNlciBzdGF0ZSB2YXJzXG5cbiAgdGhpcy5pc0luTGFiZWwgPSBmYWxzZTsgLy8gU2V0IHRydWUgd2hlbiBzZWVrIGxpbmsgbGFiZWwgLSB3ZSBzaG91bGQgZGlzYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcInBhaXJlZFwiIHJ1bGVzIChlbXBoYXNpcywgc3RyaWtlcykgdG8gbm90IHNraXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGFpbGluZyBgXWBcblxuICB0aGlzLmxpbmtMZXZlbCA9IDA7ICAgICAvLyBJbmNyZW1lbnQgZm9yIGVhY2ggbmVzdGluZyBsaW5rLiBVc2VkIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmVzdGluZyBpbiBkZWZpbml0aW9uc1xuXG4gIHRoaXMubGlua0NvbnRlbnQgPSAnJzsgIC8vIFRlbXBvcmFyeSBzdG9yYWdlIGZvciBsaW5rIHVybFxuXG4gIHRoaXMubGFiZWxVbm1hdGNoZWRTY29wZXMgPSAwOyAvLyBUcmFjayB1bnBhaXJlZCBgW2AgZm9yIGxpbmsgbGFiZWxzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoYmFja3RyYWNrIG9wdGltaXphdGlvbilcbn1cblxuXG4vLyBGbHVzaCBwZW5kaW5nIHRleHRcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUucHVzaFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMudG9rZW5zLnB1c2goe1xuICAgIHR5cGU6ICd0ZXh0JyxcbiAgICBjb250ZW50OiB0aGlzLnBlbmRpbmcsXG4gICAgbGV2ZWw6IHRoaXMucGVuZGluZ0xldmVsXG4gIH0pO1xuICB0aGlzLnBlbmRpbmcgPSAnJztcbn07XG5cblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vIElmIHBlbmRpbmcgdGV4dCBleGlzdHMgLSBmbHVzaCBpdCBhcyB0ZXh0IHRva2VuXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgaWYgKHRoaXMucGVuZGluZykge1xuICAgIHRoaXMucHVzaFBlbmRpbmcoKTtcbiAgfVxuXG4gIHRoaXMudG9rZW5zLnB1c2godG9rZW4pO1xuICB0aGlzLnBlbmRpbmdMZXZlbCA9IHRoaXMubGV2ZWw7XG59O1xuXG5cbi8vIFN0b3JlIHZhbHVlIHRvIGNhY2hlLlxuLy8gISEhIEltcGxlbWVudGF0aW9uIGhhcyBwYXJzZXItc3BlY2lmaWMgb3B0aW1pemF0aW9uc1xuLy8gISEhIGtleXMgTVVTVCBiZSBpbnRlZ2VyLCA+PSAwOyB2YWx1ZXMgTVVTVCBiZSBpbnRlZ2VyLCA+IDBcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUuY2FjaGVTZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuY2FjaGUubGVuZ3RoOyBpIDw9IGtleTsgaSsrKSB7XG4gICAgdGhpcy5jYWNoZS5wdXNoKDApO1xuICB9XG5cbiAgdGhpcy5jYWNoZVtrZXldID0gdmFsO1xufTtcblxuXG4vLyBHZXQgY2FjaGUgdmFsdWVcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUuY2FjaGVHZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiBrZXkgPCB0aGlzLmNhY2hlLmxlbmd0aCA/IHRoaXMuY2FjaGVba2V5XSA6IDA7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVJbmxpbmU7XG4iLCIvLyBQcm9jZXNzIH5zdWJzY3JpcHR+XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gc2FtZSBhcyBVTkVTQ0FQRV9NRF9SRSBwbHVzIGEgc3BhY2VcbnZhciBVTkVTQ0FQRV9SRSA9IC9cXFxcKFsgXFxcXCFcIiMkJSYnKCkqKywuXFwvOjs8PT4/QFtcXF1eX2B7fH1+LV0pL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3ViKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGZvdW5kLFxuICAgICAgY29udGVudCxcbiAgICAgIG1heCA9IHN0YXRlLnBvc01heCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCkgIT09IDB4N0UvKiB+ICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc2lsZW50KSB7IHJldHVybiBmYWxzZTsgfSAvLyBkb24ndCBydW4gYW55IHBhaXJzIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc3RhcnQgKyAyID49IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLmxldmVsID49IHN0YXRlLm9wdGlvbnMubWF4TmVzdGluZykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBzdGF0ZS5wb3MgPSBzdGFydCArIDE7XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IG1heCkge1xuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpID09PSAweDdFLyogfiAqLykge1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgc3RhdGUucGFyc2VyLnNraXBUb2tlbihzdGF0ZSk7XG4gIH1cblxuICBpZiAoIWZvdW5kIHx8IHN0YXJ0ICsgMSA9PT0gc3RhdGUucG9zKSB7XG4gICAgc3RhdGUucG9zID0gc3RhcnQ7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29udGVudCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCArIDEsIHN0YXRlLnBvcyk7XG5cbiAgLy8gZG9uJ3QgYWxsb3cgdW5lc2NhcGVkIHNwYWNlcy9uZXdsaW5lcyBpbnNpZGVcbiAgaWYgKGNvbnRlbnQubWF0Y2goLyhefFteXFxcXF0pKFxcXFxcXFxcKSpcXHMvKSkge1xuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvdW5kIVxuICBzdGF0ZS5wb3NNYXggPSBzdGF0ZS5wb3M7XG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMTtcblxuICBpZiAoIXNpbGVudCkge1xuICAgIHN0YXRlLnB1c2goe1xuICAgICAgdHlwZTogJ3N1YicsXG4gICAgICBsZXZlbDogc3RhdGUubGV2ZWwsXG4gICAgICBjb250ZW50OiBjb250ZW50LnJlcGxhY2UoVU5FU0NBUEVfUkUsICckMScpXG4gICAgfSk7XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBzdGF0ZS5wb3NNYXggKyAxO1xuICBzdGF0ZS5wb3NNYXggPSBtYXg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgXnN1cGVyc2NyaXB0XlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIHNhbWUgYXMgVU5FU0NBUEVfTURfUkUgcGx1cyBhIHNwYWNlXG52YXIgVU5FU0NBUEVfUkUgPSAvXFxcXChbIFxcXFwhXCIjJCUmJygpKissLlxcLzo7PD0+P0BbXFxdXl9ge3x9fi1dKS9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN1cChzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBmb3VuZCxcbiAgICAgIGNvbnRlbnQsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXgsXG4gICAgICBzdGFydCA9IHN0YXRlLnBvcztcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpICE9PSAweDVFLyogXiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2U7IH0gLy8gZG9uJ3QgcnVuIGFueSBwYWlycyBpbiB2YWxpZGF0aW9uIG1vZGVcbiAgaWYgKHN0YXJ0ICsgMiA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChzdGF0ZS5sZXZlbCA+PSBzdGF0ZS5vcHRpb25zLm1heE5lc3RpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgc3RhdGUucG9zID0gc3RhcnQgKyAxO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBtYXgpIHtcbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKSA9PT0gMHg1RS8qIF4gKi8pIHtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHN0YXRlLnBhcnNlci5za2lwVG9rZW4oc3RhdGUpO1xuICB9XG5cbiAgaWYgKCFmb3VuZCB8fCBzdGFydCArIDEgPT09IHN0YXRlLnBvcykge1xuICAgIHN0YXRlLnBvcyA9IHN0YXJ0O1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQgKyAxLCBzdGF0ZS5wb3MpO1xuXG4gIC8vIGRvbid0IGFsbG93IHVuZXNjYXBlZCBzcGFjZXMvbmV3bGluZXMgaW5zaWRlXG4gIGlmIChjb250ZW50Lm1hdGNoKC8oXnxbXlxcXFxdKShcXFxcXFxcXCkqXFxzLykpIHtcbiAgICBzdGF0ZS5wb3MgPSBzdGFydDtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBmb3VuZCFcbiAgc3RhdGUucG9zTWF4ID0gc3RhdGUucG9zO1xuICBzdGF0ZS5wb3MgPSBzdGFydCArIDE7XG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wdXNoKHtcbiAgICAgIHR5cGU6ICdzdXAnLFxuICAgICAgbGV2ZWw6IHN0YXRlLmxldmVsLFxuICAgICAgY29udGVudDogY29udGVudC5yZXBsYWNlKFVORVNDQVBFX1JFLCAnJDEnKVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGUucG9zID0gc3RhdGUucG9zTWF4ICsgMTtcbiAgc3RhdGUucG9zTWF4ID0gbWF4O1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBTa2lwIHRleHQgY2hhcmFjdGVycyBmb3IgdGV4dCB0b2tlbiwgcGxhY2UgdGhvc2UgdG8gcGVuZGluZyBidWZmZXJcbi8vIGFuZCBpbmNyZW1lbnQgY3VycmVudCBwb3NcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbi8vIFJ1bGUgdG8gc2tpcCBwdXJlIHRleHRcbi8vICd7fSQlQH4rPTonIHJlc2VydmVkIGZvciBleHRlbnRpb25zXG5cbmZ1bmN0aW9uIGlzVGVybWluYXRvckNoYXIoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgwQS8qIFxcbiAqLzpcbiAgICBjYXNlIDB4NUMvKiBcXCAqLzpcbiAgICBjYXNlIDB4NjAvKiBgICovOlxuICAgIGNhc2UgMHgyQS8qICogKi86XG4gICAgY2FzZSAweDVGLyogXyAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4MjEvKiAhICovOlxuICAgIGNhc2UgMHgyNi8qICYgKi86XG4gICAgY2FzZSAweDNDLyogPCAqLzpcbiAgICBjYXNlIDB4M0UvKiA+ICovOlxuICAgIGNhc2UgMHg3Qi8qIHsgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDQwLyogQCAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDNELyogPSAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRleHQoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG9zID0gc3RhdGUucG9zO1xuXG4gIHdoaWxlIChwb3MgPCBzdGF0ZS5wb3NNYXggJiYgIWlzVGVybWluYXRvckNoYXIoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSkpIHtcbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChwb3MgPT09IHN0YXRlLnBvcykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShzdGF0ZS5wb3MsIHBvcyk7IH1cblxuICBzdGF0ZS5wb3MgPSBwb3M7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHtDb21tZW50Qm94LCBDb21tZW50TGlzdH0gZnJvbSAnLi9jb21tZW50X2JveCdcblxuUmVhY3RET00ucmVuZGVyKFxuICA8Q29tbWVudEJveCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKVxuKTsiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlbWFya2FibGUgZnJvbSAncmVtYXJrYWJsZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbW1lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5tZCA9IG5ldyBSZW1hcmthYmxlKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgIFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29tbWVudFwiPlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cImNvbW1lbnRBdXRob3JcIj5cbiAgICAgICAgICAgICAge3RoaXMucHJvcHMuYXV0aG9yfVxuICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICAgIHt0aGlzLm1kLnJlbmRlcih0aGlzLnByb3BzLmNoaWxkcmVuLnRvU3RyaW5nKCkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn07IiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBDb21tZW50IGZyb20gJy4vY29tbWVudCdcblxudmFyIENvbW1lbnRMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbW1lbnRMaXN0XCI+XG4gICAgICAgIDxDb21tZW50IGF1dGhvcj1cIlBldGUgSHVudFwiPlRoaXMgaXMgb25lIGNvbW1lbnQ8L0NvbW1lbnQ+XG4gICAgICAgIDxDb21tZW50IGF1dGhvcj1cIkpvcmRhbiBXYWxrZVwiPlRoaXMgaXMgKmFub3RoZXIqIGNvbW1lbnQ8L0NvbW1lbnQ+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59KTtcblxudmFyIENvbW1lbnRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbW1lbnRGb3JtXCI+XG4gICAgICAgIEhlbGxvLCB3b3JsZCEgSSBhbSBhIENvbW1lbnRGb3JtLlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSk7XG5cbnZhciBDb21tZW50Qm94ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbW1lbnRCb3hcIj5cbiAgICAgICAgPGgxPkNvbW1lbnRzPC9oMT5cbiAgICAgICAgPENvbW1lbnRMaXN0IC8+XG4gICAgICAgIDxDb21tZW50Rm9ybSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSk7XG5cbmV4cG9ydCB7Q29tbWVudExpc3QsIENvbW1lbnRGb3JtLCBDb21tZW50Qm94fSJdfQ==
