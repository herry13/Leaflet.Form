(function() {

L.Control.Form = L.Control.extend({
    includes: L.Mixin.Events,

    eventType: {
        show: 'form:show',
        submit: 'form:submit',
        hide: 'form:hide'
    },

    options: {
        id: '',
        url: '',
        method: 'GET',
        firstInput: '',
        regexp: undefined,
        successMessage: '',
        errorMessage: '',
        initData: undefined
    },

    get: function() {
        $('#' + this.options.id);
    },

    initialize: function (options) {
        L.Util.setOptions(this, options || {});
        var self = this;
        self.options.eid = '#' + self.options.id;
        self.options.data = {};
        self.listeners = {};
        // disable map click/drag event propagation
        L.DomEvent.disableClickPropagation(L.DomUtil.get(self.options.id));
        // resize window if width/height defined
        if (self.options.width) {
            $(self.options.eid).css('width', self.options.width + 'px');
        }
        if (self.options.height) {
            $(self.options.eid).css('height', self.options.height + 'px');
        }
        // close the popup when close button is clicked
        $(self.options.eid + ' > .btn-close-popup').click(function() {
            $(self.options.eid).hide();
            self._fireEvent(self.eventType.hide);
        });
        // do submit when submit button is clicked
        $(self.options.eid + ' > button.submit').click(function() {
            self.submit();
        });
        // centering the popup window
        $(window).resize(function() {
            $(self.options.eid).center();
        });
        $(self.options.eid).center();
        // implement regular expression validator for each input
        $(self.options.eid + ' > input').keyup(function(e) {
            $(e.target).removeClass();
            var val = ($(e.target).prop('type') == 'checkbox' ? $(e.target).is(':checked') : $(e.target).val());
            var name = $(e.target).attr('name');
            var regexp = (self.options.regexp ? self.options.regexp[name] : undefined);
            self.options.data[name] = val;  // save the value

            if ((typeof regexp === 'object' && regexp.test(val)) ||
                    (typeof regexp === 'function' && regexp.length >= 1 && regexp(val))) {
                if (val.length > 0) {
                    $(e.target).addClass('valid');
                }
            } else if (regexp) {
                $(e.target).addClass('invalid');
            }
        });
        // activate mutex when the popup is shown
        self.on(self.eventType.show, function() { self.options.mutex.active = self; });
        // deactivate mutex when the popup is hidden
        self.on(self.eventType.hide, function() { self.options.mutex.active = undefined; });
    },

    hide: function () {
        $(this.options.eid).hide();
        this._fireEvent(this.eventType.hide);
    },

    show: function () {
        if (this.options.mutex && this.options.mutex.active) {
            this.options.mutex.active.hide();
        }

        $('.splash').hide();

        $(this.options.eid + " > input").val("");
        $(this.options.eid + " > input[type=checkbox]").attr('checked', false);
        $(this.options.eid + " > input").removeClass();
        for (var name in this.options.initData) {
            $(this.options.eid + " > input[name='" + name + "']").val(this.options.initData[name]);
        }
        $(this.options.eid).show();
        if (this.options.firstInput) {
            $(this.options.eid + " > input[name='" + this.options.firstInput + "']").focus();
        }
        // invoke the listeners of event 'form:show
        this._fireEvent(this.eventType.show);
    },

    _fireEvent: function (type, data) {
        var self = this;
        if (this.listeners[type]) {
            this.listeners[type].forEach(function(callback) {
                if (callback.length == 0) {
                    callback();
                } else {
                    callback({
                        type: type,
                        target: self,
                        data: data
                    });
                }
            });
        }
    },

    submit: function () {
        var self = this,
            regexp,
            val;

        // populate & validate data
        $(self.options.eid + ' > input').keyup();
        for (var name in this.options.data) {
            if (!this.options.regexp) {
                break;
            }
            regexp = this.options.regexp[name];
            val = this.options.data[name];
            if ((typeof regexp === 'object' && !regexp.test(val)) ||
                    (typeof regexp === 'function' && regexp.length >= 1 && !regexp(val))) {
                return;
            }
        }

        if (!this.options.url || !this.options.method) {
            this._submissionSuccess();
            return;
        }

        $.ajax({
            url: this.options.url,
            type: this.options.method,
            data: this.options.data,
            success: function() {
                if (typeof self.options.success === 'function') {
                    if (self.options.success.length >= 1) {
                        self.options.success(self.options.data);
                    } else {
                        self.options.success();
                    }
                }
                self._submissionSuccess();
            }
        }).fail(function(res) {
            if (typeof self.options.fail === 'function') {
                if (self.options.fail.length >= 1) {
                    self.options.fail(res.responseJSON);
                } else {
                    self.options.fail();
                }
            } else {
                alert("Error.");
            }
        });
    },

    _submissionSuccess: function() {
        this._fireEvent(this.eventType.submit);
        $(this.options.eid).hide();
        this._fireEvent(this.eventType.hide);
    },

    on: function (eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        } else {
            this.listeners[eventType] = [callback];
        }
        return this;
    }
});

L.control.form = function (options) {
	return new L.Control.form(options);
};


}).call(this);
