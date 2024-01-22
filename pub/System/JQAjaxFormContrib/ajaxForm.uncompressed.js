/*
 * jQuery ajax form 2.30
 *
 * Copyright (c) 2020-2024 Michael Daum
 *
 * Licensed under the GPL licenses http://www.gnu.org/licenses/gpl.html
 *
 */
/*global StrikeOne:false */

"use strict";
(function($) {
  var defaults = {
    redirect: null,
    reload: false,
    block: true,
    message: "",
    beforeSerialize: function() {},
    beforeSubmit: function() { return true; },
    uploadProgress: function() {},
    error: function() {},
    success: function() {},
    complete: function() {},
  };

  // The actual plugin constructor
  function AjaxForm(elem, opts) {
    var self = this;

    self.elem = elem;

    self.opts = $.extend({}, defaults, self.elem.data(), opts);
    self.init();
  }

  AjaxForm.prototype.init = function () {
    var self = this,
        redirectElem = self.elem.find("input[name=redirect]"),
        keyElem = self.elem.find("input[name=validation_key]:first");

    if (typeof(self.opts.beforeSerialize) !== 'function') {
      self.opts.beforeSerialize = Function(self.opts.beforeSerialize);
    }
    if (typeof(self.opts.beforeSubmit) !== 'function') {
      self.opts.beforeSubmit = Function(self.opts.beforeSubmit);
    }
    if (typeof(self.opts.uploadProgress) !== 'function') {
      self.opts.uploadProgress = Function(self.opts.uploadProgress);
    }
    if (typeof(self.opts.error) !== 'function') {
      self.opts.error = Function(self.opts.error);
    }
    if (typeof(self.opts.success) !== 'function') {
      self.opts.success = Function(self.opts.success);
    }
    if (typeof(self.opts.complete) !== 'function') {
      self.opts.complete = Function(self.opts.complete);
    }


    self.elem.removeAttr('onsubmit');
    self.elem.ajaxForm({

      beforeSerialize: function() {
        self.opts.beforeSerialize(self);
        self.elem.trigger("beforeSerialize", self);

        if (typeof(StrikeOne) !== 'undefined') {
          StrikeOne.submit(self.elem[0]);
        }
      }, 
      
      beforeSubmit: function() {
        if (typeof(self.elem.data("validator")) !== 'undefined' && !self.elem.valid()) {
          return false;
        }
        if (self.opts.beforeSubmit(self)) {
          self.elem.trigger("beforeSubmit", self);
          self.block();
        } else {
          return false;
        }
      },

      uploadProgress: function(ev, pos, total, percent) {
        self.opts.uploadProgress(self);
        self.elem.trigger("uploadProgress", [percent, pos, total]);
      },
      
      error: function(xhr) {
        var message,
            response = xhr.responseJSON;

        self.unblock();
        self.opts.error(self, response);
        self.elem.trigger("error", [self, response]);

        if (typeof(response) === 'undefined' || typeof(response.error) === 'undefined') {
          message = "Sorry, an error occurred.";
        } else {
          message = response.error.message;
        }

        $.pnotify({
          type: "error",
          title: "Error",
          hide: 0,
          text: message
        });
      },

      success: function(response, text, xhr) {
        self.unblock();

        self.opts.success(self, response, xhr);
        self.elem.trigger("success", [self, response, xhr]);

        //console.log("response=",response);

        // 1. redirect in response
        if (typeof(response.result) !== 'undefined' && typeof(response.result.redirect) !== 'undefined') {
          window.location.href = response.result.redirect;
        } 

        // 2. redirect in form element
        else if (redirectElem.length && redirectElem.val() !== '') {
          window.location.href = redirectElem.val();
        }
        
        // 3. redirect in options
        else if (self.opts.redirect) {
          window.location.href = self.opts.redirect;
        } 
        
        // 4. reload page
        else if (self.opts.reload) {
          window.location.reload();
        }

        // 5. do nothing
      },

      complete: function(xhr) {
        var nonce = xhr.getResponseHeader('X-Foswiki-Validation');
        if (nonce) {
          keyElem.val("?" + nonce);
        }

        self.opts.complete(self, xhr);
        self.elem.trigger("complete", [self, xhr]);
      }
    });

    //console.log("inited ajax form",self.elem[0]);
  };

  AjaxForm.prototype.block = function () {
    var self = this;

    if (!self.opts.block) {
      return;
    }

    $.blockUI({ 
      message: self.opts.message ? '<h1>'+self.opts.message+"</h1>": ""
    });
  };

  AjaxForm.prototype.unblock = function () {
    var self = this;

    if (!self.opts.block) {
      return;
    }

    $.unblockUI();
  };

  // export 
  window.AjaxForm = AjaxForm;

  // widget instanziation
  $(function() {
    $(".jqAjaxForm").livequery(function() {
      var $this = $(this);
      if (!$this.data("ajaxForm")) {
        $this.data("ajaxForm", new AjaxForm($this));
      }
    });
  });

})(jQuery);
